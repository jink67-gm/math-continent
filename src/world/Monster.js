// 필드 몬스터: 돌아다니다 → 주인공을 보면 다가옴 → 빨간 경고 원 → 덮치기 → 잠깐 쉼
// 지역 단계가 높을수록 단단하고 아프고 빨라져요. 패턴도 늘어요:
//   두 번 덮치기(2단계~) · 여러 갈래 구슬(3단계~) · 둘레 내려찍기(4단계~)
// 가끔 금빛 「정예 몬스터」가 나와요: 크고 단단하지만 강화석을 꼭 떨어뜨려요.
// 맞으면 뒤로 밀리고 잠깐 멈춰요. HP가 0이 되면 연기와 함께 사라졌다가 다시 나타나요.

import { MONSTERS } from '../data/monsters.js';
import { monsterScale, tierOf } from '../data/rules.js';

const LEASH = 190;      // 집에서 이만큼 멀어지면 돌아가요
const RESPAWN_MS = 16000;
// 협동할 때 주고받는 상태 번호
export const STATES = ['appear', 'idle', 'chase', 'warn', 'lunge', 'rest', 'stun', 'home', 'gone'];
const DIRS = ['down', 'up', 'left', 'right'];

export class Monster {
  // power: 지역 세기 (바위 숲 1.4배 등) — HP·공격력·경험치·골드가 함께 커져요
  constructor(scene, combat, kind, x, y, power = 1) {
    this.scene = scene;
    this.combat = combat;
    this.kind = kind;
    const b = MONSTERS[kind];
    this.tier = tierOf(power);
    const sc = monsterScale(power, this.tier);
    this.sc = sc;
    this.def = {
      ...b, hp: Math.round(b.hp * sc.hp), atk: Math.round(b.atk * sc.atk), def: Math.round(b.def + sc.def),
      speed: b.speed * sc.speed, sight: b.sight * sc.sight, lunge: Math.round((b.lunge || 0) * (1 + 0.05 * (this.tier - 1))),
      exp: Math.round(b.exp * power ** 1.5), gold: b.gold.map((g) => Math.round(g * power)),
    };
    this.home = { x, y };
    this.dir = 'down';
    this.phase = Math.random() * Math.PI * 2;

    this.shadow = scene.add.ellipse(x, y, 11, 4, 0x000000, 0.28);
    this.sprite = scene.add.sprite(x, y, `mon/${kind}`, 0).setOrigin(0.5, 1);
    this.feet = scene.add.zone(x, y, 10, 6);
    scene.physics.add.existing(this.feet);
    this.feet.body.setCollideWorldBounds(true);
    this.warnG = scene.add.graphics();
    this.hpBar = scene.add.graphics().setVisible(false);
    this.spawn();
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }
  get alive() { return this.state !== 'gone'; }
  get hittable() { return this.alive && this.state !== 'appear'; }
  get atk() { return Math.round(this.def.atk * (this.elite ? 1.35 : 1)); }
  get baseScale() { return this.elite ? 1.3 : 1; }

  spawn() {
    const d = this.combat.diff;
    this.elite = !this.remote && !this.noElite && Math.random() < this.sc.elite;
    this.maxHp = Math.round(this.def.hp * d.monHp * this.combat.partyHp * (this.elite ? 2.4 : 1));
    this.hp = this.maxHp;
    this.state = 'appear';
    this.until = this.scene.time.now + 500;
    this.nextAttack = 0;
    this.slowUntil = 0;
    this.wanderAt = 0;
    this.respawnTimer?.remove();
    this.feet.setPosition(this.home.x, this.home.y);
    this.feet.body.enable = !this.remote;
    this.feet.body.setVelocity(0, 0);
    this.sprite.setVisible(true).setAlpha(0).setScale(0.4).clearTint().setAngle(0);
    this.shadow.setVisible(true);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, scaleX: this.baseScale, scaleY: this.baseScale, duration: 400, ease: 'Back.out' });
    this.play();
  }

  play() {
    const key = `mon_${this.kind}_${this.dir}`;
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);
  }

  faceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  }

  speedNow() {
    return this.def.speed * (this.scene.time.now < this.slowUntil ? 0.4 : 1);
  }

  moveToward(tx, ty, speed, keepAway = 0) {
    let dx = tx - this.x;
    let dy = ty - this.y;
    const len = Math.hypot(dx, dy) || 1;
    if (keepAway && len < keepAway) { dx = -dx; dy = -dy; }
    this.feet.body.setVelocity((dx / len) * speed, (dy / len) * speed);
    this.faceTo(this.x + dx, this.y + dy);
  }

  // ── 맞았을 때 ───────────────────────────────
  hit(dmg, fromX, fromY, knock = 1) {
    if (!this.hittable) return false;
    this.hpShownUntil = this.scene.time.now + 3000;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.alive && this.sprite.clearTint());
    if (this.remote) return true; // 친구 기기: HP는 방장이 깎아요
    this.hp -= dmg;
    if (this.hp <= 0) { this.purify(); return true; }
    // 뒤로 밀리고 잠깐 멈춤 (공격 준비도 끊겨요)
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const k = 110 * knock;
    this.feet.body.setVelocity((dx / len) * k, (dy / len) * k);
    this.warnG.clear();
    this.state = 'stun';
    this.until = this.scene.time.now + 180 + knock * 90;
    this.nextAttack = Math.max(this.nextAttack, this.scene.time.now + 500);
    return true;
  }

  slow(ms) {
    this.slowUntil = this.scene.time.now + ms;
  }

  // 쓰러지면 하얗게 빛나며 작아지고, 연기와 반짝이
  purify() {
    this.purifyFx();
    this.combat.onPurified(this);
    if (!this.noRespawn) this.respawnTimer = this.scene.time.delayedCall(RESPAWN_MS, () => this.spawn());
  }

  purifyFx() {
    this.state = 'gone';
    this.warnG.clear();
    this.hpBar.setVisible(false);
    this.feet.body.setVelocity(0, 0);
    this.feet.body.enable = false;
    const { x, y } = this;
    const s = this.scene;
    this.sprite.setTintFill(0xffffff);
    s.tweens.add({ targets: this.sprite, scaleX: 1.5, scaleY: 0.2, alpha: 0, y: this.sprite.y - 6, duration: 320, ease: 'Quad.in' });
    this.shadow.setVisible(false);
    s.fx('fx_smoke', 'na/smoke', x, y - 6, { scale: 0.8, depth: y + 5 });
    for (let i = 0; i < 4; i++) {
      const sp = s.add.sprite(x + (Math.random() - 0.5) * 14, y - 8, 'na/spark', 0).setBlendMode('ADD').setDepth(y + 6);
      sp.play({ key: 'fx_spark', startFrame: i });
      s.tweens.add({ targets: sp, y: sp.y - 18 - Math.random() * 10, alpha: 0, duration: 700 + i * 120, onComplete: () => sp.destroy() });
    }
  }

  // ── 매 장면 ─────────────────────────────────
  // targets: 주인공들 (협동이면 두 명) — 가장 가까운 쪽을 노려요
  update(time, targets) {
    if (this.remote) { this.updateRemote(time); return; }
    if (this.state === 'gone') return;
    const d = this.def;
    let player = targets[0];
    for (const t of targets) {
      if (t.state === 'down') continue;
      if (player.state === 'down' || Math.hypot(t.x - this.x, t.y - this.y) < Math.hypot(player.x - this.x, player.y - this.y)) player = t;
    }
    const pd = Math.hypot(player.x - this.x, player.y - this.y);
    const homeD = Math.hypot(this.home.x - this.x, this.home.y - this.y);
    const playerOk = player.state !== 'down';

    switch (this.state) {
      case 'appear':
        this.feet.body.setVelocity(0, 0);
        if (time > this.until) this.state = 'idle';
        break;
      case 'stun':
        this.feet.body.velocity.scale(0.86);
        if (time > this.until) { this.feet.body.setVelocity(0, 0); this.state = playerOk && pd < d.sight * 1.4 ? 'chase' : 'idle'; }
        break;
      case 'idle':
        if (playerOk && pd < d.sight) { this.state = 'chase'; break; }
        if (time > this.wanderAt) {
          this.wanderAt = time + 1500 + Math.random() * 2000;
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 30;
          this.moveToward(this.home.x + Math.cos(a) * r, this.home.y + Math.sin(a) * r, d.speed * 0.45);
          this.scene.time.delayedCall(700, () => this.state === 'idle' && this.feet.body.setVelocity(0, 0));
        }
        break;
      case 'home':
        this.moveToward(this.home.x, this.home.y, d.speed * 1.4);
        this.hp = Math.min(this.maxHp, this.hp + 1);
        if (homeD < 6) { this.feet.body.setVelocity(0, 0); this.state = 'idle'; }
        break;
      case 'chase': {
        if (!playerOk || homeD > LEASH || pd > d.sight * 1.8) { this.state = 'home'; break; }
        if (pd < d.reach && time > this.nextAttack) { this.startWarn(player); break; }
        // 멀리서 쏘는 몬스터는 거리를 두고, 나머지는 다가와요
        const keepAway = d.ranged ? 45 : 0;
        let speed = this.speedNow();
        if (d.move === 'hop') speed *= Math.sin(time / 130 + this.phase) > 0 ? 1.7 : 0.1;
        if (d.ranged && pd > 45 && pd < d.reach) speed *= 0.3;
        if (!d.ranged && pd < 12) speed = 0;
        this.moveToward(player.x, player.y, speed, keepAway);
        if (d.move === 'flutter') this.feet.body.velocity.y += Math.sin(time / 120 + this.phase) * 30;
        break;
      }
      case 'warn': {
        this.feet.body.setVelocity(0, 0);
        const p = 1 - (this.until - time) / this.warnMs;
        this.warnP = Math.min(1, p);
        this.drawWarn(this.warnP);
        if (time > this.until) this.release(player);
        break;
      }
      case 'lunge':
        this.combat.lungeHits(this, 11);
        if (time > this.until) {
          this.feet.body.setVelocity(0, 0);
          // 단계가 높으면 곧바로 한 번 더 덮쳐요 (짧은 경고)
          if (!this.followed && playerOk && Math.random() < this.sc.double * (this.elite ? 1.5 : 1)) { this.followed = true; this.startWarn(player, true); break; }
          this.followed = false;
          this.state = 'rest';
          this.until = time + 650 * this.sc.cool;
        }
        break;
      case 'rest':
        this.feet.body.velocity.scale(0.8);
        if (time > this.until) this.state = 'chase';
        break;
    }
    this.sync(time);
  }

  // 공격 준비: 빨간 원으로 어디를 공격할지 미리 보여 줘요 (구르기로 피할 수 있게)
  startWarn(player, quick = false) {
    this.state = 'warn';
    this.warnP = 0;
    this.attackType = this.def.ranged ? 'shot' : !quick && Math.random() < this.sc.slam ? 'slam' : 'lunge';
    this.warnMs = this.combat.diff.warnMs * this.sc.warn * (quick ? 0.6 : 1) * (this.attackType === 'slam' ? 1.25 : 1);
    this.until = this.scene.time.now + this.warnMs;
    this.faceTo(player.x, player.y);
    if (this.def.ranged) {
      this.target = { x: player.x, y: player.y };
    } else if (this.attackType === 'slam') {
      this.target = { x: this.x, y: this.y };
    } else {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.lungeDir = { x: dx / len, y: dy / len };
      this.target = { x: this.x + this.lungeDir.x * this.def.lunge, y: this.y + this.lungeDir.y * this.def.lunge };
    }
    this.scene.sound.play('sfx_windup', { volume: 0.25 });
  }

  drawWarn(p) {
    const g = this.warnG.clear().setDepth(-500);
    const r = this.attackType === 'slam' ? 26 : this.def.ranged ? 10 : 12;
    const { x, y } = this.target;
    g.fillStyle(0xff3b30, 0.12 + 0.18 * p).fillEllipse(x, y, r * 2, r * 1.3);
    g.fillStyle(0xff3b30, 0.45).fillEllipse(x, y, r * 2 * p, r * 1.3 * p);
    g.lineStyle(1, 0xff6b5e, 0.9).strokeEllipse(x, y, r * 2, r * 1.3);
    if (this.attackType === 'lunge') g.lineStyle(2, 0xff3b30, 0.35).lineBetween(this.x, this.y, x, y);
    // 몬스터도 몸을 움츠려요
    const b = this.baseScale;
    this.sprite.setScale(b * (1 + 0.12 * p), b * (1 - 0.12 * p));
  }

  release(player) {
    this.warnG.clear();
    this.sprite.setScale(this.baseScale);
    this.nextAttack = this.scene.time.now + (1300 + Math.random() * 600) * this.sc.cool * (this.elite ? 0.85 : 1);
    if (this.def.ranged) {
      this.combat.shootOrb(this, this.target, this.sc.spread);
      this.state = 'rest';
      this.until = this.scene.time.now + 500;
      return;
    }
    if (this.attackType === 'slam') {
      // 둘레 내려찍기: 몸을 날려 쿵! 경고 원 안이 모두 아파요
      const s = this.scene;
      s.tweens.add({ targets: this.sprite, y: this.sprite.y - 10, duration: 120, yoyo: true, ease: 'Quad.out' });
      s.time.delayedCall(200, () => {
        if (!this.alive) return;
        s.fx('fx_ring', 'na/ring', this.x, this.y - 2, { scale: 1.8, depth: this.y - 3, add: true }).setTint(0xff9a6a);
        s.cameras.main.shake(80, 0.003);
        s.sound.play('sfx_impact', { volume: 0.3 });
        this.combat.areaHits(this, this.x, this.y, 26, 1.2);
      });
      this.state = 'rest';
      this.until = s.time.now + 750;
      return;
    }
    // 경고 원 끝까지 덮쳐요
    const ms = 180;
    const sp = (this.def.lunge / ms) * 1000;
    this.feet.body.setVelocity(this.lungeDir.x * sp, this.lungeDir.y * sp);
    this.state = 'lunge';
    this.lungeHit = new Set();
    this.until = this.scene.time.now + ms;
    this.scene.sound.play('sfx_lunge', { volume: 0.25 });
  }

  // ── 협동: 방장 기기와 주고받기 ─────────────────
  snapshot() {
    const r = (v) => Math.round(v * 10) / 10;
    const warn = this.state === 'warn';
    return [r(this.x), r(this.y), this.hp, this.maxHp, STATES.indexOf(this.state), DIRS.indexOf(this.dir),
      warn ? r(this.target.x) : 0, warn ? r(this.target.y) : 0, warn ? Math.round((this.warnP || 0) * 100) : 0];
  }

  // 친구 기기에서는 몬스터를 직접 움직이지 않고 방장이 보낸 모습을 따라가요
  setRemote(on) {
    this.remote = on;
    this.net = null;
    if (this.state !== 'gone') this.feet.body.enable = !on;
    this.feet.body.setVelocity(0, 0);
    if (on) { this.respawnTimer?.remove(); this.warnG.clear(); this.sprite.setScale(this.baseScale); }
    else if (this.state === 'gone') this.respawnTimer = this.scene.time.delayedCall(RESPAWN_MS / 2, () => this.spawn());
    else if (!['idle', 'chase', 'home'].includes(this.state)) this.state = 'idle';
  }

  applySnapshot(a) {
    if (!a) return;
    const first = !this.net;
    this.net = a;
    const st = STATES[a[4]] || 'idle';
    this.hp = a[2];
    this.maxHp = a[3];
    this.dir = DIRS[a[5]] || 'down';
    if (st === 'gone' && this.state !== 'gone') {
      this.purifyFx();
      if (!first) this.combat.onPurified(this); // 함께 있을 때 물리친 것만 보상
    }
    else if (st !== 'gone' && this.state === 'gone') { this.spawn(); this.feet.setPosition(a[0], a[1]); }
    this.state = st;
    if (st === 'warn') this.target = { x: a[6], y: a[7] };
  }

  updateRemote(time) {
    if (this.state === 'gone' || !this.net) return;
    const [nx, ny] = this.net;
    const far = Math.hypot(nx - this.x, ny - this.y) > 60;
    this.feet.setPosition(far ? nx : this.x + (nx - this.x) * 0.35, far ? ny : this.y + (ny - this.y) * 0.35);
    if (this.state === 'warn') this.drawWarn(this.net[8] / 100);
    else { this.warnG.clear(); this.sprite.setScale(this.baseScale); }
    this.sync(time);
  }

  sync(time) {
    const fly = this.def.fly ? -4 + Math.sin(time / 300 + this.phase) * 2 : 0;
    const hop = this.def.move === 'hop' && this.state === 'chase' ? -Math.abs(Math.sin(time / 130 + this.phase)) * 3 : 0;
    const sx = Math.round(this.feet.x);
    const sy = Math.round(this.feet.y + 3);
    this.sprite.setPosition(sx, sy + fly + hop).setDepth(sy);
    this.shadow.setPosition(sx, sy - 1).setDepth(sy - 1).setScale(this.def.fly ? 0.75 : 1);
    if (time < this.slowUntil) this.sprite.setTint(0x9fd8ff);
    else if (this.elite && this.state !== 'stun') this.sprite.setTint(0xffd06a);
    else if (this.state !== 'stun') this.sprite.clearTint();
    if (this.state !== 'warn') this.play();
    // HP 막대 (맞은 뒤 3초 동안)
    const show = time < (this.hpShownUntil || 0) || (this.elite && this.state !== 'appear');
    this.hpBar.setVisible(show);
    if (show) {
      const w = 14;
      const bx = sx - w / 2;
      const by = sy - 20 + fly;
      this.hpBar.clear().setDepth(100000)
        .fillStyle(0x000000, 0.7).fillRect(bx - 0.5, by - 0.5, w + 1, 3)
        .fillStyle(this.elite ? 0xffc23a : 0xff6a4a, 1).fillRect(bx, by, w * Math.max(0, this.hp / this.maxHp), 2);
    }
  }
}
