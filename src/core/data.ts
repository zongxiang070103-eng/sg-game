/** 读取并校验 data/ 下的武将、技能数据，其他模块只从这里取。 */
import generalsRaw from '../../data/generals.json';
import skillsRaw from '../../data/skills.json';
import type { GeneralDef, SkillDef } from './types';

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
for (const g of GENERALS) {
  if (!FACTIONS.has(g.faction)) throw new Error(`${g.name} 的势力无效：${g.faction}`);
  if (g.skills.length === 0) throw new Error(`${g.name} 没有技能`);
  for (const id of g.skills) {
    if (!SKILL_BY_ID[id]) throw new Error(`${g.name} 引用了不存在的技能 ${id}`);
  }
}
for (const s of SKILLS) {
  if (s.cd < 0) throw new Error(`${s.name} 的冷却不能为负`);
}
