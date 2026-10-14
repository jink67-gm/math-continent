// 바닥 그리기 (맵을 처음 열 때 한 번 미리 그려 둠)
// - 타일을 칸마다 붙이지 않고, 칸 정보를 부드럽게 보간 + 잡음으로 경계를 자연스럽게 섞습니다.
//   (원본 타일은 격자선·이음새가 있어 칸 단위로 붙이면 바둑판처럼 보임 → tile_report.json 참고)
// - 나무 덮개(canopy)는 따로 그려서 캐릭터와 앞뒤 순서를 맞춥니다.
import { TILE } from './maps.js';
import { img } from './images.js';

export const LIFT = 46; // 나무 덮개가 칸 위로 솟아오르는 높이(px)

// ---------- 잡음 ----------
const P = new Uint8Array(512);
(() => {
  let s = 1234567;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
})();
const fade = (t) => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => P[(P[a & 255] + b) & 255] / 255;
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v - 0.5;
}
const noise2 = (x, y, f) => vnoise(x * f, y * f) + 0.5 * vnoise(x * f * 2.3 + 17, y * f * 2.3 + 9);
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function texData(key) {
  const im = img.get('tiles/' + key);
  if (!im) return null;
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, 0, 0);
  return { d: g.getImageData(0, 0, c.width, c.height).data, s: c.width };
}
// 칸 값 (0/1) 배열에서 부드러운 값 얻기 (칸 가운데 기준 선형 보간)
function field(map, test) {
  const { w, h, grid } = map;
  const f = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) f[y * w + x] = test(grid[y][x], x, y) ? 1 : 0;
  return (px, py) => {
    const u = px / TILE - 0.5, v = py / TILE - 0.5;
    let x0 = Math.floor(u), y0 = Math.floor(v);
    const tx = u - x0, ty = v - y0;
    const at = (x, y) => f[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  };
}

export function isFace(map, x, y) {
  return map.grid[y]?.[x] === '#' && map.grid[y + 1]?.[x] !== '#' && map.grid[y + 1]?.[x] !== undefined;
}

// ---------- 바닥 + 물 마스크 + 나무 덮개 만들기 ----------
export function buildTerrain(map) {
  const W = map.w * TILE, H = map.h * TILE;
  const T = {
    grass: texData('grass'), dark: texData('grass_dark'), dirt: texData('dirt'), water: texData('water'),
    canopy: texData('canopy'), cliff: texData('cliff_top'), fall: texData('waterfall'),
  };
  const ok = T.grass && T.dirt && T.water;
  const ground = document.createElement('canvas');
  ground.width = W; ground.height = H;
  const gctx = ground.getContext('2d');
  const out = { ground, W, H, canopy: null, waterMask: null, canopyCells: [], ok };
  if (!ok) { gctx.fillStyle = '#5b8a3a'; gctx.fillRect(0, 0, W, H); return out; }

  const G = map.grid;
  const fDark = field(map, (c) => c === ',' || c === 'T');
  const fDirt = field(map, (c) => c === '=');
  const fWater = field(map, (c) => c === '~' || c === 'b' || c === 'W');
  const fTree = field(map, (c) => c === 'T');
  const fCliff = field(map, (c) => c === '#');

  const gd = gctx.createImageData(W, H), D = gd.data;
  const wm = new Uint8ClampedArray(W * H);
  const samp = (t, x, y) => { const s = t.s; return ((y & (s - 1)) * s + (x & (s - 1))) * 4; };
  // 칸 주변 3×3이 모두 같은 지형이면 그 칸 안은 보간·잡음 계산을 건너뜀 (속도)
  const uni = (test) => {
    const u = new Int8Array(map.w * map.h); // -1 섞임, 0 전부 아님, 1 전부 맞음
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      let a = 0, b = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const c = G[Math.max(0, Math.min(map.h - 1, y + dy))][Math.max(0, Math.min(map.w - 1, x + dx))];
        if (test(c)) a++; else b++;
      }
      u[y * map.w + x] = a === 0 ? 0 : b === 0 ? 1 : -1;
    }
    return u;
  };
  const uDark = uni((c) => c === ',' || c === 'T'), uDirt = uni((c) => c === '=');
  const uWater = uni((c) => c === '~' || c === 'b' || c === 'W'), uTree = uni((c) => c === 'T'), uCliff = uni((c) => c === '#');
  // 넓은 밝기 얼룩은 8px 간격으로 미리 계산
  const LW = Math.ceil(W / 8) + 1, LH = Math.ceil(H / 8) + 1, LUM = new Float32Array(LW * LH);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) LUM[y * LW + x] = 1 + noise2(x * 8 + 500, y * 8 + 300, 1 / 180) * 0.16;

  for (let py = 0; py < H; py++) {
    const cy = (py / TILE) | 0;
    for (let px = 0; px < W; px++) {
      const cx = (px / TILE) | 0;
      const ci = cy * map.w + cx;
      const ch = G[cy][cx];
      const o = (py * W + px) * 4;
      let r, g, b;
      // 잔디 ↔ 어두운 숲 바닥
      const ud = uDark[ci];
      const kd = ud >= 0 ? ud : sstep(0.35, 0.65, fDark(px, py) + noise2(px, py, 1 / 46) * 0.45);
      let i = samp(T.grass, px, py);
      if (kd === 0) { r = T.grass.d[i]; g = T.grass.d[i + 1]; b = T.grass.d[i + 2]; }
      else {
        const j = samp(T.dark, px, py);
        r = T.grass.d[i] + (T.dark.d[j] - T.grass.d[i]) * kd;
        g = T.grass.d[i + 1] + (T.dark.d[j + 1] - T.grass.d[i + 1]) * kd;
        b = T.grass.d[i + 2] + (T.dark.d[j + 2] - T.grass.d[i + 2]) * kd;
      }
      const lum = LUM[(py >> 3) * LW + (px >> 3)];
      r *= lum; g *= lum; b *= lum;
      // 나무 그늘 (덮개 아래쪽 바닥)
      if (uTree[ci] === -1) {
        const sh = sstep(0.25, 0.75, fTree(px, py - 22)) * (1 - sstep(0.4, 0.6, fTree(px, py)));
        if (sh > 0) { const k = 1 - 0.38 * sh; r *= k; g *= k; b *= k; }
      }
      // 흙길
      const udi = uDirt[ci];
      if (udi === 1) { i = samp(T.dirt, px, py); r = T.dirt.d[i]; g = T.dirt.d[i + 1]; b = T.dirt.d[i + 2]; }
      else if (udi === -1) {
        const vd = fDirt(px, py);
        if (vd > 0.05) {
          const n2 = noise2(px + 100, py + 40, 1 / 22);
          const e = sstep(0.44, 0.56, vd + n2 * 0.34);
          const band = sstep(0.2, 0.42, vd + n2 * 0.34) * (1 - e);
          const k = 1 - 0.2 * band;
          i = samp(T.dirt, px, py);
          r = r * k + (T.dirt.d[i] - r * k) * e;
          g = g * k + (T.dirt.d[i + 1] - g * k) * e;
          b = b * k + (T.dirt.d[i + 2] - b * k) * e;
        }
      }
      // 물 + 물가
      const uw = uWater[ci];
      if (uw !== 0) {
        const vw = uw === 1 ? 1 : fWater(px, py);
        if (vw > 0.03) {
          const v = uw === 1 ? 1.2 : vw + noise2(px + 900, py + 70, 1 / 26) * 0.26;
          const e = sstep(0.55, 0.61, v);
          const wet = sstep(0.3, 0.55, v) * (1 - e);
          if (wet > 0) { const k = 1 - 0.34 * wet; r *= k; g *= k * 0.98; b *= k * 0.92; }
          if (e > 0) {
            i = samp(T.water, px, py);
            const deep = sstep(0.55, 0.95, v);
            let wr = T.water.d[i] * (1 - 0.18 * deep), wg = T.water.d[i + 1] * (1 - 0.14 * deep), wb = T.water.d[i + 2];
            const foam = (1 - sstep(0.58, 0.68, v)) * 0.7;
            wr += (235 - wr) * foam; wg += (245 - wg) * foam; wb += (250 - wb) * foam;
            r += (wr - r) * e; g += (wg - g) * e; b += (wb - b) * e;
            wm[py * W + px] = e * 255;
          }
        }
      }
      // 절벽: 고원(윗면)은 밝은 잔디, 맨 아래 줄은 절벽면
      if (ch === '#' || ch === 'W') {
        const ly = py - cy * TILE;
        if (ch === 'W' && T.fall) {
          i = samp(T.fall, px, ly); r = T.fall.d[i]; g = T.fall.d[i + 1]; b = T.fall.d[i + 2];
        } else if (isFace(map, cx, cy) && T.cliff) {
          i = samp(T.cliff, px, ly); r = T.cliff.d[i]; g = T.cliff.d[i + 1]; b = T.cliff.d[i + 2];
        } else { r *= 1.08; g *= 1.1; b *= 1.02; }
      } else if (uCliff[ci] === -1) {
        // 절벽 아래 그늘
        const cs = fCliff(px, py - 30);
        if (cs > 0.02) { const k = 1 - 0.32 * sstep(0, 1, cs); r *= k; g *= k; b *= k; }
      }
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = 255;
    }
  }
  gctx.putImageData(gd, 0, 0);

  // 다리 (물 위에 덮기)
  const bridge = img.get('tiles/bridge');
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    if (G[y][x] === 'b' && bridge) gctx.drawImage(bridge, x * TILE, y * TILE, TILE, TILE);
  }

  // 물 마스크 (물결 움직임용)
  const wmc = document.createElement('canvas');
  wmc.width = W; wmc.height = H;
  const wctx = wmc.getContext('2d');
  const wd = wctx.createImageData(W, H);
  for (let k = 0; k < W * H; k++) {
    const a = wm[k];
    if (a) { const o = k * 4; wd.data[o] = 255; wd.data[o + 1] = 255; wd.data[o + 2] = 255; wd.data[o + 3] = a; }
  }
  // 다리 칸은 물결 제외
  wctx.putImageData(wd, 0, 0);
  wctx.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (G[y][x] === 'b') wctx.fillRect(x * TILE, y * TILE + 6, TILE, TILE - 12);
  out.waterMask = wmc;

  // ---------- 나무 덮개 ----------
  if (T.canopy) {
    const cc = document.createElement('canvas');
    cc.width = W; cc.height = H;
    const cctx = cc.getContext('2d');
    const cd = cctx.createImageData(W, H), C = cd.data;
    // 덮개 덮임 정도를 한 번만 계산 (나무 칸 근처만)
    const COV = new Float32Array(W * H);
    const near = (cx, cy) => {
      for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (G[cy + dy]?.[cx + dx] === 'T') return true;
      return false;
    };
    for (let cy = 0; cy < map.h; cy++) for (let cx = 0; cx < map.w; cx++) {
      if (!near(cx, cy)) continue;
      const inner = uTree[cy * map.w + cx] === 1;
      for (let py = cy * TILE; py < cy * TILE + TILE; py++) for (let px = cx * TILE; px < cx * TILE + TILE; px++) {
        const base = inner ? 1 : Math.max(fTree(px, py), fTree(px, py + LIFT) * 0.98);
        if (base < 0.08) continue;
        COV[py * W + px] = base + noise2(px + 300, py + 200, 1 / 38) * 0.8 + noise2(px, py, 1 / 13) * 0.16;
      }
    }
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const v = COV[py * W + px];
        if (v <= 0.46) continue;
        const e = sstep(0.46, 0.56, v);
        const i = samp(T.canopy, px, py);
        let k = 1;
        if (py >= 9 && COV[(py - 9) * W + px] < 0.5) k *= 1.22;            // 윗부분 햇빛
        if (py + 12 < H && COV[(py + 12) * W + px] < 0.5) k *= 0.62;       // 아랫부분 그늘
        k *= LUM[(py >> 3) * LW + (px >> 3)] * (1 + noise2(px + 70, py + 20, 1 / 26) * 0.32); // 나무 하나하나 명암
        const o = (py * W + px) * 4;
        C[o] = T.canopy.d[i] * k; C[o + 1] = T.canopy.d[i + 1] * k; C[o + 2] = T.canopy.d[i + 2] * k * 0.95; C[o + 3] = e * 255;
      }
    }
    cctx.putImageData(cd, 0, 0);
    out.canopy = cc;
    // 칸마다 잘라서 그리는 조각 (캐릭터와 앞뒤 정렬용)
    const isT = (x, y) => G[y]?.[x] === 'T';
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      if (!isT(x, y)) continue;
      const pl = isT(x - 1, y) ? 0 : 30, pr = isT(x + 1, y) ? 0 : 30;
      const pt = isT(x, y - 1) ? 0 : LIFT + 24, pb = isT(x, y + 1) ? 0 : 26;
      const sx = Math.max(0, x * TILE - pl), sy = Math.max(0, y * TILE - pt);
      const ex = Math.min(W, x * TILE + TILE + pr), ey = Math.min(H, y * TILE + TILE + pb);
      out.canopyCells.push({ sx, sy, sw: ex - sx, sh: ey - sy, base: y * TILE + TILE - 10, cx: x, cy: y });
    }
  }

  // ---------- 꽃·덤불 장식 ----------
  drawDecals(gctx, map);
  return out;
}

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function drawDecals(g, map) {
  const R = rng(map.id === 'village' ? 11 : 29);
  const put = (name, x, y, s = 1, flip = false) => {
    const im = img.get('tiles/decal_' + name);
    if (!im) return;
    g.save();
    g.translate(x, y);
    if (flip) g.scale(-1, 1);
    g.globalAlpha = 0.95;
    g.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
    g.restore();
  };
  for (const [n, x, y] of map.decals || []) put(n, x * TILE, y * TILE, 1, R() < 0.5);
  const pool = map.id === 'village'
    ? ['flower_blue', 'flower_yellow', 'flower_rose', 'daisy', 'wildflower', 'daisy', 'bush_flower']
    : ['bush_flower', 'wildflower', 'daisy', 'bush_flower', 'flower_blue', 'wildflower'];
  const G = map.grid;
  const clear = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = G[y + dy]?.[x + dx];
      if (c !== '.' && c !== ',') return false;
    }
    return true;
  };
  let placed = 0, tries = 0;
  while (placed < (map.randomDecals || 0) && tries++ < 3000) {
    const x = 1 + Math.floor(R() * (map.w - 2)), y = 1 + Math.floor(R() * (map.h - 2));
    if (!clear(x, y)) continue;
    if (map.buildings?.some((b) => Math.abs(b.x - x - 0.5) < 2.6 && y + 0.5 > b.y - 3.5 && y + 0.5 < b.y + 0.8)) continue;
    put(pool[Math.floor(R() * pool.length)], (x + 0.2 + R() * 0.6) * TILE, (y + 0.2 + R() * 0.6) * TILE, 0.75 + R() * 0.35, R() < 0.5);
    placed++;
  }
}

// ---------- 비교용: 원본 타일을 칸마다 그대로 붙인 바닥 ----------
export function buildRawGround(map) {
  const W = map.w * TILE, H = map.h * TILE;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const RAW = { '.': '31', ',': '04', '=': '03', '~': '27', T: '07', b: '29', W: '28' };
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const ch = map.grid[y][x];
    let key = RAW[ch];
    if (ch === '#') key = isFace(map, x, y) ? '08' : '31';
    if (ch === 'b') { const w = img.get('raw/27'); if (w) g.drawImage(w, x * TILE, y * TILE); }
    const im = img.get('raw/' + key);
    if (im) g.drawImage(im, x * TILE, y * TILE, TILE, TILE);
  }
  return c;
}

// ---------- 경계 검사: 64px 격자선을 따라 색이 갑자기 끊기는 곳 찾기 ----------
export function findSeams(canvas, map) {
  const W = canvas.width, H = canvas.height;
  const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const px = (x, y) => { const o = (y * W + x) * 4; return [d[o], d[o + 1], d[o + 2]]; };
  const diff = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  const seams = [];
  // 세로선 (x = 칸 경계)
  for (let cx = 1; cx < map.w; cx++) for (let cy = 0; cy < map.h; cy++) {
    const x = cx * TILE; let across = 0, inside = 0;
    for (let y = cy * TILE + 4; y < cy * TILE + TILE - 4; y += 2) {
      across += diff(px(x - 1, y), px(x, y));
      inside += (diff(px(x - 3, y), px(x - 2, y)) + diff(px(x + 1, y), px(x + 2, y))) / 2;
    }
    if (across > 2.1 * inside + 300) seams.push({ x0: x, y0: cy * TILE, x1: x, y1: cy * TILE + TILE, k: across / (inside + 1) });
  }
  // 가로선
  for (let cy = 1; cy < map.h; cy++) for (let cx = 0; cx < map.w; cx++) {
    const y = cy * TILE; let across = 0, inside = 0;
    for (let x = cx * TILE + 4; x < cx * TILE + TILE - 4; x += 2) {
      across += diff(px(x, y - 1), px(x, y));
      inside += (diff(px(x, y - 3), px(x, y - 2)) + diff(px(x, y + 1), px(x, y + 2))) / 2;
    }
    if (across > 2.1 * inside + 300) seams.push({ x0: cx * TILE, y0: y, x1: cx * TILE + TILE, y1: y, k: across / (inside + 1) });
  }
  return seams;
}
