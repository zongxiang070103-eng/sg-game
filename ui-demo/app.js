'use strict';

/* ============================================================
   将星谱 · 演示数据与交互
   卡片是界面本体：点将、选目标、出招、结算都在卡上发生。
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const GENERALS = [
  {
    id: 'guanyu',
    name: '关羽',
    faction: 'shu',
    factionName: '蜀',
    title: '汉寿亭侯',
    hp: 118,
    atk: 33,
    def: 16,
    spd: 11,
    rarity: 5,
    watermark: '武',
    seal: '忠',
    weapon: 'w-guandao',
    accent: '#2f8f68',
    accent2: '#a8e6c8',
    lore: '青龙偃月所向，敌阵为之辟易。',
    skills: [
      {
        id: 'qinglong',
        name: '青龙偃月',
        cd: 3,
        meta: '单体 190%',
        desc: '斩向单体，造成攻击 190% 伤害；目标生命低于 40% 时提升至 280%。',
        effect: { type: 'single', mult: 1.9, bonus: { type: 'targetLow', threshold: 0.4, mult: 2.8 } },
      },
      {
        id: 'weizhen',
        name: '威震华夏',
        cd: 4,
        meta: '群体 90%',
        desc: '对全体敌人造成攻击 90% 伤害。',
        effect: { type: 'all', mult: 0.9 },
      },
    ],
  },
  {
    id: 'zhangfei',
    name: '张飞',
    faction: 'shu',
    factionName: '蜀',
    title: '万人敌',
    hp: 126,
    atk: 31,
    def: 18,
    spd: 9,
    rarity: 5,
    watermark: '猛',
    seal: '勇',
    weapon: 'w-serpent',
    accent: '#1f6f5a',
    accent2: '#7fd0b0',
    lore: '长坂桥头一声喝，曹军无人敢近。',
    skills: [
      {
        id: 'paoxiao',
        name: '长坂咆哮',
        cd: 3,
        meta: '单体 155%',
        desc: '对单体造成攻击 155% 伤害。',
        effect: { type: 'single', mult: 1.55 },
      },
      {
        id: 'duanqiao',
        name: '据水断桥',
        cd: 2,
        meta: '群体 70%',
        desc: '对全体敌人造成攻击 70% 伤害。',
        effect: { type: 'all', mult: 0.7 },
      },
    ],
  },
  {
    id: 'zhaoyun',
    name: '赵云',
    faction: 'shu',
    factionName: '蜀',
    title: '常山赵子龙',
    hp: 106,
    atk: 30,
    def: 15,
    spd: 16,
    rarity: 5,
    watermark: '胆',
    seal: '龙',
    weapon: 'w-spear',
    accent: '#3f9e8e',
    accent2: '#b7ead9',
    lore: '单骑入阵，怀抱幼主，七进七出。',
    skills: [
      {
        id: 'danqi',
        name: '单骑救主',
        cd: 3,
        meta: '单体 180%',
        desc: '对单体造成攻击 180% 伤害；我方仅剩他一人时提升至 250%。',
        effect: { type: 'single', mult: 1.8, bonus: { type: 'lastAlly', mult: 2.5 } },
      },
      {
        id: 'longdan',
        name: '龙胆',
        cd: 2,
        meta: '单体 120%',
        desc: '对单体造成攻击 120% 伤害，并回复造成伤害 50% 的生命。',
        effect: { type: 'single', mult: 1.2, healOnDamage: 0.5 },
      },
    ],
  },
  {
    id: 'zhangliao',
    name: '张辽',
    faction: 'wei',
    factionName: '魏',
    title: '五子良将',
    hp: 106,
    atk: 30,
    def: 15,
    spd: 15,
    rarity: 5,
    watermark: '威',
    seal: '辽',
    weapon: 'w-halberd',
    accent: '#3f6fc0',
    accent2: '#9fc0ff',
    lore: '八百骑破十万，威震逍遥津。',
    skills: [
      {
        id: 'tuxi',
        name: '轻骑突袭',
        cd: 2,
        meta: '单体 145%',
        desc: '造成攻击 145% 伤害；自身速度更快时提升至 195%。',
        effect: { type: 'single', mult: 1.45, bonus: { type: 'faster', mult: 1.95 } },
      },
      {
        id: 'xiaoyao',
        name: '威震逍遥津',
        cd: 4,
        meta: '群体 85%',
        desc: '对全体敌人造成攻击 85% 伤害。',
        effect: { type: 'all', mult: 0.85 },
      },
    ],
  },
  {
    id: 'xiahoudun',
    name: '夏侯惇',
    faction: 'wei',
    factionName: '魏',
    title: '独眼将军',
    hp: 116,
    atk: 29,
    def: 17,
    spd: 12,
    rarity: 5,
    watermark: '烈',
    seal: '刚',
    weapon: 'w-blade',
    accent: '#4f5fa8',
    accent2: '#b3bdf0',
    lore: '拔矢啖睛，刚烈不改。',
    skills: [
      {
        id: 'bashi',
        name: '拔矢啖睛',
        cd: 2,
        meta: '单体 145%',
        desc: '造成攻击 145% 伤害；自身生命低于 50% 时提升至 190%。',
        effect: { type: 'single', mult: 1.45, bonus: { type: 'selfLow', threshold: 0.5, mult: 1.9 } },
      },
      {
        id: 'ganglie',
        name: '刚烈反击',
        cd: 3,
        meta: '护盾 12%',
        desc: '收势蓄力，获得相当于最大生命 12% 的护盾。',
        effect: { type: 'shield', pct: 0.12 },
      },
    ],
  },
  {
    id: 'yujin',
    name: '于禁',
    faction: 'wei',
    factionName: '魏',
    title: '毅重',
    hp: 122,
    atk: 24,
    def: 22,
    spd: 10,
    rarity: 5,
    watermark: '毅',
    seal: '重',
    weapon: 'w-shield',
    accent: '#2f6f8f',
    accent2: '#9fd4e8',
    lore: '持节毅重，军阵不乱。',
    skills: [
      {
        id: 'yizhong',
        name: '毅重持节',
        cd: 3,
        meta: '护盾 18%',
        desc: '获得相当于最大生命 18% 的护盾。',
        effect: { type: 'shield', pct: 0.18 },
      },
      {
        id: 'zhenjun',
        name: '镇军压阵',
        cd: 2,
        meta: '群体 60%',
        desc: '对全体敌人造成攻击 60% 伤害。',
        effect: { type: 'all', mult: 0.6 },
      },
    ],
  },
];

const GENERAL_BY_ID = Object.fromEntries(GENERALS.map((g) => [g.id, g]));
const ALLY_ORDER = ['guanyu', 'zhangfei', 'zhaoyun'];
const ENEMY_ORDER = ['zhangliao', 'xiahoudun', 'yujin'];
const ALLY_TURN_ORDER = ['zhaoyun', 'guanyu', 'zhangfei'];

const state = {
  screen: 'home',
  featured: 'guanyu',
  battle: null,
};

/* ============================================================
   音效 · 全部由 Web Audio 合成，不加载外部音频文件
   ============================================================ */

const AUDIO_KEY = 'jiangxing.audio.v1';
const savedAudio = (() => {
  try {
    return JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}') || {};
  } catch {
    return {};
  }
})();

const audio = {
  ctx: null,
  master: null,
  sfxBus: null,
  musicBus: null,
  noiseBuffer: null,
  soundOn: savedAudio.sound !== false,
  musicOn: savedAudio.music === true,
  musicTimer: 0,
  musicNodes: [],

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    try {
      const ctx = new AudioCtor();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 20;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.24;
      comp.connect(ctx.destination);

      this.master = ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(comp);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.6;
      this.sfxBus.connect(this.master);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.0001;
      this.musicBus.connect(this.master);

      this.noiseBuffer = this.makeNoise(ctx);
      this.ctx = ctx;
      return ctx;
    } catch {
      return null;
    }
  },

  makeNoise(ctx) {
    const frames = Math.floor(ctx.sampleRate * 0.7);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  },

  save() {
    try {
      localStorage.setItem(AUDIO_KEY, JSON.stringify({ sound: this.soundOn, music: this.musicOn }));
    } catch {
      /* 隐私模式或 file:// 下可能不可写，不阻断演示 */
    }
  },

  tone({ freq = 440, to = 0, type = 'sine', dur = 0.18, gain = 0.05, attack = 0.006, delay = 0, filter = 0, bus = 'sfx' }) {
    if (bus === 'music' ? !this.musicOn : !this.soundOn) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + Math.max(0, delay);
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    let tail = osc;
    if (filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = filter;
      lp.Q.value = 0.8;
      osc.connect(lp);
      tail = lp;
    }
    tail.connect(env);
    env.connect(bus === 'music' ? this.musicBus : this.sfxBus);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  },

  noise({ dur = 0.14, gain = 0.04, from = 1400, to = 300, q = 1, type = 'bandpass', delay = 0 }) {
    if (!this.soundOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuffer) return;
    const t0 = ctx.currentTime + Math.max(0, delay);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, from), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  },

  click() {
    this.tone({ freq: 620, to: 760, type: 'triangle', dur: 0.06, gain: 0.035 });
  },

  select() {
    [392, 523.25, 659.25].forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', dur: 0.22, gain: 0.038, delay: i * 0.055, filter: 2200 });
    });
    this.tone({ freq: 130, to: 92, type: 'sine', dur: 0.16, gain: 0.05 });
  },

  open() {
    this.noise({ dur: 0.2, gain: 0.024, from: 1800, to: 450, q: 0.7 });
    this.tone({ freq: 220, to: 160, type: 'sine', dur: 0.14, gain: 0.032 });
  },

  close() {
    this.tone({ freq: 330, to: 220, type: 'sine', dur: 0.14, gain: 0.028 });
  },

  target() {
    this.tone({ freq: 880, to: 660, type: 'triangle', dur: 0.1, gain: 0.035 });
    this.tone({ freq: 150, to: 110, type: 'sine', dur: 0.14, gain: 0.045, delay: 0.015 });
  },

  turn() {
    this.tone({ freq: 523.25, type: 'sine', dur: 0.24, gain: 0.028, filter: 2400 });
    this.tone({ freq: 783.99, type: 'sine', dur: 0.28, gain: 0.019, delay: 0.07, filter: 2400 });
  },

  attack() {
    this.noise({ dur: 0.22, gain: 0.032, from: 260, to: 1800, q: 1.4 });
  },

  hit(delay = 0, guarded = false) {
    this.noise({ dur: 0.11, gain: guarded ? 0.06 : 0.05, from: 2000, to: 240, q: 0.8, delay });
    this.tone({ freq: guarded ? 150 : 120, to: 48, type: 'sine', dur: 0.14, gain: 0.065, delay });
    if (guarded) {
      this.tone({ freq: 1568, to: 2093, type: 'sine', dur: 0.16, gain: 0.018, delay, filter: 6000 });
    }
  },

  shield() {
    this.tone({ freq: 1046, to: 1568, type: 'triangle', dur: 0.2, gain: 0.036, filter: 5200 });
    this.tone({ freq: 1568, to: 2093, type: 'sine', dur: 0.18, gain: 0.016, delay: 0.025, filter: 6000 });
    this.tone({ freq: 98, to: 70, type: 'sine', dur: 0.18, gain: 0.038 });
  },

  heal(delay = 0) {
    this.tone({ freq: 659.25, to: 987.77, type: 'sine', dur: 0.32, gain: 0.036, delay, filter: 4200 });
    this.tone({ freq: 1318.5, type: 'sine', dur: 0.26, gain: 0.015, delay: delay + 0.08, filter: 6000 });
  },

  skill() {
    this.tone({ freq: 196, to: 392, type: 'sawtooth', dur: 0.32, gain: 0.024, filter: 900 });
    this.noise({ dur: 0.34, gain: 0.022, from: 500, to: 2600, q: 2 });
    this.tone({ freq: 110, to: 73.4, type: 'sine', dur: 0.55, gain: 0.055, delay: 0.16 });
  },

  ko(delay = 0) {
    this.tone({ freq: 146.83, to: 73.42, type: 'sine', dur: 0.8, gain: 0.045, delay, filter: 600 });
    this.tone({ freq: 220, to: 110, type: 'triangle', dur: 0.55, gain: 0.022, delay, filter: 700 });
  },

  win() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', dur: 0.7, gain: 0.042, delay: i * 0.11, filter: 2600 });
    });
    this.tone({ freq: 98, type: 'sine', dur: 1.6, gain: 0.05, filter: 400 });
    this.tone({ freq: 146.83, type: 'sine', dur: 1.4, gain: 0.028, delay: 0.02, filter: 500 });
  },

  lose() {
    [220, 174.61, 146.83].forEach((f, i) => {
      this.tone({ freq: f, type: 'sine', dur: 0.8, gain: 0.036, delay: i * 0.18, filter: 500 });
    });
    this.tone({ freq: 73.42, type: 'sine', dur: 1.4, gain: 0.038, filter: 300 });
  },

  startMusic() {
    if (!this.musicOn || this.musicNodes.length) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t0);
    this.musicBus.gain.setValueAtTime(0.0001, t0);
    this.musicBus.gain.exponentialRampToValueAtTime(0.62, t0 + 1.4);

    const drone = ctx.createGain();
    drone.gain.value = 0.032;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 360;
    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 73.42;
    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.value = 110;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;

    oscA.connect(drone);
    oscB.connect(drone);
    drone.connect(filter);
    filter.connect(this.musicBus);
    lfo.connect(lfoGain);
    lfoGain.connect(drone.gain);
    oscA.start(t0);
    oscB.start(t0);
    lfo.start(t0);
    this.musicNodes = [oscA, oscB, lfo, drone, lfoGain, filter];

    const notes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    const breath = () => {
      if (!this.musicOn) return;
      const n = notes[Math.floor(Math.random() * notes.length)];
      this.tone({ freq: n, type: 'triangle', dur: 1.4, gain: 0.024, filter: 1800, bus: 'music' });
      if (Math.random() < 0.55) {
        this.tone({ freq: n * 1.5, type: 'sine', dur: 1.1, gain: 0.011, delay: 0.18, filter: 2400, bus: 'music' });
      }
      this.musicTimer = setTimeout(breath, 3600 + Math.random() * 3200);
    };
    this.musicTimer = setTimeout(breath, 1700);
  },

  stopMusic() {
    clearTimeout(this.musicTimer);
    this.musicTimer = 0;
    const nodes = this.musicNodes;
    this.musicNodes = [];
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setValueAtTime(Math.max(0.0001, this.musicBus.gain.value), t);
    this.musicBus.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    setTimeout(() => {
      nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          /* gain / filter 节点没有 stop */
        }
      });
    }, 760);
  },
};

function syncAudioControls() {
  $$('[data-audio-toggle="sound"]').forEach((btn) => {
    btn.classList.toggle('is-off', !audio.soundOn);
    btn.setAttribute('aria-pressed', audio.soundOn ? 'true' : 'false');
    btn.setAttribute('aria-label', audio.soundOn ? '关闭音效' : '开启音效');
    btn.title = audio.soundOn ? '音效：开' : '音效：关';
  });
  $$('[data-audio-toggle="music"]').forEach((btn) => {
    btn.classList.toggle('is-off', !audio.musicOn);
    btn.setAttribute('aria-pressed', audio.musicOn ? 'true' : 'false');
    btn.setAttribute('aria-label', audio.musicOn ? '关闭环境音乐' : '开启环境音乐');
    btn.title = audio.musicOn ? '环境音乐：开' : '环境音乐：关';
  });
}

function bindAudioControls() {
  $$('[data-audio-toggle="sound"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (audio.soundOn) {
        audio.click();
        audio.soundOn = false;
      } else {
        audio.soundOn = true;
        audio.ensure();
        audio.click();
      }
      audio.save();
      syncAudioControls();
      toast(audio.soundOn ? '音效已开启' : '音效已关闭');
    });
  });

  $$('[data-audio-toggle="music"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (audio.musicOn) {
        audio.musicOn = false;
        audio.stopMusic();
        if (audio.soundOn) audio.click();
      } else {
        audio.musicOn = true;
        audio.ensure();
        audio.startMusic();
        if (audio.soundOn) audio.click();
      }
      audio.save();
      syncAudioControls();
      toast(audio.musicOn ? '环境音乐已开启' : '环境音乐已关闭');
    });
  });

  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (audio.musicOn) audio.startMusic();
    if (audio.soundOn) audio.ensure();
  };
  document.addEventListener('pointerdown', unlock, { once: true, passive: true });
  document.addEventListener('keydown', unlock, { once: true });
}

const els = {
  feature: $('#feature-card'),
  roster: $('#roster-grid'),
  allyTeam: $('#ally-team'),
  enemyTeam: $('#enemy-team'),
  turnStrip: $('#turn-strip'),
  actionBar: $('#action-bar'),
  roundNum: $('#round-num'),
  roundBig: $('#round-big'),
  logPanel: $('#log-panel'),
  logBackdrop: $('#log-backdrop'),
  logList: $('#log-list'),
  battleLive: $('#battle-live'),
  detailLayer: $('#detail-layer'),
  codexDetail: $('#cx-detail'),
  result: $('#result'),
  toast: $('#toast'),
  callout: $('#skill-callout'),
};

const MOTION = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEP_MS = MOTION ? 900 : 120;
const FINISH_MS = MOTION ? 650 : 80;
const CALLOUT_MS = MOTION ? 820 : 260;

let battleSeq = 0;
let toastTimer = 0;
let calloutTimer = 0;
let activeOverlay = null;
let overlayPrevFocus = null;
let announcedTurn = null;

/* ---------------- 卡面 ---------------- */

function cardHTML(g, opts = {}) {
  const u = opts.unit;
  const hp = Math.max(0, u ? u.hp : g.hp);
  const maxHp = u ? u.maxHp : g.hp;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const ctx = opts.context || 'home';
  const dead = Boolean(u && u.hp <= 0);
  const shield = u ? u.shield || 0 : 0;

  let aria = `${g.name}，${g.factionName}，${g.title}，生命 ${hp}${shield ? `，护盾 ${shield}` : ''}`;
  if (ctx === 'battle-enemy') aria += dead ? '，已败。点击打开详报。' : '。点击标为目标。';
  else if (ctx === 'battle-ally') aria += dead ? '，已败。点击打开详报。' : '。点击打开详报。';
  else if (ctx === 'feature') aria += '。点击打开详报。';
  else if (ctx === 'detail') aria += '。';
  else aria += '。点击设为主将。';

  const interactive = ctx !== 'detail';
  const roleAttrs = interactive ? ' role="button" tabindex="0"' : ' role="img"';
  const selected = opts.selected ? ' is-selected' : '';
  const pressed = opts.selected ? ' aria-pressed="true"' : '';
  const extra = opts.extraClass ? ` ${opts.extraClass}` : '';

  return `<article class="card${selected}${extra}" data-id="${g.id}" style="--accent:${g.accent};--accent-2:${g.accent2};--i:${opts.index || 0}"${roleAttrs}${pressed} aria-label="${aria}">
    <div class="card-frame">
      <div class="card-art">
        <svg class="card-scene" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use href="#card-scene"/></svg>
        <div class="card-rays" aria-hidden="true"></div>
        <svg class="card-halo" viewBox="0 0 200 200" aria-hidden="true"><use href="#card-halo"/></svg>
        <svg class="card-weapon" viewBox="0 0 120 360" aria-hidden="true"><use href="#${g.weapon}"/></svg>
        <span class="card-watermark" aria-hidden="true">${g.watermark}</span>
        <img class="card-glow" src="assets/cards/${g.id}.png" alt="" aria-hidden="true" draggable="false">
        <img class="card-portrait" src="assets/cards/${g.id}.png" alt="" draggable="false">
        <div class="card-scrim" aria-hidden="true"></div>
        <div class="card-shine" aria-hidden="true"></div>
        <div class="card-foil" aria-hidden="true"></div>
      </div>
      <div class="card-top" aria-hidden="true">
        <span class="card-faction card-faction--${g.faction}">${g.factionName}</span>
        <span class="card-pips">${'<i></i>'.repeat(g.rarity)}</span>
      </div>
      <div class="card-name" aria-hidden="true">
        <span class="card-name-main">${g.name}</span>
        <span class="card-name-sub">${g.title}</span>
      </div>
      <span class="card-shield" aria-hidden="true"${shield > 0 ? '' : ' hidden'}>${shield}</span>
      <div class="card-seal" aria-hidden="true">${g.seal}</div>
      <div class="card-foot">
        <div class="hp${pct < 30 ? ' is-low' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="${maxHp}" aria-valuenow="${hp}" aria-label="${g.name}生命">
          <span class="hp-track"><i style="width:${pct}%"></i></span><b class="hp-num">${hp}</b>
        </div>
        <div class="card-stats" aria-hidden="true"><span>攻<b>${g.atk}</b></span><span>防<b>${g.def}</b></span><span>速<b>${g.spd}</b></span></div>
      </div>
    </div>
  </article>`;
}

function slotHTML(id, side, index) {
  const g = GENERAL_BY_ID[id];
  const u = state.battle.units[id];
  const active = side === 'ally' && state.battle.activeId === id;
  const target = side === 'enemy' && state.battle.targetId === id && u.hp > 0;
  const dead = u.hp <= 0;
  return `<div class="card-slot${active ? ' is-active' : ''}${target ? ' is-target' : ''}${dead ? ' is-dead' : ''}" data-slot="${id}" data-side="${side}">
    <span class="slot-tag slot-tag--active" aria-hidden="true">行动</span>
    <span class="slot-tag slot-tag--target" aria-hidden="true">目标</span>
    ${cardHTML(g, { unit: u, context: side === 'ally' ? 'battle-ally' : 'battle-enemy', index })}
    <span class="dead-stamp" aria-hidden="true">败</span>
  </div>`;
}

/* ---------------- 点将台 ---------------- */

function renderHome() {
  const g = GENERAL_BY_ID[state.featured];
  els.feature.innerHTML = cardHTML(g, { context: 'feature' });
  els.roster.innerHTML = GENERALS.map((x, i) =>
    cardHTML(x, { context: 'roster', index: i, selected: x.id === state.featured }),
  ).join('');
}

function selectFeatured(id) {
  if (!GENERAL_BY_ID[id]) return;
  state.featured = id;
  audio.select();
  els.feature.innerHTML = cardHTML(GENERAL_BY_ID[id], { context: 'feature' });
  $$('.card', els.roster).forEach((card) => {
    const on = card.dataset.id === id;
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* ---------------- 战局状态 ---------------- */

function createBattle() {
  const units = {};
  GENERALS.forEach((g) => {
    units[g.id] = {
      hp: g.hp,
      maxHp: g.hp,
      shield: 0,
      cd: {},
      side: g.faction === 'shu' ? 'ally' : 'enemy',
    };
  });
  return {
    round: 1,
    activeId: 'zhaoyun',
    targetId: 'zhangliao',
    busy: false,
    over: false,
    resultKind: null,
    totalDamage: 0,
    units,
    order: ALLY_TURN_ORDER.slice(),
    log: [],
  };
}

function unit(id) {
  return state.battle ? state.battle.units[id] : null;
}

function general(id) {
  return GENERAL_BY_ID[id];
}

function aliveIds(side) {
  const b = state.battle;
  if (!b) return [];
  return Object.keys(b.units).filter((id) => b.units[id].side === side && b.units[id].hp > 0);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function slotEl(id) {
  return document.querySelector(`.card-slot[data-slot="${id}"]`);
}

function ensureTarget() {
  const b = state.battle;
  if (!b) return null;
  if (b.targetId && b.units[b.targetId] && b.units[b.targetId].hp > 0) return b.targetId;
  const next = aliveIds('enemy')[0] || null;
  b.targetId = next;
  return next;
}

function calcDamage(actor, target, mult) {
  const raw = actor.atk * mult * (1 - target.def / 140) * (0.9 + Math.random() * 0.2);
  return Math.max(4, Math.round(raw));
}

function computeMult(actor, target, actorUnit, targetUnit, effect) {
  let mult = effect.mult;
  const bonus = effect.bonus;
  if (!bonus) return mult;
  if (bonus.type === 'targetLow' && targetUnit.hp / targetUnit.maxHp < bonus.threshold) mult = bonus.mult;
  if (bonus.type === 'selfLow' && actorUnit.hp / actorUnit.maxHp < bonus.threshold) mult = bonus.mult;
  if (bonus.type === 'faster' && actor.spd > target.spd) mult = bonus.mult;
  if (bonus.type === 'lastAlly' && aliveIds('ally').length === 1) mult = bonus.mult;
  return mult;
}

/* ---------------- 战场渲染 ---------------- */

function renderBattle() {
  renderBattleTeams();
  syncBattle();
}

function renderBattleTeams() {
  const b = state.battle;
  els.allyTeam.innerHTML = ALLY_ORDER.map((id, i) => slotHTML(id, 'ally', i)).join('');
  els.enemyTeam.innerHTML = ENEMY_ORDER.map((id, i) => slotHTML(id, 'enemy', i)).join('');
}

function syncBattle() {
  const b = state.battle;
  if (!b) return;
  els.roundNum.textContent = b.round;
  els.roundBig.textContent = b.round;
  $$('.card-slot', els.allyTeam).forEach((slot) => syncSlot(slot));
  $$('.card-slot', els.enemyTeam).forEach((slot) => syncSlot(slot));
  renderTurnStrip();
  renderActions();
  renderLog();

  if (!b.over && b.activeId !== announcedTurn) {
    const hadTurn = announcedTurn !== null;
    announcedTurn = b.activeId;
    if (hadTurn) {
      audio.turn();
      flashTurn();
      pulse(slotEl(b.activeId), 'is-turn', 760);
    }
    const g = GENERAL_BY_ID[b.activeId];
    if (g && els.battleLive) {
      els.battleLive.textContent = `第${b.round}回合，轮到${g.name}行动。`;
    }
  }
}

function syncSlot(slot) {
  const b = state.battle;
  const id = slot.dataset.slot;
  const side = slot.dataset.side;
  const g = GENERAL_BY_ID[id];
  const u = b.units[id];
  const card = $('.card', slot);
  if (!card) return;

  const active = side === 'ally' && b.activeId === id;
  const target = side === 'enemy' && b.targetId === id && u.hp > 0;
  const dead = u.hp <= 0;

  slot.classList.toggle('is-active', active);
  slot.classList.toggle('is-target', target);
  slot.classList.toggle('is-dead', dead);

  const hp = Math.max(0, u.hp);
  const pct = Math.max(0, Math.min(100, (hp / u.maxHp) * 100));
  const fill = $('.hp-track i', slot);
  if (fill) fill.style.width = `${pct}%`;
  const num = $('.hp-num', slot);
  if (num) num.textContent = hp;
  const hpBar = $('.hp', slot);
  if (hpBar) {
    hpBar.setAttribute('aria-valuenow', hp);
    hpBar.classList.toggle('is-low', pct < 30);
  }
  const shieldEl = $('.card-shield', slot);
  if (shieldEl) {
    shieldEl.hidden = u.shield <= 0;
    shieldEl.textContent = u.shield;
  }

  let aria = `${g.name}，${g.factionName}，${g.title}，生命 ${hp}${u.shield ? `，护盾 ${u.shield}` : ''}`;
  if (side === 'enemy') {
    aria += dead
      ? '，已败。点击打开详报。'
      : target
        ? '，当前目标。点击可保持目标。'
        : '。点击标为目标。';
  } else {
    aria += dead
      ? '，已败。点击打开详报。'
      : active
        ? '，当前行动。点击打开详报。'
        : '。点击打开详报。';
  }
  card.setAttribute('aria-label', aria);
}

function renderTurnStrip() {
  const b = state.battle;
  els.turnStrip.innerHTML = b.order.map((id) => {
    const g = GENERAL_BY_ID[id];
    const u = b.units[id];
    const active = b.activeId === id;
    return `<span class="turn-chip${active ? ' is-active' : ''}${u.hp <= 0 ? ' is-dead' : ''}"${active ? ' aria-current="step"' : ''}>
      <img src="assets/cards/${id}.png" alt=""><span>${g.name}</span>
    </span>`;
  }).join('');
}

function renderActions() {
  const b = state.battle;
  const id = b.activeId;
  const g = GENERAL_BY_ID[id];
  const u = b.units[id];
  if (!g || !u || u.hp <= 0) {
    els.actionBar.innerHTML = '';
    return;
  }

  const prev = document.activeElement;
  let focusKey = null;
  if (prev && els.actionBar.contains(prev)) {
    focusKey = `${prev.dataset.act || ''}:${prev.dataset.skill || ''}`;
  }

  const disabled = b.busy || b.over;
  const skills = g.skills.map((s) => {
    const cd = u.cd[s.id] || 0;
    const cooling = cd > 0;
    return `<button class="action action--skill${cooling ? ' is-cooling' : ''}" data-act="skill" data-skill="${s.id}"${cooling || disabled ? ' disabled' : ''} aria-label="${s.name}${cooling ? `，冷却 ${cd} 回合` : ''}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-bolt"/></svg>
      <span class="action-name">${s.name}</span>
      <small>${s.meta}</small>
      ${cooling ? `<i class="cd-badge">${cd}</i>` : ''}
    </button>`;
  }).join('');

  els.actionBar.innerHTML = `
    <div class="action-actor">
      <span class="action-actor-name">${g.name}</span>
      <span class="action-actor-title">${g.title}</span>
    </div>
    <div class="action-list">
      <button class="action action--attack" data-act="attack"${disabled ? ' disabled' : ''} aria-label="普攻">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-sword"/></svg>
        <span class="action-name">普攻</span><small>100%</small>
      </button>
      ${skills}
      <button class="action action--defend" data-act="defend"${disabled ? ' disabled' : ''} aria-label="防御">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-shield"/></svg>
        <span class="action-name">防御</span><small>护盾 12%</small>
      </button>
      <button class="action action--detail" data-act="detail"${disabled ? ' disabled' : ''} aria-label="打开详报">
        <span class="action-name">详报</span>
      </button>
    </div>`;

  if (focusKey) {
    const btn = $$('[data-act]', els.actionBar).find(
      (x) => `${x.dataset.act || ''}:${x.dataset.skill || ''}` === focusKey && !x.disabled,
    );
    if (btn) btn.focus({ preventScroll: true });
  }
}

function renderLog() {
  const b = state.battle;
  if (!b || b.log.length === 0) {
    els.logList.innerHTML = '<li class="log-empty">战报未开。</li>';
    return;
  }
  els.logList.innerHTML = b.log
    .map((e) => `<li class="log-item${e.kind ? ` is-${e.kind}` : ''}"><b>第${e.round}回合</b><span>${e.text}</span></li>`)
    .join('');
}

function pushLog(text, kind = '') {
  const b = state.battle;
  if (!b) return;
  b.log.unshift({ round: b.round, text, kind });
  if (b.log.length > 40) b.log.pop();
  renderLog();
  if (els.battleLive) els.battleLive.textContent = text;
}

/* ---------------- 动画 ---------------- */

function pulse(slot, cls, ms = 340) {
  if (!slot) return;
  slot.classList.remove(cls);
  void slot.offsetWidth;
  slot.classList.add(cls);
  setTimeout(() => slot.classList.remove(cls), ms);
}

function floatNum(slot, text, kind = '') {
  if (!slot) return;
  const el = document.createElement('span');
  el.className = `dmg${kind ? ` dmg--${kind}` : ''}`;
  el.textContent = text;
  slot.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function addSlash(slot) {
  if (!slot) return;
  const a = document.createElement('i');
  a.className = 'slash';
  const b = document.createElement('i');
  b.className = 'slash slash--two';
  slot.append(a, b);
  setTimeout(() => {
    a.remove();
    b.remove();
  }, 520);
}

function addImpact(slot, kind = 'hit') {
  if (!MOTION || !slot) return;
  const colors = { hit: '#ff9c7a', guard: '#ffd98a', heal: '#8ef0c4' };
  const fx = colors[kind] || colors.hit;
  const bits = [];
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
  setTimeout(() => bits.forEach((bit) => bit.remove()), 800);
}

function addBeam(fromSlot, toSlot, color) {
  if (!MOTION || !fromSlot || !toSlot) return;
  const a = fromSlot.getBoundingClientRect();
  const b = toSlot.getBoundingClientRect();
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
  setTimeout(() => beam.remove(), 480);
}

function addBreak(slot) {
  if (!MOTION || !slot) return;
  pulse(slot, 'is-breaking', 820);
}

function flashTurn() {
  if (!MOTION) return;
  const center = $('.battle-center');
  if (!center) return;
  center.classList.remove('is-turning');
  void center.offsetWidth;
  center.classList.add('is-turning');
  setTimeout(() => center.classList.remove('is-turning'), 760);
}

function showCallout(g, name) {
  els.callout.hidden = false;
  $('#callout-user').textContent = g.name;
  $('#callout-name').textContent = name;
  els.callout.classList.remove('is-cast');
  void els.callout.offsetWidth;
  els.callout.classList.add('is-cast');
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(() => {
    els.callout.hidden = true;
    els.callout.classList.remove('is-cast');
  }, CALLOUT_MS);
}

/* ---------------- 伤害与技能 ---------------- */

function applyHits(actorId, hits) {
  const b = state.battle;
  const actor = GENERAL_BY_ID[actorId];
  const actorUnit = b.units[actorId];
  const actorSlot = slotEl(actorId);

  hits.forEach((hit, i) => {
    const target = GENERAL_BY_ID[hit.targetId];
    const tu = b.units[hit.targetId];
    if (!target || !tu || tu.hp <= 0) return;

    const absorbed = Math.min(tu.shield, hit.amount);
    tu.shield -= absorbed;
    const dealt = Math.min(tu.hp, hit.amount - absorbed);
    tu.hp -= dealt;
    if (actorUnit.side === 'ally') b.totalDamage += dealt;

    audio.hit(i * 0.05, absorbed > 0);
    const slot = slotEl(hit.targetId);
    if (slot) {
      slot.classList.add('is-hit');
      setTimeout(() => slot.classList.remove('is-hit'), 340);
      addSlash(slot);
      addBeam(actorSlot, slot, actor.accent2);
      addImpact(slot, absorbed > 0 ? 'guard' : 'hit');
      if (dealt > 0) floatNum(slot, `-${dealt}`, '');
      if (absorbed > 0) floatNum(slot, `护盾 ${absorbed}`, 'shield');
      if (tu.hp <= 0) {
        addBreak(slot);
        audio.ko(i * 0.05 + 0.12);
      }
    }

    if (dealt > 0) {
      pushLog(`${actor.name} → ${target.name} -${dealt}${absorbed ? `（护盾 ${absorbed}）` : ''}${tu.hp <= 0 ? '，倒下' : ''}`, 'hurt');
    } else {
      pushLog(`${target.name} 的护盾抵消了本次伤害。`, 'heal');
    }

    if (hit.heal > 0 && dealt > 0) {
      const before = actorUnit.hp;
      actorUnit.hp = Math.min(actorUnit.maxHp, actorUnit.hp + Math.round(dealt * hit.heal));
      const actual = actorUnit.hp - before;
      if (actual > 0) {
        audio.heal(0.08);
        addImpact(actorSlot, 'heal');
        floatNum(actorSlot, `+${actual}`, 'heal');
        pushLog(`${actor.name} 回复 ${actual} 点生命。`, 'heal');
      }
    }
  });
}

function resolveSkill(actorId, skill) {
  const b = state.battle;
  const actor = GENERAL_BY_ID[actorId];
  const au = b.units[actorId];
  const effect = skill.effect;

  if (effect.type === 'shield') {
    const amount = Math.round(au.maxHp * effect.pct);
    au.shield += amount;
    audio.shield();
    addImpact(slotEl(actorId), 'guard');
    floatNum(slotEl(actorId), `+${amount} 护盾`, 'shield');
    pushLog(`${actor.name} 获得 ${amount} 点护盾。`, 'heal');
    return;
  }

  const foeSide = au.side === 'ally' ? 'enemy' : 'ally';
  let targetIds = [];
  if (effect.type === 'all') {
    targetIds = aliveIds(foeSide);
  } else {
    let tid = null;
    if (au.side === 'ally') {
      tid = ensureTarget();
    } else {
      const choices = aliveIds('ally');
      tid = choices.length ? pick(choices) : null;
    }
    if (tid) targetIds = [tid];
  }

  const hits = targetIds.map((tid) => {
    const target = GENERAL_BY_ID[tid];
    const tu = b.units[tid];
    const mult = computeMult(actor, target, au, tu, effect);
    return {
      targetId: tid,
      amount: calcDamage(actor, target, mult),
      heal: effect.healOnDamage || 0,
    };
  });

  applyHits(actorId, hits);
}

/* ---------------- 回合推进 ---------------- */

function performPlayerAction(action, skillId) {
  const b = state.battle;
  if (!b || b.busy || b.over) return;
  const actorId = b.activeId;
  const g = GENERAL_BY_ID[actorId];
  const u = b.units[actorId];
  if (!g || !u || u.hp <= 0) return;

  const seq = battleSeq;
  const actorSlot = slotEl(actorId);
  b.busy = true;

  if (action === 'defend') {
    const amount = Math.round(u.maxHp * 0.12);
    u.shield += amount;
    audio.shield();
    pulse(actorSlot, 'is-lunging');
    addImpact(actorSlot, 'guard');
    floatNum(actorSlot, `+${amount} 护盾`, 'shield');
    pushLog(`${g.name} 结阵防御，获得 ${amount} 点护盾。`, 'heal');
    syncBattle();
    afterPlayerAction(seq);
    return;
  }

  if (action === 'skill') {
    const skill = g.skills.find((s) => s.id === skillId);
    if (!skill || (u.cd[skill.id] || 0) > 0) {
      b.busy = false;
      syncBattle();
      return;
    }
    u.cd[skill.id] = skill.cd;
    audio.skill();
    pulse(actorSlot, 'is-lunging');
    showCallout(g, skill.name);
    resolveSkill(actorId, skill);
    pushLog(`${g.name} 施放「${skill.name}」。`, 'skill');
    syncBattle();
    afterPlayerAction(seq);
    return;
  }

  const targetId = ensureTarget();
  if (!targetId) {
    b.busy = false;
    syncBattle();
    return;
  }
  const target = GENERAL_BY_ID[targetId];
  const amount = calcDamage(g, target, 1);
  audio.attack();
  pulse(actorSlot, 'is-lunging');
  applyHits(actorId, [{ targetId, amount }]);
  syncBattle();
  afterPlayerAction(seq);
}

function afterPlayerAction(seq) {
  setTimeout(() => {
    if (seq !== battleSeq) return;
    const b = state.battle;
    if (!b) return;
    b.busy = false;
    if (!aliveIds('enemy').length) {
      finish('win', seq);
      return;
    }
    if (!aliveIds('ally').length) {
      finish('lose', seq);
      return;
    }
    if (!b.units[b.targetId] || b.units[b.targetId].hp <= 0) {
      b.targetId = aliveIds('enemy')[0] || null;
    }
    syncBattle();
    enemyTurn(seq);
  }, STEP_MS);
}

function enemyTurn(seq) {
  const b = state.battle;
  if (!b || b.over || seq !== battleSeq) return;
  const enemies = aliveIds('enemy');
  if (!enemies.length) {
    finish('win', seq);
    return;
  }

  b.busy = true;
  const actorId = pick(enemies);
  const actor = GENERAL_BY_ID[actorId];
  const au = b.units[actorId];
  const ready = actor.skills.filter((s) => (au.cd[s.id] || 0) <= 0);
  const skill = ready.length && Math.random() < 0.42 ? pick(ready) : null;
  const actorSlot = slotEl(actorId);

  pulse(actorSlot, 'is-lunging');

  if (skill) {
    au.cd[skill.id] = skill.cd;
    audio.skill();
    showCallout(actor, skill.name);
    resolveSkill(actorId, skill);
    pushLog(`${actor.name} 施放「${skill.name}」。`, 'skill');
  } else {
    const targets = aliveIds('ally');
    if (targets.length) {
      const targetId = pick(targets);
      const amount = calcDamage(actor, GENERAL_BY_ID[targetId], 1);
      audio.attack();
      applyHits(actorId, [{ targetId, amount }]);
    }
  }

  syncBattle();

  setTimeout(() => {
    if (seq !== battleSeq) return;
    b.busy = false;
    if (!aliveIds('ally').length) {
      finish('lose', seq);
      return;
    }
    if (!aliveIds('enemy').length) {
      finish('win', seq);
      return;
    }
    advanceTurn(seq);
  }, STEP_MS);
}

function advanceTurn(seq) {
  if (seq !== battleSeq) return;
  const b = state.battle;
  if (!b || b.over) return;

  const aliveAllies = b.order.filter((id) => b.units[id].hp > 0);
  if (!aliveAllies.length) {
    finish('lose', seq);
    return;
  }

  const cur = b.order.indexOf(b.activeId);
  let next = null;
  for (let step = 1; step <= b.order.length; step += 1) {
    const id = b.order[(cur + step) % b.order.length];
    if (b.units[id].hp > 0) {
      next = id;
      break;
    }
  }
  if (!next) {
    finish('lose', seq);
    return;
  }

  if (b.order.indexOf(next) <= cur) {
    b.round += 1;
    tickCooldowns();
  }

  b.activeId = next;
  if (!b.targetId || !b.units[b.targetId] || b.units[b.targetId].hp <= 0) {
    b.targetId = aliveIds('enemy')[0] || null;
  }
  b.busy = false;
  syncBattle();
}

function tickCooldowns() {
  const b = state.battle;
  Object.values(b.units).forEach((u) => {
    Object.keys(u.cd).forEach((id) => {
      if (u.cd[id] > 0) u.cd[id] -= 1;
    });
  });
}

function finish(kind, seq) {
  const b = state.battle;
  if (!b || b.over || seq !== battleSeq) return;
  b.over = true;
  b.busy = true;
  b.resultKind = kind;
  syncBattle();
  setTimeout(() => {
    if (seq !== battleSeq) return;
    showResult(kind, false);
  }, FINISH_MS);
}

/* ---------------- 结算 ---------------- */

function showResult(kind, preview) {
  const b = state.battle;
  if (!b) return;
  if (activeOverlay && activeOverlay !== els.result) closeOverlay(activeOverlay, false);

  const win = kind === 'win';
  const survivors = aliveIds('ally').length;
  let rank = 'C';
  if (win) rank = survivors >= 3 ? 'S' : survivors === 2 ? 'A' : 'B';

  const stamp = $('#result-stamp');
  const kicker = $('#result-kicker');
  stamp.textContent = win ? '大捷' : '败北';
  kicker.textContent = win ? '敌军尽退，演武告捷' : '我军尽没，再整旗鼓';
  $('#result-rank').textContent = rank;
  $('#result-round').textContent = b.round;
  $('#result-alive').textContent = survivors;
  $('#result-damage').textContent = b.totalDamage;
  $('#result-note').textContent = preview
    ? '演武预演，非实际战果。'
    : win
      ? '可再战一局，或返回点将。'
      : '收拢残部，再整旗鼓。';

  els.result.classList.toggle('is-lose', !win);
  if (!preview) {
    if (win) audio.win();
    else audio.lose();
    if (!b.recorded) {
      b.recorded = true;
      document.dispatchEvent(new CustomEvent('codex:battle', {
        detail: { win, rank, survivors, round: b.round, damage: b.totalDamage },
      }));
    }
  }
  openOverlay(els.result, { focus: '#result-again' });
}

function openResultPreview() {
  if (!state.battle) {
    state.battle = createBattle();
    renderBattle();
  }
  const b = state.battle;
  showResult(b.over && b.resultKind ? b.resultKind : 'win', !b.over);
}

/* ---------------- 详报 ---------------- */

function openDetail(id) {
  const g = GENERAL_BY_ID[id];
  if (!g) return;
  audio.open();
  const u = state.battle ? state.battle.units[id] : null;
  const hp = u ? Math.max(0, u.hp) : g.hp;

  $('#detail-card').innerHTML = cardHTML(g, {
    context: 'detail',
    unit: u || { hp: g.hp, maxHp: g.hp },
  });
  $('#detail-faction').textContent = `${g.factionName}将`;
  $('#detail-name').textContent = g.name;
  $('#detail-title').textContent = g.title;
  $('#detail-lore').textContent = g.lore;
  $('#detail-stats').innerHTML = `
    <div><dt>生命</dt><dd>${hp}</dd></div>
    <div><dt>攻击</dt><dd>${g.atk}</dd></div>
    <div><dt>防御</dt><dd>${g.def}</dd></div>
    <div><dt>速度</dt><dd>${g.spd}</dd></div>`;
  $('#detail-skills').innerHTML = g.skills.map((s) => {
    const cd = u ? (u.cd[s.id] || 0) : 0;
    return `<li>
      <strong>${s.name}</strong>
      <span>${s.meta}　冷却 ${s.cd} 回合${cd ? `　剩余 ${cd}` : ''}</span>
      <p>${s.desc}</p>
    </li>`;
  }).join('');

  openOverlay(els.detailLayer);
}

/* ---------------- 浮层与焦点 ---------------- */

function openOverlay(el, opts = {}) {
  if (!el) return;
  if (activeOverlay && activeOverlay !== el) closeOverlay(activeOverlay, false);
  overlayPrevFocus = document.activeElement;
  activeOverlay = el;
  el.hidden = false;
  if (el === els.logPanel) els.logBackdrop.hidden = false;

  const focusTarget = opts.focus
    ? el.querySelector(opts.focus)
    : el.querySelector('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
  if (focusTarget) focusTarget.focus({ preventScroll: true });

  document.addEventListener('keydown', overlayKeys);
}

function closeOverlay(el = activeOverlay, restore = true) {
  if (!el) return;
  if (el === els.logPanel) els.logBackdrop.hidden = true;
  el.hidden = true;
  document.removeEventListener('keydown', overlayKeys);
  if (activeOverlay === el) activeOverlay = null;
  if (restore && overlayPrevFocus && overlayPrevFocus.isConnected) {
    overlayPrevFocus.focus({ preventScroll: true });
  }
}

function closeAllLayers(restore = false) {
  if (activeOverlay) closeOverlay(activeOverlay, restore);
  [els.result, els.detailLayer, els.codexDetail, els.logPanel].forEach((el) => {
    if (el && !el.hidden) el.hidden = true;
  });
  els.logBackdrop.hidden = true;
}

function overlayKeys(e) {
  if (!activeOverlay) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    audio.close();
    closeOverlay();
    return;
  }
  if (e.key === 'Tab') {
    trapTab(e, activeOverlay);
  }
}

function trapTab(e, el) {
  const items = $$('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])', el).filter(
    (x) => x.offsetParent !== null,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ---------------- 战报 ---------------- */

function openLog() {
  if (!state.battle) return;
  audio.open();
  renderLog();
  openOverlay(els.logPanel);
}

/* ---------------- 提示 ---------------- */

function toast(text) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 1900);
}

/* ---------------- 导航 ---------------- */

function navigate(name) {
  if (state.screen === 'battle' && name !== 'battle' && state.battle) {
    battleSeq += 1;
    state.battle = null;
    announcedTurn = null;
  }
  state.screen = name;
  $$('.screen').forEach((s) => {
    s.classList.toggle('is-active', s.id === `screen-${name}`);
  });
  if (name === 'battle') {
    ensureBattle();
  }
}

function ensureBattle() {
  if (!state.battle || state.battle.over) {
    battleSeq += 1;
    state.battle = createBattle();
    announcedTurn = null;
    renderBattle();
  } else {
    syncBattle();
  }
}

function resetBattle() {
  battleSeq += 1;
  announcedTurn = null;
  state.battle = createBattle();
  renderBattle();
  if (activeOverlay === els.result) closeOverlay(els.result, false);
}

function go(name) {
  closeAllLayers(false);
  if (location.hash === `#${name}`) {
    navigate(name);
  } else {
    location.hash = `#${name}`;
  }
}

function routeFromHash() {
  const hash = location.hash.replace(/^#/, '');
  closeAllLayers(false);
  if (hash === 'codex' || hash.startsWith('codex/')) {
    navigate('codex');
    if (window.Codex) window.Codex.route(hash);
    return;
  }
  if (hash === 'battle') {
    navigate('battle');
    return;
  }
  if (hash === 'result') {
    navigate('battle');
    openResultPreview();
    return;
  }
  if (hash === 'log') {
    navigate('battle');
    openLog();
    return;
  }
  if (hash === 'detail') {
    navigate('battle');
    openDetail(state.battle.activeId);
    return;
  }
  navigate('home');
}

/* ---------------- 交互 ---------------- */

function handleCard(card) {
  const id = card.dataset.id;
  if (!id) return;

  if (state.screen === 'home') {
    if (card.closest('#feature-card')) {
      openDetail(id);
    } else {
      selectFeatured(id);
    }
    return;
  }

  if (state.screen === 'battle') {
    const b = state.battle;
    if (!b) return;
    const u = b.units[id];
    if (!u) return;
    if (u.side === 'enemy') {
      if (u.hp <= 0) {
        openDetail(id);
        return;
      }
      if (b.busy || b.over) return;
      b.targetId = id;
      audio.target();
      syncBattle();
      toast(`目标：${GENERAL_BY_ID[id].name}`);
      return;
    }
    openDetail(id);
  }
}

function resetTilt(card) {
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
  card.style.setProperty('--mx', '50%');
  card.style.setProperty('--my', '40%');
}

function bindEvents() {
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (
      button &&
      !button.disabled &&
      !button.matches('[data-audio-toggle]') &&
      !button.closest('[data-act]') &&
      !button.closest('#screen-codex') &&
      !button.closest('#cx-detail')
    ) {
      audio.click();
    }

    const toastBtn = e.target.closest('[data-toast]');
    if (toastBtn) {
      toast(toastBtn.dataset.toast);
      return;
    }

    const goBtn = e.target.closest('[data-go]');
    if (goBtn) {
      e.preventDefault();
      go(goBtn.dataset.go);
      return;
    }

    const actionBtn = e.target.closest('[data-act]');
    if (actionBtn) {
      if (actionBtn.disabled) return;
      const b = state.battle;
      if (!b || b.busy || b.over) return;
      if (actionBtn.dataset.act === 'detail') {
        audio.open();
        openDetail(b.activeId);
        return;
      }
      performPlayerAction(actionBtn.dataset.act, actionBtn.dataset.skill);
      return;
    }

    const card = e.target.closest('.card');
    if (card) handleCard(card);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement) {
      const active = document.activeElement;
      if (active.classList && active.classList.contains('card') && active.getAttribute('role') === 'button') {
        e.preventDefault();
        handleCard(active);
      }
    }
  });

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const card = e.target.closest ? e.target.closest('.card') : null;
    if (!card || card.getAttribute('role') !== 'button') return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    card.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`);
  });

  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest ? e.target.closest('.card') : null;
    if (card && !card.contains(e.relatedTarget)) resetTilt(card);
  });

  $('#home-cta').addEventListener('click', () => {
    if (!state.battle || state.battle.over) resetBattle();
    go('battle');
  });

  $('#home-detail').addEventListener('click', () => {
    openDetail(state.featured);
  });

  $('#log-toggle').addEventListener('click', openLog);
  $('#log-close').addEventListener('click', () => closeOverlay(els.logPanel));
  $('#log-backdrop').addEventListener('click', () => closeOverlay(els.logPanel));

  $('#result-open').addEventListener('click', openResultPreview);
  $('#result-again').addEventListener('click', () => {
    closeOverlay(els.result, false);
    resetBattle();
    go('battle');
    toast('战局已重置');
  });

  $('#detail-close').addEventListener('click', () => closeOverlay(els.detailLayer));
  els.detailLayer.addEventListener('click', (e) => {
    if (e.target === els.detailLayer) closeOverlay(els.detailLayer);
  });

  window.addEventListener('hashchange', routeFromHash);
}

/* ---------------- 启动 ---------------- */

renderHome();
bindEvents();
bindAudioControls();
syncAudioControls();
routeFromHash();
