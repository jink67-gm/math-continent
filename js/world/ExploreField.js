// ⑭ 탐험 필드: 마을 북쪽 계단 → 굽이진 길 → (다음 필드) → 던전 입구
// - 아래쪽 = 마을(또는 앞 필드), 위쪽 = 다음 필드 또는 던전 입구
// - 마지막 필드 위쪽에는 절벽 동굴(계곡·항구·설산) 또는 석조 아치(입체 도시·비례 왕국·원형 숲 유적)가
//   주변 지형(절벽·성벽)과 이어진 모습으로 있고, 들어가는 판정 칸 = 그림의 입구 자리
import { drawTree, drawBush, drawFlower, drawRock, drawChest } from '../render/sprites.js';
import { drawExitMarker, drawPine } from '../render/valleySprites.js';
import { TiledGround } from './tiledGround.js';
import { TILE, makeGrid, fillPath, fillEllipse, fillRect, quad } from '../render/autoTerrain.js';
import { drawKitDecor } from './villageKits.js';
import { decorSolids, clearPaths, footRect, roadNear } from './colliders.js';
import { drawSignSet } from './buildingSet.js';
import { assets } from '../render/AssetManager.js';
import { wallDrawables, archDrawable, archSolids, wallArtReady } from '../render/dungeonWalls.js';
import { TRAILS, trailSceneId, TRAIL_SIZE, TRAIL_BOTTOM_SPAWN, TRAIL_TOP_SPAWN, VILLAGE_NORTH_SPAWN } from '../data/routes.js';
import { getVillage } from '../data/villages.js';
import { VILLAGE_CONTENT } from '../data/villageContent.js';

const W = TRAIL_SIZE.w;
const H = TRAIL_SIZE.h;
const CX = 800;
const CLIFF_H = 285;

function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STYLE = {
  valley: { tree: 'tree', extra: 'bush', base: '.', road: '=' },
  cube: { tree: 'cubeTree', extra: 'cubeBlock', base: '.', road: 'c' },
  harbor: { tree: 'tree', extra: 'rock', base: '.', road: '=' },
  castle: { tree: 'tree', extra: 'rock', base: '.', road: 'c' },
  forest: { tree: 'tree', extra: 'bush', base: ',', road: '=' },
  snow: { tree: 'pine', extra: 'snowman', base: '.', road: '=' },
};

// 던전 색 (석조 아치 색을 던전 안 벽과 맞춤)
const DUNGEON_COLORS = { fractionValley: { wall: ['#4b3f5e', '#5d4f72'] } };
for (const c of VILLAGE_CONTENT) DUNGEON_COLORS[c.village] = { wall: c.dungeon.wall };

export class ExploreField {
  constructor(villageId, index) {
    const T = TRAILS[villageId];
    const f = T.fields[index];
    this.trail = T;
    this.index = index;
    this.last = index === T.fields.length - 1;
    this.style = T.style;
    this.S = STYLE[T.style] || STYLE.valley;
    this.id = trailSceneId(T.prefix, index);
    this.name = f.name;
    this.village = villageId;
    this.bgm = 'field';
    this.flavor = f.flavor;
    this.top = this.last ? CLIFF_H : 110;
    this.bounds = { x: 0, y: this.top - 10, w: W, h: H - this.top + 10 };
    this.spawn = { ...TRAIL_BOTTOM_SPAWN };
    const v = getVillage(villageId);
    const prevName = index === 0 ? v.name : T.fields[index - 1].name;
    const prevScene = index === 0 ? T.village : trailSceneId(T.prefix, index - 1);
    const prevSpawn = index === 0 ? VILLAGE_NORTH_SPAWN : TRAIL_TOP_SPAWN;
    this.prevName = prevName;
    this.exits = [
      { id: 'toPrev', rect: { x: CX - 70, y: H - 50, w: 140, h: 50 }, to: prevScene, spawn: prevSpawn, label: `${prevName} ↓`, dir: 'down', marker: { x: CX, y: H - 75 } },
    ];
    const dName = this.dungeonName();
    if (this.last) {
      // 던전 입구 (그림의 입구 자리와 같은 칸)
      this.exits.push({ id: 'toDungeon', rect: { x: CX - 50, y: CLIFF_H - 5, w: 100, h: 40 }, to: T.dungeon, spawn: { x: 210, y: 1540 }, label: dName, dir: 'up', marker: { x: CX, y: CLIFF_H + 95 } });
      this.nextName = dName;
    } else {
      const nx = T.fields[index + 1];
      this.exits.push({ id: 'toNext', rect: { x: CX - 70, y: 100, w: 140, h: 45 }, to: trailSceneId(T.prefix, index + 1), spawn: { ...TRAIL_BOTTOM_SPAWN }, label: `${nx.name} ↑`, dir: 'up', marker: { x: CX, y: 175 } });
      this.nextName = nx.name;
    }
    this.interactables = [
      { id: `${this.id}_chest`, kind: 'chest', golden: index % 2 === 1, x: index % 2 ? 1330 : 270, y: 1080, r: 70, label: index % 2 ? '수학 상자 열기' : '상자 열기', headY: -56 },
    ];
    const [m1, m2, m3] = f.mobs;
    this.zones = [
      { id: `${this.id}_a`, rect: { x: 900, y: 1300, w: 560, h: 420 }, types: [m1, ...(m3 ? [m3] : [])], max: 4, respawn: 10 },
      { id: `${this.id}_b`, rect: { x: 140, y: 600, w: 560, h: 420 }, types: [m2], max: 4, respawn: 11 },
      { id: `${this.id}_c`, rect: { x: 950, y: 520, w: 480, h: 360 }, types: [m1, m2], max: 3, respawn: 12 },
    ];
    this.areas = [{ id: `${this.id}_area`, name: f.name, rect: { x: 0, y: 0, w: W, h: H } }];
    this.tiles = this.buildTiles();
    this.decor = [];
    this.buildDecor();
    this.decor = clearPaths(this.decor, { spec: this.tiles.spec, exits: this.exits, interactables: this.interactables });
    const wet = (x, y) => { const row = this.tiles.spec.grid[Math.floor(y / TILE)]; const c = row && row[Math.floor(x / TILE)]; return c === '~'; };
    this.decor = this.decor.filter((d) => !wet(d.x, d.y) && !wet(d.x, d.y - 30));
    this.decor = this.decor.filter((d) => !(this.last && d.y < CLIFF_H + 60 && Math.abs(d.x - CX) < 260));
    this.flowers = this.flowers.filter((fl) => !roadNear(this.tiles.spec, fl.x, fl.y, 22, 16, 16) && !wet(fl.x, fl.y));
    this.staticSolids = [
      ...decorSolids(this.decor),
      footRect(CX + 150, H - 140, 30), // 표지판
      { x: 0, y: H - 10, w: W, h: 10 },
    ];
    if (this.last) {
      this.staticSolids.push(...this.entranceSolids());
    } else {
      this.staticSolids.push(footRect(CX + 150, 250, 30));
      // 위쪽 숲 경계 (가운데 길만 열림)
      this.staticSolids.push({ x: 0, y: 0, w: CX - 70, h: 150 }, { x: CX + 70, y: 0, w: W - CX - 70, h: 150 });
    }
  }

  dungeonName() {
    const T = this.trail;
    if (T.dungeon === 'fvCave') return '계곡 동굴';
    const c = VILLAGE_CONTENT.find((x) => x.village === this.village);
    return c?.dungeon?.name || '던전';
  }

  buildTiles() {
    const w = Math.ceil(W / TILE) + 1, h = Math.ceil(H / TILE) + 1;
    const { base, road } = this.S;
    const g = makeGrid(w, h, base);
    if (this.last && this.trail.entrance === 'cave') {
      // 위쪽 절벽 (마을 북쪽과 같은 짜임: 언덕 위 + 절벽면)
      fillRect(g, 0, 0, w - 1, 3, 'h');
      fillRect(g, 0, 4, w - 1, 4, '#');
    }
    // 굽이진 길: 아래(마을) → 위(다음 필드·던전 입구)
    const topY = this.last ? CLIFF_H + 20 : -40;
    // 필드마다 길 모양이 달라지게 (홀수 번째 필드는 좌우를 뒤집은 굽이)
    const mx = (x) => (this.index % 2 ? W - x : x);
    const pts = [
      [CX, H + 40], [CX, H - 220],
      ...quad([CX, H - 220], [mx(430), H - 520], [mx(620), H - 820]),
      ...quad([mx(620), H - 820], [mx(1150), H - 1050], [mx(1000), H - 1330]),
      ...quad([mx(1000), H - 1330], [mx(560), H - 1500], [CX, Math.max(topY + 160, 560)]),
      [CX, topY],
    ];
    fillPath(g, pts, 46, road, [base]);
    // 상자 쉼터로 가는 샛길
    const chest = this.interactables[0];
    // 큰길에서 상자 쪽으로 가장 가까운 점부터 샛길
    const near = pts.reduce((a, p) => (Math.abs(p[1] - 1100) < Math.abs(a[1] - 1100) ? p : a), pts[0]);
    fillPath(g, [[near[0], near[1]], [chest.x, 1100]], 34, road, [base]);
    fillEllipse(g, chest.x / TILE, 1100 / TILE, 1.5, 1.0, road, [base]);
    // 양식별 물가
    if (this.style === 'harbor') { fillRect(g, 0, 8, 2, h - 6, '~'); fillEllipse(g, 22, 12, 3.2, 2.2, '~', [base]); }
    if (this.style === 'valley' || this.style === 'forest') fillEllipse(g, 20.5, 23.5, 2.6, 1.6, '~', [base]);
    if (this.style === 'snow') fillEllipse(g, 4, 20, 3, 1.8, '~', [base]);
    const spec = { w, h, grid: g, faceShift: -35 };
    if (this.style === 'snow') spec.style = 'snow';
    return new TiledGround(spec);
  }

  buildDecor() {
    const rnd = seeded(this.id.charCodeAt(0) * 977 + this.index * 131 + 7);
    const S = this.S;
    // 양옆 숲 경계
    for (let y = this.top + 60; y < H; y += 82) {
      if (this.style !== 'harbor') this.decor.push({ type: S.tree, x: 30 + rnd() * 22, y: y + rnd() * 20, s: 0.95 + rnd() * 0.3 });
      this.decor.push({ type: S.tree, x: W - 30 - rnd() * 22, y: y + rnd() * 20, s: 0.95 + rnd() * 0.3 });
    }
    if (!this.last) for (let x = 40; x < W; x += 80) this.decor.push({ type: S.tree, x: x + rnd() * 20, y: 150 + rnd() * 14, s: 0.95 + rnd() * 0.3 });
    // 길가 풍경 (길·출구·상자 자리는 clearPaths가 비워 둠)
    const dense = this.style === 'forest' ? 150 : 110;
    let guard = 0;
    while (this.decor.length < dense && guard++ < 4000) {
      const x = 90 + rnd() * (W - 180);
      const y = this.top + 120 + rnd() * (H - this.top - 220);
      if (this.decor.some((d) => Math.hypot(d.x - x, d.y - y) < 78)) continue;
      const inZone = this.zones.some((z) => x > z.rect.x && x < z.rect.x + z.rect.w && y > z.rect.y && y < z.rect.y + z.rect.h);
      const r = rnd();
      const type = inZone ? (r < 0.6 ? 'bush' : S.extra) : (r < 0.5 ? S.tree : r < 0.72 ? 'bush' : r < 0.86 ? S.extra : 'rock');
      this.decor.push({ type, x, y, s: 0.8 + rnd() * 0.35 });
    }
    this.flowers = [];
    const colors = this.style === 'snow' ? ['#ffffff', '#cfe4ff'] : ['#ff7aa8', '#ffd84d', '#ffffff', '#b38cff'];
    for (let i = 0; i < 150; i++) this.flowers.push({ x: rnd() * W, y: this.top + 60 + rnd() * (H - this.top - 80), c: colors[Math.floor(rnd() * colors.length)] });
  }

  // ---------- 던전 입구 ----------
  // gate/ruin: 위쪽에 석조 성벽 + 가운데 아치 (던전 안 벽과 같은 보랏빛 석조 그림)
  entranceWalls() {
    return [
      { x: 0, y: 200, w: CX - 90, h: 80 },
      { x: CX + 90, y: 200, w: W - CX - 90, h: 80 },
    ];
  }
  entranceDoor() { return { x: CX - 90, y: 200, w: 180, h: 80 }; }

  entranceSolids() {
    if (this.trail.entrance === 'cave') return [{ x: 0, y: 0, w: CX - 70, h: CLIFF_H }, { x: CX + 70, y: 0, w: W - CX - 70, h: CLIFF_H }, { x: CX - 70, y: 0, w: 140, h: CLIFF_H - 20 }];
    const list = [...this.entranceWalls(), ...archSolids(this.entranceDoor()), { x: 0, y: 0, w: W, h: 200 }];
    return list;
  }

  entranceDrawables(t) {
    const T = this.trail;
    if (T.entrance === 'cave') {
      return [{
        y: CLIFF_H + 30,
        draw: (ctx) => {
          // 절벽면에 붙은 동굴 입구 (그림 아래 가운데 = 들어가는 칸)
          const key = 'dungeon3/cave_entrance';
          if (assets.get(key)) {
            assets.draw(ctx, key, CX, CLIFF_H + 34, { height: 200, tint: this.style === 'snow' ? '#dfefff' : null, tintA: this.style === 'snow' ? 0.35 : 0 });
          }
        },
      }];
    }
    if (!wallArtReady()) return [];
    const colors = DUNGEON_COLORS[this.village];
    const out = [];
    const walls = wallDrawables(this.entranceWalls(), colors, {
      posts: (x, i, end) => (end ? null : Math.abs(x - CX) < 260 ? 'pillar_torch_b' : T.entrance === 'ruin' ? 'pillar_vine' : null),
    });
    if (walls) out.push(...walls.map((d) => ({ y: d.y, draw: (ctx) => d.draw(ctx, t) })));
    const arch = archDrawable(this.entranceDoor(), colors, () => true, () => {});
    if (arch) out.push({ y: arch.y, draw: (ctx) => arch.draw(ctx, t) });
    // 원형 숲 유적: 아치 양옆 고대 돌기둥
    if (T.entrance === 'ruin') {
      for (const dx of [-170, 170]) {
        out.push({ y: 330, draw: (ctx) => assets.draw(ctx, 'dungeon3/tall_ancient_pillar', CX + dx, 334, { height: 130 }) });
      }
    }
    // 입체 도시: 큐브 장치 기둥
    if (this.style === 'cube') {
      for (const dx of [-160, 160]) out.push({ y: 332, draw: (ctx) => assets.draw(ctx, 'pack4/cube/cube_portal_stand', CX + dx, 336, { height: 96 }) });
    }
    return out;
  }

  activeExits() { return this.exits; }

  solids() {
    return this.staticSolids;
  }

  drawGround(ctx, cam, w, h, t) {
    const tiled = this.tiles.draw(ctx, cam, w, h, t);
    if (!tiled) {
      ctx.fillStyle = this.style === 'snow' ? '#e8f0fa' : '#7cc25a';
      ctx.fillRect(cam.x, cam.y, w, h);
    }
    if (this.style === 'forest') {
      ctx.fillStyle = 'rgba(16, 54, 34, 0.2)';
      ctx.fillRect(cam.x, cam.y, w, h);
    }
    for (const f of this.flowers) {
      if (f.x < cam.x - 20 || f.x > cam.x + w + 20 || f.y < cam.y - 20 || f.y > cam.y + h + 20) continue;
      drawFlower(ctx, f.x, f.y, f.c);
    }
    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
  }

  drawables(t, player, save) {
    const list = this.decor.map((d) => ({
      y: d.y,
      draw: (ctx) => {
        const kit = this.style === 'snow' ? 'snow' : this.style === 'cube' ? 'cube' : null;
        if (kit && drawKitDecor(ctx, kit, d)) return;
        if (d.type === 'tree') drawTree(ctx, d.x, d.y, d.s, this.style === 'forest' ? '#3fa35a' : undefined);
        else if (d.type === 'pine' || d.type === 'cubeTree') drawPine(ctx, d.x, d.y, d.s * (d.type === 'cubeTree' ? 0.9 : 1), d.type === 'pine');
        else if (d.type === 'bush') drawBush(ctx, d.x, d.y, d.s, this.style === 'snow' ? '#dfeaf7' : undefined);
        else drawRock(ctx, d.x, d.y, d.s);
      },
    }));
    // 표지판: 아래 = 돌아가는 곳, 위 = 이어지는 곳
    list.push({ y: H - 140, draw: (ctx) => drawSignSet(ctx, CX + 150, H - 140, `↓ ${this.prevName}`) });
    if (!this.last) list.push({ y: 250, draw: (ctx) => drawSignSet(ctx, CX + 150, 250, `↑ ${this.nextName}`) });
    else list.push({ y: CLIFF_H + 150, draw: (ctx) => drawSignSet(ctx, CX + 170, CLIFF_H + 150, this.nextName) });
    for (const o of this.interactables) {
      list.push({ y: o.y, draw: (ctx) => drawChest(ctx, o.x, o.y, { golden: o.golden, opened: save?.openedChests.includes(o.id), t }) });
    }
    if (this.last) list.push(...this.entranceDrawables(t));
    return list;
  }
}
