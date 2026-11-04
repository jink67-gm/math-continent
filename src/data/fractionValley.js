// 「분수 계곡 마을」 지도
// 좌표는 픽셀(타일 64px). 물건의 x, y는 "발밑"(그림 아래 가운데) 위치예요.
// 대사는 원래 게임(js/data/npcs.js)에서 가져왔어요.

import { TerrainGrid, T, seeded } from '../world/terrain.js';

export const COLS = 44;
export const ROWS = 32;
export const WIDTH = COLS * T;   // 2816
export const HEIGHT = ROWS * T;  // 2048

const MID = 22;           // 가운데 큰길 (꼭짓점 x)
const ROAD_Y = 17;        // 가로 큰길 (꼭짓점 y)
const PLAZA = { x: MID * T, y: ROAD_Y * T + 8 };

export const VILLAGE = {
  id: 'fractionValley',
  name: '분수 계곡 마을',
  subtitle: '분수의 나눗셈',
  bgm: 'bgm_town',
  spawn: { x: MID * T, y: 29 * T },
};

export function buildTerrain() {
  const g = new TerrainGrid(COLS, ROWS);

  // 북쪽 강 (다리 근처는 곧게)
  for (let x = 0; x <= COLS; x++) {
    const wave = Math.abs(x - MID) < 5 ? 0 : Math.round(Math.sin(x / 3.2) * 0.8);
    g.rect(x, 5 + wave, x, 7 + wave, 'w');
  }
  // 남서쪽 연못
  g.circle(7, 27.5, 2.6, 'w');

  // 큰길: 남쪽 입구 → 광장 → 다리 → 북쪽 숲길
  g.rect(MID - 1, 0, MID + 1, ROWS, 'd');
  g.rect(MID - 1, 5, MID + 1, 7, 'w'); // 다리 아래는 물
  // 가로 큰길
  g.rect(4, ROAD_Y - 1, 40, ROAD_Y + 1, 'd');
  // 광장
  g.circle(MID, ROAD_Y + 0.5, 4.6, 'd');
  // 아래쪽 집으로 가는 작은 길
  for (const x of [7, 14, 30]) g.rect(x - 1, ROAD_Y, x, 24, 'd');
  // 밭으로 가는 길
  g.rect(30, 26, 40, 27, 'd');
  g.rect(30, 24, 31, 27, 'd');
  return g;
}

// ── 건물 ──────────────────────────────────────────
const BS = 1.45; // 건물 크기 배율
export const BUILDINGS = [
  { k: 'buildings3/mayor_office', x: 15 * T, y: 15 * T + 8, label: '촌장의 집' },
  { k: 'buildings3/math_library', x: 29.5 * T, y: 15 * T + 8, label: '룬의 집' },
  { k: 'buildings3/cottage_thatched', x: 7 * T, y: 15 * T + 8 },
  { k: 'buildings3/inn', x: 37 * T, y: 15 * T + 8, label: '여관' },
  { k: 'buildings3/blacksmith', x: 6.5 * T, y: 24 * T + 16, label: '대장간' },
  { k: 'buildings3/general_shop', x: 13.5 * T, y: 24 * T + 16, label: '루루 상점' },
  { k: 'buildings3/house_blue_small', x: 29.5 * T, y: 24 * T + 16 },
  { k: 'buildings3/house_red', x: 37 * T, y: 23.5 * T },
].map((b) => ({ ...b, s: BS, solid: 'building' }));

// ── 소품 ──────────────────────────────────────────
const P = (k, x, y, s = 1, solid = null, extra = {}) => ({ k, x, y, s, solid, ...extra });

export const PROPS = [
  // 광장
  P('village2/plaza_round', PLAZA.x, PLAZA.y + 170, 1.2, null, { flat: true }),
  P('pack4/fraction_garden/fountain_round', PLAZA.x, PLAZA.y + 70, 1.35, [150, 60]),
  P('village2/bench_back', PLAZA.x - 150, PLAZA.y + 250, 0.5, [120, 26]),
  P('village2/bench_back', PLAZA.x + 150, PLAZA.y + 250, 0.5, [120, 26]),
  P('plaza7/flowerbed', PLAZA.x - 210, PLAZA.y + 170, 0.8, [80, 30]),
  P('plaza7/flowerbed', PLAZA.x + 210, PLAZA.y + 170, 0.8, [80, 30]),
  P('village2/sign', PLAZA.x + 175, PLAZA.y - 95, 0.5, [60, 20]),

  // 큰길 가로등
  ...[6, 12, 18, 26, 32, 38].map((tx) => P('village2/lamp_post', tx * T + 32, (ROAD_Y - 1.4) * T, 0.42, [24, 14])),
  ...[3, 4.5, 10.5, 12.5].map((ty, i) => P('village2/lamp_post', (MID + (i % 2 ? 1.6 : -1.6)) * T, (ROAD_Y + 4 + ty * 1.5) * T, 0.42, [24, 14])),

  // 상점·대장간 앞
  P('plaza7/barrel_crates', 11 * T, 24.5 * T, 0.7, [90, 30]),
  P('pack4/fraction_garden/flower_cart', 16.3 * T, 24.6 * T, 0.75, [110, 30]),
  P('village2/barrel', 4.3 * T, 24.6 * T, 0.38, [50, 20]),
  P('plaza7/planter_crate', 9 * T, 24.7 * T, 0.6, [50, 20]),
  P('plaza7/barrel_flowers', 17.2 * T, 15.2 * T, 0.6, [40, 16]),
  P('plaza7/barrel_flowers_pink', 12.8 * T, 15.2 * T, 0.6, [40, 16]),
  P('pack4/fraction_garden/flower_box_a', 27 * T, 15.3 * T, 0.7, [90, 20]),
  P('plaza7/planter_stone', 39.3 * T, 15.3 * T, 0.65, [80, 20]),

  // 분수 밭 (½ · ¼ · ⅛)
  P('pack4/fraction_garden/hedge_straight', 31.5 * T, 25.3 * T, 1, [128, 24]),
  P('pack4/fraction_garden/hedge_arch', 33.6 * T, 25.3 * T, 1, null),
  P('pack4/fraction_garden/hedge_straight', 35.6 * T, 25.3 * T, 1, [128, 24]),
  P('pack4/fraction_garden/hedge_straight', 37.6 * T, 25.3 * T, 1, [128, 24]),
  P('pack4/fraction_garden/hedge_straight', 39.6 * T, 25.3 * T, 1, [128, 24]),
  P('pack4/fraction_garden/garden_plot_half', 33 * T, 31 * T - 10, 0.9, [210, 90], { label: '1/2 밭' }),
  P('pack4/fraction_garden/garden_plot_quarters', 36.6 * T, 31 * T - 10, 0.9, [210, 90], { label: '1/4 밭' }),
  P('pack4/fraction_garden/garden_plot_eighths', 40.2 * T, 31 * T - 10, 0.9, [210, 90], { label: '1/8 밭' }),

  // 연못
  P('pack4/fraction_garden/pond_lilypads', 7 * T, 28.2 * T, 0.9, null, { flat: true }),
  P('pack4/fraction_garden/garden_bench_a', 10.6 * T, 27.6 * T, 0.7, [80, 20]),
  P('plaza7/shrub_flowers', 3.3 * T, 29.4 * T, 0.7, [60, 20]),

  // 다리 앞
  P('plaza7/signpost', (MID + 2.2) * T, 9.4 * T, 0.45, [30, 14], { label: '계곡 동굴 ↑' }),
  P('plaza7/signpost', (MID + 2.2) * T, 31.2 * T, 0.45, [30, 14], { label: '출발의 초원 ↓' }),
];

// ── 나무·덤불 (가장자리 숲 + 흩어진 나무) ──────────
export function scatterNature(grid) {
  const rnd = seeded(20261103);
  const out = [];
  const tree = (x, y, big = true) => {
    const r = rnd();
    const k = big ? (r < 0.45 ? 'nature/tree_big' : r < 0.75 ? 'nature/tree_pine' : 'nature/tree_big_yellow')
      : (r < 0.5 ? 'nature/tree_small' : 'nature/tree_young');
    const s = big ? 0.4 + rnd() * 0.08 : 0.55 + rnd() * 0.1;
    out.push(P(k, x, y, s, [44, 22]));
  };
  // 북쪽 숲 (강 위, 가운데 숲길만 비움)
  for (let x = 40; x < WIDTH; x += 96 + rnd() * 30) {
    if (Math.abs(x - MID * T) < 170) continue;
    tree(x, 1.3 * T + rnd() * 30);
    if (rnd() < 0.7) tree(x + 40, 3.6 * T + rnd() * 20, rnd() < 0.5);
  }
  // 남쪽 숲 (입구만 비움)
  for (let x = 30; x < WIDTH; x += 92 + rnd() * 30) {
    if (Math.abs(x - MID * T) < 160) continue;
    if (x > 31 * T && x < 42 * T) continue; // 밭 아래는 낮은 덤불만
    tree(x, HEIGHT - 4 + rnd() * 8);
  }
  for (let x = 31 * T; x < 42 * T; x += 70) out.push(P('nature/bush', x, HEIGHT - 6, 0.35, [50, 18]));
  // 서쪽·동쪽 숲
  for (let y = 9.5 * T; y < HEIGHT - 60; y += 88 + rnd() * 24) {
    tree(10 + rnd() * 30, y);
    tree(WIDTH - 10 - rnd() * 30, y);
  }
  // 덤불·바위·풀 흩뿌리기 (길과 물은 피해서)
  const near = (x, y, t) => {
    const vx = Math.round(x / T);
    const vy = Math.round(y / T);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid.get(vx + dx, vy + dy) === t) return true;
    return false;
  };
  const deco = [
    ['nature/bush', 0.32, [44, 16]], ['nature/bush_flower', 0.32, [44, 16]], ['nature/bush_berry', 0.3, [44, 16]],
    ['nature/rock_small', 0.28, [50, 16]], ['plaza7/tuft_a', 0.7, null], ['plaza7/tuft_b', 0.6, null],
    ['plaza7/tuft_c', 0.7, null], ['plaza7/tuft_stones', 0.55, null], ['plaza7/pebbles_a', 0.5, null],
  ];
  const keepOut = [...BUILDINGS.map((b) => ({ x: b.x, y: b.y - 120, r: 210 })), { x: PLAZA.x, y: PLAZA.y + 40, r: 330 },
    { x: 36.6 * T, y: 29 * T, r: 340 }, { x: 7 * T, y: 27.5 * T, r: 200 }];
  for (let i = 0; i < 150; i++) {
    const x = 2.5 * T + rnd() * (WIDTH - 5 * T);
    const y = 8.6 * T + rnd() * (HEIGHT - 10 * T);
    if (near(x, y, 'd') || near(x, y, 'w')) continue;
    if (keepOut.some((k) => (k.x - x) ** 2 + (k.y - y) ** 2 < k.r ** 2)) continue;
    const [k, s, solid] = deco[Math.floor(rnd() * deco.length)];
    out.push(P(k, x, y, s * (0.9 + rnd() * 0.2), solid, solid ? {} : { flat: true }));
  }
  return out;
}

// ── 다리 ──────────────────────────────────────────
export const BRIDGE = { x: MID * T, top: 4.2 * T, bottom: 8.3 * T };

// ── 마을 사람 ─────────────────────────────────────
// sprite: npc3 폴더 이름 / 'pipi'
export const NPCS = [
  {
    id: 'chief', sprite: 'farmer', name: '풍차 촌장 모모', x: 16.8 * T, y: 15.9 * T,
    lines: [
      ['분수 계곡에 온 걸 환영하네. 바람이 참 좋지?', '그런데 요즘 풍차가 힘없이 돌고 있다네.'],
      ['풍차가 다시 힘차게 돌려면 「분수의 결정」이 필요하다네.', '북쪽 다리가 부서져서 동굴로 갈 수가 없어…'],
      ['계곡 동굴은 위험하니 회복약을 꼭 챙기게.'],
    ],
  },
  {
    id: 'runeMaster', sprite: 'math_sage', name: '룬 할아버지', x: 31.4 * T, y: 15.9 * T,
    lines: [
      ['기술은 힘만으로 배우는 게 아니란다.', '수학의 룬을 깨워야 하지.'],
      ['레벨이 오르면 새로운 기술을 가르쳐 주마.'],
      ['허허, 서두르지 말거라. 틀려도 다시 도전하면 된단다.'],
    ],
  },
  {
    id: 'merchant', sprite: 'traveling_merchant', name: '상인 루루', x: 15.2 * T, y: 25.1 * T,
    lines: [
      ['어서 오세요! 좋은 물건 많아요~'],
      ['쓰지 않는 재료는 팔아서 골드로 바꿀 수 있어요!'],
    ],
  },
  {
    id: 'smith', sprite: 'blacksmith', name: '대장장이 쿵쿵', x: 8.4 * T, y: 25.1 * T,
    lines: [
      ['쾅! 쾅! 장비를 강화하려면 재료와 수학 실력이 필요하지!'],
      ['문제를 틀려도 재료는 사라지지 않으니 걱정 말게.'],
    ],
  },
  {
    id: 'guard', sprite: 'town_guard', name: '경비병 단단', x: (MID + 1.9) * T, y: 10.4 * T,
    lines: [
      ['멈추시오! 다리가 부서져서 건널 수 없소.', '촌장님께 먼저 이야기를 들어 보시오.'],
    ],
  },
  {
    id: 'innkeeper', sprite: 'innkeeper', name: '여관 주인 포근', x: 38.7 * T, y: 15.9 * T,
    lines: [['먼 길 오느라 고생했지요? 마을 한가운데 샘물을 마시면 기운이 난답니다.']],
  },
  {
    id: 'child', sprite: 'village_child', name: '꼬마 콩이', x: 19 * T, y: 20.5 * T, wander: 90,
    lines: [
      ['밭이 반으로, 또 반으로 나뉘어 있는 거 봤어?', '1/2, 1/4, 1/8 밭이래!'],
      ['피자를 4조각으로 나누면 한 조각은 1/4이야. 나는 2조각 먹을래!'],
    ],
  },
  {
    id: 'pipi', sprite: 'pipi', name: '안내 요정 피피', x: (MID - 1.8) * T, y: 28.6 * T, portrait: 'pack4/pipi/portrait', float: true,
    lines: [
      ['모험가님, 분수 계곡 마을에 온 걸 환영해요!', '먼저 풍차 촌장님께 인사드려 볼까요? 광장 왼쪽 위 집이에요.'],
      ['NPC 가까이에서 E 키(또는 💬 버튼)를 누르면 이야기할 수 있어요.'],
      ['Space로 구르기, J로 공격! 마을 안은 안전하니 마음껏 연습해 보세요.'],
    ],
  },
];

// ── 살펴볼 수 있는 곳 ─────────────────────────────
export const SPOTS = [
  {
    id: 'fountain', kind: 'heal', name: '치유의 샘', x: PLAZA.x, y: PLAZA.y + 110, r: 130, label: '샘물 마시기',
    lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']],
  },
  {
    id: 'board', kind: 'read', name: '마을 게시판', x: PLAZA.x + 175, y: PLAZA.y - 90, r: 80, label: '게시판 보기',
    lines: [['[알림] 북쪽 나무다리 공사 중', '고칠 수 있는 모험가를 찾습니다. — 촌장 모모']],
  },
  {
    id: 'bridge', kind: 'read', name: '부서진 나무다리', x: MID * T, y: 8.9 * T, r: 90, label: '다리 살펴보기',
    lines: [['강을 건너는 나무다리가 부서져 있어요.', '다리 기둥에 수학 룬이 새겨져 있어요. 룬을 맞추면 다시 이어진대요!']],
  },
  ...['1/2', '1/4', '1/8'].map((f, i) => ({
    id: `plot${i}`, kind: 'read', name: `${f} 밭`, x: (33 + i * 3.6) * T, y: 29.4 * T, r: 90, label: '밭 살펴보기',
    lines: [[
      `밭 전체를 똑같이 ${[2, 4, 8][i]}칸으로 나눴어요.`,
      `한 칸은 전체의 ${f}이에요. ${i === 2 ? '1/8 두 칸을 합치면 1/4이 돼요!' : i === 1 ? '1/4 두 칸을 합치면 1/2이 돼요!' : '1/2 두 칸이면 밭 전체예요!'}`,
    ]],
  })),
];

export const EXITS = [
  { id: 'south', x: MID * T - 96, y: HEIGHT - 36, w: 192, h: 36, to: '출발의 초원' },
  { id: 'north', x: MID * T - 96, y: 0, w: 192, h: 36, to: '계곡 바위 숲' },
];
