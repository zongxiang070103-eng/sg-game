import { describe, expect, it } from 'vitest';
import { autoAction } from '../src/core/ai';
import {
  adjustDamage,
  createBattle,
  deploy,
  effectiveStat,
  fieldUnitsOf,
  physicalDamage,
  takeAction,
  unitById,
  unitScore,
} from '../src/core/battle';
import { CONFIG } from '../src/core/config';
import { SKILL_BY_ID } from '../src/core/data';
import type { BattleState, Status, StatusKind, Unit } from '../src/core/types';

function starters(s: BattleState): string[] {
  return [...s.bench.player]
    .sort((a, b) => unitScore(unitById(s, b)) - unitScore(unitById(s, a)))
    .slice(0, CONFIG.fieldSize);
}

/** 把双方各一名武将放到场上，其余进后援，方便做定点测试。 */
function duel(seed = 42): BattleState {
  const s = createBattle(seed);
  // 定点测试不依赖随机编队带来的天赋，需要时用 giveTalent 显式挂上。
  for (const u of s.units) u.talents = [];
  const player = s.units.filter((u) => u.side === 'player');
  const enemy = s.units.filter((u) => u.side === 'enemy');
  const hero = player[0];
  const foe = enemy[0];

  s.phase = 'battle';
  s.round = 0;
  s.field = { player: [hero.id, null, null], enemy: [foe.id, null, null] };
  s.bench = {
    player: player.slice(1).map((u) => u.id),
    enemy: enemy.slice(1).map((u) => u.id),
  };
  s.activeId = hero.id;
  s.queue = [];
  return s;
}

function play(seed: number): BattleState {
  let s = createBattle(seed);
  s = deploy(s, starters(s));
  let guard = 0;
  while (s.phase === 'battle' && guard++ < 800) {
    s = takeAction(s, autoAction(s));
  }
  return s;
}

/** 临时把武将的技能换成指定技能，方便定点测试。 */
function giveSkill(unit: Unit, skillId: string): void {
  unit.skills = [{ id: skillId, cdLeft: 0 }];
}

/** 临时给武将挂上指定天赋。 */
function giveTalent(unit: Unit, talentId: string): void {
  unit.talents = [{ id: talentId, cdLeft: 0, uses: 0, fired: false }];
}

function giveStatus(unit: Unit, kind: StatusKind, extra: Partial<Status> = {}): void {
  unit.statuses.push({ kind, label: kind, turns: 2, appliedAt: 0, ...extra });
}

/** 两名敌人在场的局面（测嘲讽等多目标规则）。 */
function twoFoes(seed = 21): BattleState {
  const s = duel(seed);
  const second = s.bench.enemy[0];
  s.field.enemy[1] = second;
  s.bench.enemy = s.bench.enemy.slice(1);
  return s;
}

function defendActive(s: BattleState): BattleState {
  return takeAction(s, { type: 'defend', actorId: s.activeId! });
}

describe('战棋战斗核心', () => {
  it('开局二十员将领，双方各十人', () => {
    const s = createBattle(7);
    expect(s.phase).toBe('deploy');
    expect(s.units).toHaveLength(CONFIG.rosterSize * 2);
    expect(s.bench.player).toHaveLength(CONFIG.rosterSize);
    expect(s.bench.enemy).toHaveLength(CONFIG.rosterSize);
    expect(s.field.player.every((id) => id === null)).toBe(true);
  });

  it('布阵后双方各三人上场，其余待命', () => {
    const s = createBattle(7);
    const after = deploy(s, starters(s));

    expect(after.phase).toBe('battle');
    expect(fieldUnitsOf(after, 'player')).toHaveLength(CONFIG.fieldSize);
    expect(fieldUnitsOf(after, 'enemy')).toHaveLength(CONFIG.fieldSize);
    expect(after.bench.player).toHaveLength(CONFIG.rosterSize - CONFIG.fieldSize);
    expect(after.bench.enemy).toHaveLength(CONFIG.rosterSize - CONFIG.fieldSize);
    expect(after.activeId).not.toBeNull();
  });

  it('先手由有效速度决定', () => {
    const base = createBattle(11);
    const s = deploy(base, starters(base));
    const active = unitById(s, s.activeId!);
    const fastest = Math.max(
      ...[...fieldUnitsOf(s, 'player'), ...fieldUnitsOf(s, 'enemy')].map((u) =>
        effectiveStat(u, 'spd'),
      ),
    );
    expect(effectiveStat(active, 'spd')).toBe(fastest);
  });

  it('同 seed 与同一串操作得到同一结果', () => {
    const a = play(5);
    const b = play(5);
    expect(a.outcome).toBe(b.outcome);
    expect(a.round).toBe(b.round);
    expect(a.units.map((u) => u.hp)).toEqual(b.units.map((u) => u.hp));
  });

  it('普攻伤害与公式一致', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    const expected = physicalDamage(hero, foe, 1);
    const before = foe.hp;

    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });
    expect(unitById(after, foe.id).hp).toBe(Math.max(0, before - expected));
  });

  it('技能进入冷却，未冷却时不能再用', () => {
    let s = duel(3);
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    const own = hero.skills[0];
    const def = SKILL_BY_ID[own.id];

    s = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: own.id,
      targetId: def.target === 'enemy' ? foe.id : undefined,
    });

    const cdLeft = unitById(s, hero.id).skills.find((x) => x.id === own.id)!.cdLeft;
    expect(cdLeft).toBeGreaterThan(0);
    expect(cdLeft).toBeLessThanOrEqual(def.cd);

    // 把行动权还给英雄，冷却未好时再施放应当报错
    const again: BattleState = { ...s, activeId: hero.id };
    expect(() =>
      takeAction(again, {
        type: 'skill',
        actorId: hero.id,
        skillId: own.id,
        targetId: def.target === 'enemy' ? foe.id : undefined,
      }),
    ).toThrow();
  });

  it('灼烧在目标行动开始时结算', () => {
    const s = duel(9);
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];

    foe.base.spd = 99;
    foe.statuses.push({
      kind: 'burn',
      label: '灼',
      amount: 12,
      turns: 2,
      appliedAt: 0,
    });

    const after = takeAction(s, { type: 'defend', actorId: hero.id });
    expect(unitById(after, foe.id).hp).toBe(foe.hp - 12);
    expect(after.log.some((entry) => entry.text.includes('灼烧'))).toBe(true);
  });

  it('倒下后由后援接替上阵', () => {
    const s = duel(13);
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    foe.hp = 1;
    const nextUp = s.bench.enemy[0];

    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });

    expect(unitById(after, foe.id).alive).toBe(false);
    expect(after.field.enemy[0]).toBe(nextUp);
    expect(after.log.some((entry) => entry.text.includes('接替上阵'))).toBe(true);
  });

  it('一局会在有限回合内打出胜负', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = play(seed);
      expect(s.phase).toBe('over');
      expect(s.outcome).not.toBeNull();
      expect(s.round).toBeLessThanOrEqual(CONFIG.maxRounds);
    }
  });
});

describe('控制与状态机制', () => {
  it('沉默时不能施展技能，仍可普攻', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveSkill(hero, 'qinglong');
    giveStatus(hero, 'silence');

    expect(() =>
      takeAction(s, { type: 'skill', actorId: hero.id, skillId: 'qinglong', targetId: foe.id }),
    ).toThrow(/沉默/);

    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });
    expect(unitById(after, foe.id).hp).toBeLessThan(foe.hp);
  });

  it('缴械时不能普攻，仍可施展技能', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveSkill(hero, 'qinglong');
    giveStatus(hero, 'disarm');

    expect(() =>
      takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id }),
    ).toThrow(/缴械/);

    const after = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: 'qinglong',
      targetId: foe.id,
    });
    expect(unitById(after, foe.id).hp).toBeLessThan(foe.hp);
  });

  it('嘲讽迫使单体行动指向嘲讽者', () => {
    const s = twoFoes();
    const hero = fieldUnitsOf(s, 'player')[0];
    const [foe, other] = fieldUnitsOf(s, 'enemy');
    giveStatus(hero, 'taunt', { sourceId: foe.id });
    giveSkill(hero, 'qinglong');

    expect(() =>
      takeAction(s, { type: 'attack', actorId: hero.id, targetId: other.id }),
    ).toThrow(/嘲讽/);
    expect(() =>
      takeAction(s, { type: 'skill', actorId: hero.id, skillId: 'qinglong', targetId: other.id }),
    ).toThrow(/嘲讽/);

    const after = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: 'qinglong',
      targetId: foe.id,
    });
    expect(unitById(after, foe.id).hp).toBeLessThan(foe.hp);
  });

  it('嘲讽者倒下后嘲讽立刻失效', () => {
    const s = twoFoes();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveStatus(hero, 'taunt', { sourceId: foe.id });
    foe.hp = 1;

    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });
    expect(unitById(after, foe.id).alive).toBe(false);
    expect(
      unitById(after, hero.id).statuses.some((st) => st.kind === 'taunt' && st.sourceId === foe.id),
    ).toBe(false);
  });

  it('易伤与虚弱按比例改变伤害', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    const raw = physicalDamage(hero, foe, 1);

    giveStatus(foe, 'vulnerable', { pct: 0.5, turns: 2 });
    expect(adjustDamage(hero, foe, raw)).toBe(Math.round(raw * 1.5));

    giveStatus(hero, 'weaken', { pct: 0.2, turns: 2 });
    expect(adjustDamage(hero, foe, raw)).toBe(Math.round(raw * 1.5 * 0.8));
  });

  it('荆棘把伤害反弹给攻击者', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveStatus(foe, 'thorns', { pct: 0.5, turns: 2 });

    const heroHp = hero.hp;
    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });
    const hpLoss = foe.hp - unitById(after, foe.id).hp;
    expect(unitById(after, hero.id).hp).toBe(heroHp - Math.max(1, Math.round(hpLoss * 0.5)));
  });

  it('反击姿态在受到普攻时还击', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveStatus(foe, 'counter', { pct: 0.5, turns: 2 });

    const heroHp = hero.hp;
    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });
    const expected = adjustDamage(foe, hero, physicalDamage(foe, hero, 0.5));
    expect(unitById(after, hero.id).hp).toBe(heroHp - expected);
  });

  it('中毒在行动开始结算，持续两次', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    foe.base.spd = 99;
    hero.base.spd = 1;
    giveStatus(foe, 'poison', { amount: 10, turns: 2 });
    const max = foe.maxHp;

    let cur = defendActive(s); // 我方防御 → 敌方行动开始，触发第一次中毒
    expect(unitById(cur, foe.id).hp).toBe(max - 10);

    cur = defendActive(cur); // 敌方防御，回合结束扣时长
    expect(unitById(cur, foe.id).statuses.some((st) => st.kind === 'poison')).toBe(true);

    cur = defendActive(cur); // 我方防御 → 下一轮敌方行动，第二次中毒
    expect(unitById(cur, foe.id).hp).toBe(max - 20);

    cur = defendActive(cur); // 敌方防御，状态到期
    expect(unitById(cur, foe.id).statuses.some((st) => st.kind === 'poison')).toBe(false);
  });

  it('回春在行动开始回复生命', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    foe.base.spd = 99;
    hero.base.spd = 1;
    hero.hp = hero.maxHp - 40;
    giveSkill(hero, 'jizhi'); // 对敌魔法伤害 + 自身回春 5%

    let cur = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: 'jizhi',
      targetId: foe.id,
    });
    cur = defendActive(cur); // 敌方行动
    cur = defendActive(cur); // 轮到我方行动，回春触发

    expect(unitById(cur, hero.id).hp).toBe(hero.maxHp - 40 + Math.round(hero.maxHp * 0.05));
  });

  it('净化移除负面状态，保留正面状态', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    giveSkill(hero, 'zhijun'); // 全体友军防御提升 + 净化
    giveStatus(hero, 'poison', { amount: 8, turns: 2 });
    giveStatus(hero, 'vulnerable', { pct: 0.2, turns: 2 });

    const after = takeAction(s, { type: 'skill', actorId: hero.id, skillId: 'zhijun' });
    const statuses = unitById(after, hero.id).statuses;
    expect(statuses.some((st) => st.kind === 'poison' || st.kind === 'vulnerable')).toBe(false);
    expect(statuses.some((st) => st.kind === 'buff' && st.stat === 'def')).toBe(true);
  });

  it('驱散移除目标的增益与护盾', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveSkill(hero, 'baiyi');
    giveStatus(foe, 'shield', { amount: 40, turns: 3 });
    giveStatus(foe, 'buff', { stat: 'atk', pct: 0.3, turns: 2, label: '攻↑' });

    const after = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: 'baiyi',
      targetId: foe.id,
    });
    const statuses = unitById(after, foe.id).statuses;
    expect(statuses.some((st) => st.kind === 'shield' || st.kind === 'buff')).toBe(false);
  });

  it('技能里的自身增益与治疗只作用于自己', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveSkill(hero, 'xiandeng');

    const after = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: 'xiandeng',
      targetId: foe.id,
    });
    expect(
      unitById(after, hero.id).statuses.some((st) => st.kind === 'buff' && st.stat === 'spd'),
    ).toBe(true);
    expect(unitById(after, foe.id).statuses.some((st) => st.kind === 'buff')).toBe(false);

    const s2 = duel();
    const hero2 = fieldUnitsOf(s2, 'player')[0];
    const foe2 = fieldUnitsOf(s2, 'enemy')[0];
    giveSkill(hero2, 'yilie');
    hero2.hp = 40;
    const beforeFoe = foe2.hp;
    const healed = takeAction(s2, {
      type: 'skill',
      actorId: hero2.id,
      skillId: 'yilie',
      targetId: foe2.id,
    });
    expect(unitById(healed, hero2.id).hp).toBeGreaterThan(40);
    expect(unitById(healed, foe2.id).hp).toBeLessThanOrEqual(beforeFoe);
  });
});

describe('技能类型与天赋触发', () => {
  it('被动光环按百分比提升属性', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const before = effectiveStat(hero, 'atk', s);
    giveTalent(hero, 'wusheng');
    expect(effectiveStat(hero, 'atk', s)).toBe(Math.round(hero.base.atk * 1.12));
    expect(effectiveStat(hero, 'atk', s)).toBeGreaterThan(before);
  });

  it('受到伤害后触发天赋', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveTalent(hero, 'qiaobian_ling');
    s.activeId = foe.id;

    const after = takeAction(s, { type: 'attack', actorId: foe.id, targetId: hero.id });
    const h = unitById(after, hero.id);
    expect(h.alive).toBe(true);
    expect(h.talents[0].uses).toBe(1);
    expect(h.statuses.some((st) => st.kind === 'buff' && st.stat === 'spd')).toBe(true);
    expect(after.log.some((entry) => entry.kind === 'trigger' && entry.text.includes('巧变之灵'))).toBe(
      true,
    );
  });

  it('阵亡时触发天赋，并为友军提供护盾', () => {
    const s = twoFoes();
    const hero = fieldUnitsOf(s, 'player')[0];
    const ally = unitById(s, s.bench.player[0]);
    s.field.player[1] = ally.id;
    s.bench.player = s.bench.player.slice(1);
    giveTalent(hero, 'yizhong_buqu');
    hero.hp = 1;
    const foe = fieldUnitsOf(s, 'enemy')[0];
    s.activeId = foe.id;

    const after = takeAction(s, { type: 'attack', actorId: foe.id, targetId: hero.id });
    expect(unitById(after, hero.id).alive).toBe(false);
    const shielded = unitById(after, ally.id);
    expect(
      shielded.statuses.some(
        (st) => st.kind === 'shield' && st.amount === Math.round(shielded.maxHp * 0.12),
      ),
    ).toBe(true);
  });

  it('击杀敌人后触发追击', () => {
    const s = twoFoes();
    const hero = fieldUnitsOf(s, 'player')[0];
    const [foe, other] = fieldUnitsOf(s, 'enemy');
    giveTalent(hero, 'tieqi_zhuiji');
    foe.hp = 1;
    s.activeId = hero.id;

    const after = takeAction(s, { type: 'attack', actorId: hero.id, targetId: foe.id });
    expect(unitById(after, foe.id).alive).toBe(false);
    expect(unitById(after, other.id).hp).toBeLessThan(other.hp);
  });

  it('生命阈值天赋每场只触发一次', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveTalent(hero, 'fangu_juexing');
    hero.maxHp = 1000;
    hero.hp = 300;
    s.activeId = foe.id;

    const after = takeAction(s, { type: 'attack', actorId: foe.id, targetId: hero.id });
    const h = unitById(after, hero.id);
    expect(h.talents[0].fired).toBe(true);
    expect(h.talents[0].uses).toBe(1);
    expect(h.statuses.some((st) => st.kind === 'buff' && st.stat === 'atk')).toBe(true);
    expect(h.statuses.some((st) => st.kind === 'lifesteal')).toBe(true);
  });

  it('触发技能不能主动施展', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    giveSkill(hero, 'wusheng');
    s.activeId = hero.id;
    expect(() =>
      takeAction(s, { type: 'skill', actorId: hero.id, skillId: 'wusheng' }),
    ).toThrow(/被动天赋/);
  });

  it('友军阵亡后为其余友军缩短冷却', () => {
    const s = twoFoes();
    const hero = fieldUnitsOf(s, 'player')[0];
    const ally = unitById(s, s.bench.player[0]);
    const doomed = unitById(s, s.bench.player[1]);
    s.field.player[1] = ally.id;
    s.bench.player = s.bench.player.slice(2);
    giveTalent(hero, 'zhijun_yanshu');
    ally.skills = [{ id: 'qinglong', cdLeft: 2 }];
    // 让另一名友军阵亡：直接放进场上并设为残血。
    s.field.player[2] = doomed.id;
    doomed.hp = 1;
    const foe = fieldUnitsOf(s, 'enemy')[0];
    s.activeId = foe.id;
    // 让行动结束后直接轮到敌人自己，避免友军回合开始的自然冷却打乱断言。
    s.queue = [foe.id];

    const after = takeAction(s, { type: 'attack', actorId: foe.id, targetId: doomed.id });
    const a = unitById(after, ally.id);
    expect(a.skills[0].cdLeft).toBe(1);
    expect(a.statuses.some((st) => st.kind === 'shield')).toBe(true);
  });

  it('敌方普攻后触发削弱来源的天赋', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveTalent(hero, 'quhu_tunlang');
    s.activeId = foe.id;

    const after = takeAction(s, { type: 'attack', actorId: foe.id, targetId: hero.id });
    const f = unitById(after, foe.id);
    expect(f.statuses.some((st) => st.kind === 'debuff' && st.stat === 'atk')).toBe(true);
  });

  it('自损战法失去生命并换取攻击增益', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    giveSkill(hero, 'kurou');
    hero.hp = hero.maxHp;
    s.activeId = hero.id;

    const after = takeAction(s, { type: 'skill', actorId: hero.id, skillId: 'kurou' });
    const h = unitById(after, hero.id);
    expect(h.hp).toBe(hero.maxHp - Math.round(hero.maxHp * 0.1));
    expect(h.statuses.some((st) => st.kind === 'buff' && st.stat === 'atk')).toBe(true);
  });

  it('生命高于阈值时战法倍率提升', () => {
    const s = duel();
    const hero = fieldUnitsOf(s, 'player')[0];
    const foe = fieldUnitsOf(s, 'enemy')[0];
    giveSkill(hero, 'guandujuezhan');
    s.activeId = hero.id;
    const before = foe.hp;
    const expected = adjustDamage(hero, foe, physicalDamage(hero, foe, 2.5));

    const after = takeAction(s, {
      type: 'skill',
      actorId: hero.id,
      skillId: 'guandujuezhan',
      targetId: foe.id,
    });
    expect(unitById(after, foe.id).hp).toBe(Math.max(0, before - expected));
  });
});
