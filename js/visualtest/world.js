// 테스트 월드: 충돌 · 앞뒤 정렬(Y-sort) · 가림 · 몬스터 · 효과 · 카메라 · 디버그 표시
import { TILE, MAPS, OBJ } from './maps.js';
import { img, meta, tinted } from './images.js';
import { buildTerrain, buildRawGround, findSeams, isFace } from './terrain.js';
import { Hero, HERO, DIRV } from './hero.js';

const SOLID = new Set(['~', '#', 'T', 'W']);
const MON = {
  slime_green: { s: 0.62, hp: 3, speed: 70, move: 'hop', face: 1, name: '초록 슬라임' },
  slime_blue: { s: 0.62, hp: 3, speed: 75, move: 'hop', face: 1, name: '파란 슬라임' },
  mushroom: { s: 0.62, hp: 4, speed: 55, move: 'waddle', face: 1, name: '버섯' },
  wolf: { s: 0.74, hp: 5, speed: 120, move: 'run', face: -1, name: '늑대' },
  goblin: { s: 0.66, hp: 5, speed: 85, move: 'waddle', face: 1, name: '고블린' },
};

export class World {
  constructor(game) {
    this.game = game;
    this.opts = { diagonal: true, grid: false, colliders: false, anchors: false, seams: false, raw: false, occlusion: 'fade' };
    this.fx = []; this.texts = []; this.shakeT = 0; this.shakeA = 0;
    this.cam = { x: 0, y: 0 };
    this.time = 0;
  }

  sfx(k, o) { this.game.audio?.playSfx(k, o); }
  shake(a, t) { this.shakeA = Math.max(this.shakeA, a); this.shakeT = Math.max(this.shakeT, t); }

  async load(mapId, at) {
    const map = MAPS[mapId];
    this.map = map;
    const t0 = performance.now();
    this.terrain = buildTerrain(map);
    this.buildMs = Math.round(performance.now() - t0);
    this.rawGround = null; this.seams = null; this.rawSeams = null;
    // 정적 물체 (건물·소품·NPC)
    this.statics = [];
    const add = (kind, o, key, conf) => {
      const m = meta[key];
      if (!m) { this.game.warn(`그림 없음: ${key}`); return; }
      const s = conf.s ?? 1;
      const x = o.x * TILE, y = o.y * TILE;
      const w = m.w * s, h = m.h * s;
      const fw = w * (conf.fw ?? 0.8), fh = conf.fh ?? 20;
      this.statics.push({ kind, id: o.id, key, x, y, s, w, h, ax: m.ax * s, ay: m.ay * s, alpha: 1,
        foot: { x: x - fw / 2, y: y - fh - (conf.lift ?? 2), w: fw, h: fh }, name: o.name, line: o.line, interact: o.interact });
    };
    for (const b of map.buildings) add('building', b, 'buildings/' + b.id, OBJ[b.id] || { s: 1.1 });
    for (const p of map.props) add(p.tree ? 'tree' : 'prop', p, (p.tree ? 'trees/' : 'props/') + p.id, OBJ[p.id] || { s: 0.5 });
    for (const n of map.npcs) add('npc', n, 'npc/' + n.id, { s: 0.52, fw: 0.3, fh: 14 });
    // 몬스터
    this.monsters = map.monsters.map((m) => new Monster(m.id, m.x * TILE, m.y * TILE));
    const [sx, sy] = at || map.spawn;
    const v = this.game.variant;
    if (!this.hero) this.hero = new Hero(v, sx * TILE, sy * TILE);
    this.hero.x = sx * TILE; this.hero.y = sy * TILE; this.hero.vx = this.hero.vy = 0; this.hero.setState('idle');
    this.cam.x = this.hero.x; this.cam.y = this.hero.y - 30;
    this.fx = []; this.texts = [];
    this.exitCooldown = 0.6;
  }

  ensureRaw() {
    if (!this.rawGround) this.rawGround = buildRawGround(this.map);
    return this.rawGround;
  }
  ensureSeams() {
    if (this.opts.raw) { if (!this.rawSeams) this.rawSeams = findSeams(this.ensureRaw(), this.map); return this.rawSeams; }
    if (!this.seams) {
      this.seams = findSeams(this.terrain.ground, this.map).filter((s) => !this.structural(s));
      // 절벽 끝 조각이 없어 잘린 단면이 보이는 곳
      const G = this.map.grid;
      for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) {
        if (!isFace(this.map, x, y)) continue;
        for (const dx of [-1, 1]) {
          const n = G[y][x + dx];
          if (n !== undefined && n !== '#' && n !== 'T' && n !== 'W') {
            const xx = (dx < 0 ? x : x + 1) * TILE;
            this.seams.push({ x0: xx, y0: y * TILE, x1: xx, y1: y * TILE + TILE, k: 9, note: '절벽 끝 조각 없음' });
          }
        }
      }
    }
    return this.seams;
  }
  // 절벽·폭포·다리처럼 원래 모양이 바뀌는 경계는 검사에서 제외
  structural(s) {
    const G = this.map.grid;
    const cells = s.x0 === s.x1
      ? [[s.x0 / TILE - 1, s.y0 / TILE], [s.x0 / TILE, s.y0 / TILE]]
      : [[s.x0 / TILE, s.y0 / TILE - 1], [s.x0 / TILE, s.y0 / TILE]];
    return cells.some(([x, y]) => ['#', 'W', 'b', 'T'].includes(G[y]?.[x]));
  }

  // ---------- 충돌 ----------
  boxOf(e, x = e.x, y = e.y) {
    const w = e.bodyW ?? HERO.bodyW, h = e.bodyH ?? HERO.bodyH;
    return { x: x - w / 2, y: y - h + 3, w, h };
  }
  blocked(r, self = null) {
    const m = this.map;
    if (r.x < 0 || r.y < 0 || r.x + r.w > m.w * TILE || r.y + r.h > m.h * TILE) return true;
    const x0 = Math.floor(r.x / TILE), x1 = Math.floor((r.x + r.w - 0.01) / TILE);
    const y0 = Math.floor(r.y / TILE), y1 = Math.floor((r.y + r.h - 0.01) / TILE);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (SOLID.has(m.grid[y]?.[x])) return true;
    for (const s of this.statics) {
      const f = s.foot;
      if (r.x < f.x + f.w && r.x + r.w > f.x && r.y < f.y + f.h && r.y + r.h > f.y) return true;
    }
    return false;
  }
  // 축마다 따로 움직이고, 모서리에 살짝 걸리면 옆으로 미끄러지게 (조작감)
  move(e, dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
    for (let i = 0; i < steps; i++) {
      this.moveAxis(e, dx / steps, 0);
      this.moveAxis(e, 0, dy / steps);
    }
  }
  moveAxis(e, dx, dy) {
    if (!dx && !dy) return;
    if (!this.blocked(this.boxOf(e, e.x + dx, e.y + dy))) { e.x += dx; e.y += dy; return; }
    // 모서리 미끄러짐: 막힌 방향과 수직으로 최대 12px 비켜서 통과 가능한지
    for (const nudge of [2, 4, 6, 8, 10, 12]) {
      for (const sgn of [1, -1]) {
        const nx = dy ? sgn * nudge : 0, ny = dx ? sgn * nudge : 0;
        if (!this.blocked(this.boxOf(e, e.x + nx, e.y + ny)) && !this.blocked(this.boxOf(e, e.x + nx + dx, e.y + ny + dy))) {
          const k = Math.min(1, (Math.abs(dx) + Math.abs(dy)) / nudge);
          e.x += nx * k * 0.6; e.y += ny * k * 0.6;
          return;
        }
      }
    }
  }

  // ---------- 주인공 공격 ----------
  heroStrike(h, step, c) {
    const [fx, fy] = DIRV[h.dir];
    const cx = h.x + fx * c.reach * 0.62, cy = h.y - 24 + fy * c.reach * 0.62;
    const w = fx ? c.reach : c.w, hh = fx ? c.w * 0.8 : c.reach * 0.9;
    const box = { x: cx - w / 2, y: cy - hh / 2, w, h: hh };
    this.lastStrike = { box, t: 0.15 };
    // 2타·3타는 그림이 1장뿐인 방향이 있어서 베기 효과로 구분
    if (step === 1) this.addFx('slash_blue_fast', h.x + fx * 28, h.y - 36 + fy * 20, { scale: 0.85, rot: Math.atan2(fy, fx), flipY: true, alpha: 0.85 });
    if (c.heavy) this.addFx('slash_gold_heavy', h.x + fx * 26, h.y - 34 + fy * 20, { scale: 0.78, rot: Math.atan2(fy, fx), alpha: 0.9 });
    let hit = false;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const mb = m.hurtBox();
      if (box.x < mb.x + mb.w && box.x + box.w > mb.x && box.y < mb.y + mb.h && box.y + box.h > mb.y) {
        const crit = step === 2;
        m.hurt(h, crit ? 2 : 1, this);
        this.addFx(crit ? 'impact_critical' : 'impact_hit', m.x, m.y - m.height() * 0.5, { scale: crit ? 0.95 : 0.7 });
        this.texts.push({ x: m.x, y: m.y - m.height() - 6, s: crit ? '2' : '1', t: 0.8, crit });
        this.sfx(crit ? 'hitHeavy' : 'hit');
        hit = true;
      }
    }
    if (hit) { this.hitStop = c.heavy ? 0.07 : 0.035; this.shake(c.heavy ? 5 : 2, 0.12); }
  }

  addFx(key, x, y, o = {}) { if (meta['vfx/' + key]) this.fx.push({ key, x, y, t: 0, ...o }); }

  // ---------- 매 프레임 ----------
  update(dt, input) {
    this.time += dt;
    if (this.hitStop > 0) { this.hitStop -= dt; dt *= 0.15; }
    const h = this.hero;
    h.update(dt, input, this);
    for (const m of this.monsters) m.update(dt, this);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < (meta['vfx/' + f.key]?.frames || 1) / 14 + 0.05);
    for (const t of this.texts) { t.t -= dt; t.y -= dt * 34; }
    this.texts = this.texts.filter((t) => t.t > 0);
    if (this.lastStrike) { this.lastStrike.t -= dt; if (this.lastStrike.t <= 0) this.lastStrike = null; }
    this.shakeT = Math.max(0, this.shakeT - dt); if (!this.shakeT) this.shakeA = 0;
    // 건물 가림: 주인공이 건물 뒤(위쪽)에 있고 그림이 겹치면 건물을 반투명하게
    const hb = h.bounds();
    for (const s of this.statics) {
      let target = 1;
      if (s.kind === 'building' && this.opts.occlusion === 'fade') {
        const r = { x: s.x - s.ax, y: s.y - s.ay, w: s.w, h: s.h };
        const over = hb.x < r.x + r.w && hb.x + hb.w > r.x && hb.y < r.y + r.h && hb.y + hb.h > r.y;
        if (over && h.y < s.y - 4) target = 0.55;
      }
      s.alpha += (target - s.alpha) * Math.min(1, dt * 10);
    }
    // 출구
    this.exitCooldown = Math.max(0, this.exitCooldown - dt);
    if (this.exitCooldown <= 0) {
      for (const ex of this.map.exits) {
        const r = { x: ex.x0 * TILE, y: ex.y0 * TILE, w: (ex.x1 - ex.x0) * TILE, h: (ex.y1 - ex.y0) * TILE };
        if (h.x > r.x && h.x < r.x + r.w && h.y > r.y && h.y < r.y + r.h) { this.game.travel(ex.to, ex.at); this.exitCooldown = 2; }
      }
    }
    // 카메라 (부드럽게 따라가기 + 맵 끝에서 멈춤)
    const k = Math.min(1, dt * 8);
    this.cam.x += (h.x - this.cam.x) * k;
    this.cam.y += (h.y - 36 - this.cam.y) * k;
  }

  nearestTalk() {
    const h = this.hero;
    let best = null, bd = 70;
    for (const s of this.statics) {
      if (!(s.line || s.interact)) continue;
      const d = Math.hypot(s.x - h.x, (s.y - h.y) * 1.3);
      if (d < bd + (s.kind === 'prop' ? 40 : 0)) { bd = d; best = s; }
    }
    return best;
  }

  // ---------- 그리기 ----------
  render(ctx, vw, vh, zoom) {
    const m = this.map, W = m.w * TILE, H = m.h * TILE;
    const hw = vw / zoom / 2, hh = vh / zoom / 2;
    let cx = Math.max(hw, Math.min(W - hw, this.cam.x)), cy = Math.max(hh, Math.min(H - hh, this.cam.y));
    if (W < hw * 2) cx = W / 2; if (H < hh * 2) cy = H / 2;
    if (this.shakeT > 0) { cx += (Math.random() - 0.5) * this.shakeA; cy += (Math.random() - 0.5) * this.shakeA; }
    // 화면 픽셀에 딱 맞추기 (지글거림 방지)
    const ox = Math.round((hw - cx) * zoom) / zoom, oy = Math.round((hh - cy) * zoom) / zoom;
    const view = { x: -ox, y: -oy, w: hw * 2, h: hh * 2 };
    this.view = view;
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(ox, oy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1) 바닥
    const ground = this.opts.raw ? this.ensureRaw() : this.terrain.ground;
    const sx = Math.max(0, Math.floor(view.x)), sy = Math.max(0, Math.floor(view.y));
    const sw = Math.min(W - sx, Math.ceil(view.w) + 2), sh = Math.min(H - sy, Math.ceil(view.h) + 2);
    ctx.drawImage(ground, sx, sy, sw, sh, sx, sy, sw, sh);
    // 2) 물결 (움직이는 물)
    if (!this.opts.raw) this.drawWater(ctx, sx, sy, sw, sh);
    // 3) 출구 표시
    this.drawExits(ctx);
    // 4) 그림자
    const shadow = (x, y, rw, a = 0.28) => { ctx.fillStyle = `rgba(20,30,10,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rw, rw * 0.32, 0, 0, Math.PI * 2); ctx.fill(); };
    for (const s of this.statics) if (s.kind === 'npc') shadow(s.x, s.y - 2, 20);
    for (const mo of this.monsters) if (!mo.dead || mo.deathT < 0.4) shadow(mo.x, mo.y - 1, mo.width() * 0.32, 0.25 * (mo.dead ? 1 - mo.deathT / 0.4 : 1));
    const h = this.hero;
    shadow(h.x, h.y - 1, 19);

    // 5) 앞뒤 정렬해서 그리기 (발 y가 작은 것부터)
    const list = [];
    for (const s of this.statics) if (s.x + s.w > view.x && s.x - s.w < view.x + view.w && s.y > view.y - 20 && s.y - s.h < view.y + view.h) list.push({ y: s.y, kind: 's', o: s });
    for (const mo of this.monsters) list.push({ y: mo.y, kind: 'm', o: mo });
    list.push({ y: h.y, kind: 'h', o: h });
    if (!this.opts.raw && this.terrain.canopy) {
      for (const c of this.terrain.canopyCells) {
        if (c.sx + c.sw < view.x || c.sx > view.x + view.w || c.sy + c.sh < view.y || c.sy > view.y + view.h) continue;
        list.push({ y: c.base, kind: 'c', o: c });
      }
    }
    list.sort((a, b) => a.y - b.y || (a.kind === 'h' ? 1 : -1));
    let heroIdx = -1;
    const hb = h.bounds();
    let covered = false;
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (it.kind === 'h') { heroIdx = i; h.draw(ctx); continue; }
      if (it.kind === 's') this.drawStatic(ctx, it.o);
      else if (it.kind === 'm') it.o.draw(ctx);
      else if (it.kind === 'c') ctx.drawImage(this.terrain.canopy, it.o.sx, it.o.sy, it.o.sw, it.o.sh, it.o.sx, it.o.sy, it.o.sw, it.o.sh);
      // 주인공보다 나중에(앞에) 그린 큰 물체가 주인공을 덮는지
      const fadedBuilding = it.kind === 's' && it.o.kind === 'building' && this.opts.occlusion === 'fade';
      if (heroIdx >= 0 && !fadedBuilding && (it.kind === 'c' || (it.kind === 's' && it.o.kind !== 'npc'))) {
        const r = it.kind === 'c' ? { x: it.o.sx, y: it.o.sy, w: it.o.sw, h: it.o.sh } : { x: it.o.x - it.o.ax, y: it.o.y - it.o.ay, w: it.o.w, h: it.o.h * 0.9 };
        if (hb.x < r.x + r.w && hb.x + hb.w > r.x && hb.y < r.y + r.h && hb.y + hb.h > r.y) covered = true;
      }
    }
    // 가려졌을 때 실루엣 (나무 덮개·소품 뒤)
    if (covered && this.opts.occlusion !== 'none') h.draw(ctx, { silhouette: true });

    // 6) 효과 · 숫자
    for (const f of this.fx) this.drawFx(ctx, f);
    for (const t of this.texts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.t * 2);
      ctx.font = `900 ${t.crit ? 26 : 20}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = '#2b1606'; ctx.strokeText(t.s, t.x, t.y);
      ctx.fillStyle = t.crit ? '#ffcf3a' : '#fff'; ctx.fillText(t.s, t.x, t.y);
      ctx.restore();
    }
    // 7) 대화 가능 표시
    const near = this.nearestTalk();
    this.near = near;
    if (near) {
      const yy = near.y - near.h - 10 + Math.sin(this.time * 5) * 3;
      ctx.save();
      ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center';
      const label = near.name ? `💬 ${near.name}` : '🔍 살펴보기';
      const tw = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(40,24,10,.82)'; roundRect(ctx, near.x - tw / 2, yy - 18, tw, 24, 8); ctx.fill();
      ctx.fillStyle = '#ffe9b0'; ctx.fillText(label, near.x, yy);
      ctx.restore();
    }
    // 8) 디버그
    this.drawDebug(ctx, view);
    ctx.restore();
  }

  drawStatic(ctx, s) {
    const im = img.get(s.key);
    if (!im) return;
    ctx.save();
    ctx.globalAlpha = s.alpha;
    let sy = 1;
    if (s.kind === 'npc') sy = 1 + Math.sin(this.time * 2.2 + s.x * 0.01) * 0.012;
    ctx.translate(Math.round(s.x), Math.round(s.y));
    ctx.scale(1, sy);
    ctx.drawImage(im, -s.ax, -s.ay, s.w, s.h);
    ctx.restore();
  }

  drawWater(ctx, sx, sy, sw, sh) {
    // 화면 안에 물 칸이 없으면 건너뜀 (속도)
    const G = this.map.grid;
    let any = false;
    for (let y = Math.floor(sy / TILE) - 1; y <= Math.ceil((sy + sh) / TILE) && !any; y++)
      for (let x = Math.floor(sx / TILE) - 1; x <= Math.ceil((sx + sw) / TILE); x++) if ('~bW'.includes(G[y]?.[x] ?? '.')) { any = true; break; }
    if (!any) return;
    const mask = this.terrain.waterMask;
    const tex = img.get('tiles/water');
    if (!mask || !tex) return;
    if (!this.scratch) this.scratch = document.createElement('canvas');
    const c = this.scratch;
    if (c.width !== sw || c.height !== sh) { c.width = sw; c.height = sh; }
    const g = c.getContext('2d');
    g.globalCompositeOperation = 'copy';
    g.drawImage(mask, sx, sy, sw, sh, 0, 0, sw, sh);
    g.globalCompositeOperation = 'source-in';
    if (!this.waterPat) this.waterPat = g.createPattern(tex, 'repeat');
    const t = this.time;
    g.save();
    g.translate(-sx + t * 9, -sy + Math.sin(t * 0.8) * 4);
    g.fillStyle = this.waterPat;
    g.fillRect(sx - t * 9 - 64, sy - 64, sw + 128, sh + 128);
    g.restore();
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.drawImage(c, sx, sy);
    ctx.restore();
  }

  drawExits(ctx) {
    for (const ex of this.map.exits) {
      const x = (ex.dir === 'right' ? ex.x0 : ex.x1) * TILE, y = (ex.y0 + ex.y1) / 2 * TILE;
      const bob = Math.sin(this.time * 4) * 4 * (ex.dir === 'right' ? 1 : -1);
      ctx.save();
      ctx.translate(x + bob - (ex.dir === 'right' ? 26 : -26), y - 6);
      ctx.fillStyle = 'rgba(255,236,150,.9)';
      ctx.beginPath();
      const d = ex.dir === 'right' ? 1 : -1;
      ctx.moveTo(14 * d, 0); ctx.lineTo(-6 * d, -12); ctx.lineTo(-6 * d, 12); ctx.closePath(); ctx.fill();
      ctx.font = '800 14px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(40,24,10,.8)'; ctx.strokeText(ex.label, -4 * d, -18);
      ctx.fillStyle = '#ffeec0'; ctx.fillText(ex.label, -4 * d, -18);
      ctx.restore();
    }
  }

  drawFx(ctx, f) {
    const m = meta['vfx/' + f.key], im = img.get('vfx/' + f.key);
    if (!m || !im) return;
    const n = m.frames || 1, fi = Math.min(n - 1, Math.floor(f.t * 14));
    const fw = m.w / n, s = f.scale ?? 1;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.rot) ctx.rotate(f.rot);
    if (f.flipY) ctx.scale(1, -1);
    ctx.globalAlpha = (f.alpha ?? 1) * (n === 1 ? Math.max(0, 1 - f.t * 2.5) : 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(im, fi * fw, 0, fw, m.h, -fw * s / 2, -m.h * s / 2, fw * s, m.h * s);
    ctx.restore();
  }

  drawDebug(ctx, view) {
    const o = this.opts, m = this.map;
    if (o.grid) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= m.w; x++) { ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, m.h * TILE); }
      for (let y = 0; y <= m.h; y++) { ctx.moveTo(0, y * TILE); ctx.lineTo(m.w * TILE, y * TILE); }
      ctx.stroke(); ctx.restore();
    }
    if (o.colliders) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,40,40,.22)'; ctx.strokeStyle = 'rgba(255,60,60,.8)';
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (SOLID.has(m.grid[y][x])) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      for (const s of this.statics) { const f = s.foot; ctx.fillRect(f.x, f.y, f.w, f.h); ctx.strokeRect(f.x, f.y, f.w, f.h); }
      const b = this.boxOf(this.hero); ctx.strokeStyle = '#3cf'; ctx.strokeRect(b.x, b.y, b.w, b.h);
      for (const mo of this.monsters) { if (mo.dead) continue; const r = mo.hurtBox(); ctx.strokeStyle = '#fc3'; ctx.strokeRect(r.x, r.y, r.w, r.h); }
      if (this.lastStrike) { const r = this.lastStrike.box; ctx.strokeStyle = '#f3f'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h); }
      ctx.restore();
    }
    if (o.anchors) {
      ctx.save(); ctx.strokeStyle = '#ff0'; ctx.lineWidth = 1.5;
      const cross = (x, y) => { ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke(); };
      cross(this.hero.x, this.hero.y);
      for (const s of this.statics) cross(s.x, s.y);
      for (const mo of this.monsters) cross(mo.x, mo.y);
      // 정렬 기준선 (주인공 발)
      ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(0,255,255,.6)';
      ctx.beginPath(); ctx.moveTo(view.x, this.hero.y); ctx.lineTo(view.x + view.w, this.hero.y); ctx.stroke();
      ctx.restore();
    }
    if (o.seams) {
      const seams = this.ensureSeams();
      ctx.save(); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const s of seams) {
        ctx.strokeStyle = s.note ? 'rgba(255,170,0,.95)' : 'rgba(255,30,60,.9)';
        ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1); ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- 테스트 몬스터 (간단한 행동: 배회 → 추적 → 예고 → 돌진 → 쉬기) ----------
class Monster {
  constructor(id, x, y) {
    this.id = id; this.c = MON[id] || MON.slime_green;
    this.key = 'monsters/' + id;
    this.x = x; this.y = y; this.hx = x; this.hy = y;
    this.hp = this.c.hp; this.state = 'idle'; this.t = Math.random(); this.wt = 0;
    this.vx = 0; this.vy = 0; this.face = 1;
    this.flashT = 0; this.dead = false; this.deathT = 0; this.respawnT = 0;
    this.bodyW = 30; this.bodyH = 12;
    this.anim = Math.random() * 10;
  }
  m() { return meta[this.key]; }
  height() { const m = this.m(); return m ? (m.ay - m.top) * this.c.s : 50; }
  width() { const m = this.m(); return m ? m.w * this.c.s * 0.7 : 40; }
  hurtBox() { const w = this.width(), h = this.height(); return { x: this.x - w / 2, y: this.y - h, w, h }; }
  hurt(h, dmg, world) {
    if (this.dead) return;
    this.hp -= dmg; this.flashT = 0.14;
    const dx = this.x - h.x, dy = this.y - h.y, l = Math.hypot(dx, dy) || 1;
    this.vx = dx / l * 260; this.vy = dy / l * 260;
    this.state = 'stun'; this.t = 0;
    if (this.hp <= 0) {
      this.dead = true; this.deathT = 0; this.respawnT = 5;
      world.addFx('death_shadow_ring', this.x, this.y - 10, { scale: 0.8, alpha: 0.9 });
      world.sfx('kill');
    }
  }
  update(dt, w) {
    this.anim += dt;
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.dead) {
      this.deathT += dt;
      this.respawnT -= dt;
      if (this.respawnT <= 0) { this.dead = false; this.hp = this.c.hp; this.x = this.hx; this.y = this.hy; this.state = 'idle'; this.spawnT = 0.5; }
      return;
    }
    this.spawnT = Math.max(0, (this.spawnT || 0) - dt);
    this.t += dt;
    const h = w.hero;
    const dx = h.x - this.x, dy = h.y - this.y, d = Math.hypot(dx, dy);
    switch (this.state) {
      case 'stun': {
        const k = Math.max(0, 1 - dt * 8); this.vx *= k; this.vy *= k;
        w.move(this, this.vx * dt, this.vy * dt);
        if (this.t > 0.35) { this.state = 'chase'; this.t = 0; }
        return;
      }
      case 'idle': case 'wander': {
        if (d < 230) { this.state = 'chase'; this.t = 0; break; }
        if (this.t > this.wt) {
          this.t = 0; this.wt = 1 + Math.random() * 2;
          const a = Math.random() * Math.PI * 2, r = Math.random() < 0.4 ? 0 : 50;
          const tx = this.hx + Math.cos(a) * r, ty = this.hy + Math.sin(a) * r;
          this.goal = [tx, ty]; this.state = 'wander';
        }
        if (this.state === 'wander' && this.goal) this.walkTo(this.goal[0], this.goal[1], this.c.speed * 0.45, dt, w);
        break;
      }
      case 'chase': {
        if (d > 340 || Math.hypot(this.x - this.hx, this.y - this.hy) > 420) { this.state = 'wander'; this.goal = [this.hx, this.hy]; this.t = 0; break; }
        if (d < 64) { this.state = 'windup'; this.t = 0; this.aim = [dx / d, dy / d]; w.sfx('windup', { vol: 0.6 }); break; }
        this.walkTo(h.x, h.y, this.c.speed, dt, w);
        break;
      }
      case 'windup':
        if (this.t > 0.5) { this.state = 'lunge'; this.t = 0; this.hitDone = false; w.sfx('monsterSwing', { vol: 0.6 }); }
        break;
      case 'lunge': {
        const sp = 280 * (1 - this.t / 0.26);
        w.move(this, this.aim[0] * sp * dt, this.aim[1] * sp * dt);
        const hb = w.boxOf(h), mb = this.hurtBox();
        if (!this.hitDone && hb.x < mb.x + mb.w && hb.x + hb.w > mb.x && hb.y < mb.y + mb.h && hb.y + hb.h > mb.y - 4) {
          this.hitDone = true;
          if (h.hurt(this.x, this.y, 8, w)) w.addFx('impact_hit', h.x, h.y - 40, { scale: 0.6 });
        }
        if (this.t > 0.26) { this.state = 'rest'; this.t = 0; }
        break;
      }
      case 'rest':
        if (this.t > 0.8) { this.state = 'chase'; this.t = 0; }
        break;
    }
  }
  walkTo(tx, ty, sp, dt, w) {
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    if (d < 4) { if (this.state === 'wander') this.state = 'idle'; return; }
    if (Math.abs(dx) > 2) this.face = dx > 0 ? 1 : -1;
    const ox = this.x, oy = this.y;
    w.move(this, dx / d * sp * dt, dy / d * sp * dt);
    this.moving = Math.hypot(this.x - ox, this.y - oy) > 0.1;
  }
  draw(ctx) {
    const m = this.m(), im = img.get(this.key);
    if (!m || !im) return;
    const s = this.c.s;
    let sx = 1, sy = 1, ox = 0, oy = 0, rot = 0, alpha = 1;
    const a = this.anim;
    if (this.state === 'wander' || this.state === 'chase') {
      if (this.c.move === 'hop') { const p = Math.abs(Math.sin(a * 7)); oy = -p * 9; sy = 1 + (1 - p) * 0.08 - p * 0.03; sx = 2 - sy; }
      else if (this.c.move === 'run') { oy = -Math.abs(Math.sin(a * 11)) * 3; rot = Math.sin(a * 11) * 0.04; }
      else { rot = Math.sin(a * 8) * 0.08; oy = -Math.abs(Math.sin(a * 8)) * 2; }
    } else if (this.state === 'windup') {
      const p = Math.min(1, this.t / 0.5);
      sx = 1 + p * 0.12; sy = 1 - p * 0.12; ox = (Math.random() - 0.5) * 3 * p;
    } else if (this.state === 'lunge') { sx = 0.9; sy = 1.1; }
    else { sy = 1 + Math.sin(a * 3) * 0.025; sx = 2 - sy; }
    if (this.dead) { const p = Math.min(1, this.deathT / 0.45); sx = sy = 1 - p * 0.5; alpha = 1 - p; if (p >= 1) return; }
    if (this.spawnT > 0) alpha *= 1 - this.spawnT / 0.5;
    const flip = this.face * this.c.face < 0;
    ctx.save();
    ctx.translate(Math.round(this.x + ox), Math.round(this.y + oy));
    ctx.rotate(rot);
    ctx.scale((flip ? -1 : 1) * sx, sy);
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, -m.ax * s, -m.ay * s, m.w * s, m.h * s);
    const flash = this.flashT > 0 ? this.flashT / 0.14 : (this.state === 'windup' ? 0.35 * (Math.sin(this.t * 30) > 0 ? 1 : 0) : 0);
    if (flash > 0) {
      const t = tinted(this.key, this.state === 'windup' ? '#ff5030' : '#ffffff');
      if (t) { ctx.globalAlpha = alpha * flash * 0.8; ctx.drawImage(t, -m.ax * s, -m.ay * s, m.w * s, m.h * s); }
    }
    ctx.restore();
  }
}
