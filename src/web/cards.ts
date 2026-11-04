/** 将星谱卡面：点将、布阵、战场、详报共用同一套卡片。 */
import { SKILL_BY_ID } from '../core/data';
import { SKILL_TYPE_LABEL } from '../core/skill';
import { describeStatus, isDebuff } from '../core/status';
import type { Faction, GeneralDef, Status, Unit } from '../core/types';
import { FACTION_META, metaFor, visualFor } from './meta';

export interface CardView {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  shield: number;
  statuses: Status[];
  alive: boolean;
}

export interface CardOptions {
  context?: 'home' | 'roster' | 'feature' | 'detail' | 'deploy' | 'battle-ally' | 'battle-enemy' | 'bench';
  index?: number;
  selected?: boolean;
  active?: boolean;
  target?: boolean;
  dead?: boolean;
  extraClass?: string;
}

export function viewOfGeneral(g: GeneralDef): CardView {
  return {
    id: g.id,
    name: g.name,
    title: g.title,
    faction: g.faction,
    hp: g.hp,
    maxHp: g.hp,
    atk: g.atk,
    def: g.def,
    spd: g.spd,
    shield: 0,
    statuses: [],
    alive: true,
  };
}

export function viewOfUnit(u: Unit): CardView {
  return {
    id: u.id,
    name: u.name,
    title: u.title,
    faction: u.faction,
    hp: Math.max(0, u.hp),
    maxHp: u.maxHp,
    atk: u.base.atk,
    def: u.base.def,
    spd: u.base.spd,
    shield: u.statuses.filter((s) => s.kind === 'shield').reduce((n, s) => n + (s.amount ?? 0), 0),
    statuses: u.statuses,
    alive: u.alive,
  };
}

const MAX_CARD_TAGS = 4;

export function statusTagsHTML(u: CardView): string {
  const tags = u.statuses.slice(0, MAX_CARD_TAGS).map((st) => {
    let text = st.label;
    if (st.kind === 'shield') text = `盾 ${st.amount ?? 0}`;
    if (st.kind === 'burn') text = `灼 ${st.amount ?? 0}`;
    if (st.kind === 'poison') text = `毒 ${st.amount ?? 0}`;
    return `<span class="tag ${st.kind}${isDebuff(st) ? ' is-bad' : ''}" title="${describeStatus(st)}">${text}</span>`;
  });
  const more = u.statuses.length - tags.length;
  if (more > 0) {
    const names = u.statuses
      .slice(MAX_CARD_TAGS)
      .map((st) => describeStatus(st))
      .join('；');
    tags.push(`<span class="tag is-more" title="${names}">＋${more}</span>`);
  }
  return tags.join('');
}

/** 卡面本体。`unit` 用来在战场上覆盖生命、护盾与状态。 */
export function cardHTML(g: GeneralDef, opts: CardOptions = {}, unit?: CardView): string {
  const v = unit ?? viewOfGeneral(g);
  const vis = visualFor(g);
  const f = FACTION_META[v.faction];
  const ctx = opts.context ?? 'home';
  const pct = v.maxHp > 0 ? Math.max(0, Math.min(100, (v.hp / v.maxHp) * 100)) : 0;
  const dead = opts.dead ?? !v.alive;
  const shield = v.shield;

  let aria = `${v.name}，${f.name}，${v.title}，生命 ${v.hp}${shield ? `，护盾 ${shield}` : ''}`;
  if (ctx === 'battle-enemy') aria += dead ? '，已败。点击打开详报。' : '。点击标为目标。';
  else if (ctx === 'battle-ally') aria += dead ? '，已败。点击打开详报。' : '。点击打开详报。';
  else if (ctx === 'feature' || ctx === 'detail') aria += '。点击打开详报。';
  else if (ctx === 'deploy' || ctx === 'bench') aria += '。点击查看。';
  else aria += '。点击设为主将。';

  const interactive = ctx !== 'detail';
  const roleAttrs = interactive ? ' role="button" tabindex="0"' : ' role="img"';
  const selected = opts.selected ? ' is-selected' : '';
  const pressed = opts.selected ? ' aria-pressed="true"' : '';
  const extra = opts.extraClass ? ` ${opts.extraClass}` : '';
  const scene = vis.scene;
  /** 图鉴与首页点将列很长，按需加载；战场、布阵与详报用即时加载，避免切屏时闪黑。 */
  const load = ctx === 'roster' ? 'loading="lazy"' : 'loading="eager"';
  const plate = !scene && vis.plate
    ? `<img class="card-plate" src="${vis.plate}" alt="" aria-hidden="true" draggable="false" ${load} decoding="async">`
    : '';
  const art = !scene && vis.art
    ? `<img class="card-glow" src="${vis.art}" alt="" aria-hidden="true" draggable="false">
        <img class="card-portrait" src="${vis.art}" alt="" draggable="false" ${load} decoding="async">`
    : '';
  const sceneImg = scene
    ? `<img class="card-scene-img" src="${scene}" alt="" aria-hidden="true" draggable="false" ${load} decoding="async">`
    : '';

  return `<article class="card${scene ? ' has-scene' : ''}${selected}${extra}" data-id="${v.id}" style="--accent:${vis.accent};--accent-2:${vis.accent2};--i:${opts.index ?? 0}"${roleAttrs}${pressed} aria-label="${aria}">
    <div class="card-frame">
      <div class="card-art${scene ? ' has-scene' : vis.art ? ' has-portrait' : ''}">
        <svg class="card-scene" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use href="#card-scene"/></svg>
        <div class="card-rays" aria-hidden="true"></div>
        <svg class="card-halo" viewBox="0 0 200 200" aria-hidden="true"><use href="#card-halo"/></svg>
        <svg class="card-weapon" viewBox="0 0 120 360" aria-hidden="true"><use href="#${vis.weapon}"/></svg>
        <span class="card-watermark" aria-hidden="true">${vis.watermark}</span>
        ${sceneImg}
        ${plate}
        ${art}
        <div class="card-scrim" aria-hidden="true"></div>
        <div class="card-shine" aria-hidden="true"></div>
        <div class="card-foil" aria-hidden="true"></div>
      </div>
      <div class="card-top" aria-hidden="true">
        <span class="card-faction card-faction--${v.faction}">${f.name}</span>
        <span class="card-pips">${'<i></i>'.repeat(vis.rarity)}</span>
      </div>
      <div class="card-name" aria-hidden="true">
        <span class="card-name-main">${v.name}</span>
        <span class="card-name-sub">${v.title}</span>
      </div>
      <span class="card-shield" aria-hidden="true"${shield > 0 ? '' : ' hidden'}>${shield}</span>
      <div class="card-seal" aria-hidden="true">${vis.seal}</div>
      <div class="card-foot">
        <div class="hp${pct < 30 ? ' is-low' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="${v.maxHp}" aria-valuenow="${v.hp}" aria-label="${v.name}生命">
          <span class="hp-track"><i style="width:${pct}%"></i></span><b class="hp-num">${v.hp}</b>
        </div>
        <div class="card-stats" aria-hidden="true"><span>攻<b>${v.atk}</b></span><span>防<b>${v.def}</b></span><span>速<b>${v.spd}</b></span></div>
      </div>
      ${v.statuses.length ? `<div class="card-statuses" aria-hidden="true">${statusTagsHTML(v)}</div>` : ''}
    </div>
  </article>`;
}

export function slotHTML(g: GeneralDef, opts: CardOptions, unit: CardView): string {
  const active = opts.active ? ' is-active' : '';
  const target = opts.target ? ' is-target' : '';
  const dead = !unit.alive ? ' is-dead' : '';
  return `<div class="card-slot${active}${target}${dead}" data-slot="${unit.id}" data-side="${opts.context === 'battle-ally' ? 'ally' : 'enemy'}">
    <span class="slot-tag slot-tag--active" aria-hidden="true">行动</span>
    <span class="slot-tag slot-tag--target" aria-hidden="true">目标</span>
    ${cardHTML(g, opts, unit)}
    <span class="dead-stamp" aria-hidden="true">败</span>
  </div>`;
}

/** 详报：卡片 + 五维 + 两个战法与一个天赋。 */
export function detailHTML(g: GeneralDef): string {
  const m = metaFor(g.id);
  const f = FACTION_META[g.faction];
  return `<button class="layer-close" data-detail-close aria-label="收起详报">
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-close"/></svg>
    </button>
    <div class="detail-card">${cardHTML(g, { context: 'detail' })}</div>
    <div class="detail-info">
      <p class="detail-faction">${f.full} · ${m.role}</p>
      <h2 id="detail-name">${g.name}</h2>
      <p class="detail-title">${g.title}</p>
      <p class="detail-lore">${m.blurb}</p>
      <dl class="detail-stats">
        ${statRow('生命', g.hp, 132)}
        ${statRow('攻击', g.atk, 34)}
        ${statRow('防御', g.def, 25)}
        ${statRow('智力', g.int, 35)}
        ${statRow('速度', g.spd, 19)}
      </dl>
      <h3>战法</h3>
      <ul class="detail-skills">${g.skills.map((id) => skillItem(id)).join('')}</ul>
      <h3>天赋</h3>
      <ul class="detail-skills">${(g.talents ?? []).map((id) => skillItem(id, true)).join('')}</ul>
      <div class="detail-tags">${m.tags.map((t) => `<span>${t}</span>`).join('')}</div>
    </div>`;
}

function statRow(label: string, value: number, max: number): string {
  return `<div><dt>${label}</dt><dd><b>${value}</b><span class="detail-bar"><i style="width:${Math.round(Math.min(100, (value / max) * 100))}%"></i></span></dd></div>`;
}

function skillItem(id: string, talent = false): string {
  const def = SKILL_BY_ID[id];
  if (!def) return '';
  return `<li class="detail-skill${talent ? ' is-talent' : ''}">
    <strong>${def.name}</strong>
    <span>${SKILL_TYPE_LABEL[def.type] ?? def.type} · ${talent ? '天赋' : `冷却 ${def.cd} 回合`}</span>
    <p>${def.desc}</p>
  </li>`;
}
