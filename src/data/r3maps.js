// 3번 지역: 소수점 항구 데시마르 (여러 지도가 이어진 구조)
//
//                       [소용돌이 만 dh_cove] ──동굴 입구──▶ [해저 동굴 1층] ──▶ [2층 데시토드]
//                        ▲ (0.1·0.01·0.001 룬)  ▲
//   [조개 모래톱 dh_beach] ─┘                    │
//          │                       [등대 방파제 dh_pier] ──▶ 프로포르 (마을을 구한 뒤)
//   [항구 마을 dh_town] ─────────────────────┘
//   ◀ 큐베른 채석장 │ (배다리)
//          [산호 해안 dh_reef]
//
// 좌표는 모두 16px 칸 단위. 'w'는 바다, bridge는 배다리·부두 판자예요.

import { MapBuilder } from '../world/MapBuilder.js';
import { seeded } from '../world/terrain.js';
import { scatter, S } from './r1maps.js';

const SAND_DECO = [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['flower_b'], ['zl_pebbles']];

const runeSpot = (id, name, x, y, where, mark) => ({
  id, kind: 'rune', name, x, y, r: 24, label: '룬 돌 살펴보기', stone: true,
  runeLine: `${where}의 룬 돌이에요. 「${mark}」이 새겨져 있어요. 문제를 풀면 룬이 깨어나요!`,
  sleepLines: ['오래된 룬 돌이에요.', '항구 선장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'],
});

export const MAPS = {
  // ── 항구 마을 데시마르 ─────────────────────────
  // 위쪽 언덕(선장의 집·룬의 집) · 가운데 큰길과 광장 · 아래는 바다와 부두. 남쪽 배다리로 산호 해안에 가요.
  dh_town: {
    name: '항구 마을 데시마르', subtitle: '소수점 항구', bgm: 'bgm_town', theme: 'sand', cols: 44, rows: 34, safe: true, node: [250, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(3101);
      b.ground(0, 28, 43, 33, 'w').circle(5, 27.5, 2, 'w').circle(38, 27.5, 2, 'w');
      b.block(0, 0, 7, 11).block(36, 0, 43, 11).block(8, 0, 18, 1).block(25, 0, 35, 1);
      b.high(8, 2, 35, 8).high(19, 0, 24, 1).stairs(21, 9, 2);
      b.block(0, 18, 3, 25).block(40, 18, 43, 25);
      b.path([[21, 0], [21, 8]], 2).path([[11, 7], [32, 7]], 1);
      b.path([[0, 14], [43, 14]], 2).path([[21, 11], [21, 13]], 2);
      b.circle(21.5, 19.5, 3.6, 'd');
      b.path([[21, 22], [21, 27]], 2);
      b.bridge(20, 28, 21, 33).bridge(27, 28, 34, 29).bridge(8, 28, 13, 29);
      b.ground(26, 24, 27, 25, 'w');
      // 건물
      b.obj('house_big', 14, 6.6, { solid: 'building', label: '선장의 집' });
      b.obj('house_round', 29, 6.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_shop', 9.5, 21.6, { solid: 'building', label: '항구 상점' });
      b.obj('house_tavern', 15, 21.6, { solid: 'building', label: '여관' });
      b.obj('house_orange', 31, 21.6, { solid: 'building', label: '대장간' });
      b.obj('house_beige', 36.5, 21.6, { solid: 'building' });
      // 부두의 상자·통
      b.obj('zl_crates', 32.5, 29.4, {}).obj('barrel', 29.6, 29.4, {}).obj('barrel', 9, 29.4, {}).obj('zl_crates', 12, 29.4, {});
      b.obj('zl_bench', 25.5, 17.4, { solid: [44, 8] }).obj('zl_pot_blue', 11.4, 7.8, { solid: [10, 6] }).obj('zl_pot_white', 26.6, 7.8, { solid: [10, 6] });
      b.obj('sign', 23.4, 11.4, { solid: [10, 5] }).obj('sign', 24.4, 24.4, { solid: [10, 5] });
      for (const [x, y] of [[10, 4], [33, 4], [5, 16], [39, 16]]) b.obj('tree_round', x, y, { solid: [14, 6], tree: true });
      b.roughen(rnd);
      scatter(b, rnd, 70, { keep: [[21.5, 19.5, 5], [26.5, 25, 2.5]], kinds: SAND_DECO });
      return b;
    },
    exits: [
      { side: 'west', from: 14, to: 17, map: 'cb_quarry', entry: 'east' },
      { side: 'north', from: 20, to: 23, map: 'dh_beach', entry: 'south' },
      { side: 'east', from: 14, to: 17, map: 'dh_pier', entry: 'west' },
      { side: 'south', from: 20, to: 21, map: 'dh_reef', entry: 'north' },
    ],
    entries: { plaza: [21.5, 23.4] },
    npcs: [
      { id: 'chief', sprite: 'OldMan2', name: '항구 선장 데시', x: 17.4, y: 7.8, lines: [['바다 냄새 좋지? 데시마르에 온 걸 환영하네.']] },
      { id: 'runeMaster', sprite: 'Inspector', name: '룬 학자 소수', x: 26.4, y: 7.8, lines: [['기술의 룬을 배우러 왔는가?']] },
      { id: 'merchant', sprite: 'Villager', name: '항구 상인 마리', x: 11.8, y: 22.8, role: 'shop', lines: [['바다 건너온 좋은 물건이 많아요~']] },
      { id: 'smith', sprite: 'Caveman2', name: '대장장이 닻쇠', x: 28.6, y: 22.8, role: 'forge', lines: [['갑옷도 칼도 바닷바람에 녹슬지 않게 다듬어 주지!']] },
      { id: 'innkeeper', sprite: 'Cavegirl2', name: '여관 주인 파도', x: 17.8, y: 22.6, lines: [['먼 길 오느라 고생했어요.', '광장 옆 우물물을 마시면 기운이 나요.']] },
      { id: 'sailor', sprite: 'Hunter', name: '선원 돌핀', x: 30.6, y: 28.8, lines: [['배가 고장 나서 바다에 못 나가고 있어.']] },
      { id: 'samurai', sprite: 'Samurai', name: '등대 무사 파랑', x: 23.6, y: 17.2, lines: [['등대 불빛처럼 한 점을 꿰뚫어야 하오.', '힘을 모았다가 한 번에 내지르는 것이 찌르기의 비밀이오.']] },
      { id: 'child', sprite: 'EggGirl', name: '꼬마 소라', x: 18.6, y: 17.2, wander: 14, lines: [['2.4를 0.6으로 나누면 얼마게?', '둘 다 10배 하면 24 ÷ 6 이래!']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '광장 우물', x: 26.5, y: 26.4, r: 24, label: '우물물 마시기', lines: [['시원한 우물물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'market', kind: 'read', name: '생선 가게', x: 33, y: 27.2, r: 24, label: '가게 살펴보기',
        lines: [['생선 2.4kg을 0.6kg씩 봉지에 나누어 담아요.', '2.4 ÷ 0.6 → 두 수를 똑같이 10배 하면 24 ÷ 6 = 4봉지!'], ['나누는 수와 나누어지는 수의 소수점을 똑같이 옮기면', '몫은 그대로예요.']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 24.4, y: 24.8, r: 22, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 23.4, y: 11.8, r: 22, label: '안내판 읽기',
        lines: [['↑ 조개 모래톱 (권장 Lv14~16)', '→ 등대 방파제 (Lv15~17)', '↓ 배다리 건너 산호 해안 (Lv16~18)', '← 큐베른 채석장']] },
    ],
  },

  // ── 조개 모래톱 (Lv14~16) ──────────────────────
  // 서쪽은 바다. 모래 언덕 사이를 지나 동북쪽 언덕 위 「0.1의 룬」. 동쪽 길은 소용돌이 만으로.
  dh_beach: {
    name: '조개 모래톱', subtitle: '권장 Lv14~16', bgm: 'bgm_field', theme: 'sand', cols: 44, rows: 34, power: 2.8, node: [250, 100],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(3202);
      b.ground(0, 0, 7, 33, 'w').circle(8, 8, 3, 'w').circle(8, 22, 3.5, 'w').circle(16, 9, 1.8, 'w').circle(24, 26, 1.5, 'w');
      b.block(8, 0, 43, 2).block(40, 14, 43, 33).block(10, 30, 17, 33).block(26, 30, 39, 33);
      b.block(14, 15, 22, 18).block(27, 19, 35, 23);
      b.high(28, 4, 38, 9).stairs(32, 10, 2);
      b.path([[21, 33], [21, 13]], 2).path([[21, 13], [39, 13], [43, 10]], 2);
      b.path([[32, 9], [33, 6]], 2).circle(33.5, 6, 2, 'd');
      for (const [x, y] of [[12, 13], [25, 8], [36, 27]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[13, 26], [30, 16]]) b.obj('zl_crates', x, y, { solid: [28, 12] });
      for (const [x, y] of [[19, 5], [12, 28]]) b.obj('tree_round', x, y, { solid: [14, 6], tree: true });
      b.obj('sign', 23.6, 31.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 100, { keep: [[33.5, 6, 3], [21, 31, 2]], kinds: SAND_DECO });
      return b;
    },
    spawns: S([['Fish', 14, 22], ['Fish', 30, 16], ['Fish', 24, 11], ['Fish', 33, 27], ['FishRed', 19, 25], ['FishRed', 37, 17], ['Axolot', 12, 11], ['Axolot', 30, 28], ['Axolot', 19, 6]]),
    chests: [{ id: 'r3_be', x: 37, y: 5.4, gold: 200, potions: 1 }],
    exits: [
      { side: 'south', from: 20, to: 23, map: 'dh_town', entry: 'north' },
      { side: 'east', from: 8, to: 12, map: 'dh_cove', entry: 'west' },
    ],
    spots: [
      runeSpot('runeTenth', '0.1의 룬 돌', 33.5, 6, '조개 모래톱', '0.1'),
      { id: 'beSign', kind: 'read', name: '표지판', x: 23.6, y: 31.8, r: 22, label: '표지판 읽기', lines: [['조개 모래톱 · 권장 Lv14~16', '↓ 데시마르 · → 소용돌이 만']] },
    ],
  },

  // ── 등대 방파제 (Lv15~17) ──────────────────────
  // 바다 위로 길게 뻗은 방파제. 가운데 작은 섬은 배다리로. 동쪽 끝 언덕 위에 「0.01의 룬」.
  dh_pier: {
    name: '등대 방파제', subtitle: '권장 Lv15~17', bgm: 'bgm_field', theme: 'sand', cols: 44, rows: 34, power: 3.0, node: [400, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(3303);
      b.ground(0, 0, 43, 33, 'w');
      b.ground(0, 11, 13, 20, 'g').ground(13, 13, 33, 16, 'g').ground(28, 0, 35, 8, 'g').ground(31, 8, 43, 28, 'g').ground(17, 3, 25, 8, 'g');
      b.circle(6, 15.5, 4, 'g').circle(37, 27, 3, 'g');
      b.high(34, 18, 41, 22).stairs(37, 23, 2);
      b.block(40, 8, 43, 9).block(31, 26, 33, 28);
      b.bridge(21, 9, 22, 12);
      b.path([[0, 15], [33, 15]], 2).path([[31, 0], [31, 13]], 2).path([[34, 15], [43, 12]], 2);
      b.path([[34, 16], [37, 24]], 2).path([[37, 21], [37.5, 20]], 1).circle(37.5, 20, 1.8, 'd');
      for (const [x, y] of [[9, 12], [27, 7], [38, 13]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[18, 17], [26, 17]]) b.obj('barrel', x, y, {});
      b.obj('zl_crates', 23, 5, { solid: [28, 12] });
      b.obj('sign', 2.6, 13.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 70, { keep: [[37.5, 20, 3], [21.5, 10, 2]], kinds: SAND_DECO });
      return b;
    },
    spawns: S([['Mollusc', 19, 14], ['Mollusc', 29, 15], ['Mollusc', 34, 25], ['Mollusc', 8, 18], ['FishRed', 5, 13], ['FishRed', 21, 6], ['Octopus', 36, 11], ['Octopus', 30, 4], ['Octopus', 41, 25]]),
    chests: [{ id: 'r3_pi', x: 19, y: 4.4, gold: 220, potions: 1 }],
    exits: [
      { side: 'west', from: 14, to: 17, map: 'dh_town', entry: 'east' },
      { side: 'north', from: 30, to: 33, map: 'dh_cove', entry: 'south' },
      { side: 'east', from: 10, to: 14, map: 'rk_town', entry: 'west', to_name: '천칭 왕국 프로포르', requires: 'report', lockedMsg: '데시마르의 결정을 먼저 되찾아요' },
    ],
    spots: [
      runeSpot('runeHundredth', '0.01의 룬 돌', 37.5, 20, '등대 방파제', '0.01'),
      { id: 'piSign', kind: 'read', name: '표지판', x: 2.6, y: 13.8, r: 22, label: '표지판 읽기', lines: [['등대 방파제 · 권장 Lv15~17', '← 데시마르 · ↑ 소용돌이 만 · → 프로포르 가는 길']] },
    ],
  },

  // ── 산호 해안 (Lv16~18) ───────────────────────
  // 마을 남쪽 배다리를 건너는 섬. 바위 사이를 돌아 동남쪽 언덕 위 「0.001의 룬」.
  dh_reef: {
    name: '산호 해안', subtitle: '권장 Lv16~18', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 3.2, node: [250, 290],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(3404);
      b.ground(0, 0, 43, 4, 'w').ground(0, 5, 2, 33, 'w').ground(41, 5, 43, 33, 'w').ground(0, 32, 43, 33, 'w');
      b.circle(4, 6, 2.5, 'w').circle(39, 6, 2.5, 'w').circle(3, 30, 2.5, 'w');
      b.bridge(20, 0, 21, 5);
      b.block(6, 8, 15, 12).block(26, 7, 37, 11).block(13, 17, 30, 19).block(4, 25, 11, 28);
      b.high(31, 23, 38, 28).stairs(34, 29, 2);
      b.path([[21, 5], [21, 15]], 2).path([[21, 15], [8, 15], [8, 22], [20, 23]], 2);
      b.path([[20, 23], [29, 23], [29, 31], [34, 31]], 1);
      b.path([[34, 28], [34.5, 26]], 1).circle(34.5, 25.5, 1.8, 'd');
      b.path([[21, 15], [38, 15]], 2);
      b.circle(24, 27, 1.6, 'w');
      for (const [x, y] of [[18, 8], [40, 13], [6, 21], [17, 29], [38, 20], [11, 31]]) b.obj(rnd() < 0.5 ? 'tree_round' : 'tree_lime', x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[30, 14.4], [12, 23]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      b.obj('sign', 23.6, 6.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 120, { keep: [[34.5, 25.5, 3], [21, 6, 2]], kinds: [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['flower_a'], ['flower_b']] });
      return b;
    },
    spawns: S([['Octopus', 25, 14], ['Octopus', 10, 19], ['Octopus', 36, 17], ['Octopus', 22, 28], ['Axolot', 17, 7], ['Axolot', 26, 25], ['Fish', 14, 30], ['Fish', 33, 14], ['Axolot', 16, 26]]),
    chests: [{ id: 'r3_re', x: 37, y: 24.4, gold: 240, potions: 2 }],
    exits: [{ side: 'north', from: 20, to: 21, map: 'dh_town', entry: 'south' }],
    entries: { north: [21, 6.6] },
    spots: [
      runeSpot('runeThousandth', '0.001의 룬 돌', 34.5, 25.5, '산호 해안', '0.001'),
      { id: 'reSign', kind: 'read', name: '표지판', x: 23.6, y: 7, r: 22, label: '표지판 읽기', lines: [['산호 해안 · 권장 Lv16~18', '↑ 배다리 건너 데시마르 · 섬 동남쪽 언덕에 룬 돌이 있대요']] },
    ],
  },

  // ── 소용돌이 만 (Lv17~19) ──────────────────────
  // 서쪽(모래톱)·남쪽(방파제)에서 들어와 만나는 바닷가. 북쪽 절벽의 해저 동굴 입구를 봉인 바위가 막아요.
  dh_cove: {
    name: '소용돌이 만', subtitle: '권장 Lv17~19', bgm: 'bgm_field', theme: 'sand', cols: 44, rows: 34, power: 3.4, node: [380, 95],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(3505);
      b.block(0, 0, 43, 8).opening(20, 9, 2);
      b.block(0, 9, 17, 15).block(26, 9, 43, 15);
      b.block(0, 27, 3, 33).block(40, 18, 43, 33).block(8, 27, 18, 33).block(22, 30, 27, 33);
      b.circle(32, 24, 4, 'w').circle(30, 27, 2.6, 'w');
      b.path([[0, 21], [14, 21], [21, 19], [21, 11]], 2);
      b.path([[30, 33], [30, 31], [24, 28], [22, 21]], 2);
      b.path([[24, 18], [38, 18]], 1);
      for (const [x, y] of [[16, 25], [5, 25], [38, 26]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      b.obj('zl_crates', 13, 18.6, { solid: [28, 12] });
      b.obj('cave_mouth', 21, 11, { tint: 0x8fa7b8 });
      b.obj('sign', 24.4, 18.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 90, { keep: [[21, 12, 3], [38, 19, 2]], kinds: SAND_DECO });
      return b;
    },
    barrier: { x: 22, y: 13.6, w: 8, step: 'runes', lines: [['커다란 바위에 보라색 봉인이 걸려 있어요.', '0.1 · 0.01 · 0.001, 세 소수의 룬 돌을 모두 깨우면 풀린대요.']] },
    spawns: S([['Octopus', 12, 23], ['Octopus', 34, 19], ['Mollusc', 25, 25], ['Mollusc', 6, 19], ['Mollusc', 38, 23], ['FishRed', 15, 22], ['Axolot', 26, 20], ['FishRed', 35, 30]]),
    chests: [{ id: 'r3_co', x: 2, y: 23.4, gold: 260, potions: 2 }],
    exits: [
      { side: 'west', from: 19, to: 23, map: 'dh_beach', entry: 'east' },
      { side: 'south', from: 29, to: 32, map: 'dh_pier', entry: 'north' },
      { x: 20, y: 9, w: 2, h: 2, map: 'dh_cave1', entry: 'south', to_name: '소용돌이 해저 동굴' },
    ],
    entries: { cave: [21, 12.6] },
    spots: [
      { id: 'find_pearl', kind: 'find', name: '조개 더미', x: 38, y: 19.4, r: 22, label: '조개 더미 뒤지기', lines: [['빈 조개껍데기뿐이에요.']] },
      { id: 'coSign', kind: 'read', name: '표지판', x: 24.4, y: 19, r: 22, label: '표지판 읽기', lines: [['소용돌이 해저 동굴 ↑', '「소수점을 똑같이 옮기면 길이 열린다」라고 적혀 있어요.']] },
    ],
  },

  // ── 소용돌이 해저 동굴 1층 ─────────────────────
  dh_cave1: {
    name: '해저 동굴 1층', subtitle: '룬 기둥과 봉인된 문', bgm: 'bgm_dungeon', theme: 'cave', cols: 36, rows: 38, power: 3.6, cave: true, style: 'sea', tint: 0xa8c8e8, node: [430, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 35, 1).wall(0, 0, 0, 37).wall(35, 0, 35, 37).wall(0, 37, 15, 37).wall(20, 37, 35, 37);
      b.wall(0, 28, 9, 29).wall(16, 28, 35, 29);     // 가운데 틈 (10~15)
      b.wall(0, 19, 6, 20).wall(13, 19, 35, 20);     // 왼쪽 틈 (7~12)
      b.wall(0, 9, 15, 10).wall(20, 9, 35, 10);      // 가운데 봉인된 문 (16~19)
      b.wall(26, 32, 30, 34).wall(22, 23, 25, 25).wall(29, 13, 31, 16).wall(4, 12, 6, 15).wall(1, 2, 4, 6).wall(31, 2, 34, 6);
      b.circle(6, 33, 2.4, 'w').circle(30, 23, 2.6, 'w').circle(8, 24, 2, 'w').circle(29, 33, 2.2, 'w').circle(4, 15, 1.8, 'w').circle(30, 15, 1.8, 'w');
      b.path([[17, 37], [17, 33], [12, 31], [12, 26], [20, 22], [9, 21], [9, 16], [17, 13], [17, 2]], 2);
      b.circle(17.5, 5, 3, 'd');
      return b;
    },
    door: { x: 18, y: 10.8, w: 4, step: 'seal' },
    stairsDown: { x: 17.5, y: 4.5, out: true, label: '▲ 바깥 (소용돌이 바위섬)' },
    spawns: S([['FishRed', 10, 34], ['Mollusc', 26, 35], ['Octopus', 20, 25], ['Axolot', 30, 26], ['Mollusc', 15, 22], ['Octopus', 9, 17], ['FishRed', 26, 14], ['Axolot', 22, 16]]),
    chests: [{ id: 'r3_c1', x: 33, y: 35, gold: 300, potions: 2 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'dh_cove', entry: 'cave' },
      { x: 16, y: 3, w: 3, h: 2, map: 'dh_cave2', entry: 'south', to_name: '소용돌이 바위섬', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
    ],
    entries: { down: [17.5, 7] },
    spots: [
      { id: 'tideA', kind: 'rune', name: '왼쪽 룬 기둥', x: 12, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 「.」 모양 소수점 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'tideB', kind: 'rune', name: '오른쪽 룬 기둥', x: 24, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 물결 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    ],
  },

  // ── 소용돌이 해저 동굴 2층 (데시토드의 방) ─────────
  dh_cave2: {
    name: '소용돌이 바위섬', subtitle: '데시토드의 섬', bgm: 'bgm_dungeon', theme: 'sand', cols: 32, rows: 32, power: 3.6, style: 'whirl', node: [515, 30],
    build() {
      // 해저 동굴을 빠져나오면 소용돌이 한가운데의 바위섬. 둘레는 깊은 바다, 남쪽 배다리로 들어와요.
      const b = new MapBuilder(this.cols, this.rows);
      b.ground(0, 0, 31, 31, 'w').circle(15.5, 11.5, 9.6, 'g').circle(15.5, 11.5, 6.5, 'd');
      b.bridge(15, 21, 16, 31);
      for (const [x, y] of [[7.5, 5.4], [23.5, 5.4], [6.5, 15.4], [24.5, 15.4], [9.5, 20], [21.5, 20]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[11, 3.4], [20, 3.4], [5.5, 10.4], [25.5, 10.4]]) b.obj('zl_rock', x, y, { solid: [12, 6] });
      return b;
    },
    boss: { x: 15.5, y: 9.5, step: 'decikraken', roomY: 19.5 },
    respawn: ['down', 'dh_cave1'],
    exits: [{ side: 'south', from: 15, to: 16, map: 'dh_cave1', entry: 'down', to_name: '해저 동굴' }],
    spots: [],
  },
};
