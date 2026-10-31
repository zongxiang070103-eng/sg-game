/** 战棋的核心类型：武将的六维、技能（带冷却）、战场状态。 */

export type Side = 'player' | 'enemy';
export type StatKey = 'atk' | 'def' | 'int' | 'spd';
/** 势力，用于界面配色与后续的缘分/成长系统。 */
export type Faction = 'wei' | 'shu' | 'wu' | 'qun';

export type StatusKind =
  /** 属性增益（攻/防/智/速）。 */
  | 'buff'
  /** 属性减益。 */
  | 'debuff'
  | 'shield'
  /** 持续伤害：灼烧（按施法者智力）。 */
  | 'burn'
  /** 持续伤害：中毒（按目标最大生命）。 */
  | 'poison'
  /** 持续回复。 */
  | 'regen'
  /** 控制：跳过行动。 */
  | 'stun'
  /** 控制：不能施展技能。 */
  | 'silence'
  /** 控制：不能普攻。 */
  | 'disarm'
  /** 控制：只能把单体攻击指向嘲讽者。 */
  | 'taunt'
  /** 受到伤害提升。 */
  | 'vulnerable'
  /** 造成伤害降低。 */
  | 'weaken'
  /** 受到治疗降低。 */
  | 'healBlock'
  /** 造成伤害的一部分回复自身。 */
  | 'lifesteal'
  /** 受到普攻时反击。 */
  | 'counter'
  /** 反弹所受伤害。 */
  | 'thorns';

/** 技能追加效果或额外效果的触发条件，全部公开可算。 */
export interface WhenCond {
  /** 目标生命比例低于此值（0~1）。 */
  targetHpBelow?: number;
  /** 自身生命比例低于此值。 */
  selfHpBelow?: number;
  /** 目标身上带有某状态。 */
  targetHas?: StatusKind;
  /** 自身有效速度高于目标。 */
  fasterThanTarget?: boolean;
  /** 我方场上存活人数不超过此值。 */
  allyFieldAtMost?: number;
}

export type TargetKind =
  | 'enemy'
  | 'lowestEnemy'
  | 'strongestEnemy'
  | 'allEnemies'
  | 'self'
  | 'lowestAlly'
  | 'allAllies';

/** 效果可以单独指定作用对象；不写时跟随技能的目标类型。 */
interface EffectCommon {
  target?: TargetKind;
}

export interface DamageEffect extends EffectCommon {
  type: 'damage';
  scale: 'atk' | 'int';
  ratio: number;
  /** 连击次数，每次独立结算。 */
  hits?: number;
  /** 无视目标防御的比例 0~1。 */
  pierce?: number;
  /** 回复所造成伤害的比例。 */
  drain?: number;
  bonus?: { ratio: number; when: WhenCond; desc: string };
}

export interface HealEffect extends EffectCommon {
  type: 'heal';
  scale: 'int' | 'atk' | 'maxHp';
  ratio: number;
}

export interface BuffEffect extends EffectCommon {
  type: 'buff' | 'debuff';
  stat: StatKey;
  pct: number;
  turns: number;
}

export interface ShieldEffect extends EffectCommon {
  type: 'shield';
  scale: 'maxHp' | 'int';
  ratio: number;
  turns: number;
}

export interface BurnEffect extends EffectCommon {
  type: 'burn';
  /** 每回合伤害 = 施放者智力 × ratio。 */
  ratio: number;
  turns: number;
}

export interface PoisonEffect extends EffectCommon {
  type: 'poison';
  /** 每回合伤害 = 目标最大生命 × pctMaxHp。 */
  pctMaxHp: number;
  turns: number;
}

export interface RegenEffect extends EffectCommon {
  type: 'regen';
  /** 每回合回复 = 目标最大生命 × pctMaxHp。 */
  pctMaxHp: number;
  turns: number;
}

/** 控制类效果。 */
export interface ControlEffect extends EffectCommon {
  type: 'stun' | 'silence' | 'disarm' | 'taunt';
  turns: number;
}

/** 按百分比生效的增益/减益。 */
export interface RatioEffect extends EffectCommon {
  type: 'vulnerable' | 'weaken' | 'healBlock' | 'lifesteal' | 'counter' | 'thorns';
  pct: number;
  turns: number;
}

export interface CleanseEffect extends EffectCommon {
  type: 'cleanse';
}

export interface DispelEffect extends EffectCommon {
  type: 'dispel';
}

export type EffectDef =
  | DamageEffect
  | HealEffect
  | BuffEffect
  | ShieldEffect
  | BurnEffect
  | PoisonEffect
  | RegenEffect
  | ControlEffect
  | RatioEffect
  | CleanseEffect
  | DispelEffect;

export interface SkillDef {
  id: string;
  name: string;
  /** 冷却回合数。 */
  cd: number;
  target: TargetKind;
  desc: string;
  effects: EffectDef[];
}

export interface GeneralDef {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  atk: number;
  def: number;
  int: number;
  spd: number;
  skills: string[];
}

export interface Status {
  kind: StatusKind;
  /** 悬浮提示里显示的短标签，如「攻↑」「护盾」。 */
  label: string;
  turns: number;
  /** 施加时的行动序号：本回合刚上的状态不在回合结束时掉时长。 */
  appliedAt: number;
  stat?: StatKey;
  pct?: number;
  /** 护盾剩余量 / 持续伤害或回复的每回合数值。 */
  amount?: number;
  /** 施加者（嘲讽需要知道该打谁）。 */
  sourceId?: string;
}

export interface Unit {
  id: string;
  side: Side;
  generalId: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  maxHp: number;
  base: Record<StatKey, number>;
  skills: { id: string; cdLeft: number }[];
  statuses: Status[];
  alive: boolean;
}

export type Phase = 'deploy' | 'battle' | 'over';
export type Outcome = 'victory' | 'defeat';

export interface LogEntry {
  round: number;
  kind: 'round' | 'action' | 'status' | 'death' | 'system';
  text: string;
}

export interface BattleState {
  seed: number;
  rngState: number;
  phase: Phase;
  outcome: Outcome | null;
  round: number;
  /** 行动序号，用于判断状态是否本回合刚施加。 */
  actionSeq: number;
  units: Unit[];
  /** 三格战场，空位为 null。 */
  field: Record<Side, (string | null)[]>;
  /** 后援队列，按登场顺序排列。 */
  bench: Record<Side, string[]>;
  /** 本回合尚未行动的单位，按速度从高到低。 */
  queue: string[];
  activeId: string | null;
  log: LogEntry[];
}
