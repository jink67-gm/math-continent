// 마을 2~6 — 분수 계곡 마을과 같은 배치(광장·촌장·상점·대장간·룬 현자·치유의 샘·게시판)에
// 마을 양식(큐브 도시·항구·성·숲·설산)에 따라 다른 건물과 풍경을 그려요.
import { moodSolidsFor, moodDrawables, moodGround, moodClear } from './villageMood.js';
import { drawTree, drawBush, drawFlower, drawRuneMaster, drawBoard, drawSign, INK } from '../render/sprites.js';
import { drawTerrain } from '../render/terrain.js';
import {
  drawCottage, drawFountain, drawMerchantStall, drawSmithy, drawCaveMouth, drawCliff, drawExitMarker, drawBridge,
  drawVillager, drawCubeBuilding, drawLighthouse, drawBoat, drawStoneHouse, drawCastleTower, drawTreeHouse,
  drawCabin, drawPine, drawSnowman, drawGateBarrier,
} from '../render/valleySprites.js';
import { propDrawables, VILLAGE_PROPS, FARM_PROPS, MEADOW_PROPS, artHouse } from '../render/envArt.js';
import { templateVillageTiles, bandDrawables } from './tiledGround.js';
import { assets } from '../render/AssetManager.js';
import { TRAIL_BOTTOM_SPAWN, trailOf } from '../data/routes.js';
import { villageLinkExits, warpInteractable, warpSolid, warpActive, drawWarpPoint } from './warp.js';
import { decorSolids, propSolids, clearPaths, footRect, roadNear } from './colliders.js';
import { buildingSolid, drawBuildingSet, decoFor, decoDrawables, decoSolids, drawHealSpot, drawBoardSet, drawSignSet, P6, drawWellGround, usesWell, wellSortY } from './buildingSet.js';
import { drawKitBuilding, drawKit, drawKitDecor, KIT_STALL, KIT_FOUNTAIN, KIT_SIGN, kitSolids, kitDrawables, kitLamps, drawKitSmithy } from './villageKits.js';

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
const BAND = { y: 512, h: 128 }; // 새 타일 칸(64px)에 맞춤
const GAP = { x: 1050, w: 100 };
const CLIFF_H = 285;

export const STYLES = {
  cube: { ground: ['#cdd3f2', '#c3caee'], path: '#eef0fb', band: '#3ee6d0', bandKind: 'neon', cliff: '#8a80c8', gate: '#a77bff', chiefSign: '시청', robe: '#7f6fd9', flower: ['#a77bff', '#3ee6d0', '#ff9ec2'] },
  harbor: { ground: ['#f3e2b3', '#ecd8a4'], path: '#d9b98a', band: '#5ec8f2', bandKind: 'water', cliff: '#c99a62', gate: '#ffd84d', chiefSign: '선장의 집', robe: '#2f6fbf', flower: ['#ff7aa8', '#ffd84d', '#ffffff'] },
  castle: { ground: ['#b9c48a', '#b0bb80'], path: '#d1cabc', band: '#9aa0ad', bandKind: 'wall', cliff: '#8a8478', gate: '#ffcc33', chiefSign: '왕궁', robe: '#c2304a', flower: ['#ff5a5a', '#ffd84d', '#ffffff'] },
  forest: { ground: ['#6cc67c', '#62ba72'], path: '#b39b6a', band: '#3f8f5a', bandKind: 'hedge', cliff: '#5a7f4f', gate: '#3fd1c8', chiefSign: '장로의 집', robe: '#4f9e5a', flower: ['#ffd84d', '#ffffff', '#ff9ec2'] },
  snow: { ground: ['#f3f7fd', '#e8eff9'], path: '#c6d3e6', band: '#bfe8ff', bandKind: 'ice', cliff: '#9fb0cc', gate: '#b98cff', chiefSign: '산지기 집', robe: '#7a8fb8', flower: ['#b98cff', '#8fe3ff', '#ffffff'] },
};

export class TemplateVillage {
  constructor(c) {
    const s = c.s;
    this.c = c;
    this.style = STYLES[c.style];
    this.id = `${s}_village`;
    this.name = c.villageName || '';
    this.village = c.village;
    this.bgm = c.village;
    this.safe = true;
    this.bounds = { x: 0, y: 160, w: W, h: 1440 };
    this.spawn = { x: 1100, y: 1130 };
    this.gateId = `${s}_gate`;

    this.buildings = [
      { x: 760, y: 860, w: 150, sign: this.style.chiefSign, main: true },
      { x: 330, y: 820, w: 120 },
      { x: 1880, y: 820, w: 130 },
      { x: 1660, y: 1260, w: 120, sign: '룬의 집' },
      { x: 1950, y: 1420, w: 110 },
      { x: 260, y: 1440, w: 110 },
    ];

    this.interactables = [
      { id: `${s}_chief`, kind: 'npc', npc: `${s}_chief`, x: 852, y: 938, r: 100, label: '대화하기', headY: -96 },
      { id: `${s}_merchant`, kind: 'npc', npc: `${s}_merchant`, x: 1460, y: 945, r: 95, label: '상점', headY: -150 },
      { id: `${s}_smith`, kind: 'npc', npc: `${s}_smith`, x: 560, y: 1285, r: 100, label: '대장간', headY: -128 },
      { id: `${s}_sage`, kind: 'npc', npc: `${s}_sage`, x: 1560, y: 1330, r: 85, label: '대화하기', headY: -96 },
      { id: `${s}_board`, kind: 'npc', npc: `${s}_board`, x: 1290, y: 1180, r: 80, label: '게시판 보기', headY: -86 },
      { id: `${s}_fountain`, kind: 'heal', x: 1100, y: 1050, r: 120, label: '치유의 샘', headY: -84 },
      {
        id: this.gateId, kind: 'rune', portrait: 'door', x: 1100, y: 650, r: 95, label: c.gate.name, headY: -40,
        name: c.gate.name, idleText: c.gate.idle, promptText: c.gate.prompt, doneText: c.gate.done,
        mathTitle: c.gate.name, actionLabel: '룬 맞추기', doneBanner: c.gate.banner,
      },
    ];

    this.exits = [
      // ⑭ 던전은 마을 밖에: 북쪽 돌계단 → 탐험 필드 → … → 던전 입구
      { id: 'toTrail', rect: { x: 1040, y: 160, w: 120, h: 50 }, to: `${s}_trail1`, spawn: { ...TRAIL_BOTTOM_SPAWN }, label: `${trailOf(c.village)?.fields[0].name || c.dungeon.name} ↑`, dir: 'up', marker: { x: 1100, y: 232 } },
      // 남쪽: 월드맵(워프) — 소수 항구는 남쪽 큰길이 비례 왕국으로 가는 길이라 월드맵 대신 길
      ...(c.style === 'harbor' ? [] : [{ id: 'toMap', rect: { x: 1030, y: 1560, w: 140, h: 45 }, action: 'map', label: '🗺️ 월드맵', dir: 'down', marker: { x: 1100, y: 1530 } }]),
      // 이웃 마을로 이어지는 길 (서쪽 입구 · 동쪽/남쪽 출구)
      ...villageLinkExits(c.village),
    ];
    this.interactables.push(warpInteractable(c.village));
    this.zones = [];
    this.areas = [];
    this.decor = [];
    this.buildDecor();
    this.tiles = templateVillageTiles(c.style);
    // ⑪ 꽃·풀 무늬가 흙길·돌길 한가운데 놓이지 않게 (길 가장자리 바깥에만)
    this.flowers = this.flowers.filter((f) => !roadNear(this.tiles.spec, f.x, f.y, 22, 16, 16));
    this.decor = clearPaths(this.decor, { spec: this.tiles.spec, exits: this.exits, interactables: this.interactables, keep: ['lighthouse', 'boat', 'tower'] });
    this.decor = this.decor.filter((d) => moodClear(c.style, d));
    this.buildings.forEach((b, i) => { b.i = i; });
    this.staticSolids = [...decorSolids(this.decor), ...propSolids(VILLAGE_PROPS), ...decoSolids(decoFor(c.style))];
  }

  gateOpen(save) {
    return !!save?.activatedRunes.includes(this.gateId);
  }

  // ⑬ 마을 북쪽 관문: 네모난 반투명 막 대신 마을 양식에 맞는 문 (닫힘: 문짝 / 열림: 아치)
  gateArt() {
    const stone = this.c.style === 'castle' || this.c.style === 'cube';
    return stone
      ? { closed: ['dungeon3/small_iron_gate', 156], open: ['dungeon4/wall_arch_gate', 196] }
      : { closed: ['village2/gate', 158], open: ['buildings/wooden_gate', 196] };
  }
  gateArtReady() {
    const a = this.gateArt();
    return !!(assets.get(a.closed[0]) && assets.get(a.open[0]));
  }
  gateDrawables(save, t) {
    if (!this.gateArtReady()) return [];
    const a = this.gateArt();
    const [key, w] = this.gateOpen(save) ? a.open : a.closed;
    const m = assets.meta[key];
    const y = BAND.y + BAND.h + 8;
    return [{
      y,
      draw: (ctx) => {
        assets.draw(ctx, key, GAP.x + GAP.w / 2, y, { scale: w / m.w, tint: this.c.style === 'snow' && !this.gateOpen(save) ? '#cfeaff' : null, tintA: this.c.style === 'snow' && !this.gateOpen(save) ? 0.45 : 0 });
        if (!this.gateOpen(save)) {
          // 닫힌 문에 수학 룬이 숨 쉬듯 빛남
          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.3;
          ctx.font = '26px Jua, sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = '#fff4b0';
          ctx.fillText('÷', GAP.x + GAP.w / 2, y - m.h * (w / m.w) * 0.45);
          ctx.restore();
        }
      },
    }];
  }

  solids(save) {
    // 북쪽 절벽 (가운데 돌계단 자리만 열림)
    const list = [{ x: 0, y: 0, w: 1040, h: CLIFF_H }, { x: 1160, y: 0, w: W - 1160, h: CLIFF_H }, { x: 1045, y: 1020, w: 110, h: 50 }];
    list.push({ x: 0, y: BAND.y, w: GAP.x, h: BAND.h });
    list.push({ x: GAP.x + GAP.w, y: BAND.y, w: W - GAP.x - GAP.w, h: BAND.h });
    if (!this.gateOpen(save)) list.push({ x: GAP.x, y: BAND.y, w: GAP.w, h: BAND.h });
    for (const b of this.buildings) {
      const kitHouse = (this.c.style === 'harbor' && !b.main && !(b.sign && /룬/.test(b.sign))) || this.c.style === 'snow' || this.c.style === 'cube';
      list.push((!kitHouse && buildingSolid(this.c.style, b)) || { x: b.x - b.w / 2 - 6, y: b.y - 60, w: b.w + 12, h: 58 });
    }
    list.push({ x: 1396, y: 860, w: 128, h: 40 });
    list.push({ x: 484, y: 1180, w: 156, h: 50 });
    if (this.c.style === 'harbor') list.push({ x: 2060, y: 620, w: 140, h: 980 });
    list.push(...kitSolids(this.c.style));
    list.push(warpSolid());
    list.push(...moodSolidsFor(this.c.style, this.village, save));
    list.push(...this.staticSolids);
    return list;
  }

  buildDecor() {
    const rnd = seeded(this.c.tier * 991);
    const st = this.c.style;
    const blocked = [
      { x: 1100, y: 1090, r: 280 }, { x: 760, y: 900, r: 140 }, { x: 1460, y: 920, r: 140 }, { x: 560, y: 1250, r: 150 },
      { x: 1600, y: 1300, r: 150 }, { x: 1290, y: 1180, r: 90 },
    ];
    const ok = (x, y) => !blocked.some((b) => Math.hypot(b.x - x, b.y - y) < b.r)
      && Math.abs(x - 1100) > 90 && !this.buildings.some((b) => Math.abs(b.x - x) < b.w / 2 + 40 && y > b.y - 120 && y < b.y + 40)
      && !(st === 'harbor' && x > 2020);
    const tree = st === 'snow' ? 'pine' : st === 'cube' ? 'cubeTree' : 'tree';
    for (let x = 30; x < W; x += 80) this.decor.push({ type: tree, x: x + rnd() * 20, y: 1590 + rnd() * 6, s: 0.85 + rnd() * 0.3 });
    for (let y = 700; y < 1560; y += 90) {
      this.decor.push({ type: tree, x: 25 + rnd() * 15, y, s: 0.9 + rnd() * 0.3 });
      if (st !== 'harbor') this.decor.push({ type: tree, x: W - 25 - rnd() * 15, y, s: 0.9 + rnd() * 0.3 });
    }
    for (let i = 0; i < 14; i++) {
      const x = 60 + rnd() * (W - 120);
      if (Math.abs(x - 1100) < 170) continue;
      this.decor.push({ type: rnd() < 0.6 ? tree : 'bush', x, y: 340 + rnd() * 150, s: 0.8 + rnd() * 0.3 });
    }
    let guard = 0;
    let extra = 0;
    while (extra < 22 && guard++ < 800) {
      const x = 80 + rnd() * (W - 160);
      const y = 680 + rnd() * 860;
      if (!ok(x, y) || this.decor.some((d) => Math.hypot(d.x - x, d.y - y) < 70)) continue;
      const r = rnd();
      let type = r < 0.5 ? tree : 'bush';
      if (st === 'snow' && r > 0.8) type = 'snowman';
      if (st === 'cube' && r > 0.7) type = 'cubeBlock';
      this.decor.push({ type, x, y, s: 0.8 + rnd() * 0.3 });
      extra += 1;
    }
    if (st === 'harbor') {
      this.decor.push({ type: 'lighthouse', x: 1980, y: 470 });
      this.decor.push({ type: 'boat', x: 2120, y: 900 }, { type: 'boat', x: 2130, y: 1250, color: '#3f8f5a' });
    }
    if (st === 'castle') {
      this.decor.push({ type: 'tower', x: 240, y: 500 }, { type: 'tower', x: 1960, y: 500, flag: '#2f6fbf' });
    }
    this.flowers = [];
    for (let i = 0; i < 90; i++) {
      const x = 60 + rnd() * (W - 120);
      const y = 640 + rnd() * 900;
      if (Math.hypot(x - 1100, y - 1100) < 260 || (st === 'harbor' && x > 2020)) continue;
      this.flowers.push({ x, y, c: this.style.flower[Math.floor(rnd() * 3)] });
    }
  }

  drawGround(ctx, cam, w, h, t, save) {
    const S = this.style;
    const tiled = this.tiles?.draw(ctx, cam, w, h, t);
    moodGround(ctx, this.c.style, cam, w, h);
    if (tiled) drawWellGround(ctx, this.c.style, 1100, 1050);
    if (!tiled) drawTerrain(ctx, cam, w, h, S.ground[0], S.ground[1], this.c.style === 'cube' || this.c.style === 'snow' ? 'stone' : 'grass');
    if (!tiled) {
      const path = (fn, width = 90) => {
        ctx.strokeStyle = INK;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = width + 8;
        fn();
        ctx.stroke();
        ctx.strokeStyle = S.path;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      path(() => { ctx.beginPath(); ctx.moveTo(1100, 1620); ctx.lineTo(1100, 610); });
      path(() => { ctx.beginPath(); ctx.moveTo(1100, 520); ctx.lineTo(1100, 300); });
      path(() => { ctx.beginPath(); ctx.moveTo(330, 900); ctx.quadraticCurveTo(700, 980, 1100, 1060); ctx.quadraticCurveTo(1500, 980, 1880, 900); }, 70);
      path(() => { ctx.beginPath(); ctx.moveTo(560, 1300); ctx.quadraticCurveTo(900, 1200, 1100, 1120); ctx.quadraticCurveTo(1350, 1220, 1660, 1300); }, 70);

      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(1100, 1080, 214, 134, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = S.path;
      ctx.beginPath(); ctx.ellipse(1100, 1080, 210, 130, 0, 0, Math.PI * 2); ctx.fill();

      if (this.c.style === 'harbor') {
        ctx.fillStyle = INK;
        ctx.fillRect(2056, 600, 200, 1100);
        ctx.fillStyle = '#5ec8f2';
        ctx.fillRect(2060, 600, 200, 1100);
        ctx.fillStyle = '#b57d48';
        ctx.fillRect(1990, 880, 90, 40); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(1990, 880, 90, 40);
      }
    }

    for (const f of this.flowers) {
      if (f.x < cam.x - 20 || f.x > cam.x + w + 20 || f.y < cam.y - 20 || f.y > cam.y + h + 20) continue;
      drawFlower(ctx, f.x, f.y, f.c);
    }

    if (!tiled) {
      // 북쪽 경계 (강·성벽·울타리·얼음강·네온벽)
      const kind = S.bandKind;
      ctx.fillStyle = INK;
      ctx.fillRect(cam.x, BAND.y - 4, w, BAND.h + 8);
      ctx.fillStyle = S.band;
      ctx.fillRect(cam.x, BAND.y, w, BAND.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      if (kind === 'water' || kind === 'ice') {
        for (let i = 0; i < 3; i++) {
          const yy = BAND.y + 22 + i * 24;
          ctx.beginPath();
          for (let x = Math.floor(cam.x / 40) * 40; x < cam.x + w + 40; x += 40) {
            const off = (x + (kind === 'ice' ? 0 : t * 50) + i * 70) % 160;
            if (off < 60) { ctx.moveTo(x, yy); ctx.lineTo(x + 18, yy); }
          }
          ctx.stroke();
        }
      } else if (kind === 'wall') {
        ctx.strokeStyle = 'rgba(43,33,64,0.35)';
        for (let r = 0; r < 3; r++) {
          for (let x = Math.floor(cam.x / 60) * 60; x < cam.x + w + 60; x += 60) ctx.strokeRect(x + (r % 2) * 30, BAND.y + r * 30, 60, 30);
        }
      } else if (kind === 'hedge') {
        ctx.fillStyle = '#4fae5a';
        for (let x = Math.floor(cam.x / 50) * 50; x < cam.x + w + 50; x += 50) {
          ctx.beginPath(); ctx.arc(x + 25, BAND.y + 45, 30, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        for (let x = Math.floor(cam.x / 70) * 70; x < cam.x + w + 70; x += 70) ctx.strokeRect(x + 6, BAND.y + 10, 58, 70);
      }
      // 길이 지나가는 틈
      ctx.fillStyle = S.path;
      ctx.fillRect(GAP.x, BAND.y, GAP.w, BAND.h);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.strokeRect(GAP.x, BAND.y, GAP.w, BAND.h);
    }
    // ⑬ 물 경계(항구·설산)에는 관문 자리에 다리를 놓아요 (예전엔 물 위를 걸었어요)
    if (tiled && (this.c.style === 'harbor' || this.c.style === 'snow')) drawBridge(ctx, GAP.x, BAND.y - 12, GAP.w, BAND.h + 24, false, t);
    // 관문 그림이 없을 때만 예전 반투명 막
    if (!this.gateOpen(save) && !this.gateArtReady()) drawGateBarrier(ctx, { x: GAP.x, y: BAND.y, w: GAP.w, h: BAND.h }, S.gate, t);

    if (!tiled) {
      drawCliff(ctx, cam.x, 0, w, CLIFF_H);
      ctx.fillStyle = S.cliff;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(cam.x, 26, w, CLIFF_H - 26);
      ctx.globalAlpha = 1;
    }
    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
  }

  drawBuilding(ctx, b, t) {
    if (drawKitBuilding(ctx, this.c.style, b)) return;
    if (drawBuildingSet(ctx, this.c.style, b)) return;
    if (artHouse(ctx, b.x, b.y, b.w, b.sign)) return;
    const st = this.c.style;
    if (st === 'cube') drawCubeBuilding(ctx, b.x, b.y, { w: b.w, h: b.main ? 130 : 100, color: b.main ? '#9b8fe0' : '#9aa7d6', t, sign: b.sign });
    else if (st === 'harbor') drawCottage(ctx, b.x, b.y, { w: b.w, roof: '#2f6fbf', wall: '#fffaf0', sign: b.sign });
    else if (st === 'castle') drawStoneHouse(ctx, b.x, b.y, { w: b.w, roof: b.main ? '#ffcc33' : '#c2304a', sign: b.sign });
    else if (st === 'forest') drawTreeHouse(ctx, b.x, b.y + 4, { sign: b.sign, t });
    else drawCabin(ctx, b.x, b.y, { w: b.w, sign: b.sign });
  }

  drawables(t, player, save) {
    this.saveRef = save;
    const list = this.decor.map((d) => ({
      y: d.y,
      draw: (ctx) => {
        if (drawKitDecor(ctx, this.c.style, d)) return;
        switch (d.type) {
          case 'tree': drawTree(ctx, d.x, d.y, d.s, this.c.style === 'forest' ? '#3fa35a' : undefined); break;
          case 'pine': drawPine(ctx, d.x, d.y, d.s); break;
          case 'cubeTree': drawPine(ctx, d.x, d.y, d.s * 0.9, false); break;
          case 'bush': drawBush(ctx, d.x, d.y, d.s, this.c.style === 'snow' ? '#dfeaf7' : undefined); break;
          // 눈사람·큐브 블록 그림이 없어 가장 가까운 새 그림으로 (바위 / 푸른 수정)
          case 'snowman': if (!assets.draw(ctx, 'nature/rock_small', d.x, d.y + 4, { height: 40 })) drawSnowman(ctx, d.x, d.y); break;
          case 'cubeBlock': if (!assets.draw(ctx, 'dungeon3/blue_crystal', d.x, d.y + 4, { height: 58 })) drawCubeBuilding(ctx, d.x, d.y, { w: 34, h: 34, color: '#3ee6d0', t }); break;
          case 'lighthouse': drawLighthouse(ctx, d.x, d.y, true, t); break;
          case 'boat': drawBoat(ctx, d.x, d.y, t, d.color); break;
          case 'tower': if (!assets.draw(ctx, 'buildings2/watchtower', d.x, d.y + 6, { height: 200 })) drawCastleTower(ctx, d.x, d.y, d.flag); break;
          default: break;
        }
      },
    }));
    for (const b of this.buildings) list.push({ y: b.y, draw: (ctx) => this.drawBuilding(ctx, b, t) });
    list.push({ y: 900, draw: (ctx) => drawKit(ctx, KIT_STALL, this.c.style, 1460, 900) || drawMerchantStall(ctx, 1460, 900, t) });
    list.push({ y: 1230, draw: (ctx) => drawKitSmithy(ctx, this.c.style, 560, 1230, t) || drawSmithy(ctx, 560, 1230, t) });
    list.push({ y: usesWell(this.c.style) ? wellSortY(1050) : 1050, draw: (ctx) => drawKit(ctx, KIT_FOUNTAIN, this.c.style, 1100, 1050) || drawHealSpot(ctx, this.c.style, 1100, 1050) || drawFountain(ctx, 1100, 1050, t) });
    list.push({ y: 938, draw: (ctx) => drawVillager(ctx, 852, 938, t, { style: this.c.style, robe: this.style.robe }) });
    list.push({ y: 1330, draw: (ctx) => drawRuneMaster(ctx, 1560, 1330, t) });
    list.push({ y: 1180, draw: (ctx) => drawBoardSet(ctx, this.c.style, 1290, 1180) || drawBoard(ctx, 1290, 1180, this.c.style) });
    list.push({ y: 1480, draw: (ctx) => drawKit(ctx, KIT_SIGN, this.c.style, 1190, 1480) || drawSignSet(ctx, 1190, 1480, this.name) || drawSign(ctx, 1190, 1480, this.name) });
    const lamps = kitLamps(this.c.style);
    list.push(...propDrawables(lamps ? VILLAGE_PROPS.filter((p) => p.k !== 'lamppost') : VILLAGE_PROPS));
    if (lamps) list.push(...lamps);
    list.push(...kitDrawables(this.c.style));
    list.push(...decoDrawables(decoFor(this.c.style)));
    list.push(...moodDrawables(this.c.style, this.village, this.saveRef, t));
    if (this.tiles?.terrain) list.push(...bandDrawables(this.c.style, BAND, GAP));
    list.push(...this.gateDrawables(save, t));
    const w = warpInteractable(this.c.village);
    list.push({ y: w.y, draw: (ctx) => drawWarpPoint(ctx, w.x, w.y, warpActive(this.saveRef, this.c.village), t, Math.max(0, 1 - (t - (this.warpBurstAt ?? -9)) / 1.4)) });
    return list;
  }
}
