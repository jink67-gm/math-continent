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

  // 절벽 덩어리 가장자리를 들쭉날쭉하게 깎아요 (네모반듯하지 않게).
  // 깎기만 하고 덧붙이지는 않아서 길이 막히지 않아요. 두께가 충분한 곳만 깎아 벽에 구멍이 나지 않게 해요.
  // 계단·동굴 입구 근처는 그대로 둬요.
  roughen(rnd, { amount = 0.5 } = {}) {
    const B = this.blockCells.map((r) => [...r]);
    const isB = (x, y) => this.in(x, y) && B[y][x];
    const open = (x, y) => this.in(x, y) && !B[y][x];
    // 칸 하나의 위아래·좌우 두께 (원래 모양 기준)
    const run = (x, y, dx, dy) => { let n = 0; while (isB(x + dx * (n + 1), y + dy * (n + 1))) n++; return n; };
    const thickV = (x, y) => run(x, y, 0, -1) + run(x, y, 0, 1) + 1;
    const thickH = (x, y) => run(x, y, -1, 0) + run(x, y, 1, 0) + 1;
    const guard = [...this.stairCells, ...this.openCells].map((k) => k.split(',').map(Number));
    const nearGuard = (x, y) => guard.some(([gx, gy]) => Math.abs(gx - x) <= 2 && gy - y >= -1 && gy - y <= this.faceH + 2);
    // 가장자리를 따라 2~4칸씩 이어지는 부드러운 무늬
    const seeds = new Map();
    const hash = (k) => { if (!seeds.has(k)) seeds.set(k, rnd()); return seeds.get(k); };
    const noise = (line, t) => {
      const s = 3;
      const i = Math.floor(t / s);
      const f = (t % s) / s;
      return hash(`${line}:${i}`) * (1 - f) + hash(`${line}:${i + 1}`) * f;
    };
    // 위·아래 가장자리만 2칸 이상 이어서 깎아요 (옆 가장자리를 한 칸씩 파면 가는 기둥이 생겨서 안 해요)
    const cutSet = new Set();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!B[y][x] || nearGuard(x, y)) continue;
        const n = open(x, y - 1);
        const s = open(x, y + 1);
        if (!(n || s)) continue;
        const tv = thickV(x, y);
        if (tv < 4 || noise(`${n ? 'n' : 's'}${y}`, x) <= 1 - amount * 0.9) continue;
        cutSet.add(this.key(x, y));
        if (tv >= 7 && noise(`d${n ? 'n' : 's'}${y}`, x) > 0.72) {
          const dy = n ? 1 : -1;
          if (!nearGuard(x, y + dy)) cutSet.add(this.key(x, y + dy));
        }
      }
    }
    // 한 칸짜리 홈·한 칸짜리 기둥 없애기
    const blockNow = (x, y) => this.in(x, y) && B[y][x] && !cutSet.has(this.key(x, y));
    for (let pass = 0; pass < 3; pass++) {
      for (const k of [...cutSet]) {
        const [x, y] = k.split(',').map(Number);
        if (blockNow(x - 1, y) && blockNow(x + 1, y)) cutSet.delete(k);
      }
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          if (!blockNow(x, y)) continue;
          const lo = !blockNow(x - 1, y) && (cutSet.has(this.key(x - 1, y)) || open(x - 1, y));
          const ro = !blockNow(x + 1, y) && (cutSet.has(this.key(x + 1, y)) || open(x + 1, y));
          if (lo && ro && (cutSet.has(this.key(x - 1, y)) || cutSet.has(this.key(x + 1, y)))) {
            cutSet.delete(this.key(x - 1, y));
            cutSet.delete(this.key(x + 1, y));
          }
        }
      }
    }
    const cut = [...cutSet].map((k) => k.split(',').map(Number));
    for (const [x, y] of cut) this.blockCells[y][x] = false;
    // 깎인 칸의 높이: 옆에 언덕 위(걸을 수 있는) 칸이 있으면 언덕, 아니면 낮은 땅
    for (const [x, y] of cut) {
      const terrace = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.hi(x + dx, y + dy) && !this.isBlock(x + dx, y + dy) && !B[y + dy]?.[x + dx]);
      this.h[y][x] = terrace ? 1 : 0;
    }
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

  // 절벽 덩어리 아랫부분도 바위 벽으로 그려 절벽을 더 높아 보이게 해요 (그림만, 판정은 그대로 막힘).
  // 덩어리 맨 아래에서 몇 번째 칸인지 (0 = 맨 아래). 위쪽 풀밭이 한 칸은 남아야 해요.
  innerFace(x, y, rows = 2) {
    if (!this.isBlock(x, y)) return -1;
    let below = 0;
    while (this.isBlock(x, y + below + 1)) below++;
    if (below >= rows) return -1;
    const by = y + below + 1;
    if (!this.in(x, by) || this.faceRow(x, by) !== 0) return -1;
    let above = 0;
    while (this.isBlock(x, y - above - 1)) above++;
    if (above + below + 1 < rows + 1) return -1;
    return below;
  }

  // 그릴 때 쓰는 절벽 칸 정보: 위에서부터 몇 번째인지(0 = 맨 위) / 전체 높이
  cliffCell(x, y) {
    const inner = 2;
    const f = this.innerFace(x, y, inner);
    if (f >= 0) return { i: inner - 1 - f, n: inner + this.faceH };
    if (this.isFace(x, y) || this.openCells.has(this.key(x, y))) {
      const fr = this.faceRow(x, y);
      if (fr < 0) return null;
      const top = this.innerFace(x, y - fr - 1, inner) === 0;
      return top ? { i: inner + fr, n: inner + this.faceH } : { i: fr, n: this.faceH };
    }
    return null;
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

// 들판·숲의 절벽은 Zelda-like 흙절벽 시트(가로 4칸)를 써요: 줄 0 풀 가장자리 · 1~3 절벽 윗줄·가운데·아랫줄 · 4 테두리
const ZL_COLS = 4;

export function drawRelief(scene, b, { cave = false, theme = 'meadow' } = {}) {
  const g = scene.add.graphics().setDepth(-880);
  const R = (cx, cy) => cy * RELIEF_COLS + cx;
  const zl = cave ? null : `zl/cliff_${theme === 'forest' ? 'forest' : 'meadow'}`;
  const Z = (cx, cy) => cy * ZL_COLS + cx;
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
      const cc = b.cliffCell(x, y);
      if (cc) {
        const lf = !!b.cliffCell(x - 1, y);
        const rf = !!b.cliffCell(x + 1, y);
        const last = cc.i === cc.n - 1;
        const first = cc.i === 0;
        if (zl) {
          const col = lf && rf ? 1 : !lf && rf ? 0 : lf && !rf ? 2 : 3;
          scene.add.image(px, py, zl, Z(col, last ? 3 : first ? 1 : 2)).setOrigin(0, 0).setDepth(-870);
        } else {
          const col = lf && rf ? 5 : !lf && rf ? 4 : lf && !rf ? 6 : 9;
          scene.add.image(px, py, 'na/relief', R(col, last ? 2 : 1)).setOrigin(0, 0).setDepth(-870);
          if (first) g.fillStyle(0xc7e07a, 0.9).fillRect(px, py - 1, T, 2);
          if (last) g.fillStyle(0x000000, 0.18).fillRect(px, py + T, T, 4);
        }
      } else if (zl) {
        // 절벽 바로 위 칸: 풀이 절벽 위로 살짝 늘어진 가장자리
        const below = b.cliffCell(x, y + 1);
        if (below && below.i === 0) {
          const lf = !!b.cliffCell(x - 1, y + 1);
          const rf = !!b.cliffCell(x + 1, y + 1);
          const col = lf && rf ? 1 : !lf && rf ? 0 : lf && !rf ? 2 : 3;
          scene.add.image(px, py, zl, Z(col, 0)).setOrigin(0, 0).setCrop(0, 8, T, 8).setDepth(-869);
        }
      }
      if (b.isStairs(x, y)) {
        scene.add.image(px, py, 'na/reliefd', 3 * DETAIL_COLS + 5).setOrigin(0, 0).setDepth(-869);
      }
      if (b.isBridge(x, y)) {
        const vertical = b.grid.get(x - 1, y) !== 'w' || b.grid.get(x + 1, y) !== 'w' ? false : true;
        const img = scene.add.image(px + T / 2, py + T / 2, 'na/reliefd', 6 * DETAIL_COLS).setDepth(-860);
        if (!vertical) img.setAngle(90);
      }
      // 언덕 옆 가장자리: 절벽 면 그림의 바위 테두리를 잘라 붙여요 / 윗가장자리: 바위 띠
      if (b.hi(x, y) && !cc) {
        const rock = cave ? 1 : 6;
        if (b.in(x - 1, y) && !b.hi(x - 1, y) && !b.isWall(x - 1, y) && !b.isFace(x - 1, y)) {
          g.fillStyle(0x000000, 0.2).fillRect(px - 3, py, 3, T);
          if (zl) scene.add.image(px, py, zl, Z(0, 4)).setOrigin(0, 0).setCrop(0, 0, 4, T).setDepth(-868);
          else scene.add.image(px, py, 'na/relief', R(4, rock)).setOrigin(0, 0).setCrop(0, 0, 5, T).setDepth(-868);
        }
        if (b.in(x + 1, y) && !b.hi(x + 1, y) && !b.isWall(x + 1, y) && !b.isFace(x + 1, y)) {
          g.fillStyle(0x000000, 0.2).fillRect(px + T, py, 3, T);
          if (zl) scene.add.image(px, py, zl, Z(2, 4)).setOrigin(0, 0).setCrop(T - 4, 0, 4, T).setDepth(-868);
          else scene.add.image(px, py, 'na/relief', R(6, rock)).setOrigin(0, 0).setCrop(T - 5, 0, 5, T).setDepth(-868);
        }
        if (zl && b.in(x, y - 1) && !b.hi(x, y - 1) && !b.isWall(x, y - 1)) {
          scene.add.image(px, py, zl, Z(1, 4)).setOrigin(0, 0).setCrop(0, 0, T, 4).setDepth(-868);
        } else if (b.in(x, y - 1) && !b.hi(x, y - 1) && !b.isWall(x, y - 1)) {
          g.fillStyle(0x3b2a1a, 1).fillRect(px, py, T, 1);
          g.fillStyle(0x8a6a48, 1).fillRect(px, py + 1, T, 2);
          g.fillStyle(0x5a4030, 1).fillRect(px, py + 3, T, 1);
          for (let i = (x * 7) % 5; i < T; i += 5) g.fillStyle(0xb08a5e, 1).fillRect(px + i, py + 1, 2, 1);
        }
      }
    }
  }
  return g;
}
