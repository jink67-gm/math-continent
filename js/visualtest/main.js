// 비주얼 테스트 시작점 (visual_test.html)
// 본 게임(index.html)과 완전히 따로 동작합니다. 본 게임의 저장·수학·퀘스트·Firebase 코드는 건드리지 않아요.
// 소리는 본 게임의 AudioManager를 그대로 사용 (같은 효과음·배경음악·음량 설정).
import { loadImages, img, frames, missing } from './images.js';
import { World } from './world.js';
import { MAPS } from './maps.js';
import { HERO, drawFrame } from './hero.js';
import { AudioManager } from '../core/AudioManager.js';
import { storage } from '../core/utils.js';

const KEY = 'mathContinent.visualTest';
const $ = (s) => document.querySelector(s);

class Game {
  constructor() {
    this.canvas = $('#view');
    this.ctx = this.canvas.getContext('2d');
    this.warnings = [];
    this.variant = storage.get(KEY)?.variant || 'male';
    try {
      this.audio = new AudioManager();
      const a = storage.get('mathContinent.audio');
      if (a) this.audio.applySettings(a);
    } catch (e) { this.audio = null; }
    this.world = new World(this);
    this.input = { x: 0, y: 0, attackPressed: false, dodgePressed: false, talkPressed: false };
    this.keys = new Set();
    this.stick = { x: 0, y: 0 };
    this.fps = 60; this.last = performance.now();
    this.running = false;
    window.mathVisualTest = this; // 점검·자동 테스트용
  }
  warn(m) { this.warnings.push(m); console.warn('[비주얼 테스트]', m); }

  async boot() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    await loadImages((p) => { $('#load-fill').style.width = `${Math.round(p * 100)}%`; });
    if (missing.length) this.warn(`불러오지 못한 그림 ${missing.length}개: ${missing.slice(0, 6).join(', ')}`);
    $('#loading').classList.add('hidden');
    this.bindInput();
    this.showSelect();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.vw = window.innerWidth; this.vh = window.innerHeight;
    this.canvas.width = Math.round(this.vw * dpr);
    this.canvas.height = Math.round(this.vh * dpr);
    // 화면 세로에 약 10.5칸이 보이도록 (작은 화면은 조금 더 넓게)
    this.zoom = Math.max(0.6, Math.min(1.5, this.vh / (10.5 * 64)));
    if (this.vw < 700) this.zoom = Math.max(0.55, Math.min(this.zoom, this.vw / (9 * 64)));
    const fill = $('#hp-fill'), meter = document.querySelector('.meter');
    if (fill && meter) fill.style.backgroundSize = `${meter.clientWidth}px 100%`;
  }

  // ---------- 캐릭터 고르기 ----------
  showSelect() {
    this.running = false;
    $('#hud').classList.add('hidden');
    $('#select').classList.remove('hidden');
    const cards = [...document.querySelectorAll('.sel-card')];
    const mark = () => cards.forEach((c) => c.classList.toggle('on', c.dataset.v === this.variant));
    mark();
    cards.forEach((c) => (c.onclick = () => { this.variant = c.dataset.v; mark(); this.audio?.playSfx('select'); }));
    $('#sel-go').onclick = () => this.start();
    this.selectKey = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') { this.variant = this.variant === 'male' ? 'female' : 'male'; mark(); }
      if (e.code === 'Enter' || e.code === 'Space') this.start();
    };
    window.addEventListener('keydown', this.selectKey);
    // 미리보기: 아래 방향으로 걷는 모습
    let t = 0;
    const loop = () => {
      if (!$('#select').classList.contains('hidden')) {
        t += 1 / 60;
        cards.forEach((c) => {
          const v = c.dataset.v, cv = c.querySelector('canvas'), g = cv.getContext('2d');
          g.clearRect(0, 0, cv.width, cv.height);
          g.fillStyle = 'rgba(60,40,10,.25)'; g.beginPath(); g.ellipse(90, 150, 30, 9, 0, 0, Math.PI * 2); g.fill();
          const seq = ['walk_down_1', 'idle_down', 'walk_down_2', 'idle_down'];
          const n = seq[Math.floor(t * 6) % 4];
          g.save(); g.scale(1.25, 1.25);
          drawFrame(g, `player/${v}/${n}`, frames[`${v}/${n}`], 72, 121 - (n === 'idle_down' ? 1.5 : 0), false);
          g.restore();
        });
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  async start() {
    window.removeEventListener('keydown', this.selectKey);
    storage.set(KEY, { variant: this.variant });
    this.audio?.unlock();
    this.audio?.playSfx('confirm');
    $('#select').classList.add('hidden');
    $('#hud').classList.remove('hidden');
    $('#st-name').textContent = this.variant === 'male' ? '소년 검사' : '소녀 검사';
    if (this.world.hero) this.world.hero = null;
    await this.enter(this.world.map?.id || 'village');
    this.resize();
    if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this.frame(t)); }
  }

  async enter(mapId, at) {
    await this.world.load(mapId, at);
    const m = MAPS[mapId];
    $('#st-map').textContent = `📍 ${m.name}`;
    this.audio?.playBgm(m.bgm);
    const b = $('#banner');
    b.textContent = m.name;
    b.classList.add('show');
    clearTimeout(this.bannerT);
    this.bannerT = setTimeout(() => b.classList.remove('show'), 1800);
  }

  async travel(to, at) {
    if (this.traveling) return;
    this.traveling = true;
    $('#fade').classList.add('on');
    await new Promise((r) => setTimeout(r, 300));
    await this.enter(to, at);
    $('#fade').classList.remove('on');
    this.traveling = false;
  }

  // ---------- 입력 ----------
  bindInput() {
    const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    document.body.classList.toggle('touch-on', isTouch);
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (!this.running) return;
      if (e.code === 'KeyJ' || e.code === 'Space') this.input.attackPressed = true;
      if (e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.dodgePressed = true;
      if (e.code === 'KeyE' || e.code === 'Enter') this.input.talkPressed = true;
      if (e.code === 'F2' || e.code === 'Backquote') { e.preventDefault(); this.toggleDebug(); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    // 가상 조이스틱
    const stick = $('#stick'), knob = $('#knob');
    let sid = null;
    const setStick = (e) => {
      const r = stick.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const max = r.width / 2 - 10, l = Math.hypot(dx, dy);
      if (l > max) { dx = dx / l * max; dy = dy / l * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const k = Math.hypot(dx, dy) / max;
      this.stick = k < 0.22 ? { x: 0, y: 0 } : { x: dx / max, y: dy / max };
    };
    stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; try { stick.setPointerCapture(sid); } catch (err) { /* 무시 */ } setStick(e); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === sid) setStick(e); });
    const end = (e) => { if (e.pointerId === sid) { sid = null; this.stick = { x: 0, y: 0 }; knob.style.transform = ''; } };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    document.querySelectorAll('.act').forEach((b) => b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const a = b.dataset.act;
      if (a === 'attack') this.input.attackPressed = true;
      if (a === 'dodge') this.input.dodgePressed = true;
      if (a === 'talk') this.input.talkPressed = true;
    }));
    $('#dialog').addEventListener('pointerdown', () => this.closeDialog());
    $('#btn-debug').onclick = () => this.toggleDebug();
    $('#dbg-close').onclick = () => this.toggleDebug(false);
    $('#btn-char').onclick = () => { this.closeDialog(); this.showSelect(); };
    document.querySelectorAll('#debug [data-o]').forEach((el) => {
      el.addEventListener('change', () => {
        const k = el.dataset.o;
        this.world.opts[k] = el.type === 'checkbox' ? el.checked : el.value;
        el.blur();
      });
    });
  }
  toggleDebug(on) {
    const d = $('#debug');
    const show = on ?? d.classList.contains('hidden');
    d.classList.toggle('hidden', !show);
  }
  readMove() {
    const k = this.keys;
    let x = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
    let y = (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0) - (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0);
    if (!x && !y) { x = this.stick.x; y = this.stick.y; }
    return { x, y };
  }

  openDialog(s) {
    $('#dlg-name').textContent = s.name || '살펴보기';
    $('#dlg-text').textContent = s.line || s.interact;
    $('#dialog').classList.remove('hidden');
    this.dialogOpen = true;
    this.audio?.playSfx('menuOpen');
  }
  closeDialog() {
    if (!this.dialogOpen) return;
    $('#dialog').classList.add('hidden');
    this.dialogOpen = false;
    this.audio?.playSfx('menuClose');
  }

  // ---------- 매 프레임 ----------
  frame(now) {
    if (!this.running) return;
    // (requestAnimationFrame 시각이 시작 시각보다 앞설 수 있어서 0 아래로는 자름)
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
    this.last = now;
    this.fps += (1 / Math.max(dt, 0.001) - this.fps) * 0.05;
    const mv = this.readMove();
    const inp = { x: mv.x, y: mv.y, attackPressed: this.input.attackPressed, dodgePressed: this.input.dodgePressed };
    if (this.dialogOpen || this.traveling) { inp.x = inp.y = 0; inp.attackPressed = inp.dodgePressed = false; }
    if (this.input.talkPressed) {
      if (this.dialogOpen) this.closeDialog();
      else if (this.world.near) this.openDialog(this.world.near);
    }
    this.input.attackPressed = this.input.dodgePressed = this.input.talkPressed = false;
    this.world.update(dt, inp);
    const g = this.ctx;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = '#1b2410'; g.fillRect(0, 0, this.vw, this.vh);
    this.world.render(g, this.vw, this.vh, this.zoom);
    // HUD
    const h = this.world.hero;
    $('#hp-fill').style.width = `${(h.hp / h.maxHp) * 100}%`;
    $('#hp-text').textContent = `HP ${h.hp} / ${h.maxHp}`;
    if (!$('#debug').classList.contains('hidden')) this.debugInfo();
    requestAnimationFrame((t) => this.frame(t));
  }

  debugInfo() {
    const w = this.world, h = w.hero;
    const seams = w.opts.seams ? w.ensureSeams() : null;
    const lines = [
      `FPS ${this.fps.toFixed(0)} · 확대 ${this.zoom.toFixed(2)} · 맵 준비 ${w.buildMs}ms`,
      `맵 ${w.map.name} (${w.map.w}×${w.map.h}칸)`,
      `주인공 (${h.x.toFixed(0)}, ${h.y.toFixed(0)}) 칸 (${(h.x / 64).toFixed(1)}, ${(h.y / 64).toFixed(1)})`,
      `방향 ${h.dir} · 상태 ${h.state} · 그림 ${h.debugFrame}`,
      `속도 ${Math.hypot(h.vx, h.vy).toFixed(0)} px/s · 걸음 박자 ${(h.phase % 4).toFixed(2)} (한 박자 ${HERO.stride}px)`,
    ];
    if (seams) {
      const real = seams.filter((s) => !s.note).length, cliff = seams.filter((s) => s.note).length;
      lines.push(`경계 검사: 이음새 ${real}곳 · 절벽 끝 ${cliff}곳 ${w.opts.raw ? '(원본 타일)' : '(보정 후)'}`);
    }
    if (this.warnings.length) lines.push('⚠ ' + this.warnings.slice(-3).join('\n⚠ '));
    $('#dbg-info').textContent = lines.join('\n');
  }
}

new Game().boot();
