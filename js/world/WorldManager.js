// 필드(월드) 관리: 몬스터 등장·재등장, 떨어진 보상 줍기, NPC 근처 확인, 탐험 지역, 체력 회복
// 수학 문제나 창이 떠 있는 동안에는 필드 전체가 멈춥니다. (문제를 푸는 동안 맞지 않도록)

import { Monster } from '../battle/Monster.js';
import { ScaleKingBoss } from '../battle/ScaleKingBoss.js';
const BOSS_CLASSES = { scaleKnightKing: ScaleKingBoss };
import { CombatManager } from '../battle/CombatManager.js';
import { Boss } from '../battle/Boss.js';
import { MONSTERS, STRONG_VARIANT, BOSSES } from '../data/monsters.js';
import { ITEMS, GRADES } from '../data/items.js';
import { drawPickup, drawPrompt } from '../render/sprites.js';
import { rand, randInt, pick } from '../core/utils.js';
import { drawItemArt } from '../data/itemArt.js';
import { assets } from '../render/AssetManager.js';

const REGEN_DELAY = 5; // 마지막으로 맞은 뒤 회복이 시작되는 시간(초)
const REGEN_RATE = 0.03; // 1초에 최대 HP의 3%

export class WorldManager {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.monsters = [];
    this.pickups = [];
    this.combat = new CombatManager(game, this);
    this.zoneTimers = {};
    this.near = null;
    this.inAreas = new Set();
    this.shakeT = 0;
    this.shakeMag = 0;
    this.regenAcc = 0;
    this.lastToast = {};
    this.boss = null;
    this.exitCooldown = 0;
    this.attackTokens = 0; // 동시에 공격하는 몬스터 수
  }

  load(scene) {
    this.scene = scene;
    this.boss = null;
    this.exitCooldown = 0.6;
    this.monsters = [];
    this.pickups = [];
    this.attackTokens = 0;
    this.combat.reset();
    this.zoneTimers = {};
    this.inAreas = new Set();
    this.near = null;
    for (const zone of scene.zones || []) {
      for (let i = 0; i < zone.max; i++) this.spawnMonster(zone);
    }
  }

  // 같은 안내를 너무 자주 띄우지 않기
  toastOnce(key, text, type = 'info', gap = 3) {
    const now = this.game.time;
    if (now - (this.lastToast[key] ?? -99) < gap) return;
    this.lastToast[key] = now;
    this.game.ui.toast(text, type);
  }

  spawnMonster(zone) {
    const p = this.game.player;
    const r = zone.rect;
    for (let i = 0; i < 20; i++) {
      const x = rand(r.x, r.x + r.w);
      const y = rand(r.y, r.y + r.h);
      if (p && Math.hypot(p.x - x, p.y - y) < 260) continue;
      if (this.solidsNow().some((r) => x > r.x - 30 && x < r.x + r.w + 30 && y > r.y - 30 && y < r.y + r.h + 30)) continue;
      const type = pick(zone.types);
      const def = MONSTERS[type];
      const strong = def.tier === 'normal' && Math.random() < STRONG_VARIANT.chance;
      this.monsters.push(new Monster(type, def, x, y, { strong, zoneId: zone.id }));
      return true;
    }
    return false;
  }

  spawnMinion(type, x, y, { zoneId = 'bossMinion' } = {}) {
    if (!MONSTERS[type]) return null;
    const m = new Monster(type, MONSTERS[type], x, y, { zoneId });
    m.setState('chase');
    this.monsters.push(m);
    this.combat.effects.push({ type: 'art', key: 'effects/pillar_purple', x, y: y - 30, h: 90, life: 0.5, max: 0.5 });
    return m;
  }

  solidsNow() {
    return this.scene?.solids ? this.scene.solids(this.game.save, this) : [];
  }

  // 원(캐릭터)이 벽(사각형)에 겹치면 밖으로 밀어냄
  pushOut(ent, r, solids) {
    for (const s of solids) {
      const cx = Math.max(s.x, Math.min(ent.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(ent.y, s.y + s.h));
      let dx = ent.x - cx;
      let dy = ent.y - cy;
      const d = Math.hypot(dx, dy);
      if (d >= r) continue;
      if (d === 0) {
        // 사각형 안쪽에 들어간 경우: 가장 가까운 변으로
        const opts = [
          [ent.x - s.x, -1, 0], [s.x + s.w - ent.x, 1, 0],
          [ent.y - s.y, 0, -1], [s.y + s.h - ent.y, 0, 1],
        ].sort((a, b) => a[0] - b[0])[0];
        ent.x += opts[1] * (opts[0] + r);
        ent.y += opts[2] * (opts[0] + r);
      } else {
        ent.x += (dx / d) * (r - d);
        ent.y += (dy / d) * (r - d);
      }
    }
  }

  zoneCount(zone) {
    return this.monsters.filter((m) => m.zoneId === zone.id && !m.dead).length;
  }

  shake(mag) {
    this.shakeT = 0.18;
    this.shakeMag = Math.max(this.shakeMag, mag);
  }

  shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    return { x: rand(-1, 1) * this.shakeMag, y: rand(-1, 1) * this.shakeMag };
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p || !this.scene) return;
    if (!g.state.gameplayActive) {
      g.ui.setInteract(null);
      return;
    }

    const totals = g.equipment.totals();
    const prev = { x: p.x, y: p.y };
    const events = p.update(dt, g.input, this.scene.bounds, totals, (pl) => this.combat.nearestEnemy(pl, 150));
    // 장면 장치 (빙판 미끄러짐 · 마법진 순간이동 등)
    this.scene.tick?.(dt, this, prev);
    this.handlePlayerEvents(events);
    g.skills.update(dt);

    const solids = this.solidsNow();
    this.pushOut(p, 18, solids);
    for (const m of this.monsters) {
      m.update(dt, p, this.combat, this.scene.bounds, this);
      if (!m.dead) this.pushOut(m, m.boss ? 40 : m.radius, solids);
    }
    this.separate();
    this.attackTokens = this.monsters.filter((m) => m.token && !m.dead).length;
    this.combat.update(dt);
    this.monsters = this.monsters.filter((m) => !m.removable);
    this.updateBoss(dt);
    this.checkExits(dt);

    for (const zone of this.scene.zones || []) {
      if (this.zoneCount(zone) >= zone.max) {
        this.zoneTimers[zone.id] = 0;
        continue;
      }
      this.zoneTimers[zone.id] = (this.zoneTimers[zone.id] || 0) + dt;
      if (this.zoneTimers[zone.id] >= zone.respawn && this.spawnMonster(zone)) this.zoneTimers[zone.id] = 0;
    }

    this.updatePickups(dt);
    this.checkAreas();
    this.regen(dt, totals);

    this.near = p.dead ? null : this.findNear();
    g.ui.setInteract(this.near ? this.near.label : null);
    if (this.near && g.input.consume('interact')) g.interact(this.near);

    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.shakeT <= 0) this.shakeMag = 0;
  }

  // 추락 장치(함정·절벽)가 부르는 함수 — 지금 맵에는 추락 장치가 없어서 아직 아무 데서도 부르지 않아요.
  // 예: world.playerFall({ to: { x: 안전한 x, y: 안전한 y } })
  playerFall({ to = null, dur = 1.1 } = {}) {
    const p = this.game.player;
    if (!p?.startFall({ to: to || { x: p.x, y: p.y }, dur })) return false;
    this.game.audio.playSfx('dodgeMiss');
    return true;
  }

  handlePlayerEvents(events) {
    const g = this.game;
    for (const ev of events) {
      if (ev?.type === 'attackStart') {
        g.audio.playSfx(`swing${ev.step}`);
        for (const m of this.monsters) m.onPlayerAttackStart?.(g.player);
      } else if (ev?.type === 'attackHit') {
        this.combat.playerAttack(ev.step);
      } else if (ev === 'skill1' || ev === 'skill2' || ev === 'skill3') {
        const res = g.skills.tryCast(Number(ev.slice(-1)) - 1);
        if (res.ok) {
          this.combat.castSkill(res.def);
        } else if (res.reason === 'locked') {
          this.toastOnce('skillLocked', `🔒 이 스킬 칸은 LEVEL ${res.level}에 열려요.`);
        } else if (res.reason === 'empty') {
          this.toastOnce('skillEmpty', '스킬 칸이 비어 있어요. 메뉴 → 스킬에서 배운 스킬을 넣거나, 룬 할아버지에게 새 스킬을 배워 보세요!');
        }
      } else if (ev?.type === 'fallEnd') {
        g.audio.playSfx('land');
      } else if (ev === 'dodge') {
        g.audio.playSfx('dodge');
      } else if (ev === 'potion') {
        g.usePotion();
      }
    }
  }

  // 몬스터끼리 겹치지 않게 살짝 밀어냄
  separate() {
    const ms = this.monsters;
    const p = this.game.player;
    // 플레이어와 겹친 몬스터는 살짝 밀려나요 (돌진·점프 중 제외)
    if (p && !p.dead) {
      for (const m of ms) {
        if (m.dead || m.boss || m.state === 'attack' || m.look?.flyH) continue;
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = m.radius + 14;
        if (d < min) {
          m.x += (dx / d) * (min - d) * 0.6;
          m.y += (dy / d) * (min - d) * 0.6;
        }
      }
    }
    for (let i = 0; i < ms.length; i++) {
      const a = ms[i];
      if (a.dead || a.boss) continue;
      for (let j = i + 1; j < ms.length; j++) {
        const b = ms[j];
        if (b.dead || b.boss) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        if (Math.abs(dx) + Math.abs(dy) < 0.5) {
          // 완전히 같은 자리면 아무 방향으로나 떼어 놓기
          const r = (i * 2.399 + j) % (Math.PI * 2);
          dx = Math.cos(r);
          dy = Math.sin(r);
        }
        const d = Math.hypot(dx, dy) || 0.01;
        const min = (a.radius + b.radius) * 0.9;
        if (d < min) {
          const push = (min - d) / 2;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        }
      }
    }
  }

  // ---------- 보스 ----------
  updateBoss(dt) {
    const g = this.game;
    const sb = this.scene.boss;
    if (!sb) return;
    const p = g.player;
    if (!this.boss && !p.dead && !g.save.bossesDefeated.includes(this.scene.bossKey || this.scene.village)) {
      const r = sb.trigger;
      // ⑨ 봉인 제단 의식을 마친 뒤에만 보스가 나타나요 (문을 열었다고 바로 나오지 않음)
      const ritualDone = !sb.ritualId || g.save.activatedRunes.includes(sb.ritualId);
      if (ritualDone && p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) this.startBoss();
    }
    const b = this.boss;
    if (b && b.sealPending && b.stateT > 0.9 && !g.math.active && !g.state.overlays.length) {
      b.sealPending = false;
      g.bossSeal(b);
    }
  }

  // 보스 페이즈 전환 (HP가 줄어 더 강해질 때)
  onBossPhase(boss, phase) {
    const g = this.game;
    g.ui.banner(phase >= 3 ? '최종 페이즈!' : '페이즈 2!', phase >= 3 ? `${boss.name}이(가) 마지막 힘을 끌어올려요!` : `${boss.name}이(가) 분노했어요! 새 공격에 조심!`);
    g.audio.playSfx('bossRoar');
    this.shake(9);
    this.combat.effects.push({ type: 'art', key: 'effects/pillar_purple', x: boss.x, y: boss.y - 60, h: 220, life: 0.9, max: 0.9 });
  }

  startBoss() {
    const sb = this.scene.boss;
    const def = BOSSES[sb.id];
    // 전용 보스 클래스가 있으면 사용 (천칭 기사왕)
    const BossClass = BOSS_CLASSES[sb.id] || Boss;
    this.boss = new BossClass(sb.id, def, sb.spawn.x, sb.spawn.y);
    this.monsters.push(this.boss);
    this.combat.projectiles = [];
    this.game.onBossStart(this.boss);
  }

  endBossFight() {
    this.monsters = this.monsters.filter((m) => !m.boss && m.zoneId !== 'bossMinion');
    this.boss = null;
    this.combat.projectiles = [];
  }

  checkExits(dt) {
    this.exitCooldown = Math.max(0, this.exitCooldown - dt);
    if (this.exitCooldown > 0 || this.game.changingScene) return;
    const p = this.game.player;
    const exits = this.scene.activeExits ? this.scene.activeExits(this.game.save) : (this.scene.exits || []);
    for (const ex of exits) {
      const r = ex.rect;
      if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) {
        if (this.scene.exitBlocked?.(ex, this.game.save)) {
          // 아직 열리지 않은 길: 조금 뒤로 밀고 안내
          p.x += p.x > (this.scene.bounds.x + this.scene.bounds.w / 2) ? -40 : 40;
          this.exitCooldown = 1;
          this.game.ui.toast('🔒 아직 이 길은 막혀 있어요. 앞 마을의 보스를 물리치면 열려요!', 'info', 2400);
          return;
        }
        if (ex.action === 'map') {
          p.y = r.y - 30;
          this.exitCooldown = 1;
          this.game.ui.openWorldMap();
        } else {
          this.game.changeScene(ex.to, ex.spawn);
        }
        return;
      }
    }
  }

  onMonsterKilled(m) {
    const g = this.game;
    const s = g.save;
    const c = s.counters;
    c.kills = (c.kills || 0) + 1;
    c.killsByType[m.type] = (c.killsByType[m.type] || 0) + 1;
    if (m.elite) c.eliteKills = (c.eliteKills || 0) + 1;

    const goldQty = randInt(m.goldRange[0], m.goldRange[1]);
    this.spawnPickup({ kind: 'gold', qty: goldQty, announced: true }, m.x, m.y);
    // 처치 순간 얻을 골드를 미리 보여 줌 (주울 때는 숫자를 다시 띄우지 않음)
    g.renderer.addFloater(`+${goldQty} G`, m.x + 26, m.y - 34 * Math.min(2, m.scale), '#ffd23f', m.boss ? 26 : 18);
    for (const d of m.def.drops || []) {
      if (Math.random() < Math.min(1, d.chance * m.dropBonus)) {
        const qty = d.qty ? randInt(d.qty[0], d.qty[1]) : 1;
        this.spawnPickup({ kind: 'item', id: d.id, qty }, m.x, m.y);
      }
    }
    g.renderer.addFloater(`+${m.exp} EXP`, m.x - 18, m.y - 56 * Math.min(2, m.scale), '#9ff3ff', m.boss ? 30 : 20);
    if (m.elite) g.audio.playSfx('bossDefeat');
    if (m.boss) {
      for (const mm of this.monsters) if (mm.zoneId === 'bossMinion' && !mm.dead) mm.takeHit(9999, 0, 0);
      this.combat.projectiles = [];
      g.onBossDefeated(m);
    } else {
      g.bus.emit('monster:killed', { type: m.type, elite: m.elite, strong: m.strong });
    }
    g.gainExp(m.exp);
  }

  spawnPickup(obj, x, y) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(60, 130);
    const pk = { ...obj, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 120 };
    if (obj.kind === 'item') {
      const def = ITEMS[obj.id];
      pk.order = GRADES[def.grade].order;
      if (pk.order >= 3) {
        // 희귀 이상: 빛기둥 + 효과음
        this.game.audio.playSfx(pk.order >= 4 ? 'epicDrop' : 'rareDrop');
        this.combat.effects.push({ type: 'art', key: pk.order >= 4 ? 'effects/pillar_purple' : 'effects/pillar_gold', x, y: y - 40, h: 130, life: 1.0, max: 1.0 });
      }
    }
    this.pickups.push(pk);
  }

  drawPickupArt(ctx, pk) {
    if (pk.kind !== 'item') return false;
    const def = ITEMS[pk.id];
    const g = GRADES[def.grade];
    const bob = Math.sin(pk.t * 4) * 3;
    const y = pk.y - 14 + bob;
    ctx.save();
    ctx.fillStyle = 'rgba(15,20,10,0.25)';
    ctx.beginPath();
    ctx.ellipse(pk.x, pk.y + 2, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 등급 빛
    const glow = ctx.createRadialGradient(pk.x, y, 2, pk.x, y, 24);
    glow.addColorStop(0, `${g.color}aa`);
    glow.addColorStop(1, `${g.color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pk.x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    if ((pk.order || 1) >= 3) {
      // 희귀 이상은 은은한 빛기둥이 계속 보여요
      assets.draw(ctx, pk.order >= 4 ? 'effects/pillar_purple' : 'effects/pillar_gold', pk.x, y - 26, { height: 70, center: true, alpha: 0.45 + Math.sin(pk.t * 3) * 0.15, blend: 'lighter' });
    }
    const ok = drawItemArt(ctx, pk.id, pk.x, y, 30);
    ctx.restore();
    return ok;
  }

  updatePickups(dt) {
    const p = this.game.player;
    for (const pk of this.pickups) {
      pk.t += dt;
      pk.life -= dt;
      if (pk.t < 0.4) {
        pk.x += pk.vx * dt;
        pk.y += pk.vy * dt;
        pk.vx *= 0.9;
        pk.vy *= 0.9;
        continue;
      }
      if (p.dead) continue;
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const d = Math.hypot(dx, dy);
      if (pk.blocked && d > 90) pk.blocked = false;
      if (pk.blocked) continue;
      if (d < 150) {
        const sp = 380 + (150 - d) * 4;
        pk.x += (dx / d) * Math.min(d, sp * dt);
        pk.y += (dy / d) * Math.min(d, sp * dt);
      }
      if (d < 24) this.collect(pk);
    }
    this.pickups = this.pickups.filter((pk) => !pk.taken && pk.life > 0);
  }

  collect(pk) {
    const g = this.game;
    const p = g.player;
    if (pk.kind === 'gold') {
      g.save.gold += pk.qty;
      if (!pk.announced) g.renderer.addFloater(`+${pk.qty} G`, p.x + rand(-10, 10), p.y - 50, '#ffd23f', 18);
      g.audio.playSfx('gold');
      pk.taken = true;
      g.ui.updateHUD();
      g.markDirty('gold');
      return;
    }
    const def = ITEMS[pk.id];
    const added = g.inventory.add(pk.id, pk.qty);
    if (!added) {
      pk.blocked = true;
      this.toastOnce('bagFull', '가방이 가득 찼어요! 필요 없는 물건을 정리해 주세요.', 'warn', 5);
      return;
    }
    pk.taken = true;
    g.renderer.addFloater(`${def.icon} ${def.name}${pk.qty > 1 ? ` ×${pk.qty}` : ''}`, p.x, p.y - 64, GRADES[def.grade].color === '#8f98ab' ? '#ffffff' : GRADES[def.grade].color, 17);
    const ord = GRADES[def.grade].order;
    g.audio.playSfx(ord >= 4 ? 'epicItem' : ord >= 3 ? 'rareItem' : 'item');
    if (def.type === 'equipment' && GRADES[def.grade].order >= 3) {
      g.ui.toast(`💎 ${GRADES[def.grade].name} 장비 획득! ${def.name}`, 'ok');
    }
    g.markDirty('item');
  }

  checkAreas() {
    const p = this.game.player;
    for (const a of this.scene.areas || []) {
      const r = a.rect;
      const inside = p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
      if (inside && !this.inAreas.has(a.id)) {
        this.inAreas.add(a.id);
        this.toastOnce(`area-${a.id}`, `📍 ${a.name}`, 'info', 30);
        this.game.bus.emit('area:enter', { id: a.id });
      } else if (!inside) {
        this.inAreas.delete(a.id);
      }
    }
  }

  regen(dt, totals) {
    const p = this.game.player;
    const st = this.game.save.stats;
    if (p.dead || p.sinceHit < REGEN_DELAY || st.hp >= totals.maxHp) {
      this.regenAcc = 0;
      return;
    }
    this.regenAcc += totals.maxHp * REGEN_RATE * dt;
    if (this.regenAcc >= 1) {
      const add = Math.floor(this.regenAcc);
      this.regenAcc -= add;
      st.hp = Math.min(totals.maxHp, st.hp + add);
      this.game.ui.updateHUD();
    }
  }

  findNear() {
    const p = this.game.player;
    let best = null;
    let bestD = Infinity;
    for (const o of this.scene.interactables || []) {
      const d = Math.hypot(p.x - o.x, p.y - o.y);
      if (d < o.r && d < bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  }

  respawnPlayer() {
    const g = this.game;
    const sp = this.scene.spawn;
    if (this.boss) {
      this.endBossFight();
      g.onBossEnd();
    }
    g.player.revive(sp.x, sp.y, g.equipment.totals().maxHp);
    this.combat.reset();
    for (const m of this.monsters) if (!m.dead && m.state !== 'wander') m.setState('return');
    g.renderer.snapCamera(this.scene, g.player);
  }

  // ---------- 그리기 ----------
  drawables(t) {
    const list = [];
    // 몬스터도 발 위치로 정렬 (그림 발끝 = y + 반지름×0.6, 보스 = ×0.5)
    for (const m of this.monsters) list.push({ y: m.y + (m.radius || 16) * (m.boss ? 0.5 : 0.6), draw: (ctx) => m.draw(ctx, t) });
    for (const pk of this.pickups) {
      const def = pk.kind === 'item' ? ITEMS[pk.id] : null;
      list.push({ y: pk.y, draw: (ctx) => { if (!this.drawPickupArt(ctx, pk)) drawPickup(ctx, pk.x, pk.y, pk.kind, def ? GRADES[def.grade].color : null, pk.t, def?.icon); } });
    }
    return list;
  }

  drawEffects(ctx) {
    this.combat.drawEffects(ctx);
  }

  drawOverlay(ctx, t) {
    const p = this.game.player;
    if (p.confuseT > 0) {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔄', p.x + Math.sin(t * 8) * 6, p.y - 62);
    }
    if (!this.near || !this.game.state.gameplayActive) return;
    const o = this.near;
    const key = this.game.input.isTouch ? '💬' : 'E';
    drawPrompt(ctx, o.x, o.y + o.headY - 8, `${key} ${o.label}`, t);
  }
}
