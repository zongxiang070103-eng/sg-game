/** 界面音效：全部由 Web Audio 合成，不加载外部音频。 */
const KEY = 'jiangxing.audio.v2';

interface Saved {
  sound: boolean;
  music: boolean;
}

class AudioBus {
  sound = true;
  music = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private pad: GainNode | null = null;

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Saved>;
        this.sound = saved.sound !== false;
        this.music = saved.music === true;
      }
    } catch {
      /* 忽略损坏的本地设置 */
    }
  }

  save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify({ sound: this.sound, music: this.music }));
    } catch {
      /* localStorage 不可用时静默 */
    }
  }

  private ensure(): boolean {
    if (!this.sound && !this.music) return false;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.sound ? 0.9 : 0;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.music ? 0.5 : 0;
    this.musicBus.connect(this.master);
    return true;
  }

  syncBus(): void {
    if (this.sfxBus) this.sfxBus.gain.value = this.sound ? 0.9 : 0;
    if (this.musicBus) this.musicBus.gain.value = this.music ? 0.5 : 0;
    if (this.music) this.startMusic();
    else this.stopMusic();
    this.save();
  }

  private tone(opts: {
    freq?: number;
    to?: number;
    type?: OscillatorType;
    dur?: number;
    gain?: number;
    delay?: number;
    filter?: number;
  }): void {
    if (!this.sound || !this.ensure() || !this.ctx || !this.sfxBus) return;
    const { freq = 440, to = 0, type = 'sine', dur = 0.18, gain = 0.05, delay = 0, filter = 0 } = opts;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node: AudioNode = g;
    if (filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      g.connect(f);
      node = f;
    }
    osc.connect(g);
    node.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur = 0.14, gain = 0.04, from = 1400, to = 300, delay = 0): void {
    if (!this.sound || !this.ensure() || !this.ctx || !this.sfxBus) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1;
    f.frequency.setValueAtTime(from, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t0);
  }

  click(): void {
    this.tone({ freq: 640, to: 520, type: 'triangle', dur: 0.06, gain: 0.022 });
  }

  select(): void {
    [392, 523.25, 659.25].forEach((f, i) =>
      this.tone({ freq: f, type: 'triangle', dur: 0.12, gain: 0.028, delay: i * 0.04 }),
    );
  }

  open(): void {
    this.tone({ freq: 196, to: 392, type: 'sine', dur: 0.24, gain: 0.035 });
  }

  close(): void {
    this.tone({ freq: 392, to: 196, type: 'sine', dur: 0.2, gain: 0.03 });
  }

  target(): void {
    this.tone({ freq: 880, to: 660, type: 'square', dur: 0.07, gain: 0.018 });
  }

  turn(): void {
    this.tone({ freq: 523.25, type: 'triangle', dur: 0.16, gain: 0.03 });
    this.tone({ freq: 783.99, type: 'triangle', dur: 0.18, gain: 0.02, delay: 0.06 });
  }

  attack(): void {
    this.noise(0.09, 0.05, 2200, 500);
    this.tone({ freq: 180, to: 90, type: 'sawtooth', dur: 0.1, gain: 0.03 });
  }

  hit(delay = 0, guarded = false): void {
    this.noise(0.12, guarded ? 0.03 : 0.05, guarded ? 900 : 1800, 220, delay);
    this.tone({ freq: guarded ? 300 : 160, to: 70, type: 'triangle', dur: 0.12, gain: 0.03, delay });
  }

  shield(): void {
    this.tone({ freq: 330, to: 660, type: 'sine', dur: 0.22, gain: 0.03 });
  }

  heal(delay = 0): void {
    this.tone({ freq: 523.25, to: 783.99, type: 'sine', dur: 0.26, gain: 0.025, delay });
  }

  skill(): void {
    this.tone({ freq: 300, to: 900, type: 'sawtooth', dur: 0.2, gain: 0.02, filter: 2400 });
  }

  ko(delay = 0): void {
    this.tone({ freq: 120, to: 50, type: 'sawtooth', dur: 0.4, gain: 0.04, delay });
    this.noise(0.3, 0.05, 700, 100, delay);
  }

  win(): void {
    [392, 523.25, 659.25, 783.99].forEach((f, i) =>
      this.tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.03, delay: i * 0.1 }),
    );
  }

  lose(): void {
    [220, 174.61, 146.83].forEach((f, i) =>
      this.tone({ freq: f, type: 'sine', dur: 0.4, gain: 0.03, delay: i * 0.14 }),
    );
  }

  private startMusic(): void {
    if (!this.ensure() || !this.ctx || !this.musicBus || this.pad) return;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 2);
    const freqs = [98, 146.83, 196];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.017;
      const lg = this.ctx!.createGain();
      lg.gain.value = 0.008;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      osc.connect(g);
      osc.start();
      lfo.start();
    });
    g.connect(this.musicBus);
    this.pad = g;
  }

  private stopMusic(): void {
    if (!this.pad || !this.ctx) return;
    const g = this.pad;
    this.pad = null;
    g.gain.cancelScheduledValues(this.ctx.currentTime);
    g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
    setTimeout(() => g.disconnect(), 1200);
  }
}

export const audio = new AudioBus();

export function bindAudioControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-audio-toggle="sound"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.sound = !audio.sound;
      audio.syncBus();
      syncAudioControls();
      audio.click();
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-audio-toggle="music"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.music = !audio.music;
      audio.syncBus();
      syncAudioControls();
    });
  });
}

export function syncAudioControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-audio-toggle="sound"]').forEach((btn) => {
    btn.classList.toggle('is-off', !audio.sound);
    btn.setAttribute('aria-pressed', String(audio.sound));
    btn.setAttribute('aria-label', audio.sound ? '关闭音效' : '开启音效');
    btn.title = audio.sound ? '音效：开' : '音效：关';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-audio-toggle="music"]').forEach((btn) => {
    btn.classList.toggle('is-off', !audio.music);
    btn.setAttribute('aria-pressed', String(audio.music));
    btn.setAttribute('aria-label', audio.music ? '关闭环境音乐' : '开启环境音乐');
    btn.title = audio.music ? '环境音乐：开' : '环境音乐：关';
  });
}

// 首次用户手势时解锁音频上下文。
export function unlockAudio(): void {
  if (audio.sound || audio.music) audio.syncBus();
}
