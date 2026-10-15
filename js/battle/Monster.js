// 몬스터 한 마리 — 상태 기반 AI
// IDLE(돌아다님) → NOTICE(발견 "!") → CHASE(거리 조절) → WINDUP(공격 예고) → ATTACK → RECOVER(빈틈) → CHASE …
//   HIT(맞아서 휘청) · DODGE(회피) · SPECIAL(엘리트 특수 패턴) · RETURN(너무 멀리 끌려가면 돌아가며 회복) · DEAD
//
// 전투 방식(ai)은 js/data/monsterLooks.js 에서 몬스터마다 정해요.
// 동시에 공격하는 몬스터 수를 제한해서(공격권) 여러 마리에게 한꺼번에 맞지 않도록 했어요.

import { STRONG_VARIANT } from '../data/monsters.js';
import { lookFor } from '../data/monsterLooks.js';
import { MONSTER_SPRITES, drawCrown } from '../render/monsterSprites.js';
import { INK, roundRect } from '../render/sprites.js';
import { assets } from '../render/AssetManager.js';
import { rand } from '../core/utils.js';
import { animTransform, trackTrail, DEATH_TIME } from '../render/MonsterAnimation.js';

const LEASH = 460;

// 전투 방식별 기본 값
const AI = {
  melee:  { engage: 1.0, windup: 0.55, recover: 0.6 },
  charge: { engage: 1.0, windup: 0.75, recover: 0.55, missRecover: 1.15 },
  ranged: { engage: 1.0, windup: 0.6, recover: 0.5 },
  burst:  { engage: 1.0, windup: 0.6, recover: 0.6 },
  fan:    { engage: 1.0, windup: 0.7, recover: 0.6 },
  aoe:    { engage: 1.0, windup: 0.8, recover: 0.6 },
  jump:   { engage: 1.0, windup: 0.6, recover: 0.65 },
  guard:  { engage: 1.0, windup: 0.6, recover: 0.75 },
  summon: { engage: 1.0, windup: 0.8, recover: 0.8 },
};

const SHOT_SPEED = { arrow: 340, fire: 250, bubble: 230, crystal: 290, comet_blue: 280, comet_purple: 260, spore: 200, leaf: 270 };

// 공격 동작 프레임: 1 대기 → 2 준비 → 3 공격 → 4 회복
// - 14종: 잔여 에셋 동작팩 v3 (pack4/mattack)
// - 슬라임 3종·버섯의 3번: 핵심 에셋 v4 개선판 (pack5/mattack/*_3_clean — 검은 배경 잔여·발 아래 반사선 정리)
// - 스켈레톤·불 정령: 핵심 에셋 v4 4프레임 (pack5/mattack). 대기 그림(monsters3)과 디자인이 달라서
//   공격할 때만 바뀌면 어색하므로, 대기 모습도 v4 1번 프레임을 써요.
// ATK_FACE: 3번(공격) 프레임에서 몬스터가 보는 방향(1 오른쪽, 0 정면). 1·2·4번은 대기 그림과 같은 방향(face3)
const ATK_FACE = {
  slime_green: 1, slime_blue: 1, slime_red: 1, mushroom: 1, treant: 0, flower: 0, wolf: 1, boar: 1,
  bat: 1, spider: 1, goblin_warrior: 1, orc: 1, stone_golem: 1, ice_spirit: 1,
};
const RECOVER_HOLD = 0.28;
// 3번(공격) 프레임은 원본에서 몸이 작게 그려진 몬스터가 있어요(몸 넓이를 1번과 비교해 잼).
// 발 위치(기준점)는 그대로 두고 몸 크기만 1번과 같아지도록 키워요. 너무 크게 바꾸지 않게 최대 1.35배.
const ATK3_FIX = { wolf: 1.19, bat: 1.16, spider: 1.15, ice_spirit: 1.27 };
// 공격 프레임 1(대기 자세)의 몸 크기를 기존 대기 그림 몸 크기에 맞추는 배율 (그림 불투명 영역으로 계산)
const ATK_SCALE = { slime_green: 1.071, slime_blue: 1.134, slime_red: 0.959, mushroom: 1.093, treant: 1.365, flower: 1.167, wolf: 1.093, boar: 1.134, bat: 1.286, spider: 1.469, goblin_warrior: 1.312, orc: 1.474, stone_golem: 1.469, ice_spirit: 1.381 };
// v4 공격 3번: 1번 프레임 몸통(효과 제외)과 같은 크기가 되는 배율 — 몸 색 영역(슬라임 몸·버섯 갓)의 크기를 재서 정함.
// 기준점은 몸통 아래 가운데(효과가 오른쪽으로 뻗어도 몸은 제자리)
const V4_F3 = { slime_green: 1.26, slime_blue: 1.14, slime_red: 1.32, mushroom: 1.15, boar: 0.85 };
// v4 4프레임 몬스터: k = 대기 그림 높이 ÷ v4 1번 몸 높이, face = 각 프레임이 보는 방향
const V4_FULL = {
  skeleton: { k: 0.70, face: [1, 1, 1, 1] },
  fire_spirit: { k: 0.8, face: [0, 0, 1, 0] },
};
function attackFrame(m, art3) {
  const name = art3.split('/').pop();
  const full = V4_FULL[name];
  if (!(name in ATK_FACE) && !full) return null;
  let i = 0;
  if (!m.dead) {
    if (m.state === 'windup') i = m.stateT < m.windupTime * 0.5 ? 1 : 2;
    else if (m.state === 'attack') i = 3;
    else if (m.state === 'recover' && m.stateT < RECOVER_HOLD) i = 4;
  }
  if (full) {
    const key = `pack5/mattack/${name}_${i || 1}`;
    const img = assets.get(key);
    if (!img) return null;
    return { key, img, face: full.face[(i || 1) - 1], k: full.k, full: true, i };
  }
  if (!i) return null;
  let key = `pack4/mattack/${name}_${i}`;
  let k = (ATK_SCALE[name] || 1) * (i === 3 ? ATK3_FIX[name] || 1 : 1);
  if (i === 3 && V4_F3[name] && assets.get(`pack5/mattack/${name}_3_clean`)) {
    key = `pack5/mattack/${name}_3_clean`;
    k = (ATK_SCALE[name] || 1) * V4_F3[name];
  }
  const img = assets.get(key);
  if (!img) return null;
  return { key, img, face: i === 3 ? ATK_FACE[name] : 0, k, i };
}

// 원본 공격 프레임이 대기 그림과 같은 몬스터 → 기존 효과 그림(vfx2 · effects)으로 공격 순간만 보완
const NO_ATK_FRAME = { skeleton: 'slash', fire_spirit: 'fire' }; // v4 프레임을 못 불러왔을 때만 쓰는 보완 효과
function fxSheet(ctx, key, x, y, k, size, rot, flip) {
  const a = assets.get(key);
  if (!a) return;
  const fw = a.m.w / 4, fi = Math.min(3, Math.floor(k * 4));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(a.img, fi * fw, 0, fw, a.m.h, -size / 2, -size / 2, size, size);
  ctx.restore();
}
function drawNoFrameFx(ctx, m, kind, cy) {
  if (m.state !== 'attack') return;
  const k = Math.min(0.999, m.stateT / 0.22);
  const f = m.facing || 1;
  if (kind === 'slash') fxSheet(ctx, 'vfx2/slash_red_fast', m.x + f * 26, cy, k, 92, 0, f < 0);
  else if (kind === 'fire') {
    ctx.save(); ctx.globalAlpha = 0.85 * (1 - k);
    assets.draw(ctx, 'effects/burst_orange', m.x + f * (18 + 14 * k), cy + 2, { height: 40 + 26 * k, center: true, blend: 'lighter' });
    ctx.restore();
  }
}

export class Monster {
  constructor(type, def, x, y, { strong = false, zoneId = null } = {}) {
    this.type = type;
    this.def = def;
    this.look = lookFor(type, def);
    this.ai = this.look.ai;
    this.zoneId = zoneId;
    this.elite = def.tier === 'elite';
    this.strong = strong && !this.elite;
    const m = this.strong ? STRONG_VARIANT : { hp: 1, attack: 1, exp: 1, gold: 1, dropBonus: 1 };
    this.name = this.strong ? `${STRONG_VARIANT.prefix} ${def.name}` : def.name;
    this.maxHp = Math.round(def.hp * m.hp);
    this.hp = this.maxHp;
    this.attack = Math.round(def.attack * m.attack);
    this.defense = def.defense || 0;
    this.exp = Math.round(def.exp * m.exp);
    this.goldRange = def.gold.map((g) => Math.round(g * m.gold));
    this.dropBonus = m.dropBonus;
    this.scale = (def.scale || 1) * (this.strong ? 1.15 : 1);
    this.radius = def.radius * (this.strong ? 1.1 : 1);

    this.x = x;
    this.y = y;
    this.home = { x, y };
    this.wanderTarget = null;
    this.wanderT = rand(0.5, 2.5);
    this.state = 'idle';
    this.stateT = 0;
    this.cd = rand(0.6, 1.4);
    this.t = rand(0, 10);
    this.vx = 0;
    this.vy = 0;
    this.knock = { x: 0, y: 0 };
    this.flash = 0;
    this.faceA = Math.random() < 0.5 ? 0 : Math.PI; // 보는 방향(각도)
    this.dead = false;
    this.deathT = 0;
    this.hitDone = false;
    this.moving = false;
    this.showHpT = 0;
    this.token = false;      // 공격권
    this.poise = this.elite ? 3 : 1; // 엘리트는 여러 번 맞아야 휘청
    this.dodgeCd = 0;
    this.attackCount = 0;
    this.strafe = Math.random() < 0.5 ? 1 : -1;
    this.lock = null;        // 공격 예고 때 고정한 위치/방향
    this.z = 0;              // 점프 높이
    this.shots = 0;
    this.blockFx = 0;
    this.currentAttack = this.ai;
  }

  get facing() {
    return Math.cos(this.faceA) >= 0 ? 1 : -1;
  }

  get removable() {
    return this.dead && this.deathT >= DEATH_TIME;
  }

  get invulnerable() {
    return this.dead || this.state === 'dodge';
  }

  get damageMult() {
    return this.state === 'recover' && this.missed ? 1.3 : 1;
  }

  // 정면 방어: 공격이 온 방향이 몬스터가 보는 쪽이면 피해 감소
  guardFactor(fromX, fromY) {
    const guardy = this.ai === 'guard' || this.look.guardFront;
    if (!guardy || this.dead) return 1;
    if (this.state === 'recover' || this.state === 'hit' || this.state === 'attack') return 1;
    const a = Math.atan2(fromY - this.y, fromX - this.x);
    const diff = Math.abs(Math.atan2(Math.sin(a - this.faceA), Math.cos(a - this.faceA)));
    return diff < 1.05 ? 0.25 : 1;
  }

  takeHit(dmg, kx, ky, { heavy = false, blocked = false } = {}) {
    if (this.dead) return;
    this.hp -= dmg;
    this.flash = 0.14;
    this.showHpT = 4;
    this.knock.x += kx;
    this.knock.y += ky;
    if (this.state === 'idle' || this.state === 'return' || this.state === 'notice') this.setState('chase');
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.releaseToken();
      return;
    }
    // 휘청: 공격 예고 초반이나 평소에 맞으면 끊김. 공격 중이거나 예고가 거의 끝났으면 버팀(슈퍼아머)
    if (blocked) return; // 방패로 막은 공격에는 휘청이지 않아요
    this.poise -= heavy ? 2 : 1;
    const armored = this.state === 'attack' || this.state === 'dodge'
      || (this.state === 'windup' && this.stateT > this.windupTime * 0.55);
    if (this.poise <= 0 && !armored) {
      this.poise = this.elite ? 3 : 1;
      this.z = 0;
      this.setState('hit');
    }
  }

  setState(s) {
    this.state = s;
    this.stateT = 0;
  }

  releaseToken() {
    if (this.token && this.world) this.world.attackTokens = Math.max(0, this.world.attackTokens - 1);
    this.token = false;
  }

  tryToken(world) {
    if (this.token) return true;
    if (this.elite || this.zoneId === 'bossMinion') return true;
    if (world.attackTokens >= 2) return false;
    world.attackTokens += 1;
    this.token = true;
    return true;
  }

  turnToward(tx, ty, rate, dt) {
    const a = Math.atan2(ty - this.y, tx - this.x);
    let d = Math.atan2(Math.sin(a - this.faceA), Math.cos(a - this.faceA));
    const step = rate * dt;
    if (Math.abs(d) < step) d = d > 0 ? Math.abs(d) : -Math.abs(d);
    else d = Math.sign(d) * step;
    this.faceA += d;
  }

  moveToward(tx, ty, speed, dt, stopDist = 0) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d <= stopDist || d < 1) {
      this.moving = false;
      return d;
    }
    const step = Math.min(d - stopDist, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.moving = true;
    return d;
  }

  // 플레이어가 휘두르기 시작했을 때 (회피형만)
  onPlayerAttackStart(player) {
    const chance = this.ai === 'dodge' ? 0.5 : (this.look.dodge || 0);
    if (!chance || this.dead || this.dodgeCd > 0) return;
    if (!['chase', 'recover', 'idle', 'notice'].includes(this.state)) return;
    const d = Math.hypot(player.x - this.x, player.y - this.y);
    if (d > 120 || Math.random() > chance) return;
    // 옆이나 뒤로 휙
    const a = Math.atan2(this.y - player.y, this.x - player.x) + (Math.random() < 0.5 ? 1 : -1) * rand(0.6, 1.2);
    this.vx = Math.cos(a);
    this.vy = Math.sin(a);
    this.dodgeCd = 2.4;
    this.setState('dodge');
    this.world?.game.audio.playSfx('dodgeMiss');
  }

  get windupTime() {
    const base = AI[this.currentAttack]?.windup ?? 0.6;
    return Math.max(0.35, (this.def.windup ? (this.def.windup + base) / 2 : base) * (this.elite ? 1.1 : 1));
  }

  // 전투 거리: 이 거리까지 다가가서 공격해요
  engageRange() {
    const d = this.def;
    switch (this.ai) {
      case 'ranged': case 'burst': case 'fan': return d.keepDistance || 200;
      case 'charge': return 190;
      case 'jump': return 135;
      case 'aoe': return this.look.target === 'player' ? 210 : (d.puffRadius || 80) * 0.6;
      case 'summon': return 220;
      default: return Math.max(46, (d.attackRange || 70) * 0.6) + this.radius * 0.4;
    }
  }

  update(dt, player, combat, bounds, world) {
    this.world = world;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.hitT = Math.max(0, (this.hitT || 0) - dt);
    this.showHpT = Math.max(0, this.showHpT - dt);
    this.blockFx = Math.max(0, this.blockFx - dt);
    if (this.dead) {
      this.deathT += dt;
      return;
    }
    this.stateT += dt;
    this.cd = Math.max(0, this.cd - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);

    // 밀려남
    this.x += this.knock.x * dt;
    this.y += this.knock.y * dt;
    const f = Math.pow(0.004, dt);
    this.knock.x *= f;
    this.knock.y *= f;

    const def = this.def;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const homeDist = Math.hypot(this.x - this.home.x, this.y - this.home.y);
    const canSee = !player.dead && dist < def.aggro;
    const turnRate = this.ai === 'guard' ? 2.2 : 9;
    this.moving = false;

    switch (this.state) {
      case 'idle': {
        this.wanderT -= dt;
        if (!this.wanderTarget || this.wanderT <= 0) {
          this.wanderTarget = { x: this.home.x + rand(-90, 90), y: this.home.y + rand(-70, 70) };
          this.wanderT = rand(2, 4.5);
        }
        if (this.moveToward(this.wanderTarget.x, this.wanderTarget.y, def.speed * 0.4, dt, 4) > 4) {
          this.turnToward(this.wanderTarget.x, this.wanderTarget.y, 6, dt);
        }
        if (canSee) {
          this.setState('notice');
          if (this.elite) world.game.audio.playSfx('eliteAppear');
        }
        break;
      }
      case 'notice': {
        // 플레이어를 발견하고 잠깐 관찰
        this.turnToward(player.x, player.y, 10, dt);
        if (this.stateT > (this.elite ? 0.5 : 0.32)) this.setState('chase');
        break;
      }
      case 'chase': {
        if (player.dead || homeDist > LEASH || dist > def.aggro * 1.8) {
          this.releaseToken();
          this.setState('return');
          break;
        }
        this.turnToward(player.x, player.y, turnRate, dt);
        this.chaseMove(dt, player, dist, dx, dy);
        const reach = this.engageRange();
        const inRange = this.ai === 'melee' || this.ai === 'guard'
          ? dist <= reach + 8
          : dist <= reach * 1.35 && dist >= reach * 0.45;
        if (inRange && this.cd <= 0 && this.tryToken(world)) this.beginWindup(player);
        break;
      }
      case 'windup': {
        // 예고하는 동안: 방향을 천천히 맞춤 (돌진·근접은 고정)
        if (!['charge', 'melee', 'jump'].includes(this.currentAttack)) this.turnToward(player.x, player.y, 3, dt);
        if (this.currentAttack === 'jump' && this.stateT < this.windupTime * 0.6) this.lock = { x: player.x, y: player.y };
        if (this.stateT >= this.windupTime) this.startAttack(player, combat, world);
        break;
      }
      case 'attack':
        this.updateAttack(dt, player, combat, world);
        break;
      case 'recover': {
        // 빈틈: 방향도 바꾸지 않아요 (뒤로 돌아가 공격할 기회)
        if (this.stateT >= this.recoverTime) {
          this.releaseToken();
          this.missed = false;
          this.cd = (def.cooldown || 1.8) * rand(0.7, 1.1);
          this.setState('chase');
        }
        break;
      }
      case 'hit': {
        if (this.stateT >= 0.24) {
          this.releaseToken();
          this.setState('chase');
          this.cd = Math.max(this.cd, 0.35);
        }
        break;
      }
      case 'dodge': {
        this.x += this.vx * 380 * dt;
        this.y += this.vy * 380 * dt;
        this.moving = true;
        if (this.stateT >= 0.2) this.setState('chase');
        break;
      }
      case 'return': {
        const d = this.moveToward(this.home.x, this.home.y, def.speed * 1.2, dt, 6);
        this.turnToward(this.home.x, this.home.y, 8, dt);
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.25 * dt);
        if (d <= 8) this.setState('idle');
        else if (canSee && homeDist < LEASH * 0.6) this.setState('chase');
        break;
      }
      default:
        break;
    }

    if (bounds) {
      this.x = Math.max(bounds.x + 20, Math.min(bounds.x + bounds.w - 20, this.x));
      this.y = Math.max(bounds.y + 20, Math.min(bounds.y + bounds.h - 20, this.y));
    }
  }

  // 전투 방식별 거리 조절
  chaseMove(dt, player, dist, dx, dy) {
    const def = this.def;
    const reach = this.engageRange();
    const ranged = ['ranged', 'burst', 'fan'].includes(this.ai) || (this.ai === 'aoe' && this.look.target === 'player') || this.ai === 'summon';
    // 공격권이 다 찼으면(이미 2마리가 공격 중) 주변을 맴돌며 차례를 기다림
    const waiting = !this.token && !this.elite && this.zoneId !== 'bossMinion' && this.cd <= 0 && (this.world?.attackTokens || 0) >= 2;
    if (ranged) {
      if (dist < reach * 0.6) {
        // 가까워지면 뒤로 물러나요
        this.x -= (dx / dist) * def.speed * 0.95 * dt;
        this.y -= (dy / dist) * def.speed * 0.95 * dt;
        this.moving = true;
      } else if (dist > reach * 1.15) {
        this.moveToward(player.x, player.y, def.speed, dt, reach);
      } else {
        this.circle(dt, player, dist, def.speed * 0.45);
      }
      return;
    }
    if (waiting && dist < reach + 70) {
      this.circle(dt, player, dist, def.speed * 0.55, reach + 50);
      return;
    }
    const sp = this.ai === 'guard' ? def.speed * 0.75 : def.speed;
    this.moveToward(player.x, player.y, sp, dt, Math.max(0, reach - 6));
    if (this.ai === 'charge' && dist < reach * 0.6) {
      // 너무 붙으면 돌진 거리 확보
      this.x -= (dx / dist) * def.speed * 0.6 * dt;
      this.y -= (dy / dist) * def.speed * 0.6 * dt;
    }
  }

  circle(dt, player, dist, speed, keep = dist) {
    const a = Math.atan2(this.y - player.y, this.x - player.x) + (this.strafe * speed * dt) / Math.max(60, dist);
    const r = dist + (keep - dist) * Math.min(1, dt * 2);
    this.x = player.x + Math.cos(a) * r;
    this.y = player.y + Math.sin(a) * r;
    this.moving = true;
    if (Math.random() < dt * 0.3) this.strafe *= -1;
  }

  beginWindup(player) {
    this.attackCount += 1;
    // 엘리트: 3번에 한 번 특수 패턴 / 일부 몬스터는 보조 패턴
    const sp = this.look.special && this.attackCount % 3 === 0 ? this.look.special
      : this.look.special2 && this.attackCount % 2 === 0 ? this.look.special2 : null;
    this.currentAttack = sp ? (sp === 'ring' ? 'ring' : sp) : this.ai;
    if (this.currentAttack === 'guard') this.currentAttack = 'melee';
    const ang = Math.atan2(player.y - this.y, player.x - this.x);
    this.lock = { x: player.x, y: player.y, a: ang };
    if (this.currentAttack === 'melee' || this.currentAttack === 'charge') this.faceA = ang;
    this.setState('windup');
    // 바닥 경고형은 경고음, 나머지는 공격 준비음
    const isWarn = this.currentAttack === 'aoe' && this.look.target === 'player';
    this.world?.game.audio.playSfx(isWarn ? 'aoe' : this.elite ? 'eliteWindup' : 'windup');
  }

  get recoverTime() {
    const a = AI[this.currentAttack] || AI.melee;
    return (this.missed && a.missRecover ? a.missRecover : a.recover) * (this.elite ? 0.85 : 1);
  }

  startAttack(player, combat, world) {
    this.setState('attack');
    this.hitDone = false;
    this.shots = 0;
    const L = this.lock || { x: player.x, y: player.y, a: Math.atan2(player.y - this.y, player.x - this.x) };
    const audio = world.game.audio;
    switch (this.currentAttack) {
      case 'charge':
        this.vx = Math.cos(L.a);
        this.vy = Math.sin(L.a);
        audio.playSfx('charge');
        break;
      case 'melee': {
        this.vx = Math.cos(L.a);
        this.vy = Math.sin(L.a);
        audio.playSfx('monsterSwing');
        break;
      }
      case 'jump':
        this.jumpFrom = { x: this.x, y: this.y };
        this.jumpTo = { x: L.x, y: L.y };
        audio.playSfx('jump');
        break;
      case 'aoe':
        if (this.look.target !== 'player') {
          combat.monsterAoE(this, this.aoeRadius(), 1, this.x, this.y);
          audio.playSfx('explode', { vol: 0.8 });
        }
        break;
      case 'ranged':
        this.fire(player, combat, 0);
        audio.playSfx('shoot');
        break;
      case 'fan': {
        const n = this.look.count || (this.elite ? 5 : 3);
        const spread = n >= 5 ? 0.24 : 0.3;
        for (let i = 0; i < n; i++) this.fire(player, combat, (i - (n - 1) / 2) * spread, L.a);
        audio.playSfx('shoot');
        break;
      }
      case 'ring': {
        for (let i = 0; i < 10; i++) this.fire(player, combat, 0, (i / 10) * Math.PI * 2 + this.t, 0.8);
        audio.playSfx('aoe');
        world.shake(3);
        break;
      }
      case 'summon': {
        const minion = this.summonType();
        const alive = world.monsters.filter((m) => m.summoner === this && !m.dead).length;
        if (minion && alive < 2) {
          for (let i = alive; i < 2; i++) {
            const m = world.spawnMinion(minion, this.x + rand(-70, 70), this.y + rand(30, 60), { zoneId: 'summon' });
            if (m) m.summoner = this;
          }
          audio.playSfx('summon');
        }
        break;
      }
      default:
        break;
    }
  }

  summonType() {
    const map = { cf_elite: 'ringSlime', sp_elite: 'sphereSpirit', bigMushroom: 'mushroom' };
    return map[this.type] || null;
  }

  aoeRadius() {
    return (this.def.puffRadius || 80) * (this.strong ? 1.1 : 1);
  }

  fire(player, combat, offset = 0, baseA = null, mult = 1) {
    const a = (baseA ?? Math.atan2(player.y - this.y, player.x - this.x)) + offset;
    const shot = this.look.shot || 'comet_blue';
    const sp = (SHOT_SPEED[shot] || 280) * (this.elite ? 1.05 : 1);
    const oy = -16 - (this.look.flyH || 0);
    combat.spawnProjectile({
      x: this.x + Math.cos(a) * 18, y: this.y + oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      r: shot === 'arrow' ? 7 : 10, mult: 0.9 * mult, source: this, kind: shot, art: shot,
    });
  }

  updateAttack(dt, player, combat, world) {
    const ca = this.currentAttack;
    const near = () => Math.hypot(player.x - this.x, player.y - this.y) < this.radius + 22;
    switch (ca) {
      case 'charge': {
        const sp = this.def.flying ? 470 : 430;
        this.x += this.vx * sp * dt;
        this.y += this.vy * sp * dt;
        this.moving = true;
        if (!this.hitDone && near()) {
          this.hitDone = true;
          combat.monsterHits(this, 1.15);
        }
        if (this.stateT >= 0.48) {
          this.missed = !this.hitDone; // 빗나가면 어지러워서 더 오래 쉬어요
          this.setState('recover');
        }
        break;
      }
      case 'melee': {
        // 짧게 앞으로 나가며 앞쪽 부채꼴 타격
        if (this.stateT < 0.12) {
          this.x += this.vx * 260 * dt;
          this.y += this.vy * 260 * dt;
        }
        if (!this.hitDone && this.stateT >= 0.08) {
          this.hitDone = true;
          const reach = this.radius + 40;
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const d = Math.hypot(dx, dy) || 1;
          const dot = (dx * this.vx + dy * this.vy) / d;
          combat.effects.push({ type: 'claw', x: this.x + this.vx * 26, y: this.y + this.vy * 26 - 14, a: Math.atan2(this.vy, this.vx), life: 0.22, max: 0.22 });
          if (d < reach && dot > 0.1) combat.monsterHits(this, 1);
        }
        if (this.stateT >= 0.28) this.setState('recover');
        break;
      }
      case 'jump': {
        const T = 0.48;
        const k = Math.min(1, this.stateT / T);
        this.x = this.jumpFrom.x + (this.jumpTo.x - this.jumpFrom.x) * k;
        this.y = this.jumpFrom.y + (this.jumpTo.y - this.jumpFrom.y) * k;
        this.z = Math.sin(k * Math.PI) * 70;
        if (k >= 1) {
          this.z = 0;
          combat.monsterAoE(this, 52 * Math.min(1.8, this.scale), 1, this.x, this.y, 'land');
          world.shake(this.elite ? 6 : 3);
          world.game.audio.playSfx('land');
          this.setState('recover');
        }
        break;
      }
      case 'aoe': {
        if (this.look.target === 'player') {
          // 예고 때 정한 위치에 폭발 (경고 표시가 끝나면)
          if (!this.hitDone) {
            this.hitDone = true;
            combat.delayedAoE(this, this.lock.x, this.lock.y, 70 * Math.min(1.5, this.scale), 0.75, 1.1);
          }
          if (this.stateT >= 0.3) this.setState('recover');
        } else if (this.stateT >= 0.35) {
          this.setState('recover');
        }
        break;
      }
      case 'burst': {
        const n = this.elite ? 4 : 3;
        const gap = 0.17;
        while (this.shots < n && this.stateT >= this.shots * gap) {
          this.fire(player, combat, rand(-0.05, 0.05));
          world.game.audio.playSfx('shoot');
          this.shots += 1;
        }
        if (this.stateT >= n * gap + 0.1) this.setState('recover');
        break;
      }
      default:
        if (this.stateT >= 0.3) this.setState('recover');
        break;
    }
  }

  // ---------- 그리기 ----------
  drawTelegraph(ctx) {
    if (this.state !== 'windup' || !this.lock || !this.world) return;
    const k = Math.min(1, this.stateT / this.windupTime);
    const ca = this.currentAttack;
    ctx.save();
    ctx.strokeStyle = '#ff4d64';
    ctx.fillStyle = '#ff4d64';
    if (ca === 'charge') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.lock.a);
      ctx.globalAlpha = 0.15 + k * 0.3;
      ctx.fillRect(0, -this.radius, 210, this.radius * 2);
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      ctx.strokeRect(0, -this.radius, 210, this.radius * 2);
      ctx.setLineDash([]);
      ctx.fillRect(0, -this.radius, 210 * k, 3);
    } else if (ca === 'aoe') {
      const L = this.look.target === 'player' ? this.lock : { x: this.x, y: this.y };
      const r = this.look.target === 'player' ? 70 * Math.min(1.5, this.scale) : this.aoeRadius();
      this.drawCircleWarn(ctx, L.x, L.y + 8, r, k);
    } else if (ca === 'jump') {
      this.drawCircleWarn(ctx, this.lock.x, this.lock.y + 8, 52 * Math.min(1.8, this.scale), k);
    } else if (ca === 'fan' || ca === 'ranged' || ca === 'burst') {
      const n = ca === 'fan' ? (this.look.count || (this.elite ? 5 : 3)) : 1;
      const spread = n >= 5 ? 0.24 : 0.3;
      const base = Math.atan2(this.world.game.player.y - this.y, this.world.game.player.x - this.x);
      ctx.globalAlpha = 0.25 + k * 0.45;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * spread;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 16);
        ctx.lineTo(this.x + Math.cos(a) * 170, this.y - 16 + Math.sin(a) * 170);
        ctx.stroke();
      }
    } else if (ca === 'melee') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.lock.a);
      ctx.globalAlpha = 0.18 + k * 0.32;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.radius + 40, -0.9, 0.9);
      ctx.closePath();
      ctx.fill();
    } else if (ca === 'ring' || ca === 'summon') {
      ctx.globalAlpha = 0.3 + k * 0.4;
      ctx.strokeStyle = ca === 'ring' ? '#ff4d64' : '#c7b6ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 4, 30 + k * 40, (30 + k * 40) * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCircleWarn(ctx, x, y, r, k) {
    ctx.globalAlpha = 0.18 + k * 0.3;
    ctx.beginPath();
    ctx.ellipse(x, y, r * k, r * k * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 그림 한 장 + 공통 애니메이션(MonsterAnimation)으로 그리기
  drawArt(ctx, A0) {
    let A = A0;
    const L = this.look;
    if (!L.art && !L.art3) return false;
    const attacking = this.state === 'attack' || (this.state === 'windup' && this.stateT > this.windupTime * 0.7);
    // 새 몬스터 v2 그림(한 장)이 있으면 그것으로 — 공격 자세는 공통 애니메이션(늘이기·기울이기)으로 표현
    const n3 = L.art3 && assets.get(L.art3);
    let key = n3 ? L.art3 : `${L.art}_${attacking ? 'attack' : 'idle'}`;
    const idle = n3 || assets.get(`${L.art}_idle`);
    if (!idle || !assets.get(key)) return false;
    let s = (L.size * this.scale * (n3 ? 1.12 : 1)) / Math.max(idle.m.w, idle.m.h);
    let face = (n3 ? L.face3 : L.face) || 1;
    // 동작팩 v3 공격 4프레임: 대기(1) → 준비(2) → 공격(3) → 회복(4)
    const atk = n3 ? attackFrame(this, L.art3) : null;
    if (atk) {
      s *= atk.k;
      key = atk.key;
      if (atk.full) face = atk.face || 1;
      else if (atk.face) face = atk.face;
      // 공격 프레임 그림 자체에 동작이 있으니 몸 늘이기·기울이기는 약하게 (대기·이동·피격·처치 연출은 그대로)
      if (atk.i) A = { ...A, sx: 1 + (A.sx - 1) * 0.3, sy: 1 + (A.sy - 1) * 0.3, rot: A.rot * 0.3 };
    }
    // v4 프레임을 못 불러온 경우에만(스켈레톤·불 정령): 몸 변형 + 기존 효과 그림으로 보완
    const noFrame = n3 && !this.dead && !atk?.full ? NO_ATK_FRAME[L.art3.split('/').pop()] : null;
    if (noFrame === 'fire' && (this.state === 'windup' || this.state === 'attack') && !(A.tintA > 0.5)) {
      // 힘을 모으는 동안 주황빛이 점점 강하게 맥박
      const k = this.state === 'attack' ? 1 : Math.min(1, this.stateT / this.windupTime);
      A = { ...A, tint: '#ff9a3c', tintA: (0.18 + 0.22 * Math.abs(Math.sin(this.t * 14))) * k + (this.state === 'attack' ? 0.25 : 0) };
    }
    const flipX = this.facing !== face;
    const fly = L.flyH || 0;
    const y = this.y + this.radius * 0.6 - fly - this.z;
    // 돌진 잔상
    const trail = trackTrail(this);
    if (trail) {
      trail.forEach((p, i) => {
        if (i === trail.length - 1) return;
        assets.draw(ctx, key, p.x, p.y + this.radius * 0.6 - fly - this.z, {
          scale: s, flipX, sx: A.sx, sy: A.sy, rot: A.rot, alpha: 0.12 + (i / trail.length) * 0.25, tint: '#ffd9a0', tintA: 0.6,
        });
      });
    }
    assets.draw(ctx, key, this.x + A.ox, y + A.oy, {
      scale: s, flipX, sx: A.sx, sy: A.sy, rot: A.rot, alpha: A.alpha, tint: A.tint, tintA: A.tintA,
    });
    if (noFrame) drawNoFrameFx(ctx, this, noFrame, y - L.size * this.scale * 0.45);
    return true;
  }

  draw(ctx, t) {
    const def = this.def;
    const L = this.look;
    // 공격 예고 (몬스터 아래쪽)
    this.drawTelegraph(ctx);

    const A = animTransform(this);
    ctx.save();
    // 그림자 (높이 뜰수록 작아짐)
    const lift = Math.max(0, this.z - A.oy - (L.flyH ? 0 : 0));
    const shR = Math.max(14, this.radius * 1.05) * Math.max(0.45, 1 - lift / 120) * (this.dead ? A.sx : 1);
    ctx.fillStyle = `rgba(15, 20, 10, ${0.25 * A.alpha})`;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.6, shR, shR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // 엘리트·강화 몬스터 오라
    if ((this.elite || this.strong) && !this.dead) {
      const g = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.radius * 2.4);
      const c = this.elite ? '255,190,60' : '255,80,110';
      g.addColorStop(0, `rgba(${c},${0.35 + Math.sin(this.t * 4) * 0.08})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 4, this.radius * 2.4, this.radius * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!this.drawArt(ctx, A)) {
      // 그림 파일이 없을 때(기본 캔버스 그림)도 같은 애니메이션 적용
      const draw = MONSTER_SPRITES[def.sprite] || MONSTER_SPRITES.slime;
      const windup = this.state === 'windup' ? Math.min(1, this.stateT / this.windupTime) : 0;
      const fy = this.y + this.radius * 0.6;
      ctx.globalAlpha *= A.alpha;
      ctx.translate(this.x + A.ox, fy + A.oy);
      ctx.rotate(A.rot);
      ctx.scale(A.sx, A.sy);
      ctx.translate(-this.x, -fy);
      ctx.translate(0, -this.z);
      draw(ctx, this.x, this.y, {
        color: def.color, t: this.t, scale: this.scale, flash: Math.max(this.flash, A.tintA > 0.5 ? 0.12 : 0), windup,
        attacking: this.state === 'attack', outline: this.strong ? '#8a1c3c' : INK,
        facing: this.facing, moving: this.moving,
      });
      ctx.translate(0, this.z);
    }
    ctx.restore();
    if (this.dead) return;

    const artH = L.art ? L.size * this.scale * 0.85 : 42 * this.scale;
    const topY = this.y + this.radius * 0.6 - artH - (L.flyH || 0) - this.z - 6;
    // 머리 위 표시: 발견(!) / 공격 예고(!) / 어지러움(별)
    ctx.textAlign = 'center';
    if (this.state === 'notice' || (this.state === 'windup' && this.stateT < this.windupTime)) {
      const pop = this.state === 'notice' ? Math.min(1, this.stateT * 8) : 1;
      ctx.font = `${Math.round(24 * pop)}px Jua, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      const mark = this.state === 'notice' ? '!' : '!!';
      ctx.strokeText(mark, this.x, topY - 4);
      ctx.fillStyle = this.state === 'notice' ? '#ffd23f' : '#ff4d64';
      ctx.fillText(mark, this.x, topY - 4);
    } else if (this.state === 'recover' && this.missed) {
      ctx.font = '16px sans-serif';
      for (let i = 0; i < 3; i++) {
        const a = this.t * 5 + (i / 3) * Math.PI * 2;
        ctx.fillText('⭐', this.x + Math.cos(a) * 16, topY + 4 + Math.sin(a) * 5);
      }
    }
    if (this.blockFx > 0) {
      ctx.save();
      ctx.globalAlpha = this.blockFx / 0.3;
      ctx.strokeStyle = '#bfe9ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x + Math.cos(this.faceA) * this.radius, this.y - 14 + Math.sin(this.faceA) * this.radius * 0.5, 16 + (0.3 - this.blockFx) * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (this.elite) drawCrown(ctx, this.x, topY - 4, 1.1);

    const showName = this.elite || this.strong;
    if (this.showHpT > 0 || this.elite) {
      const w = this.elite ? 72 : 42;
      const y = topY + (this.elite ? 6 : 0);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = INK;
      ctx.fillStyle = '#4a3f63';
      roundRect(ctx, this.x - w / 2, y, w, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = this.elite ? '#ff9a1f' : '#ff5a6e';
      const fw = Math.max(0, (this.hp / this.maxHp) * (w - 2));
      if (fw > 0) {
        roundRect(ctx, this.x - w / 2 + 1, y + 1, fw, 5, 2.5);
        ctx.fill();
      }
      roundRect(ctx, this.x - w / 2, y, w, 7, 3.5);
      ctx.stroke();
    }
    if (showName) {
      ctx.font = '13px Jua, sans-serif';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = INK;
      const ny = topY - (this.elite ? 14 : 6);
      ctx.strokeText(this.name, this.x, ny);
      ctx.fillStyle = this.elite ? '#ffd23f' : '#ffb3c1';
      ctx.fillText(this.name, this.x, ny);
    }
  }
}

