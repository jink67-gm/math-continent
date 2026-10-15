// 마을 광장 바닥 — 새 광장 타일(assets/plaza7)을 이어 붙여 만들어요 (큰 원형 그림 한 장 대신)
//  1) 돌바닥 타일 7종을 96px 격자로 깔고, 이웃 타일과 12px씩 부드럽게 겹쳐 이음매를 없앰
//  2) 광장 모양 = 모서리가 둥근 네모(초타원) + 잡음 → 잔디와 닿는 가장자리가 들쭉날쭉 자연스럽게
//  3) 길이 들어오는 곳(북·남·굽은 길 4곳)에는 '흙길→돌바닥' 이음 타일을 길 방향으로 놓음
//  4) 가장자리에는 작은 돌 조각·풀 덤불 타일을 흩어 놓아 경계선이 튀지 않게 (외곽선 없음)
import { assets } from './AssetManager.js';

const K = (n) => `plaza7/${n}`;
const STONES = ['stone_a', 'stone_b', 'stone_c', 'stone_d', 'stone_e', 'stone_f', 'stone_g'];
const JOINS = ['dirt_join_a', 'dirt_join_b', 'dirt_join_c', 'dirt_join_d'];
const EDGE_BITS = ['patch_a', 'patch_b', 'patch_c', 'patch_d', 'patch_e', 'bits_a', 'bits_b', 'bits_c', 'bits_d', 'tuft_stones', 'pebbles_a'];
const TUFTS = ['tuft_a', 'tuft_b', 'tuft_c'];
export const PLAZA_KEYS = [...STONES, ...JOINS, ...EDGE_BITS, ...TUFTS].map(K);
export const plazaReady = () => PLAZA_KEYS.every((k) => assets.get(k));
export const loadPlaza = () => Promise.all(PLAZA_KEYS.map((k) => assets.load(k)));

const hash = (x, y) => Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => hash(a * 1.13 + 3.1, b * 0.91 - 7.7);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v - 0.5;
}
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// 가장자리를 부드럽게 만든 타일 (한 번 만들어 재사용)
const featherCache = new Map();
function feathered(name, size, F, flipY = false) {
  const ck = `${name}|${size}|${F}|${flipY}`;
  if (featherCache.has(ck)) return featherCache.get(ck);
  const a = assets.get(K(name));
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  // 원본 바깥 3px(배경 제거 흔적)은 잘라 내고 그림
  const m = 3;
  if (flipY) { g.translate(0, size); g.scale(1, -1); }
  g.drawImage(a.img, m, m, a.m.w - m * 2, a.m.h - m * 2, 0, 0, size, size);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const id = g.getImageData(0, 0, size, size), D = id.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.min(x, y, size - 1 - x, size - 1 - y);
    const n = vnoise(x / 9, y / 9) * 0.5;
    const k = sstep(0, 1, d / F + n);
    D[(y * size + x) * 4 + 3] *= k;
  }
  g.putImageData(id, 0, 0);
  featherCache.set(ck, c);
  return c;
}

// spec: { x, y, a, b, joins: [[x, y, angle(rad: 흙이 있는 쪽)], ...], seed }
export function drawTilePlaza(ctx, spec) {
  if (!plazaReady()) return false;
  const { x: cx, y: cy, a, b } = spec;
  const S = 96, F = 12, step = S - F;
  const pad = S;
  const W = Math.ceil(a * 2 + pad * 2), H = Math.ceil(b * 2 + pad * 2);
  const ox = cx - W / 2, oy = cy - H / 2;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const g = off.getContext('2d', { willReadFrequently: true });
  // 1) 돌바닥 타일 격자 (반 칸씩 엇갈려 줄무늬가 안 보이게)
  for (let j = -1; j * step < H + S; j++) {
    for (let i = -1; i * step < W + S; i++) {
      const shift = (j % 2) * (step / 2);
      const name = STONES[Math.floor(hash(i + 11 * (spec.seed || 1), j - 5) * STONES.length) % STONES.length];
      g.drawImage(feathered(name, S, F), i * step - shift, j * step);
    }
  }
  // 2) 광장 모양 (초타원 + 잡음) 바깥은 지우기
  const id = g.getImageData(0, 0, W, H), D = id.data;
  const n = 3.4;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = Math.abs(x + ox - cx) / a, dy = Math.abs(y + oy - cy) / b;
    const v = Math.pow(dx, n) + Math.pow(dy, n);
    const e = v + vnoise((x + ox) / 38, (y + oy) / 38) * 0.32 + vnoise((x + ox) / 13, (y + oy) / 13) * 0.1;
    D[(y * W + x) * 4 + 3] *= 1 - sstep(0.9, 1.04, e);
  }
  g.putImageData(id, 0, 0);
  // 가장자리 그림자 대신 살짝 어두운 띠 (잔디와 높이 차이)
  ctx.drawImage(off, ox, oy);

  // 3) 길이 들어오는 곳: 흙길 → 돌바닥 이음 타일 (흙 쪽이 길을 향하게 회전)
  (spec.joins || []).forEach(([jx, jy, ang], i) => {
    const t = feathered(JOINS[i % JOINS.length], 104, 18);
    ctx.save();
    ctx.translate(jx, jy);
    ctx.rotate(ang);
    ctx.drawImage(t, -52, -52);
    ctx.restore();
  });

  // 4) 가장자리 돌 조각 · 풀 덤불 (경계를 따라 흩어 놓기, 길목은 비움)
  const N = spec.bits || 26;
  for (let i = 0; i < N; i++) {
    const t = (i + hash(i, 3) * 0.6) / N * Math.PI * 2;
    const ex = cx + Math.sign(Math.cos(t)) * a * Math.pow(Math.abs(Math.cos(t)), 2 / n);
    const ey = cy + Math.sign(Math.sin(t)) * b * Math.pow(Math.abs(Math.sin(t)), 2 / n);
    if ((spec.joins || []).some(([jx, jy]) => Math.hypot(jx - ex, jy - ey) < 80)) continue;
    if ((spec.avoid || []).some(([ax, ay, ar]) => Math.hypot(ax - ex, ay - ey) < ar)) continue;
    const tuft = hash(i, 9) < 0.35;
    const name = tuft ? TUFTS[i % TUFTS.length] : EDGE_BITS[Math.floor(hash(i, 5) * EDGE_BITS.length)];
    const am = assets.get(K(name));
    const s = (tuft ? 0.42 : 0.5) + hash(i, 7) * 0.12;
    const out = (hash(i, 1) - 0.35) * 26; // 가장자리 안팎으로 조금씩
    const px = ex + Math.cos(t) * out, py = ey + Math.sin(t) * out * 0.7;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(am.img, px - (am.m.w * s) / 2, py - (am.m.h * s) / 2, am.m.w * s, am.m.h * s);
    ctx.restore();
  }
  return true;
}
