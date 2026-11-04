// 「분수 계곡 마을」 지도 (16px 칸, 화면에서는 3배로 보여요)
// 위치는 칸 단위로 적고 C()로 픽셀로 바꿔요. 물건의 x, y는 "발밑"(그림 아래 가운데)이에요.
// 대사는 원래 게임(js/data/npcs.js)에서 가져왔어요.

import { TerrainGrid, T, seeded } from '../world/terrain.js';

export const COLS = 46;
export const ROWS = 34;
export const WIDTH = COLS * T;
export const HEIGHT = ROWS * T;

const C = (n) => n * T;
const MID = 22;   // 세로 큰길 왼쪽 칸 (22~23 두 칸)
const ROAD = 17;  // 가로 큰길 윗줄 (17~18 두 칸)
const SPRING = { x: 27, y: 21.5 }; // 치유의 샘 가운데 (칸 경계 기준)

export const VILLAGE = {
  id: 'fractionValley',
  name: '분수 계곡 마을',
  subtitle: '분수의 나눗셈',
  bgm: 'bgm_town',
  spawn: { x: C(MID + 1), y: C(31) },
};

export function buildTerrain() {
  const g = new TerrainGrid(COLS, ROWS);
  // 북쪽 강
  for (let x = 0; x < COLS; x++) {
    const wave = Math.abs(x - MID) < 5 ? 0 : Math.round(Math.sin(x / 3.1) * 0.9);
    g.rect(x, 5 + wave, x, 7 + wave, 'w');
  }
  // 큰길
  g.rect(MID, 0, MID + 1, ROWS - 1, 'd');
  g.rect(MID, 5, MID + 1, 7, 'w');            // 다리 밑은 물
  g.rect(4, ROAD, 41, ROAD + 1, 'd');
  // 광장
  g.circle(MID + 1, ROAD + 2.5, 4.6, 'd');
  // 치유의 샘
  // 모서리를 깎은 4×4칸 샘
  g.rect(25, 20, 28, 22, 'w');
  g.rect(26, 19, 27, 23, 'w');
  // 아래쪽 집으로 가는 길
  for (const x of [8, 15, 31, 38]) g.rect(x, ROAD + 2, x + 1, 25, 'd');
  // 밭으로 가는 길
  g.rect(31, 26, 44, 27, 'd');
  // 서쪽 작은 연못
  g.circle(6.5, 29, 2.3, 'w');
  return g;
}

// ── 건물 (발밑 = 문 아래 칸) ───────────────────────
export const BUILDINGS = [
  { k: 'house_big', x: C(15.5), y: C(ROAD), label: '촌장의 집' },
  { k: 'house_round', x: C(31), y: C(ROAD), label: '룬의 집' },
  { k: 'house_timber', x: C(8), y: C(ROAD) },
  { k: 'house_tavern', x: C(39), y: C(ROAD), label: '여관' },
  { k: 'house_red', x: C(8.5), y: C(26) },
  { k: 'kiln', x: C(5.5), y: C(26) },
  { k: 'house_shop', x: C(15.5), y: C(26), label: '루루 상점' },
  { k: 'house_orange', x: C(31.5), y: C(26) },
  { k: 'house_beige', x: C(38.5), y: C(26) },
].map((b) => ({ ...b, solid: 'building' }));

// ── 소품 ──────────────────────────────────────────
const P = (k, x, y, solid = null, extra = {}) => ({ k, x: C(x), y: C(y), solid, ...extra });

export const PROPS = [
  P('barrel', 13, 26, [12, 8]), P('jar', 12.2, 26, [10, 6]), P('cart', 18.6, 26, [26, 10]),
  P('barrel', 11.4, 26, [12, 8]), P('table', 4.8, 18, null),
  P('laundry', 35, 26, null), P('jar', 41.6, 17, [10, 6]), P('barrel', 26.6, 17, [12, 8]),
  P('scarecrow', 29.8, 30.8, [8, 6]),
  P('fence', 33.5, 25.2, [48, 6]), P('fence', 36.5, 25.2, [48, 6]), P('fence', 39.5, 25.2, [48, 6]), P('fence', 42.5, 25.2, [48, 6]),
];

// 분수 밭: 4×2칸 밭에서 심은 칸 수로 분수를 보여 줘요 (½ = 8칸 중 4칸, ¼ = 2칸, ⅛ = 1칸)
export const PLOTS = [
  { x: 31, y: 29, label: '1/2 밭', planted: 4 },
  { x: 35.5, y: 29, label: '1/4 밭', planted: 2 },
  { x: 40, y: 29, label: '1/8 밭', planted: 1 },
];

// ── 나무·덤불 ─────────────────────────────────────
export function scatterNature(grid) {
  const rnd = seeded(20261104);
  const out = [];
  const big = ['tree_big', 'tree_big', 'tree_big_pink', 'tree_big_orange'];
  const small = ['tree_green', 'tree_round', 'tree_pine', 'tree_lime', 'tree_pink'];
  const tree = (x, y, isBig) => {
    const k = isBig ? big[Math.floor(rnd() * big.length)] : small[Math.floor(rnd() * small.length)];
    out.push({ k, x, y, solid: isBig ? [14, 6] : [10, 5] });
  };
  // 강 위 숲 (가운데 숲길만 비움)
  for (let x = 1; x < COLS; x += 1.6 + rnd() * 0.8) {
    if (Math.abs(x - (MID + 1)) < 2.6) continue;
    tree(C(x), C(2.2 + rnd() * 0.5), rnd() < 0.55);
    if (rnd() < 0.6) tree(C(x + 0.7), C(4.4), false);
  }
  // 남쪽 숲 (입구만 비움)
  for (let x = 0.5; x < COLS; x += 1.5 + rnd() * 0.7) {
    if (Math.abs(x - (MID + 1)) < 2.4) continue;
    tree(C(x), C(ROWS) - 1, rnd() < 0.5);
  }
  // 서쪽·동쪽 숲
  for (let y = 9.5; y < ROWS - 1; y += 1.4 + rnd() * 0.6) {
    tree(C(0.7 + rnd() * 0.6), C(y), rnd() < 0.5);
    tree(C(COLS - 0.7 - rnd() * 0.6), C(y), rnd() < 0.5);
  }
  // 덤불·꽃·풀 흩뿌리기 (길·물·건물은 피해서)
  const near = (cx, cy) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid.get(cx + dx, cy + dy) !== 'g') return true;
    return false;
  };
  const keepOut = [...BUILDINGS.map((b) => ({ x: b.x / T, y: b.y / T - 1.5, r: 3.4 })),
    ...PLOTS.map((p) => ({ x: p.x + 2, y: p.y + 1, r: 3.2 })), { x: 29.8, y: 30, r: 1.5 }];
  const deco = [['bush_a', [10, 5]], ['bush_b', [10, 5]], ['bush_c', [10, 5]], ['flower_a'], ['flower_b'], ['grass_a'], ['grass_b'], ['flower_a']];
  for (let i = 0; i < 170; i++) {
    const cx = 2 + Math.floor(rnd() * (COLS - 4));
    const cy = 9 + Math.floor(rnd() * (ROWS - 11));
    if (near(cx, cy)) continue;
    if (keepOut.some((k) => (k.x - cx) ** 2 + (k.y - cy) ** 2 < k.r ** 2)) continue;
    const [k, solid] = deco[Math.floor(rnd() * deco.length)];
    out.push({ k, x: C(cx + 0.5), y: C(cy + 1), solid: solid || null, flat: !solid });
  }
  return out;
}

// ── 부서진 다리 (칸) ──────────────────────────────
export const BRIDGE = { x0: MID, x1: MID + 1, y0: 5, y1: 7, gap: 6 };

// ── 마을 사람 ─────────────────────────────────────
// sprite: assets/na/chars 폴더 이름
export const NPCS = [
  {
    id: 'chief', sprite: 'OldMan', name: '풍차 촌장 모모', x: C(18.2), y: C(ROAD + 0.4),
    lines: [
      ['분수 계곡에 온 걸 환영하네. 바람이 참 좋지?', '그런데 요즘 풍차가 힘없이 돌고 있다네.'],
      ['풍차가 다시 힘차게 돌려면 「분수의 결정」이 필요하다네.', '북쪽 다리가 부서져서 동굴로 갈 수가 없어…'],
      ['계곡 동굴은 위험하니 회복약을 꼭 챙기게.'],
    ],
  },
  {
    id: 'runeMaster', sprite: 'OldMan3', name: '룬 할아버지', x: C(33.3), y: C(ROAD + 0.4),
    lines: [
      ['기술은 힘만으로 배우는 게 아니란다.', '수학의 룬을 깨워야 하지.'],
      ['레벨이 오르면 새로운 기술을 가르쳐 주마.'],
      ['허허, 서두르지 말거라. 틀려도 다시 도전하면 된단다.'],
    ],
  },
  {
    id: 'merchant', sprite: 'Villager4', name: '상인 루루', x: C(17.6), y: C(26.4),
    lines: [['어서 오세요! 좋은 물건 많아요~'], ['쓰지 않는 재료는 팔아서 골드로 바꿀 수 있어요!']],
  },
  {
    id: 'smith', sprite: 'Shaman', name: '대장장이 쿵쿵', x: C(7.2), y: C(26.6),
    lines: [['쾅! 쾅! 장비를 강화하려면 재료와 수학 실력이 필요하지!'], ['문제를 틀려도 재료는 사라지지 않으니 걱정 말게.']],
  },
  {
    id: 'guard', sprite: 'Knight', name: '경비병 단단', x: C(MID + 3), y: C(9.6),
    lines: [['멈추시오! 다리가 부서져서 건널 수 없소.', '촌장님께 먼저 이야기를 들어 보시오.']],
  },
  {
    id: 'innkeeper', sprite: 'OldWoman', name: '여관 주인 포근', x: C(41.3), y: C(ROAD + 0.4),
    lines: [['먼 길 오느라 고생했지요?', '광장 옆 샘물을 마시면 기운이 난답니다.']],
  },
  {
    id: 'child', sprite: 'Child', name: '꼬마 콩이', x: C(19.5), y: C(22), wander: 26,
    lines: [
      ['밭에 심은 칸 수를 세어 봤어?', '8칸 중에 4칸이면 1/2, 2칸이면 1/4이래!'],
      ['피자를 4조각으로 나누면 한 조각은 1/4이야. 나는 2조각 먹을래!'],
    ],
  },
  {
    id: 'pipi', sprite: 'Spirit', name: '안내 정령 피피', x: C(MID - 1.2), y: C(29.5), float: true,
    lines: [
      ['모험가님, 분수 계곡 마을에 온 걸 환영해요!', '먼저 풍차 촌장님께 인사드려 볼까요? 광장 왼쪽 위 큰 집이에요.'],
      ['마을 사람 가까이에서 E 키(또는 💬 버튼)를 누르면 이야기할 수 있어요.'],
      ['Space로 구르기, J로 공격! 마을 안은 안전하니 마음껏 연습해 보세요.'],
    ],
  },
];

// ── 살펴볼 수 있는 곳 ─────────────────────────────
export const SPOTS = [
  {
    id: 'spring', kind: 'heal', name: '치유의 샘', x: C(SPRING.x), y: C(SPRING.y + 2.8), r: 34, label: '샘물 마시기',
    lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']],
  },
  {
    id: 'bridge', kind: 'read', name: '부서진 나무다리', x: C(MID + 1), y: C(8.6), r: 26, label: '다리 살펴보기',
    lines: [['강을 건너는 나무다리가 부서져 있어요.', '다리 기둥에 수학 룬이 새겨져 있어요. 룬을 맞추면 다시 이어진대요!']],
  },
  ...PLOTS.map((p, i) => {
    const n = [2, 4, 8][i];
    return {
      id: `plot${i}`, kind: 'read', name: p.label, x: C(p.x + 2), y: C(p.y + 2.6), r: 30, label: '밭 살펴보기',
      lines: [[
        `밭 8칸 중에 ${p.planted}칸에 씨앗을 심었어요.`,
        `${p.planted}/8 = 1/${n} 이에요. ${n === 8 ? '1/8 두 개를 합치면 1/4이 돼요!' : n === 4 ? '1/4 두 개를 합치면 1/2이 돼요!' : '1/2 두 개면 밭 전체예요!'}`,
      ]],
    };
  }),
];

export const EXITS = [
  { id: 'south', x: C(MID - 1), y: HEIGHT - 6, w: C(4), h: 6, to: '출발의 초원' },
  { id: 'north', x: C(MID - 1), y: 0, w: C(4), h: 6, to: '계곡 바위 숲' },
];
