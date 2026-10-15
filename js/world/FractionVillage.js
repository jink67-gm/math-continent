// 「분수 계곡 마을」
// 촌장(메인 퀘스트), 상점, 대장간(강화), 룬 할아버지(스킬), 치유의 샘, 퀘스트 게시판
// 북쪽 강의 다리를 고치면(수학 룬) 계곡 동굴(던전)로 갈 수 있어요.

import { drawTree, drawBush, drawFlower, drawRuneMaster, drawBoard, drawSign, drawHouse, INK } from '../render/sprites.js';
import { drawTerrain } from '../render/terrain.js';
import {
  drawCottage, drawFarmPlot, drawFence, drawFountain, drawChief, drawMerchantStall, drawSmithy,
  drawBridge, drawCaveMouth, drawCliff, drawExitMarker,
} from '../render/valleySprites.js';
import { assets } from '../render/AssetManager.js';
import { propDrawables, VILLAGE_PROPS, FARM_PROPS, MEADOW_PROPS, drawPlaque } from '../render/envArt.js';
import { fractionVillageTiles } from './tiledGround.js';
import { villageLinkExits, warpInteractable, warpSolid, warpActive, drawWarpPoint } from './warp.js';
import { decorSolids, propSolids, clearPaths, footRect, roadNear } from './colliders.js';
import { TRAIL_BOTTOM_SPAWN } from '../data/routes.js';
import { buildingSolid, drawBuildingSet, decoFor, decoDrawables, decoSolids, drawHealSpot, drawBoardSet, drawSignSet, P6, drawWellGround, usesWell, wellSortY } from './buildingSet.js';

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 2200;
const RIVER = { y: 512, h: 128 }; // 새 타일 칸(64px)에 맞춤
const BRIDGE = { x: 1050, w: 100 };
const CLIFF_H = 285;

export class FractionVillage {
  constructor() {
    this.id = 'fvVillage';
    this.name = '분수 계곡 마을';
    this.village = 'fractionValley';
    this.bgm = 'fractionValley';
    this.safe = true;
    this.bounds = { x: 0, y: 160, w: W, h: 1440 };
    this.spawn = { x: 1100, y: 1130 };

    this.buildings = [
      { kind: 'cottage', x: 760, y: 860, w: 150, roof: '#d9674a', sign: '촌장의 집', windmill: true },
      { kind: 'cottage', x: 330, y: 820, w: 120, roof: '#4f8fd9' },
      { kind: 'cottage', x: 1880, y: 820, w: 130, roof: '#9b6cd9', windmill: true },
      { kind: 'cottage', x: 1660, y: 1260, w: 120, roof: '#3fae7a', sign: '룬의 집' },
      { kind: 'stall', x: 1460, y: 900 },
      { kind: 'smithy', x: 560, y: 1230 },
      { kind: 'cottage', x: 1950, y: 1420, w: 110, roof: '#e0a83a' },
      { kind: 'cottage', x: 260, y: 1440, w: 110, roof: '#d9674a' },
    ];

    this.buildings.forEach((b, i) => { b.i = i; b.main = /촌장/.test(b.sign || ''); });

    this.interactables = [
      { id: 'chief', kind: 'npc', npc: 'chief', x: 852, y: 938, r: 100, label: '대화하기', headY: -84 },
      { id: 'merchant', kind: 'npc', npc: 'merchant', x: 1460, y: 945, r: 95, label: '상점', headY: -150 },
      { id: 'smith', kind: 'npc', npc: 'smith', x: 560, y: 1285, r: 100, label: '대장간', headY: -128 },
      { id: 'runeMaster', kind: 'npc', npc: 'runeMaster', x: 1560, y: 1330, r: 85, label: '대화하기', headY: -96 },
      { id: 'board', kind: 'npc', npc: 'board', x: 1290, y: 1180, r: 80, label: '게시판 보기', headY: -86 },
      { id: 'fountain', kind: 'heal', x: 1100, y: 1050, r: 120, label: '치유의 샘', headY: -84 },
      {
        id: 'brokenBridge', kind: 'rune', portrait: 'bridge', x: 1100, y: 650, r: 90, label: '다리 살펴보기', headY: -40,
        name: '부서진 나무다리',
        idleText: '강을 건너는 나무다리가 부서져 있어요.\n촌장님이 고칠 방법을 알고 계실지도 몰라요.',
        promptText: '다리 기둥에 수학 룬이 새겨져 있어요.\n룬을 맞추면 다리가 다시 이어진대요!',
        doneText: '튼튼하게 고친 다리예요. 북쪽 동굴로 갈 수 있어요.',
        mathTitle: '다리 수리 룬', actionLabel: '룬 맞추기', doneBanner: ['다리 수리 완료!', '북쪽 동굴로 가는 길이 열렸어요'],
      },
    ];

    this.interactables.push(warpInteractable('fractionValley'));

    this.exits = [
      { id: 'toMeadow', rect: { x: 1030, y: 1555, w: 140, h: 50 }, to: 'meadow', spawn: { x: 1005, y: 500 }, label: '출발의 초원', dir: 'down', marker: { x: 1100, y: 1530 } },
      ...villageLinkExits('fractionValley'),
      // ⑭ 계곡 동굴은 마을 밖에: 북쪽 돌계단 → 계곡 바위 숲 → 동굴 입구
      { id: 'toTrail', rect: { x: 1040, y: 160, w: 120, h: 50 }, to: 'fv_trail1', spawn: { ...TRAIL_BOTTOM_SPAWN }, label: '계곡 바위 숲 ↑', dir: 'up', marker: { x: 1100, y: 232 } },
    ];

    this.zones = [];
    this.areas = [];
    this.decor = [];
    this.buildDecor();
    this.tiles = fractionVillageTiles();
    // ⑪ 꽃·풀 무늬가 흙길 한가운데 놓이지 않게
    this.flowers = this.flowers.filter((f) => !roadNear(this.tiles.spec, f.x, f.y, 22, 16, 16));
    this.decor = clearPaths(this.decor, { spec: this.tiles.spec, exits: this.exits, interactables: this.interactables });
    // 나무·소품·밭·생울타리 충돌 (한 번만 계산)
    this.staticSolids = [
      ...decorSolids(this.decor),
      ...propSolids([...VILLAGE_PROPS, ...FARM_PROPS.filter((q) => q.k !== 'fence_wood')]),
      ...this.plots.map((p) => ({ x: p.x + 20, y: p.y + 30, w: 160, h: 50 })),
      ...decoSolids(decoFor('valley')),
    ];
  }

  bridgeFixed(save) {
    return !!save?.activatedRunes.includes('brokenBridge');
  }

  // 지나갈 수 없는 곳
  solids(save) {
    const list = [
      { x: 0, y: 0, w: 1040, h: CLIFF_H }, { x: 1160, y: 0, w: W - 1160, h: CLIFF_H }, // 북쪽 절벽 (가운데 돌계단만 열림)
      { x: 1045, y: 1020, w: 110, h: 50 },
    ];
    if (this.bridgeFixed(save)) {
      list.push({ x: 0, y: RIVER.y, w: BRIDGE.x, h: RIVER.h });
      list.push({ x: BRIDGE.x + BRIDGE.w, y: RIVER.y, w: W - BRIDGE.x - BRIDGE.w, h: RIVER.h });
    } else {
      list.push({ x: 0, y: RIVER.y, w: W, h: RIVER.h });
    }
    for (const b of this.buildings) {
      if (b.kind === 'cottage') list.push(buildingSolid('valley', b) || { x: b.x - b.w / 2 - 6, y: b.y - 60, w: b.w + 12, h: 58 });
      else if (b.kind === 'stall') list.push({ x: b.x - 64, y: b.y - 40, w: 128, h: 40 });
      else if (b.kind === 'smithy') list.push({ x: b.x - 76, y: b.y - 50, w: 156, h: 50 });
    }
    list.push(...this.staticSolids);
    list.push(warpSolid());
    return list;
  }

  buildDecor() {
    const rnd = seeded(77012);
    for (let x = 30; x < W; x += 80) {
      this.decor.push({ type: 'tree', x: x + rnd() * 20, y: 1590 + rnd() * 6, s: 0.85 + rnd() * 0.3 });
    }
    for (let y = 700; y < 1560; y += 90) {
      this.decor.push({ type: 'tree', x: 25 + rnd() * 15, y, s: 0.9 + rnd() * 0.3 });
      this.decor.push({ type: 'tree', x: W - 25 - rnd() * 15, y, s: 0.9 + rnd() * 0.3 });
    }
    // 강 북쪽 언덕
    for (let i = 0; i < 16; i++) {
      const x = 60 + rnd() * (W - 120);
      if (Math.abs(x - 1100) < 170) continue;
      this.decor.push({ type: rnd() < 0.6 ? 'tree' : 'bush', x, y: 340 + rnd() * 150, s: 0.8 + rnd() * 0.3 });
    }
    // 분수 밭: 잔여 에셋 2차 팩 밭 그림(그림 속 칸 수·심은 칸 수를 확대 확인한 분수만 표시)
    this.plots = [
      { x: 140, y: 980, w: 200, h: 90, parts: 4, filled: 3, crop: '#ffcf3f', label: '3/4', img: 'garden_plot_wheat' },
      { x: 140, y: 1110, w: 200, h: 90, parts: 4, filled: 1, crop: '#ff7a5c', label: '1/4', img: 'garden_plot_quarters' },
      { x: 1820, y: 980, w: 230, h: 90, parts: 8, filled: 5, crop: '#b38cff', label: '5/8', img: 'garden_plot_eighths' },
      { x: 1820, y: 1110, w: 230, h: 90, parts: 2, filled: 1, crop: '#ff9ec2', label: '1/2', img: 'garden_plot_half' },
    ];
    this.flowers = [];
    const colors = ['#ff7aa8', '#ffd84d', '#ffffff', '#b38cff'];
    for (let i = 0; i < 110; i++) {
      const x = 60 + rnd() * (W - 120);
      const y = 640 + rnd() * 900;
      if (Math.hypot(x - 1100, y - 1100) < 260) continue;
      this.flowers.push({ x, y, c: colors[Math.floor(rnd() * colors.length)] });
    }
  }

  drawGround(ctx, cam, w, h, t, save) {
    // 새 타일 바닥 (못 불러왔으면 예전 그림)
    const tiled = this.tiles?.draw(ctx, cam, w, h, t);
    if (tiled) drawWellGround(ctx, 'valley', 1100, 1050);
    if (!tiled) {
      drawTerrain(ctx, cam, w, h, '#9be27a', '#82cf62', 'grass');

      // 길
      const path = (fn, width = 90) => {
        ctx.strokeStyle = INK;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = width + 8;
        fn();
        ctx.stroke();
        ctx.strokeStyle = '#ecd09a';
        ctx.lineWidth = width;
        ctx.stroke();
      };
      path(() => { ctx.beginPath(); ctx.moveTo(1100, 1620); ctx.lineTo(1100, 610); });
      path(() => { ctx.beginPath(); ctx.moveTo(1100, 520); ctx.lineTo(1100, 300); });
      path(() => { ctx.beginPath(); ctx.moveTo(330, 900); ctx.quadraticCurveTo(700, 980, 1100, 1060); ctx.quadraticCurveTo(1500, 980, 1880, 900); }, 70);
      path(() => { ctx.beginPath(); ctx.moveTo(560, 1300); ctx.quadraticCurveTo(900, 1200, 1100, 1120); ctx.quadraticCurveTo(1350, 1220, 1660, 1300); }, 70);

      // 광장
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(1100, 1080, 214, 134, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0d8a6';
      ctx.beginPath();
      ctx.ellipse(1100, 1080, 210, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(43,33,64,0.18)';
      ctx.lineWidth = 2;
      for (let r = 40; r < 200; r += 40) {
        ctx.beginPath();
        ctx.ellipse(1100, 1080, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const p of this.plots) {
      const cx = p.x + 100;
      const img = assets.draw(ctx, `pack4/fraction_garden/${p.img}`, cx, p.y + 112, { height: 132 });
      if (!img) drawFarmPlot(ctx, p.x, p.y, p.w, p.h, p.parts, p.filled, p.crop);
      ctx.font = '22px Jua, sans-serif';
      ctx.textAlign = 'left';
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      const lx = img ? cx + 94 : p.x + p.w + 10;
      ctx.strokeText(p.label, lx, p.y + p.h / 2 + 8);
      ctx.fillStyle = '#fff';
      ctx.fillText(p.label, lx, p.y + p.h / 2 + 8);
    }

    for (const f of this.flowers) {
      if (f.x < cam.x - 20 || f.x > cam.x + w + 20 || f.y < cam.y - 20 || f.y > cam.y + h + 20) continue;
      drawFlower(ctx, f.x, f.y, f.c);
    }

    if (!tiled) {
      // 강
      ctx.fillStyle = INK;
      ctx.fillRect(cam.x, RIVER.y - 4, w, RIVER.h + 8);
      ctx.fillStyle = '#5ec8f2';
      ctx.fillRect(cam.x, RIVER.y, w, RIVER.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const yy = RIVER.y + 22 + i * 24;
        ctx.beginPath();
        for (let x = Math.floor(cam.x / 40) * 40; x < cam.x + w + 40; x += 40) {
          const off = (x + t * 50 + i * 70) % 160;
          if (off < 60) {
            ctx.moveTo(x, yy);
            ctx.lineTo(x + 18, yy);
          }
        }
        ctx.stroke();
      }
    }
    drawBridge(ctx, BRIDGE.x, RIVER.y - 12, BRIDGE.w, RIVER.h + 24, !this.bridgeFixed(save), t);

    if (!tiled) drawCliff(ctx, cam.x, 0, w, CLIFF_H);

    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
  }

  drawables(t, player, save) {
    const list = this.decor.map((d) => ({
      y: d.y,
      draw: (ctx) => (d.type === 'tree' ? drawTree(ctx, d.x, d.y, d.s) : drawBush(ctx, d.x, d.y, d.s)),
    }));
    for (const b of this.buildings) {
      list.push({
        y: b.y,
        draw: (ctx) => {
          if (b.kind === 'cottage') drawBuildingSet(ctx, 'valley', b) || drawCottage(ctx, b.x, b.y, { w: b.w, roof: b.roof, sign: b.sign, windmill: b.windmill, t });
          else if (b.kind === 'stall') drawMerchantStall(ctx, b.x, b.y, t);
          else if (b.kind === 'smithy') drawSmithy(ctx, b.x, b.y, t);
        },
      });
    }
    list.push({ y: wellSortY(1050), draw: (ctx) => drawHealSpot(ctx, 'valley', 1100, 1050) || drawFountain(ctx, 1100, 1050, t) });
    list.push({ y: 938, draw: (ctx) => drawChief(ctx, 852, 938, t) });
    list.push({ y: 1330, draw: (ctx) => drawRuneMaster(ctx, 1560, 1330, t) });
    list.push({ y: 1180, draw: (ctx) => drawBoardSet(ctx, 'valley', 1290, 1180) || drawBoard(ctx, 1290, 1180) });
    list.push({ y: 1480, draw: (ctx) => drawSignSet(ctx, 1190, 1480, '분수 계곡 마을') || drawSign(ctx, 1190, 1480, '분수 계곡 마을') });
    list.push(...propDrawables([...VILLAGE_PROPS, ...FARM_PROPS.filter((q) => q.k !== 'fence_wood')]));
    list.push(...gardenDrawables());
    list.push(...decoDrawables(decoFor('valley')));
    const wp = warpInteractable('fractionValley');
    list.push({ y: wp.y, draw: (ctx) => drawWarpPoint(ctx, wp.x, wp.y, warpActive(save, 'fractionValley'), t, Math.max(0, 1 - (t - (this.warpBurstAt ?? -9)) / 1.4)) });
    return list;
  }
}

// 분수 밭 둘레: 꽃 아치(입구) · 생울타리 · 꽃 상자 · 이름표 → "분수 개념을 배우는 특별한 밭"
const GARDEN = [
  { k: 'hedge_straight', x: 120, y: 935, h: 34 }, { k: 'hedge_straight', x: 360, y: 935, h: 34 },
  { k: 'hedge_straight', x: 1820, y: 935, h: 34 }, { k: 'hedge_straight', x: 2060, y: 935, h: 34 },
  { k: 'flower_box_a', x: 440, y: 1240, h: 40 }, { k: 'flower_box_b', x: 1720, y: 1240, h: 40 },
];
function gardenDrawables() {
  const out = GARDEN.filter((g) => assets.meta[`pack4/fraction_garden/${g.k}`]).map((g) => ({
    y: g.y, draw: (ctx) => assets.draw(ctx, `pack4/fraction_garden/${g.k}`, g.x, g.y, { height: g.h }),
  }));
  // 밭 입구: 새 꽃 아치(장식 시트)
  for (const x of [180, 1860]) out.push({ y: 1285, draw: (ctx) => { const m = assets.meta[P6('deco_flower_arch')]; if (m) assets.draw(ctx, P6('deco_flower_arch'), x, 1290, { scale: 112 / m.w }); } });
  for (const x of [240, 1920]) out.push({ y: 930, draw: (ctx) => drawPlaque(ctx, x, 930, '분수 밭') });
  return out;
}
