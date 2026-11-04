/** 战棋的核心类型：武将的六维、技能（带冷却）、战场状态。 */

export type Side = 'player' | 'enemy';
export type StatKey = 'atk' | 'def' | 'int' | 'spd';
/** 势力，用于界面配色与后续的缘分/成长系统。 */
export type Faction = 'wei' | 'shu' | 'wu' | 'qun';

/**
 * 技能类型：兵刃 / 谋略 / 防御 / 统御 / 身法 / 被动。
 * 类型只用于分类、界面标签与后续的克制关系，不直接改写倍率。
 */
export type SkillType = 'blade' | 'strategy' | 'defense' | 'command' | 'movement' | 'passive';

export type ActionKind = 'attack' | 'skill' | 'defend';

/**
 * 触发时机。主动技能用 active；其余时机的技能不进入军令栏，
 * 由引擎在对应事件发生时自动检查。
 */
export type TriggerKind =
  | 'active'
  | 'passive'
  | 'turnStart'
  | 'turnEnd'
  | 'roundStart'
  | 'roundEnd'
  | 'attack'
  | 'defend'
  | 'cast'
  | 'dealDamage'
  | 'takeDamage'
  | 'heal'
  | 'kill'
  | 'death'
  | 'allyDeath'
  | 'enemyDeath'
  | 'targeted'
  | 'actionUsed'
  | 'hpBelow';

/** 触发时「谁做出行为」相对于技能持有者的范围。 */
export type TriggerBy = 'self' | 'ally' | 'enemy' | 'any';

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
  /** 目标生命比例高于此值（0~1）。 */
  targetHpAbove?: number;
  /** 自身生命比例低于此值。 */
  selfHpBelow?: number;
  /** 目标身上带有某状态。 */
  targetHas?: StatusKind;
  /** 自身身上带有某状态。 */
  selfHas?: StatusKind;
  /** 任意友军带有某状态。 */
  allyHas?: StatusKind;
  /** 任意敌军带有某状态。 */
  enemyHas?: StatusKind;
  /** 自身有效速度高于目标。 */
  fasterThanTarget?: boolean;
  /** 自身有效速度高于场上所有敌人。 */
  fasterThanAllEnemies?: boolean;
  /** 我方场上存活人数不超过此值。 */
  allyFieldAtMost?: number;
  /** 我方场上存活人数不少于此值。 */
  allyFieldAtLeast?: number;
  /** 敌方场上存活人数不超过此值。 */
  enemyFieldAtMost?: number;
  /** 敌方场上存活人数不少于此值。 */
  enemyFieldAtLeast?: number;
  /** 当前回合数不少于此值。 */
  roundAtLeast?: number;
  /** 当前回合数不超过此值。 */
  roundAtMost?: number;
}

export type TargetKind =
  | 'enemy'
  | 'lowestEnemy'
  | 'strongestEnemy'
  | 'allEnemies'
  | 'self'
  | 'lowestAlly'
  | 'allAllies'
  | 'otherAllies'
  /** 触发事件的来源（例如伤害来源、击杀者）。 */
  | 'source'
  /** 触发事件中被影响的目标（例如阵亡的友军）。 */
  | 'triggerTarget';

/** 效果可以单独指定作用对象；不写时跟随技能的目标类型。 */
interface EffectCommon {
  target?: TargetKind;
  /** 单条效果自己的条件；不满足时整条效果跳过。 */
  when?: WhenCond;
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

/** 失去生命（自损，不视为受到伤害），不会低于 1 点。 */
export interface LoseHpEffect extends EffectCommon {
  type: 'loseHp';
  /** 失去自身最大生命的比例 0~1。 */
  ratio: number;
}

/** 条件分支：按当前局面走 then 或 else 分支。 */
export interface IfEffect extends EffectCommon {
  type: 'if';
  when: WhenCond;
  then: EffectDef[];
  else?: EffectDef[];
}

/** 缩短或重置技能冷却（含天赋的内置冷却）。 */
export interface CooldownEffect extends EffectCommon {
  type: 'cooldown';
  /** 减少的回合数；默认 1。 */
  amount?: number;
  /** 直接归零。 */
  reset?: boolean;
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
  | DispelEffect
  | LoseHpEffect
  | IfEffect
  | CooldownEffect;

/** 常驻光环：满足条件时按百分比修改某项属性（可作用于自身 / 友军 / 敌军）。 */
export interface AuraDef {
  stat: StatKey | 'all';
  pct: number;
  scope: 'self' | 'allies' | 'enemies';
  when?: WhenCond;
}

export interface SkillDef {
  id: string;
  name: string;
  type: SkillType;
  /** 触发时机；省略时为 active。 */
  trigger?: TriggerKind;
  /** 主动技能的行动冷却；触发技能的内置冷却。 */
  cd: number;
  target: TargetKind;
  desc: string;
  effects: EffectDef[];
  /** 触发条件（对持有者与事件对象结算）。 */
  when?: WhenCond;
  /** actionUsed 限定的行为类型。 */
  action?: ActionKind;
  /** actionUsed / cast 限定的技能类型。 */
  skillType?: SkillType;
  /** actionUsed 限定的行为者范围。 */
  by?: TriggerBy;
  /** 每场战斗最多触发次数。 */
  maxTriggers?: number;
  /** hpBelow 的生命阈值（0~1）。 */
  threshold?: number;
  /** passive 光环。 */
  aura?: AuraDef;
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
  /** 可在行动时施展的主动技能。 */
  skills: string[];
  /** 不需主动施展的天赋（被动 / 触发技能）。 */
  talents?: string[];
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

export interface TalentState {
  id: string;
  /** 触发内置冷却。 */
  cdLeft: number;
  /** 本场已触发次数。 */
  uses: number;
  /** hpBelow 类天赋是否已经触发过。 */
  fired: boolean;
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
  talents: TalentState[];
  statuses: Status[];
  alive: boolean;
  /** 最后一次对这名单位造成伤害的来源，用于阵亡触发。 */
  lastHitBy?: string;
}

export type Phase = 'deploy' | 'battle' | 'over';
export type Outcome = 'victory' | 'defeat';

export interface LogEntry {
  round: number;
  kind: 'round' | 'action' | 'status' | 'trigger' | 'death' | 'system';
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
  /** 触发链深度，防止天赋互相触发形成死循环。 */
  triggerDepth: number;
  log: LogEntry[];
}
