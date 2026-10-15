// 새 에셋(타일·자연물·마을 소품·건물)으로 만든 장면의 공통 틀
// 기존 장면과 같은 약속(bounds·spawn·zones·exits·interactables·solids·drawGround·drawables)을 지켜서
// 전투·수학 문제·퀘스트·저장은 기존 시스템이 그대로 처리합니다.
//
// 좌표 약속: 플레이어 좌표(player.y)는 몸 가운데, 발은 그보다 FOOT(21px) 아래.
//  - 물체는 "발(바닥) 위치"로 배치하고, 앞뒤 정렬 값은 바닥 - FOOT 로 넘겨 플레이어와 맞춤
//  - 충돌 사각형도 FOOT 만큼 위로 올려서 실제로는 "발"이 부딪히게 함
import { assets } from '../render/AssetManager.js';
import { TILE } from '../render/tileTerrain.js';
import { buildAutoTerrain, autoReady, loadAuto, drawAutoShimmer } from '../render/autoTerrain.js';
import { drawNpc3 } from '../render/envArt.js';

// 예전 NPC(npc2) 이름 → 새 NPC 애니메이션(npc3)
const NPC2TO3 = { elder: 'math_sage', merchant: 'traveling_merchant', blacksmith: 'blacksmith', innkeeper: 'innkeeper', guard: 'town_guard', adventurer: 'adventurer', scholar: 'librarian', kid: 'village_child', farmer: 'farmer', priestess: 'healer', mystic: 'mysterious_mage', scout: 'village_guide' };
// 예전 건물(buildings2) → 새 건물 17종(buildings3)
const B2TO3 = { house_red_a: 'house_red', house_blue: 'house_blue_large', house_green: 'general_shop', house_red_b: 'cottage_thatched', market_stall: 'market_stall', blacksmith_workshop: 'blacksmith' };
import { drawExitMarker } from '../render/valleySprites.js';

const FOOT = 21;
const SOLID_CELLS = new Set(['~', '#']);

// 그림별 크기(s)·충돌 바닥 너비 비율(fw)·높이(fh, px)·가림 투명(fade)
export const CATALOG = {
  'nature/tree_big': { s: 0.42, fw: 0.2, fh: 18, fade: true },
  'nature/tree_big_yellow': { s: 0.42, fw: 0.2, fh: 18, fade: true },
  'nature/tree_pine': { s: 0.42, fw: 0.18, fh: 16, fade: true },
  'nature/tree_small': { s: 0.45, fw: 0.2, fh: 14, fade: true },
  'nature/tree_young': { s: 0.45, fw: 0.18, fh: 12, fade: true },
  'nature/bush': { s: 0.32, fw: 0.7, fh: 16 },
  'nature/bush_flower': { s: 0.32, fw: 0.7, fh: 16 },
  'nature/bush_berry': { s: 0.32, fw: 0.7, fh: 16 },
  'nature/bush_yellow': { s: 0.32, fw: 0.7, fh: 16 },
  'nature/rock_big': { s: 0.4, fw: 0.8, fh: 34, fade: true },
  'nature/rock_mid': { s: 0.38, fw: 0.8, fh: 26 },
  'nature/rock_small': { s: 0.36, fw: 0.78, fh: 20 },
  'nature/rock_tiny': { s: 0.34, fw: 0.7, fh: 14 },
  'village2/well': { s: 0.36, fw: 0.8, fh: 40 },
  'village2/fence_long': { s: 0.36, fw: 0.97, fh: 12 },
  'village2/fence_short': { s: 0.36, fw: 0.95, fh: 12 },
  'village2/fence_post': { s: 0.36, fw: 0.9, fh: 18 },
  'village2/gate': { s: 0.36, fw: 0.95, fh: 14 },
  'village2/sign': { s: 0.34, fw: 0.22, fh: 10 },
  'village2/signpost': { s: 0.36, fw: 0.22, fh: 10 },
  'village2/bench': { s: 0.32, fw: 0.9, fh: 16 },
  'village2/bench_back': { s: 0.32, fw: 0.9, fh: 18 },
  'village2/lamp_post': { s: 0.38, fw: 0.3, fh: 10 },
  'village2/lamp_hanging': { s: 0.4, fw: 0.25, fh: 10, footX: -0.18 },
  'village2/barrel': { s: 0.26, fw: 0.8, fh: 16 },
  'village2/planter': { s: 0.3, fw: 0.92, fh: 18 },
  'buildings2/house_red_a': { s: 1.0, fw: 0.84, fh: 66, fade: true },
  'buildings2/house_red_b': { s: 1.0, fw: 0.86, fh: 62, fade: true },
  'buildings2/house_blue': { s: 1.0, fw: 0.84, fh: 66, fade: true },
  'buildings2/house_green': { s: 1.0, fw: 0.84, fh: 66, fade: true },
  'buildings2/watchtower': { s: 1.0, fw: 0.78, fh: 48, fade: true },
  'buildings2/market_stall': { s: 1.0, fw: 0.9, fh: 56, fade: true },
  'buildings2/blacksmith_workshop': { s: 1.0, fw: 0.9, fh: 62, fade: true },
};
const NPC_CONF = { s: 0.47, fw: 0.3, fh: 12 };

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export class AssetScene {
  // def: { id, name, village, bgm, w, h, grid, plazas, spawn:[x,y], objects:[{k,x,y}], npcs:[{id,x,y}],
  //        zones, exits:[{rect(타일), to, spawn(px), label, dir, marker(타일)}], interactables, areas, scatter }
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.village = def.village;
    this.bgm = def.bgm;
    this.map = { w: def.w, h: def.h, grid: def.grid, plazas: (def.plazas || []).map(([x, y, r]) => [x * TILE, y * TILE, r]) };
    this.bounds = { x: 0, y: 0, w: def.w * TILE, h: def.h * TILE };
    this.spawn = { x: def.spawn[0] * TILE, y: def.spawn[1] * TILE };
    const px = (r) => ({ x: r.x * TILE, y: r.y * TILE, w: r.w * TILE, h: r.h * TILE });
    this.zones = (def.zones || []).map((z) => ({ ...z, rect: px(z.rect) }));
    this.areas = (def.areas || []).map((a) => ({ ...a, rect: px(a.rect) }));
    this.exits = (def.exits || []).map((e) => ({ ...e, rect: px(e.rect), marker: { x: e.marker[0] * TILE, y: e.marker[1] * TILE } }));
    this.interactables = (def.interactables || []).map((o) => ({ ...o, x: o.x * TILE, y: o.y * TILE - FOOT }));
    this.objects = [];
    for (const o of def.objects || []) this.addObject(o.k, o.x, o.y, o);
    for (const n of def.npcs || []) {
      const o = this.addObject(`npc2/${n.id}`, n.x, n.y, { conf: NPC_CONF, npc: true });
      if (o) o.npc3 = NPC2TO3[n.id];
    }
    if (def.scatter) this.scatter(def.scatter);
    this.solidList = this.buildSolids();
    this.terrain = null;
    this.time = 0;
    if (autoReady()) this.terrain = buildAutoTerrain(this.map);
    else loadAuto().then(() => { this.terrain = buildAutoTerrain(this.map); });
    // 이 장면에서 쓰는 그림을 미리 불러오기
    for (const o of this.objects) assets.load(o.key);
  }

  addObject(key, x, y, extra = {}) {
    const bname = key.startsWith('buildings2/') ? B2TO3[key.slice(11)] : null;
    if (bname && assets.meta[`buildings3/${bname}`]) {
      const base = CATALOG[key];
      key = `buildings3/${bname}`;
      extra = { ...extra, conf: { ...base, s: 240 / assets.meta[key].w } };
    }
    const c = extra.conf || CATALOG[key];
    const m = assets.meta[key];
    if (!c || !m) return null;
    const s = c.s * (extra.s ?? 1);
    const w = m.w * s;
    const fx = x * TILE + (c.footX || 0) * w;
    const fw = w * c.fw;
    const o = {
      key, x: x * TILE, y: y * TILE, s, w, h: m.h * s, ax: m.ax * s, ay: m.ay * s, flip: !!extra.flip,
      fade: !!c.fade, alpha: 1, npc: !!extra.npc,
      foot: { x: fx - fw / 2, y: y * TILE - c.fh, w: fw, h: c.fh },
    };
    this.objects.push(o);
    return o;
  }

  cell(x, y) { return this.map.grid[Math.floor(y)]?.[Math.floor(x)]; }

  // 자연물 흩뿌리기: 길·물·절벽·다른 물체·몬스터 구역 가운데를 피해서
  scatter({ seed = 1, count = 40, kinds, avoid = [], margin = 1.3, cells = ['.', ',', 'h'] }) {
    const R = seeded(seed);
    let placed = 0, tries = 0;
    while (placed < count && tries++ < count * 60) {
      const x = 1 + R() * (this.def.w - 2), y = 1.5 + R() * (this.def.h - 2.5);
      if (!cells.includes(this.cell(x, y))) continue;
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) if (!cells.includes(this.cell(x + dx * 0.7, y + dy * 0.5))) ok = false;
      if (!ok) continue;
      if (avoid.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)) continue;
      if (this.objects.some((o) => Math.hypot(o.x / TILE - x, (o.y / TILE - y) * 1.4) < margin + (o.w > 150 ? 1.2 : 0))) continue;
      const k = kinds[Math.floor(R() * kinds.length)];
      this.addObject(k, x, y, { flip: R() < 0.5, s: 0.9 + R() * 0.2 });
      placed++;
    }
  }

  buildSolids() {
    const list = [];
    const { w, h, grid } = this.map;
    for (let y = 0; y < h; y++) {
      let run = -1;
      for (let x = 0; x <= w; x++) {
        const solid = x < w && SOLID_CELLS.has(grid[y][x]);
        if (solid && run < 0) run = x;
        if (!solid && run >= 0) { list.push({ x: run * TILE, y: y * TILE - FOOT, w: (x - run) * TILE, h: TILE }); run = -1; }
      }
    }
    // 물은 가장자리를 조금 안쪽으로 (물가 바위 둑 위까지는 걸어갈 수 있게)
    for (const r of list) {
      const cy = Math.round((r.y + FOOT) / TILE), cx = Math.round(r.x / TILE);
      if (grid[cy]?.[cx] === '~') { r.x += 10; r.w -= 20; r.y += 10; r.h -= 20; }
    }
    for (const o of this.objects) list.push({ x: o.foot.x, y: o.foot.y - FOOT, w: o.foot.w, h: o.foot.h });
    return list;
  }

  solids() { return this.solidList; }

  drawGround(ctx, cam, w, h, t) {
    this.time = t;
    const W = this.bounds.w, H = this.bounds.h;
    if (!this.terrain) {
      ctx.fillStyle = '#5f9a3a';
      ctx.fillRect(cam.x, cam.y, w, h);
      return;
    }
    const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y));
    const sw = Math.min(W - sx, Math.ceil(w) + 2), sh = Math.min(H - sy, Math.ceil(h) + 2);
    if (sw > 0 && sh > 0) {
      ctx.drawImage(this.terrain.canvas, sx, sy, sw, sh, sx, sy, sw, sh);
      drawAutoShimmer(ctx, this.terrain, { x: sx, y: sy, w: sw, h: sh }, t);
    }
    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
  }

  drawables(t, player) {
    const list = [];
    // 플레이어 그림이 차지하는 영역 (가림 판정)
    const pr = player ? { x: player.x - 22, y: player.y - 58, w: 44, h: 80, foot: player.y + FOOT } : null;
    for (const o of this.objects) {
      list.push({
        y: o.y - FOOT,
        draw: (ctx) => {
          let target = 1;
          if (o.fade && pr && pr.foot < o.y - 4) {
            const r = { x: o.x - o.ax, y: o.y - o.ay, w: o.w, h: o.ay };
            if (pr.x < r.x + r.w && pr.x + pr.w > r.x && pr.y < r.y + r.h && pr.y + pr.h > r.y) target = 0.5;
          }
          o.alpha += (target - o.alpha) * 0.18;
          let sy = 1;
          if (o.npc) sy = 1 + Math.sin(t * 2.2 + o.x * 0.01) * 0.012;
          if (o.npc3 && drawNpc3(ctx, o.npc3, o.x, o.y - 3, t)) return;
          assets.draw(ctx, o.key, o.x, o.y, { scale: o.s, flipX: o.flip, alpha: o.alpha, sy });
        },
      });
    }
    return list;
  }
}
