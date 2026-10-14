// 주인공 (비주얼 테스트)
// - 4방향 그림, 이동은 대각선 허용(옵션) — 그림 방향은 "더 많이 누른 쪽" + 흔들림 방지(히스테리시스)
// - 걷기: [걷기1 → 기본 → 걷기2 → 기본] 4박자. 시간이 아니라 "움직인 거리"로 넘겨서 발과 속도가 맞음
// - 모든 프레임은 머리 중심(x)·발(y)을 기준점으로 맞춰 둠 → 방향을 바꾸거나 걸을 때 몸이 튀지 않음
// - 공격 3단 / 회피 / 피격(넉백·깜빡임)
import { img, frames, tinted } from './images.js';

export const HERO = {
  scale: 0.66,          // 그림 크기 (프레임 높이 약 130px → 화면 약 86px)
  speed: 190,           // 최고 이동 속도(px/초)
  accel: 2600, decel: 3000,
  stride: 17,           // 걷기 한 박자에 움직이는 거리(px) — 속도와 발 맞추기
  bodyW: 26, bodyH: 14, // 충돌 상자 (발 기준)
};

const WALK = ['walk1', 'idle', 'walk2', 'idle'];
const COMBO = [
  { t: 0.27, hit: 0.07, lunge: 70, reach: 62, w: 68, open: 0.13, sfx: 'swing1' },
  { t: 0.27, hit: 0.07, lunge: 80, reach: 66, w: 72, open: 0.13, sfx: 'swing2' },
  { t: 0.40, hit: 0.10, lunge: 150, reach: 74, w: 84, open: 0, sfx: 'swing3', heavy: true },
];

export class Hero {
  constructor(variant, x, y) {
    this.variant = variant;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.dir = 'down';
    this.phase = 0;            // 걷기 진행 (거리 누적)
    this.moving = false;
    this.state = 'idle';       // idle | walk | attack | dodge | hit
    this.t = 0;                // 현재 상태 시간
    this.combo = 0; this.queued = false;
    this.hitDone = false;
    this.invulnT = 0;
    this.flashT = 0;
    this.hp = 100; this.maxHp = 100;
    this.afterimages = [];
    this.dodgeCd = 0;
    this.breath = 0;
    this.debugFrame = '';
  }

  frameKey(name) { return `player/${this.variant}/${name}`; }

  // ---- 방향 고르기: 대각선일 때 지금 방향이 그 안에 있으면 유지 → 깜빡임 방지 ----
  pickDir(ix, iy) {
    if (!ix && !iy) return this.dir;
    const cand = [];
    if (ix > 0) cand.push('right'); if (ix < 0) cand.push('left');
    if (iy > 0) cand.push('down'); if (iy < 0) cand.push('up');
    if (cand.length === 1) return cand[0];
    if (cand.includes(this.dir)) return this.dir;
    return Math.abs(ix) >= Math.abs(iy) ? cand[0] : cand[1];
  }

  update(dt, input, world) {
    this.t += dt;
    this.breath += dt;
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.afterimages = this.afterimages.filter((a) => (a.t -= dt) > 0);

    let ix = input.x, iy = input.y;
    if (!world.opts.diagonal && ix && iy) { if (Math.abs(ix) >= Math.abs(iy)) iy = 0; else ix = 0; }
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }

    if (this.state === 'hit') {
      // 넉백: 미끄러지듯 감속
      const k = Math.max(0, 1 - dt * 9);
      this.vx *= k; this.vy *= k;
      world.move(this, this.vx * dt, this.vy * dt);
      if (this.t > 0.32) this.setState('idle');
      return;
    }
    if (this.state === 'dodge') {
      world.move(this, this.vx * dt, this.vy * dt);
      if (Math.random() < 0.6) this.afterimages.push({ x: this.x, y: this.y, key: this.currentFrame().key, flip: this.currentFrame().flip, t: 0.22 });
      if (this.t > 0.26) { this.vx *= 0.3; this.vy *= 0.3; this.setState('idle'); }
      return;
    }
    if (this.state === 'attack') {
      const c = COMBO[this.combo];
      // 공격 중에도 방향은 입력 쪽으로 (다음 타 전에)
      const lungeK = this.t < 0.09 ? 1 : 0;
      const [fx, fy] = DIRV[this.dir];
      world.move(this, fx * c.lunge * lungeK * dt, fy * c.lunge * lungeK * dt);
      if (!this.hitDone && this.t >= c.hit) {
        this.hitDone = true;
        world.heroStrike(this, this.combo, c);
      }
      if (input.attackPressed && this.combo < 2 && this.t > 0.05) this.queued = true;
      if (this.t >= c.t - c.open && this.queued) {
        this.queued = false;
        this.combo++;
        if (len > 0) this.dir = this.pickDir(ix, iy);
        this.startAttackStep(world);
        return;
      }
      if (this.t >= c.t) this.setState('idle');
      this.vx = 0; this.vy = 0;
      return;
    }

    // ---- 이동 ----
    const tx = ix * HERO.speed, ty = iy * HERO.speed;
    const ax = (tx === 0 ? HERO.decel : HERO.accel) * dt, ay = (ty === 0 ? HERO.decel : HERO.accel) * dt;
    this.vx = approach(this.vx, tx, ax);
    this.vy = approach(this.vy, ty, ay);
    const ox = this.x, oy = this.y;
    world.move(this, this.vx * dt, this.vy * dt);
    const moved = Math.hypot(this.x - ox, this.y - oy);
    if (len > 0) this.dir = this.pickDir(ix, iy);
    this.moving = len > 0 && moved > 0.2;
    if (this.moving) {
      this.phase += moved / HERO.stride;      // ← 움직인 거리만큼 발이 나감 (벽에 막히면 제자리)
      this.state = 'walk';
    } else {
      // 멈추면 가까운 "기본" 박자로 정리 (발이 공중에 멈춰 있지 않게)
      const f = Math.floor(this.phase) % 4;
      if (f === 0 || f === 2) this.phase = Math.floor(this.phase) + 1;
      if (this.state === 'walk') this.setState('idle');
    }

    if (input.attackPressed) { this.combo = 0; this.startAttackStep(world); }
    else if (input.dodgePressed && this.dodgeCd <= 0) this.startDodge(ix, iy, world);
  }

  startAttackStep(world) {
    this.setState('attack');
    this.hitDone = false;
    world.sfx(COMBO[this.combo].sfx);
  }

  startDodge(ix, iy, world) {
    let dx = ix, dy = iy;
    if (!dx && !dy) [dx, dy] = DIRV[this.dir];
    const l = Math.hypot(dx, dy) || 1;
    this.vx = dx / l * 430; this.vy = dy / l * 430;
    if (dx || dy) this.dir = this.pickDir(dx, dy);
    this.setState('dodge');
    this.invulnT = Math.max(this.invulnT, 0.3);
    this.dodgeCd = 0.42;
    world.sfx('dodge');
  }

  hurt(fromX, fromY, dmg, world) {
    if (this.invulnT > 0 || this.state === 'dodge') return false;
    this.hp = Math.max(1, this.hp - dmg);   // 테스트용: 쓰러지지 않음
    const dx = this.x - fromX, dy = this.y - fromY, l = Math.hypot(dx, dy) || 1;
    this.vx = dx / l * 330; this.vy = dy / l * 330;
    this.setState('hit');
    this.invulnT = 0.9; this.flashT = 0.16;
    world.sfx('playerHurt');
    world.shake(5, 0.18);
    return true;
  }

  setState(s) { this.state = s; this.t = 0; if (s !== 'attack') this.combo = 0; }

  // ---- 지금 그릴 그림 ----
  currentFrame() {
    const d = this.dir;
    const side = d === 'left' || d === 'right';
    let name, flip = false;
    switch (this.state) {
      case 'attack': {
        if (d === 'down') name = this.combo === 1 ? 'attack_down_2' : 'attack_down_1';
        else name = `attack_${d}`;
        // 2·3타 시작 순간은 기본 자세로 살짝 되돌렸다가 다시 휘두름 (같은 그림이 이어 붙지 않게)
        if (this.combo > 0 && this.t < 0.045) name = `idle_${d}`;
        if (this.t > COMBO[this.combo].t - 0.06 && this.combo === 2) name = `idle_${d}`;
        break;
      }
      case 'dodge': name = side ? 'dash_right' : `walk_${d}_1`; flip = d === 'left'; break;
      case 'hit': name = 'hit'; flip = d === 'left'; break;
      case 'walk': {
        const w = WALK[Math.floor(this.phase) % 4];
        name = w === 'idle' ? `idle_${d}` : `walk_${d}_${w === 'walk1' ? 1 : 2}`;
        break;
      }
      default: name = `idle_${d}`;
    }
    const key = this.frameKey(name);
    return { key, name, flip, f: frames[`${this.variant}/${name}`] };
  }

  // 화면에 그리기 (발 = this.x, this.y)
  draw(ctx, opts = {}) {
    for (const a of this.afterimages) drawFrame(ctx, a.key, frames[a.key.slice(7)], a.x, a.y, a.flip, { alpha: a.t * 1.6, tint: '#9fd8ff' });
    const fr = this.currentFrame();
    this.debugFrame = fr.name;
    if (!fr.f) return;
    let bob = 0;
    if (this.state === 'walk') { const w = WALK[Math.floor(this.phase) % 4]; bob = w === 'idle' ? -2 : 0; }
    const breathe = this.state === 'idle' ? 1 + Math.sin(this.breath * 2.6) * 0.012 : 1;
    let alpha = opts.alpha ?? 1;
    if (this.invulnT > 0 && this.state !== 'dodge' && Math.floor(this.invulnT * 18) % 2 === 0) alpha *= 0.45;
    drawFrame(ctx, fr.key, fr.f, this.x, this.y + bob, fr.flip, {
      alpha, sy: breathe, tint: this.flashT > 0 ? '#ff4a3a' : null, tintA: this.flashT > 0 ? 0.55 : 0,
      silhouette: opts.silhouette,
    });
  }

  // 그림이 차지하는 화면 영역 (가림 판정용)
  bounds() {
    const fr = this.currentFrame();
    const f = fr.f; if (!f) return { x: this.x - 20, y: this.y - 80, w: 40, h: 80 };
    const s = HERO.scale;
    return { x: this.x - 30, y: this.y - f.ay * s + 6, w: 60, h: f.ay * s - 4 };
  }
}

export const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function approach(v, t, a) { return v < t ? Math.min(t, v + a) : Math.max(t, v - a); }

export function drawFrame(ctx, key, f, x, y, flip, o = {}) {
  const im = img.get(key);
  if (!im || !f) return false;
  const s = HERO.scale;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  if (o.sy && o.sy !== 1) ctx.scale(1, o.sy);
  ctx.globalAlpha *= o.alpha ?? 1;
  const dx = -f.ax * s, dy = -f.ay * s, w = f.w * s, h = f.h * s;
  if (o.silhouette) {
    const t = tinted(key, '#ffffff');
    if (t) { ctx.globalAlpha *= 0.42; ctx.drawImage(t, dx, dy, w, h); }
  } else {
    ctx.drawImage(im, dx, dy, w, h);
    if (o.tint) {
      const t = tinted(key, o.tint);
      if (t) { ctx.globalAlpha *= o.tintA ?? 0.5; ctx.drawImage(t, dx, dy, w, h); }
    }
  }
  ctx.restore();
  return true;
}
