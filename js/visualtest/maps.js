// 테스트 맵 2곳: 판타지 마을 + 숲 필드
// 지형 글자: '.' 잔디  ',' 어두운 숲 바닥  '=' 흙길  '~' 물  '#' 절벽(위는 고원, 아래 줄이 절벽면)
//           'T' 숲(나무 덮개)  'b' 다리  'W' 폭포
// 모든 좌표는 타일 단위(1타일 = 64px). 건물·소품의 y는 "바닥(발) 위치"입니다.

export const TILE = 64;

function grid(w, h, ch = '.') {
  return Array.from({ length: h }, () => Array(w).fill(ch));
}
function rect(g, x0, y0, x1, y1, ch) {
  for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++) g[y][x] = ch;
}
function ellipse(g, cx, cy, rx, ry, ch, only = null) {
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && (!only || only.includes(g[y][x]))) g[y][x] = ch;
    }
}
// 굵기가 있는 길 (점들을 잇는 선)
function path(g, pts, r, ch = '=', only = null) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    for (let y = 0; y < g.length; y++)
      for (let x = 0; x < g[0].length; x++) {
        const px = x + 0.5, py = y + 0.5;
        const vx = bx - ax, vy = by - ay;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
        const d = Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
        if (d <= r && (!only || only.includes(g[y][x]))) g[y][x] = ch;
      }
  }
}

// ---------------- 마을 ----------------
function buildVillage() {
  const W = 36, H = 28, g = grid(W, H);
  rect(g, 0, 0, W - 1, 2, 'T');
  rect(g, 0, 26, W - 1, 27, 'T');
  rect(g, 0, 0, 1, H - 1, 'T');
  rect(g, 34, 0, 35, H - 1, 'T');
  rect(g, 2, 3, 33, 3, '#');
  ellipse(g, 2.2, 24.4, 2.6, 2.4, 'T');
  ellipse(g, 33.6, 24.2, 2.8, 2.6, 'T');
  ellipse(g, 6.5, 22.6, 4.4, 2.3, '~');
  // 큰길 (동쪽 끝이 숲으로 가는 출구)
  rect(g, 2, 11, 35, 12, '=');
  // 집 문 앞 길
  rect(g, 7, 9, 7, 10, '=');
  rect(g, 15, 9, 15, 10, '=');
  rect(g, 24, 9, 24, 10, '=');
  // 광장
  ellipse(g, 17, 14.6, 4.4, 2.2, '=');
  // 시장·대장간 앞
  rect(g, 21, 15, 29, 16, '=');
  rect(g, 22, 18, 32, 19, '=');
  rect(g, 27, 16, 28, 18, '=');
  // 남쪽 집으로 가는 길
  rect(g, 12, 15, 13, 20, '=');
  rect(g, 6, 19, 13, 20, '=');
  return {
    id: 'village', name: '새싹 마을', w: W, h: H, grid: g, base: '.', bgm: 'fractionValley',
    spawn: [18, 13.2],
    exits: [{ x0: 35, y0: 11, x1: 36, y1: 13, to: 'forest', at: [2.5, 15.2], dir: 'right', label: '숲으로' }],
    buildings: [
      { id: 'house_red_a', x: 7.5, y: 9.6 },
      { id: 'house_blue', x: 15, y: 9.55 },
      { id: 'house_green', x: 24, y: 9.6 },
      { id: 'watchtower', x: 31, y: 9.3 },
      { id: 'house_red_b', x: 9, y: 18.6 },
      { id: 'market_stall', x: 24.6, y: 17.7 },
      { id: 'blacksmith_workshop', x: 30.5, y: 17.9 },
    ],
    props: [
      { id: 'wooden_barrel', x: 27.4, y: 18.3 }, { id: 'wooden_barrel', x: 33.1, y: 18.7 },
      { id: 'wooden_crates', x: 21.3, y: 17.6 }, { id: 'cloth_sack', x: 27.9, y: 17.4 },
      { id: 'wood_bucket', x: 11.4, y: 21.3 }, { id: 'clay_pot', x: 5.2, y: 9.8 }, { id: 'clay_pot', x: 10.2, y: 9.7 },
      { id: 'wooden_barrel', x: 4.6, y: 18.2 },
    ],
    npcs: [
      { id: 'elder', x: 17.2, y: 14.2, name: '촌장', line: '어서 오너라! 동쪽 길로 가면 숲이 나온단다.' },
      { id: 'merchant', x: 22.4, y: 19.3, name: '떠돌이 상인', line: '좋은 물건 많아요~ (상점은 본 게임에서 열려요)' },
      { id: 'blacksmith', x: 28.6, y: 19.4, name: '대장장이', line: '검이 무뎌지면 언제든 오게!' },
      { id: 'innkeeper', x: 10.3, y: 10.5, name: '여관 주인', line: '쉬어 가요. 따뜻한 수프가 있어요.' },
      { id: 'guard', x: 33.0, y: 13.9, name: '마을 경비', line: '숲에는 슬라임이 많으니 조심해!' },
      { id: 'kid', x: 20.6, y: 16.9, name: '꼬마', line: '나 잡아 봐라~!' },
      { id: 'farmer', x: 12.6, y: 23.2, name: '농부', line: '연못 물이 아주 맑지?' },
      { id: 'scholar', x: 17.6, y: 10.4, name: '학자', line: '분수, 소수, 비례… 이 마을엔 수학의 힘이 흐르지.' },
      { id: 'priestess', x: 13.6, y: 13.6, name: '사제', line: '여신의 축복이 함께하길.' },
    ],
    decals: [
      ['flowerbed', 4.2, 7.6], ['flowerbed', 11.2, 7.4], ['flower_rose', 19.2, 7.2], ['flower_yellow', 28.6, 6.4],
      ['flower_blue', 20.5, 21.6], ['daisy', 27.5, 22.4], ['flower_rose', 3.4, 15.2], ['wildflower', 30.6, 14.6],
      ['bush_flower', 14.6, 24.2], ['bush_flower', 26.5, 24.4], ['flower_yellow', 16.8, 22.6], ['flowerbed', 4.4, 13.8],
    ],
    randomDecals: 26,
    monsters: [],
  };
}

// ---------------- 숲 필드 ----------------
function buildForest() {
  const W = 46, H = 32, g = grid(W, H);
  rect(g, 0, 0, W - 1, 2, 'T');
  rect(g, 0, 29, W - 1, 31, 'T');
  rect(g, 0, 0, 1, H - 1, 'T');
  rect(g, 44, 0, 45, H - 1, 'T');
  rect(g, 2, 3, 43, 3, '#');
  // 숲 덩어리
  ellipse(g, 9, 8.2, 3.6, 2.3, 'T');
  ellipse(g, 20, 23.6, 3.8, 2.5, 'T');
  ellipse(g, 39.5, 10, 3.2, 2.4, 'T');
  ellipse(g, 4.6, 25.4, 3.2, 2.6, 'T');
  ellipse(g, 25.5, 6.4, 2.6, 1.6, 'T');
  ellipse(g, 14.5, 28.4, 4, 1.6, 'T');
  // 어두운 숲 바닥
  for (const [cx, cy, rx, ry] of [[9, 8.4, 6, 4.2], [20, 23.6, 6.2, 4.4], [39.5, 10, 5.4, 4.4], [4.6, 25, 5, 4], [25.5, 6.6, 4.8, 3.4], [14, 27.6, 6, 3], [34, 27, 5, 2.6]])
    ellipse(g, cx, cy, rx, ry, ',', ['.']);
  // 강 (북쪽 절벽 폭포에서 남쪽 숲으로)
  const rc = (y) => 31 + Math.round(Math.sin(y * 0.33) * 1.2);
  for (let y = 4; y <= 28; y++) { g[y][rc(y)] = '~'; g[y][rc(y) + 1] = '~'; }
  g[3][rc(3)] = 'W'; g[3][rc(3) + 1] = 'W';
  // 길: 서쪽 입구 → 다리 → 동쪽 유적
  const by = 16, bc = rc(by);
  path(g, [[0, 15], [8, 15], [13.5, 17], [bc - 0.5, 17]], 1.05, '=', ['.', ',']);
  path(g, [[bc + 2.5, 17], [35, 19.5], [38.5, 22.5]], 1.05, '=', ['.', ',']);
  rect(g, 0, 14, 1, 15, '=');
  // 다리 (물 위)
  for (let x = bc; x <= bc + 1; x++) g[by][x] = 'b';
  g[by][bc - 1] = '='; g[by][bc + 2] = '=';
  return {
    id: 'forest', name: '속삭이는 숲', w: W, h: H, grid: g, base: '.', bgm: 'field',
    spawn: [3, 15.2],
    exits: [{ x0: 0, y0: 14, x1: 1, y1: 16, to: 'village', at: [33.4, 12.2], dir: 'left', label: '마을로' }],
    buildings: [],
    props: [
      { id: 'cave_entrance', x: 37.8, y: 4.15, interact: '동굴 던전은 다음 단계에서 연결돼요.' },
      { id: 'ruins_rubble_a', x: 36.3, y: 23.0 }, { id: 'ruins_rubble_b', x: 41.2, y: 24.6 },
      { id: 'broken_pillar', x: 35.2, y: 21.2 }, { id: 'leaning_pillar', x: 41.6, y: 21.3 },
      { id: 'ruined_stone_post', x: 38.2, y: 26.0 }, { id: 'treasure_chest', x: 39.3, y: 23.4, interact: '상자 안은 비어 있어요. (테스트용)' },
      { id: 'small_rubble', x: 12.6, y: 20.6 }, { id: 'small_rubble', x: 23.2, y: 13.0 }, { id: 'ruins_rubble_b', x: 6.4, y: 19.8 },
    ],
    npcs: [
      { id: 'scout', x: 4.2, y: 13.4, name: '정찰병', line: '다리를 건너면 오래된 유적이 있어.' },
      { id: 'mystic', x: 33.8, y: 24.3, name: '수상한 마법사', line: '…이 유적엔 봉인의 기운이 남아 있군.' },
    ],
    decals: [['bush', 16.5, 13.4], ['bush_flower', 29.4, 19.8], ['wildflower', 22, 9.6], ['bush', 6.8, 12.2], ['daisy', 35.6, 15.4]],
    randomDecals: 34,
    monsters: [
      { id: 'slime_green', x: 12, y: 15.5 }, { id: 'slime_green', x: 20, y: 13.5 }, { id: 'slime_blue', x: 25, y: 26 },
      { id: 'mushroom', x: 10, y: 22 }, { id: 'mushroom', x: 26.5, y: 10 },
      { id: 'wolf', x: 36.5, y: 15.5 }, { id: 'goblin', x: 38.5, y: 20 },
    ],
  };
}

export const MAPS = { village: buildVillage(), forest: buildForest() };

// 그림별 크기 배율과 충돌(바닥) 영역 — fw: 그림 너비 대비 비율, fh: 높이(px), lift: 바닥에서 띄우는 px
export const OBJ = {
  // 건물
  house_red_a: { s: 1.12, fw: 0.84, fh: 74 }, house_red_b: { s: 1.12, fw: 0.86, fh: 70 },
  house_blue: { s: 1.12, fw: 0.84, fh: 74 }, house_green: { s: 1.12, fw: 0.84, fh: 74 },
  watchtower: { s: 1.12, fw: 0.78, fh: 54 }, market_stall: { s: 1.12, fw: 0.9, fh: 62 },
  blacksmith_workshop: { s: 1.12, fw: 0.9, fh: 70 },
  // 소품
  wooden_barrel: { s: 0.5, fw: 0.8, fh: 18 }, clay_pot: { s: 0.5, fw: 0.7, fh: 12 }, wooden_crates: { s: 0.46, fw: 0.86, fh: 30 },
  cloth_sack: { s: 0.55, fw: 0.7, fh: 14 }, wood_bucket: { s: 0.45, fw: 0.7, fh: 14 },
  ruins_rubble_a: { s: 0.62, fw: 0.78, fh: 34 }, ruins_rubble_b: { s: 0.62, fw: 0.82, fh: 30 }, small_rubble: { s: 0.5, fw: 0.7, fh: 26 },
  broken_pillar: { s: 0.62, fw: 0.7, fh: 18 }, leaning_pillar: { s: 0.62, fw: 0.5, fh: 22 }, ruined_stone_post: { s: 0.55, fw: 0.6, fh: 24 },
  cave_entrance: { s: 0.62, fw: 0.86, fh: 46 }, treasure_chest: { s: 0.42, fw: 0.86, fh: 22 },
};
