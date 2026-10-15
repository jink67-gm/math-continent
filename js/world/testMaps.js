// 개발 점검용 맵 2곳 (정식 지도에는 없음, 주소 ?test=village / ?test=forest 로만) — testVillage · testForest
// 그림 점검 마을 → 동쪽 길 → 속삭이는 숲
// 좌표는 모두 타일 단위(1타일 = 64px). 물체 y는 "바닥(발) 위치".
import { AssetScene } from './AssetScene.js';

function grid(w, h, ch = '.') { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function rect(g, x0, y0, x1, y1, ch, only) {
  for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++) if (!only || only.includes(g[y][x])) g[y][x] = ch;
}
function ellipse(g, cx, cy, rx, ry, ch, only) {
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1 && (!only || only.includes(g[y][x]))) g[y][x] = ch;
  }
}
// 구불구불한 길: 점들을 지나는 굵은 선
function path(g, pts, r, ch, only) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      const px = x + 0.5, py = y + 0.5, vx = bx - ax, vy = by - ay;
      const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
      if (Math.hypot(px - (ax + vx * t), py - (ay + vy * t)) <= r && (!only || only.includes(g[y][x]))) g[y][x] = ch;
    }
  }
}

// ======================= 그림 점검 마을 =======================
function villageDef() {
  const W = 40, H = 30, g = grid(W, H);
  // 북쪽 언덕(나무가 자라는 높은 곳)과 절벽
  rect(g, 0, 0, W - 1, 3, 'h');
  for (let x = 0; x < W; x++) g[4][x] = '#';
  // 남동쪽 연못
  ellipse(g, 34, 25.4, 4.2, 2.4, '~');
  // 큰길(돌길): 서쪽 입구 → 광장 → 동쪽 입구, 살짝 굽이치게
  path(g, [[0, 15], [6, 15.4], [12, 14.6], [16, 15.2]], 1.15, 'c');
  path(g, [[24, 15.2], [29, 14.4], [35, 15.2], [40, 15]], 1.15, 'c');
  ellipse(g, 20, 15.2, 4.6, 3.4, 'c');
  // 집 앞 작은 길 (흙길)
  path(g, [[8, 11.9], [8.3, 13.4], [9.5, 14.4]], 0.7, '=', ['.']);
  path(g, [[15.2, 11.6], [15.6, 13.4], [17, 14.2]], 0.7, '=', ['.']);
  path(g, [[26, 11.8], [25.6, 13.4], [24, 14.3]], 0.7, '=', ['.']);
  path(g, [[20, 18.4], [19.2, 21.2], [16.4, 24.2], [11, 24.6], [6.4, 24.0]], 0.8, '=', ['.']);
  path(g, [[22, 18.3], [25.5, 21.6]], 0.8, '=', ['.']);
  path(g, [[25.5, 21.6], [31.2, 22.4]], 0.75, '=', ['.']);
  // 남서쪽 텃밭 쪽 흙
  ellipse(g, 6.8, 20.8, 3.2, 1.5, ',', ['.']);
  const obj = (k, x, y, o = {}) => ({ k, x, y, ...o });
  const objects = [
    // 건물
    obj('buildings2/house_red_a', 8, 11.7), obj('buildings2/house_blue', 15.2, 11.5), obj('buildings2/house_green', 26, 11.7),
    obj('buildings2/watchtower', 33.5, 11.2), obj('buildings2/house_red_b', 14.2, 23.0), obj('buildings2/market_stall', 25.5, 21.5),
    obj('buildings2/blacksmith_workshop', 31.2, 22.2),
    // 광장: 우물·벤치·가로등·화분
    obj('village2/well', 20, 15.6), obj('village2/bench_back', 16.6, 12.9), obj('village2/bench_back', 23.4, 12.9),
    obj('village2/bench', 17.2, 18.8), obj('village2/lamp_post', 14.6, 13.6), obj('village2/lamp_post', 25.4, 13.6),
    obj('village2/lamp_post', 14.6, 17.4), obj('village2/lamp_post', 25.4, 17.4), obj('village2/planter', 22.8, 18.9),
    obj('village2/lamp_hanging', 4.2, 13.8), obj('village2/lamp_hanging', 36.2, 13.8),
    // 표지판
    obj('village2/signpost', 2.6, 13.7), obj('village2/sign', 37.8, 13.8),
    // 텃밭 울타리 (남서쪽, 가로 3~10.7칸 · 세로 18.7~22.8칸) — 아래쪽 가운데가 문
    obj('village2/fence_long', 4.22, 18.7), obj('village2/fence_long', 6.66, 18.7), obj('village2/fence_long', 9.1, 18.7), obj('village2/fence_post', 10.6, 18.75),
    obj('village2/fence_long', 4.22, 22.8), obj('village2/gate', 6.34, 22.85), obj('village2/fence_long', 8.46, 22.8), obj('village2/fence_post', 10.6, 22.85),
    ...[19.25, 19.8, 20.35, 20.9, 21.45, 22.0, 22.5].flatMap((y) => [obj('village2/fence_post', 3.0, y), obj('village2/fence_post', 10.6, y)]),
    obj('village2/planter', 8.6, 20.2), obj('nature/bush_berry', 4.4, 20.4),
    // 대장간·시장 소품
    obj('village2/barrel', 28.6, 22.6), obj('village2/barrel', 29.2, 23.0), obj('village2/barrel', 23.3, 21.9),
    obj('village2/planter', 6.0, 12.1), obj('village2/planter', 28.3, 12.0),
    // 연못가
    obj('nature/rock_mid', 30.2, 26.9), obj('nature/rock_small', 38.0, 23.4), obj('village2/bench', 34.2, 22.6),
    // 언덕 위 숲
    obj('nature/tree_big', 3, 3.3), obj('nature/tree_pine', 7.5, 2.6), obj('nature/tree_big_yellow', 12, 3.4), obj('nature/tree_big', 17.5, 2.8),
    obj('nature/tree_pine', 22, 3.3), obj('nature/tree_big', 26.5, 2.7), obj('nature/tree_big_yellow', 31.5, 3.3), obj('nature/tree_pine', 35.5, 2.5),
    obj('nature/tree_big', 39, 3.2), obj('nature/tree_small', 10, 1.6), obj('nature/tree_small', 29, 1.5), obj('nature/tree_pine', 19.5, 1.2),
    // 마을 가장자리 나무
    obj('nature/tree_big', 1.4, 9), obj('nature/tree_pine', 1.2, 20), obj('nature/tree_big', 1.6, 27), obj('nature/tree_big_yellow', 6, 28.5),
    obj('nature/tree_big', 15, 28.6), obj('nature/tree_pine', 20.5, 28.2), obj('nature/tree_big', 26, 28.7), obj('nature/tree_big', 39, 9.5),
    obj('nature/tree_pine', 39.2, 20.5), obj('nature/tree_small', 38.6, 28.5),
    obj('nature/tree_small', 12.4, 8.2), obj('nature/tree_young', 21.5, 8.6), obj('nature/tree_small', 30.2, 8.4),
    obj('nature/tree_young', 17.6, 24.2), obj('nature/tree_small', 3.6, 25.6),
    // 덤불
    obj('nature/bush_flower', 5.6, 9.9), obj('nature/bush', 11, 10.2), obj('nature/bush_flower', 18.3, 10.6), obj('nature/bush_yellow', 23.3, 10.4),
    obj('nature/bush_berry', 29, 10.2), obj('nature/bush_flower', 17.0, 22.6), obj('nature/bush', 36.6, 10.8), obj('nature/bush_flower', 21.8, 24.6),
  ];
  return {
    id: 'testVillage', name: '그림 점검 마을 (개발용)', village: 'fractionValley', bgm: 'fractionValley',
    w: W, h: H, grid: g, plazas: [[20, 15.2, 2.3]], spawn: [20, 18.2], objects,
    npcs: [
      { id: 'elder', x: 18.2, y: 17.6 }, { id: 'merchant', x: 23.6, y: 22.6 }, { id: 'blacksmith', x: 29.8, y: 23.5 },
      { id: 'guard', x: 37.2, y: 16.9 }, { id: 'farmer', x: 6.2, y: 21.4 }, { id: 'kid', x: 31.6, y: 26.9 },
      { id: 'innkeeper', x: 10.2, y: 13.0 }, { id: 'adventurer', x: 12.2, y: 24.6 }, { id: 'scholar', x: 16.8, y: 13.6 }, { id: 'priestess', x: 23.4, y: 13.7 },
    ],
    interactables: [{ id: 'testWell', kind: 'heal', x: 20, y: 17.0, r: 110, label: '우물 물 마시기 (체력 회복)', headY: -120 }],
    exits: [
      { id: 'toMeadow', rect: { x: 0, y: 13.6, w: 0.5, h: 3 }, to: 'meadow', spawn: { x: 90, y: 700 }, label: '출발의 초원', dir: 'left', marker: [1.2, 14.6] },
      { id: 'toForest', rect: { x: 39.5, y: 13.6, w: 0.5, h: 3 }, to: 'testForest', spawn: { x: 110, y: 25 * 64 }, label: '속삭이는 숲', dir: 'right', marker: [38.6, 14.6] },
    ],
    zones: [],
  };
}

// ======================= 속삭이는 숲 =======================
function forestDef() {
  const W = 48, H = 36, g = grid(W, H);
  // 북쪽 고원 + 절벽(가로로 길게) + 가운데 돌계단 2칸
  rect(g, 0, 0, W - 1, 11, 'h');
  for (let x = 0; x < W; x++) g[12][x] = '#';
  g[12][23] = 'S'; g[12][24] = 'S';
  // 어두운 숲 바닥
  for (const [cx, cy, rx, ry] of [[6, 5, 6, 4], [42, 6, 6, 4.5], [4, 32, 6, 4], [44, 31, 5, 4], [16, 33, 6, 3], [30, 33, 6, 3]]) ellipse(g, cx, cy, rx, ry, ',', ['.', 'h']);
  // 호수 (남서쪽) · 고원 위 작은 못
  ellipse(g, 9.5, 21.5, 5.2, 3.3, '~');
  ellipse(g, 36, 5.2, 3.2, 2, '~');
  // 흙길: 서쪽 입구 → 호숫가 → 계단 → 고원 → 북동쪽 공터
  path(g, [[0, 25.2], [5, 26.2], [12, 26.6], [17, 24.6], [20.5, 19.5], [23.6, 15.5], [24, 13.2]], 1.0, '=', ['.', ',']);
  path(g, [[24, 11.6], [24.6, 9.4], [28, 7.6], [31.5, 8.2]], 1.0, '=', ['h']);
  path(g, [[20.5, 19.5], [28, 21], [35, 22.5], [41, 24]], 0.85, '=', ['.', ',']);
  const obj = (k, x, y, o = {}) => ({ k, x, y, ...o });
  const objects = [
    // 계단 양옆 표시 바위
    obj('nature/rock_big', 20.6, 13.9), obj('nature/rock_mid', 27.2, 13.7),
    // 호숫가
    obj('nature/rock_mid', 4.2, 18.6), obj('nature/rock_small', 14.6, 19.2), obj('nature/bush_flower', 13.4, 24.4), obj('nature/tree_young', 5.2, 25.2),
    // 길목 표지판
    obj('village2/sign', 2.4, 24.2), obj('village2/signpost', 22.4, 15.6),
    // 고원 연못가
    obj('nature/rock_small', 32.4, 6.4), obj('nature/bush_berry', 39.6, 4.4),
  ];
  return {
    id: 'testForest', name: '속삭이는 숲 (새 에셋 테스트)', village: 'fractionValley', bgm: 'field',
    w: W, h: H, grid: g, spawn: [2.2, 25.4], objects,
    npcs: [{ id: 'scout', x: 4.4, y: 23.9 }, { id: 'mystic', x: 30.6, y: 9.4 }],
    scatter: {
      seed: 7, count: 95, margin: 1.5,
      kinds: ['nature/tree_big', 'nature/tree_big', 'nature/tree_pine', 'nature/tree_pine', 'nature/tree_big_yellow', 'nature/tree_small', 'nature/tree_young',
        'nature/bush', 'nature/bush_flower', 'nature/bush_berry', 'nature/bush_yellow', 'nature/rock_mid', 'nature/rock_small', 'nature/rock_tiny', 'nature/rock_big'],
      // 전투 공간·길 주변은 비워 둠 (타일 단위)
      avoid: [{ x: 28, y: 15, w: 14, h: 8 }, { x: 14, y: 26, w: 9, h: 6 }, { x: 26, y: 3.5, w: 7, h: 6 }, { x: 0, y: 23, w: 4, h: 5 }, { x: 19, y: 12.5, w: 9, h: 4 }],
    },
    zones: [
      { id: 'tfSlimes', rect: { x: 29, y: 16, w: 12, h: 6 }, types: ['slime', 'mushroom'], max: 5, respawn: 7 },
      { id: 'tfLake', rect: { x: 15, y: 27, w: 7, h: 4 }, types: ['slime'], max: 3, respawn: 8 },
      { id: 'tfPlateau', rect: { x: 27, y: 4, w: 6, h: 5 }, types: ['bat', 'wildBoar'], max: 3, respawn: 10 },
    ],
    areas: [{ id: 'tfPlateauArea', name: '고원 공터', rect: { x: 25, y: 3, w: 9, h: 7 } }],
    exits: [
      { id: 'toVillage', rect: { x: 0, y: 23.8, w: 0.5, h: 3 }, to: 'testVillage', spawn: { x: 38.4 * 64, y: 15 * 64 }, label: '그림 점검 마을', dir: 'left', marker: [1.2, 25] },
    ],
  };
}

export const TestVillage = () => new AssetScene(villageDef());
export const TestForest = () => new AssetScene(forestDef());
