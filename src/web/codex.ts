/** 武将志：60 名武将，按势力分组，可按姓名 / 势力 / 战法 / 天赋搜索。 */
import { GENERALS, SKILL_BY_ID } from '../core/data';
import type { GeneralDef } from '../core/types';
import { cardHTML } from './cards';
import { FACTION_META, metaFor } from './meta';
import { app, FACTION_ORDER, type FactionFilter } from './store';
import { $ } from './ui';

const FILTERS: { key: FactionFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'wei', label: '魏' },
  { key: 'shu', label: '蜀' },
  { key: 'wu', label: '吴' },
  { key: 'qun', label: '群' },
];

function haystack(g: GeneralDef): string {
  const f = FACTION_META[g.faction];
  const m = metaFor(g.id);
  const skills = [...g.skills, ...(g.talents ?? [])]
    .map((id) => {
      const def = SKILL_BY_ID[id];
      return def ? `${def.name} ${def.desc}` : '';
    })
    .join(' ');
  return `${g.name} ${g.title} ${f.name} ${f.full} ${m.role} ${m.tags.join(' ')} ${skills}`;
}

function matches(g: GeneralDef): boolean {
  if (app.codexFilter !== 'all' && g.faction !== app.codexFilter) return false;
  const q = app.codexQuery.trim().toLowerCase();
  if (!q) return true;
  return haystack(g).toLowerCase().includes(q);
}

export function renderCodex(): void {
  const input = $<HTMLInputElement>('#cx-search');
  if (input && input.value !== app.codexQuery) input.value = app.codexQuery;
  renderFilters();
  renderCodexList();
}

function renderFilters(): void {
  const box = $('#cx-filters');
  if (!box) return;
  box.innerHTML = FILTERS.map((f) => {
    const count = f.key === 'all' ? GENERALS.length : GENERALS.filter((g) => g.faction === f.key).length;
    const on = app.codexFilter === f.key;
    return `<button class="cx-filter${on ? ' is-on' : ''}" type="button" data-cx-filter="${f.key}" aria-pressed="${on}"><b>${f.label}</b><span>${count}</span></button>`;
  }).join('');
}

export function renderCodexList(): void {
  const box = $('#cx-char-groups');
  const empty = $('#cx-char-empty');
  const clear = $('#cx-search-clear');
  if (!box) return;

  const list = GENERALS.filter(matches);
  if (clear) clear.hidden = app.codexQuery.length === 0;

  if (list.length === 0) {
    box.innerHTML = '';
    if (empty) {
      empty.hidden = false;
      empty.textContent = '没有匹配的武将。换个姓名、势力或战法名试试。';
    }
    return;
  }
  if (empty) empty.hidden = true;

  let cursor = 0;
  const groups = FACTION_ORDER.map((faction) => {
    const items = list.filter((g) => g.faction === faction);
    if (items.length === 0) return '';
    const f = FACTION_META[faction];
    const cards = items
      .map((g) => {
        const index = cursor;
        cursor += 1;
        return cardHTML(g, { context: 'roster', index });
      })
      .join('');
    return `<section class="cx-group" data-faction="${faction}" aria-label="${f.full}武将">
      <header class="cx-group-head" style="--accent:${f.accent}">
        <span class="cx-group-seal" aria-hidden="true">${f.name}</span>
        <div><h2>${f.full}</h2><p>${items.length} 名武将 · 两战法一天赋</p></div>
        <span class="cx-group-count">共 <b>${items.length}</b> 人</span>
      </header>
      <div class="cx-lineup">${cards}</div>
    </section>`;
  }).join('');

  box.innerHTML = groups;

  const live = $('#cx-live');
  if (live) {
    live.textContent = app.codexQuery
      ? `搜索「${app.codexQuery}」，找到 ${list.length} 名武将。`
      : `共 ${list.length} 名武将。`;
  }
}
