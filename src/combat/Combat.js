// 전투: 3단 콤보, 히트스톱(맞는 순간 아주 잠깐 멈춤), 밀려나기, 피해 숫자,
// 스킬 4칸(SP·재사용 대기), 몬스터 구슬, 골드·회복약 떨어뜨리기, 경험치와 레벨업.
// 장면(WorldScene)마다 하나씩 만들어요. 마을에는 몬스터가 없어서 연습만 할 수 있어요.

import { Monster } from '../world/Monster.js';
import { skillsFor, skillById, skillAt } from '../data/skills.js';
import { diff, statsOf, refreshMax, rollDamage, MAX_LV, STAT_PER_LV, SKILLPT_PER_LV } from '../data/rules.js';
import { textStyle, crisp, ZOOM } from '../ui/style.js';

const DODGE_CD = 1000; // 구르기 다시 쓰기까지(ms)

// 3단 콤보: 공격 시간, 맞는 순간, 범위, 배율, 밀어내는 힘
const COMBO = [
  null,
  { ms: 230, hitAt: 70, reach: 13, r: 13, mult: 1.0, knock: 0.8, stop: 45 },
  { ms: 230, hitAt: 70, reach: 13, r: 13, mult: 1.1, knock: 0.8, stop: 45 },
  { ms: 340, hitAt: 120, reach: 15, r: 17, mult: 1.6, knock: 1.8, stop: 85 },
];
const COMBO_GAP = 450; // 이 시간 안에 다시 누르면 다음 타로 이어져요
// 강타: 2타 뒤 잠깐 쉬었다가(이 사이에) 누르면 3타 대신 크게 내려쳐요
const SMASH_MIN = 200;
const SMASH_MAX = 850;
const SMASH = { ms: 420, hitAt: 170, reach: 15, r: 21, mult: 2.3, knock: 2.6, stop: 110 };
// 힘 모으기: J를 꾹 누르면 모으고, 떼면 1단계(앞쪽 큰 베기) · 2단계(회오리 베기)
const CHARGE_START = 280;
const CHARGE_LV = [0, 550, 1250];
const SP_REGEN_MS = 1500;

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.orbs = [];
    this.bolts = [];
    this.coins = [];
    this.combo = 0;
    this.lastSwingEnd = 0;
    this.queued = false;
    this.cd = [0, 0, 0, 0];
    this.spAt = 0;
    this.coop = false;  // 친구와 같은 장면에 있으면 true
    this.remote = null; // 친구 모습 (RemotePlayer)
  }

  get party() { return this.scene.game.party; }
  get isGuest() { return this.coop && !this.party.isHost; }

  // ── 2인 협동 보정: 혼자일 때보다 느리게 크지 않게 ──
  // 몬스터 HP 1.5배, 경험치 각자 80%, 골드 각자 60%, 아이템은 각자 따로
  get partyHp() { return this.coop ? 1.5 : 1; }
  partyExp() { return this.coop ? 0.8 : 1; }
  partyGold() { return this.coop ? 0.6 : 1; }

  setCoop(on) {
    if (on === this.coop) return;
    const ratio = on ? 1.5 : 1 / 1.5;
    this.coop = on;
    const guest = on && !this.party.isHost;
    for (const m of this.monsters) {
      m.setRemote(guest);
      if (!guest && m.alive) { m.maxHp = Math.round(m.maxHp * ratio); m.hp = Math.max(1, Math.round(m.hp * ratio)); }
    }
  }

  // 친구 기기에서 온 일 처리
  handleEvents(events) {
    for (const e of events) {
      if (e.t === 'hit' && !this.isGuest) {
        const m = this.monsters[e.i];
        if (!m?.hittable) continue;
        m.hit(e.dmg, e.fx, e.fy, e.knock);
        if (e.slow && m.alive) m.slow(e.slow);
      } else if (e.t === 'dmg') {
        this.damagePlayer(e.atk, e.fx, e.fy);
      } else if (e.t === 'revive') {
        this.scene.revive?.();
      } else if (e.t === 'rune') {
        this.scene.onPeerRune?.(e.id);
      } else if (e.t === 'say' && this.remote) {
        this.scene.say?.(String(e.text).slice(0, 12), this.remote);
      } else if (e.t === 'unseal' && !this.isGuest) {
        this.scene.boss?.unseal();
      } else if (e.t === 'orb' && this.isGuest) {
        this.addOrb(e.x, e.y, e.vx, e.vy, 0, true);
      }
    }
  }

  get stats() { return this.scene.registry.get('player'); }
  get player() { return this.scene.player; }
  get diff() { return diff(this.stats); }
  // 네 칸에 낀 스킬 (빈 칸은 null)
  get skills() { return (this.stats.slots || []).map((id) => (id ? skillById(this.stats, id) : null)); }
  get hud() { return this.scene.hud; }

  spawnMonster(kind, x, y, power = 1) {
    const m = new Monster(this.scene, this, kind, x, y, power);
    if (!m.def.fly) this.scene.physics.add.collider(m.feet, this.scene.solids);
    this.monsters.push(m);
    return m;
  }

  // 가장 가까운 몬스터 (자동 조준)
  nearestMonster(range, x = this.player.x, y = this.player.y) {
    let best = null;
    let bestD = range;
    for (const m of this.monsters) {
      if (!m.hittable) continue;
      const d = Math.hypot(m.x - x, m.y - y) - (m.radius || 0);
      if (d < bestD) { best = m; bestD = d; }
    }
    return best;
  }

  // ── 기본 공격 (3단 콤보) ───────────────────────
  attack() {
    const p = this.player;
    if (this.scene.locked) return;
    if (p.state === 'atk') { this.queued = true; return; }
    if (!p.canAct) return;
    const now = this.scene.time.now;
    const gap = now - this.lastSwingEnd;
    if (this.combo === 2 && !this.fromQueue && gap >= SMASH_MIN && gap <= SMASH_MAX) { this.smash(); return; }
    this.fromQueue = false;
    this.combo = gap < COMBO_GAP && this.combo < 3 ? this.combo + 1 : 1;
    this.queued = false;
    const target = this.nearestMonster(36);
    if (target) p.faceTo(target.x, target.y);
    const c = COMBO[this.combo];
    p.swing(this.combo, c.ms, () => {
      this.lastSwingEnd = this.scene.time.now;
      if (this.queued) { this.queued = false; this.fromQueue = true; this.attack(); }
    });
    this.scene.sound.play(`sfx_swing${this.combo}`, { volume: 0.45 });
    const combo = this.combo;
    this.scene.time.delayedCall(c.hitAt, () => {
      if (p.state !== 'atk') return;
      const [fx, fy] = p.facingVector();
      const hx = p.x + fx * c.reach;
      const hy = p.y - 3 + fy * c.reach * 0.8;
      const angle = { right: 0, down: 90, left: 180, up: 270 }[p.dir];
      // 초승달 모양 칼날 자국 (2타는 반대 방향, 3타는 겹 초승달)
      const big = combo === 3;
      this.scene.fx(big ? 'fx_slashdc' : 'fx_slashc', big ? 'na/slashdc' : 'na/slashc', p.x + fx * 9, p.y - 6 + fy * 7,
        { angle, scale: big ? 1.2 : 0.95, depth: p.y + 20, flipY: combo === 2 });
      const n = this.hitArea(hx, hy, c.r, c.mult, c.knock);
      if (n) this.hitstop(c.stop);
      if (combo === 3 && n) {
        this.scene.cameras.main.shake(90, 0.003);
        this.scene.burst(hx, hy - 4, { len: 26, rays: 12, ms: 220, depth: p.y + 25 });
      }
    });
  }

  // 강타: 뛰어올라 크게 내려쳐요 (콤보가 끝나요)
  smash() {
    const p = this.player;
    this.combo = 0;
    this.queued = false;
    const target = this.nearestMonster(44);
    if (target) p.faceTo(target.x, target.y);
    const c = SMASH;
    p.smash(c.ms, () => { this.lastSwingEnd = this.scene.time.now; });
    this.scene.sound.play('sfx_swing3', { volume: 0.5, rate: 0.85 });
    this.popNumber(p.x, p.y - 34, '강타!', '#ffb347', 13);
    this.scene.time.delayedCall(c.hitAt, () => {
      if (p.state !== 'atk') return;
      const [fx, fy] = p.facingVector();
      const hx = p.x + fx * c.reach;
      const hy = p.y - 2 + fy * c.reach * 0.8;
      // 강타: 위에서 아래로 곧게 내려치는 주황 칼날 + 땅이 갈라지는 금
      this.scene.fx('fx_slash', 'na/slash', hx, hy - 8, { angle: 90, scale: 1.7, depth: p.y + 20, add: true }).setTint(0xffa040);
      this.crack(hx, hy + 2, 0xffb347);
      this.scene.fx('fx_smoke', 'na/smoke', hx, hy, { scale: 0.9, depth: hy + 2 });
      this.scene.cameras.main.shake(120, 0.006);
      this.scene.sound.play('sfx_impact', { volume: 0.4 });
      const n = this.hitArea(hx, hy, c.r, c.mult, c.knock);
      if (n) this.hitstop(c.stop);
    });
  }

  // 땅이 갈라지는 금 (강타)
  crack(x, y, color) {
    const g = this.scene.add.graphics().setDepth(y - 4);
    const R = Phaser.Math;
    g.lineStyle(1.5, 0x3a2410, 0.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + R.FloatBetween(-0.3, 0.3);
      let px = x;
      let py = y;
      g.beginPath().moveTo(px, py);
      for (let k = 0; k < 3; k++) { px += Math.cos(a + R.FloatBetween(-0.4, 0.4)) * 5; py += Math.sin(a + R.FloatBetween(-0.4, 0.4)) * 3.5; g.lineTo(px, py); }
      g.strokePath();
    }
    g.fillStyle(color, 0.35).fillEllipse(x, y, 30, 12);
    this.scene.tweens.add({ targets: g, alpha: 0, delay: 350, duration: 500, onComplete: () => g.destroy() });
  }

  // ── 힘 모으기 ──────────────────────────────
  // held: 지금 공격 키(J·공격 단추)를 누르고 있는지. 매 장면 불러요.
  updateCharge(time, held) {
    const p = this.player;
    if (held && !this.wasHeld) this.holdAt = time;
    const released = !held && this.wasHeld;
    this.wasHeld = held;
    if (this.scene.locked && this.chargeAt) { this.cancelCharge(); return; }
    if (held && !this.chargeAt && time - this.holdAt > CHARGE_START && p.canAct) {
      this.chargeAt = time;
      this.chargeLv = 0;
      p.startCharge();
      this.chargeG ??= this.scene.add.graphics().setBlendMode('ADD');
    }
    if (!this.chargeAt) return;
    if (p.state !== 'charge') { this.cancelCharge(); return; }
    const t = time - this.chargeAt;
    const lv = t >= CHARGE_LV[2] ? 2 : t >= CHARGE_LV[1] ? 1 : 0;
    if (lv > this.chargeLv) {
      this.chargeLv = lv;
      this.scene.sound.play('sfx_shield', { volume: 0.35, rate: lv === 2 ? 1.3 : 1 });
      this.scene.fx('fx_sparkc', 'na/sparkc', p.x, p.y - 8, { scale: lv === 2 ? 1.3 : 0.9, depth: p.y + 30, add: true }).setTint(lv === 2 ? 0xffe066 : 0x9be8ff);
    }
    // 둘레에 모이는 빛
    const k = Math.min(1, t / CHARGE_LV[2]);
    const color = this.chargeLv === 2 ? 0xffd04a : this.chargeLv === 1 ? 0x8fe4ff : 0xffffff;
    const r = 14 - k * 5 + Math.sin(time / 60) * 1.2;
    this.chargeG.clear().setDepth(p.y + 40)
      .lineStyle(1.5, color, 0.35 + 0.5 * k).strokeEllipse(p.x, p.y - 6, r * 2.2, r * 1.6)
      .fillStyle(color, 0.08 + 0.12 * k).fillEllipse(p.x, p.y - 6, r * 2, r * 1.4);
    if (released) this.releaseCharge();
  }

  cancelCharge() {
    this.chargeAt = 0;
    this.chargeG?.clear();
    this.player.endCharge();
  }

  releaseCharge() {
    const lv = this.chargeLv;
    const p = this.player;
    this.cancelCharge();
    if (!lv) return;
    this.lastSwingEnd = this.scene.time.now;
    this.combo = 0;
    if (lv === 1) {
      // 앞쪽으로 넓게 베기
      p.swing(3, 380);
      const [fx, fy] = p.facingVector();
      const hx = p.x + fx * 16;
      const hy = p.y - 3 + fy * 13;
      this.scene.sound.play('sfx_swing3', { volume: 0.5 });
      this.popNumber(p.x, p.y - 34, '모아 베기!', '#9be8ff', 12);
      this.scene.time.delayedCall(90, () => {
        // 모아 베기: 파란 빛의 넓은 초승달 두 겹 (3타·스킬과 다른 색)
        const ang = { right: 0, down: 90, left: 180, up: 270 }[p.dir];
        this.scene.fx('fx_slashc', 'na/slashc', hx, hy - 3, { angle: ang, scale: 2.1, depth: p.y + 20, add: true }).setTint(0x6fd0ff);
        this.scene.time.delayedCall(50, () => this.scene.fx('fx_slashc', 'na/slashc', hx, hy - 3, { angle: ang, scale: 1.6, depth: p.y + 21, add: true, flipY: true }).setTint(0xbff0ff));
        if (this.hitArea(hx, hy, 24, 2.2, 2.2)) { this.hitstop(90); this.scene.cameras.main.shake(100, 0.005); }
      });
      return;
    }
    // 2단계: 회오리 베기 — 둘레를 두 바퀴
    p.spin(520);
    this.scene.sound.play('sfx_skill', { volume: 0.45 });
    this.popNumber(p.x, p.y - 36, '회오리 베기!', '#ffd04a', 13);
    // 회오리 베기: 금빛 칼날 네 개가 둘레를 두 바퀴 (회전 베기 스킬과 다른 모양)
    const blades = [0, 1, 2, 3].map(() => this.scene.add.sprite(p.x, p.y, 'na/slashc', 1).setBlendMode('ADD').setTint(0xffd04a).setScale(1.2).setDepth(p.y + 20));
    this.scene.tweens.addCounter({ from: 0, to: Math.PI * 4, duration: 520, ease: 'Sine.inOut',
      onUpdate: (t) => blades.forEach((b, i) => {
        const a = t.getValue() + (i * Math.PI) / 2;
        b.setPosition(p.x + Math.cos(a) * 24, p.y - 6 + Math.sin(a) * 16).setRotation(a + Math.PI / 2).setDepth(p.y + 20);
      }),
      onComplete: () => blades.forEach((b) => this.scene.tweens.add({ targets: b, alpha: 0, scale: 1.8, duration: 160, onComplete: () => b.destroy() })) });
    this.scene.fx('fx_ring', 'na/ring', p.x, p.y - 2, { scale: 3, depth: p.y - 3, add: true }).setTint(0xffd04a);
    for (let i = 0; i < 2; i++) {
      this.scene.time.delayedCall(100 + i * 230, () => { if (this.hitArea(p.x, p.y - 2, 34, 1.7, 2.4)) this.hitstop(70); });
    }
    this.scene.cameras.main.shake(180, 0.006);
  }

  // 범위 안 몬스터를 모두 때려요. 맞은 수를 돌려줘요.
  hitArea(x, y, r, mult, knock, { from = this.player, slowMs = 0, sound = true } = {}) {
    let n = 0;
    for (const m of this.monsters) {
      if (!m.hittable) continue;
      if (Math.hypot(m.x - x, (m.y - y) * 1.2) > r + 5 + (m.radius || 0)) continue;
      this.damageMonster(m, mult, knock, from, { sound: sound && n === 0, slowMs });
      n++;
    }
    return n;
  }

  damageMonster(m, mult, knock, from = this.player, { sound = true, slowMs = 0 } = {}) {
    const st = statsOf(this.stats);
    const buff = this.scene.time.now < (this.roarUntil || 0) ? 1 + this.roarBoost : 1;
    const { dmg, crit } = rollDamage(st.atk * buff, mult, m.def.def, st.crit, st.critDmg);
    m.hit(dmg, from.x, from.y, knock);
    if (slowMs && m.alive) m.slow(slowMs);
    // 친구 기기에서 때리면 방장에게 알려서 HP를 깎아요
    if (m.remote) this.party.send({ t: 'hit', i: this.monsters.indexOf(m), dmg, knock, fx: from.x, fy: from.y, slow: slowMs || 0 });
    this.popNumber(m.x, m.y - 16, dmg, crit ? '#ffd23f' : '#ffffff', crit ? 18 : 15);
    // 연타 세기: 1.6초 안에 계속 맞히면 숫자가 올라가요
    const now = this.scene.time.now;
    this.chain = now - (this.chainAt || 0) < 1600 ? (this.chain || 0) + 1 : 1;
    this.chainAt = now;
    if (this.chain >= 3) this.hud?.showChain?.(this.chain);
    if (sound) this.scene.sound.play(crit ? 'sfx_crit' : knock > 1.2 ? 'sfx_hit_heavy' : 'sfx_hit', { volume: 0.4 });
  }

  // 맞는 순간 화면이 아주 잠깐 멈춰서 손맛이 나요
  hitstop(ms) {
    const s = this.scene;
    if (this.frozen) return;
    this.frozen = true;
    s.physics.world.pause();
    s.tweens.pauseAll();
    s.anims.pauseAll();
    setTimeout(() => {
      this.frozen = false;
      if (!s.sys.isActive()) return;
      s.physics.world.resume();
      s.tweens.resumeAll();
      s.anims.resumeAll();
    }, ms);
  }

  popNumber(x, y, value, color, size = 13) {
    const t = crisp(this.scene.add.text(x + (Math.random() - 0.5) * 8, y, `${value}`, textStyle(size, color)))
      .setOrigin(0.5).setScale(1 / ZOOM).setDepth(100002);
    this.scene.tweens.add({ targets: t, y: y - 12, duration: 280, ease: 'Quad.out' });
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 450, duration: 300, onComplete: () => t.destroy() });
  }

  // ── 구르기 ─────────────────────────────────
  dodge(vx, vy) {
    if (this.scene.locked) return;
    const now = this.scene.time.now;
    if (now < (this.dodgeAt || 0)) return; // 구르기는 잠깐 쉬었다가 다시 쓸 수 있어요
    const p = this.player;
    // 공격·힘 모으기 중에도 구르기로 끊을 수 있어요 (제노니아처럼)
    if (p.state === 'charge') this.cancelCharge();
    if (p.state === 'atk') p.state = 'move';
    if (!p.dodge(vx, vy)) return;
    this.dodgeAt = now + DODGE_CD;
    this.queued = false;
    this.scene.sound.play('sfx_dodge', { volume: 0.45 });
    this.scene.fx('fx_smoke', 'na/smoke', p.x, p.y - 4, { scale: 0.6, depth: p.y - 2 });
  }

  // ── 스킬 ───────────────────────────────────
  skillState(i) {
    const base = this.skills[i];
    const now = this.scene.time.now;
    if (!base) return { sk: null, empty: true, cdLeft: 0, cdRatio: 0 };
    const sk = skillAt(base, this.stats.skillLv?.[base.id] || 1, statsOf(this.stats).mag);
    // 대기 시간은 스킬마다 기억해요 (칸을 바꿔도 그대로)
    const until = this.cdBy?.[sk.id] || 0;
    return { sk, cdLeft: Math.max(0, until - now), cdRatio: Math.max(0, until - now) / sk.cd, noSp: this.stats.sp < sk.sp };
  }

  dodgeState() {
    const left = Math.max(0, (this.dodgeAt || 0) - this.scene.time.now);
    return { cdLeft: left, cdRatio: left / DODGE_CD };
  }

  castSkill(i) {
    if (this.scene.locked) return;
    const p = this.player;
    const st = this.skillState(i);
    if (!st.sk) { this.hud?.toast('빈 칸이에요. 능력(C) 창에서 스킬을 끼워요'); return; }
    if (st.cdLeft > 0) { this.hud?.toast(`${(st.cdLeft / 1000).toFixed(1)}초 뒤에 쓸 수 있어요`); return; }
    if (st.noSp) { this.hud?.toast('SP가 부족해요'); return; }
    if (p.state === 'charge') this.cancelCharge();
    if (p.state === 'atk') p.state = 'move';
    if (!p.canAct) return;
    this.queued = false; // 스킬을 쓰면 이어지던 콤보는 끊겨요 (효과가 겹치지 않게)
    this.combo = 0;
    const sk = st.sk;
    const aim = this.nearestMonster(sk.range || 70);
    if (aim) p.faceTo(aim.x, aim.y);
    this.stats.sp -= sk.sp;
    (this.cdBy ??= {})[sk.id] = this.scene.time.now + sk.cd;
    this.scene.sound.play('sfx_skill', { volume: 0.4 });
    this[`skill_${sk.kind}`](sk, aim);
  }

  skill_spin(sk) {
    const p = this.player;
    p.spin(380);
    this.scene.fx('fx_slashcirc', 'na/slashcirc', p.x, p.y - 6, { scale: 1.5, depth: p.y + 20 });
    this.scene.time.delayedCall(120, () => this.scene.fx('fx_slashcirc', 'na/slashcirc', p.x, p.y - 6, { scale: 1.9, depth: p.y + 20, angle: 90 }));
    this.scene.time.delayedCall(140, () => {
      this.scene.burst(p.x, p.y - 4, { len: sk.r + 10, rays: 16, color: 0xfff0a0, depth: p.y + 25 });
      if (this.hitArea(p.x, p.y - 2, sk.r, sk.mult, sk.knock)) this.hitstop(70);
    });
  }

  skill_dash(sk) {
    const p = this.player;
    const [vx, vy] = this.scene.moveInputOr(p.facingVector());
    p.faceTo(p.x + vx, p.y + vy);
    const ms = 200;
    p.rush(vx, vy, (sk.dist / ms) * 1000, ms, 'cast', ms + 100);
    p.sprite.play(`${p.key}_atk_${p.dir}`, true);
    const hit = new Set();
    for (let k = 0; k <= 4; k++) {
      this.scene.time.delayedCall((ms / 4) * k, () => {
        this.scene.fx('fx_smoke', 'na/smoke', p.x, p.y - 2, { scale: 0.45, depth: p.y - 2 });
        for (const m of this.monsters) {
          if (!m.hittable || hit.has(m)) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) < sk.r + 6 + (m.radius || 0)) { hit.add(m); this.damageMonster(m, sk.mult, sk.knock); }
        }
      });
    }
    this.scene.time.delayedCall(ms, () => {
      if (!hit.size) return;
      this.hitstop(60);
      this.scene.burst(p.x, p.y - 4, { len: 30, rays: 12, color: 0xffd27a, depth: p.y + 25 });
    });
  }

  skill_guard(sk) {
    const p = this.player;
    p.cast(200);
    p.guardUntil = this.scene.time.now + sk.ms;
    this.guardCut = sk.cut;
    this.scene.sound.play('sfx_shield', { volume: 0.4 });
    const sh = this.scene.add.sprite(p.x, p.y, 'na/shield', 0).setBlendMode('ADD').setAlpha(0.85);
    sh.play({ key: 'fx_shield', repeat: -1 });
    const follow = () => sh.setPosition(p.sprite.x, p.sprite.y - 6).setDepth(p.sprite.depth + 1);
    this.scene.events.on('postupdate', follow);
    this.scene.time.delayedCall(sk.ms, () => { this.scene.events.off('postupdate', follow); sh.destroy(); });
  }

  skill_quake(sk) {
    const p = this.player;
    p.cast(520, { jump: 10 });
    this.scene.time.delayedCall(260, () => {
      this.scene.cameras.main.shake(180, 0.008);
      this.scene.sound.play('sfx_impact', { volume: 0.5 });
      this.scene.fx('fx_ring', 'na/ring', p.x, p.y - 2, { scale: 3.4, depth: p.y - 3, add: true });
      this.scene.fx('fx_sparkc', 'na/sparkc', p.x, p.y - 4, { scale: 2.2, depth: p.y + 20, add: true });
      this.scene.burst(p.x, p.y - 2, { len: sk.r + 16, rays: 20, color: 0xffc860, ms: 340, width: 3, depth: p.y + 25 });
      if (this.hitArea(p.x, p.y, sk.r, sk.mult, sk.knock)) this.hitstop(110);
    });
  }

  skill_bolt(sk, aim) {
    const p = this.player;
    p.cast(220);
    let [vx, vy] = p.facingVector();
    if (aim) { const dx = aim.x - p.x; const dy = aim.y - p.y; const l = Math.hypot(dx, dy) || 1; vx = dx / l; vy = dy / l; }
    const s = this.scene.add.sprite(p.x + vx * 8, p.y - 6 + vy * 8, 'na/flam', 1).setBlendMode('ADD').setScale(0.7);
    s.play('fx_flam_loop');
    s.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)) + 90);
    this.bolts.push({ s, vx: vx * sk.speed, vy: vy * sk.speed, left: sk.range, sk });
  }

  skill_ice(sk) {
    const p = this.player;
    p.cast(300);
    this.scene.fx('fx_ring', 'na/ring', p.x, p.y - 2, { scale: 2.8, depth: p.y - 3, add: true }).setTint(0x9fe8ff);
    this.scene.burst(p.x, p.y - 4, { len: sk.r + 8, rays: 16, color: 0x8fe4ff, ms: 320, depth: p.y + 25 });
    for (const m of this.monsters) {
      if (m.hittable && Math.hypot(m.x - p.x, m.y - p.y) < sk.r + 5) this.scene.fx('fx_ice', 'na/ice', m.x, m.y - 10, { depth: m.y + 10 });
    }
    this.scene.time.delayedCall(120, () => this.hitArea(p.x, p.y, sk.r, sk.mult, 0.6, { slowMs: sk.slowMs }));
  }

  skill_heal(sk) {
    const p = this.player;
    const s = this.stats;
    p.cast(350);
    const amount = Math.min(s.maxHp - s.hp, Math.round(s.maxHp * sk.ratio));
    s.hp += amount;
    this.scene.sound.play('sfx_heal', { volume: 0.5 });
    this.scene.fx('fx_sparkc', 'na/sparkc', p.x, p.y - 8, { scale: 1.4, depth: p.y + 30, add: true }).setTint(0x9dff9d);
    this.scene.burst(p.x, p.y - 8, { len: 24, rays: 10, color: 0x9dff9d, ms: 360, width: 1.6, depth: p.y + 30 });
    this.popNumber(p.x, p.y - 20, `+${amount}`, '#8dff8a', 14);
  }

  skill_star(sk) {
    const p = this.player;
    p.cast(380);
    const targets = this.monsters.filter((m) => m.hittable && Math.hypot(m.x - p.x, m.y - p.y) < sk.range)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const [fx, fy] = p.facingVector();
    for (let k = 0; k < sk.hits; k++) {
      const m = targets[k % Math.max(1, targets.length)];
      const tx = m ? m.x : p.x + fx * (30 + k * 20);
      const ty = m ? m.y : p.y + fy * (30 + k * 20);
      this.scene.time.delayedCall(150 + k * 200, () => {
        const star = this.scene.add.sprite(tx + 20, ty - 70, 'na/star', 2).setBlendMode('ADD').setScale(1.3).setDepth(ty + 50);
        this.scene.tweens.add({
          targets: star, x: tx, y: ty - 4, duration: 180, ease: 'Quad.in',
          onComplete: () => {
            star.destroy();
            this.scene.fx('fx_star', 'na/star', tx, ty - 4, { scale: 1.8, depth: ty + 20, add: true });
            this.scene.burst(tx, ty - 4, { len: 30, rays: 14, color: 0xfff27a, depth: ty + 25 });
            this.scene.cameras.main.shake(70, 0.004);
            if (this.hitArea(tx, ty, sk.r, sk.mult, 1.2)) this.hitstop(50);
          },
        });
      });
    }
  }

  // 검기 날리기: 꿰뚫고 나가는 칼바람
  skill_wave(sk, aim) {
    const p = this.player;
    p.swing(3, 260);
    let [vx, vy] = p.facingVector();
    if (aim) { const dx = aim.x - p.x; const dy = aim.y - p.y; const l = Math.hypot(dx, dy) || 1; vx = dx / l; vy = dy / l; }
    const s = this.scene.add.sprite(p.x + vx * 8, p.y - 6 + vy * 8, 'na/slashc', 1).setScale(1.1).setTint(0xbfe8ff).setBlendMode('ADD');
    s.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
    this.bolts.push({ s, vx: vx * sk.speed, vy: vy * sk.speed, left: sk.range, sk, pierce: new Set(), fx: 'wave' });
    this.scene.sound.play('sfx_swing3', { volume: 0.45 });
  }

  // 기합: 잠깐 공격력 상승
  skill_roar(sk) {
    const p = this.player;
    p.cast(380, { jump: 4 });
    this.roarUntil = this.scene.time.now + sk.ms;
    this.roarBoost = sk.boost;
    this.scene.sound.play('sfx_levelup', { volume: 0.35, rate: 0.8 });
    this.scene.cameras.main.shake(140, 0.004);
    this.scene.fx('fx_ring', 'na/ring', p.x, p.y - 2, { scale: 2.6, depth: p.y - 3, add: true }).setTint(0xff7a4a);
    this.scene.burst(p.x, p.y - 8, { len: 30, rays: 14, color: 0xff9a5a, ms: 320, depth: p.y + 25 });
    this.popNumber(p.x, p.y - 26, `공격력 +${Math.round(sk.boost * 100)}%`, '#ff9a5a', 11);
  }

  // 연속 찌르기
  skill_flurry(sk) {
    const p = this.player;
    const ms = 70;
    p.cast(ms * sk.hits + 120);
    for (let k = 0; k < sk.hits; k++) {
      this.scene.time.delayedCall(k * ms, () => {
        const [fx, fy] = p.facingVector();
        const off = (k % 2 ? 1 : -1) * 3;
        const hx = p.x + fx * 15 - fy * off;
        const hy = p.y - 3 + fy * 12 + fx * off;
        this.scene.fx('fx_slash', 'na/slash', hx, hy - 3, { angle: { right: 0, down: 90, left: 180, up: 270 }[p.dir], scale: 0.6, depth: p.y + 20 });
        this.scene.sound.play('sfx_swing1', { volume: 0.25, rate: 1.3 });
        if (this.hitArea(hx, hy, sk.r, sk.mult, sk.knock, { sound: k % 2 === 0 })) this.hitstop(25);
      });
    }
  }

  // 하늘 내려찍기: 가까운 적(없으면 앞)으로 뛰어가 쿵!
  skill_leap(sk, aim) {
    const p = this.player;
    const [fx, fy] = p.facingVector();
    const tx = aim ? aim.x : p.x + fx * 50;
    const ty = aim ? aim.y + 4 : p.y + fy * 50;
    const ms = 420;
    p.cast(ms + 160, { jump: 24 });
    p.feet.body.setVelocity(((tx - p.x) / ms) * 1000, ((ty - p.y) / ms) * 1000);
    p.invUntil = Math.max(p.invUntil, this.scene.time.now + ms + 100);
    this.scene.time.delayedCall(ms, () => {
      p.feet.body.setVelocity(0, 0);
      this.scene.cameras.main.shake(220, 0.01);
      this.scene.sound.play('sfx_impact', { volume: 0.55 });
      this.scene.fx('fx_ring', 'na/ring', p.x, p.y - 2, { scale: 3.8, depth: p.y - 3, add: true }).setTint(0xffc860);
      this.scene.fx('fx_smoke', 'na/smoke', p.x, p.y - 4, { scale: 1.6, depth: p.y + 5 });
      this.scene.burst(p.x, p.y - 2, { len: sk.r + 18, rays: 22, color: 0xffd27a, ms: 360, width: 3, depth: p.y + 25 });
      if (this.hitArea(p.x, p.y, sk.r, sk.mult, sk.knock)) this.hitstop(120);
    });
  }

  // 번개 사슬: 가까운 적에서 다음 적으로 튀어요
  skill_chain(sk, aim) {
    const p = this.player;
    p.cast(260);
    const hit = new Set();
    let from = { x: p.x, y: p.y - 8 };
    let cur = aim || this.nearestMonster(sk.range);
    for (let k = 0; k < sk.jumps && cur; k++) {
      hit.add(cur);
      const a = from;
      const b = { x: cur.x, y: cur.y - 8 };
      const m = cur;
      const mult = sk.mult * (1 - 0.12 * k);
      this.scene.time.delayedCall(k * 110, () => {
        const g = this.scene.add.graphics().setDepth(b.y + 60).setBlendMode('ADD');
        const pts = [a];
        for (let i = 1; i < 5; i++) pts.push({ x: a.x + (b.x - a.x) * i / 5 + Phaser.Math.Between(-5, 5), y: a.y + (b.y - a.y) * i / 5 + Phaser.Math.Between(-5, 5) });
        pts.push(b);
        g.lineStyle(3, 0x8fd8ff, 0.6).strokePoints(pts).lineStyle(1.2, 0xffffff, 1).strokePoints(pts);
        this.scene.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
        this.scene.sound.play('sfx_orb', { volume: 0.3, rate: 1.6 });
        if (m.hittable) { this.damageMonster(m, mult, 0.6, a); this.hitstop(25); }
      });
      from = b;
      cur = this.monsters.filter((o) => o.hittable && !hit.has(o) && Math.hypot(o.x - m.x, o.y - m.y) < 70)
        .sort((u, v) => Math.hypot(u.x - m.x, u.y - m.y) - Math.hypot(v.x - m.x, v.y - m.y))[0];
    }
  }

  // 마나 보호막: 일정 피해를 대신 막아요
  skill_barrier(sk) {
    const p = this.player;
    p.cast(260);
    this.barrier = Math.round(this.stats.maxHp * sk.ratio);
    this.barrierUntil = this.scene.time.now + sk.ms;
    this.scene.sound.play('sfx_shield', { volume: 0.45 });
    this.barrierFx?.destroy();
    const sh = this.scene.add.sprite(p.x, p.y, 'na/shield', 0).setBlendMode('ADD').setAlpha(0.7).setTint(0x9fd8ff).setScale(1.2);
    sh.play({ key: 'fx_shield', repeat: -1 });
    this.barrierFx = sh;
    const follow = () => {
      if (!this.barrier || this.scene.time.now > this.barrierUntil) { this.barrier = 0; sh.destroy(); this.barrierFx = null; this.scene.events.off('postupdate', follow); return; }
      sh.setPosition(p.sprite.x, p.sprite.y - 6).setDepth(p.sprite.depth + 1);
    };
    this.scene.events.on('postupdate', follow);
    this.popNumber(p.x, p.y - 26, `보호막 ${this.barrier}`, '#9fd8ff', 11);
  }

  // 순간 이동: 빛이 되어 앞으로 날아가 터져요
  skill_blink(sk) {
    const p = this.player;
    const [vx, vy] = this.scene.moveInputOr(p.facingVector());
    const ms = 140;
    this.scene.fx('fx_sparkc', 'na/sparkc', p.x, p.y - 6, { scale: 1, depth: p.y + 20, add: true }).setTint(0xc8b4ff);
    p.rush(vx, vy, (sk.dist / ms) * 1000, ms, 'cast', ms + 350);
    p.sprite.setAlpha(0.3);
    this.scene.time.delayedCall(ms, () => {
      p.sprite.setAlpha(1);
      this.scene.fx('fx_sparkc', 'na/sparkc', p.x, p.y - 6, { scale: 1.6, depth: p.y + 20, add: true }).setTint(0xc8b4ff);
      this.scene.burst(p.x, p.y - 4, { len: sk.r + 8, rays: 14, color: 0xc8b4ff, ms: 260, depth: p.y + 25 });
      if (this.hitArea(p.x, p.y - 2, sk.r, sk.mult, 1.4)) this.hitstop(60);
    });
  }

  // 거대 운석: 경고 원 뒤에 커다란 운석이 떨어져요
  skill_meteor(sk, aim) {
    const p = this.player;
    p.cast(420);
    const [fx, fy] = p.facingVector();
    const tx = aim ? aim.x : p.x + fx * 50;
    const ty = aim ? aim.y : p.y + fy * 50;
    const g = this.scene.add.graphics().setDepth(-400);
    const tw = this.scene.tweens.addCounter({ from: 0, to: 1, duration: 650, onUpdate: (t) => {
      const k = t.getValue();
      g.clear().fillStyle(0xffa040, 0.15 + 0.2 * k).fillEllipse(tx, ty, sk.r * 2, sk.r * 1.3).lineStyle(1, 0xffc070, 0.9).strokeEllipse(tx, ty, sk.r * 2 * k, sk.r * 1.3 * k);
    } });
    const rock = this.scene.add.sprite(tx + 50, ty - 140, 'na/flam', 2).setScale(2.6).setBlendMode('ADD').setDepth(ty + 60);
    rock.play('fx_flam_loop');
    this.scene.tweens.add({ targets: rock, x: tx, y: ty - 6, duration: 650, ease: 'Quad.in', onComplete: () => {
      rock.destroy();
      g.destroy();
      tw.remove();
      this.scene.cameras.main.shake(260, 0.012);
      this.scene.sound.play('sfx_impact', { volume: 0.6 });
      this.scene.fx('fx_ring', 'na/ring', tx, ty, { scale: 4.4, depth: ty - 3, add: true }).setTint(0xff9a40);
      this.scene.fx('fx_flam', 'na/flam', tx, ty - 8, { scale: 2.6, depth: ty + 30, add: true });
      this.scene.burst(tx, ty - 4, { len: sk.r + 20, rays: 24, color: 0xffa040, ms: 380, width: 3, depth: ty + 25 });
      if (this.hitArea(tx, ty, sk.r, sk.mult, 2.4)) this.hitstop(130);
    } });
  }

  // ── 몬스터의 공격 ───────────────────────────
  targets() {
    return this.coop && this.remote ? [this.player, this.remote] : [this.player];
  }

  // 덮치기에 닿은 주인공을 한 번씩 때려요 (친구는 친구 기기에 알려요)
  lungeHits(m, r) {
    for (const t of this.targets()) {
      if (m.lungeHit.has(t) || Math.hypot(t.x - m.x, t.y - m.y) > r) continue;
      m.lungeHit.add(t);
      this.hitTarget(t, m.atk, m.x, m.y);
    }
  }

  // 둘레 공격 (몬스터 내려찍기)
  areaHits(m, x, y, r, mult = 1) {
    for (const t of this.targets()) {
      if (Math.hypot(t.x - x, (t.y - y) * 1.3) > r) continue;
      this.hitTarget(t, Math.round(m.atk * mult), x, y);
    }
  }

  hitTarget(t, atk, fx, fy) {
    if (t === this.player) return this.damagePlayer(atk, fx, fy);
    this.party.send({ t: 'dmg', atk, fx, fy });
    return true;
  }

  damagePlayer(atk, fromX, fromY) {
    const p = this.player;
    if (p.state === 'down') return false;
    // 수학 문제·상점 창을 보는 동안은 맞지 않아요 (협동 중에도)
    const g = this.scene.game;
    if (g.runes?.open || g.panelOpen) return false;
    if (p.invulnerable) {
      if (p.state === 'dodge') this.popNumber(p.x, p.y - 20, 'MISS', '#bfe6ff', 11);
      return false;
    }
    const s = this.stats;
    let { dmg } = rollDamage(atk, 1, statsOf(s).def);
    dmg = Math.max(1, Math.round(dmg * this.diff.dmgTaken * (p.guarding ? 1 - this.guardCut : 1)));
    // 마나 보호막이 먼저 막아요
    if (this.barrier > 0 && this.scene.time.now < this.barrierUntil) {
      const take = Math.min(this.barrier, dmg);
      this.barrier -= take;
      dmg -= take;
      this.popNumber(p.x, p.y - 22, `막음 ${take}`, '#9fd8ff', 11);
      if (dmg <= 0) { this.scene.sound.play('sfx_shield', { volume: 0.3 }); return false; }
    }
    s.hp = Math.max(0, s.hp - dmg);
    this.popNumber(p.x, p.y - 20, dmg, '#ff6a5a', 14);
    this.scene.sound.play('sfx_hurt', { volume: 0.45 });
    this.scene.cameras.main.shake(100, 0.004);
    this.hud?.flashHurt();
    if (s.hp <= 0) { this.scene.onPlayerDown(); return true; }
    if (!p.guarding) p.hurt(fromX, fromY);
    return true;
  }

  // n갈래로 쏴요 (단계가 높을수록 여러 갈래, 조금 더 빠르게)
  shootOrb(m, target, n = 1) {
    const base = Math.atan2(target.y - m.y, target.x - m.x);
    const speed = 75 * (1 + 0.05 * ((m.tier || 1) - 1));
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.32;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      this.addOrb(m.x, m.y - 8, vx, vy, m.atk ?? m.def.atk, false);
      if (this.coop) this.party.send({ t: 'orb', x: m.x, y: m.y - 8, vx, vy });
    }
  }

  // look: 친구 기기에서 보여 주기만 하는 구슬 (맞았는지는 방장이 정해요)
  addOrb(x, y, vx, vy, atk, look) {
    const s = this.scene.add.sprite(x, y, 'na/sparkc', 1).setBlendMode('ADD').setScale(0.55).setTint(0xb48cff);
    this.orbs.push({ s, vx, vy, life: 2200, atk, look, hit: new Set() });
    this.scene.sound.play('sfx_orb', { volume: 0.25 });
  }

  // ── 보상 ───────────────────────────────────
  onPurified(m) {
    const s = this.stats;
    const d = this.diff;
    s.kills = (s.kills || 0) + 1;
    this.scene.game.quests?.onPurify(this.scene.placeKey, m.kind);
    this.scene.sound.play('sfx_purify', { volume: 0.35 });
    const [g0, g1] = m.def.gold;
    const elite = m.elite ? 1 : 0;
    const gold = Math.round(Phaser.Math.Between(g0, g1) * d.drop * this.partyGold() * (elite ? 2.5 : 1));
    this.dropCoins(m.x, m.y, gold);
    if (Math.random() < 0.05 * d.drop) this.dropPotion(m.x, m.y);
    // 강화석: 정예는 꼭, 보통 몬스터는 가끔 (높은 지역일수록 자주). 4단계부터 정예는 빛나는 강화석도
    const tier = m.tier || 1;
    if (elite || Math.random() < (0.03 + 0.008 * tier) * d.drop) this.spawnPickup(m.x, m.y, 'items/materials/ore_stone', { stone: elite && Math.random() < 0.3 ? 2 : 1 }, 0.09);
    if (elite && tier >= 4 && Math.random() < 0.3) this.spawnPickup(m.x, m.y, 'items/materials/crystal_blue', { stone2: 1 }, 0.09);
    if (elite) this.hud?.toast('정예 몬스터를 물리쳤어요!');
    this.gainExp(Math.round(m.def.exp * d.exp * this.partyExp() * this.boost() * (elite ? 2.5 : 1)));
  }

  // 선생님이 켠 「경험치 2배 시간」
  boost() {
    const until = this.scene.game.classCfg?.expBoostUntil || 0;
    return Date.now() < until ? 2 : 1;
  }


  dropCoins(x, y, total) {
    const n = Math.min(5, Math.max(1, Math.ceil(total / 3)));
    let left = total;
    for (let i = 0; i < n; i++) {
      const v = i === n - 1 ? left : Math.floor(total / n);
      left -= v;
      this.spawnPickup(x, y, 'na/coin', { gold: v });
    }
  }

  dropPotion(x, y) {
    this.spawnPickup(x, y, 'items/consumables/potion_red', { potion: 1 }, 0.09);
  }

  spawnPickup(x, y, key, give, scale = 1) {
    const s = this.scene.add.image(x, y - 6, key).setScale(scale).setDepth(y + 1);
    const a = Math.random() * Math.PI * 2;
    const tx = x + Math.cos(a) * (8 + Math.random() * 10);
    const ty = y + Math.sin(a) * (5 + Math.random() * 6);
    this.scene.tweens.add({ targets: s, x: tx, duration: 380 });
    this.scene.tweens.add({ targets: s, y: { from: y - 6, to: ty - 2 }, duration: 380, ease: 'Bounce.out' });
    this.coins.push({ s, give, readyAt: this.scene.time.now + 450 });
  }

  collect(c) {
    const s = this.stats;
    if (c.give.gold) { s.gold += c.give.gold; this.scene.sound.play('sfx_gold', { volume: 0.25 }); }
    if (c.give.potion) { s.potions = (s.potions || 0) + 1; this.hud?.toast('회복약을 주웠어요!'); this.scene.sound.play('sfx_gold', { volume: 0.4 }); }
    if (c.give.stone) { s.stones = (s.stones || 0) + c.give.stone; this.hud?.toast(`강화석 ${c.give.stone}개를 주웠어요! (가진 것 ${s.stones}개)`); this.scene.sound.play('sfx_item', { volume: 0.4 }); }
    if (c.give.stone2) { s.stones2 = (s.stones2 || 0) + c.give.stone2; this.hud?.toast(`빛나는 강화석을 주웠어요! (가진 것 ${s.stones2}개)`); this.scene.sound.play('sfx_item', { volume: 0.5 }); }
    c.s.destroy();
  }

  gainExp(n) {
    const s = this.stats;
    if (s.lv >= MAX_LV) return;
    s.exp += n;
    this.popNumber(this.player.x + 10, this.player.y - 24, `+${n} EXP`, '#ffe066', 10);
    let up = false;
    while (s.lv < MAX_LV && s.exp >= s.next) {
      s.exp -= s.next;
      s.lv++;
      s.tests = (s.tests || 0) + 1; // 레벨마다 성장 시험 하나 (미뤄도 돼요)
      s.statEarned = (s.statEarned || 0) + STAT_PER_LV;
      s.statPts = (s.statPts || 0) + STAT_PER_LV;
      s.skillEarned = (s.skillEarned || 0) + SKILLPT_PER_LV;
      s.skillPts = (s.skillPts || 0) + SKILLPT_PER_LV;
      refreshMax(s);
      up = true;
    }
    if (!up) return;
    s.hp = s.maxHp;
    s.sp = s.maxSp;
    this.levelUpFx();
  }

  levelUpFx() {
    const p = this.player;
    const s = this.stats;
    this.scene.sound.play('sfx_levelup', { volume: 0.5 });
    this.scene.fx('fx_ring', 'na/ring', p.x, p.y - 2, { scale: 2.5, depth: p.y - 3, add: true }).setTint(0xffe066);
    this.scene.fx('fx_sparkc', 'na/sparkc', p.x, p.y - 10, { scale: 1.6, depth: p.y + 30, add: true }).setTint(0xffe066);
    const t = crisp(this.scene.add.text(p.x, p.y - 26, 'LEVEL UP!', textStyle(16, '#ffe066'))).setOrigin(0.5).setScale(1 / ZOOM).setDepth(100003);
    this.scene.tweens.add({ targets: t, y: t.y - 14, alpha: 0, delay: 700, duration: 700, onComplete: () => t.destroy() });
    this.hud?.showBanner(`레벨 ${s.lv}!`, `능력치 포인트 +${STAT_PER_LV} · 스킬 포인트 +${SKILLPT_PER_LV} (C 능력 창에서 올려요)`);
    const learned = skillsFor(s).find((k) => k.lv === s.lv);
    if (learned) {
      this.scene.time.delayedCall(1600, () => {
        this.scene.sound.play('sfx_unlock', { volume: 0.5 });
        this.hud?.toast(`마을의 룬 학자에게 새 스킬 「${learned.name}」을(를) 배울 수 있어요!`);
      });
    }
    this.scene.saveGame();
  }

  // ── 매 장면 ─────────────────────────────────
  update(time, delta) {
    if (this.frozen) return;
    const p = this.player;
    const s = this.stats;
    const dt = delta / 1000;

    // SP는 천천히 차요
    if (time > this.spAt) { this.spAt = time + SP_REGEN_MS; if (s.sp < s.maxSp) s.sp++; }

    const targets = this.targets();
    for (const m of this.monsters) m.update(time, targets);

    // 주인공의 불꽃 화살
    this.bolts = this.bolts.filter((b) => {
      b.s.x += b.vx * dt;
      b.s.y += b.vy * dt;
      b.left -= Math.hypot(b.vx, b.vy) * dt;
      b.s.setDepth(b.s.y + 10);
      if (b.pierce) {
        // 꿰뚫는 칼바람: 닿은 적마다 한 번씩
        for (const m of this.monsters) {
          if (!m.hittable || b.pierce.has(m) || Math.hypot(m.x - b.s.x, m.y - 6 - b.s.y) > b.sk.r + 4 + (m.radius || 0)) continue;
          b.pierce.add(m);
          this.damageMonster(m, b.sk.mult, 1.0, { x: b.s.x - b.vx * 0.05, y: b.s.y - b.vy * 0.05 });
          this.hitstop(30);
        }
        if (b.left > 0) return true;
        b.s.destroy();
        return false;
      }
      const hitM = this.monsters.find((m) => m.hittable && Math.hypot(m.x - b.s.x, m.y - 6 - b.s.y) < b.sk.r + 4 + (m.radius || 0));
      if (hitM || b.left <= 0) {
        this.scene.fx('fx_flam', 'na/flam', b.s.x, b.s.y, { depth: b.s.y + 20, add: true });
        if (hitM) { this.damageMonster(hitM, b.sk.mult, 1.0); this.hitstop(40); }
        b.s.destroy();
        return false;
      }
      return true;
    });

    // 몬스터 구슬
    this.orbs = this.orbs.filter((o) => {
      o.s.x += o.vx * dt;
      o.s.y += o.vy * dt;
      o.life -= delta;
      o.s.setDepth(o.s.y + 10).setAngle(time / 4);
      if (!o.look) {
        for (const t of targets) {
          if (o.hit.has(t) || Math.hypot(t.x - o.s.x, t.y - 6 - o.s.y) >= 8) continue;
          o.hit.add(t);
          if (this.hitTarget(t, o.atk, o.s.x, o.s.y)) o.life = 0;
        }
      }
      if (o.life <= 0) {
        this.scene.fx('fx_smoke', 'na/smoke', o.s.x, o.s.y, { scale: 0.35, depth: o.s.y });
        o.s.destroy();
        return false;
      }
      return true;
    });

    // 떨어진 골드: 가까이 가면 빨려 들어와요
    this.coins = this.coins.filter((c) => {
      if (time < c.readyAt) return true;
      const dx = p.x - c.s.x;
      const dy = p.y - 4 - c.s.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) { this.collect(c); return false; }
      if (d < 48 || time > c.readyAt + 1500) {
        const sp = Math.max(90, 260 - d * 2) * dt;
        c.s.x += (dx / d) * sp;
        c.s.y += (dy / d) * sp;
        c.s.setDepth(c.s.y + 2);
      }
      return true;
    });
  }
}
