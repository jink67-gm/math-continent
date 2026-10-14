// 보스: 천칭 기사왕 (전용 스프라이트 + 전용 패턴)
// ─────────────────────────────────────────────────────────────
// 기본 보스(Boss)의 규칙(수학의 봉인 · 보호막 · 기절 · HP바)은 그대로 쓰고,
// 움직임·공격·그림만 이 보스에 맞게 바꿨어요.
//
// 패턴
//  A. 검 베기        : 다가와서 검을 들고(예고) → 앞쪽 부채꼴 베기  (2페이즈: 2연속 베기)
//  B. 돌진 베기      : 검을 뒤로 빼고(예고선) → 직선 돌진 → 빗나가면 비틀거려 빈틈
//  C. 심판의 천칭    : 천칭 문양을 소환 → 바닥에 붉은 원 → 차례로 폭발 (1페이즈 3곳, 2페이즈 6곳)
//  D. 광역 심판 참격 : 2페이즈 전용. 크게 힘을 모으며 넓은 부채꼴 예고 → 강한 참격
//
// 페이즈: HP 50% 이하 → 2페이즈 (D 패턴 추가, 2연속 베기, 조금 빨라짐, 이펙트 강화)
// 수학 : HP 70%, 40%에서 「심판의 보호막」 → 문제 1개 → 정답이면 보호막 해제 + 기절

import { Boss } from './Boss.js';
import { assets } from '../render/AssetManager.js';
import { makeParticles } from '../render/MonsterAnimation.js';
import { rand, pick } from '../core/utils.js';

const ART = 'monsters/bosses/scale_king/';
// 그림이 보는 방향: -1 왼쪽, 1 오른쪽, 0 정면(뒤집지 않음)
const FACE = {
  idle_1: 0, idle_2: 0, idle_3: 0, idle_4: 0, idle_5: 0,
  walk_1: -1, walk_2: -1, walk_3: -1, walk_4: -1, walk_5: -1,
  slash1_windup: -1, slash1: -1, slash2_windup: -1, slash2: -1,
  dash_windup: 1, dash: 1, balance_cast: 0, judgement_charge: 0, judgement: -1,
  phase: 0, hit: 0, defeat_1: 0, defeat_2: 0, defeat_3: -1, defeat_4: -1,
};
const IDLE_CYCLE = [1, 2, 3, 4, 5, 4, 3, 2];
const HEIGHT = 230; // 화면에 그릴 키(px)

// 예고 시간(초)
const WIND = { slash: 0.65, slash2: 0.42, dash: 0.85, balance: 1.0, judgement: 1.6 };
const PATTERNS = {
  1: ['slash', 'slash', 'dash', 'balance'],
  2: ['slash', 'dash', 'balance', 'judgement', 'judgement'],
};
const SLASH_R = 170;
const SLASH_ARC = 1.05;     // 좌우 60도
const JUDGE_R = 310;
const JUDGE_ARC = 1.3;      // 좌우 75도

export class ScaleKingBoss extends Boss {
  constructor(id, def, x, y) {
    super(id, def, x, y);
    this.lockA = 0;
    this.combo = 0;
    this.emblems = [];
    this.missed = false;
    this.hitPoseT = 0;
    this.deathFx = false;
    this.strikeT = 0;
  }

  // 2페이즈 구조 (50%)
  get phase() {
    return this.hp / this.maxHp > 0.5 ? 1 : 2;
  }

  get removable() {
    return this.dead && this.deathT > 2.8;
  }

  get speedMul() {
    return this.phase >= 2 ? 1.15 : 1;
  }

  takeHit(dmg, kx, ky) {
    const before = this.hp;
    super.takeHit(dmg, kx, ky);
    if (this.hp < before && !this.dead && !this.shielded) this.hitPoseT = 0.16;
  }

  windTime(p = this.pattern) {
    return WIND[p] / (this.phase >= 2 ? 1.12 : 1);
  }

  update(dt, player, combat, bounds, world) {
    this.world = world;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.hitPoseT = Math.max(0, this.hitPoseT - dt);
    this.strikeT = Math.max(0, this.strikeT - dt);
    this.emblems = this.emblems.filter((e) => (e.life -= dt) > 0);
    if (this.dead) {
      if (!this.deathFx) this.startDeathFx(combat, world);
      this.deathT += dt;
      return;
    }
    this.stateT += dt;
    this.x += this.knock.x * dt;
    this.y += this.knock.y * dt;
    const f = Math.pow(0.01, dt);
    this.knock.x *= f;
    this.knock.y *= f;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = this.def.speed * this.speedMul;
    this.moving = false;
    const audio = world.game.audio;

    switch (this.state) {
      case 'intro':
        if (this.stateT > 1.6) this.setState('chase');
        break;
      case 'roar':
        if (this.stateT >= 1.4) {
          this.setState('chase');
          this.attackCd = 0.5;
        }
        break;
      case 'chase': {
        if (this.phase > this.lastPhase) {
          this.lastPhase = this.phase;
          this.enterPhase(world);
          break;
        }
        if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
        if (dist > 110 && !player.dead) {
          this.x += (dx / dist) * speed * dt;
          this.y += (dy / dist) * speed * dt;
          this.moving = true;
        }
        this.attackCd -= dt;
        if (this.attackCd <= 0 && !player.dead) this.chooseAttack(player, dist, world);
        break;
      }
      case 'windup': {
        const wt = this.windTime();
        const k = this.stateT / wt;
        // 예고 초반에는 방향을 따라가다가 끝무렵 고정 (피할 시간)
        if (k < (this.pattern === 'judgement' ? 0.7 : 0.6)) {
          this.lockA = Math.atan2(dy, dx);
          this.target = { x: player.x, y: player.y };
          if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
        }
        if (this.stateT >= wt) this.execute(player, combat, world);
        break;
      }
      case 'striking':
        if (this.stateT >= (this.pattern === 'judgement' ? 0.75 : 0.38)) {
          if (this.pattern === 'slash' && this.phase >= 2 && this.combo === 0 && Math.random() < 0.6) {
            // 2페이즈: 이어지는 강한 베기
            this.combo = 1;
            this.pattern = 'slash2';
            this.setState('windup');
            audio.playSfx('eliteWindup');
          } else {
            this.recover();
          }
        }
        break;
      case 'charging': {
        const sp = 640;
        this.x += this.vx * sp * dt;
        this.y += this.vy * sp * dt;
        this.moving = true;
        // 금빛 잔상
        if (Math.random() < dt * 30) combat.effects.push({ type: 'art', key: 'effects/slash_orange', x: this.x - this.vx * 40, y: this.y - 60, h: 110, life: 0.25, max: 0.25 });
        if (!this.hitDone && Math.hypot(player.x - this.x, player.y - (this.y - 10)) < this.radius + 34) {
          this.hitDone = true;
          combat.monsterHits(this, 1.3);
          world.shake(8);
        }
        if (this.stateT >= 0.55) {
          this.missed = !this.hitDone;
          if (this.missed) {
            world.game.renderer.addFloater('빈틈!', this.x, this.y - 150, '#7dff9a', 24);
            audio.playSfx('land');
          }
          this.recover();
        }
        break;
      }
      case 'casting':
        if (this.stateT >= 0.6) this.recover();
        break;
      case 'recover': {
        const rt = this.missed ? 1.35 : 0.65;
        if (this.stateT >= rt) {
          this.missed = false;
          this.combo = 0;
          this.setState('chase');
          this.attackCd = rand(1.0, 1.7) / (this.phase >= 2 ? 1.25 : 1);
        }
        break;
      }
      case 'sealed':
        break;
      case 'stunned':
        this.stunT -= dt;
        if (this.stunT <= 0) {
          this.stunT = 0;
          if (this.phase > this.lastPhase) {
            this.lastPhase = this.phase;
            this.enterPhase(world);
          } else {
            this.setState('chase');
            this.attackCd = 0.8;
          }
        }
        break;
      default:
        break;
    }

    if (bounds) {
      this.x = Math.max(bounds.x + 60, Math.min(bounds.x + bounds.w - 60, this.x));
      this.y = Math.max(bounds.y + 80, Math.min(bounds.y + bounds.h - 30, this.y));
    }
  }

  enterPhase(world) {
    this.setState('roar');
    world.onBossPhase?.(this, 2);
    world.game.ui.toast('⚖️ 천칭 기사왕이 진심이 되었어요! 「광역 심판 참격」에 조심!', 'warn', 3200);
    for (let i = 0; i < 3; i++) {
      world.combat.effects.push({ type: 'art', key: 'effects/pillar_gold', x: this.x + (i - 1) * 90, y: this.y - 90, h: 240, life: 1.2, max: 1.2 });
    }
  }

  chooseAttack(player, dist, world, force = null) {
    let p = force || pick(PATTERNS[this.phase]);
    if (!force && p === 'dash' && dist < 160) p = 'slash';
    if (!force && p === 'slash' && dist > 260) p = Math.random() < 0.5 ? 'dash' : 'balance';
    this.pattern = p;
    this.combo = 0;
    this.lockA = Math.atan2(player.y - this.y, player.x - this.x);
    this.target = { x: player.x, y: player.y };
    this.setState('windup');
    const audio = world.game.audio;
    if (p === 'balance') {
      // 천칭 문양 소환 + 폭발 위치 미리 정하기
      const n = this.phase >= 2 ? 6 : 3;
      this.balanceSpots = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(0, 1);
        const r = i === 0 ? 0 : rand(80, 170);
        const sx = player.x + Math.cos(a) * r;
        const sy = player.y + Math.sin(a) * r * 0.7;
        this.balanceSpots.push({ x: sx, y: sy });
        this.emblems.push({ x: sx, y: sy - 90, life: this.windTime('balance') + 1.6, max: this.windTime('balance') + 1.6, d: i * 0.08 });
      }
      audio.playSfx('bossJudgeCharge', { vol: 0.6 });
      world.toastOnce('skBalance', '⚖️ 심판의 천칭! 바닥에 붉은 원이 생기면 피하세요!', 'warn', 8);
    } else if (p === 'judgement') {
      audio.playSfx('bossJudgeCharge');
      world.toastOnce('skJudge', '⚠️ 광역 심판 참격! 표시된 범위 밖으로 멀리 피하세요!', 'warn', 8);
    } else {
      audio.playSfx(p === 'dash' ? 'eliteWindup' : 'windup');
    }
  }

  inFan(px, py, r, arc) {
    const dx = px - this.x;
    const dy = (py - this.y) / 0.75;
    const d = Math.hypot(dx, dy);
    if (d > r) return false;
    if (d < 50) return true;
    const a = Math.atan2(py - this.y, px - this.x);
    const diff = Math.abs(Math.atan2(Math.sin(a - this.lockA), Math.cos(a - this.lockA)));
    return diff <= arc;
  }

  execute(player, combat, world) {
    const p = this.pattern;
    const audio = world.game.audio;
    const fx = (key, h, ox = 0, oy = -70, life = 0.4, extra = {}) => combat.effects.push({ type: 'art', key, x: this.x + ox, y: this.y + oy, h, life, max: life, ...extra });
    if (p === 'slash' || p === 'slash2') {
      const r = p === 'slash2' ? SLASH_R + 20 : SLASH_R;
      const ca = Math.cos(this.lockA);
      const sa = Math.sin(this.lockA);
      fx('effects/slash_orange', p === 'slash2' ? 230 : 190, ca * 80, sa * 60 - 60, 0.32);
      if (this.phase >= 2) fx('effects/slash_blue', 150, ca * 90, sa * 60 - 70, 0.3);
      combat.effects.push(makeParticles(this.x + ca * 90, this.y + sa * 60 - 40, { count: 10, colors: ['#ffe066', '#ffffff', '#7fb8ff'], speed: 220, stars: true }));
      if (this.inFan(player.x, player.y, r, SLASH_ARC)) combat.monsterHits(this, p === 'slash2' ? 1.25 : 1.05);
      audio.playSfx('bossSlash', { vol: p === 'slash2' ? 1.15 : 1 });
      world.shake(p === 'slash2' ? 6 : 3);
      this.strikeT = 0.38;
      this.setState('striking');
    } else if (p === 'dash') {
      this.vx = Math.cos(this.lockA);
      this.vy = Math.sin(this.lockA);
      this.facing = this.vx > 0 ? 1 : -1;
      this.hitDone = false;
      this.setState('charging');
      audio.playSfx('bossDash');
    } else if (p === 'balance') {
      (this.balanceSpots || []).forEach((s, i) => {
        combat.delayedAoE(this, s.x, s.y, 72, 0.75 + i * 0.16, this.phase >= 2 ? 1.0 : 0.9);
      });
      fx('effects/pillar_gold', 200, 0, -90, 0.7);
      audio.playSfx('aoe');
      this.setState('casting');
    } else if (p === 'judgement') {
      // 넓은 부채꼴 강타
      const ca = Math.cos(this.lockA);
      const sa = Math.sin(this.lockA);
      for (let i = -2; i <= 2; i++) {
        const a = this.lockA + i * 0.5;
        combat.effects.push({ type: 'art', key: 'effects/burst_gold_big', x: this.x + Math.cos(a) * 170, y: this.y + Math.sin(a) * 120, h: 150, life: 0.6, max: 0.6, grow: true });
      }
      fx('effects/slash_orange', 340, ca * 120, sa * 80 - 50, 0.5);
      combat.effects.push(makeParticles(this.x + ca * 120, this.y + sa * 80, { count: 26, colors: ['#ffe066', '#ffffff', '#7fb8ff'], speed: 380, size: 5, life: 0.7, stars: true }));
      if (this.inFan(player.x, player.y, JUDGE_R, JUDGE_ARC)) combat.monsterHits(this, 1.6);
      audio.playSfx('bossJudgeBlast');
      world.shake(14);
      world.game.hitStop = Math.max(world.game.hitStop || 0, 0.08);
      this.strikeT = 0.75;
      this.setState('striking');
    }
    this.attackPose = 0.45;
  }

  startDeathFx(combat, world) {
    this.deathFx = true;
    for (let i = 0; i < 4; i++) {
      combat.effects.push({ type: 'art', key: 'effects/pillar_gold', x: this.x + (i - 1.5) * 70, y: this.y - 100, h: 280, life: 1.8 + i * 0.2, max: 1.8 + i * 0.2 });
    }
    combat.effects.push(makeParticles(this.x, this.y - 80, { count: 40, colors: ['#ffe066', '#ffffff', '#7fb8ff', '#ffb52e'], speed: 360, size: 5.5, life: 1.2, up: 180, stars: true }));
    world.shake(16);
  }

  // ---------- 그리기 ----------
  frame() {
    const t = this.t;
    if (this.dead) {
      const k = this.deathT;
      return k < 0.35 ? 'hit' : k < 0.8 ? 'defeat_1' : k < 1.25 ? 'defeat_2' : k < 1.7 ? 'defeat_3' : 'defeat_4';
    }
    const p = this.pattern;
    switch (this.state) {
      case 'roar': return 'phase';
      case 'stunned': return 'defeat_1';
      case 'windup':
        if (p === 'slash') return 'slash1_windup';
        if (p === 'slash2') return 'slash2_windup';
        if (p === 'dash') return 'dash_windup';
        if (p === 'balance') return 'balance_cast';
        if (p === 'judgement') return 'judgement_charge';
        break;
      case 'striking':
        if (p === 'slash') return 'slash1';
        if (p === 'slash2') return 'slash2';
        if (p === 'judgement') return 'judgement';
        break;
      case 'charging': return 'dash';
      case 'casting': return 'balance_cast';
      case 'recover': if (this.missed) return 'hit'; break;
      default: break;
    }
    if (this.hitPoseT > 0) return 'hit';
    if (this.moving) return `walk_${1 + (Math.floor(t * 9) % 5)}`;
    return `idle_${IDLE_CYCLE[Math.floor(t * 5) % IDLE_CYCLE.length]}`;
  }

  drawTelegraph(ctx) {
    if (this.state !== 'windup') return;
    const k = Math.min(1, this.stateT / this.windTime());
    const p = this.pattern;
    ctx.save();
    ctx.strokeStyle = '#ff4d64';
    ctx.fillStyle = '#ff4d64';
    if (p === 'slash' || p === 'slash2' || p === 'judgement') {
      const r = p === 'judgement' ? JUDGE_R : p === 'slash2' ? SLASH_R + 20 : SLASH_R;
      const arc = p === 'judgement' ? JUDGE_ARC : SLASH_ARC;
      ctx.translate(this.x, this.y);
      ctx.scale(1, 0.75);
      ctx.globalAlpha = 0.12 + k * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, this.lockA - arc, this.lockA + arc);
      ctx.closePath();
      ctx.fill();
      // 차오르는 선
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, this.lockA - arc, this.lockA + arc);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = p === 'judgement' ? '#ffd23f' : '#ff4d64';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * k, this.lockA - arc, this.lockA + arc);
      ctx.closePath();
      ctx.fill();
    } else if (p === 'dash') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.lockA);
      ctx.globalAlpha = 0.18 + k * 0.32;
      ctx.fillRect(0, -55, 380, 110);
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 8]);
      ctx.strokeRect(0, -55, 380, 110);
      ctx.setLineDash([]);
      ctx.fillRect(0, -55, 380 * k, 4);
    } else if (p === 'balance') {
      // 폭발할 자리 미리 표시 (예고 동안 점점 진해짐)
      for (const s of this.balanceSpots || []) {
        ctx.globalAlpha = 0.15 + k * 0.25;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 8, 72 * k, 72 * k * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(s.x, s.y + 8, 72, 43, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  draw(ctx, t) {
    this.drawTelegraph(ctx);
    // 천칭 문양 (떠 있다가 사라짐)
    for (const e of this.emblems) {
      const k = 1 - e.life / e.max;
      const appear = Math.min(1, (k * e.max - e.d) * 4);
      if (appear <= 0) continue;
      assets.draw(ctx, `${ART}balance_emblem`, e.x, e.y + Math.sin(this.t * 3 + e.d * 10) * 6, {
        height: 70 * (this.phase >= 2 ? 1.15 : 1), center: true, alpha: Math.min(appear, (1 - k) * 3) * 0.95,
      });
    }

    const f = this.frame();
    const key = `${ART}${f}`;
    const a = assets.get(key);
    const base = assets.get(`${ART}idle_1`);
    if (!a || !base) {
      // 그림이 없으면 기본 보스 그림
      super.draw(ctx, t);
      return;
    }
    const s = HEIGHT / base.m.h;
    const face = FACE[f] ?? 0;
    const flipX = face !== 0 && face !== this.facing;
    const footY = this.y + this.radius * 0.5;

    ctx.save();
    // 그림자
    ctx.fillStyle = 'rgba(10, 8, 20, 0.32)';
    ctx.beginPath();
    ctx.ellipse(this.x, footY, this.radius * 1.9, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // 성스러운 오라 (2페이즈는 더 강하게)
    const g = ctx.createRadialGradient(this.x, footY - 100, 10, this.x, footY - 100, 190);
    const pa = this.phase >= 2 ? 0.42 : 0.24;
    g.addColorStop(0, `rgba(255,215,90,${pa + Math.sin(this.t * 4) * 0.06})`);
    g.addColorStop(1, 'rgba(255,215,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, footY - 100, 190, 0, Math.PI * 2);
    ctx.fill();

    let alpha = 1;
    let sy = 1;
    let ox = 0;
    if (this.dead) {
      const k = this.deathT;
      if (k > 1.8) alpha = Math.max(0, 1 - (k - 1.8) / 1.0); // 빛으로 사라짐
    } else if (this.state === 'windup') {
      const k = Math.min(1, this.stateT / this.windTime());
      ox = Math.sin(this.t * 55) * k * (this.pattern === 'judgement' ? 3 : 1.5);
    } else if (!this.moving && this.state === 'chase') {
      sy = 1 + Math.sin(this.t * 2.4) * 0.012;
    }
    const tintA = this.hitPoseT > 0 ? 0.7 * (this.hitPoseT / 0.16) : this.dead && this.deathT < 0.25 ? 0.9 : this.dead && this.deathT > 1.8 ? Math.min(0.8, (this.deathT - 1.8)) : 0;
    const tint = this.dead ? '#fff2b0' : (this.hitPoseT > 0 ? (this.t % 0.12 < 0.06 ? '#ffe9a0' : '#bfe0ff') : null);
    assets.draw(ctx, key, this.x + ox, footY, { scale: s, flipX, sy, alpha, tint, tintA });

    // 심판의 보호막
    if (this.shielded) {
      assets.draw(ctx, 'effects/shield_bubble', this.x, footY - HEIGHT * 0.45, { height: HEIGHT * 1.15, center: true, alpha: 0.55 + Math.sin(this.t * 6) * 0.1 });
      ctx.font = '18px Jua, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2a1c12';
      ctx.strokeText('🛡️ 심판의 보호막', this.x, footY - HEIGHT - 18);
      ctx.fillStyle = '#ffe7a3';
      ctx.fillText('🛡️ 심판의 보호막', this.x, footY - HEIGHT - 18);
    }
    // 기절 별
    if (this.stunT > 0) {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 4; i++) {
        const an = this.t * 4 + (i / 4) * Math.PI * 2;
        ctx.fillText('⭐', this.x + Math.cos(an) * 50, footY - HEIGHT * 0.75 + Math.sin(an) * 12);
      }
    }
    // 광역 심판 예고 문구
    if (this.state === 'windup' && this.pattern === 'judgement') {
      ctx.font = '22px Jua, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#2a1c12';
      const txt = '⚠️ 심판의 참격!';
      ctx.strokeText(txt, this.x, footY - HEIGHT - 20);
      ctx.fillStyle = this.t % 0.3 < 0.15 ? '#ff4d64' : '#ffd23f';
      ctx.fillText(txt, this.x, footY - HEIGHT - 20);
    }
    ctx.restore();
  }
}
