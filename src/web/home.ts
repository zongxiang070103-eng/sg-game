/** 点将台：一张主将卡、六张点将卡、势力筛选与翻页。 */
import { GENERALS } from '../core/data';
import { cardHTML } from './cards';
import { general, FACTION_META } from './meta';
import {
  app,
  filteredGenerals,
  homePageCount,
  homeRoster,
  type FactionFilter,
} from './store';
import { $, $$ } from './ui';

const FILTERS: { key: FactionFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'wei', label: '魏' },
  { key: 'shu', label: '蜀' },
  { key: 'wu', label: '吴' },
  { key: 'qun', label: '群' },
];

export function renderFeatured(): void {
  const box = $('#feature-card');
  if (!box) return;
  const g = general(app.featured);
  box.innerHTML = cardHTML(g, { context: 'feature' });
  const detailBtn = $('#home-detail');
  if (detailBtn) detailBtn.setAttribute('aria-label', `查看${g.name}详报`);
}

export function renderHome(): void {
  if (!filteredGenerals(app.rosterFilter).some((g) => g.id === app.featured)) {
    app.featured = filteredGenerals(app.rosterFilter)[0]?.id ?? GENERALS[0].id;
  }
  renderFeatured();
  renderFilters();
  renderRoster();
}

function renderFilters(): void {
  const box = $('#roster-filters');
  if (!box) return;
  box.innerHTML = FILTERS.map((f) => {
    const count = f.key === 'all' ? GENERALS.length : GENERALS.filter((g) => g.faction === f.key).length;
    const on = app.rosterFilter === f.key;
    return `<button class="faction-chip${on ? ' is-on' : ''}" type="button" data-roster-filter="${f.key}" aria-pressed="${on}">${f.label}<b>${count}</b></button>`;
  }).join('');
}

function renderRoster(): void {
  const box = $('#roster-grid');
  if (!box) return;
  box.innerHTML = homeRoster()
    .map((g, i) =>
      cardHTML(g, {
        context: 'roster',
        index: i,
        selected: g.id === app.featured,
      }),
    )
    .join('');

  const pager = $<HTMLButtonElement>('#roster-page');
  if (pager) {
    const total = homePageCount();
    pager.textContent = total > 1 ? `换一批 ${app.rosterPage + 1}/${total}` : '换一批';
    pager.disabled = total <= 1;
    pager.setAttribute('aria-label', `换一批点将，第 ${app.rosterPage + 1} 页，共 ${total} 页`);
  }

  const foot = $('.roster-foot');
  if (foot) {
    const count = filteredGenerals(app.rosterFilter).length;
    const label = app.rosterFilter === 'all' ? '全部势力' : FACTION_META[app.rosterFilter].full;
    foot.textContent = `${label} ${count} 人　十人编队　三人上场　倒下换将`;
  }
}

/** 点将：只换主将与高亮，不重排整组卡片。 */
export function selectFeatured(id: string): void {
  const def = GENERALS.find((g) => g.id === id);
  if (!def) return;
  app.featured = id;
  renderFeatured();
  $$('#roster-grid .card').forEach((card) => {
    const on = card.dataset.id === id;
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', String(on));
  });
}

export function setRosterFilter(key: FactionFilter): void {
  app.rosterFilter = key;
  app.rosterPage = 0;
  renderHome();
}

export function nextRosterPage(): void {
  const total = homePageCount();
  app.rosterPage = (app.rosterPage + 1) % total;
  renderRoster();
}
