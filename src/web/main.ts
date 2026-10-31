import './style.css';
import { autoAction } from '../core/ai';
import {
  createBattle,
  deploy,
  effectiveStat,
  fieldUnitsOf,
  isDisarmed,
  isSilenced,
  takeAction,
  tauntSource,
  unitById,
  type Action,
} from '../core/battle';
import { CONFIG } from '../core/config';
import { GENERAL_BY_ID, GENERALS, SKILL_BY_ID } from '../core/data';
import { describeStatus } from '../core/status';
import type { BattleState, Faction, GeneralDef, Side, StatKey, Unit } from '../core/types';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('缺少 #app 容器');

const randomSeed = (): number => Math.floor(Math.random() * 1_000_000_000);

const FACTION_LABEL: Record<Faction, string> = { wei: '魏', shu: '蜀', wu: '吴', qun: '群' };

const STAT_TEXT: Record<StatKey, string> = {
  atk: '攻击',
  def: '防御',
  int: '智力',
  spd: '速度',
};

type Screen = 'home' | 'game';
type HomeView = 'main' | 'roster' | 'growth';
type RosterFilter = 'all' | Faction;

let screen: Screen = 'home';
let homeView: HomeView = 'main';
let rosterFilter: RosterFilter = 'all';
let showGeneralId: string | null = null;

let game: BattleState = createBattle(randomSeed());
let picked = new Set<string>();
/** 需要玩家点选敌人的操作（普攻或单体技能）。 */
let pending: { type: 'attack' | 'skill'; skillId?: string } | null = null;
let hint = '';
let enemyTimer = 0;
/** 布阵时右侧详情面板展示的武将。 */
let inspectId: string | null = null;
let logOpen = window.matchMedia('(min-width: 900px)').matches;
let exitArmed = false;
let exitTimer = 0;

/* ---------------- 渲染入口 ---------------- */

function render(): void {
  app!.innerHTML = screen === 'home' ? renderHome() : renderGame();
  scrollLog();
  refreshTip();
  scheduleEnemy();
}

/* ---------------- 主城 ---------------- */

function renderHome(): string {
  const body =
    homeView === 'main'
      ? renderHomeMain()
      : homeView === 'roster'
        ? renderRoster()
        : renderGrowth();

  return `
    <div class="game-app home-app">
      <header class="home-hud">
        <div class="home-brand">
          <span class="brand-seal">战</span>
          <span class="brand-name">战棋</span>
        </div>
        <span class="home-ver">原创战棋 · 明牌对决</span>
      </header>
      ${body}
      <nav class="main-nav" aria-label="主菜单">
        ${navButton('main', '城', '主城')}
        ${navButton('roster', '将', '武将')}
        ${navButton('growth', '升', '成长')}
      </nav>
    </div>
    ${showGeneralId ? renderGeneralModal(showGeneralId) : ''}
  `;
}

function navButton(view: HomeView, glyph: string, label: string): string {
  return `
    <button class="nav-btn ${homeView === view ? 'active' : ''}" data-nav="${view}">
      <span class="nav-glyph">${glyph}</span>
      <span>${label}</span>
    </button>
  `;
}

function renderHomeMain(): string {
  return `
    <main class="home-main">
      <section class="home-hero">
        <div class="hero-ring">
          <div class="hero-emblem"><span>战</span></div>
        </div>
        <h1>战棋</h1>
        <p class="hero-sub">明牌列阵 · 胜负在出手之间</p>
        <p class="hero-note">十人编队，三人上阵；二十员武将，四十个技能。</p>
        <div class="hero-actions">
          <button class="primary big" data-act="go-deploy">出 征</button>
          <button class="ghost" data-nav="roster">武将图鉴</button>
        </div>
      </section>
      <section class="home-cards">
        <article class="feature-card">
          <span class="feature-glyph">阵</span>
          <h3>十人编队</h3>
          <p>三人首发，七人后援。倒下一个，立刻有人接替上阵。</p>
        </article>
        <article class="feature-card">
          <span class="feature-glyph">技</span>
          <h3>四十技能</h3>
          <p>冷却、控制、增益、减益、持续伤害，全靠技能交换。</p>
        </article>
        <article class="feature-card">
          <span class="feature-glyph">速</span>
          <h3>速度出手</h3>
          <p>没有随机数。谁先动、打谁、留什么技能，都能复盘。</p>
        </article>
      </section>
    </main>
  `;
}

function renderRoster(): string {
  const list = GENERALS.filter((g) => rosterFilter === 'all' || g.faction === rosterFilter);
  return `
    <main class="home-main roster-main">
      <div class="section-head">
        <div>
          <h2>武将图鉴</h2>
          <p class="section-sub">二十员武将 · 每人两个专属技能</p>
        </div>
        <span class="section-count">${list.length} / ${GENERALS.length}</span>
      </div>
      <div class="filter-row">
        ${filterButton('all', '全部')}
        ${filterButton('wei', '魏')}
        ${filterButton('shu', '蜀')}
        ${filterButton('wu', '吴')}
      </div>
      <div class="general-grid">${list.map(renderGeneralCard).join('')}</div>
    </main>
  `;
}

function filterButton(filter: RosterFilter, label: string): string {
  return `<button class="filter-btn ${rosterFilter === filter ? 'active' : ''}" data-filter="${filter}">${label}</button>`;
}

function renderGeneralCard(g: GeneralDef): string {
  return `
    <button class="general-card faction-${g.faction}" data-general="${g.id}">
      <span class="gc-faction">${FACTION_LABEL[g.faction]}</span>
      <span class="gc-portrait"><span class="gc-glyph">${g.name[0]}</span></span>
      <span class="gc-name">${g.name}</span>
      <span class="gc-title">${g.title}</span>
    </button>
  `;
}

function renderGrowth(): string {
  return `
    <main class="home-main growth-main">
      <div class="section-head">
        <div>
          <h2>成长</h2>
          <p class="section-sub">下一阶段，武将会带着自己的成长走进战场</p>
        </div>
        <span class="soon-tag">筹备中</span>
      </div>
      <p class="growth-lead">
        当前版本是完整的单局战斗。成长系统会在后续版本接入，让每一名武将都有自己的等级、战功与搭配。
      </p>
      <div class="growth-grid">
        ${growthCard('级', '等级与战功', '战斗结算获得战功，升级提升生命与四维，让老将越打越强。')}
        ${growthCard('技', '技能强化', '消耗战功提升技能倍率、延长控制回合，或缩短关键技能的冷却。')}
        ${growthCard('装', '装备', '武器、防具、坐骑分槽位，提供属性与特殊词条。')}
        ${growthCard('缘', '缘分搭配', '同势力或同阵营的武将同时上阵，激活额外加成。')}
      </div>
      <p class="growth-note">成长与存档会放在后续版本；现在可以先在「出征」里打一局。</p>
    </main>
  `;
}

function growthCard(glyph: string, title: string, desc: string): string {
  return `
    <article class="growth-card">
      <span class="growth-glyph">${glyph}</span>
      <div>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
      <span class="soon-tag">筹备中</span>
    </article>
  `;
}

function renderGeneralModal(id: string): string {
  const g = GENERAL_BY_ID[id];
  if (!g) return '';
  return `
    <div class="modal-backdrop">
      <div class="general-modal faction-${g.faction}" role="dialog" aria-modal="true" aria-label="${g.name}">
        <button class="modal-close" data-act="close-modal" aria-label="关闭">×</button>
        ${renderGeneralDetail(g)}
      </div>
    </div>
  `;
}

function renderGeneralDetail(g: GeneralDef): string {
  const skills = g.skills
    .map((id) => {
      const def = SKILL_BY_ID[id];
      if (!def) return '';
      return `
        <div class="detail-skill faction-${g.faction}">
          <div class="detail-skill-head"><b>${def.name}</b><span>CD ${def.cd}</span></div>
          <p>${def.desc}</p>
        </div>
      `;
    })
    .join('');

  return `
    <div class="detail-hero">
      <div class="detail-portrait faction-${g.faction}"><span>${g.name[0]}</span></div>
      <div class="detail-head">
        <span class="faction-chip faction-${g.faction}">${FACTION_LABEL[g.faction]}</span>
        <h2>${g.name}</h2>
        <p>${g.title}</p>
      </div>
    </div>
    <div class="stat-grid">
      <div><span>生命</span><b>${g.hp}</b></div>
      <div><span>攻击</span><b>${g.atk}</b></div>
      <div><span>防御</span><b>${g.def}</b></div>
      <div><span>智力</span><b>${g.int}</b></div>
      <div><span>速度</span><b>${g.spd}</b></div>
      <div><span>势力</span><b>${FACTION_LABEL[g.faction]}</b></div>
    </div>
    <div class="detail-skills">${skills}</div>
  `;
}

/* ---------------- 游戏：布阵 / 战斗 ---------------- */

function renderGame(): string {
  return game.phase === 'deploy' ? renderDeploy() : renderBattle();
}

function renderDeploy(): string {
  const pickedIds = [...picked];
  const slots = Array.from({ length: CONFIG.fieldSize }, (_, i) => {
    const id = pickedIds[i];
    if (!id) {
      return `<div class="slot-empty"><span>${i + 1}</span><em>选择首发</em></div>`;
    }
    const u = unitById(game, id);
    return `
      <button class="slot-card faction-${u.faction}" data-pick="${u.id}" title="点击移出首发">
        <span class="slot-order">${i + 1}</span>
        <span class="slot-glyph">${u.name[0]}</span>
        <span class="slot-name">${u.name}</span>
        <span class="slot-stat">生命 ${u.maxHp}</span>
      </button>
    `;
  }).join('');

  const cards = game.bench.player
    .map((id) => {
      const u = unitById(game, id);
      const order = pickedIds.indexOf(u.id);
      const on = order >= 0;
      return `
        <button class="pick-card faction-${u.faction} ${on ? 'on' : ''}" data-pick="${u.id}" data-inspect="${u.id}">
          <span class="pick-portrait"><span class="pick-glyph">${u.name[0]}</span></span>
          <span class="pick-info">
            <span class="pick-name">${u.name}</span>
            <span class="pick-title">${u.title}</span>
          </span>
          <span class="pick-mark">${on ? `第 ${order + 1} 位` : '待选'}</span>
        </button>
      `;
    })
    .join('');

  const focusId = inspectId ?? pickedIds[0] ?? null;
  const focus = focusId ? game.units.find((u) => u.id === focusId) : null;

  return `
    <div class="game-app deploy-app">
      <header class="game-hud">
        <button class="hud-btn" data-act="home">← 主城</button>
        <div class="hud-center">
          <span class="hud-title">布阵</span>
          <span class="seed-tag">种子 ${game.seed}</span>
        </div>
        <button class="hud-btn" data-act="reseed">换一批</button>
      </header>
      <main class="deploy-body">
        <section class="deploy-main">
          <div class="lineup-slots">${slots}</div>
          <div class="pick-grid">${cards}</div>
        </section>
        <aside class="inspect-panel">${focus ? renderInspect(focus) : renderInspectEmpty()}</aside>
      </main>
      <footer class="deploy-dock">
        <span class="count">已选 ${picked.size} / ${CONFIG.fieldSize}</span>
        <button class="primary" data-act="start" ${picked.size === CONFIG.fieldSize ? '' : 'disabled'}>开始战斗</button>
      </footer>
    </div>
  `;
}

function renderInspect(u: Unit): string {
  const g = GENERAL_BY_ID[u.generalId];
  return `<div class="inspect-inner">${renderGeneralDetail(g)}</div>`;
}

function renderInspectEmpty(): string {
  return `
    <div class="inspect-empty">
      <span>?</span>
      <p>悬停或点按武将查看详情</p>
      <small>点按卡片即可选入首发</small>
    </div>
  `;
}

function updateInspect(): void {
  const panel = app!.querySelector<HTMLElement>('.inspect-panel');
  if (!panel) return;
  const unit = inspectId ? game.units.find((u) => u.id === inspectId) : null;
  panel.innerHTML = unit ? renderInspect(unit) : renderInspectEmpty();
}

function renderBattle(): string {
  const active = game.activeId ? unitById(game, game.activeId) : null;
  return `
    <div class="game-app battle-app ${logOpen ? 'log-open' : ''}">
      <header class="game-hud">
        <button class="hud-btn" data-act="exit">${exitArmed ? '确认撤退' : '撤退'}</button>
        <div class="hud-center">
          <span class="round-badge">第 ${game.round} 回合</span>
          <span class="seed-tag">种子 ${game.seed}</span>
        </div>
        <button class="hud-btn" data-act="toggle-log">战报</button>
      </header>
      <div class="battle-main">
        <main class="battle-stage">
          ${renderSide('enemy')}
          <div class="battle-ticker">${lastTicker()}</div>
          ${renderSide('player')}
        </main>
        <aside class="log-panel">
          <div class="log-head">战报</div>
          <div class="log-body" id="log-body">${renderLog()}</div>
        </aside>
      </div>
      <footer class="action-dock">${renderTurnbar(active)}</footer>
      ${game.phase === 'over' ? renderResult() : ''}
    </div>
  `;
}

function lastTicker(): string {
  const last = [...game.log].reverse().find((entry) => entry.kind !== 'round');
  return last ? last.text : '列阵已毕，静候出手。';
}

function renderSide(side: Side): string {
  const slots = game.field[side]
    .map((id) => (id ? renderUnit(unitById(game, id)) : '<div class="unit empty">空位</div>'))
    .join('');

  const bench = game.bench[side]
    .map((id) => {
      const u = unitById(game, id);
      return `<span class="chip faction-${u.faction}" data-unit="${u.id}">${u.name}</span>`;
    })
    .join('');

  const alive = game.units.filter((u) => u.side === side && u.alive).length;

  return `
    <section class="side ${side}">
      <div class="side-head">
        <span class="side-title">${side === 'player' ? '我军' : '敌军'}</span>
        <span class="side-meta">存活 ${alive} · 后援 ${game.bench[side].length}</span>
      </div>
      <div class="field">${slots}</div>
      <div class="bench">${bench || '<span class="chip empty">无</span>'}</div>
    </section>
  `;
}

function renderUnit(u: Unit): string {
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100));
  const active = game.activeId === u.id ? 'active' : '';
  let targetable = '';
  if (pending && screen === 'game' && game.phase === 'battle' && u.side === 'enemy') {
    const actor = activeUnit();
    const taunter = actor ? tauntSource(game, actor) : null;
    if (!taunter || taunter.id === u.id) targetable = 'targetable';
  }
  return `
    <div class="unit ${u.side} faction-${u.faction} ${active} ${targetable}" data-unit="${u.id}">
      <div class="unit-portrait">
        <span class="faction-badge">${FACTION_LABEL[u.faction]}</span>
        <span class="unit-glyph">${u.name[0]}</span>
      </div>
      <div class="unit-head">
        <span class="unit-name">${u.name}</span>
        <span class="unit-hp">${u.hp}</span>
      </div>
      <div class="hpbar"><i style="width:${pct}%"></i></div>
      <div class="unit-tags">${renderTags(u)}</div>
    </div>
  `;
}

function renderTags(u: Unit): string {
  return u.statuses
    .map((st) => {
      if (st.kind === 'shield') return `<span class="tag shield">盾 ${st.amount}</span>`;
      if (st.kind === 'burn') return `<span class="tag burn">灼 ${st.amount}</span>`;
      if (st.kind === 'poison') return `<span class="tag poison">毒 ${st.amount}</span>`;
      return `<span class="tag ${st.kind}">${st.label}</span>`;
    })
    .join('');
}

function renderLog(): string {
  return game.log
    .slice(-60)
    .map((entry) => `<p class="log-line ${entry.kind}">${entry.text}</p>`)
    .join('');
}

function renderTurnbar(active: Unit | null): string {
  if (game.phase === 'over') return '';

  if (!active) return '<div class="turn-info">战斗结算中…</div>';

  if (active.side === 'enemy') {
    return `
      <div class="dock-waiting">
        <span class="wait-glyph faction-${active.faction}">${active.name[0]}</span>
        <div class="turn-info">敌军 <b>${active.name}</b> 行动中…</div>
        <span class="spinner" aria-hidden="true"></span>
      </div>
    `;
  }

  const silenced = isSilenced(active);
  const disarmed = isDisarmed(active);
  const taunter = tauntSource(game, active);

  const skills = active.skills
    .map(({ id, cdLeft }) => {
      const def = SKILL_BY_ID[id];
      const disabled = cdLeft > 0 || pending !== null || silenced;
      return `
        <button class="act skill" data-skill="${id}" title="${def.desc}" ${disabled ? 'disabled' : ''}>
          <span class="act-glyph">${def.name[0]}</span>
          <span class="act-text">
            <span class="act-name">${def.name}</span>
            <span class="act-sub">${cdLeft > 0 ? `冷却 ${cdLeft}` : `CD ${def.cd}`}</span>
          </span>
        </button>
      `;
    })
    .join('');

  const notes = [
    silenced ? '<span class="warn">沉默中，无法施展技能</span>' : '',
    disarmed ? '<span class="warn">缴械中，无法普攻</span>' : '',
    taunter ? `<span class="warn">受 ${taunter.name} 嘲讽</span>` : '',
  ].join('');

  return `
    <div class="dock-actor faction-${active.faction}">
      <span class="dock-glyph">${active.name[0]}</span>
      <div class="dock-meta">
        <b>${active.name}</b>
        <span>${active.hp} / ${active.maxHp}</span>
      </div>
    </div>
    <div class="dock-body">
      <div class="turn-info">
        轮到 <b>${active.name}</b> 行动
        ${notes}
        ${hint ? `<span class="warn">${hint}</span>` : ''}
        ${
          pending
            ? `<span class="target-hint">${
                taunter ? `点击 ${taunter.name} 选定目标` : '点击一名敌人选定目标'
              }</span>`
            : ''
        }
      </div>
      <div class="acts">
        <button class="act attack" data-act="attack" ${pending || disarmed ? 'disabled' : ''}>
          <span class="act-glyph">攻</span>
          <span class="act-text">
            <span class="act-name">普攻</span>
            <span class="act-sub">${disarmed ? '缴械中' : '物理伤害'}</span>
          </span>
        </button>
        ${skills}
        <button class="act defend" data-act="defend" ${pending ? 'disabled' : ''}>
          <span class="act-glyph">守</span>
          <span class="act-text">
            <span class="act-name">防御</span>
            <span class="act-sub">防御 +50%</span>
          </span>
        </button>
        ${pending ? '<button class="act ghost" data-act="cancel">取消</button>' : ''}
      </div>
    </div>
  `;
}

function renderResult(): string {
  const win = game.outcome === 'victory';
  const alive = (side: Side): number => game.units.filter((u) => u.side === side && u.alive).length;
  return `
    <div class="result-overlay">
      <div class="result-card ${win ? 'win' : 'lose'}">
        <span class="result-kicker">第 ${game.round} 回合 · 战斗结束</span>
        <div class="result ${win ? 'win' : 'lose'}">${win ? '大捷' : '败北'}</div>
        <p class="result-line">我军存活 ${alive('player')} · 敌军存活 ${alive('enemy')}</p>
        <label class="seed-wrap" for="seed">
          种子
          <input class="seed" id="seed" type="text" inputmode="numeric" value="${game.seed}" aria-label="种子" />
        </label>
        <div class="result-actions">
          <button class="primary" data-act="restart">再战一局</button>
          <button class="ghost" data-act="home">返回主城</button>
        </div>
      </div>
    </div>
  `;
}

function scrollLog(): void {
  const body = app!.querySelector<HTMLElement>('#log-body');
  if (body) body.scrollTop = body.scrollHeight;
}

/* ---------------- 交互 ---------------- */

function activeUnit(): Unit | null {
  if (game.phase !== 'battle' || !game.activeId) return null;
  return unitById(game, game.activeId);
}

function handleClick(event: MouseEvent): void {
  const el = event.target as HTMLElement;

  if (el.classList.contains('modal-backdrop')) {
    closeGeneral();
    return;
  }

  const actEl = el.closest<HTMLElement>('[data-act]');
  if (actEl) {
    handleAct(actEl.dataset.act ?? '');
    return;
  }

  const navEl = el.closest<HTMLElement>('[data-nav]');
  if (navEl) {
    navigate(navEl.dataset.nav as HomeView);
    return;
  }

  const filterEl = el.closest<HTMLElement>('[data-filter]');
  if (filterEl) {
    rosterFilter = (filterEl.dataset.filter ?? 'all') as RosterFilter;
    render();
    return;
  }

  const skillEl = el.closest<HTMLElement>('[data-skill]');
  if (skillEl) {
    chooseSkill(skillEl.dataset.skill ?? '');
    return;
  }

  const generalEl = el.closest<HTMLElement>('[data-general]');
  if (generalEl) {
    showGeneralId = generalEl.dataset.general ?? null;
    render();
    return;
  }

  const pickEl = el.closest<HTMLElement>('[data-pick]');
  if (pickEl) {
    togglePick(pickEl.dataset.pick ?? '');
    return;
  }

  const unitEl = el.closest<HTMLElement>('[data-unit]');
  if (unitEl) {
    clickUnit(unitEl.dataset.unit ?? '', event.clientX, event.clientY);
    return;
  }

  hideTip();
}

function handleAct(act: string): void {
  switch (act) {
    case 'go-deploy':
      startNewGame();
      return;
    case 'home':
      goHome();
      return;
    case 'reseed':
      reseed();
      return;
    case 'start':
      startBattle();
      return;
    case 'restart':
      restart();
      return;
    case 'exit':
      armExit();
      return;
    case 'toggle-log':
      logOpen = !logOpen;
      render();
      return;
    case 'close-modal':
      closeGeneral();
      return;
    case 'attack':
      beginAttack();
      return;
    case 'defend': {
      const actor = activeUnit();
      if (actor) doAction({ type: 'defend', actorId: actor.id });
      return;
    }
    case 'cancel':
      pending = null;
      hint = '';
      render();
      return;
    default:
      return;
  }
}

function navigate(view: HomeView): void {
  homeView = view;
  showGeneralId = null;
  hideTip();
  render();
  window.scrollTo(0, 0);
}

function closeGeneral(): void {
  showGeneralId = null;
  render();
}

function goHome(): void {
  window.clearTimeout(enemyTimer);
  window.clearTimeout(exitTimer);
  screen = 'home';
  homeView = 'main';
  showGeneralId = null;
  pending = null;
  hint = '';
  inspectId = null;
  exitArmed = false;
  hideTip();
  render();
  window.scrollTo(0, 0);
}

function startNewGame(): void {
  window.clearTimeout(enemyTimer);
  window.clearTimeout(exitTimer);
  game = createBattle(randomSeed());
  screen = 'game';
  picked.clear();
  pending = null;
  hint = '';
  inspectId = null;
  exitArmed = false;
  logOpen = window.matchMedia('(min-width: 900px)').matches;
  hideTip();
  render();
  window.scrollTo(0, 0);
}

function reseed(): void {
  if (game.phase !== 'deploy') return;
  game = createBattle(randomSeed());
  picked.clear();
  inspectId = null;
  hint = '';
  render();
}

function togglePick(id: string): void {
  if (game.phase !== 'deploy') return;
  if (picked.has(id)) {
    picked.delete(id);
    hint = '';
  } else if (picked.size < CONFIG.fieldSize) {
    picked.add(id);
    hint = '';
  } else {
    hint = `首发至多 ${CONFIG.fieldSize} 人`;
  }
  inspectId = id;
  render();
}

function startBattle(): void {
  if (game.phase !== 'deploy' || picked.size !== CONFIG.fieldSize) return;
  try {
    game = deploy(game, [...picked]);
    picked.clear();
    pending = null;
    hint = '';
    inspectId = null;
  } catch (err) {
    hint = (err as Error).message;
  }
  render();
}

/** 嘲讽存在时，可选目标只剩嘲讽者。 */
function allowedTargets(actor: Unit): Unit[] {
  const taunter = tauntSource(game, actor);
  return taunter ? [taunter] : fieldUnitsOf(game, 'enemy');
}

function beginAttack(): void {
  const actor = activeUnit();
  if (!actor) return;
  if (isDisarmed(actor)) {
    hint = '缴械中，无法普攻';
    render();
    return;
  }
  const targets = allowedTargets(actor);
  if (targets.length === 1) {
    doAction({ type: 'attack', actorId: actor.id, targetId: targets[0].id });
    return;
  }
  pending = { type: 'attack' };
  hint = '';
  render();
}

function chooseSkill(skillId: string): void {
  const actor = activeUnit();
  const def = SKILL_BY_ID[skillId];
  if (!actor || !def) return;
  if (isSilenced(actor)) {
    hint = '沉默中，无法施展技能';
    render();
    return;
  }

  if (def.target === 'enemy') {
    const targets = allowedTargets(actor);
    if (targets.length === 1) {
      doAction({ type: 'skill', actorId: actor.id, skillId, targetId: targets[0].id });
      return;
    }
    pending = { type: 'skill', skillId };
    hint = '';
    render();
    return;
  }

  doAction({ type: 'skill', actorId: actor.id, skillId });
}

function clickUnit(id: string, x: number, y: number): void {
  if (screen !== 'game' || game.phase !== 'battle') return;

  if (!pending) {
    // 没有待选目标时，点卡片看作查看详情（触屏也能用）。
    showTip(id, x, y);
    return;
  }

  const actor = activeUnit();
  if (!actor) return;
  const target = game.units.find((u) => u.id === id);
  if (!target || target.side !== 'enemy' || !target.alive) return;
  // 后援不在场上，不能作为目标
  if (!fieldUnitsOf(game, 'enemy').some((u) => u.id === id)) return;

  const taunter = tauntSource(game, actor);
  if (taunter && taunter.id !== id) {
    hint = `受 ${taunter.name} 嘲讽，只能攻击他`;
    render();
    return;
  }

  if (pending.type === 'attack') {
    doAction({ type: 'attack', actorId: actor.id, targetId: id });
  } else if (pending.skillId) {
    doAction({ type: 'skill', actorId: actor.id, skillId: pending.skillId, targetId: id });
  }
}

function doAction(action: Action): void {
  hideTip();
  try {
    game = takeAction(game, action);
    pending = null;
    hint = '';
  } catch (err) {
    hint = (err as Error).message;
  }
  render();
}

function armExit(): void {
  if (game.phase === 'deploy') {
    goHome();
    return;
  }
  if (game.phase !== 'battle') return;

  if (!exitArmed) {
    exitArmed = true;
    window.clearTimeout(exitTimer);
    exitTimer = window.setTimeout(() => {
      exitArmed = false;
      render();
    }, 3000);
    render();
    return;
  }

  window.clearTimeout(exitTimer);
  goHome();
}

function restart(): void {
  const input = app!.querySelector<HTMLInputElement>('#seed');
  const parsed = Number(input?.value);
  const seed = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : randomSeed();
  window.clearTimeout(enemyTimer);
  window.clearTimeout(exitTimer);
  game = createBattle(seed);
  screen = 'game';
  picked.clear();
  pending = null;
  hint = '';
  inspectId = null;
  exitArmed = false;
  logOpen = window.matchMedia('(min-width: 900px)').matches;
  hideTip();
  render();
  window.scrollTo(0, 0);
}

/** 轮到我方时停下等玩家；敌方回合自动出招。 */
function scheduleEnemy(): void {
  window.clearTimeout(enemyTimer);
  if (screen !== 'game' || game.phase !== 'battle' || !game.activeId) return;
  const actor = unitById(game, game.activeId);
  if (actor.side !== 'enemy') return;

  enemyTimer = window.setTimeout(() => {
    if (screen !== 'game' || game.phase !== 'battle') return;
    try {
      game = takeAction(game, autoAction(game));
    } catch (err) {
      hint = (err as Error).message;
    }
    render();
  }, 560);
}

/* ---------------- 悬浮提示 ---------------- */

const tip = document.createElement('div');
tip.className = 'tip';
tip.hidden = true;
document.body.appendChild(tip);

/** 当前悬浮的武将；重绘后据此刷新或收起提示框。 */
let hoverId: string | null = null;
let hoverX = 0;
let hoverY = 0;

function statLine(u: Unit, key: StatKey): string {
  const now = effectiveStat(u, key);
  const base = u.base[key];
  return now === base ? `${now}` : `${now} <span class="tip-dim">（基础 ${base}）</span>`;
}

function showTip(unitId: string, x: number, y: number): void {
  const u = game.units.find((item) => item.id === unitId);
  if (!u) return;
  hoverId = unitId;
  hoverX = x;
  hoverY = y;

  const stats = (Object.keys(STAT_TEXT) as StatKey[])
    .map((key) => `<span>${STAT_TEXT[key]} ${statLine(u, key)}</span>`)
    .join('');

  const skills = u.skills
    .map((own) => {
      const def = SKILL_BY_ID[own.id];
      if (!def) return '';
      const state = own.cdLeft > 0 ? `冷却 ${own.cdLeft} 回合` : `就绪 · CD ${def.cd}`;
      return `
        <div class="tip-skill">
          <div class="tip-skill-head"><b>${def.name}</b><span>${state}</span></div>
          <p>${def.desc}</p>
        </div>
      `;
    })
    .join('');

  const statuses = u.statuses.length
    ? `<div class="tip-status"><b>状态</b><ul>${u.statuses
        .map((st) => `<li>${describeStatus(st)}</li>`)
        .join('')}</ul></div>`
    : '';

  tip.innerHTML = `
    <div class="tip-head">
      <b>${u.name}</b><span>${FACTION_LABEL[u.faction]} · ${u.title}</span>
      <em class="${u.side}">${u.side === 'player' ? '我方' : '敌方'}</em>
    </div>
    <div class="tip-hp">生命 ${u.hp} / ${u.maxHp}</div>
    <div class="tip-stats">${stats}</div>
    ${statuses}
    <div class="tip-skills">${skills}</div>
  `;
  tip.hidden = false;
  positionTip(x, y);
}

function positionTip(x: number, y: number): void {
  const rect = tip.getBoundingClientRect();
  let left = x + 18;
  let top = y + 16;
  if (left + rect.width > window.innerWidth - 8) left = x - rect.width - 18;
  if (top + rect.height > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - rect.height - 8);
  }
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${Math.max(8, top)}px`;
}

function hideTip(): void {
  tip.hidden = true;
  hoverId = null;
}

/** 重绘会替换 DOM，鼠标不一定会触发 mouseout：按最新状态刷新或收起提示。 */
function refreshTip(): void {
  if (!hoverId || tip.hidden) return;
  if (screen !== 'game' || game.phase !== 'battle' || !app!.querySelector(`[data-unit="${hoverId}"]`)) {
    hideTip();
    return;
  }
  showTip(hoverId, hoverX, hoverY);
}

app.addEventListener('click', handleClick);

app.addEventListener('mouseover', (event) => {
  const target = event.target as HTMLElement;

  const inspectEl = target.closest<HTMLElement>('[data-inspect]');
  if (inspectEl && screen === 'game' && game.phase === 'deploy') {
    const id = inspectEl.dataset.inspect ?? '';
    if (id && id !== inspectId) {
      inspectId = id;
      updateInspect();
    }
    return;
  }

  const el = target.closest<HTMLElement>('[data-unit]');
  if (!el) return;
  if (screen !== 'game' || game.phase !== 'battle') return;
  showTip(el.dataset.unit ?? '', event.clientX, event.clientY);
});

app.addEventListener('mousemove', (event) => {
  if (tip.hidden) return;
  positionTip(event.clientX, event.clientY);
});

app.addEventListener('mouseout', (event) => {
  const el = (event.target as HTMLElement).closest<HTMLElement>('[data-unit]');
  if (!el) return;
  const to = event.relatedTarget as HTMLElement | null;
  if (to && el.contains(to)) return;
  hideTip();
});

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (pending) {
    pending = null;
    hint = '';
    render();
  } else if (showGeneralId) {
    closeGeneral();
  }
});

render();
