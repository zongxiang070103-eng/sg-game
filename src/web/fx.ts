/** 战场反馈：飘字、斩击、冲击、横向光刃。全部是临时 DOM，动画结束即移除。 */
import { fastMode } from './url';

export const MOTION = !fastMode() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function pulse(el: Element | null, cls: string, ms = 340): void {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  window.setTimeout(() => el.classList.remove(cls), ms);
}

export function floatNum(slot: Element | null, text: string, kind = ''): void {
  if (!slot) return;
  const el = document.createElement('span');
  el.className = `dmg${kind ? ` dmg--${kind}` : ''}`;
  el.textContent = text;
  slot.appendChild(el);
  window.setTimeout(() => el.remove(), 1000);
}

function cleanup(nodes: Element[], ms: number): void {
  window.setTimeout(() => nodes.forEach((node) => node.remove()), ms);
}

export function addSlash(slot: Element | null): void {
  if (!slot) return;
  const a = document.createElement('i');
  a.className = 'slash';
  const b = document.createElement('i');
  b.className = 'slash slash--two';
  slot.append(a, b);
  cleanup([a, b], 520);
}

export function addImpact(slot: Element | null, kind: 'hit' | 'guard' | 'heal' = 'hit'): void {
  if (!MOTION || !slot) return;
  const colors = { hit: '#ff9c7a', guard: '#ffd98a', heal: '#8ef0c4' };
  const fx = colors[kind];
  const bits: Element[] = [];
  const ring = document.createElement('i');
  ring.className = `impact-ring${kind === 'heal' ? ' impact-ring--heal' : ''}`;
  ring.style.setProperty('--fx', fx);
  slot.appendChild(ring);
  bits.push(ring);

  const count = kind === 'heal' ? 5 : 7;
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('i');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
    const dist = 18 + Math.random() * 30;
    spark.className = 'spark';
    spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    spark.style.setProperty('--delay', `${i * 14}ms`);
    spark.style.setProperty('--fx', fx);
    slot.appendChild(spark);
    bits.push(spark);
  }
  cleanup(bits, 800);
}

export function addBeam(from: Element | null, to: Element | null, color?: string): void {
  if (!MOTION || !from || !to) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const x1 = a.left + a.width / 2;
  const y1 = a.top + a.height * 0.54;
  const x2 = b.left + b.width / 2;
  const y2 = b.top + b.height * 0.54;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const beam = document.createElement('i');
  beam.className = 'strike-beam';
  beam.style.left = `${x1}px`;
  beam.style.top = `${y1}px`;
  beam.style.width = `${len}px`;
  beam.style.rotate = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;
  beam.style.setProperty('--beam', color || '#f6dca6');
  document.body.appendChild(beam);
  cleanup([beam], 480);
}

export function flashTurn(): void {
  if (!MOTION) return;
  const center = document.querySelector('.battle-center');
  if (!center) return;
  center.classList.remove('is-turning');
  void (center as HTMLElement).offsetWidth;
  center.classList.add('is-turning');
  window.setTimeout(() => center.classList.remove('is-turning'), 760);
}
