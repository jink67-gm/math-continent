// 1번 지역: 나눔의 계곡 프락시아 (제노니아처럼 여러 지도가 이어진 구조)
//
//              [돌다리 고개 pass] ──동굴 입구──▶ [뒤집힌 동굴 1층 cave1] ──계단──▶ [2층 cave2]
//                     ▲ (세 룬 돌을 깨우면 봉인이 풀려요)
// [나무꾼 숲 forest] ─▶ [바람의 언덕 hill]
//        │                    ▲
//        └──── [프락시아 마을 village] ──── [바람개비 들판 east_field] ──▶ 큐베른 (마을을 구한 뒤)
//                             │
//                      [졸졸 시냇가 stream]
//
// 좌표는 모두 16px 칸 단위. 출구(exits)는 지도 가장자리의 칸 범위이고, 들어올 때는 같은 이름의 entries 자리에 서요.

import { MapBuilder } from '../world/MapBuilder.js';
import { seeded } from '../world/terrain.js';

const TREES = {
  meadow: ['tree_green', 'tree_round', 'tree_pine', 'tree_lime'],
  meadowBig: ['tree_big', 'tree_big', 'tree_big_orange', 'tree_big_pink'],
  forest: ['tree_pine', 'tree_green', 'tree_pine', 'tree_round'],
  forestBig: ['tree_big', 'trio_green', 'tree_big'],
};

// 가장자리 숲 (gaps: 비워 둘 출구 칸 범위)
function border(b, rnd, { gaps = {}, trees = TREES.meadow, big = TREES.meadowBig } = {}) {
  const open = (side, v) => (gaps[side] || []).some(([a, c]) => v >= a - 1 && v <= c + 1);
  const put = (x, y) => {
    const isBig = rnd() < 0.35;
    const list = isBig ? big : trees;
    b.obj(list[Math.floor(rnd() * list.length)], x, y, { solid: isBig ? [16, 6] : [12, 6], tree: true });
  };
  for (let x = 0.6; x < b.cols; x += 1.5 + rnd() * 0.5) {
    if (!open('north', Math.floor(x))) put(x, 1.2);
    if (!open('south', Math.floor(x))) put(x, b.rows - 0.1);
  }
  for (let y = 2.6; y < b.rows - 1; y += 1.4 + rnd() * 0.5) {
    if (!open('west', Math.floor(y))) put(0.7, y);
    if (!open('east', Math.floor(y))) put(b.cols - 0.7, y);
  }
}

// 풀숲·꽃·덤불 흩뿌리기 (길·물·언덕 가장자리·물건 근처는 피해요)
function scatter(b, rnd, n, { keep = [], kinds } = {}) {
  const deco = kinds || [['flower_a'], ['flower_b'], ['grass_a'], ['grass_b'], ['grass_a'], ['bush_a', [10, 5]], ['bush_b', [10, 5]]];
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(rnd() * (b.cols - 2));
    const y = 2 + Math.floor(rnd() * (b.rows - 3));
    let ok = b.grid.get(x, y) === 'g' && b.walkable(x, y) && b.walkable(x, y + 1) && !b.isFace(x, y + 1);
    if (ok && keep.some(([kx, ky, r]) => (kx - x) ** 2 + (ky - y) ** 2 < r * r)) ok = false;
    if (ok && b.objects.some((o) => !o.flat && (o.x / 16 - x - 0.5) ** 2 + (o.y / 16 - y - 1) ** 2 < 4)) ok = false;
    if (!ok) continue;
    const [k, solid] = deco[Math.floor(rnd() * deco.length)];
    b.obj(k, x + 0.5, y + 1, { solid: solid || null, flat: !solid });
  }
}

// 몬스터 자리 만들기: [종류, x, y]
const S = (list) => list.map(([kind, x, y]) => ({ kind, x: x * 16, y: y * 16 }));

export const MAPS = {
  // ── 프락시아 마을 ─────────────────────────────
  village: {
    name: '프락시아 마을', subtitle: '나눔의 계곡', bgm: 'bgm_town', theme: 'meadow', cols: 44, rows: 34, safe: true,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(101);
      // 위쪽 언덕 (촌장 집·룬 할아버지 집)과 가운데 계단
      b.high(6, 0, 38, 12).stairs(21, 13, 2).stairs(33, 13, 1);
      b.path([[21, 0], [21, 12]], 2);
      b.path([[11, 11], [32, 11]], 2);
      b.path([[33, 12], [33, 13]], 1);
      // 광장과 길: 동쪽(들판) · 남쪽(시냇가) · 서쪽(숲)
      b.circle(22.5, 19.5, 4.3, 'd');
      b.path([[21, 13], [21, 33]], 2);
      b.path([[24, 19], [43, 19]], 2);
      b.path([[18, 21], [12, 25], [0, 25]], 2);
      // 서쪽 시내와 다리
      b.river([[3, 0], [3, 33]], 2);
      b.bridge(3, 25, 4, 26);
      // 치유의 샘
      b.circle(15, 19.5, 1.7, 'w');
      // 분수 밭으로 가는 길
      b.path([[30, 21], [30, 27]], 2);
      // 건물
      b.obj('house_big', 14, 10.6, { solid: 'building', label: '촌장의 집' });
      b.obj('house_round', 29.5, 10.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_timber', 37.4, 10.6, { solid: 'building' });
      b.obj('house_tavern', 38, 18, { solid: 'building', label: '여관' });
      b.obj('house_shop', 11.5, 24, { solid: 'building', label: '루루 상점' });
      b.obj('house_red', 26.5, 27.6, { solid: 'building' });
      b.obj('kiln', 7.8, 31.6, { solid: 'building' });
      b.obj('house_orange', 11.5, 31.6, { solid: 'building', label: '대장간' });
      // 소품
      b.obj('barrel', 16.6, 24, { solid: [12, 8] }).obj('jar', 8, 24, { solid: [10, 6] }).obj('cart', 18.6, 31.6, { solid: [26, 10] });
      b.obj('laundry', 33, 18, {}).obj('jar', 41.6, 18, { solid: [10, 6] }).obj('barrel', 26.4, 10.6, { solid: [12, 8] });
      b.obj('scarecrow', 41.2, 27.6, { solid: [8, 6] }).obj('sign', 25.4, 31, { solid: [10, 5] }).obj('sign', 24.2, 12.4, { solid: [10, 5] });
      for (const x of [33.5, 36.5, 39.5]) b.obj('fence', x, 24.4, { solid: [48, 6] });
      border(b, rnd, { gaps: { north: [[20, 23]], south: [[20, 23]], east: [[18, 21]], west: [[24, 27]] } });
      // 언덕 위 나무 몇 그루
      for (const [x, y] of [[8, 4], [12, 3], [26, 3], [35, 4], [9, 8], [34, 7]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_green', x, y, { solid: [14, 6], tree: true });
      scatter(b, rnd, 130, { keep: [[15, 19.5, 3], [35, 27, 5], [22.5, 19.5, 5]] });
      return b;
    },
    plots: [{ x: 32, y: 26, label: '1/2 밭', planted: 4 }, { x: 36.5, y: 26, label: '1/4 밭', planted: 2 }, { x: 32, y: 29.4, label: '1/8 밭', planted: 1 }],
    exits: [
      { side: 'north', from: 20, to: 23, map: 'hill', entry: 'south' },
      { side: 'east', from: 18, to: 21, map: 'east_field', entry: 'west' },
      { side: 'south', from: 20, to: 23, map: 'stream', entry: 'north' },
      { side: 'west', from: 24, to: 27, map: 'forest', entry: 'east' },
    ],
    entries: { plaza: [22.5, 22] },
    npcs: [
      { id: 'chief', sprite: 'OldMan', name: '풍차 촌장 모모', x: 16.6, y: 11.4, lines: [['프락시아에 온 걸 환영하네. 바람이 참 좋지?']] },
      { id: 'runeMaster', sprite: 'OldMan3', name: '룬 할아버지', x: 31.6, y: 11.4, lines: [['기술은 힘만으로 배우는 게 아니란다.', '수학의 룬을 깨워야 하지.']] },
      { id: 'merchant', sprite: 'Villager4', name: '상인 루루', x: 13.6, y: 24.6, role: 'shop', lines: [['어서 오세요! 좋은 물건 많아요~']] },
      { id: 'smith', sprite: 'Shaman', name: '대장장이 쿵쿵', x: 14, y: 32.2, role: 'forge', lines: [['쾅! 쾅! 장비를 강화하려면 수학 실력이 필요하지!']] },
      { id: 'innkeeper', sprite: 'OldWoman', name: '여관 주인 포근', x: 40.4, y: 18.6, lines: [['먼 길 오느라 고생했지요?', '광장 옆 샘물을 마시면 기운이 난답니다.']] },
      { id: 'child', sprite: 'Child', name: '꼬마 콩이', x: 25, y: 21, wander: 24, lines: [['밭에 심은 칸 수를 세어 봤어?', '8칸 중에 4칸이면 1/2, 2칸이면 1/4이래!']] },
      { id: 'guard', sprite: 'Knight', name: '경비병 단단', x: 24.2, y: 16.6, lines: [['언덕 위에는 촌장님 댁이 있소.', '마을 밖은 위험하니 회복약을 꼭 챙기시오.']] },
      { id: 'pipi', sprite: 'Spirit', name: '안내 정령 피피', x: 19.4, y: 29.4, float: true,
        lines: [['모험가님, 프락시아 마을에 온 걸 환영해요!', '머리 위에 「!」가 뜬 사람에게 말을 걸면 부탁(퀘스트)을 받을 수 있어요.'], ['마을 밖은 동쪽·남쪽·서쪽·북쪽으로 이어져 있어요.', '지도 오른쪽 위 작은 지도와 노란 화살표를 따라가 보세요!']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '치유의 샘', x: 15, y: 22, r: 32, label: '샘물 마시기', lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 25.4, y: 31.4, r: 24, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 24.2, y: 12.8, r: 22, label: '안내판 읽기',
        lines: [['↑ 바람의 언덕 (권장 Lv4~6)', '→ 바람개비 들판 (Lv1~3)', '↓ 졸졸 시냇가 (Lv2~4)', '← 나무꾼 숲 (Lv3~5)']] },
    ],
  },

  // ── 바람개비 들판 (Lv1~3) ──────────────────────
  east_field: {
    name: '바람개비 들판', subtitle: '권장 Lv1~3', bgm: 'bgm_field', theme: 'meadow', cols: 46, rows: 32, power: 1,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(202);
      b.path([[0, 18], [14, 18], [22, 14], [45, 14]], 2);
      b.path([[22, 15], [31, 12]], 2);
      // 북동쪽 언덕 위 룬 돌 (계단으로 올라가요)
      b.high(25, 2, 40, 9).stairs(31, 10, 2);
      b.path([[31, 9], [31, 6]], 2);
      b.circle(31.5, 5.5, 2.2, 'd');
      b.circle(30, 24, 3, 'w');
      b.circle(9, 7, 2.2, 'w');
      border(b, rnd, { gaps: { west: [[17, 20]], east: [[13, 16]] } });
      for (const [x, y] of [[6, 26], [14, 28], [40, 25], [38, 29], [18, 6], [43, 6]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      for (const [x, y] of [[20, 24], [36, 20]]) b.obj('rock_grey', x, y, { solid: [24, 10] });
      b.obj('sign', 3.6, 16.6, { solid: [10, 5] });
      scatter(b, rnd, 170, { keep: [[31.5, 5.5, 3], [41, 4, 2]] });
      return b;
    },
    spawns: S([['Slime', 10, 22], ['Slime', 16, 25], ['Slime', 24, 19], ['Slime', 36, 17], ['Slime', 12, 12], ['Butterfly', 20, 9], ['Butterfly', 38, 24], ['Slime', 28, 28], ['Butterfly', 33, 6]]),
    chests: [{ id: 'r1_ef', x: 38.5, y: 4.4, gold: 40, potions: 1 }],
    exits: [
      { side: 'west', from: 17, to: 20, map: 'village', entry: 'east' },
      { side: 'east', from: 13, to: 16, scene: 'Town', region: 'cubeCity', entry: 'west', to_name: '쌓기나무 성채 큐베른', requires: 'report', lockedMsg: '프락시아의 결정을 먼저 되찾아요' },
    ],
    spots: [
      { id: 'runeA', kind: 'rune', name: '바람의 룬 돌', x: 31.5, y: 5.6, r: 24, label: '룬 돌 살펴보기', stone: true,
        runeLine: '바람개비 들판의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!', sleepLines: ['오래된 룬 돌이에요.', '촌장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'efSign', kind: 'read', name: '표지판', x: 3.6, y: 17, r: 22, label: '표지판 읽기', lines: [['바람개비 들판 · 권장 Lv1~3', '← 프락시아 마을 · → 큐베른 가는 길']] },
    ],
  },

  // ── 졸졸 시냇가 (Lv2~4) ────────────────────────
  stream: {
    name: '졸졸 시냇가', subtitle: '권장 Lv2~4', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 1.2,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(303);
      b.path([[21, 0], [21, 12]], 2);
      b.river([[0, 14], [12, 15], [24, 13], [43, 15]], 2);
      b.bridge(21, 13, 22, 16);
      b.ground(21, 13, 22, 16, 'w');
      b.path([[21, 17], [21, 22], [10, 26], [6, 30]], 2);
      b.path([[22, 22], [28, 29], [33, 29]], 2);
      // 동남쪽 언덕 위 룬 돌
      b.high(30, 19, 42, 26).stairs(33, 27, 2);
      b.path([[33, 26], [35, 22]], 2);
      b.circle(36, 22, 2, 'd');
      border(b, rnd, { gaps: { north: [[20, 23]] } });
      for (const [x, y] of [[8, 6], [14, 8], [32, 6], [38, 9], [12, 32], [26, 31]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_round', x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[4, 20], [16, 30], [27, 20]]) b.obj('rock_brown', x, y, { solid: [24, 10] });
      b.obj('sign', 23.6, 3.6, { solid: [10, 5] });
      scatter(b, rnd, 170, { keep: [[36, 22, 3], [5, 30, 2]] });
      return b;
    },
    spawns: S([['Mushroom', 9, 21], ['Mushroom', 15, 24], ['Mushroom', 26, 25], ['Mushroom', 8, 29], ['Mushroom', 25, 30], ['Slime', 10, 8], ['Slime', 31, 8], ['Butterfly', 16, 5], ['Butterfly', 37, 11]]),
    chests: [{ id: 'r1_st', x: 3.5, y: 31, gold: 50, potions: 1 }],
    exits: [{ side: 'north', from: 20, to: 23, map: 'village', entry: 'south' }],
    spots: [
      { id: 'runeB', kind: 'rune', name: '물결의 룬 돌', x: 36, y: 22.2, r: 24, label: '룬 돌 살펴보기', stone: true,
        runeLine: '시냇가 언덕의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!', sleepLines: ['오래된 룬 돌이에요.', '촌장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'stSign', kind: 'read', name: '표지판', x: 23.6, y: 4, r: 22, label: '표지판 읽기', lines: [['졸졸 시냇가 · 권장 Lv2~4', '버섯이 많이 사는 곳이에요. ↑ 프락시아 마을']] },
    ],
  },

  // ── 나무꾼 숲 (Lv3~5) ──────────────────────────
  forest: {
    name: '나무꾼 숲', subtitle: '권장 Lv3~5', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 1.35,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(404);
      b.path([[43, 25], [30, 25], [22, 20], [22, 12], [34, 6], [34, 0]], 2);
      b.path([[22, 18], [12, 18], [10, 15]], 2);
      // 북서쪽 언덕 위 룬 돌
      b.high(3, 3, 16, 11).stairs(10, 12, 2);
      b.path([[10, 11], [10, 7]], 2);
      b.circle(10.5, 6.5, 2, 'd');
      border(b, rnd, { gaps: { east: [[24, 27]], north: [[33, 36]] }, trees: TREES.forest, big: TREES.forestBig });
      // 숲 속 나무 무리
      const clumps = [[28, 14], [36, 14], [38, 20], [26, 30], [15, 27], [6, 22], [18, 4], [40, 30], [14, 14], [30, 19]];
      for (const [cx, cy] of clumps) {
        for (let k = 0; k < 3; k++) b.obj(TREES.forest[Math.floor(rnd() * 4)], cx + (rnd() - 0.5) * 3, cy + (rnd() - 0.5) * 2, { solid: [12, 6], tree: true });
      }
      b.obj('stump', 24, 28, { solid: [24, 8] }).obj('sign', 40.6, 23.6, { solid: [10, 5] });
      scatter(b, rnd, 160, { keep: [[10.5, 6.5, 3], [38, 4, 2]], kinds: [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['bush_c', [10, 5]], ['flower_b']] });
      return b;
    },
    spawns: S([['Spirit', 30, 10], ['Spirit', 18, 22], ['Spirit', 36, 28], ['Spirit', 8, 26], ['Mushroom', 26, 22], ['Mushroom', 16, 16], ['Butterfly', 39, 9], ['Mushroom', 33, 21], ['Spirit', 25, 6]]),
    chests: [{ id: 'r1_fo', x: 4.5, y: 30.5, gold: 70, potions: 2 }],
    exits: [
      { side: 'east', from: 24, to: 27, map: 'village', entry: 'west' },
      { side: 'north', from: 33, to: 36, map: 'hill', entry: 'west' },
    ],
    spots: [
      { id: 'runeC', kind: 'rune', name: '나무의 룬 돌', x: 10.5, y: 6.6, r: 24, label: '룬 돌 살펴보기', stone: true,
        runeLine: '숲 언덕의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!', sleepLines: ['오래된 룬 돌이에요.', '촌장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'foSign', kind: 'read', name: '표지판', x: 40.6, y: 24, r: 22, label: '표지판 읽기', lines: [['나무꾼 숲 · 권장 Lv3~5', '→ 프락시아 마을 · ↑ 바람의 언덕']] },
    ],
  },

  // ── 바람의 언덕 (Lv4~6) ────────────────────────
  hill: {
    name: '바람의 언덕', subtitle: '권장 Lv4~6', bgm: 'bgm_field', theme: 'meadow', cols: 46, rows: 36, power: 1.5,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(505);
      b.path([[21, 35], [21, 26], [8, 24], [0, 24]], 2);
      b.path([[21, 26], [22, 19]], 2);
      // 큰 언덕 (위쪽 절반) — 가운데 계단으로 올라 북쪽 고개로
      b.high(6, 0, 40, 17).stairs(22, 18, 2).stairs(36, 18, 1);
      b.path([[22, 17], [22, 0]], 2);
      b.path([[23, 10], [34, 8]], 2);
      b.circle(35, 8, 2.2, 'd');
      b.circle(38, 28, 2.6, 'w');
      border(b, rnd, { gaps: { south: [[20, 23]], west: [[23, 26]], north: [[21, 24]] } });
      for (const [x, y] of [[10, 5], [14, 12], [30, 4], [38, 13], [9, 30], [30, 31], [42, 22]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_pine', x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[17, 7], [28, 14], [12, 27], [34, 23]]) b.obj(rnd() < 0.5 ? 'rock_grey_big' : 'rock_grey', x, y, { solid: [40, 14] });
      // 고개로 가는 길을 막은 봉인 바위 (세 룬 돌을 깨우면 사라져요)
      b.obj('sign', 25.4, 3.6, { solid: [10, 5] });
      scatter(b, rnd, 160, { keep: [[22, 2, 3], [40, 30, 3]] });
      return b;
    },
    barrier: { x: 23, y: 2.2, w: 4, step: 'runes', msg: '보라색 봉인이 길을 막고 있어요' },
    spawns: S([['Flam', 14, 22], ['Flam', 30, 25], ['Spirit', 12, 9], ['Spirit', 32, 12], ['Butterfly', 40, 20], ['Flam', 28, 6], ['Spirit', 16, 30], ['Slime', 6, 28], ['Butterfly', 18, 4]]),
    chests: [{ id: 'r1_hi', x: 38.5, y: 3.4, gold: 80, potions: 1, armor: 'leather' }],
    exits: [
      { side: 'south', from: 20, to: 23, map: 'village', entry: 'north' },
      { side: 'west', from: 23, to: 26, map: 'forest', entry: 'north' },
      { side: 'north', from: 21, to: 24, map: 'pass', entry: 'south', requires: 'runes', lockedMsg: '봉인 때문에 지나갈 수 없어요' },
    ],
    spots: [
      { id: 'ball', kind: 'find', name: '풀숲', x: 41, y: 31, r: 22, label: '풀숲 뒤지기', lines: [['풀숲에는 아무것도 없어요.']] },
      { id: 'hiSign', kind: 'read', name: '표지판', x: 25.4, y: 4, r: 22, label: '표지판 읽기', lines: [['↑ 돌다리 고개 · 뒤집힌 동굴', '세 곳의 룬 돌이 깨어나야 봉인이 풀린대요.']] },
    ],
  },

  // ── 돌다리 고개 (Lv5~7) ────────────────────────
  pass: {
    name: '돌다리 고개', subtitle: '권장 Lv5~7', bgm: 'bgm_field', theme: 'meadow', cols: 40, rows: 38, power: 1.7,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(606);
      // 북쪽 큰 절벽과 동굴 입구
      b.high(0, 0, 39, 8).opening(19, 9, 2);
      b.path([[19, 37], [19, 30], [12, 26], [19, 22], [19, 10]], 2);
      b.river([[0, 18], [14, 19], [26, 17], [39, 18]], 3);
      b.bridge(19, 16, 20, 21);
      b.ground(19, 16, 20, 21, 'w');
      border(b, rnd, { gaps: { south: [[18, 21]] }, trees: TREES.forest, big: TREES.forestBig });
      for (const [x, y] of [[6, 12], [31, 12], [8, 30], [30, 28], [36, 34], [3, 24]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'trio_green', x, y, { solid: [16, 6], tree: true });
      for (const [x, y] of [[13, 13], [26, 25], [33, 21], [6, 34]]) b.obj(rnd() < 0.5 ? 'rock_grey_big' : 'rock_brown_big', x, y, { solid: [40, 14] });
      b.obj('cave_mouth', 20, 11, { flat: false });
      b.obj('sign', 22.6, 13.4, { solid: [10, 5] });
      scatter(b, rnd, 140, { keep: [[20, 10, 3]] });
      return b;
    },
    spawns: S([['Flam', 10, 26], ['Flam', 28, 31], ['Spirit', 8, 13], ['Spirit', 30, 13], ['Mushroom', 26, 24], ['Flam', 14, 33], ['Spirit', 33, 25], ['Mushroom', 12, 22], ['Flam', 24, 12]]),
    chests: [{ id: 'r1_pa', x: 36.5, y: 30, gold: 100, potions: 2 }],
    exits: [
      { side: 'south', from: 18, to: 21, map: 'hill', entry: 'north' },
      { x: 19, y: 9, w: 2, h: 2, map: 'cave1', entry: 'south', to_name: '뒤집힌 동굴' },
    ],
    entries: { cave: [20, 12.6] },
    spots: [{ id: 'paSign', kind: 'read', name: '표지판', x: 22.6, y: 13.8, r: 22, label: '표지판 읽기', lines: [['뒤집힌 동굴 ↑', '「나누는 수를 뒤집으면 길이 열린다」라고 적혀 있어요.']] }],
  },

  // ── 뒤집힌 동굴 1층 ───────────────────────────
  cave1: {
    name: '뒤집힌 동굴 1층', subtitle: '룬 기둥과 봉인된 문', bgm: 'bgm_dungeon', theme: 'cave', cols: 36, rows: 38, power: 1.8, cave: true, tint: 0xb8aec8,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 35, 1).wall(0, 0, 0, 37).wall(35, 0, 35, 37).wall(0, 37, 15, 37).wall(20, 37, 35, 37);
      b.wall(0, 28, 24, 29).wall(31, 28, 35, 29);   // 오른쪽 틈
      b.wall(11, 19, 35, 20);                      // 왼쪽 틈 (1~10)
      b.wall(0, 9, 15, 10).wall(20, 9, 35, 10);     // 가운데 봉인된 문 (16~19)
      b.path([[17, 37], [17, 32], [27, 30], [27, 24], [6, 22], [6, 15], [17, 13], [17, 2]], 2);
      b.circle(17.5, 5, 3, 'd');
      return b;
    },
    door: { x: 18, y: 10.8, w: 4, step: 'seal' },
    stairsDown: { x: 17.5, y: 4.5 },
    spawns: S([['Slime', 9, 33], ['Slime', 28, 34], ['Mushroom', 22, 25], ['Flam', 12, 24], ['Spirit', 30, 23], ['Spirit', 6, 16], ['Flam', 28, 15], ['Mushroom', 22, 16]]),
    chests: [{ id: 'r1_c1', x: 33, y: 35, gold: 120, potions: 2 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'pass', entry: 'cave' },
      { x: 16.5, y: 3.5, w: 2, h: 2, map: 'cave2', entry: 'south', to_name: '동굴 2층', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
    ],
    entries: { down: [17.5, 7] },
    spots: [
      { id: 'caveA', kind: 'rune', name: '왼쪽 룬 기둥', x: 12, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 「÷」 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'caveB', kind: 'rune', name: '오른쪽 룬 기둥', x: 24, y: 13.6, r: 26, label: '룬 깨우기', pillar: true,
        runeLine: '기둥에 「×」 모양 룬이 새겨져 있어요.', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    ],
  },

  // ── 뒤집힌 동굴 2층 (인버트롤의 방) ───────────────
  cave2: {
    name: '뒤집힌 동굴 2층', subtitle: '인버트롤의 방', bgm: 'bgm_dungeon', theme: 'cave', cols: 32, rows: 32, power: 1.8, cave: true, tint: 0xa898b8,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      b.wall(0, 0, 31, 1).wall(0, 0, 0, 31).wall(31, 0, 31, 31).wall(0, 31, 13, 31).wall(18, 31, 31, 31);
      b.wall(1, 2, 5, 6).wall(26, 2, 30, 6).wall(1, 24, 6, 30).wall(25, 24, 30, 30);
      b.circle(15.5, 13, 9, 'd');
      b.path([[15, 31], [15, 20]], 2);
      return b;
    },
    boss: { x: 15.5, y: 10, step: 'troll', roomY: 21 },
    exits: [{ side: 'south', from: 14, to: 17, map: 'cave1', entry: 'down', to_name: '동굴 1층' }],
    spots: [],
  },
};

export const START_MAP = 'village';
