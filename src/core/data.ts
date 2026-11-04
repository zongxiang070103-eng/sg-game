/** 读取并校验 data/ 下的武将、技能数据，其他模块只从这里取。 */
import generalsRaw from '../../data/generals.json';
import skillsRaw from '../../data/skills.json';
import type { GeneralDef, SkillDef, SkillType, TriggerKind } from './types';

export const GENERALS: GeneralDef[] = generalsRaw as GeneralDef[];
export const SKILLS: SkillDef[] = skillsRaw as SkillDef[];

export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
);

export const GENERAL_BY_ID: Record<string, GeneralDef> = Object.fromEntries(
  GENERALS.map((g) => [g.id, g]),
);

/** 数据写错时尽早失败，而不是在战斗中途才蹦出 undefined。 */
const FACTIONS = new Set(['wei', 'shu', 'wu', 'qun']);
const SKILL_TYPES = new Set<SkillType>([
  'blade',
  'strategy',
  'defense',
  'command',
  'movement',
  'passive',
]);
const TRIGGERS = new Set<TriggerKind>([
  'active',
  'passive',
  'turnStart',
  'turnEnd',
  'roundStart',
  'roundEnd',
  'attack',
  'defend',
  'cast',
  'dealDamage',
  'takeDamage',
  'heal',
  'kill',
  'death',
  'allyDeath',
  'enemyDeath',
  'targeted',
  'actionUsed',
  'hpBelow',
]);

const seen = new Set<string>();
for (const s of SKILLS) {
  if (seen.has(s.id)) throw new Error(`技能 id 重复：${s.id}`);
  seen.add(s.id);
  if (!SKILL_TYPES.has(s.type)) throw new Error(`${s.name} 的技能类型无效：${s.type}`);
  const trigger = s.trigger ?? 'active';
  if (!TRIGGERS.has(trigger)) throw new Error(`${s.name} 的触发时机无效：${trigger}`);
  if (s.cd < 0) throw new Error(`${s.name} 的冷却不能为负`);
  if (s.maxTriggers !== undefined && s.maxTriggers < 1) {
    throw new Error(`${s.name} 的 maxTriggers 至少为 1`);
  }
  if (s.threshold !== undefined && (s.threshold <= 0 || s.threshold > 1)) {
    throw new Error(`${s.name} 的 threshold 必须在 0 到 1 之间`);
  }
  if (trigger === 'passive') {
    if (!s.aura && s.effects.length === 0) {
      throw new Error(`${s.name} 是被动技能，但没有光环或效果`);
    }
  } else if (trigger !== 'active' && s.effects.length === 0) {
    throw new Error(`${s.name} 是触发技能，但没有效果`);
  }
}

for (const g of GENERALS) {
  if (!FACTIONS.has(g.faction)) throw new Error(`${g.name} 的势力无效：${g.faction}`);
  if (g.skills.length === 0) throw new Error(`${g.name} 没有技能`);
  for (const id of g.skills) {
    const def = SKILL_BY_ID[id];
    if (!def) throw new Error(`${g.name} 引用了不存在的技能 ${id}`);
    if ((def.trigger ?? 'active') !== 'active') {
      throw new Error(`${g.name} 的主动技能 ${id} 是触发技能，应放进 talents`);
    }
  }
  for (const id of g.talents ?? []) {
    const def = SKILL_BY_ID[id];
    if (!def) throw new Error(`${g.name} 引用了不存在天赋 ${id}`);
    if ((def.trigger ?? 'active') === 'active') {
      throw new Error(`${g.name} 的天赋 ${id} 是主动技能，应放进 skills`);
    }
    if (g.skills.includes(id)) throw new Error(`${g.name} 的 ${id} 同时出现在技能与天赋里`);
  }
}
