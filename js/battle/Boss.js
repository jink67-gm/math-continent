// 보스: 나눗셈 트롤 (예전 이름 '역수 트롤' — 저장 데이터의 id는 reciprocalTroll 그대로)
// 패턴 — 내려찍기(원형 충격파) / 돌진 / 바위 던지기(2페이즈~) / 뒤집기 저주(3페이즈: 방향이 반대로!)
// HP가 66%, 33%가 되면 「수학의 봉인」: 보호막을 두르고 멈춤 → 수학 문제 1개 → 정답이면 보호막이 깨지고 3초 기절

import { BOSS_SPRITES } from '../render/bossSprites.js';
import { BOSS_LOOKS } from '../data/monsterLooks.js';
import { assets } from '../render/AssetManager.js';
import { rand, pick } from '../core/utils.js';

// 보스 데이터에 patterns가 없으면 나눗셈 트롤 패턴을 써요
const DEFAULT_PATTERNS = {
  1: ['smash', 'charge', 'smash'],
  2: ['smash', 'charge', 'rocks'],
  3: ['smash', 'charge', 'rocks', 'flip'],
};
const WINDUP = { smash: 0.9, charge: 0.75, rocks: 0.6, flip: 0.8, ring: 0.8, summon: 0.7, leap: 0.8, quake: 0.7 };
// 페이즈가 오를수록 새 패턴이 섞여요
const PHASE_EXTRA = { 1: [], 2: ['quake'], 3: ['leap', 'quake'] };
const SMASH_R = 150;

// 보스마다 다른 공격 준비 빛깔 (공격 범위 표시는 모두 같은 붉은색이라 위험 구역은 똑같이 알아볼 수 있어요)
const WINDUP_TINT = {
  fractionValley: '#ff6a3d', cubeCity: '#b47bff', decimalHarbor: '#3fc4ff',
  ratioKingdom: '#ffd23f', circleForest: '#4fe07f', solidPeaks: '#c8f1ff',
};

export class Boss {
  constructor(id, def, x, y) {
    this.id = id;
    this.type = id;
    this.def = def;
    this.boss = true;
    this.elite = true;
    this.strong = false;
    this.name = def.name;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.attack = def.attack;
    this.defense = def.defense;
    this.radius = def.radius;
    this.scale = 2.2;
    this.exp = def.exp;
    this.goldRange = def.gold;
    this.dropBonus = 1;
    this.zoneId = null;
    this.x = x;
    this.y = y;
    this.home = { x, y };
    this.t = 0;
    this.facing = 1;
    this.flash = 0;
    this.knock = { x: 0, y: 0 };
    this.state = 'intro';
    this.stateT = 0;
    this.attackCd = 1.5;
    this.pattern = null;
    this.target = { x, y };
    this.vx = 0;
    this.vy = 0;
    this.hitDone = false;
    this.sealsLeft = [...def.seals];
    this.sealsTotal = def.seals.length;
    this.shielded = false;
    this.sealPending = false;
    this.stunT = 0;
    this.dead = false;
    this.deathT = 0;
    this.moving = false;
    this.flipped = 0;
    this.minionsSpawned = false;
    this.look = BOSS_LOOKS[id] || null;
    this.lastPhase = 1;
    this.z = 0;
    this.attackPose = 0;
  }

  get removable() {
    return this.dead && this.deathT > 1.4;
  }

  get invulnerable() {
    return this.shielded || this.state === 'intro' || this.dead;
  }

  get phase() {
    const r = this.hp / this.maxHp;
    return r > 0.66 ? 1 : r > 0.33 ? 2 : 3;
  }

  get damageMult() {
    return this.stunT > 0 ? 1.3 : 1;
  }

  setState(s) {
    this.state = s;
    this.stateT = 0;
    if (s !== 'recover' && s !== 'charging' && s !== 'leaping') this.attackPose = 0; // 공격이 끝났거나 끊기면 공격 그림도 즉시 끝
  }

  takeHit(dmg, kx, ky) {
    if (this.invulnerable) return;
    // 기절한 동안 몰아쳐도 다음 페이즈를 통째로 건너뛰지는 못해요
    if (this.stunT > 0 && this.sealsLeft.length) {
      const floor = Math.ceil(this.maxHp * (this.sealsLeft[0] + 0.1));
      dmg = Math.max(0, Math.min(dmg, this.hp - floor));
    }
    this.hp -= dmg;
    this.flash = 0.1;
    this.knock.x += kx * 0.15;
    this.knock.y += ky * 0.15;
    // 수학의 봉인
    if (this.sealsLeft.length && this.hp / this.maxHp <= this.sealsLeft[0]) {
      this.hp = Math.max(this.hp, Math.ceil(this.maxHp * this.sealsLeft[0]));
      this.sealsLeft.shift();
      this.shielded = true;
      this.sealPending = true;
      this.stunT = 0;
      this.flipped = 0;
      this.attackPose = 0;
      this.setState('sealed');
      return;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.attackPose = 0;
      this.setState('dead');
    }
  }

  breakShield() {
    this.shielded = false;
    this.stunT = 3;
    this.flash = 0.3;
    this.setState('stunned');
  }

  update(dt, player, combat, bounds, world) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.attackPose = Math.max(0, this.attackPose - dt);
    if (this.dead) {
      this.deathT += dt;
      return;
    }
    this.stateT += dt;
    this.x += this.knock.x * dt;
    this.y += this.knock.y * dt;
    const f = Math.pow(0.01, dt);
    this.knock.x *= f;
    this.knock.y *= f;
    this.flipped = Math.max(0, this.flipped - dt * (this.state === 'flipping' ? 0 : 2));

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = this.def.speed * [1, 1, 1.15, 1.3][this.phase];
    this.moving = false;

    switch (this.state) {
      case 'intro':
        if (this.stateT > 1.6) this.setState('chase');
        break;
      case 'roar':
        // 페이즈 전환: 잠깐 포효 (이때는 공격하지 않아요)
        if (this.stateT >= 1.1) {
          this.setState('chase');
          this.attackCd = 0.6;
        }
        break;
      case 'leaping': {
        const T = 0.6;
        const k = Math.min(1, this.stateT / T);
        this.x = this.jumpFrom.x + (this.target.x - this.jumpFrom.x) * k;
        this.y = this.jumpFrom.y + (this.target.y - this.jumpFrom.y) * k;
        this.z = Math.sin(k * Math.PI) * 140;
        if (k >= 1) {
          this.z = 0;
          combat.bossSmash(this, 135, 1.35);
          this.recover();
        }
        break;
      }
      case 'chase': {
        if (this.phase > this.lastPhase) {
          this.lastPhase = this.phase;
          this.setState('roar');
          world.onBossPhase?.(this, this.phase);
          break;
        }
        if (Math.abs(dx) > 4) this.facing = dx > 0 ? 1 : -1;
        if (dist > 120 && !player.dead) {
          this.x += (dx / dist) * speed * dt;
          this.y += (dy / dist) * speed * dt;
          this.moving = true;
        }
        this.attackCd -= dt;
        if (this.attackCd <= 0 && !player.dead) {
          const base = (this.def.patterns || DEFAULT_PATTERNS)[this.phase] || DEFAULT_PATTERNS[1];
          this.pattern = pick([...base, ...PHASE_EXTRA[this.phase]]);
          if (this.pattern === 'charge' && dist < 140) this.pattern = 'smash';
          this.target = { x: player.x, y: player.y };
          this.setState('windup');
        }
        break;
      }
      case 'windup': {
        if (this.pattern === 'charge' || this.pattern === 'rocks' || (this.pattern === 'leap' && this.stateT < WINDUP.leap * 0.6)) this.target = { x: player.x, y: player.y };
        if (this.stateT >= WINDUP[this.pattern]) this.execute(player, combat, world);
        break;
      }
      case 'charging': {
        this.x += this.vx * 560 * dt;
        this.y += this.vy * 560 * dt;
        this.moving = true;
        if (!this.hitDone && Math.hypot(player.x - this.x, player.y - (this.y - 20)) < this.radius + 22) {
          this.hitDone = true;
          combat.monsterHits(this, 1.2);
        }
        if (this.stateT >= 0.6) this.recover();
        break;
      }
      case 'flipping': {
        this.flipped = Math.min(1, this.stateT * 2);
        if (!this.minionsSpawned && this.stateT > 0.5) {
          this.minionsSpawned = true;
          world.spawnMinion(this.def.minion || 'rockSlime', this.x - 90, this.y + 40);
          world.spawnMinion(this.def.minion || 'rockSlime', this.x + 90, this.y + 40);
          if (dist < 520) world.game.player.confuseT = 3;
          world.game.ui.toast('🔄 뒤집기 저주! 3초 동안 방향이 거꾸로!', 'warn', 2400);
        }
        if (this.stateT >= 1.3) this.recover();
        break;
      }
      case 'recover':
        if (this.stateT >= 0.6) {
          this.setState('chase');
          this.attackCd = rand(1.2, 2.0) / [1, 1, 1.15, 1.3][this.phase];
        }
        break;
      case 'sealed':
        break;
      case 'stunned':
        this.stunT -= dt;
        if (this.stunT <= 0) {
          this.stunT = 0;
          if (this.phase > this.lastPhase) {
            // 기절에서 깨어나며 페이즈 전환
            this.lastPhase = this.phase;
            this.setState('roar');
            world.onBossPhase?.(this, this.phase);
          } else {
            this.setState('chase');
            this.attackCd = 1;
          }
        }
        break;
      default:
        break;
    }

    if (bounds) {
      this.x = Math.max(bounds.x + 50, Math.min(bounds.x + bounds.w - 50, this.x));
      this.y = Math.max(bounds.y + 60, Math.min(bounds.y + bounds.h - 30, this.y));
    }
  }

  execute(player, combat, world) {
    if (this.dead || this.shielded) return;
    const p = this.pattern;
    if (p === 'smash') {
      combat.bossSmash(this, SMASH_R, 1.3);
      this.recover();
    } else if (p === 'charge') {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      this.vx = dx / d;
      this.vy = dy / d;
      this.facing = dx > 0 ? 1 : -1;
      this.hitDone = false;
      this.setState('charging');
      world.game.audio.playSfx('bossDash');
    } else if (p === 'rocks') {
      const base = Math.atan2(this.target.y - (this.y - 30), this.target.x - this.x);
      const n = this.phase >= 3 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.22;
        combat.spawnProjectile({ x: this.x, y: this.y - 40, vx: Math.cos(a) * 270, vy: Math.sin(a) * 270, r: 14, mult: 0.8, source: this, kind: this.def.projectile });
      }
      this.recover();
    } else if (p === 'ring') {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + this.t;
        combat.spawnProjectile({ x: this.x, y: this.y - 40, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, r: 12, mult: 0.7, source: this, kind: this.def.projectile });
      }
      world.shake(5);
      this.recover();
    } else if (p === 'summon') {
      const alive = world.monsters.filter((m) => m.zoneId === 'bossMinion' && !m.dead).length;
      if (alive < 4) {
        world.spawnMinion(this.def.minion || 'rockSlime', this.x - 100, this.y + 50);
        world.spawnMinion(this.def.minion || 'rockSlime', this.x + 100, this.y + 50);
      }
      world.game.audio.playSfx('summon');
      this.recover();
    } else if (p === 'flip') {
      this.minionsSpawned = false;
      this.setState('flipping');
    } else if (p === 'leap') {
      this.jumpFrom = { x: this.x, y: this.y };
      this.setState('leaping');
      world.game.audio.playSfx('jump');
    } else if (p === 'quake') {
      // 플레이어 주변에 위험 표시 여러 개 → 차례로 폭발
      const n = this.phase >= 3 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(0, 1);
        const r = i === 0 ? 0 : rand(70, 150);
        combat.delayedAoE(this, player.x + Math.cos(a) * r, player.y + Math.sin(a) * r * 0.7, 62, 0.8 + i * 0.12, 1.0);
      }
      world.game.audio.playSfx('aoe');
      this.recover();
    }
    this.attackPose = 0.45;
  }

  recover() {
    this.setState('recover');
  }

  draw(ctx, t) {
    const windup = this.state === 'windup' ? Math.min(1, this.stateT / WINDUP[this.pattern]) : 0;
    // 공격 예고
    if (windup > 0) {
      ctx.save();
      if (this.pattern === 'smash') {
        ctx.globalAlpha = 0.2 + windup * 0.35;
        ctx.fillStyle = '#ff5a6e';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 4, SMASH_R * windup, SMASH_R * windup * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ff5a6e';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 4, SMASH_R, SMASH_R * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.pattern === 'charge') {
        const a = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        ctx.translate(this.x, this.y);
        ctx.rotate(a);
        ctx.globalAlpha = 0.25 + windup * 0.35;
        ctx.fillStyle = '#ff5a6e';
        ctx.fillRect(0, -40, 340, 80);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ff5a6e';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(0, -40, 340, 80);
      } else if (this.pattern === 'leap') {
        ctx.globalAlpha = 0.2 + windup * 0.35;
        ctx.fillStyle = '#ff5a6e';
        ctx.beginPath();
        ctx.ellipse(this.target.x, this.target.y + 4, 135 * windup, 135 * windup * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ff5a6e';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.ellipse(this.target.x, this.target.y + 4, 135, 81, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.pattern === 'quake') {
        ctx.globalAlpha = 0.25 + windup * 0.4;
        ctx.strokeStyle = '#ffb35c';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 4, 80 + windup * 60, (80 + windup * 60) * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.pattern === 'ring' || this.pattern === 'summon') {
        ctx.globalAlpha = 0.25 + windup * 0.4;
        ctx.strokeStyle = this.pattern === 'ring' ? '#ff5a6e' : '#c7b6ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 40, 60 + windup * 60, 40 + windup * 40, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.pattern === 'rocks') {
        const base = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#ff5a6e';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 10]);
        for (let i = -2; i <= 2; i++) {
          if (this.pattern !== 'rocks') break;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 30);
          ctx.lineTo(this.x + Math.cos(base + i * 0.22) * 260, this.y - 30 + Math.sin(base + i * 0.22) * 260);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    ctx.save();
    if (this.dead) {
      const p = Math.min(1, this.deathT / 1.4);
      ctx.globalAlpha = 1 - p;
      ctx.translate(this.x, this.y);
      ctx.scale(1 + p * 0.3, 1 - p * 0.5);
      ctx.translate(-this.x, -this.y);
    }
    if (this.drawArt(ctx, windup)) {
      ctx.restore();
      return;
    }
    (BOSS_SPRITES[this.def.sprite] || BOSS_SPRITES.troll)(ctx, this.x, this.y, {
      color: this.def.color,
      t: this.t,
      facing: this.facing,
      flash: this.flash,
      flipped: this.flipped,
      windup,
      moving: this.moving,
      shielded: this.shielded,
      stunned: this.stunT > 0,
      raise: this.pattern === 'smash' && this.state === 'windup' ? windup : 0,
    });
    ctx.restore();
  }

  // 보스 그림 (에셋이 있으면)
  drawArt(ctx, windup) {
    const L = this.look;
    if (!L) return false;
    // 공격 그림(무기를 휘두르는 장면·불꽃 포함)은 "실제로 공격하는 순간"에만:
    //  - execute() 직후 0.45초(attackPose) · 돌진 중 · 점프 착지 직전
    //  - 대기·추적·공격 준비(windup)·포효·기절·봉인 중에는 기본 자세 (예전에는 준비 단계와 포효 때도 공격 그림이 나왔어요)
    const pose = !this.dead && (this.attackPose > 0 || this.state === 'charging' || (this.state === 'leaping' && this.stateT > 0.35));
    const idle = assets.get(`${L.art}_idle`);
    const key = `${L.art}_${pose ? 'attack' : 'idle'}`;
    if (!idle || !assets.get(key)) return false;
    const s = L.size / Math.max(idle.m.w, idle.m.h);
    const flipX = this.facing !== (L.face || 1);
    const fly = L.flyH ? L.flyH + Math.sin(this.t * 2.5) * 6 : 0;
    const footY = this.y + this.radius * 0.5 - fly - this.z;
    // 그림자
    ctx.fillStyle = 'rgba(10, 8, 20, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.5, this.radius * 1.6 * (1 - this.z / 300), this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 페이즈 오라
    if (this.phase >= 2) {
      const g = ctx.createRadialGradient(this.x, this.y - 40, 10, this.x, this.y - 40, this.radius * 3);
      const c = this.phase >= 3 ? '255,70,90' : '255,170,60';
      g.addColorStop(0, `rgba(${c},${0.3 + Math.sin(this.t * 5) * 0.08})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 40, this.radius * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    let sx = 1;
    let sy = 1 + Math.sin(this.t * 2.2) * 0.02;
    let ox = 0;
    // 공격 준비: 몸을 웅크리며 떨고, 붉게 달아오름 (플레이어가 보고 피할 수 있게)
    let tint = null, tintA = 0;
    if (windup > 0) {
      sy = 1 - windup * 0.1; sx = 1 + windup * 0.06; ox = Math.sin(this.t * 50) * windup * 2.5;
      tint = WINDUP_TINT[this.def.village] || '#ff4d4d'; tintA = windup * (0.25 + Math.abs(Math.sin(this.t * 12)) * 0.2);
    }
    if (this.state === 'roar') { sx = 1.06 + Math.sin(this.t * 30) * 0.02; sy = 1.06; ox = Math.sin(this.t * 70) * 3; }
    // 맞았을 때: 살짝 뒤로 젖혀짐
    if (this.flash > 0 && !this.shielded) { sx *= 1.04; sy *= 0.96; ox += -this.facing * 4; }
    const stunned = this.stunT > 0;
    if (stunned) ctx.globalAlpha *= 0.92;
    assets.draw(ctx, key, this.x + ox, footY, { scale: s, flipX, sx, sy, rot: stunned ? Math.sin(this.t * 6) * 0.05 : 0, flash: this.flash > 0 ? this.flash / 0.1 : 0, tint, tintA });
    if (this.shielded) {
      assets.draw(ctx, 'effects/shield_bubble', this.x, footY - L.size * 0.32, { height: L.size * 0.95, center: true, alpha: 0.55 + Math.sin(this.t * 6) * 0.1 });
    }
    if (stunned) {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < 4; i++) {
        const a = this.t * 4 + (i / 4) * Math.PI * 2;
        ctx.fillText('⭐', this.x + Math.cos(a) * 46, footY - L.size * 0.62 + Math.sin(a) * 12);
      }
    }
    return true;
  }
}
