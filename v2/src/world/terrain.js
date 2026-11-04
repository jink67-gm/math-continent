// 땅 그리기 (tiles3 64px 타일)
// 지도는 "꼭짓점 격자"로 적어요. 타일 하나는 네 모서리(nw, ne, sw, se)가 흙/물인지에 따라
// 알맞은 가장자리 조각이 골라져서, 길과 물가가 끊김 없이 이어져요.

export const T = 64;

const PIECE = {
  15: null, // 가득 참 → _0~_3 중 하나
  8: ['outer_nw'], 4: ['outer_ne'], 2: ['outer_sw'], 1: ['outer_se'],
  12: ['straight_n'], 3: ['straight_s'], 10: ['straight_w'], 5: ['straight_e'],
  14: ['inner_se'], 13: ['inner_sw'], 11: ['inner_ne'], 7: ['inner_nw'],
  9: ['outer_nw', 'outer_se'], 6: ['outer_ne', 'outer_sw'],
};

export class TerrainGrid {
  constructor(cols, rows, fill = 'g') {
    this.cols = cols;
    this.rows = rows;
    this.v = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(fill));
  }

  get(x, y) {
    if (x < 0 || y < 0 || y > this.rows || x > this.cols) return 'g';
    return this.v[y][x];
  }

  set(x, y, t) {
    if (x < 0 || y < 0 || y > this.rows || x > this.cols) return;
    this.v[y][x] = t;
  }

  // 꼭짓점 사각형 (양 끝 포함)
  rect(x0, y0, x1, y1, t) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t);
  }

  // 꼭짓점 원
  circle(cx, cy, r, t) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, t);
      }
    }
  }

  mask(tx, ty, t) {
    return (this.get(tx, ty) === t ? 8 : 0) | (this.get(tx + 1, ty) === t ? 4 : 0)
      | (this.get(tx, ty + 1) === t ? 2 : 0) | (this.get(tx + 1, ty + 1) === t ? 1 : 0);
  }

  // 물이 타일의 절반 이상이면 못 지나가요
  blocked(tx, ty) {
    const m = this.mask(tx, ty, 'w');
    let n = 0;
    for (let b = m; b; b >>= 1) n += b & 1;
    return n >= 2;
  }

  // 막힌 타일을 가로로 이어 붙인 사각형 목록 (충돌용)
  solidRects() {
    const out = [];
    for (let ty = 0; ty < this.rows; ty++) {
      let start = -1;
      for (let tx = 0; tx <= this.cols; tx++) {
        const b = tx < this.cols && this.blocked(tx, ty);
        if (b && start < 0) start = tx;
        if (!b && start >= 0) {
          out.push({ x: start * T, y: ty * T, w: (tx - start) * T, h: T });
          start = -1;
        }
      }
    }
    return out;
  }

  // 전체 땅을 RenderTexture 한 장에 구워요 (매 프레임 타일을 그리지 않아도 돼요)
  bake(scene, rnd) {
    const rt = scene.add.renderTexture(0, 0, this.cols * T, this.rows * T).setOrigin(0, 0);
    const pick = (base) => `${base}_${Math.floor(rnd() * 4)}`;
    rt.beginDraw();
    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        const x = tx * T;
        const y = ty * T;
        rt.batchDraw(pick('tiles3/grass'), x, y);
        for (const t of ['d', 'w']) {
          const m = this.mask(tx, ty, t);
          if (!m) continue;
          const base = t === 'd' ? 'tiles3/dirt' : 'tiles3/water';
          if (m === 15) rt.batchDraw(pick(base), x, y);
          else for (const p of PIECE[m]) rt.batchDraw(`${base}_${p}`, x, y);
        }
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
