// 새 지형 타일(assets/tiles2)로 바닥을 한 번 미리 그려 두는 도구
// 지형 글자: '.' 잔디 · ',' 어두운 숲 바닥 · '=' 흙길 · 'c' 돌 포장길 · '~' 물
//           'h' 언덕 위(걸을 수 있음) · '#' 절벽면(못 지나감) · 'S' 돌계단(지나갈 수 있음)
// - 칸마다 타일을 그냥 붙이지 않고, 칸 정보를 부드럽게 섞고 잡음을 더해 경계를 자연스럽게 만듭니다.
// - 물가에는 원본 타일(물가 13번)의 바위 둑·물보라 띠를 경계를 따라 깔아요.
// - 절벽면·계단은 원본 타일 그림(23번·31번)을 그대로 사용해요.
import { assets } from './AssetManager.js';

export const TILE = 64;
export const TERRAIN_KEYS = ['grass', 'grass_dark', 'dirt', 'cobble', 'water', 'shore', 'cliff', 'stairs', 'plaza'].map((k) => `tiles2/${k}`);

// ---------- 잡음 ----------
const P = new Uint8Array(512);
(() => {
  let s = 987654;
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

export function terrainReady() { return TERRAIN_KEYS.every((k) => assets.get(k)); }
export function loadTerrain() { return Promise.all(TERRAIN_KEYS.map((k) => assets.load(k))); }

function texData(key) {
  const a = assets.get('tiles2/' + key);
  if (!a) return null;
  const c = document.createElement('canvas');
  c.width = a.img.naturalWidth; c.height = a.img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(a.img, 0, 0);
  return { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
}

function field(map, test) {
  const { w, h, grid } = map;
  const f = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) f[y * w + x] = test(grid[y][x]) ? 1 : 0;
  return (px, py) => {
    const u = px / TILE - 0.5, v = py / TILE - 0.5;
    const x0 = Math.floor(u), y0 = Math.floor(v), tx = u - x0, ty = v - y0;
    const at = (x, y) => f[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
    return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
  };
}
function uniform(map, test) {
  const { w, h, grid } = map;
  const u = new Int8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let a = 0, b = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = grid[Math.max(0, Math.min(h - 1, y + dy))][Math.max(0, Math.min(w - 1, x + dx))];
      if (test(c)) a++; else b++;
    }
    u[y * w + x] = a === 0 ? 0 : b === 0 ? 1 : -1;
  }
  return u;
}

// map: { w, h, grid: 문자 2차원 배열, plazas: [[x,y,반지름타일]] }
export function buildTerrain(map) {
  const W = map.w * TILE, H = map.h * TILE;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const T = { grass: texData('grass'), dark: texData('grass_dark'), dirt: texData('dirt'), cobble: texData('cobble'), water: texData('water'), shore: texData('shore') };
  if (!T.grass) { ctx.fillStyle = '#6aa83e'; ctx.fillRect(0, 0, W, H); return { canvas, waterMask: null }; }
  const G = map.grid;
  const isDark = (c) => c === ',';
  const isDirt = (c) => c === '=';
  const isCob = (c) => c === 'c';
  const isWater = (c) => c === '~';
  const fDark = field(map, isDark), fDirt = field(map, isDirt), fCob = field(map, isCob), fWater = field(map, isWater);
  const uDark = uniform(map, isDark), uDirt = uniform(map, isDirt), uCob = uniform(map, isCob), uWater = uniform(map, isWater);
  const smp = (t, x, y) => ((((y % t.h) + t.h) % t.h) * t.w + (((x % t.w) + t.w) % t.w)) * 4;
  const LW = Math.ceil(W / 8) + 1, LH = Math.ceil(H / 8) + 1, LUM = new Float32Array(LW * LH);
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) LUM[y * LW + x] = 1 + noise2(x * 8 + 500, y * 8 + 300, 1 / 200) * 0.14;
  const img = ctx.createImageData(W, H), D = img.data;
  const wm = new Uint8ClampedArray(W * H);

  for (let py = 0; py < H; py++) {
    const cy = (py / TILE) | 0;
    for (let px = 0; px < W; px++) {
      const cx = (px / TILE) | 0, ci = cy * map.w + cx, o = (py * W + px) * 4;
      let i = smp(T.grass, px, py);
      let r = T.grass.d[i], g = T.grass.d[i + 1], b = T.grass.d[i + 2];
      // 어두운 숲 바닥
      const ud = uDark[ci];
      const kd = ud >= 0 ? ud : sstep(0.35, 0.65, fDark(px, py) + noise2(px, py, 1 / 44) * 0.45);
      if (kd > 0 && T.dark) {
        const j = smp(T.dark, px, py);
        r += (T.dark.d[j] - r) * kd; g += (T.dark.d[j + 1] - g) * kd; b += (T.dark.d[j + 2] - b) * kd;
      }
      const lum = LUM[(py >> 3) * LW + (px >> 3)];
      r *= lum; g *= lum; b *= lum;
      // 흙길 · 돌길 (가장자리는 잡음으로 구불구불, 바로 바깥 잔디는 살짝 어둡게)
      for (const [u, f, tex, nOff, edge] of [[uDirt[ci], fDirt, T.dirt, 100, 0.34], [uCob[ci], fCob, T.cobble, 700, 0.22]]) {
        if (u === 0 || !tex) continue;
        let e = 1, band = 0;
        if (u === -1) {
          const v = f(px, py);
          if (v < 0.05) continue;
          const n = noise2(px + nOff, py + 40, 1 / 22);
          e = sstep(0.45, 0.55, v + n * edge);
          band = sstep(0.22, 0.45, v + n * edge) * (1 - e);
        }
        const k = 1 - 0.22 * band;
        i = smp(tex, px, py);
        r = r * k + (tex.d[i] - r * k) * e; g = g * k + (tex.d[i + 1] - g * k) * e; b = b * k + (tex.d[i + 2] - b * k) * e;
      }
      // 물 + 물가 바위 둑
      const uw = uWater[ci];
      if (uw !== 0) {
        const v = uw === 1 ? 1.4 : fWater(px, py) + noise2(px + 900, py + 70, 1 / 30) * 0.24;
        if (v > 0.32) {
          // 물가 바깥쪽: 젖은 흙빛
          const wet = sstep(0.32, 0.5, v) * (v < 0.5 ? 1 : 0);
          if (wet > 0) { const k = 1 - 0.3 * wet; r *= k; g *= k; b *= k * 0.92; }
          if (v >= 0.5) {
            const t = Math.min(1, (v - 0.5) / 0.15);
            if (t < 1 && T.shore) {
              // 경계 → 바위 둑 → 물보라 → 물
              const sy = Math.min(T.shore.h - 1, Math.floor(t * T.shore.h));
              i = smp(T.shore, px + py, sy);
              r = T.shore.d[i]; g = T.shore.d[i + 1]; b = T.shore.d[i + 2];
            } else {
              i = smp(T.water, px, py);
              const deep = sstep(0.7, 1.2, v);
              r = T.water.d[i] * (1 - 0.15 * deep); g = T.water.d[i + 1] * (1 - 0.12 * deep); b = T.water.d[i + 2];
            }
            if (t > 0.55) wm[py * W + px] = 255 * sstep(0.55, 0.9, t);
          }
        }
      }
      // 절벽 바로 아래 그늘 (절벽면 아래 30px 동안 서서히 밝아짐)
      const ly = py - cy * TILE;
      if (cy > 0 && ly < 30 && G[cy - 1][cx] === '#' && G[cy][cx] !== '#' && G[cy][cx] !== 'S') {
        const k = 1 - 0.32 * (1 - ly / 30); r *= k; g *= k; b *= k;
      }
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // 광장 (원형 돌바닥) — 가장자리를 둥글게 잘라 자연스럽게
  const plaza = assets.get('tiles2/plaza');
  for (const [x, y, rad] of map.plazas || []) {
    if (!plaza) break;
    const R = rad * TILE;
    ctx.save();
    ctx.beginPath(); ctx.arc(x * TILE, y * TILE, R, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(plaza.img, x * TILE - R * 1.06, y * TILE - R * 1.06, R * 2.12, R * 2.12);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(60,50,40,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x * TILE, y * TILE, R - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // 절벽면 · 계단 (원본 타일 그림, 바닥을 칸 아래쪽에 맞춤)
  const cliff = assets.get('tiles2/cliff'), stairs = assets.get('tiles2/stairs');
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const c = G[y][x];
      if (c === '#' && cliff) {
        const h = cliff.img.height * (TILE / cliff.img.width);
        ctx.drawImage(cliff.img, x * TILE, (y + 1) * TILE - h, TILE, h);
      } else if (c === 'S' && stairs && G[y][x - 1] !== 'S') {
        // 이어진 계단 칸은 계단 그림 하나로 (양옆 돌벽이 가운데 생기지 않게)
        let n = 1;
        while (G[y][x + n] === 'S') n++;
        const w = n * TILE + 12, h = Math.min(stairs.img.height * (w / stairs.img.width), TILE * 1.75);
        ctx.drawImage(stairs.img, x * TILE - 6, (y + 1) * TILE - h + 14, w, h);
      }
    }
  }
  // 절벽 바로 아래 그림자
  ctx.fillStyle = 'rgba(20,24,10,0.28)';
  for (let y = 0; y < map.h - 1; y++) for (let x = 0; x < map.w; x++) {
    if (G[y][x] === '#' && G[y + 1][x] !== '#' && G[y + 1][x] !== 'S') ctx.fillRect(x * TILE, (y + 1) * TILE, TILE, 7);
  }

  // 물결용 마스크
  const wmc = document.createElement('canvas');
  wmc.width = W; wmc.height = H;
  const wctx = wmc.getContext('2d');
  const wd = wctx.createImageData(W, H);
  for (let k = 0; k < W * H; k++) if (wm[k]) { const o = k * 4; wd.data[o] = wd.data[o + 1] = wd.data[o + 2] = 255; wd.data[o + 3] = wm[k]; }
  wctx.putImageData(wd, 0, 0);
  return { canvas, waterMask: wmc };
}

// 움직이는 물결 (물 위에 같은 물 질감을 천천히 흘려 겹침)
let scratch = null, pattern = null;
export function drawWaterShimmer(ctx, terrain, view, t) {
  const tex = assets.get('tiles2/water');
  if (!terrain?.waterMask || !tex) return;
  const { x, y, w, h } = view;
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
  const g = scratch.getContext('2d');
  g.globalCompositeOperation = 'copy';
  g.drawImage(terrain.waterMask, x, y, w, h, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in';
  if (!pattern) pattern = g.createPattern(tex.img, 'repeat');
  g.save();
  g.translate(-x + t * 10, -y + Math.sin(t * 0.7) * 5);
  g.fillStyle = pattern;
  g.fillRect(x - t * 10 - 128, y - 128, w + 256, h + 256);
  g.restore();
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.drawImage(scratch, x, y);
  ctx.restore();
}
