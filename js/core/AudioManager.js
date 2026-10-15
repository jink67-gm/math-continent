// 소리 관리 (효과음 47종 + 배경음악 6곡)
// ─────────────────────────────────────────────────────────────
// - 효과음: assets/audio/sfx/*.mp3 를 미리 불러와(Web Audio) 바로 재생해요.
//           게임 안 이벤트 이름 → 파일 이름 연결은 아래 SFX_MAP 에 있어요.
// - 배경음악: assets/audio/bgm/*.mp3 (한 번에 한 곡만, 바뀔 때 부드럽게 교차)
// - 파일이 없거나 못 불러오면 브라우저에서 만든 소리로 대신해요 → 게임은 멈추지 않아요.
// - 설정: 전체 음량 · 배경음악 음량 · 효과음 음량 · 배경음악/효과음 켜기 · 음소거 (이 기기에 저장)
// - 초등학생용 음량: 파일마다 크기를 측정해 고르게 맞추고(LOUDNESS), 오답·UI 소리는 작게,
//   같은 소리는 짧은 시간 안에 여러 번 겹치지 않게(최소 간격·동시 재생 수 제한) 했어요.

const SFX_DIR = 'assets/audio/sfx/';
const BGM_DIR = 'assets/audio/bgm/';

// 파일별 평균 음량(dB, 측정값) → 모두 비슷한 크기로 맞추는 데 써요
const LOUDNESS = {
  attack_combo_1: -22.2, attack_combo_2: -21.1, attack_combo_3: -16.3, attack_miss: -16.2, boss_appear: -16.0,
  boss_dash: -16.3, boss_judgement_blast: -17.7, boss_judgement_charge: -13.0, boss_shield_break: -19.3, boss_slash: -17.5,
  chest_open: -13.5, critical_hit: -17.9, dodge: -18.3, elite_spawn: -12.9, equip: -16.8, gold_pickup: -15.7, heal: -14.0,
  hit_heavy: -17.2, hit_light: -15.6, item_common: -15.4, item_epic: -13.6, item_rare: -14.7, level_up: -13.1,
  math_correct: -16.5, math_open: -17.2, math_retry_ready: -16.8, math_wrong: -14.3, monster_aoe_impact: -16.6,
  monster_aoe_warning: -12.3, monster_charge: -15.1, monster_death: -15.9, monster_lunge: -18.0, monster_projectile: -11.6,
  monster_windup: -12.6, player_hit: -15.8, potion_drink: -16.4, quest_complete: -13.7, seal_unlock: -13.4, shield_on: -13.6,
  skill_cast: -11.3, skill_unlock: -14.3, sword_clash: -17.5, ui_click: -18.4, ui_close: -14.8, ui_confirm: -16.2,
  ui_open: -14.9, upgrade_success: -13.5,
};
const TARGET_DB = -19; // 기준 크기

// 게임 이벤트 → 효과음 파일
// f: 파일 이름 / v: 추가 크기(1 = 기준) / gap: 같은 소리 최소 간격(ms) / max: 동시에 울릴 수 있는 수
export const SFX_MAP = {
  // UI
  click: { f: 'ui_click', v: 0.55, gap: 60 },
  select: { f: 'ui_click', v: 0.45, gap: 60 },
  confirm: { f: 'ui_confirm', v: 0.6 },
  menuOpen: { f: 'ui_open', v: 0.5 },
  menuClose: { f: 'ui_close', v: 0.5 },
  // 플레이어 공격 (실제 휘두르기가 시작될 때)
  swing1: { f: 'attack_combo_1', v: 0.9, gap: 60 },
  swing2: { f: 'attack_combo_2', v: 0.95, gap: 60 },
  swing3: { f: 'attack_combo_3', v: 1.0, gap: 60 },
  attack: { f: 'attack_combo_1', v: 0.9 },
  // 적중했을 때만
  hit: { f: 'hit_light', v: 0.8, gap: 60, max: 3 },
  hitHeavy: { f: 'hit_heavy', v: 1.05, gap: 60, max: 2 },
  crit: { f: 'critical_hit', v: 1.0, gap: 80, max: 2 },
  block: { f: 'sword_clash', v: 0.75, gap: 90, max: 2 },
  dodgeMiss: { f: 'attack_miss', v: 0.6, gap: 120 },
  playerHurt: { f: 'player_hit', v: 0.85, gap: 120, max: 2 },
  kill: { f: 'monster_death', v: 0.75, gap: 80, max: 3 },
  eliteDown: { f: 'monster_death', v: 1.0 },
  dodge: { f: 'dodge', v: 0.8 },
  skill: { f: 'skill_cast', v: 0.75 },
  heal: { f: 'heal', v: 0.8 },
  potion: { f: 'potion_drink', v: 0.8 },
  // 몬스터 (여러 마리가 동시에 내도 과하게 겹치지 않게)
  windup: { f: 'monster_windup', v: 0.4, gap: 260, max: 2 },
  eliteWindup: { f: 'monster_windup', v: 0.65, gap: 200, max: 2 },
  charge: { f: 'monster_charge', v: 0.6, gap: 250, max: 2 },
  monsterSwing: { f: 'monster_lunge', v: 0.6, gap: 160, max: 2 },
  jump: { f: 'monster_lunge', v: 0.45, gap: 200, max: 2 },
  land: { f: 'monster_aoe_impact', v: 0.4, gap: 200, max: 2 },
  shoot: { f: 'monster_projectile', v: 0.4, gap: 140, max: 3 },
  aoe: { f: 'monster_aoe_warning', v: 0.5, gap: 300, max: 2 },
  explode: { f: 'monster_aoe_impact', v: 0.65, gap: 120, max: 3 },
  summon: { f: 'skill_cast', v: 0.55, gap: 400 },
  eliteAppear: { f: 'elite_spawn', v: 0.75, gap: 1500 },
  // 보스
  bossAppear: { f: 'boss_appear', v: 0.95, gap: 800 },
  bossRoar: { f: 'boss_judgement_charge', v: 0.8, gap: 600 },
  bossSlash: { f: 'boss_slash', v: 0.9, gap: 120 },
  bossDash: { f: 'boss_dash', v: 0.9, gap: 300 },
  bossJudgeCharge: { f: 'boss_judgement_charge', v: 0.85, gap: 600 },
  bossJudgeBlast: { f: 'boss_judgement_blast', v: 1.0, gap: 400 },
  bossDefeat: { f: 'monster_death', v: 1.0 },
  shieldUp: { f: 'shield_on', v: 0.8 },
  sealBreak: { f: 'boss_shield_break', v: 1.0 },
  sealUnlock: { f: 'seal_unlock', v: 0.85 },
  // 아이템 · 성장
  gold: { f: 'gold_pickup', v: 0.55, gap: 70, max: 3 },
  item: { f: 'item_common', v: 0.65, gap: 80 },
  rareItem: { f: 'item_rare', v: 0.85 },
  epicItem: { f: 'item_epic', v: 0.9 },
  rareDrop: { f: 'item_rare', v: 0.55, gap: 300 },
  epicDrop: { f: 'item_epic', v: 0.6, gap: 300 },
  chestOpen: { f: 'chest_open', v: 0.8 },
  equip: { f: 'equip', v: 0.8 },
  forge: { f: 'upgrade_success', v: 0.9 },
  levelUp: { f: 'level_up', v: 0.85 },
  skillLearn: { f: 'skill_unlock', v: 0.85 },
  questComplete: { f: 'quest_complete', v: 0.8 },
  // 수학
  mathOpen: { f: 'math_open', v: 0.7 },
  correct: { f: 'math_correct', v: 0.9 },
  wrong: { f: 'math_wrong', v: 0.45 },       // 오답은 작고 부드럽게
  mathRetry: { f: 'math_retry_ready', v: 0.55 },
};

// 배경음악: 장면 → 곡 파일 (gain: 곡마다 크기 맞춤)
export const BGM_FILES = {
  title: { f: 'title_theme', gain: 0.75 },
  village: { f: 'town_theme', gain: 0.9 },
  field: { f: 'field_theme', gain: 0.72 },
  dungeon: { f: 'dungeon_theme', gain: 1.0 },
  boss: { f: 'boss_theme', gain: 0.82 },
  clear: { f: 'clear_theme', gain: 0.8, once: true },
};
// 예전 이름 호환 (게임 코드가 쓰는 이름)
export const AUDIO_FILES = {
  bgm: Object.fromEntries(Object.entries(BGM_FILES).map(([k, v]) => [k, `${BGM_DIR}${v.f}.mp3`])),
  sfx: Object.fromEntries(Object.entries(SFX_MAP).map(([k, v]) => [k, `${SFX_DIR}${v.f}.mp3`])),
};

// 마을 배경음악 (파일이 없을 때 자동 연주는 마을마다 조를 바꿔요)
const VILLAGE_KEY = { fractionValley: 0, cubeCity: 2, decimalHarbor: -3, ratioKingdom: -5, circleForest: 4, solidPeaks: -1 };

const DEFAULTS = { masterVolume: 0.8, bgmVolume: 0.45, sfxVolume: 0.7, bgmOn: true, sfxOn: true, muted: false };
const MAX_VOICES = 14; // 동시에 울리는 효과음 전체 최대 수

export class AudioManager {
  constructor() {
    this.status = new Map(); // 경로 → 'checking' | 'ok' | 'missing'
    this.cache = new Map();
    this.buffers = new Map(); // 효과음 파일 → AudioBuffer
    this.failed = new Set();
    this.loading = null;
    this.voices = new Map();  // 파일 → 지금 울리는 수
    this.totalVoices = 0;
    this.bgm = null;      // 파일 배경음악 (HTMLAudioElement)
    this.bgmFile = null;
    this.bgmKey = null;
    this.ctx = null;
    this.settings = { ...DEFAULTS };
    this.music = null;    // 파일이 없을 때 자동 연주
    this.lastPlay = {};

    const unlock = () => {
      this.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  // ---------- 장치 ----------
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.bgmBus = this.ctx.createGain();
        // 너무 큰 소리가 겹칠 때 눌러 주는 리미터 (아이들 귀 보호)
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 8;
        comp.ratio.value = 6;
        comp.attack.value = 0.004;
        comp.release.value = 0.18;
        this.sfxBus.connect(this.master);
        this.bgmBus.connect(this.master);
        this.master.connect(comp).connect(this.ctx.destination);
        this.noiseBuf = this.makeNoise();
        this.applyGains();
        this.preloadSfx();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* 소리 없이 진행 */ }
    if (this.bgmKey) {
      if (this.bgm?.paused && this.bgmLevel > 0) this.bgm.play().catch(() => {});
      else if (!this.bgm && !this.music) this.playBgm(this.bgmKey, { force: true });
    }
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 1;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // 효과음 47종 미리 불러오기 (못 불러온 것은 자동으로 만든 소리 사용)
  preloadSfx() {
    if (this.loading || !this.ctx) return this.loading;
    const files = [...new Set(Object.values(SFX_MAP).map((v) => v.f))];
    let i = 0;
    const worker = async () => {
      while (i < files.length) {
        const f = files[i++];
        try {
          const res = await fetch(`${SFX_DIR}${f}.mp3`);
          if (!res.ok) throw new Error(res.status);
          const data = await res.arrayBuffer();
          const buf = await new Promise((ok, bad) => this.ctx.decodeAudioData(data, ok, bad));
          this.buffers.set(f, buf);
        } catch (e) {
          this.failed.add(f);
        }
      }
    };
    this.loading = Promise.all([worker(), worker(), worker(), worker()]);
    return this.loading;
  }

  get sfxLevel() {
    const s = this.settings;
    return s.muted || !s.sfxOn ? 0 : s.masterVolume * s.sfxVolume;
  }

  get bgmLevel() {
    const s = this.settings;
    return s.muted || !s.bgmOn ? 0 : s.masterVolume * s.bgmVolume;
  }

  applyGains() {
    if (this.master) {
      const t = this.ctx.currentTime;
      this.sfxBus.gain.setTargetAtTime(this.sfxLevel, t, 0.02);
      this.bgmBus.gain.setTargetAtTime(this.bgmLevel * 0.55, t, 0.05);
      this.master.gain.value = 1;
    }
    if (this.bgm && !this.fading) this.bgm.volume = this.bgmVolumeFor(this.bgmFile);
  }

  bgmVolumeFor(file) {
    const g = Object.values(BGM_FILES).find((b) => b.f === file)?.gain ?? 1;
    return Math.max(0, Math.min(1, this.bgmLevel * g));
  }

  applySettings(s = {}) {
    Object.assign(this.settings, s);
    if (s.muted === false && s.bgmOn === undefined) this.settings.bgmOn = this.settings.bgmOn ?? true;
    this.applyGains();
    if (this.bgmLevel <= 0) {
      this.stopMusic();
      if (this.bgm) this.bgm.pause();
    } else if (this.bgmKey) {
      if (this.bgm) {
        if (this.bgm.paused) this.bgm.play().catch(() => {});
      } else if (!this.music) this.playBgm(this.bgmKey, { force: true });
    }
  }

  // 파일이 실제로 있는지 한 번만 확인 (배경음악용)
  probe(path) {
    const st = this.status.get(path);
    if (st && st !== 'checking') return Promise.resolve(st);
    if (st === 'checking') return this.status.get(`${path}#p`);
    this.status.set(path, 'checking');
    const p = new Promise((resolve) => {
      const a = new Audio();
      const done = (result) => {
        if (this.status.get(path) !== 'checking') return;
        this.status.set(path, result);
        if (result === 'ok') this.cache.set(path, a);
        resolve(result);
      };
      a.addEventListener('canplay', () => done('ok'), { once: true });
      a.addEventListener('error', () => done('missing'), { once: true });
      setTimeout(() => done(a.readyState >= 2 ? 'ok' : 'missing'), 6000);
      a.preload = 'auto';
      a.src = path;
    });
    this.status.set(`${path}#p`, p);
    return p;
  }

  // ---------- 효과음 ----------
  // opts.vol: 추가 크기 / opts.rate: 재생 속도(살짝 바꿔 반복감 줄이기)
  playSfx(key, opts = {}) {
    if (this.sfxLevel <= 0) return;
    const def = SFX_MAP[key];
    const now = performance.now();
    const gap = def?.gap ?? 45;
    if (now - (this.lastPlay[key] || 0) < gap) return;
    this.lastPlay[key] = now;
    const buf = def && this.buffers.get(def.f);
    if (buf && this.ctx?.state === 'running') {
      const live = this.voices.get(def.f) || 0;
      if (live >= (def.max ?? 3) || this.totalVoices >= MAX_VOICES) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.rate ?? (def.max > 1 ? 0.96 + Math.random() * 0.08 : 1);
      const g = this.ctx.createGain();
      const norm = Math.pow(10, (TARGET_DB - (LOUDNESS[def.f] ?? TARGET_DB)) / 20);
      g.gain.value = Math.min(1.6, norm) * (def.v ?? 1) * (opts.vol ?? 1);
      src.connect(g).connect(this.sfxBus);
      this.voices.set(def.f, live + 1);
      this.totalVoices += 1;
      src.onended = () => {
        this.voices.set(def.f, Math.max(0, (this.voices.get(def.f) || 1) - 1));
        this.totalVoices = Math.max(0, this.totalVoices - 1);
      };
      src.start();
      return;
    }
    // 파일이 아직 없거나 못 불러왔으면 만든 소리
    this.synth(key);
  }

  synth(key) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const recipe = SFX[key] || SFX[SYNTH_ALIAS[key]];
    if (!recipe) return;
    try { recipe(new Voice(this, ctx.currentTime)); } catch (e) { /* 무시 */ }
  }

  // ---------- 배경음악 ----------
  // 장면의 bgm 이름 → 곡 종류
  trackKey(key) {
    if (key in VILLAGE_KEY) return `village:${key}`;
    return key || 'field';
  }

  async playBgm(key, { force = false } = {}) {
    const k = key && key.includes(':') ? key : this.trackKey(key);
    if (this.bgmKey === k && !force) return;
    const name = k.split(':')[0];
    const info = BGM_FILES[name] || BGM_FILES.field;
    // 같은 곡 파일이면(마을 → 다른 마을) 끊지 않고 이어서
    if (!force && this.bgm && this.bgmFile === info.f && !this.bgm.paused) {
      this.bgmKey = k;
      return;
    }
    this.bgmKey = k;
    if (this.bgmLevel <= 0) {
      this.fadeOutBgm();
      this.stopMusic();
      return;
    }
    const path = `${BGM_DIR}${info.f}.mp3`;
    const st = await this.probe(path);
    if (this.bgmKey !== k) return;
    if (st === 'ok') {
      this.stopMusic();
      this.fadeOutBgm();
      const a = new Audio(path); // 곡마다 새 요소 (교차 재생용)
      a.loop = !info.once;
      a.volume = 0;
      this.bgm = a;
      this.bgmFile = info.f;
      a.play().catch(() => {});
      this.fadeTo(a, this.bgmVolumeFor(info.f), 0.9);
      return;
    }
    this.fadeOutBgm();
    this.startMusic(k);
  }

  fadeTo(a, target, sec) {
    const start = a.volume;
    const t0 = performance.now();
    this.fading = true;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (sec * 1000));
      a.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k < 1) requestAnimationFrame(step);
      else this.fading = false;
    };
    step();
  }

  fadeOutBgm() {
    const old = this.bgm;
    if (!old) return;
    this.bgm = null;
    this.bgmFile = null;
    const v0 = old.volume;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 700);
      old.volume = Math.max(0, v0 * (1 - k));
      if (k < 1) requestAnimationFrame(step);
      else old.pause();
    };
    step();
  }

  stopBgm() {
    this.fadeOutBgm();
    this.stopMusic();
    this.bgmKey = null;
  }

  startMusic(trackKey) {
    this.stopMusic();
    if (!this.ctx || this.ctx.state !== 'running' || this.bgmLevel <= 0) return;
    const [name, village] = trackKey.split(':');
    const song = SONGS[name] || SONGS.field;
    this.music = new Sequencer(this, song, village ? VILLAGE_KEY[village] || 0 : 0);
    this.music.start();
  }

  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music = null;
    }
  }
}

// 파일이 없을 때 새 이벤트 이름을 비슷한 만든 소리로
const SYNTH_ALIAS = {
  confirm: 'click', dodgeMiss: 'dodge', heal: 'skill', potion: 'item', bossSlash: 'monsterSwing', bossDash: 'charge',
  bossJudgeCharge: 'bossRoar', bossJudgeBlast: 'explode', sealUnlock: 'sealBreak', epicItem: 'epicDrop', chestOpen: 'item',
  questComplete: 'correct', mathRetry: 'click',
};

// ================== 소리 만들기 도구 ==================
class Voice {
  constructor(am, t) {
    this.am = am;
    this.ctx = am.ctx;
    this.t = t;
    this.out = am.sfxBus;
  }

  // 음 하나: freq → to(미끄러짐), 길이, 파형, 크기
  tone(freq, dur, { type = 'square', vol = 0.18, to = null, at = 0, attack = 0.005, out = null } = {}) {
    const c = this.ctx;
    const t = this.t + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out || this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // 잡음: 휘두르는 바람 소리, 타격, 폭발
  noise(dur, { vol = 0.25, freq = 1200, to = null, q = 1, type = 'bandpass', at = 0, attack = 0.004 } = {}) {
    const c = this.ctx;
    const t = this.t + at;
    const src = c.createBufferSource();
    src.buffer = this.am.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  notes(list, { type = 'square', vol = 0.12, gap = 0.08, len = 0.12 } = {}) {
    list.forEach((f, i) => this.tone(f, len, { type, vol, at: i * gap }));
  }
}

const N = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI → Hz

// 효과음 조리법
const SFX = {
  // UI
  click: (v) => v.tone(1200, 0.05, { type: 'triangle', vol: 0.12, to: 900 }),
  select: (v) => { v.tone(880, 0.06, { type: 'triangle', vol: 0.12 }); v.tone(1320, 0.08, { type: 'triangle', vol: 0.1, at: 0.05 }); },
  menuOpen: (v) => { v.noise(0.12, { vol: 0.08, freq: 2400, to: 4800, q: 2 }); v.tone(660, 0.08, { type: 'triangle', vol: 0.08, to: 990 }); },
  menuClose: (v) => { v.noise(0.1, { vol: 0.07, freq: 3600, to: 1500, q: 2 }); v.tone(800, 0.07, { type: 'triangle', vol: 0.07, to: 520 }); },
  // 전투: 플레이어
  swing1: (v) => v.noise(0.14, { vol: 0.22, freq: 1400, to: 3800, q: 1.4, attack: 0.01 }),
  swing2: (v) => v.noise(0.16, { vol: 0.24, freq: 3800, to: 1300, q: 1.4, attack: 0.01 }),
  swing3: (v) => { v.noise(0.26, { vol: 0.3, freq: 900, to: 4200, q: 1.1, attack: 0.03 }); v.tone(180, 0.22, { type: 'sawtooth', vol: 0.08, to: 90 }); },
  attack: (v) => v.noise(0.14, { vol: 0.2, freq: 1600, to: 3600, q: 1.4 }),
  hit: (v) => { v.noise(0.09, { vol: 0.32, freq: 900, to: 300, q: 0.8, type: 'lowpass' }); v.tone(220, 0.07, { type: 'square', vol: 0.1, to: 120 }); },
  hitHeavy: (v) => { v.noise(0.22, { vol: 0.45, freq: 700, to: 120, q: 0.7, type: 'lowpass' }); v.tone(140, 0.2, { type: 'sawtooth', vol: 0.16, to: 50 }); v.noise(0.05, { vol: 0.2, freq: 5000, q: 2, at: 0.01 }); },
  crit: (v) => { SFX.hit(v); v.tone(1760, 0.12, { type: 'triangle', vol: 0.1, at: 0.02, to: 2400 }); },
  block: (v) => { v.tone(1900, 0.18, { type: 'triangle', vol: 0.14 }); v.tone(2850, 0.14, { type: 'sine', vol: 0.08 }); v.noise(0.05, { vol: 0.15, freq: 4000, q: 3 }); },
  playerHurt: (v) => { v.noise(0.14, { vol: 0.32, freq: 600, to: 200, type: 'lowpass' }); v.tone(330, 0.16, { type: 'square', vol: 0.12, to: 140 }); },
  kill: (v) => { v.noise(0.25, { vol: 0.2, freq: 1800, to: 400, q: 0.9 }); v.tone(520, 0.12, { type: 'triangle', vol: 0.1, to: 260, at: 0.03 }); },
  eliteDown: (v) => { v.noise(0.5, { vol: 0.35, freq: 900, to: 100, type: 'lowpass' }); v.notes([N(67), N(71), N(74), N(79)], { type: 'square', vol: 0.09, gap: 0.07 }); },
  dodge: (v) => v.noise(0.18, { vol: 0.18, freq: 2600, to: 900, q: 2.5 }),
  skill: (v) => { v.notes([N(72), N(76), N(79), N(84)], { type: 'triangle', vol: 0.1, gap: 0.04, len: 0.18 }); v.noise(0.3, { vol: 0.12, freq: 3000, to: 6000, q: 3 }); },
  // 몬스터
  windup: (v) => v.tone(300, 0.22, { type: 'sawtooth', vol: 0.05, to: 520, attack: 0.08 }),
  eliteWindup: (v) => { v.tone(160, 0.35, { type: 'sawtooth', vol: 0.08, to: 320, attack: 0.1 }); v.noise(0.35, { vol: 0.06, freq: 400, to: 1200, q: 4 }); },
  charge: (v) => { v.noise(0.4, { vol: 0.2, freq: 300, to: 1500, q: 1.5, attack: 0.05 }); v.tone(110, 0.3, { type: 'sawtooth', vol: 0.07 }); },
  monsterSwing: (v) => v.noise(0.12, { vol: 0.16, freq: 1100, to: 2400, q: 1.6 }),
  jump: (v) => v.tone(200, 0.2, { type: 'square', vol: 0.07, to: 520 }),
  land: (v) => { v.noise(0.22, { vol: 0.32, freq: 260, to: 70, type: 'lowpass' }); v.tone(90, 0.18, { type: 'sine', vol: 0.2, to: 45 }); },
  shoot: (v) => { v.tone(900, 0.12, { type: 'square', vol: 0.06, to: 300 }); v.noise(0.08, { vol: 0.08, freq: 3000, q: 2 }); },
  aoe: (v) => { v.tone(140, 0.4, { type: 'sawtooth', vol: 0.07, to: 280, attack: 0.1 }); v.noise(0.4, { vol: 0.1, freq: 500, to: 1500, q: 2, attack: 0.1 }); },
  explode: (v) => { v.noise(0.45, { vol: 0.42, freq: 900, to: 80, type: 'lowpass', attack: 0.005 }); v.tone(70, 0.35, { type: 'sine', vol: 0.25, to: 35 }); },
  summon: (v) => { v.tone(300, 0.5, { type: 'triangle', vol: 0.08, to: 900, attack: 0.1 }); v.noise(0.5, { vol: 0.08, freq: 1500, to: 4000, q: 5 }); },
  eliteAppear: (v) => { v.tone(110, 0.6, { type: 'sawtooth', vol: 0.1, attack: 0.05 }); v.tone(165, 0.6, { type: 'sawtooth', vol: 0.07, attack: 0.05 }); v.noise(0.6, { vol: 0.08, freq: 300, type: 'lowpass' }); },
  bossAppear: (v) => { [55, 58, 62].forEach((m, i) => v.tone(N(m - 12), 0.9, { type: 'sawtooth', vol: 0.12, at: i * 0.18, attack: 0.05 })); v.noise(1.2, { vol: 0.16, freq: 200, to: 60, type: 'lowpass' }); },
  bossRoar: (v) => { v.noise(1.0, { vol: 0.35, freq: 500, to: 120, q: 1.2, attack: 0.08 }); v.tone(95, 0.9, { type: 'sawtooth', vol: 0.16, to: 60, attack: 0.08 }); v.tone(140, 0.9, { type: 'square', vol: 0.06, to: 80, attack: 0.08 }); },
  bossDefeat: (v) => { v.noise(0.8, { vol: 0.3, freq: 700, to: 60, type: 'lowpass' }); v.notes([N(60), N(64), N(67), N(72), N(76), N(79), N(84)], { type: 'square', vol: 0.09, gap: 0.09, len: 0.2 }); },
  // 아이템
  gold: (v) => { v.tone(1568, 0.06, { type: 'square', vol: 0.06 }); v.tone(2093, 0.12, { type: 'square', vol: 0.06, at: 0.05 }); },
  item: (v) => { v.tone(988, 0.06, { type: 'triangle', vol: 0.1 }); v.tone(1319, 0.1, { type: 'triangle', vol: 0.1, at: 0.05 }); },
  rareItem: (v) => v.notes([N(76), N(80), N(83), N(88)], { type: 'triangle', vol: 0.11, gap: 0.06, len: 0.16 }),
  rareDrop: (v) => { v.notes([N(79), N(83), N(86), N(91)], { type: 'sine', vol: 0.12, gap: 0.07, len: 0.3 }); v.noise(0.6, { vol: 0.05, freq: 6000, q: 6 }); },
  epicDrop: (v) => { v.notes([N(72), N(76), N(79), N(84), N(88), N(91)], { type: 'triangle', vol: 0.12, gap: 0.07, len: 0.35 }); v.noise(0.9, { vol: 0.07, freq: 7000, q: 6 }); },
  equip: (v) => { v.noise(0.06, { vol: 0.18, freq: 3500, q: 3 }); v.tone(700, 0.1, { type: 'square', vol: 0.06, at: 0.04 }); v.tone(1050, 0.12, { type: 'triangle', vol: 0.08, at: 0.1 }); },
  forge: (v) => { [0, 0.16, 0.32].forEach((at) => { v.noise(0.08, { vol: 0.3, freq: 4200, q: 4, at }); v.tone(1800, 0.12, { type: 'triangle', vol: 0.08, at }); }); v.notes([N(72), N(79), N(84)], { type: 'square', vol: 0.08, gap: 0.08, len: 0.2 }); },
  // 성장
  exp: (v) => v.tone(1320, 0.05, { type: 'sine', vol: 0.05, to: 1760 }),
  levelUp: (v) => { v.notes([N(60), N(64), N(67), N(72)], { type: 'square', vol: 0.1, gap: 0.08, len: 0.14 }); v.tone(N(76), 0.5, { type: 'triangle', vol: 0.12, at: 0.34 }); v.tone(N(84), 0.5, { type: 'triangle', vol: 0.08, at: 0.34 }); },
  skillLearn: (v) => { v.notes([N(67), N(71), N(74), N(79), N(83)], { type: 'triangle', vol: 0.11, gap: 0.07, len: 0.3 }); v.noise(0.7, { vol: 0.06, freq: 5000, q: 5 }); },
  // 수학
  mathOpen: (v) => { v.tone(N(79), 0.25, { type: 'sine', vol: 0.1 }); v.tone(N(86), 0.35, { type: 'sine', vol: 0.08, at: 0.1 }); },
  correct: (v) => v.notes([N(72), N(76), N(79), N(84)], { type: 'triangle', vol: 0.13, gap: 0.07, len: 0.18 }),
  wrong: (v) => { v.tone(220, 0.16, { type: 'sawtooth', vol: 0.09 }); v.tone(175, 0.24, { type: 'sawtooth', vol: 0.09, at: 0.14 }); },
  shieldUp: (v) => { v.tone(N(67), 0.5, { type: 'sine', vol: 0.1, to: N(79), attack: 0.08 }); v.tone(N(74), 0.6, { type: 'triangle', vol: 0.07, at: 0.1, to: N(86) }); v.noise(0.6, { vol: 0.06, freq: 3000, to: 7000, q: 6 }); },
  sealBreak: (v) => { v.noise(0.5, { vol: 0.3, freq: 5000, to: 800, q: 1 }); v.notes([N(84), N(79), N(76), N(72)], { type: 'triangle', vol: 0.1, gap: 0.05, len: 0.25 }); v.tone(80, 0.4, { type: 'sine', vol: 0.2, to: 40, at: 0.05 }); },
};

// ================== 배경음악 (자동 연주) ==================
// 16분음표 단위로 다음 음을 미리 예약하는 간단한 시퀀서
// prog: 마디마다 화음 (근음 반음 위치, minor 여부)
const SONGS = {
  title: { bpm: 92, root: 60, prog: [[0, 0], [7, 0], [9, 1], [5, 0]], style: 'title' },
  village: { bpm: 84, root: 65, prog: [[0, 0], [5, 0], [0, 0], [7, 0]], style: 'village' },
  field: { bpm: 118, root: 62, prog: [[0, 0], [-2, 0], [5, 0], [0, 0]], style: 'field' },
  dungeon: { bpm: 70, root: 57, prog: [[0, 1], [-4, 0], [5, 1], [7, 0]], style: 'dungeon' },
  boss: { bpm: 150, root: 50, prog: [[0, 1], [-4, 0], [-2, 0], [0, 1]], style: 'boss' },
  clear: { bpm: 120, root: 60, prog: [[0, 0], [5, 0], [7, 0], [0, 0]], style: 'clear', once: true },
};

class Sequencer {
  constructor(am, song, transpose = 0) {
    this.am = am;
    this.ctx = am.ctx;
    this.song = song;
    this.tr = transpose;
    this.step = 0;
    this.timer = null;
    this.out = am.ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(am.bgmBus);
    this.next = 0;
    this.melody = this.makeMelody();
  }

  start() {
    const t = this.ctx.currentTime;
    this.out.gain.setValueAtTime(0, t);
    this.out.gain.linearRampToValueAtTime(1, t + 1.2);
    this.next = t + 0.08;
    this.timer = setInterval(() => this.tick(), 40);
  }

  stop() {
    clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0, t + 0.5);
    const o = this.out;
    setTimeout(() => o.disconnect(), 700);
  }

  get sixteenth() {
    return 60 / this.song.bpm / 4;
  }

  tick() {
    const ahead = this.ctx.currentTime + 0.15;
    while (this.next < ahead) {
      this.play(this.step, this.next);
      this.next += this.sixteenth;
      this.step += 1;
      if (this.song.once && this.step >= 64) {
        clearInterval(this.timer);
        return;
      }
    }
  }

  // 곡마다 간단한 선율을 미리 만들어 둠 (8마디 반복)
  makeMelody() {
    const major = [0, 2, 4, 7, 9, 12, 14, 16];
    const minor = [0, 3, 5, 7, 10, 12, 15];
    const scale = this.song.style === 'dungeon' || this.song.style === 'boss' ? minor : major;
    let seed = this.song.bpm * 7 + this.song.root;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const mel = [];
    let idx = 2;
    for (let i = 0; i < 128; i++) {
      const rest = rnd() < (this.song.style === 'dungeon' ? 0.7 : 0.45);
      idx = Math.max(0, Math.min(scale.length - 1, idx + Math.round((rnd() - 0.5) * 3)));
      mel.push(rest || i % 2 === 1 ? null : scale[idx]);
    }
    return mel;
  }

  note(m, t, dur, type, vol, { attack = 0.01, release = null } = {}) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = N(m + this.tr);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (release ?? dur));
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + (release ?? dur) + 0.05);
  }

  drum(kind, t, vol = 0.3) {
    const c = this.ctx;
    if (kind === 'kick') {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(this.out);
      o.start(t);
      o.stop(t + 0.2);
      return;
    }
    const src = c.createBufferSource();
    src.buffer = this.am.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = kind === 'hat' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'hat' ? 7000 : 1800;
    const g = c.createGain();
    const len = kind === 'hat' ? 0.04 : 0.14;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.02);
  }

  play(step, t) {
    const S = this.song;
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const [deg, minor] = S.prog[bar % S.prog.length];
    const root = S.root + deg;
    const chord = [0, minor ? 3 : 4, 7];
    const sx = this.sixteenth;
    const mel = this.melody[(step / 1) % this.melody.length];

    switch (S.style) {
      case 'title':
      case 'clear': {
        if (s === 0) chord.forEach((c) => this.note(root + c - 12, t, sx * 16, 'sine', 0.05, { attack: 0.3 }));
        if (s % 2 === 0) this.note(root + chord[(s / 2) % 3] + 12, t, sx * 2, 'triangle', 0.05);
        if (s % 4 === 0) this.note(root - 24, t, sx * 4, 'triangle', 0.09);
        if (mel != null && s % 4 === 0) this.note(S.root + mel + 12, t, sx * 3, 'square', 0.025);
        if (S.style === 'clear' && s % 4 === 0) this.drum('kick', t, 0.18);
        break;
      }
      case 'village': {
        if (s === 0 || s === 8) chord.forEach((c) => this.note(root + c, t, sx * 8, 'sine', 0.035, { attack: 0.15 }));
        if (s % 4 === 0) this.note(root - 12 + (s === 8 ? 7 : 0), t, sx * 4, 'triangle', 0.08);
        if ([2, 6, 10, 14].includes(s)) this.note(root + chord[(s >> 2) % 3] + 12, t, sx * 2, 'triangle', 0.035);
        if (mel != null && s % 4 === 0) this.note(S.root + mel + 12, t, sx * 4, 'triangle', 0.04);
        break;
      }
      case 'field': {
        if (s % 2 === 0) this.note(root - 12 + (s % 8 === 4 ? 7 : 0), t, sx * 2, 'triangle', 0.09);
        if (s % 2 === 1) this.note(root + chord[(s >> 1) % 3] + 12, t, sx, 'square', 0.022);
        if (mel != null && s % 2 === 0) this.note(S.root + mel + 12, t, sx * 2, 'square', 0.03);
        if (s % 8 === 0) this.drum('kick', t, 0.22);
        if (s % 8 === 4) this.drum('snare', t, 0.08);
        if (s % 2 === 0) this.drum('hat', t, 0.035);
        break;
      }
      case 'dungeon': {
        if (s === 0) { this.note(root - 24, t, sx * 16, 'sawtooth', 0.025, { attack: 0.6 }); this.note(root - 12, t, sx * 16, 'sine', 0.05, { attack: 0.6 }); }
        if (s % 6 === 0) this.note(root + chord[(s / 6) % 3] + 12, t, sx * 3, 'triangle', 0.035, { release: sx * 6 });
        if (mel != null && s % 4 === 0 && bar % 2 === 1) this.note(S.root + mel + 12, t, sx * 4, 'sine', 0.035);
        if (s === 0 || s === 3) this.drum('kick', t, 0.1);
        break;
      }
      case 'boss': {
        this.note(root - 12 + (s % 4 === 3 ? 12 : 0), t, sx, 'sawtooth', 0.05);
        if (s % 4 === 0) chord.forEach((c) => this.note(root + c, t, sx * 3, 'square', 0.018));
        if (mel != null && s % 2 === 0) this.note(S.root + mel + 24, t, sx * 2, 'sawtooth', 0.025);
        if (s % 4 === 0) this.drum('kick', t, 0.28);
        if (s % 8 === 4) this.drum('snare', t, 0.14);
        this.drum('hat', t, s % 2 ? 0.02 : 0.04);
        break;
      }
      default:
        break;
    }
  }
}
