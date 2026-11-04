/** 通用 DOM 小工具：弹窗、详报、提示。 */
import { general } from './meta';
import { detailHTML } from './cards';

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector(sel) as T | null;

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll(sel)) as T[];

let toastTimer = 0;

export function toast(message: string): void {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.remove('is-out');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.add('is-out');
    window.setTimeout(() => {
      el.hidden = true;
      el.classList.remove('is-out');
    }, 260);
  }, 2200);
}

let detailOpen = false;

export function openDetail(id: string, opener?: HTMLElement): void {
  const layer = $('#detail-layer');
  const panel = $('#detail-panel');
  if (!layer || !panel) return;
  let def;
  try {
    def = general(id);
  } catch {
    return;
  }
  panel.innerHTML = detailHTML(def);
  layer.hidden = false;
  layer.dataset.opener = opener?.dataset.id ?? '';
  detailOpen = true;
  document.body.classList.add('is-locked');
  $<HTMLButtonElement>('[data-detail-close]')?.focus({ preventScroll: true });
}

export function closeDetail(): void {
  const layer = $('#detail-layer');
  if (!layer || layer.hidden) return;
  layer.hidden = true;
  $('#detail-panel')!.innerHTML = '';
  detailOpen = false;
  if (!isAnyOverlayOpen()) document.body.classList.remove('is-locked');
}

export function isAnyOverlayOpen(): boolean {
  const detail = $('#detail-layer');
  const result = $('#result');
  const log = $('#log-panel');
  return Boolean(
    detailOpen ||
      (detail && !detail.hidden) ||
      (result && !result.hidden) ||
      (log && !log.hidden),
  );
}

export function handleEscape(): boolean {
  const log = $('#log-panel');
  if (log && !log.hidden) {
    closeLog();
    return true;
  }
  const result = $('#result');
  if (result && !result.hidden) {
    result.hidden = true;
    if (!isAnyOverlayOpen()) document.body.classList.remove('is-locked');
    return true;
  }
  if (detailOpen) {
    closeDetail();
    return true;
  }
  return false;
}

export function openLog(): void {
  const panel = $('#log-panel');
  const backdrop = $('#log-backdrop');
  if (!panel || !backdrop) return;
  panel.hidden = false;
  backdrop.hidden = false;
  document.body.classList.add('is-locked');
  $<HTMLButtonElement>('#log-close')?.focus({ preventScroll: true });
}

export function closeLog(): void {
  const panel = $('#log-panel');
  const backdrop = $('#log-backdrop');
  if (!panel || !backdrop) return;
  panel.hidden = true;
  backdrop.hidden = true;
  if (!isAnyOverlayOpen()) document.body.classList.remove('is-locked');
  $<HTMLButtonElement>('#log-toggle')?.focus({ preventScroll: true });
}
