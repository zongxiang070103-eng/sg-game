/** 状态的中文名、分类与说明，供引擎日志与界面共用。 */
import type { Status, StatusKind } from './types';

export const STATUS_LABEL: Record<StatusKind, string> = {
  buff: '增益',
  debuff: '减益',
  shield: '护盾',
  burn: '灼',
  poison: '毒',
  regen: '回春',
  stun: '晕',
  silence: '默',
  disarm: '缴',
  taunt: '嘲',
  vulnerable: '易伤',
  weaken: '虚弱',
  healBlock: '禁疗',
  lifesteal: '吸血',
  counter: '反击',
  thorns: '荆棘',
};

const DEBUFF_KINDS: StatusKind[] = [
  'debuff',
  'burn',
  'poison',
  'stun',
  'silence',
  'disarm',
  'taunt',
  'vulnerable',
  'weaken',
  'healBlock',
];

/** 负面状态：可被净化。 */
export function isDebuff(st: Status): boolean {
  return DEBUFF_KINDS.includes(st.kind);
}

/** 正面状态：可被驱散（含护盾）。 */
export function isBuff(st: Status): boolean {
  return !isDebuff(st);
}

const pctText = (pct: number | undefined): string => `${Math.round((pct ?? 0) * 100)}%`;

/** 悬浮提示里的一行状态说明。 */
export function describeStatus(st: Status): string {
  const turns = `${st.turns} 回合`;
  switch (st.kind) {
    case 'buff':
    case 'debuff':
      return `${st.label} ${pctText(st.pct)}（${turns}）`;
    case 'shield':
      return `护盾 ${st.amount ?? 0}（${turns}）`;
    case 'burn':
      return `灼烧，每回合 ${st.amount ?? 0} 点（${turns}）`;
    case 'poison':
      return `中毒，每回合 ${st.amount ?? 0} 点（${turns}）`;
    case 'regen':
      return `回春，每回合回复 ${st.amount ?? 0} 点（${turns}）`;
    case 'stun':
      return `眩晕，跳过行动（${turns}）`;
    case 'silence':
      return `沉默，无法施展技能（${turns}）`;
    case 'disarm':
      return `缴械，无法普攻（${turns}）`;
    case 'taunt':
      return `嘲讽，单体攻击只能指向嘲讽者（${turns}）`;
    case 'vulnerable':
      return `易伤，受到伤害 +${pctText(st.pct)}（${turns}）`;
    case 'weaken':
      return `虚弱，造成伤害 -${pctText(st.pct)}（${turns}）`;
    case 'healBlock':
      return `禁疗，受到治疗 -${pctText(st.pct)}（${turns}）`;
    case 'lifesteal':
      return `吸血，伤害的 ${pctText(st.pct)} 回复自身（${turns}）`;
    case 'counter':
      return `反击，受到普攻时以 ${pctText(st.pct)} 攻击还击（${turns}）`;
    case 'thorns':
      return `荆棘，反弹所受伤害的 ${pctText(st.pct)}（${turns}）`;
  }
}
