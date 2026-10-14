// 전투 계산: 플레이어 공격·스킬 → 몬스터, 몬스터 공격 → 플레이어
// 피해 = 공격력 × 배율 × (0.9~1.1) − 방어력 × 0.5  (최소 1)
// 치명타 10% 확률로 1.5배

import { rand } from '../core/utils.js';
import { INK } from '../render/sprites.js';
import { drawProjectile } from '../render/bossSprites.js';
import { assets } from '../render/AssetManager.js';
import { COMBO } from '../player/Player.js';
import { startHit, makeParticles, updateParticles, drawParticles } from '../render/MonsterAnimation.js';

const CRIT_CHANCE = 0.1;

// 4프레임 가로 시트 효과 그리기 (k: 0~1 진행도)
function drawSheet(ctx, key, x, y, k, size, rot = 0, alpha = 1, flip = false) {
  const a = assets.get(key);
  if (!a) return false;
  const n = 4, fw = a.m.w / n, fi = Math.min(n - 1, Math.floor(k * n));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (flip) ctx.scale(1, -1);
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(a.img, fi * fw, 0, fw, a.m.h, -size / 2, -size / 2, size, size);
  ctx.restore();
  return true;
}

export class CombatManager {
  constructor(game, world) {
    this.game = game;
    this.world = world;
    this.effects = [];
    this.projectiles = [];
    this.dash = null;
  }

  get player() {
    return this.game.player;
  }

  calcDamage(attack, mult, defense, canCrit = true) {
    const crit = canCrit && Math.random() < CRIT_CHANCE;
    const raw = attack * mult * rand(0.9, 1.1) * (crit ? 1.5 : 1) - defense * 0.5;
    return { dmg: Math.max(1, Math.round(raw)), crit };
  }

  // ---------- 플레이어 → 몬스터 ----------
  // 가장 가까운 몬스터 (공격 방향 도움)
  nearestEnemy(p, range = 140) {
    let best = null;
    let bd = range;
    for (const m of this.world.monsters) {
      if (m.dead || m.invulnerable) continue;
      const d = Math.hypot(m.x - p.x, m.y - p.y) - m.radius;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  // 콤보 step(1~3)타가 맞는 순간
  playerAttack(step = 1) {
    const p = this.player;
    const c = COMBO[step - 1] || COMBO[0];
    const ang = Math.atan2(p.facing.y, p.facing.x);
    this.effects.push({ type: 'slash', step, a: ang, follow: true, fx: c.fx, life: step === 3 ? 0.26 : 0.2, max: step === 3 ? 0.26 : 0.2, flip: step === 2 });
    let hit = 0;
    for (const m of this.world.monsters) {
      if (m.dead) continue;
      const dx = m.x - p.x;
      const dy = (m.y - p.y) * 1.15;
      const d = Math.hypot(dx, dy);
      if (d - m.radius > c.range) continue;
      const dot = (dx * p.facing.x + dy * p.facing.y) / (d || 1);
      if (d > m.radius + 24 && dot < c.minDot) continue;
      if (this.damageMonster(m, c.mult, c.knock, { heavy: step === 3, step }) !== false) hit += 1;
    }
    if (hit > 0) {
      this.game.hitStop = Math.max(this.game.hitStop || 0, c.stop);
      if (c.shake) this.world.shake(c.shake);
    }
    return hit;
  }

  castSkill(def) {
    const p = this.player;
    p.skillT = 0.42;
    p.cancelCombo();
    this.game.audio.playSfx('skill');
    switch (def.effect) {
      case 'spin': {
        this.effects.push({ type: 'spin', follow: true, r: def.radius, life: 0.35, max: 0.35 });
        this.effects.push({ type: 'art', key: 'effects/slash_blue', follow: true, h: def.radius * 1.6, spin: 16, life: 0.35, max: 0.35, oy: -14 });
        for (const m of this.world.monsters) {
          if (m.dead) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) - m.radius <= def.radius) this.damageMonster(m, def.mult, 240);
        }
        break;
      }
      case 'dash': {
        p.startSkillDash();
        this.dash = { hit: new Set(), mult: def.mult };
        this.effects.push({ type: 'trail', follow: true, life: 0.3, max: 0.3 });
        this.effects.push({ type: 'art', key: 'effects/dust_cloud', x: p.x, y: p.y + 10, h: 60, life: 0.4, max: 0.4 });
        break;
      }
      case 'smash': {
        const fx = p.x + p.facing.x * 46;
        const fy = p.y + p.facing.y * 46;
        this.effects.push({ type: 'smash', x: fx, y: fy, r: 70, life: 0.4, max: 0.4 });
        this.effects.push({ type: 'art', key: 'effects/burst_gold_big', x: fx, y: fy - 30, h: 150, grow: true, life: 0.45, max: 0.45 });
        this.game.hitStop = Math.max(this.game.hitStop || 0, 0.08);
        for (const m of this.world.monsters) {
          if (m.dead) continue;
          const dx = m.x - p.x;
          const dy = m.y - p.y;
          const d = Math.hypot(dx, dy);
          const dot = (dx * p.facing.x + dy * p.facing.y) / (d || 1);
          if (d - m.radius <= 110 && (dot > 0.35 || d < m.radius + 26)) this.damageMonster(m, def.mult, 520);
        }
        this.world.shake(6);
        break;
      }
      case 'meteor': {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const rr = i === 0 ? 0 : def.radius * 0.6;
          this.effects.push({ type: 'meteor', x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.7, life: 0.55 + i * 0.04, max: 0.55 + i * 0.04, glyph: ['÷', '×', '+', '−', '=', '%', '½'][i] });
        }
        for (const m of this.world.monsters) {
          if (m.dead) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) - m.radius <= def.radius) this.damageMonster(m, def.mult, 200);
        }
        this.world.shake(8);
        break;
      }
      case 'heal': {
        this.game.audio.playSfx('heal');
        const max = this.game.equipment.totals().maxHp;
        const st = this.game.save.stats;
        const amount = Math.min(max - Math.floor(st.hp), Math.round(max * def.ratio));
        st.hp = Math.min(max, st.hp + Math.round(max * def.ratio));
        this.effects.push({ type: 'ring', follow: true, r: 50, color: '#7dff9a', life: 0.7, max: 0.7 });
        this.effects.push({ type: 'art', key: 'effects/heal_green', follow: true, h: 120, life: 0.8, max: 0.8, oy: -36 });
        this.game.renderer.addFloater(`+${Math.max(0, amount)} HP`, p.x, p.y - 50, '#7dff9a', 22);
        this.game.ui.updateHUD();
        break;
      }
      case 'guard': {
        p.guardT = def.duration;
        this.effects.push({ type: 'art', key: 'effects/pillar_blue', follow: true, h: 120, life: 0.5, max: 0.5, oy: -40 });
        this.effects.push({ type: 'ring', follow: true, r: 46, color: '#8fe3ff', life: 0.5, max: 0.5 });
        break;
      }
      default:
        break;
    }
  }

  damageMonster(m, mult, knock, { heavy = false, step = 0 } = {}) {
    if (m.dead) return false;
    const p = this.player;
    if (m.invulnerable) {
      if (m.boss) {
        this.effects.push({ type: 'ring', x: m.x, y: m.y - 40, r: 30, color: '#9ff3ff', life: 0.25, max: 0.25 });
        this.world.toastOnce('shield', '🛡️ 보호막 때문에 공격이 막혀요! 수학의 봉인을 풀어야 해요.', 'info', 4);
      }
      return false;
    }
    const totals = this.game.equipment.totals();
    let { dmg, crit } = this.calcDamage(totals.attack, mult * m.damageMult, m.defense);
    // 방어형: 정면 공격은 막혀요
    const gf = m.guardFactor ? m.guardFactor(p.x, p.y) : 1;
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (gf < 1) {
      dmg = Math.max(1, Math.round(dmg * gf));
      crit = false;
      m.blockFx = 0.3;
      this.game.renderer.addFloater('막음!', m.x, m.y - 46 * m.scale, '#bfe9ff', 18);
      this.effects.push({ type: 'spark', x: m.x - dx / d * m.radius, y: m.y - 14, life: 0.2, max: 0.2, color: '#bfe9ff' });
      this.game.audio.playSfx('block');
      this.world.toastOnce('guardTip', '🛡️ 방패로 막아요! 옆이나 뒤로 돌아가서 공격해 보세요.', 'info', 20);
      knock *= 0.2;
    }
    const k = m.boss ? knock * 0.15 : m.elite ? knock * 0.3 : knock;
    m.takeHit(dmg, (dx / d) * k, (dy / d) * k, { heavy, blocked: gf < 1 });
    // ----- 공통 피격 연출 (모든 몬스터) -----
    if (!m.boss) startHit(m, p.x, p.y, crit);
    const hy = m.y - 16 * Math.min(2, m.scale);
    const hx = m.x - (dx / d) * m.radius * 0.4;
    this.effects.push(makeParticles(hx, hy, crit
      ? { count: 14, colors: ['#ffffff', '#ffd23f', '#ff6b4f'], speed: 260, size: 4.2, stars: true }
      : { count: gf < 1 ? 5 : 7, colors: gf < 1 ? ['#bfe9ff', '#ffffff'] : ['#ffffff', '#fff3a8'], speed: 170 }));
    this.game.renderer.addFloater(crit ? `치명타 ${dmg}!` : `${dmg}`, m.x + rand(-8, 8), m.y - 30 * Math.min(2, m.scale), crit ? '#ffd23f' : gf < 1 ? '#bfe9ff' : '#ffffff', crit ? 30 : step === 3 ? 23 : 20);
    if (gf >= 1) {
      this.effects.push({ type: 'impact', x: m.x - (dx / d) * m.radius * 0.4, y: m.y - 16 * Math.min(2, m.scale), big: heavy || crit, life: heavy ? 0.3 : 0.22, max: heavy ? 0.3 : 0.22, a: rand(0, 6.28) });
      // 적중했을 때만: 치명타 > 마지막(3타) 강타 > 일반
      if (crit) this.game.audio.playSfx('crit');
      else if (heavy) {
        this.game.audio.playSfx('hitHeavy');
        this.game.audio.playSfx('hit', { vol: 0.6, rate: 0.8 }); // 묵직하게 한 겹 더
      } else this.game.audio.playSfx('hit');
    }
    if (m.dead) {
      // ----- 공통 처치 연출: 번쩍 → 작아지며 사라짐(Monster 그리기) + 파티클 -----
      this.effects.push({ type: 'poof', x: m.x, y: m.y - 10, r: m.radius * 1.6 * Math.min(2, m.scale), life: 0.5, max: 0.5 });
      this.effects.push(makeParticles(m.x, m.y - 14 * Math.min(2, m.scale), {
        count: m.elite ? 22 : 14, colors: [m.def?.color || '#ffffff', '#ffffff', '#ffe066'], speed: m.elite ? 280 : 210, size: 4, life: 0.55, up: 120, stars: true,
      }));
      this.game.audio.playSfx(m.elite ? 'eliteDown' : 'kill');
      this.world.onMonsterKilled(m);
    }
    return true;
  }

  // ---------- 몬스터 → 플레이어 ----------
  monsterHits(m, mult = 1) {
    const p = this.player;
    if (p.invulnerable) return false;
    const totals = this.game.equipment.totals();
    let { dmg } = this.calcDamage(m.attack, mult, totals.defense, false);
    if (p.guardT > 0) dmg = Math.max(1, Math.round(dmg * 0.5));
    if (!p.hurt(dmg, m.x, m.y)) return false;
    this.game.renderer.addFloater(`-${dmg}`, p.x, p.y - 40, '#ff6b7d', 22);
    this.game.audio.playSfx('playerHurt');
    this.game.hitStop = Math.max(this.game.hitStop || 0, 0.06);
    this.world.shake(4);
    this.game.ui.updateHUD();
    if (p.dead) this.game.onPlayerDown();
    return true;
  }

  monsterAoE(m, r, mult = 1, x = m.x, y = m.y, kind = 'puff') {
    this.effects.push({ type: kind === 'land' ? 'dust' : 'puff', x, y: y + 8, r, color: m.def.color, life: 0.45, max: 0.45 });
    const p = this.player;
    if (Math.hypot(p.x - x, (p.y - y) / 0.75) < r + 14) this.monsterHits(m, mult);
  }

  // 바닥에 위험 표시 → delay초 뒤 폭발
  delayedAoE(source, x, y, r, delay, mult = 1) {
    this.effects.push({ type: 'warn', x, y: y + 8, r, life: delay, max: delay, source, mult, onEnd: true });
  }

  // 보스 내려찍기: 원형 충격파
  bossSmash(boss, r, mult) {
    this.effects.push({ type: 'puff', x: boss.x, y: boss.y + 4, r, color: '#c9a27a', life: 0.5, max: 0.5 });
    this.effects.push({ type: 'smash', x: boss.x, y: boss.y, r: r * 0.8, life: 0.45, max: 0.45 });
    this.world.shake(10);
    this.game.audio.playSfx('hit');
    const p = this.player;
    if (Math.hypot(p.x - boss.x, (p.y - boss.y) / 0.6) < r + 12) this.monsterHits(boss, mult);
  }

  spawnProjectile(pr) {
    this.projectiles.push({ life: 3, t: 0, ...pr });
  }

  update(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      pr.t += dt;
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (!p.dead && Math.hypot(p.x - pr.x, p.y - 20 - pr.y) < pr.r + 16) {
        pr.life = 0;
        this.monsterHits(pr.source, pr.mult);
        this.effects.push({ type: 'spark', x: pr.x, y: pr.y, life: 0.2, max: 0.2 });
      }
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0);
    if (this.dash) {
      if (p.skillDashT <= 0) {
        this.dash = null;
      } else {
        for (const m of this.world.monsters) {
          if (m.dead || this.dash.hit.has(m)) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) < m.radius + 30) {
            this.dash.hit.add(m);
            this.damageMonster(m, this.dash.mult, 260);
          }
        }
      }
    }
    for (const e of this.effects) {
      e.life -= dt;
      if (e.type === 'particles') updateParticles(e, dt);
      if (e.type === 'warn' && e.life <= 0 && e.onEnd) {
        e.onEnd = false;
        const src = e.source;
        if (src && !src.dead) {
          this.effects.push({ type: 'blast', x: e.x, y: e.y, r: e.r, life: 0.4, max: 0.4 });
          this.game.audio.playSfx('explode');
          this.world.shake(3);
          if (Math.hypot(p.x - e.x, (p.y + 8 - e.y) / 0.6) < e.r + 12) this.monsterHits(src, e.mult);
        }
      }
    }
    this.effects = this.effects.filter((e) => e.life > 0);
  }

  drawEffects(ctx) {
    const p = this.player;
    for (const pr of this.projectiles) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(pr.x, pr.y + 26, pr.r, pr.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!drawArtProjectile(ctx, pr)) drawProjectile(ctx, pr.x, pr.y, pr.r, pr.t, pr.kind);
    }
    for (const e of this.effects) {
      const k = 1 - e.life / e.max;
      const x = e.follow ? p.x : e.x;
      const y = e.follow ? p.y : e.y;
      ctx.save();
      switch (e.type) {
        case 'spin': {
          ctx.globalAlpha = 0.7 * (1 - k);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(x, y, e.r * (0.6 + k * 0.4), k * Math.PI * 4, k * Math.PI * 4 + Math.PI * 1.4);
          ctx.stroke();
          ctx.strokeStyle = '#c7b6ff';
          ctx.lineWidth = 5;
          ctx.stroke();
          break;
        }
        case 'trail': {
          ctx.globalAlpha = 0.5 * (1 - k);
          ctx.fillStyle = '#fff6a8';
          ctx.beginPath();
          ctx.ellipse(x - p.skillDashDir.x * 30, y - p.skillDashDir.y * 30, 34, 18, Math.atan2(p.skillDashDir.y, p.skillDashDir.x), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'smash': {
          ctx.globalAlpha = 0.8 * (1 - k);
          ctx.strokeStyle = '#ffd23f';
          ctx.lineWidth = 8 * (1 - k) + 2;
          ctx.beginPath();
          ctx.ellipse(x, y + 6, e.r * (0.3 + k), e.r * (0.3 + k) * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * e.r * k, y + Math.sin(a) * e.r * k * 0.6, 4 * (1 - k) + 1, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'ring': {
          ctx.globalAlpha = 0.8 * (1 - k);
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(x, y - 4, e.r * (0.5 + k), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'puff': {
          ctx.globalAlpha = 0.55 * (1 - k);
          ctx.fillStyle = e.color;
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const rr = e.r * (0.35 + k * 0.7);
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6, 12 * (1 - k * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = INK;
          ctx.globalAlpha = 0.3 * (1 - k);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y, e.r, e.r * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'meteor': {
          const fall = Math.max(0, 1 - k * 2.2);
          ctx.globalAlpha = 1 - Math.max(0, k - 0.5) * 2;
          ctx.font = '30px Jua, sans-serif';
          ctx.textAlign = 'center';
          ctx.lineWidth = 5;
          ctx.strokeStyle = INK;
          const yy = y - fall * 220;
          ctx.strokeText(e.glyph, x + fall * 60, yy);
          ctx.fillStyle = '#ffd23f';
          ctx.fillText(e.glyph, x + fall * 60, yy);
          if (fall <= 0) {
            ctx.strokeStyle = '#ffd23f';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(x, y + 6, 40 * (k + 0.2), 22 * (k + 0.2), 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }
        case 'art': {
          const h = e.h * (e.grow ? 0.7 + k * 0.5 : 1);
          assets.draw(ctx, e.key, x, y + (e.oy || 0), { height: h, center: true, rot: e.spin ? k * e.spin : 0, alpha: 1 - k * k, blend: 'lighter' });
          break;
        }
        case 'slash': {
          // 공격 궤적: 1타 파랑, 2타 주황(반대 방향), 3타 보라(크게)
          const len = e.step === 3 ? 150 : e.step === 2 ? 118 : 104;
          const fade = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6;
          const sweep = (e.flip ? -1 : 1) * (k - 0.5) * 0.9;
          const ox = x + Math.cos(e.a) * (e.step === 3 ? 34 : 26);
          const oy = y - 14 + Math.sin(e.a) * (e.step === 3 ? 26 : 20);
          // 새 검 궤적 (4프레임): 1타 파랑 · 2타 빨강 · 3타 금빛 묵직한 베기
          const sheet = e.step === 3 ? 'vfx2/slash_gold_heavy' : e.step === 2 ? 'vfx2/slash_red_fast' : 'vfx2/slash_blue_fast';
          if (drawSheet(ctx, sheet, x + Math.cos(e.a) * len * 0.28, y - 14 + Math.sin(e.a) * len * 0.22, k, len * (e.step === 3 ? 1.25 : 1.05), e.a, fade, e.flip)) break;
          const ok = assets.draw(ctx, `effects/${e.fx}`, ox, oy, {
            height: len, center: true, rot: e.a + sweep, sy: e.flip ? -1 : 1, alpha: fade * 0.95, blend: 'lighter',
          });
          if (!ok) {
            ctx.globalAlpha = 0.8 * fade;
            ctx.strokeStyle = e.step === 3 ? '#d6a2ff' : e.step === 2 ? '#ffb35c' : '#9fdcff';
            ctx.lineWidth = e.step === 3 ? 14 : 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const r0 = len * 0.42;
            ctx.arc(x, y - 14, r0, e.a - 1.1 + sweep, e.a + 1.1 + sweep);
            ctx.stroke();
          }
          break;
        }
        case 'particles': {
          drawParticles(ctx, e);
          break;
        }
        case 'impact': {
          const sz = (e.big ? 92 : 62) * (0.6 + k * 0.7);
          // 새 타격 효과 (4프레임): 일반 / 치명타
          if (drawSheet(ctx, e.big ? 'vfx2/impact_critical' : 'vfx2/impact_hit', x, y, k, e.big ? 150 : 100, e.a || 0, 1)) break;
          const ok = assets.draw(ctx, e.big ? 'effects/burst_orange' : 'effects/burst_blue', x, y, { height: sz, center: true, rot: e.a, alpha: 1 - k, blend: 'lighter' });
          if (!ok) {
            ctx.globalAlpha = 1 - k;
            ctx.fillStyle = '#fff6c8';
            ctx.beginPath();
            ctx.arc(x, y, sz * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'poof': {
          ctx.globalAlpha = 0.8 * (1 - k);
          if (!assets.draw(ctx, 'effects/dust_cloud', x, y + 6, { height: e.r * (1 + k), center: true, alpha: 0.9 * (1 - k) })) {
            ctx.fillStyle = '#e8e2d0';
            for (let i = 0; i < 7; i++) {
              const a = (i / 7) * Math.PI * 2;
              ctx.beginPath();
              ctx.arc(x + Math.cos(a) * e.r * k, y + Math.sin(a) * e.r * k * 0.5, 10 * (1 - k) + 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        }
        case 'dust': {
          if (!assets.draw(ctx, 'effects/dust_cloud', x, y, { height: e.r * 1.1 * (0.7 + k * 0.5), center: true, alpha: 0.85 * (1 - k) })) {
            ctx.globalAlpha = 0.5 * (1 - k);
            ctx.strokeStyle = '#c9a27a';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.ellipse(x, y, e.r * (0.5 + k * 0.6), e.r * (0.5 + k * 0.6) * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }
        case 'warn': {
          // 바닥 위험 표시: 붉은 원이 차오름
          const kk = 1 - e.life / e.max;
          if (!assets.draw(ctx, 'effects/aoe_red', x, y - e.r * 0.12, { height: e.r * 1.35, center: true, alpha: 0.35 + kk * 0.45 })) {
            ctx.globalAlpha = 0.2 + kk * 0.35;
            ctx.fillStyle = '#ff4d64';
            ctx.beginPath();
            ctx.ellipse(x, y, e.r, e.r * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = '#ffdede';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(x, y, e.r * kk, e.r * kk * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'blast': {
          if (!assets.draw(ctx, 'effects/burst_gold_big', x, y - e.r * 0.3, { height: e.r * 1.7 * (0.7 + k * 0.4), center: true, alpha: 1 - k, blend: 'lighter' })) {
            ctx.globalAlpha = 0.7 * (1 - k);
            ctx.fillStyle = '#ffb35c';
            ctx.beginPath();
            ctx.ellipse(x, y, e.r * (0.6 + k * 0.4), e.r * (0.6 + k * 0.4) * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'claw': {
          ctx.globalAlpha = 0.9 * (1 - k);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          for (let i = -1; i <= 1; i++) {
            const a = e.a + i * 0.35;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a - 1.2) * 18, y + Math.sin(a - 1.2) * 18 + i * 6);
            ctx.lineTo(x + Math.cos(a + 1.2) * 18, y + Math.sin(a + 1.2) * 18 + i * 6);
            ctx.stroke();
          }
          break;
        }
        case 'spark': {
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = e.color || '#ffffff';
          ctx.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + 0.6;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6);
            ctx.lineTo(x + Math.cos(a) * (12 + k * 10), y + Math.sin(a) * (12 + k * 10));
            ctx.stroke();
          }
          break;
        }
        default:
          break;
      }
      ctx.restore();
    }
  }

  reset() {
    this.effects = [];
    this.projectiles = [];
    this.dash = null;
  }
}

// 투사체 그림 (에셋이 있으면 그림, 없으면 false)
function drawArtProjectile(ctx, pr) {
  const a = Math.atan2(pr.vy, pr.vx);
  switch (pr.art) {
    case 'comet_blue':
    case 'comet_purple':
      return assets.draw(ctx, `effects/${pr.art}`, pr.x, pr.y, { height: 34, center: true, rot: a, blend: 'lighter' });
    case 'fire':
      return assets.draw(ctx, 'effects/burst_orange', pr.x, pr.y, { height: 34, center: true, rot: pr.t * 9, blend: 'lighter' });
    case 'crystal':
      return assets.draw(ctx, 'effects/burst_blue', pr.x, pr.y, { height: 30, center: true, rot: pr.t * 7, blend: 'lighter' });
    case 'arrow': {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(a);
      ctx.strokeStyle = '#3b2a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.fillStyle = '#d9dde6';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(8, -5);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7fd36b';
      ctx.fillRect(-18, -4, 6, 8);
      ctx.restore();
      return true;
    }
    case 'bubble':
    case 'spore':
    case 'leaf': {
      const col = pr.art === 'bubble' ? ['rgba(160,220,255,0.75)', '#e8f7ff'] : pr.art === 'spore' ? ['rgba(190,120,240,0.8)', '#f1dcff'] : ['rgba(110,200,90,0.85)', '#e2ffd0'];
      ctx.save();
      ctx.fillStyle = col[0];
      ctx.strokeStyle = col[1];
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (pr.art === 'leaf') ctx.ellipse(pr.x, pr.y, 11, 6, a + Math.sin(pr.t * 12) * 0.4, 0, Math.PI * 2);
      else ctx.arc(pr.x, pr.y, pr.r + Math.sin(pr.t * 10) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return true;
    }
    default:
      return false;
  }
}
