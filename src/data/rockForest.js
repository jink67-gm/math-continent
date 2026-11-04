// 「계곡 바위 숲」 — 마을 북쪽, 다리를 건너면 나오는 두 번째 필드 (16px 칸)
// 아래(남쪽)는 마을, 위(북쪽) 끝에는 「뒤집힌 동굴」 입구가 있어요.
// 초원보다 몬스터가 1.4배 강해요 (권장 Lv 3~6).

import { TerrainGrid, T, seeded } from '../world/terrain.js';

export const COLS = 48;
export const ROWS = 44;
export const WIDTH = COLS * T;
export const HEIGHT = ROWS * T;

const C = (n) => n * T;
const MID = 22;

export const FOREST = {
  id: 'rockForest',
  village: 'fractionValley',
  name: '계곡 바위 숲',
  subtitle: '동굴로 가는 길',
  bgm: 'bgm_field',
  unit: 'fractionDivision',
  mapV: 1,
  power: 1.4,
};

const roadX = (y) => (y > ROWS - 6 ? MID : MID + Math.round(Math.sin(y / 5) * 6));

export function buildTerrain() {
  const g = new TerrainGrid(COLS, ROWS);
  for (let y = 2; y < ROWS; y++) g.rect(roadX(y), y, roadX(y) + 1, y, 'd');
  for (let y = 3; y < ROWS; y++) {
    const a = roadX(y - 1);
    const b = roadX(y);
    if (a !== b) g.rect(Math.min(a, b), y, Math.max(a, b) + 1, y, 'd');
  }
  g.circle(MID + 2, 3.5, 3, 'd');   // 동굴 앞 공터
  g.circle(MID + 1, ROWS - 3, 2.4, 'd');
  // 계곡 물줄기 (서쪽에서 흘러와 웅덩이로)
  for (let x = 0; x < 14; x++) g.rect(x, 21 + Math.round(Math.sin(x / 2.5)), x, 22 + Math.round(Math.sin(x / 2.5)), 'w');
  g.circle(15, 22, 2.6, 'w');
  g.circle(38, 11, 2.8, 'w');
  return g;
}

export const SPAWNS = [
  ['Slime', 15, 34], ['Mushroom', 31, 34], ['Butterfly', 10, 30], ['Mushroom', 34, 28],
  ['Flam', 12, 15], ['Spirit', 30, 18], ['Flam', 35, 21], ['Mushroom', 17, 26],
  ['Spirit', 13, 8], ['Flam', 31, 7], ['Butterfly', 39, 16], ['Spirit', 8, 12],
].map(([kind, x, y]) => ({ kind, x: C(x), y: C(y) }));

const P = (k, x, y, solid = null) => ({ k, x: C(x), y: C(y), solid });

// 동굴 입구: 큰 회색 바위 두 무더기 사이
export const CAVE_MOUTH = { x: C(MID + 2), y: C(2.2) };

export const PROPS = [
  P('rock_grey_stack', MID - 1.5, 3.2, [44, 20]), P('rock_grey_stack', MID + 5.5, 3.2, [44, 20]),
  P('rock_grey_big', MID - 6, 2.8, [56, 18]), P('rock_grey_big', MID + 10, 2.8, [56, 18]),
  P('sign', MID + 4.6, 6.4, [10, 5]),
  P('sign', MID + 3.6, ROWS - 3.5, [10, 5]),
];

const BOULDERS = ['rock_grey', 'rock_grey_big', 'rock_grey_tall', 'rock_brown', 'rock_brown_big', 'rock_brown_tall'];
const BOULDER_SOLID = { rock_grey: [26, 10], rock_grey_big: [56, 18], rock_grey_tall: [26, 14], rock_brown: [26, 10], rock_brown_big: [56, 18], rock_brown_tall: [26, 14] };

export function scatterNature(grid) {
  const rnd = seeded(20261106);
  const out = [];
  const tree = (x, y, isBig) => {
    const k = isBig ? (rnd() < 0.5 ? 'tree_big' : 'tree_big_orange') : (rnd() < 0.6 ? 'tree_pine' : 'tree_green');
    out.push({ k, x, y, solid: isBig ? [14, 6] : [10, 5] });
  };
  // 테두리 숲 (남쪽 입구만 비우고, 북쪽은 바위가 막아요)
  for (let x = 0.5; x < COLS; x += 1.4 + rnd() * 0.6) {
    if (Math.abs(x - (MID + 1)) > 3) tree(C(x), C(ROWS) - 1, rnd() < 0.4);
    if (Math.abs(x - (MID + 2)) > 13) tree(C(x), C(1.4), rnd() < 0.4);
  }
  for (let y = 2.5; y < ROWS - 1; y += 1.3 + rnd() * 0.5) {
    tree(C(0.7 + rnd() * 0.6), C(y), rnd() < 0.4);
    tree(C(COLS - 0.7 - rnd() * 0.6), C(y), rnd() < 0.4);
  }
  const clear = (cx, cy, r) => {
    for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) if (grid.get(Math.floor(cx) + dx, Math.floor(cy) + dy) !== 'g') return false;
    if (SPAWNS.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < r * r)) return false;
    if (PROPS.some((p) => (p.x / T - cx) ** 2 + (p.y / T - cy) ** 2 < 16)) return false;
    return out.every((o) => o.flat || (o.x / T - cx) ** 2 + (o.y / T - cy) ** 2 > 5);
  };
  // 바위와 소나무 무리
  for (let i = 0; i < 60; i++) {
    const cx = 3 + rnd() * (COLS - 6);
    const cy = 6 + rnd() * (ROWS - 10);
    if (!clear(cx, cy, 4)) continue;
    if (rnd() < 0.55) {
      const k = BOULDERS[Math.floor(rnd() * BOULDERS.length)];
      out.push({ k, x: C(cx), y: C(cy), solid: BOULDER_SOLID[k] });
    } else tree(C(cx), C(cy), rnd() < 0.3);
  }
  const deco = [['bush_a', [10, 5]], ['grass_a'], ['grass_b'], ['flower_b'], ['rock_grey_s', [10, 5]], ['rock_brown_s', [10, 5]], ['grass_a']];
  for (let i = 0; i < 200; i++) {
    const cx = 2 + Math.floor(rnd() * (COLS - 4));
    const cy = 4 + Math.floor(rnd() * (ROWS - 6));
    const [k, solid] = deco[Math.floor(rnd() * deco.length)];
    if (grid.get(cx, cy) !== 'g' || grid.get(cx, cy - 1) !== 'g') continue;
    if (solid && !clear(cx + 0.5, cy + 0.5, 2.5)) continue;
    out.push({ k, x: C(cx + 0.5), y: C(cy + 1), solid: solid || null, flat: !solid });
  }
  return out;
}

export const SPOTS = [
  {
    id: 'forestSign1', kind: 'read', name: '나무 표지판', x: C(MID + 4.6), y: C(6.8), r: 22, label: '표지판 읽기',
    lines: [['↑ 뒤집힌 동굴', '「나누는 수를 뒤집으면 길이 열린다」라고 적혀 있어요.']],
  },
  {
    id: 'forestSign2', kind: 'read', name: '나무 표지판', x: C(MID + 3.6), y: C(ROWS - 3.1), r: 22, label: '표지판 읽기',
    lines: [['계곡 바위 숲', '초원보다 몬스터가 강해요. 레벨 3 이상이면 좋아요.', '↓ 나눔의 계곡 프락시아']],
  },
];

export const EXITS = [
  { id: 'south', x: C(MID - 1), y: HEIGHT - 6, w: C(4), h: 6, to: '나눔의 계곡 프락시아', scene: 'Village', entry: 'north' },
  { id: 'cave', x: C(MID + 1), y: C(1.2), w: C(2), h: C(1.2), to: '뒤집힌 동굴', scene: 'Cave', entry: 'south' },
];

export const SPAWN_SOUTH = { x: C(MID + 1), y: C(ROWS - 3) };
export const SPAWN_NORTH = { x: C(MID + 2), y: C(4.6) };
