/** 布阵：从十人编队里挑三名首发。 */
import { cardHTML } from './cards';
import { general } from './meta';
import { app, FIELD_SIZE, playerSquad } from './store';
import { $, toast } from './ui';

export function renderDeploy(): void {
  const grid = $('#deploy-grid');
  const state = app.battle;
  if (!grid || !state) return;

  const squad = playerSquad(state);
  app.starters = app.starters.filter((id) => squad.includes(id));

  grid.innerHTML = squad
    .map((unitId, i) => {
      const unit = state.units.find((u) => u.id === unitId)!;
      const g = general(unit.generalId);
      const pick = app.starters.indexOf(unitId);
      return `<div class="deploy-slot${pick >= 0 ? ' is-picked' : ''}" data-starter="${unitId}">
        ${pick >= 0 ? `<span class="pick-no" aria-hidden="true">${pick + 1}</span>` : ''}
        ${cardHTML(g, {
          context: 'deploy',
          index: i,
          selected: pick >= 0,
        })}
      </div>`;
    })
    .join('');

  const n = app.starters.length;
  const count = $('#deploy-count');
  if (count) count.textContent = String(n);

  const note = $('#deploy-note');
  if (note) {
    note.textContent =
      n < FIELD_SIZE
        ? `已选 ${n} / ${FIELD_SIZE}　再点 ${FIELD_SIZE - n} 人首发`
        : `首发 ${FIELD_SIZE} 人已定　其余 ${squad.length - FIELD_SIZE} 人候补`;
    note.classList.toggle('is-ready', n === FIELD_SIZE);
  }

  const start = $<HTMLButtonElement>('#deploy-start');
  if (start) {
    start.disabled = n !== FIELD_SIZE;
    start.setAttribute('aria-label', n === FIELD_SIZE ? '开战' : `还需选择 ${FIELD_SIZE - n} 名首发`);
  }

  const seed = $('.seed b');
  if (seed) seed.textContent = String(squad.length);
}

export function toggleStarter(unitId: string): void {
  if (!app.battle) return;
  const idx = app.starters.indexOf(unitId);
  if (idx >= 0) {
    app.starters.splice(idx, 1);
  } else if (app.starters.length >= FIELD_SIZE) {
    toast(`首发最多 ${FIELD_SIZE} 人，先撤下一人`);
    return;
  } else {
    app.starters.push(unitId);
  }
  renderDeploy();
}
