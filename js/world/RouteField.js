// 연결 필드: 마을과 마을 사이를 걸어서 잇는 길 (서쪽 = 앞 마을, 동쪽 = 다음 마을)
// - 왼쪽은 앞 마을 풍경, 오른쪽으로 갈수록 다음 마을 풍경(나무 종류·장식)이 나타나요.
// - 다음 마을이 아직 열리지 않았으면(앞 마을 보스를 아직 못 물리침) 동쪽 출구에 결계가 있어요 — 기존 마을 열림 규칙 그대로.
// - 몬스터 2구역 · 보물상자 1개 · 양쪽 표지판
import { drawTree, drawBush, drawFlower, drawRock, drawChest, drawSign } from '../render/sprites.js';
import { drawExitMarker, drawPine } from '../render/valleySprites.js';
import { TiledGround } from './tiledGround.js';
import { TILE, makeGrid, fillPath, fillEllipse, quad } from '../render/autoTerrain.js';
import { drawKitDecor } from './villageKits.js';
import { decorSolids, clearPaths, footRect } from './colliders.js';
import { getVillage } from '../data/villages.js';
import { ROUTES, chainOf, VILLAGE_GATES } from '../data/routes.js';

const W = 2400;
const H = 1280;
const ROAD_Y = 640;

function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 양식별 나무 · 장식 종류
const STYLE_DECOR = {
  valley: { tree: 'tree', extra: 'bush' },
  cube: { tree: 'cubeTree', extra: 'cubeBlock' },
  harbor: { tree: 'tree', extra: 'bush' },
  castle: { tree: 'tree', extra: 'rock' },
  forest: { tree: 'tree', extra: 'bush' },
  snow: { tree: 'pine', extra: 'snowman' },
};

export class RouteField {
  constructor(routeId) {
    const r = ROUTES.find((x) => x.id === routeId);
    this.route = r;
    this.id = r.id;
    this.name = r.name;
    this.village = r.from; // 상점·재료는 앞 마을 기준
    this.bgm = 'field';
    this.bounds = { x: 0, y: 140, w: W, h: H - 180 };
    this.spawn = { x: 140, y: ROAD_Y };
    const from = getVillage(r.from), to = getVillage(r.to);
    this.fromName = from.name;
    this.toName = to.name;
    const fromGate = VILLAGE_GATES[r.exitFrom];
    const toGate = VILLAGE_GATES.west;
    this.exits = [
      { id: 'toFrom', rect: { x: 0, y: ROAD_Y - 70, w: 36, h: 140 }, to: chainOf(r.from).scene, spawn: fromGate.spawn, label: `← ${from.name}`, dir: 'left', marker: { x: 80, y: ROAD_Y - 40 } },
      { id: 'toNext', rect: { x: W - 36, y: ROAD_Y - 70, w: 36, h: 140 }, to: chainOf(r.to).scene, spawn: toGate.spawn, label: `${to.name} →`, dir: 'right', marker: { x: W - 80, y: ROAD_Y - 40 }, needVillage: r.to },
    ];
    this.interactables = [
      { id: `${r.id}_chest`, kind: 'chest', golden: false, x: 1210, y: 420, r: 70, label: '상자 열기', headY: -52 },
    ];
    this.zones = [
      { id: `${r.id}_a`, rect: { x: 520, y: 760, w: 560, h: 360 }, types: [r.mobs[0]], max: 4, respawn: 10 },
      { id: `${r.id}_b`, rect: { x: 1400, y: 200, w: 600, h: 300 }, types: [r.mobs[1]], max: 4, respawn: 11 },
    ];
    this.areas = [];
    this.tiles = this.buildTiles();
    this.decor = [];
    this.buildDecor();
    this.decor = clearPaths(this.decor, { spec: this.tiles.spec, exits: this.exits, interactables: this.interactables });
    this.staticSolids = [
      ...decorSolids(this.decor),
      footRect(260, ROAD_Y - 70, 30), footRect(W - 260, ROAD_Y - 70, 30), // 표지판
      { x: 0, y: 0, w: W, h: 140 }, { x: 0, y: H - 40, w: W, h: 40 },
    ];
  }

  buildTiles() {
    const w = Math.ceil(W / TILE) + 1, h = Math.ceil(H / TILE) + 1;
    const base = this.route.ground === 'forest' ? ',' : '.';
    const g = makeGrid(w, h, base);
    // 굽이치는 큰길 (서쪽 입구 → 동쪽 출구)
    const pts = [
      ...quad([0, ROAD_Y], [380, ROAD_Y + 60], [700, ROAD_Y + 10]),
      ...quad([700, ROAD_Y + 10], [1050, ROAD_Y - 90], [1300, ROAD_Y - 20]),
      ...quad([1300, ROAD_Y - 20], [1650, ROAD_Y + 80], [1950, ROAD_Y + 10]),
      ...quad([1950, ROAD_Y + 10], [2200, ROAD_Y - 30], [W + 60, ROAD_Y]),
    ];
    fillPath(g, pts, 40, '=', [base]);
    // 보물상자 쉼터로 가는 샛길
    fillPath(g, [[1180, ROAD_Y - 40], [1210, 460]], 26, '=', [base]);
    fillEllipse(g, 1210 / TILE, 440 / TILE, 1.4, 0.9, '=', [base]);
    // 앞 마을 쪽 작은 연못 (항구 길·숲길은 물가 분위기)
    if (['harbor', 'forest', 'valley'].includes(this.route.fromStyle) || this.route.toStyle === 'harbor') fillEllipse(g, 2.2 + (this.route.toStyle === 'harbor' ? 30 : 0), 15.5, 2.2, 1.3, '~', [base]);
    const spec = { w, h, grid: g };
    if (this.route.ground === 'snow') spec.style = 'snow';
    return new TiledGround(spec);
  }

  buildDecor() {
    const rnd = seeded(this.id.length * 7919 + this.id.charCodeAt(6) * 131);
    const A = STYLE_DECOR[this.route.fromStyle] || STYLE_DECOR.valley;
    const B = STYLE_DECOR[this.route.toStyle] || STYLE_DECOR.valley;
    // 동쪽으로 갈수록 다음 마을 양식이 많아짐
    const styleAt = (x) => (rnd() < x / W ? B : A);
    // 위·아래 숲 경계
    for (let x = 30; x < W; x += 78) {
      const s1 = styleAt(x), s2 = styleAt(x);
      this.decor.push({ type: s1.tree, x: x + rnd() * 20, y: 190 + rnd() * 30, s: 0.95 + rnd() * 0.3, styleSet: s1 });
      this.decor.push({ type: s2.tree, x: x + rnd() * 20, y: H - 50 + rnd() * 10, s: 0.95 + rnd() * 0.3, styleSet: s2 });
    }
    // 길가 풍경 (길·출구·상자 자리는 clearPaths가 비워 둠)
    let guard = 0;
    while (this.decor.length < 120 && guard++ < 3000) {
      const x = 80 + rnd() * (W - 160);
      const y = 260 + rnd() * (H - 360);
      if (this.decor.some((d) => Math.hypot(d.x - x, d.y - y) < 80)) continue;
      const st = styleAt(x);
      const r = rnd();
      const inZone = this.zones.some((z) => x > z.rect.x && x < z.rect.x + z.rect.w && y > z.rect.y && y < z.rect.y + z.rect.h);
      const type = inZone ? (r < 0.6 ? 'bush' : st.extra) : (r < 0.45 ? st.tree : r < 0.7 ? 'bush' : r < 0.85 ? st.extra : 'rock');
      this.decor.push({ type, x, y, s: 0.8 + rnd() * 0.35, styleSet: st });
    }
    this.flowers = [];
    const colors = this.route.ground === 'snow' ? ['#ffffff', '#cfe4ff'] : ['#ff7aa8', '#ffd84d', '#ffffff', '#b38cff'];
    for (let i = 0; i < 140; i++) this.flowers.push({ x: rnd() * W, y: 230 + rnd() * (H - 300), c: colors[Math.floor(rnd() * colors.length)] });
  }

  locked(save, ex) {
    return !!ex.needVillage && !save?.unlockedVillages.includes(ex.needVillage) && !this.allOpen;
  }

  // 출구가 막혀 있는지 (WorldManager.checkExits가 물어봐요)
  exitBlocked(ex, save) {
    return this.locked(save, ex);
  }

  activeExits() {
    return this.exits;
  }

  solids(save, world) {
    this.allOpen = !!world?.game?.getEffectiveSettings?.().allVillagesOpen;
    const list = [...this.staticSolids];
    // 아직 열리지 않은 다음 마을: 출구 앞 결계 (기존 규칙: 앞 마을 보스를 물리쳐야 다음 마을이 열려요)
    const ex = this.exits[1];
    if (this.locked(save, ex)) list.push({ x: W - 150, y: ROAD_Y - 110, w: 30, h: 220 });
    return list;
  }

  drawGround(ctx, cam, w, h, t, save) {
    const tiled = this.tiles.draw(ctx, cam, w, h, t);
    if (!tiled) {
      ctx.fillStyle = this.route.ground === 'snow' ? '#e8f0fa' : '#7cc25a';
      ctx.fillRect(cam.x, cam.y, w, h);
    }
    for (const f of this.flowers) {
      if (f.x < cam.x - 20 || f.x > cam.x + w + 20 || f.y < cam.y - 20 || f.y > cam.y + h + 20) continue;
      drawFlower(ctx, f.x, f.y, f.c);
    }
    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
    // 결계
    const ex = this.exits[1];
    if (this.locked(save, ex)) {
      ctx.save();
      const a = 0.35 + Math.sin(t * 3) * 0.12;
      const g = ctx.createLinearGradient(W - 150, 0, W - 110, 0);
      g.addColorStop(0, `rgba(160,120,255,0)`); g.addColorStop(0.5, `rgba(160,120,255,${a})`); g.addColorStop(1, 'rgba(160,120,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(W - 160, ROAD_Y - 130, 60, 260);
      ctx.restore();
    }
  }

  drawables(t, player, save) {
    const list = this.decor.map((d) => ({
      y: d.y,
      draw: (ctx) => {
        const style = d.styleSet === STYLE_DECOR.snow ? 'snow' : d.styleSet === STYLE_DECOR.cube ? 'cube' : null;
        if (style && drawKitDecor(ctx, style, d)) return;
        if (d.type === 'tree') drawTree(ctx, d.x, d.y, d.s, this.route.ground === 'forest' ? '#3fa35a' : undefined);
        else if (d.type === 'pine') drawPine(ctx, d.x, d.y, d.s);
        else if (d.type === 'cubeTree') drawPine(ctx, d.x, d.y, d.s * 0.9, false);
        else if (d.type === 'bush') drawBush(ctx, d.x, d.y, d.s, this.route.ground === 'snow' ? '#dfeaf7' : undefined);
        else if (d.type === 'rock') drawRock(ctx, d.x, d.y, d.s);
        else if (d.type === 'cubeBlock' && !drawKitDecor(ctx, 'cube', d)) drawRock(ctx, d.x, d.y, d.s);
        else if (d.type === 'snowman' && !drawKitDecor(ctx, 'snow', d)) drawRock(ctx, d.x, d.y, d.s);
      },
    }));
    list.push({ y: ROAD_Y - 70, draw: (ctx) => drawSign(ctx, 260, ROAD_Y - 70, `← ${this.fromName}`) });
    list.push({ y: ROAD_Y - 70, draw: (ctx) => drawSign(ctx, W - 260, ROAD_Y - 70, `${this.toName} →`) });
    for (const o of this.interactables) {
      list.push({ y: o.y, draw: (ctx) => drawChest(ctx, o.x, o.y, { golden: o.golden, opened: save?.openedChests.includes(o.id), t }) });
    }
    return list;
  }

  drawOverlay(ctx, t, player, save) {
    const ex = this.exits[1];
    if (!this.locked(save, ex) || player.x < W - 420) return;
    ctx.save();
    ctx.font = 'bold 15px NanumSquareRound, Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2b2140';
    const msg = `🔒 ${this.fromName} 보스를 물리치면 ${this.toName}(으)로 가는 길이 열려요`;
    ctx.strokeText(msg, W - 300, ROAD_Y - 150);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(msg, W - 300, ROAD_Y - 150);
    ctx.restore();
  }
}
