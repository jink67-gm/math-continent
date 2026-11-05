// 제노니아처럼 손으로 그리는 지도 만들기
// 땅(풀·흙·물) + 높이(언덕 위 = 1) + 계단 + 다리 + 동굴 벽 + 물건을 칸 단위 명령으로 적어요.
//
//   const b = new MapBuilder(44, 34);
//   b.path([[0, 20], [22, 20]]);          // 흙길 (굵기 2)
//   b.high(6, 0, 37, 12);                 // 언덕: 바로 아래 줄(13)에 절벽 면이 생겨요
//   b.stairs(21, 13, 2);                  // 절벽 면에 계단 (지나갈 수 있어요)
//   b.river([[3, 0], [3, 33]], 2);        // 시내
//   b.bridge(3, 25, 4, 26);               // 다리 (물 위를 걸어요)
//   b.block(0, 0, 9, 15);                 // 절벽 덩어리: 높은 숲 지대라 올라갈 수 없어요 (공간을 나눠요)
//   b.wall(0, 0, 35, 0);                  // 동굴 벽 (던전)
//   b.obj('house_big', 14, 10);           // 물건 (발밑 칸 좌표)
//
// 절벽 면: 언덕 칸 바로 아래가 언덕이 아니면 그 칸에 절벽을 그리고 막아요 (계단만 빼고).
// 높이가 다른 칸 사이(언덕 옆·위 가장자리)에는 얇은 벽을 세워 계단으로만 오르내려요.

import { TerrainGrid, T } from './terrain.js';

export class MapBuilder {
  // faceH: 절벽 높이 (칸) — 2면 제노니아처럼 높은 절벽
  constructor(cols, rows, faceH = 2) {
    this.cols = cols;
    this.rows = rows;
    this.faceH = faceH;
    this.grid = new TerrainGrid(cols, rows);
    this.h = Array.from({ length: rows }, () => Array(cols).fill(0));
    this.wallCells = Array.from({ length: rows }, () => Array(cols).fill(false));
    this.blockCells = Array.from({ length: rows }, () => Array(cols).fill(false));
    this.stairCells = new Set();
    this.openCells = new Set(); // 절벽 면이지만 지나갈 수 있는 곳 (동굴 입구)
    this.bridgeCells = new Set();
    this.objects = [];
  }

  in(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows; }
  key(x, y) { return `${x},${y}`; }

  ground(x0, y0, x1, y1, t) { this.grid.rect(x0, y0, x1, y1, t); return this; }
  circle(cx, cy, r, t) { this.grid.circle(cx, cy, r, t); return this; }

  // 굵은 선 (흙길·시내)
  path(points, w = 2, t = 'd') {
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
      for (let k = 0; k <= n; k++) {
        const x = Math.round(ax + ((bx - ax) * k) / n);
        const y = Math.round(ay + ((by - ay) * k) / n);
        this.grid.rect(x, y, x + w - 1, y + w - 1, t);
      }
    }
    return this;
  }

  river(points, w = 2) { return this.path(points, w, 'w'); }

  high(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.in(x, y)) this.h[y][x] = 1;
    return this;
  }

  // 절벽 덩어리: 높이 1이지만 걸을 수 없어요. 위에는 나무가 빽빽하게 자라요
  block(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.in(x, y)) { this.h[y][x] = 1; this.blockCells[y][x] = true; }
    return this;
  }

  unblock(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.in(x, y)) this.blockCells[y][x] = false;
    return this;
  }

  low(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.in(x, y)) this.h[y][x] = 0;
    return this;
  }

  // 계단·입구는 절벽 높이만큼 아래로 이어져요
  stairs(x, y, w = 2) {
    for (let i = 0; i < w; i++) for (let k = 0; k < this.faceH; k++) this.stairCells.add(this.key(x + i, y + k));
    return this;
  }

  opening(x, y, w = 1) {
    for (let i = 0; i < w; i++) for (let k = 0; k < this.faceH; k++) this.openCells.add(this.key(x + i, y + k));
    return this;
  }

  bridge(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.bridgeCells.add(this.key(x, y));
    return this;
  }

  wall(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.in(x, y)) this.wallCells[y][x] = true;
    return this;
  }

  obj(k, x, y, extra = {}) {
    this.objects.push({ k, x: x * T, y: y * T, ...extra });
    return this;
  }

  // ── 판정 ──────────────────────────────────────
  hi(x, y) { return this.in(x, y) && this.h[y][x] === 1; }
  isWall(x, y) { return this.in(x, y) && this.wallCells[y][x]; }
  isBlock(x, y) { return this.in(x, y) && this.blockCells[y][x]; }
  isStairs(x, y) { return this.stairCells.has(this.key(x, y)); }
  isBridge(x, y) { return this.bridgeCells.has(this.key(x, y)); }

  // 언덕 바로 아래 faceH칸은 절벽 면이에요. faceRow: 0 = 윗줄, 1 = 아랫줄(받침)
  faceRow(x, y) {
    if (!this.in(x, y) || this.hi(x, y) || this.isWall(x, y)) return -1;
    for (let k = 1; k <= this.faceH; k++) {
      if (this.hi(x, y - k)) return k - 1;
      if (!this.in(x, y - k)) return -1;
    }
    return -1;
  }

  isFace(x, y) {
    return this.faceRow(x, y) >= 0 && !this.isStairs(x, y);
  }

  // 걸을 수 있는지 (물건은 따로)
  walkable(x, y) {
    if (!this.in(x, y) || this.isWall(x, y) || this.isBlock(x, y)) return false;
    if (this.isFace(x, y) && !this.openCells.has(this.key(x, y))) return false;
    if (this.grid.get(x, y) === 'w' && !this.isBridge(x, y)) return false;
    return true;
  }

  // 막힌 곳 상자 목록 (가로로 이어 붙여요)
  solidRects() {
    const out = [];
    for (let y = 0; y < this.rows; y++) {
      let start = -1;
      for (let x = 0; x <= this.cols; x++) {
        const b = x < this.cols && !this.walkable(x, y);
        if (b && start < 0) start = x;
        if (!b && start >= 0) { out.push({ x: start * T, y: y * T, w: (x - start) * T, h: T }); start = -1; }
      }
    }
    // 높이가 다른 칸 사이의 얇은 벽 (계단·절벽 면은 이미 처리됨)
    const thin = 3;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.walkable(x, y)) continue;
        const hx = this.hi(x, y) || this.isStairs(x, y);
        // 오른쪽 이웃
        if (x + 1 < this.cols && this.walkable(x + 1, y) && this.hi(x + 1, y) !== this.hi(x, y) && !this.isStairs(x, y) && !this.isStairs(x + 1, y)) {
          out.push({ x: (x + 1) * T - thin / 2, y: y * T, w: thin, h: T });
        }
        // 아래 이웃: 언덕 위 칸 아래가 낮은 땅이면 절벽 면이라 이미 막혀요. 낮은 땅 아래가 언덕이면(언덕 윗가장자리) 막아요
        if (y + 1 < this.rows && this.walkable(x, y + 1) && !hx && this.hi(x, y + 1)) {
          out.push({ x: x * T, y: (y + 1) * T - thin / 2, w: T, h: thin });
        }
      }
    }
    return out;
  }

  // 어디서 어디로 걸어갈 수 있는지 (칸 단위, 물건은 빼고) — 지도 점검용
  reachable(sx, sy) {
    const seen = new Set();
    const q = [[sx, sy]];
    const ok = (ax, ay, bx, by) => {
      if (!this.walkable(bx, by)) return false;
      const ha = this.hi(ax, ay) || this.isStairs(ax, ay);
      const hb = this.hi(bx, by) || this.isStairs(bx, by);
      if (this.isStairs(ax, ay) || this.isStairs(bx, by)) return true;
      return this.hi(ax, ay) === this.hi(bx, by) || (ha && hb);
    };
    seen.add(this.key(sx, sy));
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const k = this.key(nx, ny);
        if (seen.has(k) || !ok(x, y, nx, ny)) continue;
        seen.add(k);
        q.push([nx, ny]);
      }
    }
    return seen;
  }

  // 언덕 위와 아래에 서 있는지 (몬스터가 절벽을 넘지 않게 쓸 수 있어요)
  heightAt(px, py) {
    const x = Math.floor(px / T);
    const y = Math.floor(py / T);
    return this.hi(x, y) ? 1 : 0;
  }
}

// ── 그리기 ────────────────────────────────────────
// TilesetRelief(20칸 너비): 갈색 절벽 면 4~6열 7줄(받침 포함) / 회색 벽 4~6열 0~2줄
// TilesetReliefDetail(12칸 너비): 계단 (5,3) · 판자 (0,6)
const RELIEF_COLS = 20;
const DETAIL_COLS = 12;

export function drawRelief(scene, b, { cave = false } = {}) {
  const g = scene.add.graphics().setDepth(-880);
  const R = (cx, cy) => cy * RELIEF_COLS + cx;
  for (let y = 0; y < b.rows; y++) {
    for (let x = 0; x < b.cols; x++) {
      const px = x * T;
      const py = y * T;
      // 동굴 벽: 위 가장자리 · 가운데 · 아래(받침)
      if (b.isWall(x, y)) {
        const below = b.isWall(x, y + 1);
        const above = b.isWall(x, y - 1);
        const left = b.isWall(x - 1, y) ? 1 : 0;
        const right = b.isWall(x + 1, y) ? 1 : 0;
        const col = left && right ? 5 : !left && right ? 4 : left && !right ? 6 : 9;
        const row = !below ? 2 : !above ? 0 : 1;
        scene.add.image(px, py, 'na/relief', R(col, row)).setOrigin(0, 0).setDepth(below ? -870 : py + T);
        continue;
      }
      if (b.isFace(x, y) || (b.openCells.has(b.key(x, y)))) {
        const fr = b.faceRow(x, y);
        const lf = b.isFace(x - 1, y) || b.openCells.has(b.key(x - 1, y));
        const rf = b.isFace(x + 1, y) || b.openCells.has(b.key(x + 1, y));
        const col = lf && rf ? 5 : !lf && rf ? 4 : lf && !rf ? 6 : 9;
        const last = fr === b.faceH - 1;
        const row = cave ? (last ? 2 : 1) : (last ? 7 : 6);
        scene.add.image(px, py, 'na/relief', R(col, row)).setOrigin(0, 0).setDepth(-870);
        // 풀과 절벽 사이에 밝은 테두리, 절벽 아래에는 그림자
        if (fr === 0) g.fillStyle(0xc7e07a, 0.9).fillRect(px, py - 1, T, 2);
        if (last) g.fillStyle(0x000000, 0.16).fillRect(px, py + T, T, 4);
      }
      if (b.isStairs(x, y)) {
        scene.add.image(px, py, 'na/reliefd', 3 * DETAIL_COLS + 5).setOrigin(0, 0).setDepth(-869);
      }
      if (b.isBridge(x, y)) {
        const vertical = b.grid.get(x - 1, y) !== 'w' || b.grid.get(x + 1, y) !== 'w' ? false : true;
        const img = scene.add.image(px + T / 2, py + T / 2, 'na/reliefd', 6 * DETAIL_COLS).setDepth(-860);
        if (!vertical) img.setAngle(90);
      }
      // 언덕 옆·위 가장자리: 진한 선과 그림자
      if (b.hi(x, y)) {
        if (b.in(x - 1, y) && !b.hi(x - 1, y) && !b.isWall(x - 1, y) && !b.isFace(x - 1, y)) {
          g.fillStyle(0x4a3220, 1).fillRect(px, py, 2, T);
          g.fillStyle(0x000000, 0.18).fillRect(px - 3, py, 3, T);
        }
        if (b.in(x + 1, y) && !b.hi(x + 1, y) && !b.isWall(x + 1, y) && !b.isFace(x + 1, y)) {
          g.fillStyle(0x4a3220, 1).fillRect(px + T - 2, py, 2, T);
          g.fillStyle(0x000000, 0.18).fillRect(px + T, py, 3, T);
        }
        if (b.in(x, y - 1) && !b.hi(x, y - 1) && !b.isWall(x, y - 1)) {
          g.fillStyle(0x4a3220, 1).fillRect(px, py, T, 2);
        }
      }
    }
  }
  return g;
}
