// 「뒤집힌 동굴」 — 1번 마을의 던전 (16px 칸)
// 남쪽 입구 → 지그재그 굴 → 룬 기둥 두 개와 봉인된 문 → 맨 위 보스 방(뒤집기 트롤 인버트롤)

import { TerrainGrid, T, seeded } from '../world/terrain.js';

export const COLS = 40;
export const ROWS = 50;
export const WIDTH = COLS * T;
export const HEIGHT = ROWS * T;

const C = (n) => n * T;

export const CAVE = {
  id: 'invertCave',
  village: 'fractionValley',
  name: '뒤집힌 동굴',
  subtitle: '인버트롤의 굴',
  bgm: 'bgm_dungeon',
  unit: 'fractionDivision',
  mapV: 1,
  power: 1.7,
};

// 바위벽: 칸 y줄에 x0~x1 (양 끝 포함)
export const WALLS = [
  { y: 38, x0: 0, x1: 25 }, { y: 38, x0: 33, x1: 39 },
  { y: 29, x0: 0, x1: 6 }, { y: 29, x0: 14, x1: 39 },
  { y: 19, x0: 0, x1: 17 }, { y: 19, x0: 23, x1: 39 }, // 가운데 18~22칸은 봉인된 문
];
export const DOOR = { x: C(20.5), y: C(19.6), w: C(5) };
export const BOSS = { x: C(20), y: C(9) };
export const BOSS_ROOM_Y = C(17.5);

export function buildTerrain() {
  const g = new TerrainGrid(COLS, ROWS);
  // 흙길: 입구 → 오른쪽 틈 → 왼쪽 틈 → 문 → 보스 방
  const path = [[20, 48], [20, 42], [29, 40], [29, 34], [10, 32], [10, 26], [20, 24], [20, 18], [20, 6]];
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1];
    const [bx, by] = path[i];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let k = 0; k <= n; k++) {
      const x = Math.round(ax + ((bx - ax) * k) / n);
      const y = Math.round(ay + ((by - ay) * k) / n);
      g.rect(x - 1, y, x, y, 'd');
    }
  }
  g.circle(20, 9.5, 7.5, 'd'); // 보스 방 바닥
  g.circle(20, 46, 3, 'd');
  // 땅속 웅덩이
  g.circle(6, 43, 2.6, 'w');
  g.circle(34, 25, 2.4, 'w');
  g.circle(4, 12, 2.2, 'w');
  g.circle(36, 6, 2.2, 'w');
  return g;
}

export const SPAWNS = [
  ['Slime', 12, 43], ['Slime', 30, 44],
  ['Mushroom', 24, 34], ['Flam', 14, 33], ['Spirit', 32, 31],
  ['Spirit', 8, 24], ['Flam', 30, 22], ['Flam', 22, 26], ['Mushroom', 4, 21],
].map(([kind, x, y]) => ({ kind, x: C(x), y: C(y) }));

export const SPOTS = [
  {
    id: 'caveA', kind: 'rune', name: '왼쪽 룬 기둥', x: C(12), y: C(22.4), r: 26, label: '룬 깨우기',
    runeLine: '기둥에 「÷」 모양 룬이 새겨져 있어요. 문제를 풀면 룬이 깨어나요.',
    sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'],
    litLines: ['룬이 금빛으로 빛나고 있어요.'],
  },
  {
    id: 'caveB', kind: 'rune', name: '오른쪽 룬 기둥', x: C(28), y: C(22.4), r: 26, label: '룬 깨우기',
    runeLine: '기둥에 「×」 모양 룬이 새겨져 있어요. 문제를 풀면 룬이 깨어나요.',
    sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'],
    litLines: ['룬이 금빛으로 빛나고 있어요.'],
  },
  {
    id: 'door', kind: 'read', name: '봉인된 문', x: C(20.5), y: C(21), r: 26, label: '문 살펴보기',
    lines: [['커다란 바위 문에 보라색 봉인이 걸려 있어요.', '양옆의 룬 기둥 두 개를 깨우면 열릴 것 같아요.']],
  },
];

export const EXITS = [
  { id: 'south', x: C(18), y: HEIGHT - 6, w: C(5), h: 6, to: '계곡 바위 숲', scene: 'RockForest', entry: 'north' },
];

export const SPAWN_SOUTH = { x: C(20), y: C(47) };

export function scatterDeco(grid) {
  const rnd = seeded(20261107);
  const out = [];
  const crystals = ['crystal_a', 'crystal_b', 'crystal_c', 'crystal_d', 'ore_a', 'ore_b', 'rock_grey_s', 'rock_brown_s'];
  for (let i = 0; i < 90; i++) {
    const cx = 1 + Math.floor(rnd() * (COLS - 2));
    const cy = 2 + Math.floor(rnd() * (ROWS - 3));
    if (grid.get(cx, cy) !== 'g') continue;
    if (WALLS.some((w) => Math.abs(w.y - cy) < 2)) continue;
    if (SPAWNS.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < 6)) continue;
    if (SPOTS.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < 9)) continue;
    if ((cx - 20) ** 2 + (cy - 9.5) ** 2 < 70) continue; // 보스 방 가운데는 비워요
    const k = crystals[Math.floor(rnd() * crystals.length)];
    out.push({ k, x: C(cx + 0.5), y: C(cy + 1), solid: [10, 5], glow: k.startsWith('crystal') });
  }
  return out;
}
