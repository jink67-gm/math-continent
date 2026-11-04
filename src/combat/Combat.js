// 전투: 3단 콤보, 히트스톱(맞는 순간 아주 잠깐 멈춤), 밀려나기, 피해 숫자,
// 스킬 4칸(SP·재사용 대기), 몬스터 구슬, 골드·회복약 떨어뜨리기, 경험치와 레벨업.
// 장면(WorldScene)마다 하나씩 만들어요. 마을에는 몬스터가 없어서 연습만 할 수 있어요.

import { Monster } from '../world/Monster.js';
import { skillsFor } from '../data/skills.js';
import { diff, levelStats, rollDamage, MAX_LV } from '../data/rules.js';
import { textStyle, crisp } from '../ui/style.js';

// 3단 콤보: 공격 시간, 맞는 순간, 범위, 배율, 밀어내는 힘
const COMBO = [
  null,
  { ms: 230, hitAt: 70, reach: 13, r: 13, mult: 1.0, knock: 0.8, stop: 45 },
  { ms: 230, hitAt: 70, reach: 13, r: 13, mult: 1.1, knock: 0.8, stop: 45 },
  { ms: 340, hitAt: 120, reach: 15, r: 17, mult: 1.6, knock: 1.8, stop: 85 },
];
const COMBO_GAP = 450; // 이 시간 안에 다시 누르면 다음 타로 이어져요
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
    this.partyHp = 1; // 2인 협동이면 1.5 (다음 단계)
  }

  get stats() { return this.scene.registry.get('player'); }
  get player() { return this.scene.player; }
  get diff() { return diff(this.stats); }
  get skills() { return skillsFor(this.stats); }
  get hud() { return this.scene.hud; }

  spawnMonster(kind, x, y) {
    const m = new Monster(this.scene, this, kind, x, y);
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
      const d = Math.hypot(m.x - x, m.y - y);
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
    this.combo = now - this.lastSwingEnd < COMBO_GAP && this.combo < 3 ? this.combo + 1 : 1;
    this.queued = false;
    const target = this.nearestMonster(36);
    if (target) p.faceTo(target.x, target.y);
    const c = COMBO[this.combo];
    p.swing(this.combo, c.ms, () => {
      this.lastSwingEnd = this.scene.time.now;
      if (this.queued) { this.queued = false; this.attack(); }
    });
    this.scene.sound.play(`sfx_swing${this.combo}`, { volume: 0.45 });
    const combo = this.combo;
    this.scene.time.delayedCall(c.hitAt, () => {
      if (p.state !== 'atk') return;
      const [fx, fy] = p.facingVector();
      const hx = p.x + fx * c.reach;
      const hy = p.y - 3 + fy * c.reach * 0.8;
      const angle = { right: 0, down: 90, left: 180, up: 270 }[p.dir];
      this.scene.fx('fx_slash', 'na/slash', hx, hy - 3, { angle, scale: combo === 3 ? 1.25 : 0.9, depth: p.y + 20 });
      const n = this.hitArea(hx, hy, c.r, c.mult, c.knock);
      if (n) this.hitstop(c.stop);
      if (combo === 3 && n) this.scene.cameras.main.shake(90, 0.003);
    });
  }

  // 범위 안 몬스터를 모두 때려요. 맞은 수를 돌려줘요.
  hitArea(x, y, r, mult, knock, { from = this.player, slowMs = 0, sound = true } = {}) {
    let n = 0;
    for (const m of this.monsters) {
      if (!m.hittable) continue;
      if (Math.hypot(m.x - x, (m.y - y) * 1.2) > r + 5) continue;
      this.damageMonster(m, mult, knock, from, { sound: sound && n === 0 });
      if (slowMs && m.alive) m.slow(slowMs);
      n++;
    }
    return n;
  }

  damageMonster(m, mult, knock, from = this.player, { sound = true } = {}) {
    const atk = levelStats(this.stats.lv).atk;
    const { dmg, crit } = rollDamage(atk, mult, m.def.def);
    m.hit(dmg, from.x, from.y, knock);
    this.popNumber(m.x, m.y - 16, dmg, crit ? '#ffd23f' : '#ffffff', crit ? 16 : 13);
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
      .setOrigin(0.5).setScale(1 / 3).setDepth(100002);
    this.scene.tweens.add({ targets: t, y: y - 12, duration: 280, ease: 'Quad.out' });
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 450, duration: 300, onComplete: () => t.destroy() });
  }

  // ── 구르기 ─────────────────────────────────
  dodge(vx, vy) {
    if (this.scene.locked) return;
    const p = this.player;
    // 공격 중에도 구르기로 끊을 수 있어요 (제노니아처럼)
    if (p.state === 'atk') p.state = 'move';
    if (!p.dodge(vx, vy)) return;
    this.queued = false;
    this.scene.sound.play('sfx_dodge', { volume: 0.45 });
    this.scene.fx('fx_smoke', 'na/smoke', p.x, p.y - 4, { scale: 0.6, depth: p.y - 2 });
  }

  // ── 스킬 ───────────────────────────────────
  skillState(i) {
    const sk = this.skills[i];
    const now = this.scene.time.now;
    return {
      sk,
      locked: this.stats.lv < sk.lv,
      cdLeft: Math.max(0, this.cd[i] - now),
      cdRatio: Math.max(0, this.cd[i] - now) / sk.cd,
      noSp: this.stats.sp < sk.sp,
    };
  }

  castSkill(i) {
    if (this.scene.locked) return;
    const p = this.player;
    const st = this.skillState(i);
    if (!st.sk) return;
    if (st.locked) { this.hud?.toast(`레벨 ${st.sk.lv}이 되면 배울 수 있어요`); return; }
    if (st.cdLeft > 0) { this.hud?.toast(`${(st.cdLeft / 1000).toFixed(1)}초 뒤에 쓸 수 있어요`); return; }
    if (st.noSp) { this.hud?.toast('SP가 부족해요'); return; }
    if (p.state === 'atk') p.state = 'move';
    if (!p.canAct) return;
    const sk = st.sk;
    const aim = this.nearestMonster(sk.range || 70);
    if (aim) p.faceTo(aim.x, aim.y);
    this.stats.sp -= sk.sp;
    this.cd[i] = this.scene.time.now + sk.cd;
    this.scene.sound.play('sfx_skill', { volume: 0.4 });
    this[`skill_${sk.kind}`](sk, aim);
  }

  skill_spin(sk) {
    const p = this.player;
    p.spin(380);
    for (let k = 0; k < 4; k++) {
      this.scene.time.delayedCall(k * 70, () => {
        const a = k * 90 + { right: 0, down: 90, left: 180, up: 270 }[p.dir];
        const rad = Phaser.Math.DegToRad(a);
        this.scene.fx('fx_slash', 'na/slash', p.x + Math.cos(rad) * 16, p.y - 4 + Math.sin(rad) * 12, { angle: a, scale: 1.1, depth: p.y + 20 });
      });
    }
    this.scene.time.delayedCall(140, () => { if (this.hitArea(p.x, p.y - 2, sk.r, sk.mult, sk.knock)) this.hitstop(70); });
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
          if (Math.hypot(m.x - p.x, m.y - p.y) < sk.r + 6) { hit.add(m); this.damageMonster(m, sk.mult, sk.knock); }
        }
      });
    }
    this.scene.time.delayedCall(ms, () => hit.size && this.hitstop(60));
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
            this.scene.cameras.main.shake(70, 0.004);
            if (this.hitArea(tx, ty, sk.r, sk.mult, 1.2)) this.hitstop(50);
          },
        });
      });
    }
  }

  // ── 몬스터의 공격 ───────────────────────────
  touchPlayer(m, r) {
    const p = this.player;
    if (Math.hypot(p.x - m.x, p.y - m.y) > r) return false;
    return this.damagePlayer(m.def.atk, m.x, m.y);
  }

  damagePlayer(atk, fromX, fromY) {
    const p = this.player;
    if (p.state === 'down') return false;
    if (p.invulnerable) {
      if (p.state === 'dodge') this.popNumber(p.x, p.y - 20, 'MISS', '#bfe6ff', 11);
      return false;
    }
    const s = this.stats;
    let { dmg } = rollDamage(atk, 1, levelStats(s.lv).def);
    dmg = Math.max(1, Math.round(dmg * this.diff.dmgTaken * (p.guarding ? 1 - this.guardCut : 1)));
    s.hp = Math.max(0, s.hp - dmg);
    this.popNumber(p.x, p.y - 20, dmg, '#ff6a5a', 14);
    this.scene.sound.play('sfx_hurt', { volume: 0.45 });
    this.scene.cameras.main.shake(100, 0.004);
    this.hud?.flashHurt();
    if (s.hp <= 0) { this.scene.onPlayerDown(); return true; }
    if (!p.guarding) p.hurt(fromX, fromY);
    return true;
  }

  shootOrb(m, target) {
    const dx = target.x - m.x;
    const dy = target.y - m.y;
    const len = Math.hypot(dx, dy) || 1;
    const s = this.scene.add.sprite(m.x, m.y - 8, 'na/sparkc', 1).setBlendMode('ADD').setScale(0.55).setTint(0xb48cff);
    this.orbs.push({ s, vx: (dx / len) * 75, vy: (dy / len) * 75, life: 2200, atk: m.def.atk, src: m });
    this.scene.sound.play('sfx_orb', { volume: 0.25 });
  }

  // ── 보상 ───────────────────────────────────
  onPurified(m) {
    const s = this.stats;
    const d = this.diff;
    s.kills = (s.kills || 0) + 1;
    this.scene.sound.play('sfx_purify', { volume: 0.35 });
    const [g0, g1] = m.def.gold;
    const gold = Math.round(Phaser.Math.Between(g0, g1) * d.drop * this.partyGold());
    this.dropCoins(m.x, m.y, gold);
    if (Math.random() < 0.05 * d.drop) this.dropPotion(m.x, m.y);
    this.gainExp(Math.round(m.def.exp * d.exp * this.partyExp()));
  }

  partyExp() { return 1; }  // 2인 협동이면 0.8 (다음 단계)
  partyGold() { return 1; } // 2인 협동이면 0.6 (다음 단계)

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
      // 공격력·방어력은 저장하지 않고 그때그때 레벨에서 계산해요
      const ls = levelStats(s.lv);
      Object.assign(s, { maxHp: ls.maxHp, maxSp: ls.maxSp, next: ls.next });
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
    const t = crisp(this.scene.add.text(p.x, p.y - 26, 'LEVEL UP!', textStyle(16, '#ffe066'))).setOrigin(0.5).setScale(1 / 3).setDepth(100003);
    this.scene.tweens.add({ targets: t, y: t.y - 14, alpha: 0, delay: 700, duration: 700, onComplete: () => t.destroy() });
    this.hud?.showBanner(`레벨 ${s.lv}!`, 'HP·SP가 모두 회복됐어요');
    const learned = this.skills.find((k) => k.lv === s.lv);
    if (learned) {
      this.scene.time.delayedCall(1600, () => {
        this.scene.sound.play('sfx_unlock', { volume: 0.5 });
        this.hud?.toast(`새 스킬을 배웠어요: ${learned.name}`);
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

    for (const m of this.monsters) m.update(time, p);

    // 주인공의 불꽃 화살
    this.bolts = this.bolts.filter((b) => {
      b.s.x += b.vx * dt;
      b.s.y += b.vy * dt;
      b.left -= Math.hypot(b.vx, b.vy) * dt;
      b.s.setDepth(b.s.y + 10);
      const hitM = this.monsters.find((m) => m.hittable && Math.hypot(m.x - b.s.x, m.y - 6 - b.s.y) < b.sk.r + 4);
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
      if (Math.hypot(p.x - o.s.x, p.y - 6 - o.s.y) < 8 && this.damagePlayer(o.atk, o.s.x, o.s.y)) { o.life = 0; }
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
