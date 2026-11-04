// 「출발의 초원」 필드 지도 — 분수 계곡 마을 남쪽 (16px 칸)
// 위(북쪽)는 마을로 가는 길이고, 남쪽으로 내려갈수록 강한 몬스터가 살아요.
//   입구 근처: 말랑 슬라임·장난꾸러기 나비
//   가운데:   졸린 버섯
//   깊은 곳:   길 잃은 정령·심술 불꽃

import { TerrainGrid, T, seeded } from '../world/terrain.js';

export const COLS = 48;
export const ROWS = 42;
export const WIDTH = COLS * T;
export const HEIGHT = ROWS * T;

const C = (n) => n * T;
const MID = 22; // 마을 남쪽 길과 같은 칸

export const FIELD = {
  id: 'startMeadow',
  village: 'fractionValley',
  townName: '나눔의 계곡 프락시아',
  name: '출발의 초원',
  subtitle: '첫 사냥터',
  bgm: 'bgm_field',
  mapV: 1,
};

const roadX = (y) => (y < 5 ? MID : MID + Math.round(Math.sin((y - 5) / 6) * 5));

const PONDS = [
  { x: 9.5, y: 14, r: 2.8 },
  { x: 38, y: 29.5, r: 3.4 },
  { x: 12, y: 33, r: 2.4 },
];

export function buildTerrain() {
  const g = new TerrainGrid(COLS, ROWS);
  for (let y = 0; y < ROWS - 3; y++) g.rect(roadX(y), y, roadX(y) + 1, y, 'd');
  // 길이 꺾이는 곳이 끊기지 않게 한 칸씩 이어 줘요
  for (let y = 1; y < ROWS - 3; y++) {
    const a = roadX(y - 1);
    const b = roadX(y);
    if (a !== b) g.rect(Math.min(a, b), y, Math.max(a, b) + 1, y, 'd');
  }
  g.circle(roadX(ROWS - 4) + 1, ROWS - 4, 3.2, 'd'); // 남쪽 끝 공터
  g.circle(MID + 1, 3, 2.2, 'd');                     // 입구 공터
  for (const p of PONDS) g.circle(p.x, p.y, p.r, 'w');
  return g;
}

// 몬스터가 사는 자리 (칸)
export const SPAWNS = [
  ['Slime', 16, 9], ['Slime', 30, 8], ['Slime', 28, 13], ['Slime', 15, 13],
  ['Butterfly', 34, 12], ['Butterfly', 19, 16],
  ['Mushroom', 12, 21], ['Mushroom', 32, 20], ['Mushroom', 27, 25],
  ['Slime', 17, 24], ['Slime', 36, 23], ['Butterfly', 7, 26],
  ['Spirit', 20, 32], ['Spirit', 31, 36], ['Spirit', 7, 37],
  ['Flam', 26, 31], ['Flam', 37, 37], ['Flam', 16, 37],
].map(([kind, x, y]) => ({ kind, x: C(x), y: C(y) }));

const P = (k, x, y, solid = null) => ({ k, x: C(x), y: C(y), solid });

export const PROPS = [
  P('sign', MID - 1.6, 5.2, [10, 5]),
  P('sign', MID + 4.6, 18.5, [10, 5]),
];

// ── 나무·덤불 ─────────────────────────────────────
export function scatterNature(grid) {
  const rnd = seeded(20261105);
  const out = [];
  const big = ['tree_big', 'tree_big', 'tree_big_pink', 'tree_big_orange'];
  const small = ['tree_green', 'tree_round', 'tree_pine', 'tree_lime', 'tree_pink'];
  const tree = (x, y, isBig) => {
    const k = isBig ? big[Math.floor(rnd() * big.length)] : small[Math.floor(rnd() * small.length)];
    out.push({ k, x, y, solid: isBig ? [14, 6] : [10, 5] });
  };
  // 테두리 숲 (북쪽 입구만 비움)
  for (let x = 0.5; x < COLS; x += 1.5 + rnd() * 0.7) {
    if (Math.abs(x - (MID + 1)) > 3) tree(C(x), C(1.2), rnd() < 0.5);
    tree(C(x), C(ROWS) - 1, rnd() < 0.5);
  }
  for (let y = 2.5; y < ROWS - 1; y += 1.4 + rnd() * 0.6) {
    tree(C(0.7 + rnd() * 0.6), C(y), rnd() < 0.5);
    tree(C(COLS - 0.7 - rnd() * 0.6), C(y), rnd() < 0.5);
  }
  // 몬스터 자리·길·물에서 떨어진 곳에만 나무 무리를 심어요
  const clear = (cx, cy, r) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid.get(Math.floor(cx) + dx, Math.floor(cy) + dy) !== 'g') return false;
    if (SPAWNS.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < r * r)) return false;
    if (PROPS.some((p) => (p.x / T - cx) ** 2 + (p.y / T - cy) ** 2 < 4)) return false;
    if (CHESTS.some((p) => (p.x / T - cx) ** 2 + (p.y / T - cy) ** 2 < 6)) return false;
    return true;
  };
  for (let i = 0; i < 26; i++) {
    const cx = 3 + rnd() * (COLS - 6);
    const cy = 5 + rnd() * (ROWS - 9);
    if (!clear(cx, cy, 4.5)) continue;
    tree(C(cx), C(cy), rnd() < 0.4);
  }
  const deco = [['bush_a', [10, 5]], ['bush_b', [10, 5]], ['bush_c', [10, 5]], ['flower_a'], ['flower_b'], ['grass_a'], ['grass_b'], ['flower_a'], ['flower_b']];
  for (let i = 0; i < 220; i++) {
    const cx = 2 + Math.floor(rnd() * (COLS - 4));
    const cy = 3 + Math.floor(rnd() * (ROWS - 5));
    const [k, solid] = deco[Math.floor(rnd() * deco.length)];
    if (!clear(cx + 0.5, cy + 0.5, solid ? 2.5 : 0)) continue;
    out.push({ k, x: C(cx + 0.5), y: C(cy + 1), solid: solid || null, flat: !solid });
  }
  return out;
}

export const NPCS = [
  {
    id: 'pipiField', sprite: 'Spirit', name: '안내 정령 피피', x: C(MID + 3.6), y: C(4), float: true,
    lines: [
      ['여기는 「출발의 초원」이에요!', '몬스터는 쓰러뜨리면 사라지는 게 아니라, 나쁜 기운이 빠져서 「정화」돼요.'],
      ['몬스터가 공격하기 전에 바닥에 빨간 원이 생겨요.', '그때 Space(또는 구르기 버튼)를 누르면 피할 수 있어요!'],
      ['공격 버튼을 계속 누르고 있으면 3단 콤보가 나가요.', '세 번째 공격은 몬스터를 멀리 밀어내요.'],
      ['힘들면 위쪽 길로 마을에 돌아가서 치유의 샘을 마셔요.'],
    ],
  },
];

// 황금 수학 상자 (숨은 구석)
export const CHESTS = [
  { id: 'meadow1', x: C(3.5), y: C(38.5), gold: 40, potions: 1 },
  { id: 'meadow2', x: C(44), y: C(6.5), gold: 60, armor: 'leather' },
];

export const SPOTS = [
  {
    id: 'sign1', kind: 'read', name: '나무 표지판', x: C(MID - 1.6), y: C(5.6), r: 22, label: '표지판 읽기',
    lines: [['↑ 나눔의 계곡 프락시아', '↓ 남쪽으로 갈수록 몬스터가 강해져요. 조심!']],
  },
  {
    id: 'sign2', kind: 'read', name: '나무 표지판', x: C(MID + 4.6), y: C(18.9), r: 22, label: '표지판 읽기',
    lines: [['이 아래는 길 잃은 정령과 심술 불꽃이 사는 곳.', '레벨 3 이상이면 좋아요.']],
  },
];

export const EXITS = [
  { id: 'north', x: C(MID - 1), y: 0, w: C(4), h: 6, to: '나눔의 계곡 프락시아', scene: 'Village', entry: 'south' },
];

export const SPAWN = { x: C(MID + 1), y: C(3) };
