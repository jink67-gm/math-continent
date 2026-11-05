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
  // 위쪽 언덕(촌장 집·룬의 집) · 가운데 광장 · 서쪽 시내와 다리 · 동남쪽 분수 밭. 가장자리는 절벽 숲.
  village: {
    name: '프락시아 마을', subtitle: '나눔의 계곡', bgm: 'bgm_town', theme: 'meadow', cols: 44, rows: 34, safe: true,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(101);
      b.river([[4, 0], [4, 33]], 2);
      b.block(0, 0, 3, 20).block(0, 27, 3, 33);
      b.path([[0, 24], [3, 24]], 2).bridge(4, 24, 5, 25);
      // 위쪽 언덕과 북쪽 길
      b.high(9, 0, 31, 11);
      b.block(6, 0, 8, 11).block(30, 0, 43, 9).block(9, 0, 18, 1).block(23, 0, 29, 1);
      b.stairs(20, 12, 2).stairs(28, 12, 1);
      b.path([[20, 0], [20, 11]], 2).path([[11, 11], [28, 11]], 1);
      // 아래 마을
      b.block(38, 12, 43, 14).block(24, 24, 29, 27).block(34, 29, 43, 33).block(22, 31, 33, 33);
      b.circle(21, 18.5, 4.2, 'd');
      b.path([[20, 12], [20, 17]], 2);
      b.path([[24, 18], [43, 18]], 2);
      b.path([[20, 20], [20, 33]], 2);
      b.path([[17, 20], [10, 24], [0, 24]], 2);
      b.path([[30, 20], [30, 22]], 2);
      b.circle(14, 17, 1.6, 'w');
      // 건물
      b.obj('house_big', 14, 10.6, { solid: 'building', label: '촌장의 집' });
      b.obj('house_round', 25.5, 10.6, { solid: 'building', label: '룬의 집' });
      b.obj('house_tavern', 35, 16.6, { solid: 'building', label: '여관' });
      b.obj('house_shop', 11.5, 22.6, { solid: 'building', label: '루루 상점' });
      b.obj('house_red', 15.5, 29.6, { solid: 'building' });
      b.obj('house_orange', 10.5, 31.6, { solid: 'building', label: '대장간' });
      b.obj('kiln', 7.4, 31.6, { solid: 'building' });
      // 소품
      b.obj('barrel', 16.4, 22.6, { solid: [12, 8] }).obj('cart', 18.6, 29.6, { solid: [26, 10] }).obj('laundry', 30.4, 16.6, {});
      b.obj('jar', 38.6, 16.6, { solid: [10, 6] }).obj('barrel', 29.4, 10.6, { solid: [12, 8] }).obj('scarecrow', 41, 27, { solid: [8, 6] });
      b.obj('sign', 23.4, 30.6, { solid: [10, 5] }).obj('sign', 23.4, 14.8, { solid: [10, 5] });
      for (const x of [33.5, 36.5, 39.5]) b.obj('fence', x, 21.4, { solid: [48, 6] });
      for (const [x, y] of [[11, 3], [27, 4], [17, 6]]) b.obj('tree_green', x, y, { solid: [12, 6], tree: true });
      b.roughen(rnd);

      scatter(b, rnd, 110, { keep: [[14, 17, 3], [36, 24, 5], [21, 18.5, 5]] });
      return b;
    },
    plots: [{ x: 32.5, y: 22.4, label: '1/2 밭', planted: 4 }, { x: 37, y: 22.4, label: '1/4 밭', planted: 2 }, { x: 32.5, y: 25.6, label: '1/8 밭', planted: 1 }],
    exits: [
      { side: 'north', from: 19, to: 22, map: 'hill', entry: 'south' },
      { side: 'east', from: 17, to: 20, map: 'east_field', entry: 'west' },
      { side: 'south', from: 19, to: 22, map: 'stream', entry: 'north' },
      { side: 'west', from: 23, to: 26, map: 'forest', entry: 'east' },
    ],
    entries: { plaza: [21, 21.5] },
    npcs: [
      { id: 'chief', sprite: 'OldMan', name: '풍차 촌장 모모', x: 17.6, y: 11.6, lines: [['프락시아에 온 걸 환영하네. 바람이 참 좋지?']] },
      { id: 'runeMaster', sprite: 'OldMan3', name: '룬 할아버지', x: 27.4, y: 11.6, lines: [['기술은 힘만으로 배우는 게 아니란다.', '수학의 룬을 깨워야 하지.']] },
      { id: 'merchant', sprite: 'Villager4', name: '상인 루루', x: 13.8, y: 23.4, role: 'shop', lines: [['어서 오세요! 좋은 물건 많아요~']] },
      { id: 'smith', sprite: 'Shaman', name: '대장장이 쿵쿵', x: 13.6, y: 32.2, role: 'forge', lines: [['쾅! 쾅! 장비를 강화하려면 수학 실력이 필요하지!']] },
      { id: 'innkeeper', sprite: 'OldWoman', name: '여관 주인 포근', x: 37.4, y: 17.4, lines: [['먼 길 오느라 고생했지요?', '광장 옆 샘물을 마시면 기운이 난답니다.']] },
      { id: 'child', sprite: 'Child', name: '꼬마 콩이', x: 24, y: 21, wander: 20, lines: [['밭에 심은 칸 수를 세어 봤어?', '8칸 중에 4칸이면 1/2, 2칸이면 1/4이래!']] },
      { id: 'guard', sprite: 'Knight', name: '경비병 단단', x: 23, y: 16, lines: [['언덕 위에는 촌장님 댁이 있소.', '마을 밖은 위험하니 회복약을 꼭 챙기시오.']] },
      { id: 'pipi', sprite: 'Spirit', name: '안내 정령 피피', x: 18.4, y: 27.6, float: true,
        lines: [['모험가님, 프락시아 마을에 온 걸 환영해요!', '머리 위에 「!」가 뜬 사람에게 말을 걸면 부탁(퀘스트)을 받을 수 있어요.'], ['마을 밖은 동쪽·남쪽·서쪽·북쪽으로 이어져 있어요.', '지도 오른쪽 위 작은 지도와 노란 화살표를 따라가 보세요!']] },
    ],
    spots: [
      { id: 'spring', kind: 'heal', name: '치유의 샘', x: 14, y: 19.2, r: 30, label: '샘물 마시기', lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
      { id: 'board', kind: 'difficulty', name: '모험 게시판', x: 23.4, y: 31, r: 24, label: '난이도 바꾸기' },
      { id: 'mapSign', kind: 'read', name: '마을 안내판', x: 23.4, y: 15.2, r: 22, label: '안내판 읽기',
        lines: [['↑ 바람의 언덕 (권장 Lv4~6)', '→ 바람개비 들판 (Lv1~3)', '↓ 졸졸 시냇가 (Lv2~4)', '← 나무꾼 숲 (Lv3~5)']] },
    ],
  },

  // ── 바람개비 들판 (Lv1~3) ──────────────────────
  // 서쪽 입구에서 동쪽 출구로 이어지는 골짜기. 북쪽·남쪽으로 작은 풀밭이 숨어 있고, 동북쪽 언덕 위에 룬 돌.
  east_field: {
    name: '바람개비 들판', subtitle: '권장 Lv1~3', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 1,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(202);
      b.block(0, 0, 43, 3).block(0, 4, 9, 15).block(0, 21, 8, 33);
      b.block(15, 6, 24, 13).block(17, 23, 27, 33);
      b.block(41, 4, 43, 16).block(41, 23, 43, 33);
      b.high(29, 5, 40, 12).stairs(33, 13, 2);
      b.path([[0, 18], [14, 18], [28, 19], [43, 19]], 2);
      b.path([[30, 19], [33, 15]], 2);
      b.path([[33, 12], [34, 8]], 2).circle(34.5, 8, 2, 'd');
      b.circle(12, 27, 2, 'w').circle(34, 28, 2.4, 'w');
      for (const [x, y] of [[11, 8], [27, 9], [13, 31], [38, 32], [31, 23]]) b.obj('tree_big', x, y, { solid: [16, 6], tree: true });
      for (const [x, y] of [[26, 15], [14, 22]]) b.obj('rock_grey', x, y, { solid: [24, 10] });
      b.obj('sign', 3.6, 20.4, { solid: [10, 5] });
      b.roughen(rnd);

      scatter(b, rnd, 150, { keep: [[34.5, 8, 3], [39, 6, 2]] });
      return b;
    },
    spawns: S([['Slime', 12, 11], ['Slime', 26, 11], ['Slime', 21, 20], ['Slime', 12, 23], ['Slime', 31, 26], ['Slime', 37, 30], ['Butterfly', 14, 30], ['Butterfly', 36, 22], ['Butterfly', 33, 6]]),
    chests: [{ id: 'r1_ef', x: 39, y: 6.4, gold: 40, potions: 1 }],
    exits: [
      { side: 'west', from: 18, to: 20, map: 'village', entry: 'east' },
      { side: 'east', from: 17, to: 22, scene: 'Town', region: 'cubeCity', entry: 'west', to_name: '쌓기나무 성채 큐베른', requires: 'report', lockedMsg: '프락시아의 결정을 먼저 되찾아요' },
    ],
    spots: [
      { id: 'runeA', kind: 'rune', name: '바람의 룬 돌', x: 34.5, y: 8, r: 24, label: '룬 돌 살펴보기', stone: true,
        runeLine: '바람개비 들판의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!', sleepLines: ['오래된 룬 돌이에요.', '촌장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'efSign', kind: 'read', name: '표지판', x: 3.6, y: 20.4, r: 22, label: '표지판 읽기', lines: [['바람개비 들판 · 권장 Lv1~3', '← 프락시아 마을 · → 큐베른 가는 길']] },
    ],
  },

  // ── 졸졸 시냇가 (Lv2~4) ────────────────────────
  // 북쪽 좁은 골목 → 시냇물과 다리 → 남서쪽 버섯 골짜기 / 남동쪽 언덕 위 룬 돌
  stream: {
    name: '졸졸 시냇가', subtitle: '권장 Lv2~4', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 1.2,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(303);
      b.block(0, 0, 17, 5).block(24, 0, 43, 5).block(0, 6, 3, 33).block(40, 6, 43, 33);
      b.path([[20, 0], [20, 12]], 2);
      b.river([[4, 13], [14, 14], [26, 12], [39, 13]], 3);
      b.ground(20, 12, 21, 15, 'w').bridge(20, 12, 21, 15);
      b.block(12, 24, 22, 33);
      b.high(28, 19, 39, 26).stairs(31, 27, 2);
      b.path([[20, 16], [20, 19], [8, 21], [7, 31]], 2);
      b.path([[21, 19], [25, 22], [25, 30], [31, 30]], 2);
      b.path([[32, 26], [34, 22]], 2).circle(34.5, 22, 2, 'd');
      for (const [x, y] of [[8, 9], [14, 10], [30, 9], [36, 10], [24, 33], [38, 33]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_round', x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[10, 25], [26, 17]]) b.obj('rock_brown', x, y, { solid: [24, 10] });
      b.obj('sign', 22.6, 4.6, { solid: [10, 5] });
      b.roughen(rnd);

      scatter(b, rnd, 150, { keep: [[34.5, 22, 3], [6, 31, 2]] });
      return b;
    },
    spawns: S([['Mushroom', 7, 23], ['Mushroom', 9, 28], ['Mushroom', 25, 26], ['Mushroom', 30, 31], ['Mushroom', 36, 31], ['Slime', 10, 9], ['Slime', 32, 9], ['Butterfly', 15, 19], ['Butterfly', 37, 9]]),
    chests: [{ id: 'r1_st', x: 5.5, y: 31.6, gold: 50, potions: 1 }],
    exits: [{ side: 'north', from: 19, to: 22, map: 'village', entry: 'south' }],
    spots: [
      { id: 'runeB', kind: 'rune', name: '물결의 룬 돌', x: 34.5, y: 22.2, r: 24, label: '룬 돌 살펴보기', stone: true,
        runeLine: '시냇가 언덕의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!', sleepLines: ['오래된 룬 돌이에요.', '촌장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'stSign', kind: 'read', name: '표지판', x: 22.6, y: 5, r: 22, label: '표지판 읽기', lines: [['졸졸 시냇가 · 권장 Lv2~4', '버섯이 많이 사는 곳이에요. ↑ 프락시아 마을']] },
    ],
  },

  // ── 나무꾼 숲 (Lv3~5) ──────────────────────────
  // 빽빽한 숲 사이로 난 길: 동쪽 입구 → 가운데 갈림길 → 북쪽 언덕길 / 서쪽 숲길(룬 돌) / 남서쪽 깊은 숲
  forest: {
    name: '나무꾼 숲', subtitle: '권장 Lv3~5', bgm: 'bgm_field', theme: 'forest', cols: 44, rows: 34, power: 1.35,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(404);
      b.block(0, 0, 31, 2).block(36, 0, 43, 2).block(0, 3, 2, 33);
      b.block(38, 3, 43, 21).block(38, 28, 43, 33);
      b.high(3, 3, 14, 10).stairs(8, 11, 2).block(15, 3, 18, 10);
      b.block(20, 5, 30, 11).block(10, 18, 22, 23).block(26, 27, 37, 33);
      b.path([[43, 24], [26, 24], [26, 16]], 2);
      b.path([[33, 0], [33, 16], [26, 16]], 2);
      b.path([[26, 15], [9, 15], [9, 13]], 2);
      b.path([[9, 10], [9, 7]], 2).circle(9.5, 6.5, 2, 'd');
      b.path([[5, 16], [5, 30], [20, 30]], 2);
      for (const [x, y] of [[29, 19], [34, 9], [13, 28], [24, 31], [5, 22]]) b.obj(TREES.forest[Math.floor(rnd() * 4)], x, y, { solid: [12, 6], tree: true });
      b.obj('stump', 30, 21, { solid: [24, 8] }).obj('sign', 40.6, 23, { solid: [10, 5] });
      b.roughen(rnd);

      scatter(b, rnd, 140, { keep: [[9.5, 6.5, 3], [5, 31, 2]], kinds: [['grass_a'], ['grass_b'], ['bush_a', [10, 5]], ['bush_c', [10, 5]], ['flower_b']] });
      return b;
    },
    spawns: S([['Spirit', 34, 7], ['Spirit', 29, 21], ['Spirit', 6, 22], ['Spirit', 16, 29], ['Mushroom', 23, 15], ['Mushroom', 14, 15], ['Mushroom', 32, 19], ['Butterfly', 35, 13], ['Butterfly', 20, 27]]),
    chests: [{ id: 'r1_fo', x: 4.5, y: 32, gold: 70, potions: 2 }],
    exits: [
      { side: 'east', from: 24, to: 27, map: 'village', entry: 'west' },
      { side: 'north', from: 32, to: 35, map: 'hill', entry: 'west' },
    ],
    spots: [
      { id: 'runeC', kind: 'rune', name: '나무의 룬 돌', x: 9.5, y: 6.6, r: 24, label: '룬 돌 살펴보기', stone: true,
        runeLine: '숲 언덕의 룬 돌이에요. 문제를 풀면 룬이 깨어나요!', sleepLines: ['오래된 룬 돌이에요.', '촌장님께 이야기를 들으면 깨울 수 있을 것 같아요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
      { id: 'foSign', kind: 'read', name: '표지판', x: 40.6, y: 23.4, r: 22, label: '표지판 읽기', lines: [['나무꾼 숲 · 권장 Lv3~5', '→ 프락시아 마을 · ↑ 바람의 언덕']] },
    ],
  },

  // ── 바람의 언덕 (Lv4~6) ────────────────────────
  // 아래 풀밭 → 계단 하나로만 오르는 큰 언덕 → 북쪽 고개(봉인). 동쪽 좁은 틈 너머에 숨은 풀숲.
  hill: {
    name: '바람의 언덕', subtitle: '권장 Lv4~6', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 34, power: 1.5,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(505);
      b.block(0, 0, 19, 2).block(24, 0, 43, 2).block(0, 3, 7, 15).block(36, 3, 43, 15);
      b.high(8, 3, 35, 15).high(20, 0, 23, 2).stairs(20, 16, 2);
      b.block(12, 6, 16, 9).block(27, 5, 32, 8);
      b.block(0, 18, 6, 21).block(0, 26, 9, 33);
      b.block(30, 18, 35, 22).block(36, 18, 43, 20).block(30, 27, 43, 33);
      b.block(10, 28, 18, 33).block(23, 28, 29, 33);
      b.path([[20, 33], [20, 18]], 2);
      b.path([[0, 23], [19, 24]], 2);
      b.path([[20, 15], [20, 0]], 2).path([[22, 11], [33, 11]], 1);
      b.path([[22, 25], [37, 25]], 2);
      b.circle(14, 23, 2, 'w');
      for (const [x, y] of [[10, 13], [24, 14], [33, 14], [27, 21], [8, 24]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'tree_pine', x, y, { solid: [14, 6], tree: true });
      for (const [x, y] of [[18, 7], [25, 19], [34, 4]]) b.obj('rock_grey', x, y, { solid: [24, 10] });
      b.obj('sign', 23.6, 4.6, { solid: [10, 5] });
      b.roughen(rnd);

      scatter(b, rnd, 140, { keep: [[21.5, 3, 3], [41, 24, 2]] });
      return b;
    },
    barrier: { x: 21.5, y: 1.4, w: 4, step: 'runes' },
    spawns: S([['Spirit', 12, 12], ['Spirit', 30, 12], ['Flam', 24, 6], ['Flam', 10, 5], ['Flam', 12, 20], ['Flam', 26, 23], ['Butterfly', 8, 23], ['Slime', 33, 26], ['Spirit', 40, 24]]),
    chests: [{ id: 'r1_hi', x: 34.5, y: 4.6, gold: 80, potions: 1, armor: 'leather' }],
    exits: [
      { side: 'south', from: 19, to: 22, map: 'village', entry: 'north' },
      { side: 'west', from: 22, to: 25, map: 'forest', entry: 'north' },
      { side: 'north', from: 20, to: 23, map: 'pass', entry: 'south', requires: 'runes', lockedMsg: '봉인 때문에 지나갈 수 없어요' },
    ],
    spots: [
      { id: 'ball', kind: 'find', name: '풀숲', x: 41.5, y: 24.6, r: 22, label: '풀숲 뒤지기', lines: [['풀숲에는 아무것도 없어요.']] },
      { id: 'hiSign', kind: 'read', name: '표지판', x: 23.6, y: 5, r: 22, label: '표지판 읽기', lines: [['↑ 돌다리 고개 · 뒤집힌 동굴', '세 곳의 룬 돌이 깨어나야 봉인이 풀린대요.']] },
    ],
  },

  // ── 돌다리 고개 (Lv5~7) ────────────────────────
  // 남쪽 좁은 길 → 바위 사이 풀밭 → 돌다리 → 북쪽 큰 절벽의 동굴 입구
  pass: {
    name: '돌다리 고개', subtitle: '권장 Lv5~7', bgm: 'bgm_field', theme: 'meadow', cols: 44, rows: 38, power: 1.7,
    build() {
      const b = new MapBuilder(this.cols, this.rows);
      const rnd = seeded(606);
      b.block(0, 0, 43, 8).opening(20, 9, 2);
      b.block(0, 11, 6, 37).block(37, 11, 43, 37);
      b.river([[7, 19], [18, 20], [28, 18], [36, 19]], 3);
      b.ground(20, 18, 21, 22, 'w').bridge(20, 18, 21, 22);
      b.block(9, 12, 14, 15).block(26, 11, 32, 13).block(9, 25, 17, 29).block(26, 24, 34, 28);
      b.block(7, 33, 17, 37).block(24, 33, 36, 37);
      b.path([[20, 37], [20, 11]], 2);
      for (const [x, y] of [[33, 17], [9, 23], [30, 31], [12, 32]]) b.obj(rnd() < 0.5 ? 'tree_big' : 'trio_green', x, y, { solid: [16, 6], tree: true });
      for (const [x, y] of [[16, 16], [24, 30]]) b.obj('rock_grey_big', x, y, { solid: [40, 14] });
      b.obj('cave_mouth', 21, 11, {});
      b.obj('sign', 23.4, 13.4, { solid: [10, 5] });
      b.roughen(rnd);

      scatter(b, rnd, 120, { keep: [[21, 11, 3]] });
      return b;
    },
    spawns: S([['Flam', 11, 22], ['Flam', 31, 22], ['Flam', 21, 31], ['Spirit', 24, 13], ['Spirit', 34, 16], ['Spirit', 8, 31], ['Mushroom', 23, 26], ['Mushroom', 24, 23], ['Flam', 35, 31]]),
    chests: [{ id: 'r1_pa', x: 35.5, y: 23.4, gold: 100, potions: 2 }],
    exits: [
      { side: 'south', from: 18, to: 23, map: 'hill', entry: 'north' },
      { x: 20, y: 9, w: 2, h: 2, map: 'cave1', entry: 'south', to_name: '뒤집힌 동굴' },
    ],
    entries: { cave: [21, 12.6] },
    spots: [{ id: 'paSign', kind: 'read', name: '표지판', x: 23.4, y: 13.8, r: 22, label: '표지판 읽기', lines: [['뒤집힌 동굴 ↑', '「나누는 수를 뒤집으면 길이 열린다」라고 적혀 있어요.']] }],
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
      b.wall(8, 32, 10, 34).wall(12, 24, 14, 26).wall(30, 12, 32, 15).wall(1, 2, 4, 6).wall(31, 2, 34, 6);
      b.path([[17, 37], [17, 32], [27, 30], [27, 24], [6, 22], [6, 15], [17, 13], [17, 2]], 2);
      b.circle(17.5, 5, 3, 'd');
      return b;
    },
    door: { x: 18, y: 10.8, w: 4, step: 'seal' },
    stairsDown: { x: 17.5, y: 4.5 },
    spawns: S([['Slime', 12, 34], ['Slime', 28, 34], ['Mushroom', 22, 25], ['Flam', 16, 25], ['Spirit', 30, 23], ['Spirit', 6, 16], ['Flam', 28, 15], ['Mushroom', 22, 16]]),
    chests: [{ id: 'r1_c1', x: 33, y: 35, gold: 120, potions: 2 }],
    exits: [
      { side: 'south', from: 16, to: 19, map: 'pass', entry: 'cave' },
      { x: 16, y: 3, w: 3, h: 2, map: 'cave2', entry: 'south', to_name: '동굴 2층', requires: 'seal', lockedMsg: '봉인된 문을 먼저 열어요' },
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
