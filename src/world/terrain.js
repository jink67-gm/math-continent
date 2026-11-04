// 땅 그리기 (Ninja Adventure 16px 타일)
// 지도는 칸마다 'g'(풀) · 'd'(흙길) · 'w'(물)로 적어요.
// 흙과 물은 주변 8칸을 보고 알맞은 가장자리 조각을 골라서, 길과 물가가 자연스럽게 이어져요.

import { BLOB_TILES, GRASS_TILES } from './blobTiles.js';

export const T = 16;

const FLOOR_COLS = 352 / T; // TilesetFloor.png 가로 칸 수
const WATER_COLS = 448 / T; // TilesetWater.png 가로 칸 수

// 이웃 비트: 1 왼위 2 위 4 오위 8 왼 16 오 32 왼아래 64 아래 128 오아래
const NB = [[-1, -1, 1], [0, -1, 2], [1, -1, 4], [-1, 0, 8], [1, 0, 16], [-1, 1, 32], [0, 1, 64], [1, 1, 128]];

// 모서리는 양옆 변이 둘 다 같은 땅일 때만 따져요 (Godot 방식과 같게)
function normalize(m) {
  if (!(m & 2 && m & 8)) m &= ~1;
  if (!(m & 2 && m & 16)) m &= ~4;
  if (!(m & 64 && m & 8)) m &= ~32;
  if (!(m & 64 && m & 16)) m &= ~128;
  return m;
}

const popcount = (n) => { let c = 0; for (; n; n >>= 1) c += n & 1; return c; };

// 비트 → 타일 (정확히 맞는 게 없으면 가장 비슷한 것)
const lookup = new Map();
function pickTile(mask) {
  if (lookup.has(mask)) return lookup.get(mask);
  const exact = BLOB_TILES.filter((t) => t[2] === mask);
  let list = exact;
  if (!list.length) {
    let best = Infinity;
    for (const t of BLOB_TILES) {
      const d = popcount(t[2] ^ mask) + (t[2] & ~mask ? 4 : 0); // 없는 쪽으로 번지는 건 더 나쁨
      if (d < best) { best = d; list = [t]; } else if (d === best) list.push(t);
    }
  }
  lookup.set(mask, list);
  return list;
}

export class TerrainGrid {
  constructor(cols, rows, fill = 'g') {
    this.cols = cols;
    this.rows = rows;
    this.c = Array.from({ length: rows }, () => Array(cols).fill(fill));
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return this.c[y][x];
  }

  set(x, y, t) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.c[y][x] = t;
  }

  // 칸 사각형 (양 끝 포함)
  rect(x0, y0, x1, y1, t) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t);
  }

  // 칸 원 (중심은 칸 가운데 기준)
  circle(cx, cy, r, t) {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r); x++) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, t);
      }
    }
  }

  // 지도 밖은 같은 땅으로 쳐서 가장자리에 테두리가 생기지 않게 해요
  mask(x, y, t) {
    let m = 0;
    for (const [dx, dy, b] of NB) {
      const v = this.get(x + dx, y + dy);
      if (v === t || v === null) m |= b;
    }
    return normalize(m);
  }

  blocked(x, y) {
    return this.get(x, y) === 'w';
  }

  // 막힌 칸을 가로로 이어 붙인 사각형 목록 (충돌용)
  solidRects() {
    const out = [];
    for (let y = 0; y < this.rows; y++) {
      let start = -1;
      for (let x = 0; x <= this.cols; x++) {
        const b = x < this.cols && this.blocked(x, y);
        if (b && start < 0) start = x;
        if (!b && start >= 0) {
          out.push({ x: start * T, y: y * T, w: (x - start) * T, h: T });
          start = -1;
        }
      }
    }
    return out;
  }

  // 전체 땅을 RenderTexture 한 장에 구워요
  bake(scene, rnd) {
    const rt = scene.add.renderTexture(0, 0, this.cols * T, this.rows * T).setOrigin(0, 0);
    const grassOnly = GRASS_TILES.filter(([x, y]) => y === 12); // 무늬 없는 풀 위주
    rt.beginDraw();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const t = this.c[y][x];
        let sheet = 'na/floor';
        let tx;
        let ty;
        if (t === 'g') {
          const list = rnd() < 0.85 ? grassOnly : GRASS_TILES;
          [tx, ty] = list[Math.floor(rnd() * list.length)];
        } else {
          const m = this.mask(x, y, t);
          const list = pickTile(m);
          // 가득 찬 칸은 무늬 없는 기본 조각 위주로 (나뭇가지 무늬는 가끔만)
          [tx, ty] = m === 255 && rnd() < 0.92 ? [1, 8] : list[Math.floor(rnd() * list.length)];
          if (t === 'w') {
            // 물 시트에는 흙 시트의 "가득 찬 칸 무늬" 두 개(0~1, 11)가 없어요
            if (ty === 11 && tx < 2) [tx, ty] = [1, 8];
            sheet = 'na/water';
            ty -= 1;
          }
        }
        const cols = sheet === 'na/water' ? WATER_COLS : FLOOR_COLS;
        rt.batchDrawFrame(sheet, ty * cols + tx, x * T, y * T);
      }
    }
    rt.endDraw();
    return rt;
  }
}

// 같은 씨앗이면 늘 같은 배치가 나오는 난수
export function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
