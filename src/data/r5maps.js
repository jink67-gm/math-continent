// 5번 지역: 원환의 숲 키르쿠스 (여러 지도가 이어진 구조) — 지도마다 둥근 무늬를 넣었어요
//
//                        [고대 유적 길 ck_path] ──유적 입구──▶ [고대 원형 유적 1층] ──▶ [2층 파이엔트]
//                         ▲ (반지름 · 원주율 · 원의 넓이 룬)  ▲
//   [둥근 나무 숲 ck_ring] ─┘                              │
//          │                              [보름달 호수 ck_lake] ──▶ 볼테라 (마을을 구한 뒤)
//   [숲속 마을 ck_town] ──────────────────────────┘
//   ◀ 프로포르 과수원 │
//          [버섯 빈터 ck_glade]
//
// 좌표는 모두 16px 칸 단위.

import { MapBuilder } from '../world/MapBuilder.js';
import { seeded } from '../world/terrain.js';
import { scatter, S } from './r1maps.js';

const FOREST_DECO = [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['flower_a'], ['flower_b']];

const runeSpot = (id, name, x, y, where, mark) => ({
  id, kind: 'rune', name, x, y, r: 24, label: '룬 돌 살펴보기', stone: true,
  runeLine: `${where}의 룬 돌이에요. 「${mark}」 모양이 새겨져 있어요. 문제를 풀면 룬이 깨어나요!`,
  sleepLines: ['오래된 룬 돌이에요.', '숲지기님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'],
});

// 둥근 고리 모양으로 덤불·꽃을 놓아요 (꾸미기, 지나갈 수 있어요)
function ring(b, cx, cy, r, n, kinds) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    b.obj(kinds[i % kinds.length], cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, { flat: true });
  }
}

export const MAPS = {
  // ── 숲속 마을 키르쿠스 ─────────────────────────
  // 위쪽 언덕(숲지기의 집·룬의 집) · 가운데 둥근 화단 광장 · 사방으로 나가는 숲길.
  ck_town: {
    name: '숲속 마을 키르쿠스', subtitle: '원환의 숲', bgm: 'bgm_town', theme: 'forest', cols: 44, rows: 34, safe: true, node: [250, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(5101);
      b.block(0, 0, 7, 14).block(36, 0, 43, 14).block(8, 0, 18, 1).block(25, 0, 35, 1);
      b.block(0, 22, 5, 33).block(38, 22, 43, 33).block(6, 30, 17, 33).block(26, 30, 37, 33);
      b.high(8, 2, 35, 10).high(19, 0, 24, 1).stairs(21, 11, 2);
      b.path([[21, 0], [21, 10]], 2).path([[11, 9], [32, 9]], 1);
      b.circle(22, 19.5, 4.6, 'd');
      b.path([[21, 13], [21, 16]], 2);
      b.path([[0, 18], [18, 18]], 2).path([[26, 18], [43, 18]], 2);
      b.path([[21, 23], [21, 33]], 2);
      b.path([[12, 19], [12, 24]], 1).path([[32, 19], [32, 24]], 1);
      b.ground(15, 23, 16, 24, 'w');
      b.obj('house_big', 14, 8.6, { solid: 'building', label: '숲지기의 집' });
      b.obj('house_round', 29, 8.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_shop', 11, 27.6, { solid: 'building', label: '숲 상점' });
      b.obj('house_orange', 32.5, 27.6, { solid: 'building', label: '대장간' });
      b.obj('house_tavern', 33, 16.4, { solid: 'building', label: '여관' });
      b.obj('house_timber', 10, 16.4, { solid: 'building' });
      // 광장 가운데 둥근 화단
      ring(b, 22, 19.6, 2.2, 10, ['flower_a', 'flower_b', 'grass_a', 'flower_a', 'bush_c']);
      b.obj('zl_stump', 22, 20.4, { solid: [24, 10] });
      b.obj('zl_bench', 28, 23.4, { solid: [44, 8] });
      b.obj('zl_pot_blue', 8.4, 27.8, { solid: [10, 6] }).obj('zl_pot_white', 13.6, 27.8, { solid: [10, 6] }).obj('zl_plant_big', 29.6, 27.8, { solid: [10, 6] });
      b.obj('sign', 24.4, 13.8, { solid: [10, 5] }).obj('sign', 23.4, 30.6, { solid: [10, 5] });
      for (const [x, y] of [[10, 4], [33, 4], [17, 5]]) b.obj('trio_green', x, y, { solid: [20, 6], tree: true });
      for (const [x, y] of [[3, 16], [40, 16], [8, 24], [36, 24]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      b.roughen(rnd);
      scatter(b, rnd, 90, { keep: [[22, 18, 6], [21, 31, 3], [16, 24, 2.5]], kinds: FOREST_DECO });
      return b;
    },
    exits: [
      { side: 'west', from: 16, to: 21, map: 'rk_orchard', entry: 'east' },
      { side: 'north', from: 20, to: 23, map: 'ck_ring', entry: 'south' },
      { side: 'east', from: 16, to: 21, map: 'ck_lake', entry: 'west' },
      { side: 'south', from: 20, to: 23, map: 'ck_glade', entry: 'north' },
    ],
    entries: { plaza: [22, 25] },
    npcs: [
      { id: 'chief', sprite: 'Monk', name: '숲지기 키르', x: 17.4, y: 9.8, lines: [['숲이 둥글게 자라는 걸 본 적 있니? 키르쿠스에 온 걸 환영한다.']] },
      { id: 'runeMaster', sprite: 'OldMan3', name: '룬 학자 파이', x: 26.4, y: 9.8, lines: [['기술의 룬을 배우러 왔구나.']] },
      { id: 'merchant', sprite: 'Villager4', name: '숲 상인 도토리', x: 13.6, y: 28.8, role: 'shop', lines: [['숲에서 모은 좋은 물건이 많아요~']] },
      { id: 'smith', sprite: 'Shaman', name: '대장장이 둥글', x: 29.4, y: 28.8, role: 'forge', lines: [['둥글게 갈아야 칼날이 잘 들지!']] },
      { id: 'innkeeper', sprite: 'OldWoman', name: '여관 주인 보름', x: 30.6, y: 17.4, lines: [['먼 길 오느라 고생했어요.', '광장 옆 샘물을 마시면 기운이 나요.']] },
      { id: 'ranger', sprite: 'Villager2', name: '사냥꾼 활대', x: 19.4, y: 13.8, lines: [['숲 북쪽은 둥근 나무 숲, 동쪽은 보름달 호수, 남쪽은 버섯 빈터야.']] },
      { id: 'child', sprite: 'Child', name: '꼬마 동글이', x: 26.6, y: 25.4, wander: 14, lines: [['컴퍼스로 원을 그리면 가운데에서 둘레까지 길이가 다 같아!', '그게 반지름이래.']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '숲의 샘', x: 16, y: 25.4, r: 26, label: '샘물 마시기', lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'flowerbed', kind: 'read', name: '둥근 화단', x: 22, y: 22.6, r: 26, label: '화단 살펴보기',
        lines: [['반지름이 2m인 둥근 화단이에요.', '넓이 = 반지름 × 반지름 × 원주율 = 2 × 2 × 3.14 = 12.56㎡'], ['원을 잘게 잘라 엇갈려 붙이면 직사각형에 가까워져요.', '가로는 원주의 절반, 세로는 반지름 → 넓이 = 반지름 × 반지름 × 원주율!']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 23.4, y: 31, r: 24, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 24.4, y: 14.2, r: 22, label: '안내판 읽기',
        lines: [['↑ 둥근 나무 숲 (권장 Lv26~28)', '→ 보름달 호수 (Lv27~29)', '↓ 버섯 빈터 (Lv28~30)', '← 프로포르 사과 과수원']] },
    ],
  },

  // ── 둥근 나무 숲 (Lv26~28) ─────────────────────
  // 남쪽 입구 → 가운데 바위를 돌아 서북쪽 언덕 위 「반지름의 룬」. 동쪽 길은 고대 유적 길로. 동북쪽에 버섯 고리.
  ck_ring: {
    name: '둥근 나무 숲', subtitle: '권장 Lv26~28', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 4.6, node: [250, 100],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(5202);
      b.block(0, 0, 43, 2).block(0, 3, 2, 33).block(40, 14, 43, 33).block(3, 28, 17, 33).block(26, 29, 39, 33);
      b.block(17, 3, 26, 8).block(5, 16, 13, 21).block(28, 18, 36, 24);
      b.high(3, 3, 13, 10).stairs(8, 11, 2);
      b.path([[21, 33], [21, 12]], 2).path([[8, 13], [39, 12]], 2).path([[39, 11], [43, 10]], 2);
      b.path([[8, 10], [8, 6]], 2).circle(8.5, 6, 2, 'd');
      b.circle(32, 7, 2.6, 'd');
      ring(b, 32, 7, 3.2, 10, ['bush_c', 'grass_a', 'flower_b', 'bush_a']);
      for (const [x, y] of [[16, 15], [24, 23], [37, 15], [12, 25]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'trio_green', x, y, { solid: [16, 6], tree: true });
      for (const [x, y] of [[27, 13.4], [14, 26]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      b.obj('sign', 23.6, 31.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 130, { keep: [[8.5, 6, 3], [32, 7, 4], [21, 31, 2]], kinds: FOREST_DECO });
      return b;
    },
    spawns: S([['Owl', 16, 13], ['Owl', 30, 12], ['Owl', 22, 21], ['Owl', 34, 27], ['Mushroom2', 10, 25], ['Mushroom2', 33, 9], ['Mushroom2', 24, 26], ['ButterflyBlue', 8, 8], ['ButterflyBlue', 37, 6]]),
    chests: [{ id: 'r5_ri', x: 12, y: 4.4, gold: 400, potions: 2 }],
    exits: [
      { side: 'south', from: 20, to: 23, map: 'ck_town', entry: 'north' },
      { side: 'east', from: 8, to: 12, map: 'ck_path', entry: 'west' },
    ],
    spots: [
      runeSpot('runeRadius', '반지름의 룬 돌', 8.5, 6, '둥근 나무 숲', '원과 반지름'),
      { id: 'mushRing', kind: 'read', name: '버섯 고리', x: 32, y: 9.6, r: 26, label: '버섯 고리 살펴보기',
        lines: [['덤불과 꽃이 둥글게 둘러선 빈터예요.', '가운데에서 어느 덤불까지 재어도 길이가 같아요 → 반지름!']] },
      { id: 'riSign', kind: 'read', name: '표지판', x: 23.6, y: 31.8, r: 22, label: '표지판 읽기', lines: [['둥근 나무 숲 · 권장 Lv26~28', '↓ 키르쿠스 · → 고대 유적 길']] },
    ],
  },

  // ── 보름달 호수 (Lv27~29) ──────────────────────
  // 가운데 둥근 호수를 달빛 다리가 가로질러요. 동남쪽 언덕 위 「원주율의 룬」. 북쪽은 유적 길, 동쪽은 볼테라 가는 길.
  ck_lake: {
    name: '보름달 호수', subtitle: '권장 Lv27~29', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 4.8, node: [400, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(5303);
      b.block(0, 0, 29, 3).block(34, 0, 43, 3).block(0, 4, 4, 13).block(0, 21, 4, 33);
      b.block(41, 4, 43, 18).block(41, 25, 43, 33).block(6, 29, 20, 33);
      b.circle(21, 15.5, 6.5, 'w');
      b.bridge(20, 8, 21, 23);
      b.high(30, 24, 40, 29).stairs(33, 30, 2);
      b.path([[0, 16], [12, 16], [12, 25], [28, 25], [29, 21], [43, 21]], 2);
      b.path([[20, 4], [20, 7]], 2).path([[20, 24], [20, 25]], 2);
      b.path([[31, 0], [31, 20]], 2).path([[21, 5], [31, 5]], 1);
      b.path([[29, 23], [29, 32], [34, 32]], 1);
      b.path([[33, 29], [35, 26]], 2).circle(35.5, 26, 2, 'd');
      for (const [x, y] of [[8, 9], [36, 10], [24, 30], [37, 17]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_round', x, y, { solid: [16, 6], tree: true });
      b.obj('zl_boulder', 9, 21, { solid: [28, 10] }).obj('zl_rock', 26, 6, { solid: [12, 6] });
      b.obj('sign', 3.6, 19.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 100, { keep: [[35.5, 26, 3], [21, 15.5, 8], [3.6, 19, 2]] });
      return b;
    },
    spawns: S([['ButterflyBlue', 10, 10], ['ButterflyBlue', 26, 5], ['ButterflyBlue', 36, 14], ['ButterflyBlue', 15, 26], ['Spirit2', 8, 24], ['Spirit2', 37, 8], ['Snake3', 25, 25], ['Snake3', 35, 32], ['Owl', 12, 6]]),
    chests: [{ id: 'r5_la', x: 39, y: 25.4, gold: 420, potions: 2 }],
    exits: [
      { side: 'west', from: 15, to: 18, map: 'ck_town', entry: 'east' },
      { side: 'north', from: 30, to: 33, map: 'ck_path', entry: 'south' },
      { side: 'east', from: 20, to: 24, scene: 'Town', region: 'solidPeaks', entry: 'west', to_name: '회전체 산맥 볼테라', requires: 'report', lockedMsg: '키르쿠스의 결정을 먼저 되찾아요' },
    ],
    spots: [
      runeSpot('runePi', '원주율의 룬 돌', 35.5, 26, '보름달 호수', '3.14'),
      { id: 'moonLake', kind: 'read', name: '호숫가 팻말', x: 13.4, y: 24, r: 24, label: '팻말 읽기',
        lines: [['보름달 호수의 지름은 약 13칸이에요.', '원주 = 지름 × 원주율 → 13 × 3.14 = 40.82칸을 걸어야 한 바퀴!'], ['어떤 원이든 원주 ÷ 지름은 늘 같아요.', '그 값이 원주율(약 3.14)이에요.']] },
      { id: 'laSign', kind: 'read', name: '표지판', x: 3.6, y: 19.8, r: 22, label: '표지판 읽기', lines: [['보름달 호수 · 권장 Lv27~29', '← 키르쿠스 · ↑ 고대 유적 길 · → 볼테라 가는 길']] },
    ],
  },

  // ── 버섯 빈터 (Lv28~30) ───────────────────────
  // 가운데 바위를 둥글게 도는 고리 길. 남쪽 언덕 위 「원의 넓이의 룬」 (계단은 언덕 아래쪽).
  ck_glade: {
    name: '버섯 빈터', subtitle: '권장 Lv28~30', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 5.0, node: [250, 290],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(5404);
      b.block(0, 0, 18, 3).block(25, 0, 43, 3).block(0, 4, 3, 33).block(40, 4, 43, 33);
      b.block(4, 4, 10, 8).block(33, 4, 39, 8).block(4, 28, 10, 33).block(33, 28, 39, 33);
      b.block(17, 14, 25, 19);
      b.high(16, 24, 27, 29).stairs(21, 30, 2);
      b.path([[21, 0], [21, 11]], 2);
      b.path([[21, 11], [13, 11], [11, 18], [13, 24], [13, 32], [21, 32]], 2);
      b.path([[21, 11], [29, 11], [31, 18], [29, 24], [29, 32], [21, 32]], 2);
      b.path([[21, 29], [21, 26]], 2).circle(21.5, 26, 2, 'd');
      b.ground(35, 15, 36, 16, 'w');
      ring(b, 21, 16.8, 6.2, 16, ['bush_c', 'flower_a', 'grass_b', 'bush_a']);
      for (const [x, y] of [[7, 12], [37, 22], [6, 22], [36, 11]]) b.obj(rnd() < 0.5 ? 'trio_green' : 'tree_big', x, y, { solid: [16, 6], tree: true });
      b.obj('sign', 23.6, 4.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 110, { keep: [[21.5, 26, 3], [23, 4, 2]], kinds: FOREST_DECO });
      return b;
    },
    spawns: S([['Mushroom2', 12, 15], ['Mushroom2', 30, 15], ['Mushroom2', 14, 28], ['Mushroom2', 28, 28], ['Snake3', 21, 22], ['Spirit2', 7, 16], ['Spirit2', 36, 17], ['ButterflyBlue', 21, 8], ['Owl', 8, 24]]),
    chests: [{ id: 'r5_gl', x: 17.5, y: 25.4, gold: 440, potions: 2 }],
    exits: [{ side: 'north', from: 20, to: 23, map: 'ck_town', entry: 'south' }],
    spots: [
      runeSpot('runeArea', '원의 넓이의 룬 돌', 21.5, 26, '버섯 빈터', '반지름 × 반지름 × 3.14'),
      { id: 'glSign', kind: 'read', name: '표지판', x: 23.6, y: 5, r: 22, label: '표지판 읽기', lines: [['버섯 빈터 · 권장 Lv28~30', '↑ 키르쿠스 · 고리 길을 돌아 남쪽 언덕 아래로 올라가요']] },
    ],
  },

  // ── 고대 유적 길 (Lv29~31) ─────────────────────
  // 서쪽(둥근 나무 숲)·남쪽(보름달 호수)에서 들어와 만나는 길. 북쪽 절벽의 유적 입구를 봉인 바위가 막아요.
  ck_path: {
    name: '고대 유적 길', subtitle: '권장 Lv29~31', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 5.2, node: [380, 95],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(5505);
      b.block(0, 0, 43, 8).opening(20, 9, 2);
      b.block(0, 9, 17, 15).block(26, 9, 43, 15);
      b.block(0, 27, 3, 33).block(40, 18, 43, 33).block(8, 27, 18, 33).block(22, 30, 27, 33);
      b.block(29, 21, 35, 27);
      b.path([[0, 21], [14, 21], [21, 19], [21, 11]], 2);
      b.path([[30, 33], [30, 31], [24, 28], [22, 21]], 2);
      b.path([[24, 18], [38, 18]], 1);
      b.circle(9, 22.6, 2.4, 'd');
      ring(b, 9, 22.6, 2.9, 8, ['zl_pebbles', 'zl_rock', 'zl_pebbles', 'grass_a']);
      for (const [x, y] of [[16, 25], [38, 26]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[12, 18.4], [27, 20.4]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      b.obj('cave_mouth', 21, 11, { tint: 0x9cb09c });
      b.obj('sign', 24.4, 18.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 100, { keep: [[21, 12, 3], [38, 19, 2], [9, 22.6, 3.5]], kinds: FOREST_DECO });
      return b;
    },
    barrier: { x: 22, y: 13.6, w: 8, step: 'runes', lines: [['커다란 바위에 보라색 봉인이 걸려 있어요.', '반지름 · 원주율 · 원의 넓이, 세 룬 돌을 모두 깨우면 풀린대요.']] },
    spawns: S([['Spirit2', 12, 24], ['Spirit2', 36, 20], ['Snake3', 25, 25], ['Mushroom2', 6, 19], ['Owl', 38, 23], ['Snake3', 15, 22], ['ButterflyBlue', 24, 20], ['Mushroom2', 36, 30]]),
    chests: [{ id: 'r5_pa', x: 2, y: 23.4, gold: 460, potions: 2 }],
    exits: [
      { side: 'west', from: 19, to: 23, map: 'ck_ring', entry: 'east' },
      { side: 'south', from: 29, to: 32, map: 'ck_lake', entry: 'north' },
      { x: 20, y: 9, w: 2, h: 2, map: 'ck_ruin1', entry: 'south', to_name: '고대 원형 유적' },
    ],
    entries: { cave: [21, 12.6] },
    spots: [
      { id: 'find_compass', kind: 'find', name: '덤불', x: 38, y: 19.4, r: 22, label: '덤불 뒤지기', lines: [['나뭇잎뿐이에요.']] },
      { id: 'stoneRing', kind: 'read', name: '돌 고리', x: 9, y: 25.4, r: 26, label: '돌 고리 살펴보기',
        lines: [['옛사람들이 돌을 둥글게 놓아 만든 고리예요.', '고리의 지름이 6칸이면 반지름은 그 절반인 3칸이에요.']] },
      { id: 'paSign', kind: 'read', name: '표지판', x: 24.4, y: 19, r: 22, label: '표지판 읽기', lines: [['고대 원형 유적 ↑', '「둥근 것의 비밀을 아는 자만 들어오라」라고 적혀 있어요.']] },
    ],
  },

  // ── 고대 원형 유적 1층 ─────────────────────────
  ck_ruin1: {
    name: '고대 유적 1층', subtitle: '룬 기둥과 봉인된 문', bgm: 'bgm_dungeon', theme: 'cave', cols: 36, rows: 38, power: 5.4, cave: true, tint: 0xa8c8a8, node: [430, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 35, 1).wall(0, 0, 0, 37).wall(35, 0, 35, 37).wall(0, 37, 15, 37).wall(20, 37, 35, 37);
      b.wall(11, 28, 35, 29);                       // 왼쪽 틈 (1~10)
      b.wall(0, 19, 24, 20).wall(31, 19, 35, 20);    // 오른쪽 틈 (25~30)
      b.wall(0, 9, 15, 10).wall(20, 9, 35, 10);      // 가운데 봉인된 문 (16~19)
      b.wall(26, 32, 29, 34).wall(4, 23, 7, 25).wall(18, 23, 21, 25).wall(30, 13, 32, 16).wall(3, 12, 5, 15).wall(1, 2, 4, 6).wall(31, 2, 34, 6);
      b.path([[17, 37], [17, 33], [6, 31], [6, 26], [27, 22], [27, 16], [17, 14], [17, 2]], 2);
      b.circle(12, 33, 2.2, 'd').circle(17.5, 5, 3, 'd');
      return b;
    },
    door: { x: 18, y: 10.8, w: 4, step: 'seal' },
    stairsDown: { x: 17.5, y: 4.5 },
    spawns: S([['Spirit2', 10, 34], ['Mushroom2', 29, 35], ['Owl', 12, 24], ['Snake3', 25, 25], ['Spirit2', 30, 23], ['Owl', 8, 16], ['Mushroom2', 26, 14], ['Snake3', 22, 16]]),
    chests: [{ id: 'r5_r1', x: 2.5, y: 35, gold: 500, potions: 2 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'ck_path', entry: 'cave' },
      { x: 16, y: 3, w: 3, h: 2, map: 'ck_ruin2', entry: 'south', to_name: '유적 2층', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
    ],
    entries: { down: [17.5, 7] },
    spots: [
      { id: 'circleA', kind: 'rune', name: '왼쪽 룬 기둥', x: 12, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 「○」 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'circleB', kind: 'rune', name: '오른쪽 룬 기둥', x: 24, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 「π」 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    ],
  },

  // ── 고대 원형 유적 2층 (파이엔트의 방) ───────────────
  ck_ruin2: {
    name: '고대 유적 2층', subtitle: '파이엔트의 방', bgm: 'bgm_dungeon', theme: 'cave', cols: 32, rows: 32, power: 5.4, cave: true, tint: 0x98b898, node: [515, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 31, 1).wall(0, 0, 0, 31).wall(31, 0, 31, 31).wall(0, 31, 13, 31).wall(18, 31, 31, 31);
      b.wall(1, 2, 5, 5).wall(26, 2, 30, 5).wall(1, 25, 6, 30).wall(25, 25, 30, 30);
      b.circle(15.5, 13, 9.5, 'd');
      b.path([[15, 31], [15, 20]], 2);
      return b;
    },
    boss: { x: 15.5, y: 10, step: 'piant', roomY: 21 },
    exits: [{ side: 'south', from: 14, to: 17, map: 'ck_ruin1', entry: 'down', to_name: '유적 1층' }],
    spots: [],
  },
};
