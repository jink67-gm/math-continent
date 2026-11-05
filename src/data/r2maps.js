// 2번 지역: 쌓기나무 성채 큐베른 (1번 지역처럼 여러 지도가 이어진 구조)
//
//                         [세 갈래 능선 cb_ridge] ──동굴 입구──▶ [세 방향 미궁 1층] ──▶ [2층 큐블록스]
//                          ▲ (위·앞·옆 룬)  ▲
//   [블록 언덕 cb_blocks] ─┘               │
//          │                     [쌓기나무 채석장 cb_quarry] ──▶ 데시마르 (마을을 구한 뒤)
//   [성채 마을 cb_town] ──────────────────┘
//   ◀ 바람개비 들판 │
//          [벚꽃 숲길 cb_grove]
//
// 좌표는 모두 16px 칸 단위. node는 지도 창(M)에서 그 지도가 놓일 자리예요.

import { MapBuilder } from '../world/MapBuilder.js';
import { seeded } from '../world/terrain.js';
import { scatter, S } from './r1maps.js';

const PINK_TREES = ['tree_blossom', 'trio_pink', 'tree_big_pink', 'tree_round'];

const runeSpot = (id, name, x, y, where) => ({
  id, kind: 'rune', name, x, y, r: 24, label: '룬 돌 살펴보기', stone: true,
  runeLine: `${where}의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!`,
  sleepLines: ['오래된 룬 돌이에요.', '성채 대장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'],
});

export const MAPS = {
  // ── 성채 마을 큐베른 ───────────────────────────
  // 위쪽 언덕(대장의 집·룬의 집) · 가운데 광장(블록 탑) · 사방으로 나가는 길. 둘레는 성벽 같은 절벽.
  cb_town: {
    name: '성채 마을 큐베른', subtitle: '쌓기나무 성채', bgm: 'bgm_town', theme: 'pink', cols: 44, rows: 34, safe: true, node: [250, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(2101);
      // 성벽 절벽
      b.block(0, 0, 7, 14).block(36, 0, 43, 14).block(8, 0, 18, 1).block(25, 0, 35, 1);
      b.block(0, 22, 5, 33).block(38, 22, 43, 33).block(6, 30, 17, 33).block(26, 30, 37, 33);
      // 위쪽 언덕
      b.high(8, 2, 35, 10).high(19, 0, 24, 1).stairs(21, 11, 2);
      b.path([[21, 0], [21, 10]], 2).path([[11, 9], [32, 9]], 1);
      // 광장과 길
      b.circle(22, 19.5, 4.2, 'd');
      b.path([[21, 13], [21, 16]], 2);
      b.path([[0, 18], [18, 18]], 2).path([[26, 18], [43, 18]], 2);
      b.path([[21, 23], [21, 33]], 2);
      b.path([[12, 19], [12, 24]], 1).path([[32, 19], [32, 24]], 1);
      b.ground(15, 23, 16, 24, 'w');
      // 건물
      b.obj('house_big', 14, 8.6, { solid: 'building', label: '대장의 집' });
      b.obj('house_round', 29, 8.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_shop', 11, 27.6, { solid: 'building', label: '블록 상점' });
      b.obj('house_orange', 32.5, 27.6, { solid: 'building', label: '대장간' });
      b.obj('house_tavern', 33, 16.4, { solid: 'building', label: '여관' });
      b.obj('house_beige', 10, 16.4, { solid: 'building' });
      // 광장의 블록 탑 (나무 상자를 쌓아 만든 전시대)
      b.obj('zl_crates', 21, 18.6, { solid: [28, 12] }).obj('zl_crates', 23, 18.6, { solid: [28, 12] }).obj('zl_crates', 22, 16.8, {});
      // 소품
      b.obj('zl_bench', 28, 22.6, { solid: [44, 8] });
      b.obj('zl_pot_blue', 8.4, 27.8, { solid: [10, 6] }).obj('zl_pot_white', 13.6, 27.8, { solid: [10, 6] });
      b.obj('zl_plant_big', 29.6, 27.8, { solid: [10, 6] }).obj('barrel', 35.4, 27.6, { solid: [12, 8] });
      b.obj('zl_pot_bush', 11.4, 8.8, { solid: [10, 6] }).obj('zl_pot_blue', 26.6, 8.8, { solid: [10, 6] });
      b.obj('sign', 24.4, 13.8, { solid: [10, 5] }).obj('sign', 23.4, 30.6, { solid: [10, 5] });
      for (const [x, y] of [[10, 4], [33, 4], [17, 5]]) b.obj(PINK_TREES[Math.floor(rnd() * 2)], x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[3, 16], [40, 16], [8, 24], [36, 24]]) b.obj('tree_blossom', x, y, { solid: [14, 6], tree: true });
      b.roughen(rnd);
      scatter(b, rnd, 90, { keep: [[22, 18, 5], [21, 31, 3], [16, 24, 2.5]] });
      return b;
    },
    exits: [
      { side: 'west', from: 16, to: 21, map: 'east_field', entry: 'east' },
      { side: 'north', from: 20, to: 23, map: 'cb_blocks', entry: 'south' },
      { side: 'east', from: 16, to: 21, map: 'cb_quarry', entry: 'west' },
      { side: 'south', from: 20, to: 23, map: 'cb_grove', entry: 'north' },
    ],
    entries: { plaza: [22, 24.5] },
    npcs: [
      { id: 'chief', sprite: 'Knight', name: '성채 대장 큐브', x: 17.4, y: 9.8, lines: [['어서 오게. 큐베른은 쌓기나무로 지은 성채라네.']] },
      { id: 'runeMaster', sprite: 'OldMan3', name: '룬 학자 큐비', x: 26.4, y: 9.8, lines: [['기술의 룬을 깨우러 왔구먼.']] },
      { id: 'merchant', sprite: 'Villager2', name: '블록 상인 토토', x: 13.6, y: 28.8, role: 'shop', lines: [['어서 와요! 튼튼한 장비가 많아요~']] },
      { id: 'smith', sprite: 'Shaman', name: '대장장이 모루', x: 29.4, y: 28.8, role: 'forge', lines: [['장비를 강화하려면 수학 실력이 필요하지!']] },
      { id: 'innkeeper', sprite: 'Woman', name: '여관 주인 소복', x: 30.6, y: 17.4, lines: [['먼 길 오느라 고생했어요.', '광장의 샘물을 마시면 기운이 나요.']] },
      { id: 'soldier', sprite: 'Monk', name: '성채 병사 네모', x: 19.4, y: 13.8, lines: [['성채 북쪽은 블록 언덕, 동쪽은 채석장, 남쪽은 벚꽃 숲길이오.']] },
      { id: 'child', sprite: 'Child', name: '꼬마 큐티', x: 25.6, y: 24.4, wander: 20, lines: [['상자 탑을 앞에서 보면 몇 층일까?', '옆에서 보면 또 달라 보여!']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '성채의 샘', x: 16, y: 25.4, r: 26, label: '샘물 마시기', lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'tower', kind: 'read', name: '블록 탑', x: 22, y: 20.6, r: 26, label: '블록 탑 살펴보기',
        lines: [['나무 상자 3개로 쌓은 블록 탑이에요.', '앞에서 보면 아래 2개 · 위 1개, 위에서 보면 2개만 보여요.'], ['위에서 본 모양만으로는 위층 상자를 셀 수 없어요.', '위·앞·옆 모양을 함께 봐야 정확히 셀 수 있어요!']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 23.4, y: 31, r: 24, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 24.4, y: 14.2, r: 22, label: '안내판 읽기',
        lines: [['↑ 블록 언덕 (권장 Lv8~10)', '→ 쌓기나무 채석장 (Lv9~11)', '↓ 벚꽃 숲길 (Lv10~12)', '← 바람개비 들판 (프락시아)']] },
    ],
  },

  // ── 블록 언덕 (Lv8~10) ─────────────────────────
  // 남쪽 입구 → 가운데 바위 덩어리를 돌아 → 서북쪽 언덕 위 「위의 룬」. 동쪽 길은 세 갈래 능선으로.
  cb_blocks: {
    name: '블록 언덕', subtitle: '권장 Lv8~10', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 2.0, node: [250, 100],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(2202);
      b.block(0, 0, 43, 2).block(0, 3, 2, 33).block(40, 14, 43, 33);
      b.block(18, 3, 27, 9).block(5, 17, 14, 23).block(27, 19, 37, 26);
      b.block(3, 28, 18, 33).block(25, 29, 39, 33);
      b.high(3, 3, 15, 10).stairs(9, 11, 2);
      b.path([[21, 33], [21, 13]], 2).path([[9, 13], [39, 12]], 2).path([[39, 11], [43, 10]], 2);
      b.path([[9, 10], [9, 6]], 2).circle(9.5, 6, 2, 'd');
      b.circle(34, 6, 2.2, 'w');
      for (const [x, y] of [[16, 15], [30, 15], [24, 23], [37, 9]]) b.obj('zl_crates', x, y, { solid: [28, 12] });
      for (const [x, y] of [[13, 26], [35, 17]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[29, 5], [5, 15], [38, 29]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      b.obj('sign', 23.6, 31.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 140, { keep: [[9.5, 6, 3], [21, 31, 2]] });
      return b;
    },
    spawns: S([['Mouse', 16, 13], ['Mouse', 30, 13], ['Mouse', 22, 21], ['Mouse', 22, 28], ['Slime3', 10, 26], ['Slime3', 33, 9], ['Bamboo', 25, 12], ['Bamboo', 8, 8], ['Slime3', 17, 25]]),
    chests: [{ id: 'r2_bl', x: 13, y: 4.4, gold: 120, potions: 1 }],
    exits: [
      { side: 'south', from: 20, to: 23, map: 'cb_town', entry: 'north' },
      { side: 'east', from: 8, to: 12, map: 'cb_ridge', entry: 'west' },
    ],
    spots: [
      runeSpot('runeTop', '위의 룬 돌', 9.5, 6, '블록 언덕'),
      { id: 'blSign', kind: 'read', name: '표지판', x: 23.6, y: 31.8, r: 22, label: '표지판 읽기', lines: [['블록 언덕 · 권장 Lv8~10', '↓ 큐베른 · → 세 갈래 능선']] },
    ],
  },

  // ── 쌓기나무 채석장 (Lv9~11) ──────────────────────
  // 흙바닥 채석장. 바위 덩어리 사이 길 → 동남쪽 언덕 위 「앞의 룬」. 북쪽은 능선, 동쪽은 데시마르 가는 길.
  cb_quarry: {
    name: '쌓기나무 채석장', subtitle: '권장 Lv9~11', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 2.2, node: [400, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(2303);
      b.ground(7, 5, 38, 30, 'd');
      b.block(0, 0, 29, 3).block(34, 0, 43, 3).block(0, 4, 5, 15).block(0, 22, 5, 33);
      b.block(41, 4, 43, 20).block(41, 27, 43, 33);
      b.block(11, 7, 19, 12).block(23, 12, 28, 17).block(8, 26, 21, 33).block(23, 28, 28, 33);
      b.high(30, 23, 40, 28).stairs(33, 29, 2);
      b.path([[0, 18], [21, 18], [21, 21], [43, 21]], 2);
      b.path([[31, 0], [31, 21]], 2);
      b.path([[29, 22], [29, 31], [34, 31]], 1);
      b.path([[33, 28], [35, 25]], 2).circle(35.5, 25, 2, 'g');
      b.circle(9, 9, 1.8, 'g').circle(37, 9, 2, 'w');
      for (const [x, y] of [[9, 21.4], [18, 24], [36, 16], [26, 7], [15, 16]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[20, 5], [37, 13], [26, 25]]) b.obj('zl_crates', x, y, { solid: [28, 12] });
      for (const [x, y] of [[13, 21], [33, 6]]) b.obj('zl_rock', x, y, { solid: [12, 6] });
      b.obj('sign', 3.6, 20.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 60, { keep: [[35.5, 25, 3], [3.6, 20, 2]] });
      return b;
    },
    spawns: S([['Mole', 12, 15], ['Mole', 26, 9], ['Mole', 35, 19], ['Mole', 16, 22], ['Bamboo', 30, 13], ['Bamboo', 9, 22], ['Bamboo', 36, 32], ['Mouse', 25, 22], ['Mouse', 38, 7]]),
    chests: [{ id: 'r2_qu', x: 39, y: 24.4, gold: 140, potions: 1 }],
    exits: [
      { side: 'west', from: 17, to: 20, map: 'cb_town', entry: 'east' },
      { side: 'north', from: 30, to: 33, map: 'cb_ridge', entry: 'south' },
      { side: 'east', from: 21, to: 25, map: 'dh_town', entry: 'west', to_name: '소수점 항구 데시마르', requires: 'report', lockedMsg: '큐베른의 결정을 먼저 되찾아요' },
    ],
    spots: [
      runeSpot('runeFront', '앞의 룬 돌', 35.5, 25, '쌓기나무 채석장'),
      { id: 'quSign', kind: 'read', name: '표지판', x: 3.6, y: 20.8, r: 22, label: '표지판 읽기', lines: [['쌓기나무 채석장 · 권장 Lv9~11', '← 큐베른 · ↑ 세 갈래 능선 · → 데시마르 가는 길']] },
    ],
  },

  // ── 벚꽃 숲길 (Lv10~12) ───────────────────────
  // 북쪽 입구에서 구불구불 내려가는 숲길. 막다른 서남쪽 언덕 위에 「옆의 룬」.
  cb_grove: {
    name: '벚꽃 숲길', subtitle: '권장 Lv10~12', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 2.35, node: [250, 290],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(2404);
      b.block(0, 0, 18, 3).block(25, 0, 43, 3).block(0, 4, 2, 33).block(41, 4, 43, 33).block(3, 32, 40, 33);
      b.block(3, 4, 16, 8).block(25, 4, 37, 8);
      b.block(10, 13, 33, 15).block(3, 13, 6, 17);
      b.block(19, 21, 35, 23).block(20, 28, 30, 30);
      b.high(3, 21, 14, 27).stairs(8, 28, 2);
      b.path([[21, 0], [21, 11], [37, 11], [37, 19]], 2);
      b.path([[37, 19], [16, 19]], 2).path([[16, 19], [16, 30], [8, 30]], 2);
      b.path([[37, 19], [37, 27], [31, 27]], 2);
      b.path([[8, 27], [8, 23]], 2).circle(8.5, 23, 2, 'd');
      b.circle(36, 30, 1.6, 'w');
      for (const [x, y] of [[19, 8], [24, 9], [5, 11], [39, 14], [13, 31], [40, 24], [27, 26], [11, 19]]) b.obj(PINK_TREES[Math.floor(rnd() * PINK_TREES.length)], x, y, { solid: [16, 6], tree: true });
      b.obj('zl_stump', 24, 26.4, { solid: [24, 10] });
      b.obj('sign', 23.6, 4.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 130, { keep: [[8.5, 23, 3], [23, 4, 2]], kinds: [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['flower_a'], ['flower_b']] });
      return b;
    },
    spawns: S([['Owl', 28, 12], ['Owl', 12, 18], ['Owl', 33, 27], ['Owl', 6, 11], ['Mouse', 22, 19], ['Mouse', 16, 26], ['Slime3', 37, 15], ['Slime3', 11, 30], ['Bamboo', 30, 19]]),
    chests: [{ id: 'r2_gr', x: 12, y: 22.4, gold: 160, potions: 2 }],
    exits: [{ side: 'north', from: 20, to: 23, map: 'cb_town', entry: 'south' }],
    spots: [
      runeSpot('runeSide', '옆의 룬 돌', 8.5, 23, '벚꽃 숲길'),
      { id: 'grSign', kind: 'read', name: '표지판', x: 23.6, y: 5, r: 22, label: '표지판 읽기', lines: [['벚꽃 숲길 · 권장 Lv10~12', '↑ 큐베른 · 숲 깊은 곳에 룬 돌이 있대요']] },
    ],
  },

  // ── 세 갈래 능선 (Lv11~13) ─────────────────────
  // 서쪽(블록 언덕)·남쪽(채석장)에서 올라와 만나는 능선. 북쪽 큰 절벽의 미궁 입구 앞을 봉인 바위가 막아요.
  cb_ridge: {
    name: '세 갈래 능선', subtitle: '권장 Lv11~13', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 2.5, node: [380, 95],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(2505);
      b.block(0, 0, 43, 8).opening(20, 9, 2);
      b.block(0, 9, 17, 15).block(26, 9, 43, 15);
      b.block(0, 27, 3, 33).block(40, 18, 43, 33);
      b.block(8, 27, 20, 33).block(35, 27, 39, 33).block(24, 30, 28, 33);
      b.block(29, 20, 33, 22);
      b.path([[0, 21], [14, 21], [21, 19], [21, 11]], 2);
      b.path([[30, 33], [30, 27], [24, 26], [22, 21]], 2);
      b.path([[34, 19], [38, 19]], 1);
      for (const [x, y] of [[16, 25], [36, 25], [5, 25]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[27, 24.4], [12, 25]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      b.obj('cave_mouth', 21, 11, { tint: 0x9a7f78 });
      b.obj('sign', 24.4, 18.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 110, { keep: [[21, 12, 3], [37, 19, 2]] });
      return b;
    },
    barrier: { x: 22, y: 13.6, w: 8, step: 'runes', lines: [['커다란 바위에 보라색 봉인이 걸려 있어요.', '위·앞·옆, 세 시점의 룬 돌을 모두 깨우면 풀린대요.']] },
    spawns: S([['Bamboo', 15, 23], ['Bamboo', 31, 26], ['Bamboo', 22, 25], ['Owl', 6, 19], ['Owl', 35, 19], ['Owl', 37, 24], ['Mole', 10, 24], ['Mole', 26, 20]]),
    chests: [{ id: 'r2_ri', x: 2, y: 23.4, gold: 180, potions: 2 }],
    exits: [
      { side: 'west', from: 19, to: 23, map: 'cb_blocks', entry: 'east' },
      { side: 'south', from: 29, to: 32, map: 'cb_quarry', entry: 'north' },
      { x: 20, y: 9, w: 2, h: 2, map: 'cb_maze1', entry: 'south', to_name: '세 방향 미궁' },
    ],
    entries: { cave: [21, 12.6] },
    spots: [
      { id: 'find_block', kind: 'find', name: '풀숲', x: 38, y: 18.4, r: 22, label: '풀숲 뒤지기', lines: [['풀숲을 뒤졌지만 아무것도 없어요.']] },
      { id: 'riSign', kind: 'read', name: '표지판', x: 24.4, y: 19, r: 22, label: '표지판 읽기', lines: [['세 방향 미궁 ↑', '「위·앞·옆을 모두 보아야 길이 열린다」라고 적혀 있어요.']] },
    ],
  },

  // ── 세 방향 미궁 1층 ──────────────────────────
  cb_maze1: {
    name: '세 방향 미궁 1층', subtitle: '룬 기둥과 봉인된 문', bgm: 'bgm_dungeon', theme: 'cave', cols: 36, rows: 38, power: 2.7, cave: true, tint: 0xc8b8a8, node: [430, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 35, 1).wall(0, 0, 0, 37).wall(35, 0, 35, 37).wall(0, 37, 15, 37).wall(20, 37, 35, 37);
      b.wall(11, 28, 35, 29);                      // 왼쪽 틈 (1~10)
      b.wall(0, 19, 24, 20).wall(31, 19, 35, 20);   // 오른쪽 틈 (25~30)
      b.wall(0, 9, 15, 10).wall(20, 9, 35, 10);     // 가운데 봉인된 문 (16~19)
      b.wall(26, 32, 29, 34).wall(4, 23, 7, 25).wall(18, 23, 21, 25).wall(30, 13, 32, 16).wall(3, 12, 5, 15).wall(1, 2, 4, 6).wall(31, 2, 34, 6);
      b.path([[17, 37], [17, 33], [6, 31], [6, 26], [27, 22], [27, 16], [17, 14], [17, 2]], 2);
      b.circle(17.5, 5, 3, 'd');
      return b;
    },
    door: { x: 18, y: 10.8, w: 4, step: 'seal' },
    stairsDown: { x: 17.5, y: 4.5 },
    spawns: S([['Bamboo', 10, 34], ['Mole', 28, 35], ['Owl', 12, 24], ['Bamboo', 25, 25], ['Mole', 30, 23], ['Owl', 8, 16], ['Bamboo', 26, 14], ['Slime3', 22, 16]]),
    chests: [{ id: 'r2_m1', x: 2.5, y: 35, gold: 200, potions: 2 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'cb_ridge', entry: 'cave' },
      { x: 16, y: 3, w: 3, h: 2, map: 'cb_maze2', entry: 'south', to_name: '미궁 2층', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
    ],
    entries: { down: [17.5, 7] },
    spots: [
      { id: 'mazeA', kind: 'rune', name: '왼쪽 룬 기둥', x: 12, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 쌓기나무 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'mazeB', kind: 'rune', name: '오른쪽 룬 기둥', x: 24, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 정육면체 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    ],
  },

  // ── 세 방향 미궁 2층 (큐블록스의 방) ─────────────
  cb_maze2: {
    name: '세 방향 미궁 2층', subtitle: '큐블록스의 방', bgm: 'bgm_dungeon', theme: 'cave', cols: 32, rows: 32, power: 2.7, cave: true, tint: 0xd8b890, node: [515, 30],
    build() {
      // 네모난 블록 방: 테두리에 2×2 정육면체 기둥, 구석에는 블록 더미 (쌓기나무처럼)
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 31, 1).wall(0, 0, 0, 31).wall(31, 0, 31, 31).wall(0, 31, 13, 31).wall(18, 31, 31, 31);
      b.wall(1, 2, 4, 6).wall(27, 2, 30, 6).wall(1, 24, 4, 30).wall(27, 24, 30, 30).wall(5, 2, 6, 3).wall(25, 2, 26, 3);
      b.ground(6, 4, 25, 22, 'd');
      for (const [x, y] of [[6, 5], [24, 5], [6, 12], [24, 12], [6, 19], [24, 19], [11, 4], [19, 4]]) b.wall(x, y, x + 1, y + 1);
      b.path([[15, 31], [15, 22]], 2);
      return b;
    },
    boss: { x: 15.5, y: 10, step: 'cublox', roomY: 21 },
    exits: [{ side: 'south', from: 14, to: 17, map: 'cb_maze1', entry: 'down', to_name: '미궁 1층' }],
    spots: [],
  },
};
