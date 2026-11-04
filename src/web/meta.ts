/** 将星谱界面的展示元数据：势力配色、卡面、兵器、定位文案。 */
import uiMetaRaw from '../../data/ui-meta.json';
import { GENERAL_BY_ID, SKILL_BY_ID } from '../core/data';
import type { Faction, GeneralDef } from '../core/types';

export interface FactionMeta {
  name: string;
  full: string;
  accent: string;
  pale: string;
  note: string;
}

export const FACTION_META: Record<Faction, FactionMeta> = {
  wei: { name: '魏', full: '曹魏', accent: '#3f5f91', pale: '#c9d3df', note: '据中原之厚，挟天子以令诸侯。' },
  shu: { name: '蜀', full: '蜀汉', accent: '#356a50', pale: '#c9d9c8', note: '据益州之险，以汉室正统自居。' },
  wu: { name: '吴', full: '东吴', accent: '#9a452f', pale: '#e2cbb8', note: '坐断东南，凭长江之固。' },
  qun: { name: '群', full: '群雄', accent: '#8b6a2c', pale: '#dccda9', note: '汉末乱世，逐鹿于中原与四裔。' },
};

const ACCENTS: Record<Faction, [string, string][]> = {
  wei: [['#3f5f91', '#c9d3df'], ['#2f6f8f', '#9fd4e8'], ['#4a6b9a', '#d3dcea'], ['#355c7d', '#b9cfdf']],
  shu: [['#356a50', '#c9d9c8'], ['#1f6f5a', '#7fd0b0'], ['#3f9e8e', '#b7ead9'], ['#2f8f68', '#a8e6c8']],
  wu: [['#9a452f', '#e2cbb8'], ['#a8543a', '#ecc8b0'], ['#8f3f2f', '#e6c0aa'], ['#b05a3a', '#f0d0b8']],
  qun: [['#8b6a2c', '#dccda9'], ['#9a7a30', '#e8dab4'], ['#7a5a22', '#d4c393'], ['#a8843a', '#eeddb8']],
};

const WEAPONS = ['w-guandao', 'w-serpent', 'w-spear', 'w-halberd', 'w-blade', 'w-shield'];

const WEAPON_BY_TYPE: Record<string, string[]> = {
  blade: ['w-guandao', 'w-blade', 'w-halberd'],
  strategy: ['w-serpent', 'w-blade'],
  defense: ['w-shield'],
  command: ['w-halberd', 'w-guandao'],
  movement: ['w-spear', 'w-blade'],
  passive: WEAPONS,
};

const CARD_FILES = import.meta.glob('../assets/cards/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const CODEX_FILES = import.meta.glob('../assets/codex/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function basename(path: string, ext: string): string {
  return path.replace(/^.*\//, '').replace(ext, '');
}

const CARD_ART: Record<string, string> = Object.fromEntries(
  Object.entries(CARD_FILES).map(([path, url]) => [basename(path, '.png'), url]),
);
const CODEX_ART: Record<string, string> = Object.fromEntries(
  Object.entries(CODEX_FILES).map(([path, url]) => [basename(path, '.webp'), url]),
);

/** 多人共用的图版。 */
const SHARED_ART: Record<string, string> = {
  caocao: 'caocao-liubei',
  liubei: 'caocao-liubei',
  machao: 'zhangfei-machao',
  zhangfei: 'zhangfei-machao',
  diaochan: 'lvbu-diaochan',
  lvbu: 'lvbu-diaochan',
  dongzhuo: 'court-dong',
};

/** 独立立绘（全身、透明底）；只有这六名武将有卡面 PNG。 */
export function portraitFor(id: string): string | null {
  return CARD_ART[id] ?? null;
}

/** 图版背景（古版画或整幅场景），没有时由卡面的 SVG 剪影兜底。 */
export function plateFor(id: string): string | null {
  const direct = CODEX_ART[`${id}-plate`] ?? CODEX_ART[id];
  if (direct) return direct;
  const shared = SHARED_ART[id];
  if (shared) return CODEX_ART[shared] ?? null;
  return null;
}

/** 任意可用美术，用于出手顺序等小头像。 */
export function artFor(id: string): string | null {
  return portraitFor(id) ?? plateFor(id);
}

export interface UiMeta {
  role: string;
  tags: string[];
  blurb: string;
}

export const UI_META: Record<string, UiMeta> = uiMetaRaw as Record<string, UiMeta>;

export interface GeneralVisual {
  factionMeta: FactionMeta;
  accent: string;
  accent2: string;
  weapon: string;
  watermark: string;
  seal: string;
  rarity: number;
  /** 全身立绘 PNG，仅六名武将有。 */
  art: string | null;
  /** 图版背景，几乎全员都有。 */
  plate: string | null;
}

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function sealChar(name: string): string {
  const base = name.replace(/夫人$/, '').replace(/皇帝$/, '');
  return base[base.length - 1] ?? name[0] ?? '将';
}

export function visualFor(g: GeneralDef): GeneralVisual {
  const f = FACTION_META[g.faction];
  const palette = ACCENTS[g.faction];
  const h = hash(g.id);
  const [accent, accent2] = palette[h % palette.length];
  const first = SKILL_BY_ID[g.skills[0]];
  const type = first?.type ?? 'passive';
  const pool = WEAPON_BY_TYPE[type] ?? WEAPONS;
  return {
    factionMeta: f,
    accent,
    accent2,
    weapon: pool[h % pool.length],
    watermark: g.name[0] ?? '将',
    seal: sealChar(g.name),
    rarity: 5,
    art: portraitFor(g.id),
    plate: plateFor(g.id),
  };
}

export function metaFor(id: string): UiMeta {
  return UI_META[id] ?? { role: '武将', tags: [], blurb: '' };
}

export function general(id: string): GeneralDef {
  const g = GENERAL_BY_ID[id];
  if (!g) throw new Error(`找不到武将 ${id}`);
  return g;
}
