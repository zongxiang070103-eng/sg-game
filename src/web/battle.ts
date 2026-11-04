/** 卡牌战场：把 src/core 的确定性战棋状态画成将星谱卡面，并驱动敌方 AI。 */
import { autoAction } from '../core/ai';
import {
  isDisarmed,
  isSilenced,
  skillReady,
  tauntSource,
  takeAction,
  type Action,
} from '../core/battle';
import { SKILL_BY_ID } from '../core/data';
import { SKILL_TYPE_LABEL } from '../core/skill';
import type { BattleState, Side, Unit } from '../core/types';
import { audio } from './audio';
import { cardHTML, slotHTML, viewOfUnit } from './cards';
import { addBeam, addImpact, addSlash, flashTurn, floatNum, MOTION, pulse } from './fx';
import { artFor, general } from './meta';
import { app, FIELD_SIZE, firstTarget, MAX_ROUNDS, playerSquad } from './store';
import { $, $$, openDetail, openLog, toast } from './ui';

const STEP_MS = MOTION ? 720 : 110;
const FINISH_MS = MOTION ? 640 : 120;
const CALLOUT_MS = MOTION ? 820 : 240;

let announcedTurn: string | null = null;
let stepTimer = 0;
let calloutTimer = 0;

function schedule(fn: () => void, ms: number): void {
  clearTimeout(stepTimer);
  stepTimer = window.setTimeout(fn, ms);
}

function unitOf(state: BattleState, id: string): Unit | undefined {
  return state.units.find((u) => u.id === id);
}

function shieldOf(unit: Unit): number {
  return unit.statuses.filter((st) => st.kind === 'shield').reduce((n, st) => n + (st.amount ?? 0), 0);
}

function slotOf(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.card-slot[data-slot="${id}"]`);
}

function actorAccent(unit: Unit): string {
  try {
    return general(unit.generalId).faction === 'wu' ? '#e2cbb8' : '#f6dca6';
  } catch {
    return '#f6dca6';
  }
}

/* ---------------- 渲染 ---------------- */

function emptySlot(): string {
  return '<div class="card-slot is-empty" aria-hidden="true"><span class="empty-mark">空</span></div>';
}

function cardForUnit(unit: Unit): string {
  return cardHTML(general(unit.generalId), { context: 'bench' }, viewOfUnit(unit));
}

function renderField(side: Side): string {
  const state = app.battle!;
  return state.field[side]
    .map((id, i) => {
      if (!id) return emptySlot();
      const unit = unitOf(state, id);
      if (!unit) return emptySlot();
      return slotHTML(
        general(unit.generalId),
        {
          context: side === 'player' ? 'battle-ally' : 'battle-enemy',
          index: i,
          active: side === 'player' && state.activeId === unit.id,
          target: side === 'enemy' && app.targetId === unit.id && unit.alive,
        },
        viewOfUnit(unit),
      );
    })
    .join('');
}

function renderBench(side: Side): string {
  const state = app.battle!;
  const ids = state.bench[side];
  const label = `<span class="bench-label">后援 ${ids.length}</span>`;
  if (ids.length === 0) return `${label}<span class="bench-empty">无</span>`;
  const cards = ids
    .map((id) => {
      const unit = unitOf(state, id);
      if (!unit) return '';
      return `<div class="bench-slot" data-bench="${unit.id}">${cardForUnit(unit)}</div>`;
    })
    .join('');
  return `${label}${cards}`;
}

export function renderBattle(animate = false): void {
  const state = app.battle;
  if (!state) return;
  ensureTarget(state);

  const battleEl = $('.battle');
  battleEl?.classList.toggle('is-refreshing', !animate);

  const enemyField = $('#enemy-team');
  const allyField = $('#ally-team');
  const enemyBench = $('#enemy-bench');
  const allyBench = $('#ally-bench');
  if (enemyField) enemyField.innerHTML = renderField('enemy');
  if (allyField) allyField.innerHTML = renderField('player');
  if (enemyBench) enemyBench.innerHTML = renderBench('enemy');
  if (allyBench) allyBench.innerHTML = renderBench('player');

  const roundNum = $('#round-num');
  const roundBig = $('#round-big');
  if (roundNum) roundNum.textContent = String(Math.max(1, state.round));
  if (roundBig) roundBig.textContent = String(Math.max(1, state.round));

  renderTurnStrip(state);
  renderActions(state);
  renderLog(state);
  renderHint(state);

  if (state.activeId && state.activeId !== announcedTurn) {
    const had = announcedTurn !== null;
    announcedTurn = state.activeId;
    if (had) {
      audio.turn();
      flashTurn();
    }
    const u = unitOf(state, state.activeId);
    const live = $('#battle-live');
    if (live && u) live.textContent = `第${state.round}回合，轮到${u.name}行动。`;
  }
}

function renderTurnStrip(state: BattleState): void {
  const box = $('#turn-strip');
  if (!box) return;
  const ids: string[] = [];
  if (state.activeId) ids.push(state.activeId);
  for (const id of state.queue) if (!ids.includes(id)) ids.push(id);

  if (ids.length === 0) {
    box.innerHTML = '<span class="turn-chip is-empty">—</span>';
    return;
  }

  box.innerHTML = ids
    .map((id) => {
      const u = unitOf(state, id);
      if (!u) return '';
      const g = general(u.generalId);
      const art = artFor(g.id);
      const active = state.activeId === id;
      const dead = !u.alive;
      const face = art
        ? `<img src="${art}" alt="" loading="lazy" decoding="async">`
        : `<span class="chip-letter" aria-hidden="true">${g.name[0]}</span>`;
      return `<span class="turn-chip${active ? ' is-active' : ''}${dead ? ' is-dead' : ''}"${active ? ' aria-current="step"' : ''} aria-label="${g.name}${active ? '，当前行动' : ''}${dead ? '，已败' : ''}" title="${g.name}">
        ${face}<span>${g.name}</span>
      </span>`;
    })
    .join('');
}

function renderActions(state: BattleState): void {
  const box = $('#action-bar');
  if (!box) return;

  if (state.phase === 'over') {
    box.innerHTML = `<div class="action-actor"><span class="action-actor-name">战局已定</span><span class="action-actor-title">${
      state.outcome === 'victory' ? '大捷' : '败北'
    }</span></div>
      <div class="action-list">
        <button class="action action--attack" data-act="result" type="button" aria-label="查看结算">
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-flag"/></svg>
          <span class="action-name">看结算</span><small>回合、存活、后援</small>
        </button>
        <button class="action action--detail" data-act="log" type="button" aria-label="打开战报">
          <span class="action-name">战报</span>
        </button>
      </div>`;
    return;
  }

  const activeId = state.activeId;
  const actor = activeId ? unitOf(state, activeId) : undefined;
  if (!actor) {
    box.innerHTML = '<div class="action-actor"><span class="action-actor-name">列阵中</span></div>';
    return;
  }

  const mine = actor.side === 'player';
  const g = general(actor.generalId);
  const disabled = !mine || app.busy;
  const silenced = isSilenced(actor);
  const disarmed = isDisarmed(actor);
  const taunter = tauntSource(state, actor);

  const skills = actor.skills
    .map((own) => {
      const def = SKILL_BY_ID[own.id];
      if (!def) return '';
      const cooling = own.cdLeft > 0;
      const blocked = cooling || silenced || !skillReady(actor, own.id);
      const note = cooling
        ? `冷却 ${own.cdLeft} 回合`
        : silenced
          ? '沉默中'
          : `${SKILL_TYPE_LABEL[def.type]} · 冷却 ${def.cd}`;
      return `<button class="action action--skill${cooling ? ' is-cooling' : ''}${silenced ? ' is-blocked' : ''}" data-act="skill" data-skill="${def.id}" type="button"${
        blocked || disabled ? ' disabled' : ''
      } title="${def.desc}" aria-label="施展${def.name}${cooling ? `，冷却 ${own.cdLeft} 回合` : ''}${silenced ? '，当前沉默' : ''}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-bolt"/></svg>
        <span class="action-name">${def.name}</span>
        <small>${note}</small>
        ${cooling ? `<i class="cd-badge">${own.cdLeft}</i>` : ''}
      </button>`;
    })
    .join('');

  box.innerHTML = `
    <div class="action-actor">
      <span class="action-actor-name">${actor.name}</span>
      <span class="action-actor-title">${actor.title}${mine ? '' : ' · 敌方'}</span>
    </div>
    <div class="action-list">
      <button class="action action--attack" data-act="attack" type="button"${
        disabled || disarmed ? ' disabled' : ''
      } aria-label="普攻${taunter ? `，只能攻击${taunter.name}` : ''}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-sword"/></svg>
        <span class="action-name">普攻</span><small>${disarmed ? '缴械中' : '攻击 100%'}</small>
      </button>
      ${skills}
      <button class="action action--defend" data-act="defend" type="button"${
        disabled ? ' disabled' : ''
      } aria-label="防御，防御提升 50%">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-shield"/></svg>
        <span class="action-name">防御</span><small>防御 +50%</small>
      </button>
      <button class="action action--detail" data-act="detail" type="button" aria-label="打开${g.name}详报">
        <span class="action-name">详报</span>
      </button>
      <button class="action action--detail" data-act="log" type="button" aria-label="打开战报">
        <span class="action-name">战报</span>
      </button>
    </div>`;
}

function renderLog(state: BattleState): void {
  const box = $('#log-list');
  if (!box) return;
  if (state.log.length === 0) {
    box.innerHTML = '<li class="log-empty">战报未开。</li>';
    return;
  }
  const items = state.log.slice(-90).reverse();
  box.innerHTML = items
    .map((e) => {
      const round = e.round > 0 ? `第${e.round}回合` : '序';
      const kind = e.kind === 'trigger' ? 'skill' : e.kind === 'death' ? 'hurt' : e.kind;
      return `<li class="log-item is-${kind}"><b>${round}</b><span>${e.text}</span></li>`;
    })
    .join('');
}

function renderHint(state: BattleState): void {
  const hint = $('#battle-hint');
  if (!hint) return;
  if (state.phase === 'over') {
    hint.textContent = state.outcome === 'victory' ? '敌军尽退　演武告捷' : '我军尽没　此战败北';
    return;
  }
  if (app.busy || (state.activeId && state.activeId.startsWith('E'))) {
    hint.textContent = '敌方行动中…';
    return;
  }
  const actor = state.activeId ? unitOf(state, state.activeId) : undefined;
  if (!actor) {
    hint.textContent = '列阵中…';
    return;
  }
  const taunter = tauntSource(state, actor);
  if (isDisarmed(actor)) hint.textContent = '已缴械　可施战法或防御';
  else if (isSilenced(actor)) hint.textContent = '已沉默　可普攻或防御';
  else if (taunter) hint.textContent = `受${taunter.name}嘲讽　只能攻击他`;
  else hint.textContent = '点敌将改目标　再选战法';
}

/* ---------------- 目标 ---------------- */

export function ensureTarget(state: BattleState): string | null {
  const current = app.targetId ? unitOf(state, app.targetId) : undefined;
  if (current && current.alive && current.side === 'enemy' && state.field.enemy.includes(current.id)) {
    return current.id;
  }
  const next = firstTarget(state);
  app.targetId = next;
  return next;
}

export function selectTarget(unitId: string): void {
  const state = app.battle;
  if (!state || app.busy || state.phase !== 'battle') return;
  const unit = unitOf(state, unitId);
  if (!unit || !unit.alive || unit.side !== 'enemy' || !state.field.enemy.includes(unit.id)) return;
  app.targetId = unit.id;
  audio.target();
  syncTargets();
  renderHint(state);
}

function syncTargets(): void {
  const state = app.battle;
  if (!state) return;
  $$('#enemy-team .card-slot').forEach((slot) => {
    const id = slot.dataset.slot;
    slot.classList.toggle('is-target', Boolean(id) && id === app.targetId);
  });
}

/* ---------------- 玩家行动 ---------------- */

function canAct(): boolean {
  const state = app.battle;
  return Boolean(
    state &&
      state.phase === 'battle' &&
      !app.busy &&
      state.activeId &&
      state.activeId.startsWith('P'),
  );
}

function tauntOverride(state: BattleState, actor: Unit): string | null {
  const taunter = tauntSource(state, actor);
  return taunter ? taunter.id : null;
}

export function playerAttack(): void {
  const state = app.battle;
  if (!state || !canAct()) return;
  const actor = unitOf(state, state.activeId!)!;
  const targetId = tauntOverride(state, actor) ?? ensureTarget(state);
  if (!targetId) {
    toast('场上没有可攻击的目标');
    return;
  }
  app.targetId = targetId;
  commitAction({ type: 'attack', actorId: actor.id, targetId });
}

export function playerSkill(skillId: string): void {
  const state = app.battle;
  if (!state || !canAct()) return;
  const actor = unitOf(state, state.activeId!)!;
  const def = SKILL_BY_ID[skillId];
  if (!def) return;
  const action: Action = { type: 'skill', actorId: actor.id, skillId };
  if (def.target === 'enemy') {
    const targetId = tauntOverride(state, actor) ?? ensureTarget(state);
    if (!targetId) {
      toast('该战法需要选择目标');
      return;
    }
    app.targetId = targetId;
    action.targetId = targetId;
  }
  commitAction(action);
}

export function playerDefend(): void {
  const state = app.battle;
  if (!state || !canAct()) return;
  commitAction({ type: 'defend', actorId: state.activeId! });
}

export function openActorDetail(): void {
  const state = app.battle;
  if (!state || !state.activeId) return;
  const unit = unitOf(state, state.activeId);
  if (!unit) return;
  openDetail(unit.generalId);
}

function damageDealt(prev: BattleState, next: BattleState, actorId: string): number {
  if (!actorId.startsWith('P')) return 0;
  let total = 0;
  for (const unit of prev.units) {
    if (unit.side !== 'enemy') continue;
    const after = next.units.find((u) => u.id === unit.id);
    if (!after) continue;
    total += Math.max(0, unit.hp - after.hp);
    total += Math.max(0, shieldOf(unit) - shieldOf(after));
  }
  return total;
}

function commitAction(action: Action): void {
  const prev = app.battle;
  if (!prev) return;
  let next: BattleState;
  try {
    next = takeAction(prev, action);
  } catch (err) {
    toast((err as Error).message);
    renderBattle(false);
    return;
  }

  app.damage += damageDealt(prev, next, action.actorId);
  app.battle = next;
  app.busy = true;
  ensureTarget(next);

  if (action.type === 'attack') audio.attack();
  else if (action.type === 'skill') {
    audio.skill();
    const actor = unitOf(prev, action.actorId);
    const def = SKILL_BY_ID[action.skillId];
    if (actor && def) showCallout(actor.name, def.name);
  } else audio.shield();

  renderBattle(false);
  animateDiff(prev, next, action.actorId);
  schedule(afterStep, STEP_MS);
}

function afterStep(): void {
  const state = app.battle;
  if (!state) return;
  if (state.phase === 'over') {
    app.busy = false;
    renderBattle(false);
    schedule(showResult, FINISH_MS);
    return;
  }
  if (state.activeId && state.activeId.startsWith('E')) {
    runEnemyTurn();
    return;
  }
  app.busy = false;
  renderBattle(false);
}

/* ---------------- 敌方 AI ---------------- */

function runEnemyTurn(): void {
  const state = app.battle;
  if (!state || state.phase !== 'battle') return;
  let action: Action;
  try {
    action = autoAction(state);
  } catch {
    app.busy = false;
    renderBattle(false);
    return;
  }
  commitAction(action);
}

/* ---------------- 进入战场 ---------------- */

export function enterBattle(): void {
  const state = app.battle;
  if (!state) return;
  announcedTurn = null;
  ensureTarget(state);
  app.busy = Boolean(state.activeId?.startsWith('E'));
  renderBattle(true);
  if (state.phase === 'over') {
    schedule(showResult, FINISH_MS);
  } else if (state.activeId?.startsWith('E')) {
    schedule(runEnemyTurn, MOTION ? 620 : 120);
  }
}

/* ---------------- 动画 ---------------- */

function animateDiff(prev: BattleState, next: BattleState, actorId?: string): void {
  const actor = actorId ? unitOf(prev, actorId) : undefined;
  const actorSlot = actor ? slotOf(actor.id) : null;
  const beamColor = actor ? actorAccent(actor) : '#f6dca6';

  for (const unit of next.units) {
    const before = prev.units.find((u) => u.id === unit.id);
    if (!before) continue;
    const slot = slotOf(unit.id);
    const hpLoss = Math.max(0, before.hp - unit.hp);
    const healed = Math.max(0, unit.hp - before.hp);
    const shieldBefore = shieldOf(before);
    const shieldAfter = shieldOf(unit);
    const shieldGain = shieldAfter - shieldBefore;

    if (hpLoss > 0) {
      audio.hit(0, shieldBefore > shieldAfter);
      if (slot) {
        slot.classList.add('is-hit');
        window.setTimeout(() => slot.classList.remove('is-hit'), 340);
        addSlash(slot);
        addBeam(actorSlot, slot, beamColor);
        addImpact(slot, 'hit');
        floatNum(slot, `-${hpLoss}`);
      }
      if (before.alive && !unit.alive) {
        audio.ko(0.1);
        if (slot) {
          pulse(slot, 'is-breaking', 820);
        }
      }
    } else if (shieldBefore > 0 && shieldAfter === 0) {
      if (slot) floatNum(slot, '盾破', 'shield');
    }

    if (healed > 0) {
      audio.heal(0.06);
      if (slot) {
        addImpact(slot, 'heal');
        floatNum(slot, `+${healed}`, 'heal');
      }
    }

    if (shieldGain > 0) {
      audio.shield();
      if (slot) {
        addImpact(slot, 'guard');
        floatNum(slot, `盾 +${shieldGain}`, 'shield');
      }
    }
  }

  const replaced = next.units.find(
    (u) => u.alive && next.field[u.side].includes(u.id) && !prev.field[u.side].includes(u.id),
  );
  if (replaced) pulse(slotOf(replaced.id), 'is-turn', 760);
}

function showCallout(user: string, name: string): void {
  const box = $('#skill-callout');
  if (!box) return;
  const u = $('#callout-user');
  const n = $('#callout-name');
  if (u) u.textContent = user;
  if (n) n.textContent = name;
  box.hidden = false;
  box.classList.remove('is-cast');
  void box.offsetWidth;
  box.classList.add('is-cast');
  clearTimeout(calloutTimer);
  calloutTimer = window.setTimeout(() => {
    box.hidden = true;
    box.classList.remove('is-cast');
  }, CALLOUT_MS);
}

/* ---------------- 结算 ---------------- */

/** 离开战局：停掉 AI 计时器并丢弃本场状态。 */
export function abandonBattle(): void {
  clearTimeout(stepTimer);
  app.battle = null;
  app.starters = [];
  app.targetId = null;
  app.busy = false;
  app.resultShown = false;
  app.damage = 0;
  announcedTurn = null;
}

export function showResult(): void {
  const state = app.battle;
  const modal = $('#result');
  if (!state || !modal || state.phase !== 'over') return;

  const victory = state.outcome === 'victory';
  const alive = state.units.filter((u) => u.side === 'player' && u.alive).length;
  const bench = state.bench.player.length;
  const rank = victory ? (state.round <= 10 && alive >= 2 ? 'S' : state.round <= 18 ? 'A' : 'B') : 'C';

  modal.hidden = false;
  modal.classList.toggle('is-lose', !victory);
  document.body.classList.add('is-locked');

  const stamp = $('#result-stamp');
  if (stamp) stamp.textContent = victory ? '大捷' : '败北';
  const kicker = $('#result-kicker');
  if (kicker) kicker.textContent = victory ? '敌军尽退，演武告捷' : '我军尽没，鸣金收兵';
  const rankEl = $('#result-rank');
  if (rankEl) rankEl.textContent = rank;
  const roundEl = $('#result-round');
  if (roundEl) roundEl.textContent = String(state.round);
  const aliveEl = $('#result-alive');
  if (aliveEl) aliveEl.textContent = String(alive);
  const benchEl = $('#result-bench');
  if (benchEl) benchEl.textContent = String(bench);
  const damageEl = $('#result-damage');
  if (damageEl) damageEl.textContent = String(Math.round(app.damage));
  const note = $('#result-note');
  if (note) {
    const tail = `本场打出 ${Math.round(app.damage)} 点伤害。`;
    note.textContent = victory
      ? `十人编队还剩 ${alive} 人在场，${bench > 0 ? `后援尚有 ${bench} 人` : '后援已尽'}。${tail}`
      : `第 ${state.round} 回合收兵，${bench > 0 ? `尚有 ${bench} 名后援未及登场` : '十人尽没，后援已绝'}。${tail}`;
  }

  if (victory) audio.win();
  else audio.lose();
}

export function openResultOrLog(): void {
  const state = app.battle;
  if (!state) return;
  if (state.phase === 'over') {
    showResult();
  } else {
    openLog();
    toast('胜负未分，先看战报');
  }
}

/** 布阵完成后由 main 调用；返回是否成功开战。 */
export function battleSummary(): { round: number; alive: number; bench: number; damage: number } | null {
  const state = app.battle;
  if (!state) return null;
  return {
    round: state.round,
    alive: state.units.filter((u) => u.side === 'player' && u.alive).length,
    bench: state.bench.player.length,
    damage: Math.round(app.damage),
  };
}

export const BATTLE_META = { fieldSize: FIELD_SIZE, maxRounds: MAX_ROUNDS, squad: playerSquad };
