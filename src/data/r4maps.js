// 4번 지역: 천칭 왕국 프로포르 (여러 지도가 이어진 구조)
//
//                        [기사의 협곡 rk_gorge] ──성문──▶ [왕성 지하 저울방 1층] ──▶ [2층 레이시오]
//                         ▲ (비 · 비례배분 · 비례식 룬)  ▲
//   [저울 평원 rk_plain] ─┘                          │
//          │                          [사과 과수원 rk_orchard] ──▶ 키르쿠스 (마을을 구한 뒤)
//   [왕성 마을 rk_town] ───────────────────────┘
//   ◀ 데시마르 방파제 │
//          [톱니바퀴 언덕 rk_hill]
//
// 좌표는 모두 16px 칸 단위.

import { MapBuilder } from '../world/MapBuilder.js';
import { seeded } from '../world/terrain.js';
import { scatter, S } from './r1maps.js';

const runeSpot = (id, name, x, y, where, mark) => ({
  id, kind: 'rune', name, x, y, r: 24, label: '룬 돌 살펴보기', stone: true,
  runeLine: `${where}의 룬 돌이에요. 「${mark}」 모양이 새겨져 있어요. 문제를 풀면 룬이 깨어나요!`,
  sleepLines: ['오래된 룬 돌이에요.', '왕국 재상님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'],
});

export const MAPS = {
  // ── 왕성 마을 프로포르 ─────────────────────────
  // 위쪽 언덕(재상의 집·룬의 집) · 가운데 천칭 광장 · 사방으로 나가는 길. 둘레는 성벽 같은 절벽.
  rk_town: {
    name: '왕성 마을 프로포르', subtitle: '천칭 왕국', bgm: 'bgm_town', theme: 'meadow', cols: 44, rows: 34, safe: true, node: [250, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(4101);
      b.block(0, 0, 7, 14).block(36, 0, 43, 14).block(8, 0, 18, 1).block(25, 0, 35, 1);
      b.block(0, 22, 5, 33).block(38, 22, 43, 33).block(6, 30, 17, 33).block(26, 30, 37, 33);
      b.high(8, 2, 35, 10).high(19, 0, 24, 1).stairs(21, 11, 2);
      b.path([[21, 0], [21, 10]], 2).path([[11, 9], [32, 9]], 1);
      b.circle(22, 19.5, 4.2, 'd');
      b.path([[21, 13], [21, 16]], 2);
      b.path([[0, 18], [18, 18]], 2).path([[26, 18], [43, 18]], 2);
      b.path([[21, 23], [21, 33]], 2);
      b.path([[12, 19], [12, 24]], 1).path([[32, 19], [32, 24]], 1);
      b.ground(15, 23, 16, 24, 'w');
      b.obj('house_big', 14, 8.6, { solid: 'building', label: '재상의 집' });
      b.obj('house_round', 29, 8.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_shop', 11, 27.6, { solid: 'building', label: '왕실 상점' });
      b.obj('house_orange', 32.5, 27.6, { solid: 'building', label: '대장간' });
      b.obj('house_tavern', 33, 16.4, { solid: 'building', label: '여관' });
      b.obj('house_red', 10, 16.4, { solid: 'building', label: '빵집' });
      // 광장의 천칭: 가운데 기둥(상자) + 양쪽 접시(상자)
      b.obj('zl_crates', 22, 18.2, { solid: [28, 12] }).obj('barrel', 19.6, 19.2, { solid: [12, 8] }).obj('barrel', 24.4, 19.2, { solid: [12, 8] });
      b.obj('zl_bench', 28, 22.6, { solid: [44, 8] });
      b.obj('zl_pot_blue', 8.4, 27.8, { solid: [10, 6] }).obj('zl_pot_white', 13.6, 27.8, { solid: [10, 6] }).obj('zl_plant_big', 29.6, 27.8, { solid: [10, 6] });
      b.obj('zl_pot_bush', 11.4, 8.8, { solid: [10, 6] }).obj('zl_pot_blue', 26.6, 8.8, { solid: [10, 6] });
      b.obj('sign', 24.4, 13.8, { solid: [10, 5] }).obj('sign', 23.4, 30.6, { solid: [10, 5] });
      for (const [x, y] of [[10, 4], [33, 4], [17, 5]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      for (const [x, y] of [[3, 16], [40, 16], [8, 24], [36, 24]]) b.obj('tree_round', x, y, { solid: [14, 6], tree: true });
      b.roughen(rnd);
      scatter(b, rnd, 90, { keep: [[22, 18, 5], [21, 31, 3], [16, 24, 2.5]] });
      return b;
    },
    exits: [
      { side: 'west', from: 16, to: 21, map: 'dh_pier', entry: 'east' },
      { side: 'north', from: 20, to: 23, map: 'rk_plain', entry: 'south' },
      { side: 'east', from: 16, to: 21, map: 'rk_orchard', entry: 'west' },
      { side: 'south', from: 20, to: 23, map: 'rk_hill', entry: 'north' },
    ],
    entries: { plaza: [22, 24.5] },
    npcs: [
      { id: 'chief', sprite: 'KnightGold', name: '왕국 재상 포르', x: 17.4, y: 9.8, lines: [['어서 오시오. 이곳은 공평함을 소중히 여기는 천칭 왕국이오.']] },
      { id: 'runeMaster', sprite: 'OldMan3', name: '룬 학자 레시오', x: 26.4, y: 9.8, lines: [['기술의 룬을 배우러 왔는가?']] },
      { id: 'merchant', sprite: 'Villager2', name: '왕실 상인 비비', x: 13.6, y: 28.8, role: 'shop', lines: [['왕실에 납품하는 좋은 물건이에요~']] },
      { id: 'smith', sprite: 'Shaman', name: '대장장이 저울', x: 29.4, y: 28.8, role: 'forge', lines: [['균형 잡힌 칼이 좋은 칼이지!']] },
      { id: 'innkeeper', sprite: 'Woman', name: '여관 주인 반반', x: 30.6, y: 17.4, lines: [['먼 길 오느라 고생했어요.', '광장 옆 샘물을 마시면 기운이 나요.']] },
      { id: 'guard', sprite: 'Knight', name: '왕실 기사 균형', x: 19.4, y: 13.8, lines: [['성 북쪽은 저울 평원, 동쪽은 사과 과수원, 남쪽은 톱니바퀴 언덕이오.']] },
      { id: 'child', sprite: 'Child', name: '꼬마 비율이', x: 27, y: 25, wander: 16, lines: [['빵 10개를 2:3으로 나누면 4개랑 6개래!', '2+3=5니까 10을 5로 나눠서 2씩!']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '왕성의 샘', x: 16, y: 25.4, r: 26, label: '샘물 마시기', lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'scale', kind: 'read', name: '광장 천칭', x: 22, y: 20.8, r: 26, label: '천칭 살펴보기',
        lines: [['왼쪽 접시에 사과 2개, 오른쪽 접시에 배 3개를 올리면 균형이 맞아요.', '사과와 배의 무게의 비는 3 : 2 예요.'], ['비례식 2 : 3 = 4 : 6 에서', '바깥쪽 곱 2×6과 안쪽 곱 3×4는 똑같이 12예요!']] },
      { id: 'bakery', kind: 'read', name: '빵집 진열대', x: 10, y: 17.6, r: 22, label: '빵집 살펴보기',
        lines: [['빵 20개를 두 가게가 2 : 3으로 나누어 가져요.', '2+3=5 → 20÷5=4 → 4×2=8개, 4×3=12개 (비례배분)']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 23.4, y: 31, r: 24, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 24.4, y: 14.2, r: 22, label: '안내판 읽기',
        lines: [['↑ 저울 평원 (권장 Lv20~22)', '→ 사과 과수원 (Lv21~23)', '↓ 톱니바퀴 언덕 (Lv22~24)', '← 데시마르 등대 방파제']] },
    ],
  },

  // ── 저울 평원 (Lv20~22) ────────────────────────
  // 남쪽 입구에서 곧게 올라가면 가운데 언덕 위 「비의 룬」. 동쪽 길은 기사의 협곡으로.
  rk_plain: {
    name: '저울 평원', subtitle: '권장 Lv20~22', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 3.6, node: [250, 100],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(4202);
      b.block(0, 0, 43, 2).block(0, 3, 3, 33).block(40, 14, 43, 33);
      b.block(4, 29, 17, 33).block(26, 29, 39, 33);
      b.block(5, 14, 12, 18).block(28, 18, 36, 23).block(8, 22, 15, 25).block(30, 4, 37, 8);
      b.high(15, 3, 27, 8).stairs(21, 9, 2);
      b.path([[21, 33], [21, 11]], 2).path([[21, 13], [39, 13], [43, 10]], 2);
      b.path([[21, 8], [21, 5]], 2).circle(21.5, 5, 2, 'd');
      b.ground(34, 15, 35, 16, 'w').circle(7, 8, 2.2, 'w');
      for (const [x, y] of [[12, 11], [25, 25], [34, 27]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[5, 11], [18, 20], [37, 11], [29, 15]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_round', x, y, { solid: [16, 6], tree: true });
      b.obj('sign', 23.6, 31.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 140, { keep: [[21.5, 5, 3], [21, 31, 2]] });
      return b;
    },
    spawns: S([['Racoon', 16, 13], ['Racoon', 30, 12], ['Racoon', 22, 21], ['Racoon', 33, 26], ['Snake2', 4.5, 21], ['Snake2', 26, 16], ['Snake2', 9, 6], ['Lizard', 18, 27], ['Lizard', 38, 6]]),
    chests: [{ id: 'r4_pl', x: 26, y: 4.4, gold: 300, potions: 2 }],
    exits: [
      { side: 'south', from: 20, to: 23, map: 'rk_town', entry: 'north' },
      { side: 'east', from: 8, to: 12, map: 'rk_gorge', entry: 'west' },
    ],
    spots: [
      runeSpot('runeRatio', '비의 룬 돌', 21.5, 5, '저울 평원', '2 : 3'),
      { id: 'plSign', kind: 'read', name: '표지판', x: 23.6, y: 31.8, r: 22, label: '표지판 읽기', lines: [['저울 평원 · 권장 Lv20~22', '↓ 프로포르 · → 기사의 협곡']] },
    ],
  },

  // ── 사과 과수원 (Lv21~23) ──────────────────────
  // 줄지어 선 사과나무 사이 길. 동남쪽 언덕 위 「비례배분의 룬」. 북쪽은 협곡, 동쪽은 키르쿠스 가는 길.
  rk_orchard: {
    name: '사과 과수원', subtitle: '권장 Lv21~23', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 3.8, node: [400, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(4303);
      b.block(0, 0, 29, 3).block(34, 0, 43, 3).block(0, 4, 4, 13).block(0, 21, 4, 33);
      b.block(41, 4, 43, 18).block(41, 25, 43, 33);
      b.high(30, 24, 40, 29).stairs(33, 30, 2);
      b.path([[0, 16], [20, 16], [20, 21], [43, 21]], 2);
      b.path([[31, 0], [31, 20]], 2);
      b.path([[29, 23], [29, 32], [34, 32]], 1);
      b.path([[33, 29], [35, 26]], 2).circle(35.5, 26, 2, 'd');
      // 줄지어 선 과수원 나무 (사이로 다닐 수 있어요)
      for (const y of [7, 11]) for (const x of [8, 12, 16, 24]) b.obj('tree_big_orange', x, y, { solid: [16, 6], tree: true });
      for (const y of [25, 29]) for (const x of [8, 12, 16, 22]) b.obj('tree_big_orange', x, y, { solid: [16, 6], tree: true });
      for (const x of [33.5, 36.5]) b.obj('fence', x, 13.4, { solid: [48, 6] });
      for (const [x, y] of [[26, 13], [37, 9]]) b.obj('zl_crates', x, y, { solid: [28, 12] });
      b.obj('sign', 3.6, 19.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 90, { keep: [[35.5, 26, 3], [3.6, 19, 2]], kinds: [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['flower_a'], ['flower_b']] });
      return b;
    },
    spawns: S([['Lizard', 12, 14], ['Lizard', 26, 9], ['Lizard', 35, 17], ['Lizard', 16, 22], ['KappaGreen', 30, 13], ['KappaGreen', 9, 18], ['Racoon', 36, 32], ['Racoon', 25, 23], ['Snake2', 38, 7]]),
    chests: [{ id: 'r4_or', x: 39, y: 25.4, gold: 320, potions: 2 }],
    exits: [
      { side: 'west', from: 15, to: 18, map: 'rk_town', entry: 'east' },
      { side: 'north', from: 30, to: 33, map: 'rk_gorge', entry: 'south' },
      { side: 'east', from: 20, to: 24, scene: 'Town', region: 'circleForest', entry: 'west', to_name: '원환의 숲 키르쿠스', requires: 'report', lockedMsg: '프로포르의 결정을 먼저 되찾아요' },
    ],
    spots: [
      runeSpot('runeShare', '비례배분의 룬 돌', 35.5, 26, '사과 과수원', '사과 ●●|●●●'),
      { id: 'orSign', kind: 'read', name: '표지판', x: 3.6, y: 19.8, r: 22, label: '표지판 읽기', lines: [['사과 과수원 · 권장 Lv21~23', '← 프로포르 · ↑ 기사의 협곡 · → 키르쿠스 가는 길']] },
    ],
  },

  // ── 톱니바퀴 언덕 (Lv22~24) ─────────────────────
  // 북쪽 입구에서 구불구불 내려가는 언덕길. 막다른 동남쪽 언덕 위에 「비례식의 룬」.
  rk_hill: {
    name: '톱니바퀴 언덕', subtitle: '권장 Lv22~24', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 4.0, node: [250, 290],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(4404);
      b.block(0, 0, 18, 3).block(25, 0, 43, 3).block(0, 4, 2, 33).block(41, 4, 43, 33).block(3, 32, 40, 33);
      b.block(27, 4, 40, 8).block(6, 4, 18, 8);
      b.block(10, 13, 33, 15).block(37, 13, 40, 17);
      b.block(8, 21, 24, 23).block(13, 28, 23, 30);
      b.high(29, 21, 40, 27).stairs(34, 28, 2);
      b.path([[21, 0], [21, 11], [5, 11], [5, 19]], 2);
      b.path([[5, 19], [26, 19]], 2).path([[26, 19], [26, 30], [34, 30]], 2);
      b.path([[5, 19], [5, 27], [11, 27]], 2);
      b.path([[34, 27], [34, 23]], 2).circle(34.5, 23, 2, 'd');
      b.ground(6, 29, 7, 30, 'w');
      for (const [x, y] of [[24, 8], [19, 9], [38, 11], [4, 14], [30, 31], [3, 24], [16, 26], [32, 19]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_green', x, y, { solid: [16, 6], tree: true });
      b.obj('zl_stump', 19, 26.4, { solid: [24, 10] }).obj('sign', 16.4, 18.4, { solid: [10, 5] });
      b.obj('sign', 19.4, 4.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 130, { keep: [[34.5, 23, 3], [20, 4, 2], [16, 18, 2]] });
      return b;
    },
    spawns: S([['KappaGreen', 14, 12], ['KappaGreen', 30, 18], ['KappaGreen', 9, 27], ['KappaGreen', 36, 11], ['Racoon', 20, 19], ['Racoon', 26, 26], ['Snake2', 5, 15], ['Snake2', 31, 30], ['Reptile2', 22, 19]]),
    chests: [{ id: 'r4_hi', x: 31, y: 22.4, gold: 340, potions: 2 }],
    exits: [{ side: 'north', from: 20, to: 23, map: 'rk_town', entry: 'south' }],
    spots: [
      runeSpot('runeGear', '비례식의 룬 돌', 34.5, 23, '톱니바퀴 언덕', '2 : 3 = 4 : 6'),
      { id: 'hiSign', kind: 'read', name: '표지판', x: 19.4, y: 5, r: 22, label: '표지판 읽기', lines: [['톱니바퀴 언덕 · 권장 Lv22~24', '↑ 프로포르 · 언덕 깊은 곳에 룬 돌이 있대요']] },
      { id: 'gears', kind: 'read', name: '톱니바퀴 그림판', x: 16.4, y: 18.8, r: 22, label: '그림판 읽기',
        lines: [['큰 톱니(30개)와 작은 톱니(20개)가 맞물려 돌아요.', '큰 톱니가 2바퀴 돌 때 작은 톱니는 3바퀴 → 2 : 3 = 20 : 30 이에요.']] },
    ],
  },

  // ── 기사의 협곡 (Lv23~25) ──────────────────────
  // 서쪽(평원)·남쪽(과수원)에서 들어와 만나는 협곡. 북쪽 절벽의 왕성 지하 입구를 봉인 바위가 막아요.
  rk_gorge: {
    name: '기사의 협곡', subtitle: '권장 Lv23~25', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 4.2, node: [380, 95],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(4505);
      b.block(0, 0, 43, 8).opening(20, 9, 2);
      b.block(0, 9, 17, 15).block(26, 9, 43, 15);
      b.block(0, 27, 3, 33).block(40, 18, 43, 33).block(8, 27, 18, 33).block(22, 30, 27, 33);
      b.block(29, 21, 35, 27);
      b.path([[0, 21], [14, 21], [21, 19], [21, 11]], 2);
      b.path([[30, 33], [30, 31], [24, 28], [22, 21]], 2);
      b.path([[24, 18], [38, 18]], 1);
      for (const [x, y] of [[16, 25], [5, 25], [38, 26]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[12, 18.4], [27, 20.4]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      b.obj('cave_mouth', 21, 11, { tint: 0xa8a0b8 });
      b.obj('sign', 24.4, 18.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 100, { keep: [[21, 12, 3], [38, 19, 2]], kinds: [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['flower_a'], ['flower_b']] });
      return b;
    },
    barrier: { x: 22, y: 13.6, w: 8, step: 'runes', lines: [['커다란 바위에 보라색 봉인이 걸려 있어요.', '비 · 비례배분 · 비례식, 세 룬 돌을 모두 깨우면 풀린대요.']] },
    spawns: S([['Reptile2', 12, 23], ['Reptile2', 36, 20], ['KappaGreen', 25, 25], ['Lizard', 6, 19], ['Lizard', 38, 23], ['Snake2', 15, 22], ['Racoon', 24, 20], ['Reptile2', 36, 30]]),
    chests: [{ id: 'r4_go', x: 2, y: 23.4, gold: 360, potions: 2 }],
    exits: [
      { side: 'west', from: 19, to: 23, map: 'rk_plain', entry: 'east' },
      { side: 'south', from: 29, to: 32, map: 'rk_orchard', entry: 'north' },
      { x: 20, y: 9, w: 2, h: 2, map: 'rk_vault1', entry: 'south', to_name: '왕성 지하 저울방' },
    ],
    entries: { cave: [21, 12.6] },
    spots: [
      { id: 'find_crown', kind: 'find', name: '덤불', x: 38, y: 19.4, r: 22, label: '덤불 뒤지기', lines: [['나뭇잎뿐이에요.']] },
      { id: 'goSign', kind: 'read', name: '표지판', x: 24.4, y: 19, r: 22, label: '표지판 읽기', lines: [['왕성 지하 저울방 ↑', '「양쪽 곱이 같아야 문이 열린다」라고 적혀 있어요.']] },
    ],
  },

  // ── 왕성 지하 저울방 1층 ───────────────────────
  rk_vault1: {
    name: '왕성 지하 1층', subtitle: '룬 기둥과 봉인된 문', bgm: 'bgm_dungeon', theme: 'cave', cols: 36, rows: 38, power: 4.4, cave: true, tint: 0xc0b0d0, node: [430, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 35, 1).wall(0, 0, 0, 37).wall(35, 0, 35, 37).wall(0, 37, 15, 37).wall(20, 37, 35, 37);
      b.wall(0, 28, 24, 29).wall(31, 28, 35, 29);    // 오른쪽 틈 (25~30)
      b.wall(0, 19, 4, 20).wall(11, 19, 35, 20);     // 왼쪽 틈 (5~10)
      b.wall(0, 9, 15, 10).wall(20, 9, 35, 10);      // 가운데 봉인된 문 (16~19)
      b.wall(6, 32, 9, 34).wall(14, 23, 17, 25).wall(26, 23, 29, 25).wall(29, 13, 31, 16).wall(4, 12, 6, 15).wall(1, 2, 4, 6).wall(31, 2, 34, 6);
      b.path([[17, 37], [17, 33], [27, 31], [27, 26], [8, 22], [8, 16], [17, 13], [17, 2]], 2);
      b.circle(17.5, 5, 3, 'd');
      return b;
    },
    door: { x: 18, y: 10.8, w: 4, step: 'seal' },
    stairsDown: { x: 17.5, y: 4.5 },
    spawns: S([['Reptile2', 12, 34], ['KappaGreen', 28, 35], ['Snake2', 20, 26], ['Racoon', 31, 22], ['Reptile2', 10, 25], ['KappaGreen', 8, 15], ['Snake2', 26, 14], ['Reptile2', 22, 16]]),
    chests: [{ id: 'r4_v1', x: 33, y: 35, gold: 400, potions: 2 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'rk_gorge', entry: 'cave' },
      { x: 16, y: 3, w: 3, h: 2, map: 'rk_vault2', entry: 'south', to_name: '왕성 지하 2층', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
    ],
    entries: { down: [17.5, 7] },
    spots: [
      { id: 'scaleA', kind: 'rune', name: '왼쪽 룬 기둥', x: 12, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 「:」 모양 비의 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'scaleB', kind: 'rune', name: '오른쪽 룬 기둥', x: 24, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 천칭 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    ],
  },

  // ── 왕성 지하 2층 (레이시오의 방) ─────────────────
  rk_vault2: {
    name: '왕성 지하 2층', subtitle: '레이시오의 방', bgm: 'bgm_dungeon', theme: 'cave', cols: 32, rows: 32, power: 4.4, cave: true, tint: 0xb0a0c4, node: [515, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 31, 1).wall(0, 0, 0, 31).wall(31, 0, 31, 31).wall(0, 31, 13, 31).wall(18, 31, 31, 31);
      b.wall(1, 2, 5, 5).wall(26, 2, 30, 5).wall(1, 25, 6, 30).wall(25, 25, 30, 30).wall(1, 12, 2, 17).wall(29, 12, 30, 17);
      b.circle(15.5, 13, 9, 'd');
      b.path([[15, 31], [15, 20]], 2);
      return b;
    },
    boss: { x: 15.5, y: 10, step: 'ratio', roomY: 21 },
    exits: [{ side: 'south', from: 14, to: 17, map: 'rk_vault1', entry: 'down', to_name: '왕성 지하 1층' }],
    spots: [],
  },
};
