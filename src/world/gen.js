// 2~6번 마을과 혼돈의 첨탑 지도를 설정(data/regions.js)으로 만들어요.
// 마을 · 들판 · 던전이 모두 같은 뼈대를 쓰고, 땅 색·나무·몬스터·보스만 달라요.
// 모든 위치는 16px 칸 단위로 적고 C()로 픽셀로 바꿔요.

import { TerrainGrid, T, seeded } from './terrain.js';
import { REGIONS, REGION_ORDER, SPIRE } from '../data/regions.js';

const C = (n) => n * T;

// ── 마을 ──────────────────────────────────────────
export const TOWN = { cols: 44, rows: 32, mid: 21, road: 16 };

export function makeTown(id) {
  const r = REGIONS[id];
  const { cols, rows, mid, road } = TOWN;
  const g = new TerrainGrid(cols, rows);
  g.rect(mid, 0, mid + 1, rows - 4, 'd');          // 북쪽 관문으로 가는 큰길
  g.rect(0, road, cols - 1, road + 1, 'd');         // 서쪽·동쪽 큰길
  g.circle(mid + 1, road + 2.5, 4.4, 'd');          // 광장
  for (const x of [8, 15, 29, 36]) g.rect(x, road + 2, x + 1, 25, 'd');
  const water = r.theme !== 'snow' && r.theme !== 'sand';
  if (water) g.circle(30.5, 21.5, 1.8, 'w');        // 치유의 샘
  const spring = water ? { x: C(30.5), y: C(24) } : { x: C(30.5), y: C(22.5) };

  const B = (k, x, y, label) => ({ k, x: C(x), y: C(y), solid: 'building', label });
  const buildings = [
    B('house_big', 15.5, road, '대장의 집'), B('house_round', 29.5, road), B('house_timber', 8, road), B('house_tavern', 37, road, '여관'),
    B('house_red', 8.5, 26), B('house_shop', 15.5, 26, '상점'), B('house_orange', 29.5, 26), B('house_beige', 36.5, 26),
  ];
  const P = (k, x, y, solid = null) => ({ k, x: C(x), y: C(y), solid });
  const props = [
    P('kiln', 5.5, 26, 'building'), P('barrel', 12.5, 26, [12, 8]), P('cart', 18.6, 26, [26, 10]),
    P('sign', mid + 3.4, 29.6, [10, 5]), P('barrel', 26.6, road, [12, 8]), P('jar', 40.6, road + 1, [10, 6]),
  ];
  const npcs = [
    { id: 'chief', sprite: r.chief.sprite, name: r.chief.name, x: C(17.6), y: C(road + 0.4), lines: [[r.story]] },
    { id: 'runeMaster', sprite: 'OldMan3', name: '떠돌이 룬 학자', x: C(32), y: C(road + 0.4), lines: [['룬은 어디에서나 같은 힘을 가진단다.']] },
    { id: 'merchant', sprite: 'Villager4', name: '여행 상인 루루', x: C(17.6), y: C(26.4), role: 'shop', lines: [['또 만났네요! 좋은 물건 많아요~']] },
    { id: 'smith', sprite: 'Shaman', name: '떠돌이 대장장이 쿵', x: C(10.5), y: C(26.6), role: 'forge', lines: [['쾅! 형님 쿵쿵이 안부 전하래!']] },
    { id: 'innkeeper', sprite: 'Woman', name: '여관 주인', x: C(39.4), y: C(road + 0.4), lines: [['푹 쉬어 가세요.', '샘물을 마시면 기운이 나요.']] },
    { id: 'scholar', sprite: 'Villager2', name: '마을 학자', x: C(33), y: C(22), lines: [r.hint] },
    { id: 'kid', sprite: 'Child', name: '꼬마', x: C(19.5), y: C(21.5), wander: 24, lines: [['우리 마을 결정을 찾아 줘!']] },
    { id: 'guide', sprite: 'Spirit', name: '안내 정령 피피', x: C(mid - 1.4), y: C(28.5), float: true,
      lines: [[`${r.name}에 온 걸 환영해요!`, '먼저 대장님께 인사드려 볼까요? 광장 왼쪽 위 큰 집 앞에 계세요.']] },
  ];
  const spots = [
    { id: 'spring', kind: 'heal', name: '치유의 샘', x: spring.x, y: spring.y, r: 32, label: '샘물 마시기', lines: [['맑은 샘물을 마셨어요.', 'HP와 SP가 모두 회복됐어요!']] },
    { id: 'board', kind: 'difficulty', name: '모험 게시판', x: C(mid + 3.4), y: C(30), r: 24, label: '난이도 바꾸기' },
    { id: 'gate', kind: 'rune', name: r.gate, x: C(mid + 1), y: C(6.4), r: 26, label: '룬 살펴보기',
      runeLine: `${r.gate}이 빛나요. 문제를 풀면 길이 열려요!`,
      sleepLines: ['길이 보라색 봉인으로 막혀 있어요.', '대장님께 먼저 이야기를 들어 봐요.'], litLines: ['룬이 환하게 빛나요. 길이 열려 있어요.'] },
  ];
  const i = REGION_ORDER.indexOf(id);
  // 큐베른·데시마르는 여러 지도 구조(data/r2maps.js · r3maps.js)라서, 프로포르의 서쪽 길은 데시마르 등대 방파제로 이어져요
  const prev = i <= 2 ? { scene: 'Map', map: 'dh_pier', entry: 'east', to: '등대 방파제' } : { scene: 'Town', region: REGION_ORDER[i - 1], entry: 'east', to: REGIONS[REGION_ORDER[i - 1]].name };
  const next = i < REGION_ORDER.length - 1
    ? { scene: 'Town', region: REGION_ORDER[i + 1], entry: 'west', to: REGIONS[REGION_ORDER[i + 1]].name }
    : { scene: 'Dungeon', region: 'chaosSpire', entry: 'south', to: SPIRE.name };
  const exits = [
    { id: 'north', x: C(mid - 1), y: 0, w: C(4), h: 6, to: r.wildName, scene: 'Wild', region: id, entry: 'south', requires: 'gate', lockedMsg: '길이 봉인되어 있어요' },
    { id: 'west', x: 0, y: C(road - 1), w: 16, h: C(4), ...prev },
    { id: 'east', x: C(cols) - 16, y: C(road - 1), w: 16, h: C(4), ...next, requires: 'report', lockedMsg: '이 마을의 결정을 먼저 되찾아요' },
  ];
  // 나무: 테두리 숲(길 자리는 비움) + 덤불·꽃
  const rnd = seeded(1000 + r.n);
  const nature = [];
  const tree = (x, y) => nature.push({ k: r.trees[Math.floor(rnd() * r.trees.length)], x, y, solid: [12, 6] });
  for (let x = 0.5; x < cols; x += 1.6 + rnd() * 0.6) {
    if (Math.abs(x - (mid + 1)) > 2.6) tree(C(x), C(2.4));
    tree(C(x), C(rows) - 1);
  }
  for (let y = 4; y < rows - 1; y += 1.5 + rnd() * 0.5) {
    if (Math.abs(y - (road + 1.5)) > 2.2) { tree(C(0.8), C(y)); tree(C(cols - 0.8), C(y)); }
  }
  const keep = [...buildings.map((b) => [b.x / T, b.y / T - 1.5, 3.5]), [30.5, 22, 3], [mid + 1, 6, 3], [mid + 3.4, 29.6, 2]];
  const deco = [['bush_a', [10, 5]], ['flower_a'], ['flower_b'], ['grass_a'], ['grass_b']];
  for (let k = 0; k < 140; k++) {
    const cx = 2 + Math.floor(rnd() * (cols - 4));
    const cy = 4 + Math.floor(rnd() * (rows - 6));
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (g.get(cx + dx, cy + dy) !== 'g') { ok = false; break; }
    if (!ok || keep.some(([x, y, rr]) => (x - cx) ** 2 + (y - cy) ** 2 < rr * rr)) continue;
    const [kk, solid] = deco[Math.floor(rnd() * deco.length)];
    nature.push({ k: kk, x: C(cx + 0.5), y: C(cy + 1), solid: solid || null, flat: !solid });
  }
  return {
    grid: g, buildings, props, npcs, spots, exits, nature,
    gate: { x: C(mid + 1), y: C(4.6), w: C(4) },
    spawns: { south: { x: C(mid + 1), y: C(rows - 5) }, north: { x: C(mid + 1), y: C(7.6) }, west: { x: C(2.5), y: C(road + 1) }, east: { x: C(cols - 2.5), y: C(road + 1) } },
    goals: { chief: [17.6, road + 1.4], gate: [mid + 1, 6.8], north: [mid + 1, 0.5], east: [cols - 0.5, road + 1] },
  };
}

// ── 들판 ──────────────────────────────────────────
export const WILD = { cols: 48, rows: 44, mid: 22 };

export function makeWild(id) {
  const r = REGIONS[id];
  const { cols, rows, mid } = WILD;
  const rnd = seeded(2000 + r.n);
  const g = new TerrainGrid(cols, rows);
  const phase = r.n * 1.7;
  const roadX = (y) => (y > rows - 6 ? mid : mid + Math.round(Math.sin(y / 5 + phase) * 6));
  for (let y = 2; y < rows; y++) g.rect(roadX(y), y, roadX(y) + 1, y, 'd');
  for (let y = 3; y < rows; y++) {
    const a = roadX(y - 1);
    const b = roadX(y);
    if (a !== b) g.rect(Math.min(a, b), y, Math.max(a, b) + 1, y, 'd');
  }
  const mx = roadX(3) + 1;
  g.circle(mx, 3.5, 3, 'd');
  g.circle(mid + 1, rows - 3, 2.4, 'd');
  if (r.wildTheme === 'meadow' || r.wildTheme === 'forest') { g.circle(9, 20, 2.6, 'w'); g.circle(39, 30, 2.4, 'w'); }

  // 몬스터 12마리: 입구 쪽은 약한 순서, 안쪽은 센 순서로 섞어요
  const spots12 = [[15, 34], [31, 34], [10, 30], [35, 27], [13, 15], [30, 18], [36, 21], [17, 25], [13, 8], [31, 8], [40, 15], [7, 12]];
  const spawns = spots12.map(([x, y], i) => ({ kind: r.monsters[i % r.monsters.length], x: C(x), y: C(y) }));
  const chests = [
    { id: `${id}_w1`, x: C(3.5), y: C(40.5), gold: Math.round(40 * r.power), potions: 2 },
    { id: `${id}_w2`, x: C(44), y: C(6.5), gold: Math.round(60 * r.power), potions: 1 },
  ];
  const props = [
    { k: 'rock_grey_stack', x: C(mx - 3.5), y: C(3.2), solid: [44, 20] }, { k: 'rock_grey_stack', x: C(mx + 3.5), y: C(3.2), solid: [44, 20] },
    { k: 'sign', x: C(mx + 2.6), y: C(6.4), solid: [10, 5] },
  ];
  const nature = [];
  const tree = (x, y) => nature.push({ k: r.trees[Math.floor(rnd() * r.trees.length)], x, y, solid: [12, 6] });
  for (let x = 0.5; x < cols; x += 1.5 + rnd() * 0.6) {
    if (Math.abs(x - (mid + 1)) > 3) tree(C(x), C(rows) - 1);
    if (Math.abs(x - mx) > 6) tree(C(x), C(1.4));
  }
  for (let y = 2.5; y < rows - 1; y += 1.3 + rnd() * 0.5) { tree(C(0.7), C(y)); tree(C(cols - 0.7), C(y)); }
  const near = (cx, cy, rr) => spawns.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < rr * rr)
    || chests.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < 9) || (cx - mx) ** 2 + (cy - 4) ** 2 < 36;
  const free = (cx, cy) => {
    for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) if (g.get(Math.floor(cx) + dx, Math.floor(cy) + dy) !== 'g') return false;
    return nature.every((o) => o.flat || (o.x / T - cx) ** 2 + (o.y / T - cy) ** 2 > 5);
  };
  const boulders = r.wildTheme === 'snow' ? ['rock_grey', 'rock_grey_big', 'rock_grey_tall'] : ['rock_grey', 'rock_brown', 'rock_brown_big', 'rock_grey_tall'];
  for (let k = 0; k < 55; k++) {
    const cx = 3 + rnd() * (cols - 6);
    const cy = 6 + rnd() * (rows - 10);
    if (near(cx, cy, 4) || !free(cx, cy)) continue;
    if (rnd() < 0.4) nature.push({ k: boulders[Math.floor(rnd() * boulders.length)], x: C(cx), y: C(cy), solid: [26, 10] });
    else tree(C(cx), C(cy));
  }
  const deco = [['grass_a'], ['grass_b'], ['flower_a'], ['flower_b'], ['rock_grey_s', [10, 5]], ['bush_b', [10, 5]]];
  for (let k = 0; k < 180; k++) {
    const cx = 2 + Math.floor(rnd() * (cols - 4));
    const cy = 4 + Math.floor(rnd() * (rows - 6));
    const [kk, solid] = deco[Math.floor(rnd() * deco.length)];
    if (g.get(cx, cy) !== 'g' || g.get(cx, cy - 1) !== 'g') continue;
    if (solid && (near(cx, cy, 2.5) || !free(cx + 0.5, cy + 0.5))) continue;
    nature.push({ k: kk, x: C(cx + 0.5), y: C(cy + 1), solid: solid || null, flat: !solid });
  }
  return {
    grid: g, props, nature, spawns, chests, mouth: { x: C(mx), y: C(2.2) },
    spots: [
      { id: 'wsign1', kind: 'read', name: '표지판', x: C(mx + 2.6), y: C(6.8), r: 22, label: '표지판 읽기', lines: [[`↑ ${r.dungeonName}`, '봉인된 문 너머에 결정이 있대요.']] },
    ],
    exits: [
      { id: 'south', x: C(mid - 1), y: C(rows) - 6, w: C(4), h: 6, to: r.name, scene: 'Town', region: id, entry: 'north' },
      { id: 'dungeon', x: C(mx - 1), y: C(1.2), w: C(2), h: C(1.2), to: r.dungeonName, scene: 'Dungeon', region: id, entry: 'south' },
    ],
    spawns2: { south: { x: C(mid + 1), y: C(rows - 3) }, north: { x: C(mx), y: C(4.8) } },
    goals: { mouth: [mx, 1.5], south: [mid + 1, rows - 0.5] },
  };
}

// ── 던전 (뒤집힌 동굴과 같은 뼈대, 짝수 마을은 좌우를 뒤집어요) ──
export const DUNGEON = { cols: 40, rows: 50 };

export function makeDungeon(id) {
  const r = id === 'chaosSpire' ? SPIRE : REGIONS[id];
  const { cols, rows } = DUNGEON;
  const flip = (r.n || 7) % 2 === 0;
  const fx = (x) => (flip ? cols - 1 - x : x);
  const g = new TerrainGrid(cols, rows);
  const path = [[20, 48], [20, 42], [29, 40], [29, 34], [10, 32], [10, 26], [20, 24], [20, 18], [20, 6]].map(([x, y]) => [fx(x), y]);
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
  g.circle(20, 9.5, 7.5, 'd');
  g.circle(20, 46, 3, 'd');
  const wallsRaw = [
    { y: 38, x0: 0, x1: 25 }, { y: 38, x0: 33, x1: 39 },
    { y: 29, x0: 0, x1: 6 }, { y: 29, x0: 14, x1: 39 },
    { y: 19, x0: 0, x1: 17 }, { y: 19, x0: 23, x1: 39 },
  ];
  const walls = wallsRaw.map((w) => (flip ? { y: w.y, x0: cols - 1 - w.x1, x1: cols - 1 - w.x0 } : w));
  const p = 1.25 * r.power;
  const spots9 = [[12, 43], [30, 44], [24, 34], [14, 33], [32, 31], [8, 24], [30, 22], [22, 26], [4, 21]];
  const kinds = r.dungeonMonsters || r.monsters;
  const spawns = spots9.map(([x, y], i) => ({ kind: kinds[i % kinds.length], x: C(fx(x)), y: C(y) }));
  const runeName = r.unit === 'mixed' ? '혼돈의 룬 기둥' : '룬 기둥';
  const [ra, rb] = id === 'chaosSpire' ? ['sA', 'sB'] : ['dA', 'dB'];
  const spots = [
    { id: ra, kind: 'rune', name: `왼쪽 ${runeName}`, x: C(12), y: C(22.4), r: 26, label: '룬 깨우기', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    { id: rb, kind: 'rune', name: `오른쪽 ${runeName}`, x: C(28), y: C(22.4), r: 26, label: '룬 깨우기', sleepLines: ['오래된 룬 기둥이에요. 아직은 반응이 없어요.'], litLines: ['룬이 금빛으로 빛나고 있어요.'] },
    { id: 'door', kind: 'read', name: '봉인된 문', x: C(20.5), y: C(21), r: 26, label: '문 살펴보기', lines: [['커다란 바위 문에 봉인이 걸려 있어요.', '양옆의 룬 기둥 두 개를 깨우면 열릴 것 같아요.']] },
  ];
  const chests = [
    { id: `${r.id || id}_d1`, x: C(fx(36)), y: C(45.5), gold: Math.round(70 * r.power), potions: 2 },
    { id: `${r.id || id}_d2`, x: C(fx(3.5)), y: C(34), gold: Math.round(90 * r.power), potions: 2 },
  ];
  const back = id === 'chaosSpire'
    ? { scene: 'Town', region: 'solidPeaks', entry: 'east', to: REGIONS.solidPeaks.name }
    : { scene: 'Wild', region: id, entry: 'north', to: r.wildName };
  return {
    grid: g, walls, spawns, spots, chests, power: p,
    door: { x: C(20.5), y: C(19.6), w: C(5) }, boss: { x: C(20), y: C(9) }, bossRoomY: C(17.5),
    exits: [{ id: 'south', x: C(18), y: C(rows) - 6, w: C(5), h: 6, ...back }],
    spawn: { x: C(20), y: C(47) },
    goals: { runes: [20, 23], boss: [20, 12], south: [20, 49.5] },
  };
}

// 던전 장식: 빛나는 수정과 작은 돌 (벽·몬스터·룬·상자 자리는 피해요)
export function dungeonDeco(M, seed) {
  const rnd = seeded(seed);
  const out = [];
  const crystals = ['crystal_a', 'crystal_b', 'crystal_c', 'crystal_d', 'ore_a', 'ore_b', 'rock_grey_s', 'rock_brown_s'];
  const near = (list, cx, cy, rr) => list.some((s) => (s.x / T - cx) ** 2 + (s.y / T - cy) ** 2 < rr);
  for (let i = 0; i < 90; i++) {
    const cx = 1 + Math.floor(rnd() * (M.COLS - 2));
    const cy = 2 + Math.floor(rnd() * (M.ROWS - 3));
    if (M.grid.get(cx, cy) !== 'g') continue;
    if (M.WALLS.some((w) => Math.abs(w.y - cy) < 2)) continue;
    if (near(M.SPAWNS, cx, cy, 6) || near(M.SPOTS, cx, cy, 9) || near(M.CHESTS, cx, cy, 6)) continue;
    if ((cx - 20) ** 2 + (cy - 9.5) ** 2 < 70) continue;
    const k = crystals[Math.floor(rnd() * crystals.length)];
    out.push({ k, x: C(cx + 0.5), y: C(cy + 1), solid: [10, 5], glow: k.startsWith('crystal') });
  }
  return out;
}
