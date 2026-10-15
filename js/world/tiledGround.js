// 기존 장면(출발의 초원 · 분수 계곡 마을 · 마을 2~6)의 바닥을 새 타일로 그리기
// - 장면의 기능적인 위치(길·광장·강·다리·절벽·출구·NPC)는 그대로 두고, 같은 좌표를 타일 지도로 옮깁니다.
// - 새 타일을 아직 못 불러왔으면 draw()가 false → 장면이 예전 바닥을 그려요.
import { assets } from '../render/AssetManager.js';
import {
  TILE, buildAutoTerrain, drawAutoShimmer, autoReady, loadAuto, makeGrid, fillRect, fillEllipse, fillPath, quad,
} from '../render/autoTerrain.js';
import { plazaReady, loadPlaza } from '../render/tilePlaza.js';

export class TiledGround {
  constructor(spec) {
    this.spec = spec;
    this.terrain = null;
    const build = () => {
      try { this.terrain = buildAutoTerrain(spec); } catch (e) { console.warn('[TiledGround]', e); }
    };
    const ready = () => autoReady() && (!spec.tilePlaza || plazaReady());
    if (ready()) build();
    else Promise.all([loadAuto(), spec.tilePlaza ? loadPlaza() : null]).then(build);
  }

  draw(ctx, cam, w, h, t) {
    const tr = this.terrain;
    if (!tr) return false;
    const W = tr.canvas.width, H = tr.canvas.height;
    // 지도 밖(화면 가장자리)은 잔디색으로
    ctx.fillStyle = this.spec.style === 'snow' ? '#dfe8f2' : '#5f9a3a';
    ctx.fillRect(cam.x, cam.y, w, h);
    const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y));
    const sw = Math.min(W - sx, Math.ceil(w) + 2), sh = Math.min(H - sy, Math.ceil(h) + 2);
    if (sw <= 0 || sh <= 0) return true;
    ctx.drawImage(tr.canvas, sx, sy, sw, sh, sx, sy, sw, sh);
    if (this.spec.style !== 'snow') drawAutoShimmer(ctx, tr, { x: sx, y: sy, w: sw, h: sh }, t);
    return true;
  }
}

// ---------- 마을 공통 배치 (분수 계곡 마을 · 마을 2~6이 같은 구조) ----------
// 위쪽 절벽(0~285) · 강/경계(512~640) · 가운데 큰길(x=1100) · 굽은 길 2개 · 광장(1100,1080)
function villageGrid({ band = 'water', roads = '=', base = '.', sea = false, west = false, east = false } = {}) {
  const w = 35, h = 26, g = makeGrid(w, h, base);
  fillRect(g, 0, 0, w - 1, 3, 'h');
  fillRect(g, 0, 4, w - 1, 4, '#');
  if (band === 'water') fillRect(g, 0, 8, w - 1, 9, '~');
  // 큰길 (다리 → 남쪽 출구), 다리 → 동굴
  fillPath(g, [[1100, 1660], [1100, 640]], 50, roads, [base]);
  fillPath(g, [[1100, 512], [1100, 300]], 50, roads, [base]);
  // ⑭ 던전은 마을 밖으로: 북쪽 절벽에 돌계단 → 언덕 위 길 → 탐험 필드
  fillPath(g, [[1100, 300], [1100, 250]], 50, 'S', ['#']);
  fillPath(g, [[1100, 250], [1100, -60]], 46, roads, ['h']);
  // 굽은 길 2개
  fillPath(g, [...quad([330, 900], [700, 980], [1100, 1060]), ...quad([1100, 1060], [1500, 980], [1880, 900])], 38, roads, [base]);
  fillPath(g, [...quad([560, 1300], [900, 1200], [1100, 1120]), ...quad([1100, 1120], [1350, 1220], [1660, 1300])], 38, roads, [base]);
  // 이웃 마을로 가는 길 (서쪽 입구 · 동쪽 출구) — 굽은 길 끝(330,900)·(1880,900)에서 가장자리까지
  if (west) fillPath(g, [[-40, 900], [330, 900]], 38, roads, [base]);
  if (east) fillPath(g, [[1880, 900], [2260, 900]], 38, roads, [base]);
  // 항구: 동쪽 바다
  if (sea) fillRect(g, 32, 9, w - 1, h - 1, '~');
  // 광장: 새 광장 타일로 (큰 원형 그림 한 장 대신) — 흙길이 들어오는 6곳에 이음 타일
  // 지도 칸에는 'P'(광장)로 표시만 → 나무·꽃·덤불이 광장 위에 놓이지 않게 (그림은 drawTilePlaza가 그림)
  fillEllipse(g, 1100 / TILE, 1080 / TILE, 4.3, 2.95, 'P', [base]);
  const dirtRoads = roads === '=';
  const tilePlaza = {
    x: 1100, y: 1080, a: 250, b: 165, seed: base === ',' ? 3 : 1,
    joins: dirtRoads ? [[1100, 928, 0], [1100, 1232, Math.PI], [872, 1012, -1.19], [1328, 1012, 1.19], [888, 1190, -1.89], [1312, 1190, 1.89]] : [],
  };
  return { w, h, grid: g, plazas: [], tilePlaza, faceShift: -35 };
}

export function fractionVillageTiles() {
  return new TiledGround(villageGrid({ east: true }));
}

// 마을 2~6: 마을 양식에 따라 바닥·길·북쪽 경계를 다르게
export function templateVillageTiles(style) {
  const opt = {
    cube: { band: 'none', roads: 'c' },
    harbor: { band: 'water', roads: '=', sea: true },
    castle: { band: 'none', roads: 'c' },
    forest: { band: 'none', roads: '=', base: ',' },
    snow: { band: 'water', roads: '=' },
  }[style] || {};
  const spec = villageGrid({ ...opt, west: true, east: style !== 'harbor' && style !== 'snow' });
  spec.style = style;
  return new TiledGround(spec);
}

// 출발의 초원 (강 256~384, 다리 960~1088)
export function meadowTiles() {
  const w = 32, h = 23, g = makeGrid(w, h, '.');
  fillRect(g, 0, 4, w - 1, 5, '~');
  fillPath(g, [[1024, 0], [1024, 256]], 34, '=', ['.']);
  fillPath(g, [[1024, 384], [1024, 760], ...quad([1024, 760], [1024, 860], [1120, 900])], 34, '=', ['.']);
  fillPath(g, quad([980, 760], [650, 720], [360, 700]), 36, '=', ['.']);
  fillEllipse(g, 1800 / TILE, 1230 / TILE, 3.6, 2.9, ',');
  return new TiledGround({ w, h, grid: g });
}

// 북쪽 경계 장식 (물이 아닌 마을): 성벽·생울타리·돌담을 나란히 세움 (가운데 문 자리는 비움)
export function bandDrawables(style, band, gap) {
  const kind = { castle: 'dungeon3/stone_wall', cube: 'dungeon3/stone_wall', forest: 'terrain3/hedges_19' }[style];
  if (!kind || !assets.meta[kind]) return [];
  const m = assets.meta[kind];
  const height = kind.includes('hedge') ? 70 : 92;
  const step = m.w * (height / m.h) * 0.92;
  const list = [];
  for (let x = step / 2 - 10; x < 2200 + step; x += step) {
    if (x + step / 2 > gap.x - 4 && x - step / 2 < gap.x + gap.w + 4) continue;
    const y = band.y + band.h - 18;
    list.push({ y, draw: (ctx) => assets.draw(ctx, kind, x, y + 4, { height }) });
  }
  return list;
}
