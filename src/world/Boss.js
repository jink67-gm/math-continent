// 보스: 뒤집기 트롤 인버트롤 (Ninja Adventure GiantRacoon, CC0)
//
// 공격 세 가지 — 모두 빨간 경고가 먼저 나와서 구르기로 피할 수 있어요.
//   할퀴기: 가까이 있으면 앞쪽 원
//   뛰어 찍기: 주인공 자리에 큰 원 → 뛰어올라 쿵!
//   돌진: 주인공 쪽으로 긴 띠 → 빠르게 달려요
// HP 66%·33%가 되면 「수학의 봉인」 보호막을 쳐요. 방 아래쪽 봉인 룬을 풀면 보호막이 깨지고 잠깐 기절해요.
// Combat이 몬스터처럼 다룰 수 있게 같은 모양(hit, hittable, snapshot …)을 갖췄어요.

import { textStyle, crisp, ZOOM } from '../ui/style.js';

export const TROLL = { id: 'troll', name: '뒤집기 트롤 인버트롤', hp: 900, atk: 15, def: 3, exp: 220, gold: [70, 90], art: { type: 'troll' },
  line: '누가 내 잠을 깨웠지? 다 뒤집어 주마!' };
const STATES = ['sleep', 'intro', 'chase', 'warn', 'swipe', 'slam', 'charge', 'rest', 'stun', 'gone'];
const WARN = ['', 'swipe', 'slam', 'charge'];

export class Boss {
  // cfg: 보스 설정 (이름·세기·그림). 그림 종류: troll(인버트롤) · mon(몬스터 그림을 크게) · spirit(거대 정령)
  constructor(scene, combat, x, y, cfg = TROLL) {
    this.scene = scene;
    this.combat = combat;
    this.kind = cfg.id;
    this.id = cfg.id;
    this.def = cfg;
    this.art = cfg.art || { type: 'troll' };
    this.radius = this.art.type === 'troll' ? 14 : 16;
    this.home = { x, y };
    this.maxHp = Math.round(cfg.hp * combat.diff.monHp * combat.partyHp);
    this.hp = this.maxHp;
    this.state = 'sleep';
    this.sealsLeft = [0.66, 0.33];
    this.sealed = false;
    this.nextAttack = 0;
    this.slowUntil = 0;

    this.shadow = scene.add.ellipse(x, y, 40, 12, 0x000000, 0.35);
    if (this.art.type === 'mon') {
      this.sprite = scene.add.sprite(x, y, `mon/${this.art.sheet}`, 0).setOrigin(0.5, 1).setScale(this.art.scale || 3.4);
    } else if (this.art.type === 'spirit') {
      this.sprite = scene.add.sprite(x, y, 'boss/spirit_idle', 0).setOrigin(0.5, 0.95).setScale(1.3).setTint(this.art.tint || 0xd0b8ff);
    } else {
      this.sprite = scene.add.sprite(x, y, 'boss/troll_idle', 0).setOrigin(0.5, 0.92);
    }
    this.baseScale = this.sprite.scaleX;
    this.dir = 'down';
    this.anim('idle');
    this.feet = scene.add.zone(x, y, 28, 12);
    scene.physics.add.existing(this.feet);
    this.feet.body.setCollideWorldBounds(true);
    scene.physics.add.collider(this.feet, scene.solids);
    this.warnG = scene.add.graphics();
    this.shield = null;
  }

  // 그림 종류에 맞춰 움직임을 틀어요
  anim(kind) {
    const s = this.sprite;
    if (this.art.type === 'troll') { s.play(`troll_${kind}`, true); return; }
    if (this.art.type === 'spirit') { s.play('spirit_idle', true); s.anims.timeScale = kind === 'charge' ? 2 : 1; return; }
    s.play(`mon_${this.art.sheet}_${this.dir}`, true);
    s.anims.timeScale = kind === 'charge' ? 2.5 : kind === 'attack' ? 2 : 1;
  }

  face(dx, dy) {
    if (this.art.type === 'mon') {
      const d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (d !== this.dir) { this.dir = d; this.anim('idle'); }
    } else this.sprite.setFlipX(dx < 0);
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }
  get alive() { return this.state !== 'gone'; }
  get engaged() { return this.state !== 'sleep' && this.alive; }
  get hittable() { return this.engaged && this.state !== 'intro'; }

  // ── 맞았을 때 ───────────────────────────────
  hit(dmg, fromX, fromY) {
    if (!this.hittable) return false;
    if (this.sealed) {
      this.scene.sound.play('sfx_miss', { volume: 0.3 });
      return true;
    }
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.alive && this.sprite.clearTint());
    if (this.remote) return true;
    // 기절한 동안은 1.5배로 아파요
    this.hp -= this.state === 'stun' ? Math.round(dmg * 1.5) : dmg;
    if (this.hp <= 0) { this.hp = 0; this.purify(); return true; }
    const next = this.sealsLeft[0];
    if (next && this.hp / this.maxHp <= next) { this.sealsLeft.shift(); this.seal(); }
    return true;
  }

  slow(ms) { this.slowUntil = this.scene.time.now + ms; }

  // ── 수학의 봉인 ─────────────────────────────
  seal() {
    this.sealed = true;
    this.warnG.clear();
    this.state = 'rest';
    this.until = this.scene.time.now + 600;
    this.scene.sound.play('sfx_shield', { volume: 0.5 });
    this.showShield(true);
    this.scene.onBossSeal?.(true);
    // 졸개 슬라임 둘을 불러요 (다시 나타나지 않아요)
    for (const dx of [-30, 30]) {
      const m = this.combat.spawnMonster('Slime', this.x + dx, this.y + 20, 1.5);
      m.noRespawn = true;
    }
  }

  unseal() {
    if (!this.sealed) return;
    this.sealed = false;
    this.showShield(false);
    this.scene.sound.play('sfx_shield_break', { volume: 0.6 });
    this.scene.cameras.main.shake(250, 0.008);
    this.scene.fx('fx_star', 'na/star', this.x, this.y - 30, { scale: 3, depth: this.y + 50, add: true });
    this.scene.onBossSeal?.(false);
    if (this.remote) return;
    this.state = 'stun';
    this.warnG.clear();
    this.feet.body.setVelocity(0, 0);
    this.until = this.scene.time.now + 3500;
    this.say('으앗, 어지러워…!');
  }

  showShield(on) {
    if (on && !this.shield) {
      // 보라색 보호막 거품
      this.shield = this.scene.add.graphics();
      this.shieldPulse = this.scene.tweens.add({ targets: this.shield, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
    } else if (!on && this.shield) {
      this.shieldPulse?.remove();
      this.shield.destroy();
      this.shield = null;
    }
  }

  say(text) {
    const t = crisp(this.scene.add.text(this.x, this.y - 60, text, textStyle(13, '#ffe9a8'))).setOrigin(0.5).setScale(1 / ZOOM).setDepth(100004);
    this.scene.tweens.add({ targets: t, y: t.y - 8, alpha: 0, delay: 1400, duration: 500, onComplete: () => t.destroy() });
  }

  purify() {
    this.state = 'gone';
    this.warnG.clear();
    this.showShield(false);
    this.feet.body.setVelocity(0, 0);
    this.feet.body.enable = false;
    const s = this.scene;
    s.cameras.main.shake(400, 0.01);
    this.sprite.setTintFill(0xffffff);
    s.tweens.add({ targets: this.sprite, scaleX: this.baseScale * 1.6, scaleY: this.baseScale * 0.1, alpha: 0, duration: 900, ease: 'Quad.in' });
    this.shadow.setVisible(false);
    for (let i = 0; i < 5; i++) {
      s.time.delayedCall(i * 150, () => s.fx('fx_smoke', 'na/smoke', this.x + (Math.random() - 0.5) * 40, this.y - 10 - Math.random() * 30, { scale: 1.3, depth: this.y + 20 }));
    }
    s.fx('fx_ring', 'na/ring', this.x, this.y - 10, { scale: 5, depth: this.y + 30, add: true }).setTint(0xffe066);
    this.combat.onPurified(this);
    s.onBossDefeated?.(this);
  }

  // ── 매 장면 ─────────────────────────────────
  update(time, targets) {
    if (this.remote) { this.updateRemote(time); return; }
    if (!this.alive) return;
    const live = targets.filter((t) => t.state !== 'down');
    if (!live.length) { this.feet.body.setVelocity(0, 0); this.sync(time); return; }
    let target = live[0];
    for (const t of live) if (Math.hypot(t.x - this.x, t.y - this.y) < Math.hypot(target.x - this.x, target.y - this.y)) target = t;
    const d = Math.hypot(target.x - this.x, target.y - this.y);
    const slowMul = time < this.slowUntil ? 0.5 : 1;

    switch (this.state) {
      case 'sleep':
        if (live.some((t) => t.y < this.scene.bossRoomY)) {
          this.state = 'intro';
          this.until = time + 1600;
          this.scene.onBossWake?.(this);
          this.anim('charge');
          this.say(this.def.line || '');
        }
        break;
      case 'intro':
        if (time > this.until) { this.state = 'chase'; this.anim('idle'); this.nextAttack = time + 800; }
        break;
      case 'chase': {
        const sp = 24 * slowMul;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        this.feet.body.setVelocity(d > 30 ? (dx / d) * sp : 0, d > 30 ? (dy / d) * sp : 0);
        this.face(dx, dy);
        if (time > this.nextAttack) this.pickAttack(target, d);
        break;
      }
      case 'warn': {
        this.feet.body.setVelocity(0, 0);
        const p = Math.min(1, 1 - (this.until - time) / this.warnMs);
        this.warnP = p;
        this.drawWarn(p);
        if (time > this.until) this.release();
        break;
      }
      case 'charge':
        this.hitDuring(18);
        this.scene.fx('fx_smoke', 'na/smoke', this.x, this.y, { scale: 0.5, depth: this.y - 2 });
        if (time > this.until) this.endAttack(700);
        break;
      case 'swipe':
      case 'slam':
        if (time > this.until) this.endAttack(600);
        break;
      case 'rest':
        this.feet.body.velocity.scale(0.85);
        if (time > this.until) this.state = 'chase';
        break;
      case 'stun':
        this.feet.body.setVelocity(0, 0);
        if (time > this.until) { this.state = 'chase'; this.sprite.setAngle(0); this.nextAttack = time + 900; }
        break;
    }
    this.sync(time);
  }

  pickAttack(target, d) {
    const r = Math.random();
    const type = d < 42 && r < 0.6 ? 'swipe' : r < 0.55 ? 'slam' : 'charge';
    this.attack = type;
    this.state = 'warn';
    const base = this.combat.diff.warnMs;
    this.warnMs = base + (type === 'swipe' ? 100 : 350);
    this.until = this.scene.time.now + this.warnMs;
    this.feet.body.setVelocity(0, 0);
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.dirV = { x: dx / len, y: dy / len };
    if (type === 'swipe') this.target = { x: this.x + this.dirV.x * 22, y: this.y + this.dirV.y * 18 };
    if (type === 'slam') this.target = { x: target.x, y: target.y };
    if (type === 'charge') this.target = { x: this.x + this.dirV.x * 130, y: this.y + this.dirV.y * 130 };
    this.anim(type === 'slam' ? 'charge' : 'idle');
    this.face(dx, dy);
    this.scene.sound.play(type === 'charge' ? 'sfx_boss_charge' : 'sfx_windup', { volume: 0.35 });
  }

  // 빨간 경고: 어디를 공격할지 미리 보여 줘요
  drawWarn(p) {
    const g = this.warnG.clear().setDepth(-500);
    const { x, y } = this.target;
    const red = (a) => g.fillStyle(0xff3b30, a);
    if (this.attack === 'charge') {
      const w = 26;
      const nx = -this.dirV.y * (w / 2);
      const ny = this.dirV.x * (w / 2);
      const pts = (len) => [
        { x: this.x + nx, y: this.y + ny }, { x: this.x + this.dirV.x * len + nx, y: this.y + this.dirV.y * len + ny },
        { x: this.x + this.dirV.x * len - nx, y: this.y + this.dirV.y * len - ny }, { x: this.x - nx, y: this.y - ny },
      ];
      red(0.15 + 0.15 * p).fillPoints(pts(130), true);
      red(0.4).fillPoints(pts(130 * p), true);
    } else {
      const r = this.attack === 'slam' ? 36 : 24;
      red(0.12 + 0.18 * p).fillEllipse(x, y, r * 2, r * 1.3);
      red(0.45).fillEllipse(x, y, r * 2 * p, r * 1.3 * p);
      g.lineStyle(1, 0xff6b5e, 0.9).strokeEllipse(x, y, r * 2, r * 1.3);
    }
    this.sprite.setScale(this.baseScale * (1 + 0.06 * p), this.baseScale * (1 - 0.06 * p));
  }

  release() {
    this.warnG.clear();
    this.sprite.setScale(this.baseScale);
    const s = this.scene;
    if (this.attack === 'swipe') {
      this.state = 'swipe';
      this.until = s.time.now + 350;
      this.anim('attack');
      s.sound.play('sfx_boss_slash', { volume: 0.45 });
      s.fx('fx_slash', 'na/slash', this.target.x, this.target.y - 8, { scale: 1.8, depth: this.y + 30, angle: Math.atan2(this.dirV.y, this.dirV.x) * 57.3 });
      this.hitArea(this.target.x, this.target.y, 26, 1.1);
    } else if (this.attack === 'slam') {
      this.state = 'slam';
      this.until = s.time.now + 750;
      this.feet.body.enable = false;
      this.anim('jump');
      s.tweens.add({ targets: this.feet, x: this.target.x, y: this.target.y, duration: 450, ease: 'Sine.inOut' });
      s.tweens.add({ targets: this, lift: 34, duration: 225, yoyo: true, ease: 'Quad.out' });
      s.time.delayedCall(460, () => {
        this.feet.body.enable = true;
        this.feet.body.reset(this.target.x, this.target.y);
        s.sound.play('sfx_impact', { volume: 0.55 });
        s.cameras.main.shake(200, 0.009);
        s.fx('fx_ring', 'na/ring', this.x, this.y, { scale: 3.6, depth: this.y - 3, add: true }).setTint(0xffb36b);
        s.fx('fx_smoke', 'na/smoke', this.x, this.y - 4, { scale: 1.4, depth: this.y + 5 });
        this.hitArea(this.x, this.y, 38, 1.3);
        this.anim('idle');
      });
    } else {
      this.state = 'charge';
      this.until = s.time.now + 520;
      this.charged = new Set();
      this.anim('charge');
      s.sound.play('sfx_boss_dash', { volume: 0.45 });
      this.feet.body.setVelocity(this.dirV.x * 250, this.dirV.y * 250);
    }
  }

  endAttack(restMs) {
    this.feet.body.setVelocity(0, 0);
    this.anim('idle');
    this.state = 'rest';
    this.until = this.scene.time.now + restMs;
    this.nextAttack = this.until + (this.sealed ? 1500 : 700) + Math.random() * 600;
  }

  hitArea(x, y, r, mult) {
    for (const t of this.combat.targets()) {
      if (Math.hypot(t.x - x, (t.y - y) * 1.2) < r) this.combat.hitTarget(t, Math.round(this.def.atk * mult), this.x, this.y);
    }
  }

  hitDuring(r) {
    for (const t of this.combat.targets()) {
      if (this.charged.has(t) || Math.hypot(t.x - this.x, t.y - this.y) > r) continue;
      this.charged.add(t);
      this.combat.hitTarget(t, Math.round(this.def.atk * 1.2), this.x, this.y);
    }
  }

  // ── 협동 (방장이 보스를 움직여요) ───────────────
  snapshot() {
    const r = (v) => Math.round(v * 10) / 10;
    const warn = this.state === 'warn';
    return [r(this.x), r(this.y), this.hp, this.maxHp, STATES.indexOf(this.state), this.sealed ? 1 : 0,
      warn ? WARN.indexOf(this.attack) : 0, warn ? r(this.target.x) : 0, warn ? r(this.target.y) : 0,
      warn ? Math.round((this.warnP || 0) * 100) : 0, r(this.dirV?.x || 0), r(this.dirV?.y || 0)];
  }

  setRemote(on) {
    this.remote = on;
    this.feet.body.enable = !on && this.alive;
    this.feet.body.setVelocity(0, 0);
    if (on) this.warnG.clear();
  }

  applySnapshot(a) {
    if (!a) return;
    this.net = a;
    const st = STATES[a[4]] || 'chase';
    this.hp = a[2];
    this.maxHp = a[3];
    if (a[5] && !this.sealed) { this.sealed = true; this.showShield(true); this.scene.onBossSeal?.(true); }
    if (!a[5] && this.sealed) this.unseal();
    if (st === 'gone' && this.alive) { this.purify(); return; }
    if (this.state === 'sleep' && st !== 'sleep') this.scene.onBossWake?.(this);
    if (st !== this.state) {
      if (st === 'swipe') this.anim('attack');
      else if (st === 'slam') this.anim('jump');
      else if (st === 'charge' || st === 'intro') this.anim('charge');
      else this.anim('idle');
    }
    this.state = st;
    if (st === 'warn') {
      this.attack = WARN[a[6]];
      this.target = { x: a[7], y: a[8] };
      this.warnP = a[9] / 100;
      this.dirV = { x: a[10], y: a[11] };
    }
  }

  updateRemote(time) {
    if (!this.alive || !this.net) return;
    const [nx, ny] = this.net;
    this.feet.setPosition(this.x + (nx - this.x) * 0.35, this.y + (ny - this.y) * 0.35);
    if (this.state === 'warn') this.drawWarn(this.warnP || 0); else this.warnG.clear();
    this.sync(time);
  }

  sync(time) {
    const sx = Math.round(this.feet.x);
    const sy = Math.round(this.feet.y + 4);
    this.sprite.setPosition(sx, sy - Math.round(this.lift || 0)).setDepth(sy);
    this.shadow.setPosition(sx, sy - 1).setDepth(sy - 1).setScale(1 - (this.lift || 0) / 70);
    if (this.state === 'stun') this.sprite.setAngle(Math.sin(time / 90) * 6);
    if (time < this.slowUntil) this.sprite.setTint(0x9fd8ff);
    if (this.shield) {
      this.shield.clear().setDepth(sy + 2)
        .fillStyle(0xb48cff, 0.22).fillEllipse(sx, sy - 24, 64, 60)
        .lineStyle(2, 0xd8c0ff, 0.9).strokeEllipse(sx, sy - 24, 64, 60)
        .lineStyle(1, 0xffffff, 0.6).strokeEllipse(sx - 10, sy - 38, 14, 8);
    }
  }
}
