// 「출발의 초원」 — 분수 계곡으로 가는 길목 필드 (2단계 RPG 시스템 테스트 장소)
// 3단계에서 분수 계곡 마을·던전·보스 지역이 이 옆에 연결됩니다.
//
// 장면(scene)이 알려주는 것:
//   bounds 걸을 수 있는 범위 / spawn 시작 위치
//   zones 몬스터가 나오는 구역 / areas 탐험 지역 / interactables NPC·룬·상자
//   drawGround / drawables / drawOverlay 그리기

import {
  drawTree, drawBush, drawFlower, drawRock, drawWindmill, drawSign,
  drawFairy, drawBubble, drawRuneMaster, drawBoard, drawRuneStone, drawChest, drawHouse, INK,
} from '../render/sprites.js';
import { drawExitMarker } from '../render/valleySprites.js';
import { drawTerrain } from '../render/terrain.js';
import { propDrawables, VILLAGE_PROPS, FARM_PROPS, MEADOW_PROPS } from '../render/envArt.js';
import { meadowTiles } from './tiledGround.js';
import { decorSolids, propSolids, clearPaths, footRect } from './colliders.js';
import { drawBridge, drawExitBridge } from '../render/valleySprites.js';

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RIVER = { y: 256, h: 128 }; // 새 타일 칸(64px)에 맞춤
const BRIDGE = { x: 960, w: 128 };

export class TestMeadow {
  constructor() {
    this.id = 'meadow';
    this.name = '출발의 초원';
    this.village = 'fractionValley';
    this.bgm = 'field';
    this.bounds = { x: 0, y: RIVER.y + RIVER.h + 10, w: 2000, h: 1400 - (RIVER.y + RIVER.h + 10) };
    this.spawn = { x: 1000, y: 820 };

    this.interactables = [
      { id: 'fairy', kind: 'npc', npc: 'fairy', x: 880, y: 760, r: 80, label: '대화하기', headY: -64 },
      { id: 'meadowRune', kind: 'rune', x: 640, y: 500, r: 80, label: '살펴보기', headY: -88 },
      { id: 'meadowChest', kind: 'chest', golden: false, x: 1270, y: 560, r: 70, label: '상자 열기', headY: -52 },
      { id: 'meadowGolden', kind: 'chest', golden: true, x: 1890, y: 1300, r: 70, label: '수학 상자 열기', headY: -56 },
    ];

    this.exits = [
      { id: 'toVillage', rect: { x: 950, y: 395, w: 110, h: 45 }, to: 'fvVillage', spawn: { x: 1100, y: 1480 }, label: '분수 계곡 마을', dir: 'up', marker: { x: 1005, y: 480 } },
      // 새 에셋 테스트 마을 (서쪽 끝)
      { id: 'toTestVillage', rect: { x: 0, y: 640, w: 40, h: 130 }, to: 'testVillage', spawn: { x: 110, y: 15 * 64 }, label: '새싹 마을(테스트)', dir: 'left', marker: { x: 80, y: 700 } },
    ];

    this.zones = [
      { id: 'westSlimes', rect: { x: 140, y: 900, w: 560, h: 420 }, types: ['slime'], max: 6, respawn: 6 },
      { id: 'southMix', rect: { x: 760, y: 1080, w: 420, h: 240 }, types: ['slime', 'mushroom', 'wildBoar'], max: 3, respawn: 9 },
      { id: 'eastMushrooms', rect: { x: 1260, y: 940, w: 380, h: 360 }, types: ['mushroom'], max: 5, respawn: 8 },
      { id: 'eastBats', rect: { x: 1380, y: 560, w: 380, h: 300 }, types: ['bat'], max: 4, respawn: 10 },
      { id: 'eliteNest', rect: { x: 1680, y: 1120, w: 160, h: 140 }, types: ['bigMushroom'], max: 1, respawn: 75 },
    ];

    this.areas = [
      { id: 'eastGarden', name: '동쪽 꽃밭', rect: { x: 1720, y: 410, w: 270, h: 230 } },
      { id: 'eliteNest', name: '어두운 버섯 숲', rect: { x: 1600, y: 1060, w: 400, h: 340 } },
    ];

    this.decor = [];
    this.buildDecor();
    this.tiles = meadowTiles();
    // 길·다리·출구·NPC를 가리는 나무·바위는 빼고, 남은 나무·바위·울타리·소품에 충돌 (한 번만 계산)
    this.decor = clearPaths(this.decor, { spec: this.tiles.spec, exits: this.exits, interactables: this.interactables, keep: ['windmill', 'house'] });
    this.staticSolids = [
      ...decorSolids(this.decor), ...propSolids(MEADOW_PROPS),
      { x: 230 - 66, y: 610 - 60, w: 132, h: 58 },
    ];
  }

  // 지나갈 수 없는 곳 (나무 밑동·바위·울타리·소품·집)
  solids() {
    return this.staticSolids;
  }

  buildDecor() {
    const rnd = seeded(20261008);
    const blocked = [
      ...this.interactables.map((o) => ({ x: o.x, y: o.y, r: 110 })),
      { x: 1000, y: 820, r: 240 },
      { x: 230, y: 610, r: 130 },
    ];
    const isBlocked = (x, y) => blocked.some((b) => Math.hypot(b.x - x, b.y - y) < b.r)
      || (Math.abs(x - 1005) < 90 && y < 900)
      || this.areas.some((a) => x > a.rect.x && x < a.rect.x + a.rect.w && y > a.rect.y && y < a.rect.y + a.rect.h);
    const tooClose = (x, y) => this.decor.some((d) => Math.hypot(d.x - x, d.y - y) < 72);

    for (let x = 30; x < 2000; x += 75) {
      this.decor.push({ type: 'tree', x: x + rnd() * 20, y: 1385 + rnd() * 10, s: 0.9 + rnd() * 0.3 });
    }
    for (let y = 470; y < 1380; y += 85) {
      this.decor.push({ type: 'tree', x: 20 + rnd() * 20, y, s: 0.9 + rnd() * 0.3 });
      if (y > 660) this.decor.push({ type: 'tree', x: 1975 + rnd() * 20, y, s: 0.9 + rnd() * 0.3 });
    }
    this.decor.push({ type: 'windmill', x: 1450, y: 250 });
    this.decor.push({ type: 'windmill', x: 560, y: 230 });
    this.decor.push({ type: 'house', x: 230, y: 610 });
    for (let i = 0; i < 14; i++) {
      const x = rnd() * 2000;
      if (Math.abs(x - 1005) < 120 || Math.abs(x - 1450) < 70 || Math.abs(x - 560) < 70) continue;
      this.decor.push({ type: 'tree', x, y: 150 + rnd() * 120, s: 0.75 + rnd() * 0.3 });
    }
    let guard = 0;
    while (this.decor.length < 110 && guard++ < 3000) {
      const x = 80 + rnd() * 1840;
      const y = RIVER.y + RIVER.h + 70 + rnd() * 880;
      if (isBlocked(x, y) || tooClose(x, y)) continue;
      const r = rnd();
      // 몬스터 구역 안에는 큰 나무를 줄여서 싸우기 편하게
      const inZone = this.zones.some((z) => x > z.rect.x && x < z.rect.x + z.rect.w && y > z.rect.y && y < z.rect.y + z.rect.h);
      const type = inZone ? (r < 0.5 ? 'bush' : 'rock') : (r < 0.4 ? 'tree' : r < 0.7 ? 'bush' : 'rock');
      this.decor.push({ type, x, y, s: 0.8 + rnd() * 0.4 });
    }
    this.flowers = [];
    const colors = ['#ff7aa8', '#ffd84d', '#ffffff', '#b38cff', '#ff9a5c'];
    for (let i = 0; i < 160; i++) {
      this.flowers.push({ x: 60 + rnd() * 1880, y: RIVER.y + RIVER.h + 30 + rnd() * 960, c: colors[Math.floor(rnd() * colors.length)] });
    }
    const g = this.areas[0].rect;
    for (let i = 0; i < 140; i++) {
      this.flowers.push({ x: g.x + 10 + rnd() * (g.w - 20), y: g.y + 10 + rnd() * (g.h - 20), c: colors[Math.floor(rnd() * colors.length)] });
    }
  }

  drawGround(ctx, cam, w, h, t) {
    const tiled = this.tiles?.draw(ctx, cam, w, h, t);
    if (tiled) {
      // 마을로 가는 출구 장식 (보완 에셋 v5 세로 다리 128×320, 원본 크기 그대로). 걸어서 건너는 다리가 아니라 출구 방향을 보여 주는 그림이에요.
      // 충돌·통행 판정은 추가하지 않아요 — 마을 이동은 기존 출구(exits.toVillage)가 그대로 처리해요.
      if (!drawExitBridge(ctx, BRIDGE.x + BRIDGE.w / 2, RIVER.y + RIVER.h + 64)) drawBridge(ctx, BRIDGE.x, RIVER.y - 12, BRIDGE.w, RIVER.h + 24, false, t);
    } else {
      drawTerrain(ctx, cam, w, h, '#8fd96b', '#76c456', 'grass');

      // 버섯 숲은 조금 어둡게
      const nest = this.areas[1].rect;
      ctx.fillStyle = 'rgba(40, 70, 40, 0.18)';
      ctx.beginPath();
      ctx.ellipse(nest.x + nest.w / 2, nest.y + nest.h / 2, nest.w / 2, nest.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 꽃밭
      const g = this.areas[0].rect;
      ctx.fillStyle = '#a8e57f';
      ctx.strokeStyle = 'rgba(43,33,64,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(g.x + g.w / 2, g.y + g.h / 2, g.w / 2, g.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 강 건너 땅
      ctx.fillStyle = '#9fdf7a';
      ctx.fillRect(cam.x, cam.y, w, Math.max(0, RIVER.y - cam.y));

      // 흙길
      const path = (fn) => {
        ctx.strokeStyle = INK;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 92;
        fn();
        ctx.stroke();
        ctx.strokeStyle = '#ecd09a';
        ctx.lineWidth = 84;
        ctx.stroke();
      };
      path(() => {
        ctx.beginPath();
        ctx.moveTo(1005, RIVER.y + 40);
        ctx.lineTo(1005, 760);
        ctx.quadraticCurveTo(1005, 860, 1120, 900);
      });
      path(() => {
        ctx.beginPath();
        ctx.moveTo(1005, 0);
        ctx.lineTo(1005, RIVER.y);
      });
      path(() => {
        ctx.beginPath();
        ctx.moveTo(960, 760);
        ctx.quadraticCurveTo(650, 720, 360, 700);
      });

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
          const off = (x + t * 40 + i * 70) % 160;
          if (off < 60) {
            ctx.moveTo(x, yy);
            ctx.lineTo(x + 18, yy);
          }
        }
        ctx.stroke();
      }

      // 나무다리
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      for (let y = RIVER.y - 14; y < RIVER.y + RIVER.h + 14; y += 16) {
        ctx.fillStyle = (y / 16) % 2 ? '#c48a52' : '#b57d48';
        ctx.fillRect(BRIDGE.x, y, BRIDGE.w, 16);
        ctx.strokeRect(BRIDGE.x, y, BRIDGE.w, 16);
      }
      ctx.fillStyle = '#8a5a36';
      for (const bx of [BRIDGE.x - 6, BRIDGE.x + BRIDGE.w - 4]) {
        ctx.fillRect(bx, RIVER.y - 24, 10, RIVER.h + 48);
        ctx.strokeRect(bx, RIVER.y - 24, 10, RIVER.h + 48);
      }
    }
    if (tiled) {
      for (const f of this.flowers) {
        if (f.x < cam.x - 20 || f.x > cam.x + w + 20 || f.y < cam.y - 20 || f.y > cam.y + h + 20) continue;
        drawFlower(ctx, f.x, f.y, f.c);
      }
    }

    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);

    for (const f of this.flowers) {
      if (f.x < cam.x - 20 || f.x > cam.x + w + 20 || f.y < cam.y - 20 || f.y > cam.y + h + 20) continue;
      drawFlower(ctx, f.x, f.y, f.c);
    }

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#fffaf0';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.ellipse(this.spawn.x, this.spawn.y + 20, 60, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // y 순서로 그릴 것들 (state: 저장 데이터 — 룬·상자 상태 확인용)
  drawables(t, player, save) {
    const list = this.decor.map((d) => ({
      y: d.y,
      draw: (ctx) => {
        if (d.type === 'tree') drawTree(ctx, d.x, d.y, d.s);
        else if (d.type === 'bush') drawBush(ctx, d.x, d.y, d.s);
        else if (d.type === 'rock') drawRock(ctx, d.x, d.y, d.s);
        else if (d.type === 'windmill') drawWindmill(ctx, d.x, d.y, t);
        else if (d.type === 'house') drawHouse(ctx, d.x, d.y);
      },
    }));
    list.push({ y: 560, draw: (ctx) => drawSign(ctx, 1080, 560, '↑ 분수 계곡 마을') });
    for (const o of this.interactables) {
      list.push({
        y: o.y,
        draw: (ctx) => {
          if (o.kind === 'npc' && o.npc === 'fairy') drawFairy(ctx, o.x, o.y, t);
          else if (o.kind === 'rune') drawRuneStone(ctx, o.x, o.y, save?.activatedRunes.includes(o.id), t);
          else if (o.kind === 'chest') drawChest(ctx, o.x, o.y, { golden: o.golden, opened: save?.openedChests.includes(o.id), t });
        },
      });
    }
    list.push(...propDrawables(MEADOW_PROPS));
    return list;
  }

  drawOverlay(ctx, t, player) {
    const fairy = this.interactables[0];
    if (player && Math.hypot(player.x - fairy.x, player.y - fairy.y) < 220 && Math.hypot(player.x - fairy.x, player.y - fairy.y) > 85) {
      drawBubble(ctx, fairy.x, fairy.y - 64, '모험가님! 이쪽이에요~');
    }
  }
}
