/** 技能类型与触发时机的中文标签，引擎日志与界面共用。 */
import type { ActionKind, SkillDef, SkillType, TriggerKind } from './types';

export const SKILL_TYPE_LABEL: Record<SkillType, string> = {
  blade: '兵刃',
  strategy: '谋略',
  defense: '防御',
  command: '统御',
  movement: '身法',
  passive: '被动',
};

export const SKILL_TYPE_HINT: Record<SkillType, string> = {
  blade: '以武力直接造成物理伤害。',
  strategy: '以智力造成法术伤害或施加控制。',
  defense: '护盾、减伤、嘲讽与防守反击。',
  command: '增益友军、削弱敌军、调度战局。',
  movement: '依赖速度与走位的突袭、追击。',
  passive: '不需主动施展，满足条件时自动生效。',
};

const ACTION_LABEL: Record<ActionKind, string> = {
  attack: '普攻',
  skill: '战法',
  defend: '防御',
};

export function isActiveSkill(def: SkillDef): boolean {
  return (def.trigger ?? 'active') === 'active';
}

/** 一句可读的触发时机，例如「受到伤害后」「我方施展谋略战法后」。 */
export function triggerText(def: SkillDef): string {
  const trigger: TriggerKind = def.trigger ?? 'active';
  switch (trigger) {
    case 'active':
      return '行动时施展';
    case 'passive':
      return '常驻';
    case 'turnStart':
      return '自身回合开始时';
    case 'turnEnd':
      return '自身回合结束时';
    case 'roundStart':
      return '每回合开始时';
    case 'roundEnd':
      return '每回合结束时';
    case 'attack':
      return '普攻后';
    case 'defend':
      return '防御后';
    case 'cast':
      return '施展战法后';
    case 'dealDamage':
      return '造成伤害后';
    case 'takeDamage':
      return '受到伤害后';
    case 'heal':
      return '受到治疗后';
    case 'kill':
      return '击杀敌人后';
    case 'death':
      return '阵亡时';
    case 'allyDeath':
      return '友军阵亡时';
    case 'enemyDeath':
      return '敌军阵亡时';
    case 'targeted':
      return '被选为目标时';
    case 'actionUsed': {
      const who =
        def.by === 'enemy' ? '敌方' : def.by === 'self' ? '自身' : def.by === 'ally' ? '我方' : '场上';
      const what = def.skillType
        ? `${SKILL_TYPE_LABEL[def.skillType]}战法`
        : def.action
          ? ACTION_LABEL[def.action]
          : '行动';
      return `${who}${what}后`;
    }
    case 'hpBelow':
      return `生命首次低于 ${Math.round((def.threshold ?? 0.5) * 100)}% 时`;
  }
}
