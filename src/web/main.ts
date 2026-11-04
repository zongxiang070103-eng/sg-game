/** 将星谱入口：一个页面，四个屏幕；战斗规则来自 src/core。 */
import './style.css';
import './codex.css';
import './merged.css';

import { deploy } from '../core/battle';
import { bindAudioControls, syncAudioControls, unlockAudio } from './audio';
import {
  abandonBattle,
  debugFinish,
  enterBattle,
  openActorDetail,
  openResultOrLog,
  playerAttack,
  playerDefend,
  playerSkill,
  renderBattle,
  selectTarget,
  showResult,
} from './battle';
import { renderCodex, renderCodexList } from './codex';
import { applyDeepLink } from './deeplink';
import { renderDeploy, toggleStarter } from './deploy';
import { renderHome, nextRosterPage, selectFeatured, setRosterFilter } from './home';
import { app, newRun, type Screen } from './store';
import { fastMode, seedParam } from './url';
import {
  $,
  $$,
  closeDetail,
  closeLog,
  handleEscape,
  openDetail,
  openLog,
  toast,
} from './ui';
import type { FactionFilter } from './store';

const SCREENS: Screen[] = ['home', 'deploy', 'battle', 'codex'];

/* ---------------- 路由 ---------------- */

function parseHash(): Screen {
  const name = (location.hash.split('?')[0] ?? '').replace(/^#\/?/, '') as Screen;
  return SCREENS.includes(name) ? name : 'home';
}

function nav(screen: Screen): void {
  if (parseHash() === screen) applyScreen(screen);
  else location.hash = `#/${screen}`;
}

function hideOverlays(): void {
  closeDetail();
  closeLog();
  const result = $('#result');
  if (result) result.hidden = true;
}

function applyScreen(screen: Screen): void {
  if ((screen === 'deploy' || screen === 'battle') && !app.battle) {
    location.hash = '#/home';
    return;
  }
  if (app.battle) {
    if (screen === 'deploy' && app.battle.phase !== 'deploy') {
      location.hash = '#/battle';
      return;
    }
    if (screen === 'battle' && app.battle.phase === 'deploy') {
      location.hash = '#/deploy';
      return;
    }
  }

  hideOverlays();
  document.body.classList.remove('is-locked');
  app.screen = screen;
  document.body.dataset.screen = screen;
  $$('.screen').forEach((el) => el.classList.toggle('is-active', el.id === `screen-${screen}`));

  if (screen === 'home') renderHome();
  else if (screen === 'deploy') renderDeploy();
  else if (screen === 'battle') enterBattle();
  else renderCodex();
}

/* ---------------- 开场 ---------------- */

function startNewRun(): void {
  newRun(seedParam() ?? undefined);
  nav('deploy');
}

function beginBattle(): void {
  const state = app.battle;
  if (!state) return;
  try {
    app.battle = deploy(state, app.starters.slice());
  } catch (err) {
    toast((err as Error).message);
    return;
  }
  app.busy = false;
  nav('battle');
}

/* ---------------- 点击分发 ---------------- */

function closest<T extends Element>(target: EventTarget | null, sel: string): T | null {
  return target instanceof Element ? (target.closest(sel) as T | null) : null;
}

function onClick(event: MouseEvent): void {
  const target = event.target;

  const go = closest<HTMLElement>(target, '[data-go]');
  if (go) {
    const screen = go.dataset.go as Screen;
    if (screen === 'home' && (app.screen === 'battle' || app.screen === 'deploy')) abandonBattle();
    nav(screen);
    return;
  }

  const audioBtn = closest<HTMLButtonElement>(target, '[data-audio-toggle]');
  if (audioBtn) return; // audio.ts 自己处理

  if (closest(target, '[data-detail-close]')) {
    closeDetail();
    return;
  }
  if (target instanceof Element && target.id === 'detail-layer') {
    closeDetail();
    return;
  }
  if (closest(target, '#log-close') || closest(target, '#log-backdrop')) {
    closeLog();
    return;
  }
  if (closest(target, '#log-toggle')) {
    openLog();
    return;
  }
  if (closest(target, '#result-open')) {
    openResultOrLog();
    return;
  }
  if (target instanceof Element && target.id === 'result') {
    const result = $('#result');
    if (result) result.hidden = true;
    document.body.classList.remove('is-locked');
    return;
  }

  const act = closest<HTMLElement>(target, '[data-act]');
  if (act) {
    const kind = act.dataset.act;
    if (kind === 'attack') playerAttack();
    else if (kind === 'skill' && act.dataset.skill) playerSkill(act.dataset.skill);
    else if (kind === 'defend') playerDefend();
    else if (kind === 'detail') openActorDetail();
    else if (kind === 'log') openLog();
    else if (kind === 'result') showResult();
    return;
  }

  const starter = closest<HTMLElement>(target, '[data-starter]');
  if (starter) {
    if (starter.dataset.starter) toggleStarter(starter.dataset.starter);
    return;
  }

  const rosterFilter = closest<HTMLElement>(target, '[data-roster-filter]');
  if (rosterFilter) {
    setRosterFilter((rosterFilter.dataset.rosterFilter ?? 'all') as FactionFilter);
    return;
  }
  if (closest(target, '#roster-page')) {
    nextRosterPage();
    return;
  }
  if (closest(target, '#home-cta')) {
    startNewRun();
    return;
  }
  if (closest(target, '#home-detail')) {
    openDetail(app.featured);
    return;
  }
  if (closest(target, '#deploy-start')) {
    beginBattle();
    return;
  }
  if (closest(target, '#result-again')) {
    startNewRun();
    return;
  }
  if (closest(target, '[data-toast]')) {
    const btn = closest<HTMLElement>(target, '[data-toast]');
    if (btn?.dataset.toast) toast(btn.dataset.toast);
    return;
  }

  const cxFilter = closest<HTMLElement>(target, '[data-cx-filter]');
  if (cxFilter) {
    app.codexFilter = (cxFilter.dataset.cxFilter ?? 'all') as FactionFilter;
    renderCodex();
    return;
  }
  if (closest(target, '#cx-search-clear')) {
    app.codexQuery = '';
    renderCodex();
    $<HTMLInputElement>('#cx-search')?.focus();
    return;
  }

  const bench = closest<HTMLElement>(target, '[data-bench]');
  if (bench && app.battle) {
    const unit = app.battle.units.find((u) => u.id === bench.dataset.bench);
    if (unit) {
      openDetail(unit.generalId, bench);
      return;
    }
  }

  const slot = closest<HTMLElement>(target, '.card-slot[data-slot]');
  if (slot && app.battle) {
    const id = slot.dataset.slot!;
    const unit = app.battle.units.find((u) => u.id === id);
    if (unit?.side === 'enemy') {
      selectTarget(id);
    } else if (unit) {
      openDetail(unit.generalId, slot);
    }
    return;
  }

  const homeCard = closest<HTMLElement>(target, '#roster-grid .card');
  if (homeCard?.dataset.id) {
    selectFeatured(homeCard.dataset.id);
    return;
  }

  const featureCard = closest<HTMLElement>(target, '#feature-card .card');
  if (featureCard?.dataset.id) {
    openDetail(featureCard.dataset.id, featureCard);
    return;
  }

  const codexCard = closest<HTMLElement>(target, '#cx-char-groups .card');
  if (codexCard?.dataset.id) {
    openDetail(codexCard.dataset.id, codexCard);
    return;
  }
}

/* ---------------- 搜索与键盘 ---------------- */

function bindSearch(): void {
  const input = $<HTMLInputElement>('#cx-search');
  if (!input) return;
  input.addEventListener('input', () => {
    app.codexQuery = input.value;
    renderCodexList();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.value = '';
      app.codexQuery = '';
      renderCodex();
      input.blur();
    }
  });
}

function bindKeyboard(): void {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (handleEscape()) event.preventDefault();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.closest('button, input, textarea, select, a')) return;
    const card = el.closest<HTMLElement>('.card[role="button"]');
    if (card) {
      event.preventDefault();
      card.click();
    }
  });
}

/* ---------------- 启动 ---------------- */

function boot(): void {
  document.documentElement.classList.toggle('is-fast', fastMode());
  bindAudioControls();
  syncAudioControls();
  bindSearch();
  bindKeyboard();
  document.addEventListener('click', onClick);
  document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  window.addEventListener('hashchange', () => applyScreen(parseHash()));

  const deep = applyDeepLink();
  if (deep) {
    if (parseHash() !== deep) history.replaceState(null, '', `#/${deep}`);
    applyScreen(deep);
    return;
  }

  if (!location.hash) history.replaceState(null, '', '#/home');
  applyScreen(parseHash());
}

boot();

// 控制台调试入口，方便二次开发与自动化 QA。
(window as unknown as { jiangxing?: unknown }).jiangxing = {
  app,
  renderBattle,
  showResult,
  debug: { finish: debugFinish, go: nav, newRun },
};
