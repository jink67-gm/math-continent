// 지형 연결 타일 v2(assets/tiles3)로 바닥을 미리 그려 두는 도구 — "듀얼 그리드" 방식
//
// 지형 글자 (칸 = 64px)
//   '.' 잔디   ',' 어두운 잔디(숲)   '=' 흙길   'c' 돌바닥   '~' 물   'b' 다리 밑 물
//   'h' 언덕 위(잔디)   '#' 절벽면   'S' 돌계단
//
// 흙길·물 경계: 칸 4개가 만나는 꼭짓점마다 64px 그림 하나를 고르는 방식(듀얼 그리드).
//   4칸 모두 같으면 바닥 타일(변형 4종 중 하나), 1칸이면 바깥 모서리, 3칸이면 안쪽 모서리,
//   나란한 2칸이면 직선, 대각선 2칸이면 바깥 모서리 2장을 겹쳐서 → 연결 타일 12종이 모두 쓰여요.
//   (연결 타일의 잔디 부분은 기본 잔디와 픽셀이 같아서, 흙·물 부분만 오려 낸 그림을 잔디 위에 덮어요)
import { assets } from './AssetManager.js';

export const TILE = 64;
const PIECES = ['straight_n', 'straight_e', 'straight_s', 'straight_w', 'outer_nw', 'outer_ne', 'outer_se', 'outer_sw', 'inner_nw', 'inner_ne', 'inner_se', 'inner_sw'];
export const AUTO_KEYS = [
  ...['grass', 'grass_dark', 'cobble', 'plaza', 'cliff', 'stairs'].map((k) => `tiles2/${k}`),
  ...['dirt', 'water'].flatMap((m) => [...PIECES.map((p) => `tiles3/${m}_${p}`), ...[0, 1, 2, 3].map((i) => `tiles3/${m}_${i}`)]),
];
export const autoReady = () => AUTO_KEYS.every((k) => assets.get(k));
export const loadAuto = () => Promise.all(AUTO_KEYS.map((k) => assets.load(k)));

// ---------- 잡음 ----------
const P = new Uint8Array(512);
(() => {
  let s = 424242;
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
  const a = assets.get(key);
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
function hash(x, y) { return Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1; }

// 꼭짓점(i, j)의 네 칸이 재질인지 → 그릴 조각들
function piecesFor(nw, ne, sw, se) {
  const n = nw + ne + sw + se;
  if (n === 0) return [];
  if (n === 4) return ['full'];
  if (n === 1) return [nw ? 'outer_nw' : ne ? 'outer_ne' : se ? 'outer_se' : 'outer_sw'];
  if (n === 3) return [!nw ? 'inner_nw' : !ne ? 'inner_ne' : !se ? 'inner_se' : 'inner_sw'];
  if (nw && ne) return ['straight_n'];
  if (ne && se) return ['straight_e'];
  if (se && sw) return ['straight_s'];
  if (sw && nw) return ['straight_w'];
  return nw ? ['outer_nw', 'outer_se'] : ['outer_ne', 'outer_sw'];
}

// map: { w, h, grid, plazas:[[x,y,r]], style:'snow'|'cube'|..., faceShift(px), noShimmer }
export function buildAutoTerrain(map) {
  const W = map.w * TILE, H = map.h * TILE;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const G = map.grid;
  const cell = (x, y) => G[Math.max(0, Math.min(map.h - 1, y))][Math.max(0, Math.min(map.w - 1, x))];

  // ---- 1) 잔디 · 어두운 잔디 · 돌바닥 (부드럽게 섞음) ----
  const T = { grass: texData('tiles2/grass'), dark: texData('tiles2/grass_dark'), cob: texData('tiles2/cobble') };
  if (!T.grass) { ctx.fillStyle = '#6aa83e'; ctx.fillRect(0, 0, W, H); return { canvas, waterMask: null }; }
  const isDark = (c) => c === ',';
  const isCob = (c) => c === 'c';
  const fDark = field(map, isDark), fCob = field(map, isCob);
  const uni = (test) => {
    const u = new Int8Array(map.w * map.h);
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      let a = 0, b = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) (test(cell(x + dx, y + dy)) ? a++ : b++);
      u[y * map.w + x] = a === 0 ? 0 : b === 0 ? 1 : -1;
    }
    return u;
  };
  const uDark = uni(isDark), uCob = uni(isCob);
  const smp = (t, x, y) => ((((y % t.h) + t.h) % t.h) * t.w + (((x % t.w) + t.w) % t.w)) * 4;
  const LW = Math.ceil(W / 8) + 1, LUM = new Float32Array(LW * (Math.ceil(H / 8) + 1));
  for (let y = 0; y <= H / 8; y++) for (let x = 0; x < LW; x++) LUM[y * LW + x] = 1 + noise2(x * 8 + 500, y * 8 + 300, 1 / 220) * 0.13;
  const img = ctx.createImageData(W, H), D = img.data;
  for (let py = 0; py < H; py++) {
    const cy = (py / TILE) | 0;
    for (let px = 0; px < W; px++) {
      const ci = cy * map.w + ((px / TILE) | 0), o = (py * W + px) * 4;
      let i = smp(T.grass, px, py);
      let r = T.grass.d[i], g = T.grass.d[i + 1], b = T.grass.d[i + 2];
      const ud = uDark[ci];
      const kd = ud >= 0 ? ud : sstep(0.35, 0.65, fDark(px, py) + noise2(px, py, 1 / 44) * 0.45);
      if (kd > 0 && T.dark) {
        const j = smp(T.dark, px, py);
        r += (T.dark.d[j] - r) * kd; g += (T.dark.d[j + 1] - g) * kd; b += (T.dark.d[j + 2] - b) * kd;
      }
      const lum = LUM[(py >> 3) * LW + (px >> 3)];
      r *= lum; g *= lum; b *= lum;
      const uc = uCob[ci];
      if (uc !== 0 && T.cob) {
        let e = 1, band = 0;
        if (uc === -1) {
          const v = fCob(px, py), n = noise2(px + 700, py + 40, 1 / 22);
          e = sstep(0.45, 0.55, v + n * 0.22);
          band = sstep(0.22, 0.45, v + n * 0.22) * (1 - e);
        }
        if (e > 0 || band > 0) {
          const k = 1 - 0.2 * band;
          i = smp(T.cob, px, py);
          r = r * k + (T.cob.d[i] - r * k) * e; g = g * k + (T.cob.d[i + 1] - g * k) * e; b = b * k + (T.cob.d[i + 2] - b * k) * e;
        }
      }
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // ---- 2) 흙길 · 물 : 듀얼 그리드 연결 타일 ----
  const wmc = document.createElement('canvas');
  wmc.width = W; wmc.height = H;
  const wctx = wmc.getContext('2d');
  const isDirt = (c) => c === '=' || c === 'S';
  const isWater = (c) => c === '~' || c === 'b';
  const lay = (mat, test, g2) => {
    for (let j = 0; j <= map.h; j++) {
      for (let i = 0; i <= map.w; i++) {
        const nw = +test(cell(i - 1, j - 1)), ne = +test(cell(i, j - 1)), sw = +test(cell(i - 1, j)), se = +test(cell(i, j));
        const list = piecesFor(nw, ne, sw, se);
        const x = (i - 0.5) * TILE, y = (j - 0.5) * TILE;
        for (const p of list) {
          const key = p === 'full' ? `tiles3/${mat}_${Math.floor(hash(i, j) * 4)}` : `tiles3/${mat}_${p}`;
          const a = assets.get(key);
          if (!a) continue;
          ctx.drawImage(a.img, x, y, TILE, TILE);
          if (g2) g2.drawImage(a.img, x, y, TILE, TILE);
        }
      }
    }
  };
  lay('dirt', isDirt);
  // 눈 마을: 땅을 하얗게 (물은 아래에서 얼음색으로)
  if (map.style === 'snow') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(128,128,128,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(190,210,235,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  lay('water', isWater, wctx);
  if (map.style === 'snow') {
    // 얼음: 물 부분만 밝게
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    const ice = document.createElement('canvas');
    ice.width = W; ice.height = H;
    const ic = ice.getContext('2d');
    ic.drawImage(wmc, 0, 0);
    ic.globalCompositeOperation = 'source-in';
    ic.fillStyle = 'rgba(215,240,255,0.55)';
    ic.fillRect(0, 0, W, H);
    ctx.drawImage(ice, 0, 0);
    ctx.restore();
  }

  // ---- 3) 광장 (원형 돌바닥) ----
  const plaza = assets.get('tiles2/plaza');
  for (const [x, y, rad, ry] of map.plazas || []) {
    if (!plaza) break;
    const R = rad * TILE, RY = (ry ?? rad) * TILE;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, R, RY, 0, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(plaza.img, x - R * 1.05, y - RY * 1.05, R * 2.1, RY * 2.1);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(60,50,40,.4)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y, R - 1, RY - 1, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // ---- 4) 절벽면 · 계단 ----
  const cliff = assets.get('tiles2/cliff'), stairs = assets.get('tiles2/stairs');
  const shift = map.faceShift || 0;
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const c = G[y][x];
      if (c === '#' && cliff) {
        const h = cliff.img.height * (TILE / cliff.img.width);
        ctx.drawImage(cliff.img, x * TILE, (y + 1) * TILE - h + shift, TILE, h);
      } else if (c === 'S' && stairs && G[y][x - 1] !== 'S') {
        let n = 1;
        while (G[y][x + n] === 'S') n++;
        const w = n * TILE + 12, h = Math.min(stairs.img.height * (w / stairs.img.width), TILE * 1.75);
        ctx.drawImage(stairs.img, x * TILE - 6, (y + 1) * TILE - h + 14 + shift, w, h);
      }
    }
  }
  ctx.fillStyle = 'rgba(20,24,10,0.26)';
  for (let y = 0; y < map.h - 1; y++) for (let x = 0; x < map.w; x++) {
    if (G[y][x] === '#' && G[y + 1][x] !== '#' && G[y + 1][x] !== 'S') ctx.fillRect(x * TILE, (y + 1) * TILE + shift, TILE, 8);
  }
  // 물이 있는 칸들의 범위(물결은 이 안에서만 그려요 — 화면 전체를 매 프레임 다시 그리지 않도록)
  const waterBoxes = [];
  map.grid.forEach((row, ry) => {
    let x0 = -1;
    for (let rx = 0; rx <= row.length; rx++) {
      const wet = rx < row.length && (row[rx] === '~' || row[rx] === 'b');
      if (wet && x0 < 0) x0 = rx;
      if (!wet && x0 >= 0) { waterBoxes.push({ x: x0 * TILE - TILE / 2, y: ry * TILE - TILE / 2, w: (rx - x0) * TILE + TILE, h: TILE * 2 }); x0 = -1; }
    }
  });
  return { canvas, waterMask: map.noShimmer ? null : wmc, waterBoxes };
}

// 물결 (물 위에 같은 물 그림을 천천히 흘려 겹침)
let scratch = null, pattern = null;
export function drawAutoShimmer(ctx, terrain, view, t) {
  const tex = assets.get('tiles3/water_0');
  if (!terrain?.waterMask || !tex) return;
  // 화면에 보이는 물 범위만 (물이 안 보이면 아무것도 안 함)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of terrain.waterBoxes || [{ x: view.x, y: view.y, w: view.w, h: view.h }]) {
    const ax = Math.max(view.x, b.x), ay = Math.max(view.y, b.y);
    const bx = Math.min(view.x + view.w, b.x + b.w), by = Math.min(view.y + view.h, b.y + b.h);
    if (bx <= ax || by <= ay) continue;
    x0 = Math.min(x0, ax); y0 = Math.min(y0, ay); x1 = Math.max(x1, bx); y1 = Math.max(y1, by);
  }
  if (x1 <= x0 || y1 <= y0) return;
  const x = Math.floor(x0), y = Math.floor(y0), w = Math.ceil(x1 - x), h = Math.ceil(y1 - y);
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width < w || scratch.height < h) { scratch.width = Math.max(w, scratch.width); scratch.height = Math.max(h, scratch.height); }
  const g = scratch.getContext('2d');
  g.globalCompositeOperation = 'copy';
  g.drawImage(terrain.waterMask, x, y, w, h, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in';
  if (!pattern) pattern = g.createPattern(tex.img, 'repeat');
  g.save();
  g.translate(-x + t * 9, -y + Math.sin(t * 0.7) * 5);
  g.fillStyle = pattern;
  g.fillRect(x - t * 9 - 128, y - 128, w + 256, h + 256);
  g.restore();
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.drawImage(scratch, 0, 0, w, h, x, y, w, h);
  ctx.restore();
}

// ---------- 지도 만들기 도구 ----------
export function makeGrid(w, h, ch = '.') { return Array.from({ length: h }, () => Array(w).fill(ch)); }
export function fillRect(g, x0, y0, x1, y1, ch, only) {
  for (let y = Math.max(0, y0); y <= Math.min(g.length - 1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(g[0].length - 1, x1); x++) if (!only || only.includes(g[y][x])) g[y][x] = ch;
}
export function fillEllipse(g, cx, cy, rx, ry, ch, only) {
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1 && (!only || only.includes(g[y][x]))) g[y][x] = ch;
  }
}
// 굵은 선 (픽셀 좌표의 점들을 잇는 길) — 반지름 r 픽셀 안의 칸을 칠함
export function fillPath(g, pts, r, ch, only) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      const px = (x + 0.5) * TILE, py = (y + 0.5) * TILE, vx = bx - ax, vy = by - ay;
      const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
      if (Math.hypot(px - (ax + vx * t), py - (ay + vy * t)) <= r && (!only || only.includes(g[y][x]))) g[y][x] = ch;
    }
  }
}
// 2차 곡선을 점으로
export function quad(a, c, b, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}
