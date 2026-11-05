// 6번 지역: 회전체 산맥 볼테라 (여러 지도가 이어진 구조) — 눈 덮인 산
//
//   [눈꽃 비탈 sp_slope] ──▶ [구름 능선 sp_ridge] ──탑 입구──▶ [수정 회전탑 1층] ──▶ [꼭대기 세 수호자]
//          │                    ▲ (원기둥 · 원뿔 · 구 룬)
//   [산골 마을 sp_town] ──▶ 혼돈의 첨탑 (마을을 구한 뒤, 동쪽 길)
//   ◀ 키르쿠스 호수 │
//   [얼음 골짜기 sp_valley] ──▶ [얼어붙은 호수 sp_lake] ──┘
//
// 좌표는 모두 16px 칸 단위.

import { MapBuilder } from '../world/MapBuilder.js';
import { seeded } from '../world/terrain.js';
import { scatter, S } from './r1maps.js';

const SNOW_TREES = ['tree_snowpine', 'tree_whitepine', 'tree_snowpine', 'tree_white'];
const SNOW_DECO = [['zl_pebbles'], ['zl_rock', [12, 6]], ['rock_grey_s'], ['zl_pebbles']];

const runeSpot = (id, name, x, y, where, mark) => ({
  id, kind: 'rune', name, x, y, r: 24, label: '룬 돌 살펴보기', stone: true,
  runeLine: `${where}의 룬 돌이에요. 「${mark}」 모양이 새겨져 있어요. 문제를 풀면 룬이 깨어나요!`,
  sleepLines: ['오래된 룬 돌이에요.', '산지기 할머니께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'],
});

const snowTree = (rnd) => SNOW_TREES[Math.floor(rnd() * SNOW_TREES.length)];

export const MAPS = {
  // ── 산골 마을 볼테라 ───────────────────────────
  // 위쪽 언덕(산지기의 집·룬의 집) · 가운데 광장(팽이 가게·눈 굴리기 마당) · 동쪽 길 끝은 혼돈의 첨탑.
  sp_town: {
    name: '산골 마을 볼테라', subtitle: '회전체 산맥', bgm: 'bgm_town', theme: 'snow', cols: 44, rows: 34, safe: true, node: [250, 200],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(6101);
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
      b.obj('house_big', 14, 8.6, { solid: 'building', label: '산지기의 집' });
      b.obj('house_round', 29, 8.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_shop', 11, 27.6, { solid: 'building', label: '산골 상점' });
      b.obj('house_orange', 32.5, 27.6, { solid: 'building', label: '대장간' });
      b.obj('house_tavern', 33, 16.4, { solid: 'building', label: '여관' });
      b.obj('house_timber', 10, 16.4, { solid: 'building', label: '팽이 가게' });
      b.obj('zl_stump', 22, 19.8, { solid: [24, 10] });
      b.obj('zl_bench', 28, 22.6, { solid: [44, 8] });
      b.obj('zl_pot_white', 8.4, 27.8, { solid: [10, 6] }).obj('barrel', 13.6, 27.6, { solid: [12, 8] }).obj('zl_crates', 29.4, 28, { solid: [28, 12] });
      b.obj('sign', 24.4, 13.8, { solid: [10, 5] }).obj('sign', 23.4, 30.6, { solid: [10, 5] }).obj('sign', 41, 16.4, { solid: [10, 5] });
      for (const [x, y] of [[10, 4], [33, 4], [17, 5]]) b.obj('pines_snow', x, y, { solid: [24, 6], tree: true });
      for (const [x, y] of [[3, 16], [8, 24], [36, 24]]) b.obj(snowTree(rnd), x, y, { solid: [14, 6], tree: true });
      b.roughen(rnd);
      scatter(b, rnd, 70, { keep: [[22, 18, 5], [21, 31, 3], [16, 24, 2.5], [41, 17, 2]], kinds: SNOW_DECO });
      return b;
    },
    exits: [
      { side: 'west', from: 16, to: 21, map: 'ck_lake', entry: 'east' },
      { side: 'north', from: 20, to: 23, map: 'sp_slope', entry: 'south' },
      { side: 'south', from: 20, to: 23, map: 'sp_valley', entry: 'north' },
      { side: 'east', from: 16, to: 21, scene: 'Dungeon', region: 'chaosSpire', entry: 'south', to_name: '혼돈의 첨탑 카오스피어', requires: 'report', lockedMsg: '볼테라의 결정을 먼저 되찾아요' },
    ],
    entries: { plaza: [22, 24.5] },
    npcs: [
      { id: 'chief', sprite: 'OldWoman', name: '산지기 할머니 볼타', x: 17.4, y: 9.8, lines: [['아이고, 이 추운 산골까지 잘 왔구나.']] },
      { id: 'runeMaster', sprite: 'OldMan3', name: '룬 학자 스피로', x: 26.4, y: 9.8, lines: [['기술의 룬을 배우러 왔구먼.']] },
      { id: 'merchant', sprite: 'Villager4', name: '산골 상인 눈송이', x: 13.6, y: 28.8, role: 'shop', lines: [['따뜻한 물건 많아요~']] },
      { id: 'smith', sprite: 'Shaman', name: '대장장이 빙글', x: 27.4, y: 28.8, role: 'forge', lines: [['칼도 빙글빙글 돌려 가며 갈아야 고르게 갈리지!']] },
      { id: 'innkeeper', sprite: 'Woman', name: '여관 주인 온기', x: 30.6, y: 17.4, lines: [['몸 좀 녹이고 가요.', '광장 옆 샘물을 마시면 기운이 나요.']] },
      { id: 'climber', sprite: 'Villager2', name: '산악인 오름', x: 19.4, y: 13.8, lines: [['북쪽은 눈꽃 비탈, 남쪽은 얼음 골짜기야. 동쪽 끝에는… 혼돈의 첨탑이 보여.']] },
      { id: 'child', sprite: 'Child', name: '꼬마 데굴이', x: 26.6, y: 25.4, wander: 14, lines: [['반원을 빙글 돌리면 공(구)이 된대!', '직사각형을 돌리면 원기둥이고!']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '따뜻한 샘', x: 16, y: 25.4, r: 26, label: '샘물 마시기', lines: [['따뜻한 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'topShop', kind: 'read', name: '팽이 가게 진열대', x: 10, y: 17.6, r: 22, label: '진열대 살펴보기',
        lines: [['뾰족한 팽이는 원뿔 모양이에요.', '직각삼각형을 한 변을 축으로 한 바퀴 돌리면 원뿔이 돼요.'], ['둥근 통 팽이는 원기둥이에요.', '직사각형을 한 변을 축으로 돌리면 원기둥이 돼요.']] },
      { id: 'snowYard', kind: 'read', name: '눈 굴리기 마당', x: 22, y: 21.8, r: 26, label: '마당 살펴보기',
        lines: [['아이들이 눈을 굴려 동그란 눈덩이를 만들었어요.', '반원을 지름을 축으로 한 바퀴 돌리면 구가 돼요. 어느 쪽에서 봐도 원이에요!']] },
      { id: 'spireSign', kind: 'read', name: '동쪽 길 표지판', x: 41, y: 16.8, r: 22, label: '표지판 읽기',
        lines: [['→ 혼돈의 첨탑 카오스피어', '「여섯 결정을 모두 되찾은 자만 오르라」라고 적혀 있어요.']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 23.4, y: 31, r: 24, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 24.4, y: 14.2, r: 22, label: '안내판 읽기',
        lines: [['↑ 눈꽃 비탈 (권장 Lv27~29)', '↓ 얼음 골짜기 (Lv28~30) → 얼어붙은 호수 (Lv29~30)', '→ 혼돈의 첨탑', '← 키르쿠스 보름달 호수']] },
    ],
  },

  // ── 눈꽃 비탈 (Lv27~29) ────────────────────────
  // 남쪽 입구에서 곧게 올라가면 가운데 언덕 위 「원기둥의 룬」. 동쪽 길은 구름 능선으로.
  sp_slope: {
    name: '눈꽃 비탈', subtitle: '권장 Lv27~29', bgm: 'bgm_field', theme: 'snow', cols: 44, rows: 34, power: 5.6, node: [250, 100],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(6202);
      b.block(0, 0, 43, 2).block(0, 3, 3, 33).block(40, 14, 43, 33);
      b.block(4, 29, 17, 33).block(26, 29, 39, 33);
      b.block(5, 14, 12, 18).block(28, 18, 36, 23).block(8, 22, 15, 25).block(30, 4, 37, 8);
      b.high(15, 3, 27, 8).stairs(21, 9, 2);
      b.path([[21, 33], [21, 11]], 2).path([[21, 13], [39, 13], [43, 10]], 2);
      b.path([[21, 8], [21, 5]], 2).circle(21.5, 5, 2, 'd');
      b.ground(34, 15, 35, 16, 'w').circle(7, 8, 2.2, 'w');
      for (const [x, y] of [[12, 11], [25, 25], [34, 27]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[5, 11], [18, 20], [37, 11], [29, 15], [11, 27]]) b.obj(snowTree(rnd), x, y, { solid: [14, 6], tree: true });
      b.obj('sign', 23.6, 31.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 110, { keep: [[21.5, 5, 3], [21, 31, 2]], kinds: SNOW_DECO });
      return b;
    },
    spawns: S([['Mole2', 16, 13], ['Mole2', 30, 12], ['Mole2', 22, 21], ['Flam2', 33, 26], ['Flam2', 4.5, 21], ['AxolotBlue', 26, 16], ['AxolotBlue', 9, 6], ['DragonYellow', 18, 27], ['DragonYellow', 38, 6]]),
    chests: [{ id: 'r6_sl', x: 26, y: 4.4, gold: 500, potions: 2 }],
    exits: [
      { side: 'south', from: 20, to: 23, map: 'sp_town', entry: 'north' },
      { side: 'east', from: 8, to: 12, map: 'sp_ridge', entry: 'west' },
    ],
    spots: [
      runeSpot('runeCylinder', '원기둥의 룬 돌', 21.5, 5, '눈꽃 비탈', '직사각형 ↻ 원기둥'),
      { id: 'slSign', kind: 'read', name: '표지판', x: 23.6, y: 31.8, r: 22, label: '표지판 읽기', lines: [['눈꽃 비탈 · 권장 Lv27~29', '↓ 볼테라 · → 구름 능선']] },
    ],
  },

  // ── 얼음 골짜기 (Lv28~30) ──────────────────────
  // 북쪽 입구에서 갈라지는 골짜기. 서쪽 언덕 위 「원뿔의 룬」(계단은 언덕 아래쪽), 동쪽 길은 얼어붙은 호수로.
  sp_valley: {
    name: '얼음 골짜기', subtitle: '권장 Lv28~30', bgm: 'bgm_field', theme: 'snow', cols: 44, rows: 34, power: 5.8, node: [250, 290],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(6303);
      b.block(0, 0, 18, 3).block(25, 0, 43, 3).block(0, 4, 3, 33).block(40, 4, 43, 17).block(40, 25, 43, 33).block(4, 32, 39, 33);
      b.block(6, 6, 15, 10).block(26, 6, 36, 10).block(18, 15, 30, 17).block(31, 22, 38, 26);
      b.high(4, 20, 14, 27).stairs(9, 28, 2);
      b.path([[21, 0], [21, 13]], 2).path([[21, 13], [8, 13], [8, 18], [16, 18], [16, 30], [9, 30]], 2);
      b.path([[21, 13], [37, 13], [37, 21], [43, 21]], 2);
      b.path([[9, 27], [9, 23]], 2).circle(9.5, 23, 2, 'd');
      b.ground(29, 28, 31, 29, 'w');
      for (const [x, y] of [[20, 9], [12, 12], [24, 22], [36, 30], [22, 28], [38, 18]]) b.obj(snowTree(rnd), x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[33, 16], [27, 23]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      b.obj('sign', 23.6, 4.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 100, { keep: [[9.5, 23, 3], [23, 4, 2]], kinds: SNOW_DECO });
      return b;
    },
    spawns: S([['Flam2', 12, 15], ['Flam2', 30, 13], ['Flam2', 24, 25], ['AxolotBlue', 20, 21], ['AxolotBlue', 35, 30], ['Mole2', 28, 20], ['Mole2', 12, 30], ['Reptile', 36, 19], ['DragonYellow', 6, 15]]),
    chests: [{ id: 'r6_va', x: 13, y: 21.4, gold: 520, potions: 2 }],
    exits: [
      { side: 'north', from: 20, to: 23, map: 'sp_town', entry: 'south' },
      { side: 'east', from: 18, to: 23, map: 'sp_lake', entry: 'west' },
    ],
    spots: [
      runeSpot('runeCone', '원뿔의 룬 돌', 9.5, 23, '얼음 골짜기', '직각삼각형 ↻ 원뿔'),
      { id: 'vaSign', kind: 'read', name: '표지판', x: 23.6, y: 5, r: 22, label: '표지판 읽기', lines: [['얼음 골짜기 · 권장 Lv28~30', '↑ 볼테라 · → 얼어붙은 호수 · 서쪽 언덕은 아래쪽 계단으로']] },
    ],
  },

  // ── 얼어붙은 호수 (Lv29~30) ─────────────────────
  // 둥근 호수 가운데 섬에 「구의 룬」. 남쪽 물가에서 판자 다리로 건너요. 북쪽 길은 구름 능선으로.
  sp_lake: {
    name: '얼어붙은 호수', subtitle: '권장 Lv29~30', bgm: 'bgm_field', theme: 'snow', cols: 44, rows: 34, power: 6.0, node: [400, 270],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(6404);
      b.block(0, 0, 29, 3).block(34, 0, 43, 3).block(0, 4, 4, 16).block(0, 24, 4, 33).block(39, 4, 43, 33).block(6, 29, 36, 33);
      b.circle(22, 17, 7, 'w').circle(22, 17, 2.6, 'g');
      b.bridge(21, 20, 22, 24);
      b.path([[0, 20], [12, 20], [12, 26], [30, 26], [31, 20], [31, 0]], 2);
      b.path([[21, 25], [21, 25]], 2);
      for (const [x, y] of [[8, 9], [36, 10], [36, 25], [9, 27], [26, 6]]) b.obj(snowTree(rnd), x, y, { solid: [14, 6], tree: true });
      b.obj('zl_boulder', 14, 6, { solid: [28, 10] });
      b.obj('sign', 6.6, 18.4, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 80, { keep: [[22, 17, 9], [6, 18, 2]], kinds: SNOW_DECO });
      return b;
    },
    spawns: S([['AxolotBlue', 10, 10], ['AxolotBlue', 36, 14], ['AxolotBlue', 16, 27], ['Flam2', 8, 24], ['Flam2', 34, 22], ['Mole2', 24, 8], ['Mole2', 12, 14], ['Reptile', 35, 27], ['DragonYellow', 28, 26]]),
    chests: [{ id: 'r6_la', x: 23.6, y: 18.2, gold: 540, potions: 2 }],
    exits: [
      { side: 'west', from: 19, to: 23, map: 'sp_valley', entry: 'east' },
      { side: 'north', from: 30, to: 33, map: 'sp_ridge', entry: 'south' },
    ],
    spots: [
      runeSpot('runeSphere', '구의 룬 돌', 21.5, 16.6, '얼어붙은 호수', '반원 ↻ 구'),
      { id: 'laSign', kind: 'read', name: '표지판', x: 6.6, y: 18.8, r: 22, label: '표지판 읽기', lines: [['얼어붙은 호수 · 권장 Lv29~30', '← 얼음 골짜기 · ↑ 구름 능선 · 섬에는 남쪽 판자 다리로']] },
    ],
  },

  // ── 구름 능선 (Lv30) ────────────────────────
  // 서쪽(눈꽃 비탈)·남쪽(얼어붙은 호수)에서 올라와 만나는 능선. 북쪽 절벽의 회전탑 입구를 봉인 바위가 막아요.
  sp_ridge: {
    name: '구름 능선', subtitle: '권장 Lv30', bgm: 'bgm_field', theme: 'snow', cols: 44, rows: 34, power: 6.2, node: [390, 95],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(6505);
      b.block(0, 0, 43, 8).opening(20, 9, 2);
      b.block(0, 9, 17, 15).block(26, 9, 43, 15);
      b.block(0, 27, 3, 33).block(40, 18, 43, 33).block(8, 27, 18, 33).block(22, 30, 27, 33);
      b.block(29, 21, 35, 27);
      b.path([[0, 21], [14, 21], [21, 19], [21, 11]], 2);
      b.path([[30, 33], [30, 31], [24, 28], [22, 21]], 2);
      b.path([[24, 18], [38, 18]], 1);
      for (const [x, y] of [[16, 25], [5, 25], [38, 26]]) b.obj('zl_boulder', x, y, { solid: [28, 10] });
      for (const [x, y] of [[12, 18.4], [27, 20.4]]) b.obj(snowTree(rnd), x, y, { solid: [14, 6], tree: true });
      b.obj('cave_mouth', 21, 11, { tint: 0xb8c8e0 });
      b.obj('sign', 24.4, 18.6, { solid: [10, 5] });
      b.roughen(rnd);
      scatter(b, rnd, 90, { keep: [[21, 12, 3], [38, 19, 2]], kinds: SNOW_DECO });
      return b;
    },
    barrier: { x: 22, y: 13.6, w: 8, step: 'runes', lines: [['커다란 바위에 보라색 봉인이 걸려 있어요.', '원기둥 · 원뿔 · 구, 세 룬 돌을 모두 깨우면 풀린대요.']] },
    spawns: S([['Reptile', 12, 23], ['Reptile', 36, 20], ['DragonYellow', 25, 25], ['Flam2', 6, 19], ['Mole2', 38, 23], ['AxolotBlue', 15, 22], ['DragonYellow', 24, 20], ['Reptile', 36, 30]]),
    chests: [{ id: 'r6_ri', x: 2, y: 23.4, gold: 560, potions: 2 }],
    exits: [
      { side: 'west', from: 19, to: 23, map: 'sp_slope', entry: 'east' },
      { side: 'south', from: 29, to: 32, map: 'sp_lake', entry: 'north' },
      { x: 20, y: 9, w: 2, h: 2, map: 'sp_tower1', entry: 'south', to_name: '수정 회전탑' },
    ],
    entries: { cave: [21, 12.6] },
    spots: [
      { id: 'find_scarf', kind: 'find', name: '눈 더미', x: 38, y: 19.4, r: 22, label: '눈 더미 뒤지기', lines: [['차가운 눈뿐이에요.']] },
      { id: 'riSign', kind: 'read', name: '표지판', x: 24.4, y: 19, r: 22, label: '표지판 읽기', lines: [['수정 회전탑 ↑', '「돌려서 생긴 모양을 아는 자만 오르라」라고 적혀 있어요.']] },
    ],
  },

  // ── 수정 회전탑 1층 ───────────────────────────
  sp_tower1: {
    name: '수정 회전탑 1층', subtitle: '룬 기둥과 봉인된 문', bgm: 'bgm_dungeon', theme: 'cave', cols: 36, rows: 38, power: 6.4, cave: true, tint: 0xb8c8e0, node: [430, 30],
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
    spawns: S([['Reptile', 12, 34], ['DragonYellow', 28, 35], ['Flam2', 20, 26], ['AxolotBlue', 31, 22], ['Reptile', 10, 25], ['DragonYellow', 8, 15], ['Flam2', 26, 14], ['Reptile', 22, 16]]),
    chests: [{ id: 'r6_t1', x: 33, y: 35, gold: 600, potions: 3 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'sp_ridge', entry: 'cave' },
      { x: 16, y: 3, w: 3, h: 2, map: 'sp_tower2', entry: 'south', to_name: '회전탑 꼭대기', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
    ],
    entries: { down: [17.5, 7] },
    spots: [
      { id: 'solidA', kind: 'rune', name: '왼쪽 룬 기둥', x: 12, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 원기둥 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'solidB', kind: 'rune', name: '오른쪽 룬 기둥', x: 24, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 원뿔과 구 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    ],
  },

  // ── 수정 회전탑 꼭대기 (세 수호자의 방) ─────────────
  sp_tower2: {
    name: '회전탑 꼭대기', subtitle: '세 수호자의 방', bgm: 'bgm_dungeon', theme: 'cave', cols: 32, rows: 32, power: 6.4, cave: true, tint: 0xa8b8d8, node: [515, 30],
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 31, 1).wall(0, 0, 0, 31).wall(31, 0, 31, 31).wall(0, 31, 13, 31).wall(18, 31, 31, 31);
      b.wall(1, 2, 5, 5).wall(26, 2, 30, 5).wall(1, 25, 6, 30).wall(25, 25, 30, 30).wall(1, 12, 2, 17).wall(29, 12, 30, 17);
      b.circle(15.5, 13, 9, 'd');
      b.path([[15, 31], [15, 20]], 2);
      return b;
    },
    boss: { x: 15.5, y: 10, step: 'guardians', roomY: 21 },
    exits: [{ side: 'south', from: 14, to: 17, map: 'sp_tower1', entry: 'down', to_name: '회전탑 1층' }],
    spots: [],
  },
};
