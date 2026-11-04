/**
 * 敌方 AI：对每个可用行动粗略估值——伤害、治疗、护盾、增益、减益、控制、持续效果，
 * 取价值最高的一个。估值只看公开信息，不读玩家的隐藏选择（本来也没有）。
 * 被沉默时不用技能，被缴械时不普攻，被嘲讽时只能打嘲讽者。
 */
import {
  adjustDamage,
  condMet,
  effectiveStat,
  fieldUnitsOf,
  isDisarmed,
  isSilenced,
  magicDamage,
  physicalDamage,
  resolveTargets,
  statusPct,
  tauntSource,
  unitById,
  type Action,
} from './battle';
import { SKILL_BY_ID } from './data';
import { isBuff, isDebuff } from './status';
import type { BattleState, EffectDef, SkillDef, StatKey, Unit } from './types';

function buffValue(stat: StatKey, pct: number, actor: Unit, state: BattleState): number {
  switch (stat) {
    case 'atk':
      return effectiveStat(actor, 'atk', state) * pct * 2;
    case 'def':
      return effectiveStat(actor, 'def', state) * pct * 1.5;
    case 'spd':
      return 5;
    case 'int':
      return effectiveStat(actor, 'int', state) * pct * 1.5;
  }
}

function effectValue(
  state: BattleState,
  actor: Unit,
  target: Unit,
  eff: EffectDef,
): number {
  switch (eff.type) {
    case 'damage': {
      if (!target.alive) return 0;
      let ratio = eff.ratio;
      if (eff.bonus && condMet(state, actor, target, eff.bonus.when)) ratio += eff.bonus.ratio;
      const hits = eff.hits ?? 1;
      let dmg = 0;
      for (let i = 0; i < hits; i++) {
        const raw =
          eff.scale === 'int'
            ? magicDamage(actor, target, ratio, state)
            : physicalDamage(actor, target, ratio, eff.pierce ?? 0, state);
        dmg += adjustDamage(actor, target, raw);
      }
      let value = dmg;
      if (dmg >= target.hp) value += 40;
      if (eff.drain) {
        value += Math.min(target.maxHp - target.hp, Math.round(dmg * eff.drain)) * 0.6;
      }
      const lifesteal = statusPct(actor, 'lifesteal');
      if (lifesteal > 0) {
        value += Math.min(target.maxHp - actor.hp, Math.round(dmg * lifesteal)) * 0.5;
      }
      return value;
    }
    case 'heal': {
      const amount =
        eff.scale === 'maxHp'
          ? actor.maxHp * eff.ratio
          : effectiveStat(actor, eff.scale, state) * eff.ratio;
      const blocked = Math.max(0, 1 - statusPct(target, 'healBlock'));
      return Math.min(amount * blocked, target.maxHp - target.hp) * 0.9;
    }
    case 'buff':
      return buffValue(eff.stat, eff.pct, target, state);
    case 'debuff': {
      // 削弱对方核心属性，按目标属性的两回合收益估值
      const base =
        eff.stat === 'atk'
          ? effectiveStat(target, 'atk', state) * 1.6
          : eff.stat === 'def'
            ? effectiveStat(target, 'def', state) * 1.2
            : 5;
      return base * eff.pct * 1.6;
    }
    case 'shield':
      return (
        Math.min(
          eff.scale === 'maxHp'
            ? target.maxHp * eff.ratio
            : effectiveStat(actor, 'int', state) * eff.ratio,
          target.maxHp * 0.5,
        ) * 0.55
      );
    case 'burn':
      return effectiveStat(actor, 'int', state) * eff.ratio * eff.turns * 0.55;
    case 'poison':
      return target.maxHp * eff.pctMaxHp * eff.turns * 0.55;
    case 'regen': {
      const block = Math.max(0, 1 - statusPct(target, 'healBlock'));
      return Math.min(target.maxHp * eff.pctMaxHp * block, target.maxHp - target.hp) * 0.5;
    }
    case 'stun':
      return 26 * eff.turns;
    case 'silence': {
      const ready = target.skills.filter((s) => s.cdLeft === 0).length;
      return (10 + ready * 8) * eff.turns;
    }
    case 'disarm':
      return 13 * eff.turns;
    case 'taunt':
      // 血少时嘲讽等于把自己送到刀口上
      return (actor.hp / actor.maxHp < 0.4 ? 6 : 18) * eff.turns;
    case 'vulnerable':
      return 9 * eff.turns * (1 + eff.pct);
    case 'weaken':
      return 11 * eff.turns * (1 + eff.pct);
    case 'healBlock':
      return 7 * eff.turns;
    case 'lifesteal':
      return 9 * eff.turns;
    case 'counter':
      return 11 * eff.turns;
    case 'thorns':
      return 10 * eff.turns;
    case 'cleanse': {
      const bad = target.statuses.filter((st) => isDebuff(st)).length;
      return bad * 11;
    }
    case 'dispel': {
      const good = target.statuses.filter((st) => isBuff(st)).length;
      return good * 11;
    }
    case 'if': {
      const branch = condMet(state, actor, target, eff.when) ? eff.then : (eff.else ?? []);
      let value = 0;
      for (const sub of branch) {
        if (sub.type === 'if') value += effectValue(state, actor, target, sub);
        else if (sub.target) {
          for (const t of resolveTargets(state, actor, sub.target)) {
            value += effectValue(state, actor, t, sub);
          }
        } else value += effectValue(state, actor, target, sub);
      }
      return value;
    }
    case 'cooldown': {
      const owned = target.skills.length + target.talents.length;
      return owned * (eff.reset ? 5 : 3) * (eff.amount ?? 1);
    }
    case 'loseHp': {
      return -target.maxHp * eff.ratio * 0.8;
    }
  }
}

/** 一条效果的作用对象：优先用效果自带的目标，否则跟随技能目标。 */
function effectTargets(
  state: BattleState,
  actor: Unit,
  def: SkillDef,
  eff: EffectDef,
  primary?: Unit,
): Unit[] {
  const kind = eff.target ?? def.target;
  if (kind === 'enemy') return primary ? [primary] : [];
  return resolveTargets(state, actor, kind);
}

function scoreSkill(
  state: BattleState,
  actor: Unit,
  def: SkillDef,
  primary?: Unit,
): number {
  let score = 0;
  for (const eff of def.effects) {
    for (const target of effectTargets(state, actor, def, eff, primary)) {
      score += effectValue(state, actor, target, eff);
    }
  }
  return score;
}

export function autoAction(state: BattleState): Action {
  if (!state.activeId) throw new Error('当前没有可以行动的武将');
  const actor = unitById(state, state.activeId);
  const foes = fieldUnitsOf(state, actor.side === 'player' ? 'enemy' : 'player').filter(
    (u) => u.alive,
  );
  if (foes.length === 0) throw new Error('场上没有敌人');

  const taunter = tauntSource(state, actor);
  const attackTargets = taunter ? [taunter] : foes;

  let best: { score: number; action: Action } = {
    score: 0,
    action: { type: 'defend', actorId: actor.id },
  };

  if (!isDisarmed(actor)) {
    for (const target of attackTargets) {
      const dmg = adjustDamage(actor, target, physicalDamage(actor, target, 1, 0, state));
      let score = dmg + (dmg >= target.hp ? 40 : 0);
      const lifesteal = statusPct(actor, 'lifesteal');
      if (lifesteal > 0) score += Math.min(actor.maxHp - actor.hp, dmg * lifesteal) * 0.5;
      if (score > best.score) {
        best = {
          score,
          action: { type: 'attack', actorId: actor.id, targetId: target.id },
        };
      }
    }
  }

  if (!isSilenced(actor)) {
    for (const own of actor.skills) {
      if (own.cdLeft > 0) continue;
      const def = SKILL_BY_ID[own.id];
      if (!def) continue;

      if (def.target === 'enemy') {
        for (const target of attackTargets) {
          const score = scoreSkill(state, actor, def, target);
          if (score > best.score + 0.01) {
            best = {
              score,
              action: { type: 'skill', actorId: actor.id, skillId: def.id, targetId: target.id },
            };
          }
        }
      } else {
        const score = scoreSkill(state, actor, def);
        if (score > best.score + 0.01) {
          best = {
            score,
            action: { type: 'skill', actorId: actor.id, skillId: def.id },
          };
        }
      }
    }
  }

  return best.action;
}
