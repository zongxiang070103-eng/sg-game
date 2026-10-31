/**
 * 3v3 回合制战斗引擎。
 *
 * 每回合，双方场上武将按有效速度从高到低依次行动；
 * 有人倒下后，编队中的后援按顺序顶上；一方编队全灭即分出胜负。
 * 所有数值都是确定性的，同一个 seed + 同一串操作 = 同一个结果。
 */
import { CONFIG } from './config';
import { GENERALS, SKILL_BY_ID } from './data';
import { shuffle, type Rng } from './rng';
import { STATUS_LABEL, isBuff, isDebuff } from './status';
import type {
  BattleState,
  EffectDef,
  GeneralDef,
  Side,
  SkillDef,
  StatKey,
  Status,
  StatusKind,
  TargetKind,
  Unit,
  WhenCond,
} from './types';

export type Action =
  | { type: 'attack'; actorId: string; targetId: string }
  | { type: 'skill'; actorId: string; skillId: string; targetId?: string }
  | { type: 'defend'; actorId: string };

const STAT_LABEL: Record<StatKey, string> = { atk: '攻', def: '防', int: '智', spd: '速' };

/* ---------------- 查询 ---------------- */

export function unitById(state: BattleState, id: string): Unit {
  const u = state.units.find((x) => x.id === id);
  if (!u) throw new Error(`找不到武将 ${id}`);
  return u;
}

export function onField(state: BattleState, unit: Unit): boolean {
  return state.field[unit.side].includes(unit.id);
}

export function fieldUnitsOf(state: BattleState, side: Side): Unit[] {
  return state.field[side]
    .filter((id): id is string => Boolean(id))
    .map((id) => unitById(state, id));
}

export function livingUnits(state: BattleState, side: Side): Unit[] {
  return state.units.filter((u) => u.side === side && u.alive);
}

export function effectiveStat(unit: Unit, key: StatKey): number {
  let pct = 0;
  for (const st of unit.statuses) {
    if ((st.kind === 'buff' || st.kind === 'debuff') && st.stat === key) {
      pct += st.kind === 'buff' ? (st.pct ?? 0) : -(st.pct ?? 0);
    }
  }
  return Math.max(1, Math.round(unit.base[key] * (1 + pct)));
}

export function skillReady(unit: Unit, skillId: string): boolean {
  const own = unit.skills.find((x) => x.id === skillId);
  return Boolean(own) && own!.cdLeft === 0;
}

export function unitScore(unit: Unit): number {
  return (
    unit.base.atk * 1.4 +
    unit.base.def +
    unit.base.int * 0.8 +
    unit.base.spd +
    unit.maxHp * 0.12
  );
}

/* ---------------- 状态查询 ---------------- */

export function hasStatus(unit: Unit, kind: StatusKind): boolean {
  return unit.statuses.some((st) => st.kind === kind);
}

/** 同名状态的百分比之和（易伤、虚弱、吸血、反击……）。 */
export function statusPct(unit: Unit, kind: StatusKind): number {
  return unit.statuses.reduce((sum, st) => (st.kind === kind ? sum + (st.pct ?? 0) : sum), 0);
}

/** 被沉默：不能施展技能。 */
export function isSilenced(unit: Unit): boolean {
  return hasStatus(unit, 'silence');
}

/** 被缴械：不能普攻。 */
export function isDisarmed(unit: Unit): boolean {
  return hasStatus(unit, 'disarm');
}

/** 当前必须攻击的嘲讽者；嘲讽者已倒下或离场则失效。 */
export function tauntSource(state: BattleState, unit: Unit): Unit | null {
  for (const st of unit.statuses) {
    if (st.kind !== 'taunt' || !st.sourceId) continue;
    const src = state.units.find((u) => u.id === st.sourceId);
    if (src && src.alive && onField(state, src)) return src;
  }
  return null;
}

/* ---------------- 伤害 ---------------- */

export function physicalDamage(actor: Unit, target: Unit, ratio: number, pierce = 0): number {
  const raw = effectiveStat(actor, 'atk') * ratio;
  const reduce = effectiveStat(target, 'def') * 0.4 * (1 - pierce);
  return Math.max(1, Math.round(raw - reduce));
}

export function magicDamage(actor: Unit, target: Unit, ratio: number): number {
  const raw = effectiveStat(actor, 'int') * ratio;
  const resist = effectiveStat(target, 'int') * 0.3;
  return Math.max(1, Math.round(raw - resist));
}

/** 叠加「虚弱」（造成伤害降低）与「易伤」（受到伤害提升）。 */
export function adjustDamage(actor: Unit, target: Unit, raw: number): number {
  const dealt = Math.max(0.1, 1 - statusPct(actor, 'weaken'));
  const taken = 1 + statusPct(target, 'vulnerable');
  return Math.max(1, Math.round(raw * dealt * taken));
}

/**
 * 返回实际掉的血量；护盾先挡。
 * 传入 source 时结算「荆棘」反弹，反弹本身不再触发新的反弹。
 */
function dealDamage(
  state: BattleState,
  target: Unit,
  amount: number,
  describe: (hpLoss: number, shieldLoss: number) => string,
  source?: Unit,
): number {
  if (!target.alive || amount <= 0) return 0;
  let left = amount;
  let absorbed = 0;
  for (const st of target.statuses) {
    if (st.kind !== 'shield' || !st.amount) continue;
    const used = Math.min(st.amount, left);
    st.amount -= used;
    left -= used;
    absorbed += used;
    if (left <= 0) break;
  }
  target.statuses = target.statuses.filter((st) => !(st.kind === 'shield' && (st.amount ?? 0) <= 0));

  const hpLoss = Math.min(target.hp, left);
  target.hp -= hpLoss;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }
  state.log.push({ round: state.round, kind: 'action', text: describe(hpLoss, absorbed) });

  if (hpLoss > 0 && source && source.alive && source !== target) {
    const thorns = statusPct(target, 'thorns');
    if (thorns > 0) {
      const reflect = Math.max(1, Math.round(hpLoss * thorns));
      source.hp = Math.max(0, source.hp - reflect);
      if (source.hp === 0) source.alive = false;
      state.log.push({
        round: state.round,
        kind: 'status',
        text: `${target.name} 的荆棘反弹 ${reflect} 点伤害给 ${source.name}。`,
      });
    }
  }
  return hpLoss;
}

function healUnit(state: BattleState, unit: Unit, amount: number): void {
  if (!unit.alive || amount <= 0) return;
  const block = statusPct(unit, 'healBlock');
  const real = Math.round(amount * Math.max(0, 1 - block));
  if (real <= 0) return;
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + real);
  const gained = unit.hp - before;
  if (gained > 0) {
    state.log.push({ round: state.round, kind: 'status', text: `${unit.name} 回复 ${gained} 点生命。` });
  }
}

function addStatus(state: BattleState, target: Unit, status: Status, note?: string): void {
  target.statuses.push(status);
  if (note) state.log.push({ round: state.round, kind: 'status', text: note });
}

/* ---------------- 条件与目标 ---------------- */

export function condMet(
  state: BattleState,
  actor: Unit,
  target: Unit,
  when: WhenCond,
): boolean {
  if (when.targetHpBelow !== undefined && target.hp / target.maxHp >= when.targetHpBelow) return false;
  if (when.selfHpBelow !== undefined && actor.hp / actor.maxHp >= when.selfHpBelow) return false;
  if (when.targetHas && !target.statuses.some((st) => st.kind === when.targetHas)) return false;
  if (when.fasterThanTarget && effectiveStat(actor, 'spd') <= effectiveStat(target, 'spd')) return false;
  if (
    when.allyFieldAtMost !== undefined &&
    fieldUnitsOf(state, actor.side).length > when.allyFieldAtMost
  ) {
    return false;
  }
  return true;
}

function lowestHp(units: Unit[]): Unit[] {
  if (units.length === 0) return [];
  return [
    units.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)),
  ];
}

function strongest(units: Unit[]): Unit[] {
  if (units.length === 0) return [];
  return [units.reduce((a, b) => (effectiveStat(b, 'atk') > effectiveStat(a, 'atk') ? b : a))];
}

export function resolveTargets(
  state: BattleState,
  actor: Unit,
  kind: TargetKind,
  manualId?: string,
): Unit[] {
  const foes = fieldUnitsOf(state, actor.side === 'player' ? 'enemy' : 'player').filter(
    (u) => u.alive,
  );
  const allies = fieldUnitsOf(state, actor.side).filter((u) => u.alive);
  switch (kind) {
    case 'enemy': {
      if (!manualId) return [];
      const t = unitById(state, manualId);
      if (t.side === actor.side || !t.alive || !onField(state, t)) throw new Error('目标无效');
      return [t];
    }
    case 'lowestEnemy':
      return lowestHp(foes);
    case 'strongestEnemy':
      return strongest(foes);
    case 'allEnemies':
      return [...foes];
    case 'self':
      return [actor];
    case 'lowestAlly':
      return lowestHp(allies);
    case 'allAllies':
      return [...allies];
  }
}

/* ---------------- 技能结算 ---------------- */

function applySkill(state: BattleState, actor: Unit, def: SkillDef, manualId?: string): void {
  state.log.push({ round: state.round, kind: 'action', text: `${actor.name} 施展「${def.name}」。` });

  for (const eff of def.effects) {
    if (state.outcome || !actor.alive) return;
    const kind = eff.target ?? def.target;

    let targets: Unit[];
    if (kind === 'enemy') {
      // 单体目标可能在连锁效果中已经倒下，此时跳过这一条效果。
      const t = manualId ? state.units.find((u) => u.id === manualId) : undefined;
      targets = t && t.alive && onField(state, t) && t.side !== actor.side ? [t] : [];
    } else {
      targets = resolveTargets(state, actor, kind);
    }

    for (const t of targets) {
      if (state.outcome || !actor.alive) return;
      applyEffect(state, actor, t, eff);
    }
  }
}

const CONTROL_LOG: Record<'stun' | 'silence' | 'disarm' | 'taunt', (name: string, turns: number) => string> = {
  stun: (name, turns) => `${name} 被震慑（${turns} 回合）。`,
  silence: (name, turns) => `${name} 被沉默，无法施展技能（${turns} 回合）。`,
  disarm: (name, turns) => `${name} 被缴械，无法普攻（${turns} 回合）。`,
  taunt: (name, turns) => `${name} 被嘲讽，只能攻击嘲讽者（${turns} 回合）。`,
};

function applyEffect(state: BattleState, actor: Unit, target: Unit, eff: EffectDef): void {
  if (!target.alive) return;
  switch (eff.type) {
    case 'damage': {
      if (!target.alive) return;
      let ratio = eff.ratio;
      if (eff.bonus && condMet(state, actor, target, eff.bonus.when)) {
        ratio += eff.bonus.ratio;
        state.log.push({
          round: state.round,
          kind: 'status',
          text: `${actor.name} 的「${eff.bonus.desc}」触发！`,
        });
      }
      let dealt = 0;
      const hits = eff.hits ?? 1;
      for (let i = 0; i < hits; i++) {
        if (!target.alive) break;
        const raw =
          eff.scale === 'int'
            ? magicDamage(actor, target, ratio)
            : physicalDamage(actor, target, ratio, eff.pierce ?? 0);
        dealt += dealDamage(
          state,
          target,
          adjustDamage(actor, target, raw),
          (hpLoss, shieldLoss) =>
            hpLoss === 0 && shieldLoss > 0
              ? `${target.name} 的护盾挡下了 ${shieldLoss} 点伤害。`
              : `${actor.name} 对 ${target.name} 造成 ${hpLoss} 点伤害${
                  shieldLoss > 0 ? `（护盾抵消 ${shieldLoss}）` : ''
                }`,
          actor,
        );
      }
      if (dealt > 0) {
        if (eff.drain) healUnit(state, actor, Math.round(dealt * eff.drain));
        const lifesteal = statusPct(actor, 'lifesteal');
        if (lifesteal > 0 && actor.alive) {
          healUnit(state, actor, Math.round(dealt * lifesteal));
        }
      }
      return;
    }
    case 'heal': {
      const amount =
        eff.scale === 'maxHp'
          ? Math.round(actor.maxHp * eff.ratio)
          : Math.round(effectiveStat(actor, eff.scale) * eff.ratio);
      healUnit(state, target, amount);
      return;
    }
    case 'buff':
    case 'debuff': {
      const dir = eff.type === 'buff' ? '↑' : '↓';
      addStatus(
        state,
        target,
        {
          kind: eff.type,
          stat: eff.stat,
          pct: eff.pct,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: `${STAT_LABEL[eff.stat]}${dir}`,
        },
        `${target.name} 的${STAT_LABEL[eff.stat]}${eff.type === 'buff' ? '提升' : '降低'} ${Math.round(
          eff.pct * 100,
        )}%（${eff.turns} 回合）。`,
      );
      return;
    }
    case 'shield': {
      const amount =
        eff.scale === 'maxHp'
          ? Math.round(target.maxHp * eff.ratio)
          : Math.round(effectiveStat(actor, 'int') * eff.ratio);
      addStatus(
        state,
        target,
        {
          kind: 'shield',
          amount,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: '护盾',
        },
        `${target.name} 获得 ${amount} 点护盾（${eff.turns} 回合）。`,
      );
      return;
    }
    case 'burn': {
      const amount = Math.round(effectiveStat(actor, 'int') * eff.ratio);
      addStatus(
        state,
        target,
        {
          kind: 'burn',
          amount,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: STATUS_LABEL.burn,
        },
        `${target.name} 陷入灼烧，每回合损失 ${amount} 点生命（${eff.turns} 回合）。`,
      );
      return;
    }
    case 'poison': {
      const amount = Math.max(1, Math.round(target.maxHp * eff.pctMaxHp));
      addStatus(
        state,
        target,
        {
          kind: 'poison',
          amount,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: STATUS_LABEL.poison,
        },
        `${target.name} 中毒，每回合损失 ${amount} 点生命（${eff.turns} 回合）。`,
      );
      return;
    }
    case 'regen': {
      const amount = Math.max(1, Math.round(target.maxHp * eff.pctMaxHp));
      addStatus(
        state,
        target,
        {
          kind: 'regen',
          amount,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: STATUS_LABEL.regen,
        },
        `${target.name} 获得回春，每回合回复 ${amount} 点生命（${eff.turns} 回合）。`,
      );
      return;
    }
    case 'stun':
    case 'silence':
    case 'disarm':
    case 'taunt': {
      addStatus(
        state,
        target,
        {
          kind: eff.type,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: STATUS_LABEL[eff.type],
          sourceId: eff.type === 'taunt' ? actor.id : undefined,
        },
        CONTROL_LOG[eff.type](target.name, eff.turns),
      );
      return;
    }
    case 'vulnerable':
    case 'weaken':
    case 'healBlock':
    case 'lifesteal':
    case 'counter':
    case 'thorns': {
      const pct = Math.round(eff.pct * 100);
      const note: Record<typeof eff.type, string> = {
        vulnerable: `${target.name} 变得易伤：受到伤害 +${pct}%（${eff.turns} 回合）。`,
        weaken: `${target.name} 陷入虚弱：造成伤害 -${pct}%（${eff.turns} 回合）。`,
        healBlock: `${target.name} 受到禁疗：治疗量 -${pct}%（${eff.turns} 回合）。`,
        lifesteal: `${target.name} 获得吸血：伤害的 ${pct}% 回复自身（${eff.turns} 回合）。`,
        counter: `${target.name} 进入反击姿态：受到普攻时以 ${pct}% 攻击还击（${eff.turns} 回合）。`,
        thorns: `${target.name} 获得荆棘：反弹所受伤害的 ${pct}%（${eff.turns} 回合）。`,
      };
      addStatus(
        state,
        target,
        {
          kind: eff.type,
          pct: eff.pct,
          turns: eff.turns,
          appliedAt: state.actionSeq,
          label: STATUS_LABEL[eff.type],
        },
        note[eff.type],
      );
      return;
    }
    case 'cleanse': {
      const before = target.statuses.length;
      target.statuses = target.statuses.filter((st) => !isDebuff(st));
      const removed = before - target.statuses.length;
      if (removed > 0) {
        state.log.push({
          round: state.round,
          kind: 'status',
          text: `${target.name} 解除了 ${removed} 个负面状态。`,
        });
      }
      return;
    }
    case 'dispel': {
      const before = target.statuses.length;
      target.statuses = target.statuses.filter((st) => !isBuff(st));
      const removed = before - target.statuses.length;
      if (removed > 0) {
        state.log.push({
          round: state.round,
          kind: 'status',
          text: `${target.name} 被驱散了 ${removed} 个增益状态。`,
        });
      }
      return;
    }
  }
}

/* ---------------- 回合与行动 ---------------- */

/** 剩余兵力：存活单位的剩余生命占全队生命上限的比例。 */
function remainingRatio(state: BattleState, side: Side): number {
  const all = state.units.filter((u) => u.side === side);
  const maxHp = all.reduce((sum, u) => sum + u.maxHp, 0);
  const hp = all.filter((u) => u.alive).reduce((sum, u) => sum + u.hp, 0);
  return maxHp > 0 ? hp / maxHp : 0;
}

/** 打满回合仍未分胜负：按剩余兵力判定，兵力相同则守方（我方）算胜。 */
function judgeByRemaining(state: BattleState): void {
  const ours = remainingRatio(state, 'player');
  const theirs = remainingRatio(state, 'enemy');
  const oursAlive = livingUnits(state, 'player').length;
  const theirsAlive = livingUnits(state, 'enemy').length;

  state.log.push({
    round: state.round,
    kind: 'system',
    text: `鏖战 ${CONFIG.maxRounds} 回合未分胜负，鸣金收兵。我军剩余兵力 ${Math.round(
      ours * 100,
    )}%，敌军 ${Math.round(theirs * 100)}%。`,
  });

  const victory =
    ours > theirs || (ours === theirs && (oursAlive > theirsAlive || oursAlive === theirsAlive));
  finish(state, victory ? 'victory' : 'defeat');
}

function startRound(state: BattleState): void {
  if (state.round >= CONFIG.maxRounds) {
    judgeByRemaining(state);
    return;
  }
  state.round += 1;
  state.log.push({ round: state.round, kind: 'round', text: `—— 第 ${state.round} 回合 ——` });

  const units = [...fieldUnitsOf(state, 'player'), ...fieldUnitsOf(state, 'enemy')];
  units.sort((a, b) => {
    const diff = effectiveStat(b, 'spd') - effectiveStat(a, 'spd');
    if (diff !== 0) return diff;
    if (a.side !== b.side) return a.side === 'player' ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  state.queue = units.map((u) => u.id);
}

/**
 * 行动开始：持续伤害先结算，再回春，最后减冷却。
 * 状态的持续回合数在持有者回合结束时统一扣减，因此「2 回合」= 跳两次。
 */
function beginTurn(state: BattleState, unit: Unit): void {
  for (const st of [...unit.statuses]) {
    if (st.kind !== 'burn' && st.kind !== 'poison') continue;
    const dmg = st.amount ?? 0;
    if (dmg <= 0) continue;
    unit.hp = Math.max(0, unit.hp - dmg);
    state.log.push({
      round: state.round,
      kind: 'status',
      text: `${unit.name} 受${st.kind === 'burn' ? '灼烧' : '中毒'}，损失 ${dmg} 点生命。`,
    });
    if (unit.hp <= 0) {
      unit.alive = false;
      resolveDeaths(state);
      return;
    }
  }

  for (const st of [...unit.statuses]) {
    if (st.kind !== 'regen') continue;
    healUnit(state, unit, st.amount ?? 0);
  }

  for (const sk of unit.skills) sk.cdLeft = Math.max(0, sk.cdLeft - 1);
}

function endTurn(state: BattleState, unit: Unit, skipFresh = true): void {
  if (!unit.alive) return;
  unit.statuses = unit.statuses.filter((st) => {
    // 本回合刚上的状态（含自己刚开的增益）不在当回合掉时长。
    if (skipFresh && st.appliedAt === state.actionSeq) return true;
    st.turns -= 1;
    return st.turns > 0;
  });
}

function resolveDeaths(state: BattleState): void {
  for (const unit of state.units) {
    if (unit.alive) continue;
    const idx = state.field[unit.side].indexOf(unit.id);
    if (idx < 0) continue;

    state.field[unit.side][idx] = null;
    state.log.push({ round: state.round, kind: 'death', text: `${unit.name} 力竭倒下。` });
    unit.statuses = [];

    // 嘲讽者倒下后，针对他的嘲讽立刻失效。
    for (const other of state.units) {
      other.statuses = other.statuses.filter(
        (st) => !(st.kind === 'taunt' && st.sourceId === unit.id),
      );
    }

    const nextId = state.bench[unit.side].shift();
    if (nextId) {
      state.field[unit.side][idx] = nextId;
      state.log.push({
        round: state.round,
        kind: 'system',
        text: `${unitById(state, nextId).name} 接替上阵。`,
      });
    }
  }

  if (livingUnits(state, 'enemy').length === 0) finish(state, 'victory');
  else if (livingUnits(state, 'player').length === 0) finish(state, 'defeat');
}

function finish(state: BattleState, outcome: 'victory' | 'defeat'): void {
  if (state.outcome) return;
  state.outcome = outcome;
  state.phase = 'over';
  state.activeId = null;
  state.queue = [];
  state.log.push({
    round: state.round,
    kind: 'system',
    text: outcome === 'victory' ? '敌军尽数退去，我军大捷！' : '我军全军覆没，此战败北。',
  });
}

function advance(state: BattleState): void {
  for (let guard = 0; guard < 2000; guard++) {
    if (state.outcome) return;
    if (state.queue.length === 0) {
      startRound(state);
      continue;
    }
    const id = state.queue.shift()!;
    const unit = unitById(state, id);
    if (!unit.alive || !onField(state, unit)) continue;

    beginTurn(state, unit);
    if (state.outcome) return;
    if (!unit.alive) continue;

    const stun = unit.statuses.find((st) => st.kind === 'stun');
    if (stun) {
      stun.turns -= 1;
      state.log.push({
        round: state.round,
        kind: 'status',
        text: `${unit.name} 被震慑，本回合无法行动。`,
      });
      if (stun.turns <= 0) unit.statuses = unit.statuses.filter((st) => st !== stun);
      endTurn(state, unit, false);
      continue;
    }

    state.activeId = unit.id;
    return;
  }
  throw new Error('战斗无法推进，可能存在回合死循环');
}

/* ---------------- 对外接口 ---------------- */

function makeUnit(side: Side, index: number, def: GeneralDef): Unit {
  return {
    id: `${side === 'player' ? 'P' : 'E'}${index}`,
    side,
    generalId: def.id,
    name: def.name,
    title: def.title,
    faction: def.faction,
    hp: def.hp,
    maxHp: def.hp,
    base: { atk: def.atk, def: def.def, int: def.int, spd: def.spd },
    skills: def.skills.map((id) => ({ id, cdLeft: 0 })),
    statuses: [],
    alive: true,
  };
}

export function createBattle(seed: number): BattleState {
  const rng: Rng = { state: seed >>> 0 };
  const all = shuffle(rng, GENERALS);
  const player = all.slice(0, CONFIG.rosterSize);
  const enemy = all.slice(CONFIG.rosterSize, CONFIG.rosterSize * 2);

  const state: BattleState = {
    seed,
    rngState: rng.state,
    phase: 'deploy',
    outcome: null,
    round: 0,
    actionSeq: 0,
    units: [],
    field: {
      player: Array<string | null>(CONFIG.fieldSize).fill(null),
      enemy: Array<string | null>(CONFIG.fieldSize).fill(null),
    },
    bench: { player: [], enemy: [] },
    queue: [],
    activeId: null,
    log: [
      {
        round: 0,
        kind: 'system',
        text: `双方二十员将领列阵，你需从编队中选出 ${CONFIG.fieldSize} 人首发。`,
      },
    ],
  };

  state.units = [
    ...player.map((g, i) => makeUnit('player', i, g)),
    ...enemy.map((g, i) => makeUnit('enemy', i, g)),
  ];
  state.bench.player = player.map((_, i) => `P${i}`);
  state.bench.enemy = enemy.map((_, i) => `E${i}`);
  return state;
}

export function deploy(state: BattleState, starterIds: string[]): BattleState {
  if (state.phase !== 'deploy') throw new Error('当前不是布阵阶段');
  if (starterIds.length !== CONFIG.fieldSize) {
    throw new Error(`首发必须正好 ${CONFIG.fieldSize} 人`);
  }
  if (new Set(starterIds).size !== starterIds.length) throw new Error('不能重复上同一名武将');
  for (const id of starterIds) {
    if (!state.bench.player.includes(id)) throw new Error('该武将不在你的编队中');
  }

  const s = structuredClone(state);
  starterIds.forEach((id, i) => {
    s.field.player[i] = id;
  });
  s.bench.player = s.bench.player.filter((id) => !starterIds.includes(id));

  const enemyStarters = [...s.bench.enemy]
    .sort((a, b) => unitScore(unitById(s, b)) - unitScore(unitById(s, a)))
    .slice(0, CONFIG.fieldSize);
  enemyStarters.forEach((id, i) => {
    s.field.enemy[i] = id;
  });
  s.bench.enemy = s.bench.enemy.filter((id) => !enemyStarters.includes(id));

  s.log.push({
    round: 0,
    kind: 'system',
    text: `敌军首发：${enemyStarters.map((id) => unitById(s, id).name).join('、')}。`,
  });

  s.phase = 'battle';
  advance(s);
  return s;
}

function tryCounter(state: BattleState, defender: Unit, attacker: Unit): void {
  const pct = statusPct(defender, 'counter');
  if (pct <= 0 || !defender.alive || !attacker.alive) return;
  const dmg = adjustDamage(defender, attacker, physicalDamage(defender, attacker, pct));
  state.log.push({
    round: state.round,
    kind: 'action',
    text: `${defender.name} 挥刃反击 ${attacker.name}。`,
  });
  dealDamage(
    state,
    attacker,
    dmg,
    (hpLoss, shieldLoss) =>
      hpLoss === 0 && shieldLoss > 0
        ? `${attacker.name} 的护盾挡下了 ${shieldLoss} 点反击伤害。`
        : `${attacker.name} 受到 ${hpLoss} 点反击伤害${
            shieldLoss > 0 ? `（护盾抵消 ${shieldLoss}）` : ''
          }`,
  );
}

export function takeAction(state: BattleState, action: Action): BattleState {
  if (state.phase !== 'battle') throw new Error('战斗已经结束');
  if (!state.activeId || state.activeId !== action.actorId) {
    throw new Error('还没轮到该武将行动');
  }

  const s = structuredClone(state);
  const actor = unitById(s, action.actorId);
  if (!actor.alive) throw new Error('该武将已经倒下');

  const taunter = tauntSource(s, actor);
  if (action.type === 'attack' && isDisarmed(actor)) {
    throw new Error(`${actor.name} 处于缴械，无法普攻`);
  }
  if (action.type === 'skill' && isSilenced(actor)) {
    throw new Error(`${actor.name} 处于沉默，无法施展技能`);
  }

  s.actionSeq += 1;
  s.activeId = null;

  if (action.type === 'attack') {
    const target = unitById(s, action.targetId);
    if (!target.alive || target.side === actor.side || !onField(s, target)) {
      throw new Error('目标无效');
    }
    if (taunter && taunter.id !== target.id) {
      throw new Error(`受 ${taunter.name} 嘲讽，只能攻击他`);
    }
    s.log.push({ round: s.round, kind: 'action', text: `${actor.name} 挥兵直取 ${target.name}。` });
    const dealt = dealDamage(
      s,
      target,
      adjustDamage(actor, target, physicalDamage(actor, target, 1)),
      (hpLoss, shieldLoss) =>
        hpLoss === 0 && shieldLoss > 0
          ? `${target.name} 的护盾挡下了 ${shieldLoss} 点伤害。`
          : `${target.name} 受到 ${hpLoss} 点伤害${
              shieldLoss > 0 ? `（护盾抵消 ${shieldLoss}）` : ''
            }`,
      actor,
    );
    const lifesteal = statusPct(actor, 'lifesteal');
    if (dealt > 0 && lifesteal > 0) healUnit(s, actor, Math.round(dealt * lifesteal));
    if (target.alive) tryCounter(s, target, actor);
  } else if (action.type === 'defend') {
    addStatus(
      s,
      actor,
      {
        kind: 'buff',
        stat: 'def',
        pct: 0.5,
        turns: 1,
        appliedAt: s.actionSeq,
        label: '防↑',
      },
      `${actor.name} 结阵自守，防御提升 50%。`,
    );
  } else {
    const def = SKILL_BY_ID[action.skillId];
    if (!def) throw new Error('没有这个技能');
    const own = actor.skills.find((x) => x.id === def.id);
    if (!own) throw new Error(`${actor.name} 不会「${def.name}」`);
    if (own.cdLeft > 0) throw new Error(`「${def.name}」还需冷却 ${own.cdLeft} 回合`);
    if (def.target === 'enemy') {
      if (!action.targetId) throw new Error('该技能需要选择目标');
      if (taunter && taunter.id !== action.targetId) {
        throw new Error(`受 ${taunter.name} 嘲讽，只能攻击他`);
      }
      resolveTargets(s, actor, 'enemy', action.targetId);
    }
    own.cdLeft = def.cd;
    applySkill(s, actor, def, action.targetId);
  }

  resolveDeaths(s);
  if (!s.outcome) endTurn(s, actor);
  if (!s.outcome) advance(s);
  return s;
}
