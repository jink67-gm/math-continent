// 보랏빛 석조 던전 벽 (assets/dungeon4 — 벽 시트 43조각을 개별 그림으로 분리)
// 벽 사각형(충돌) 하나를 '벽 끝 기둥 + 곧은 벽 + 중간 기둥'으로 이어 그려요.
//  · 그림 바닥 = 충돌 사각형 아래 + 20px  → 캐릭터 발(몸 가운데 + 21)이 닿는 곳과 같은 줄
//  · 벽은 바닥 y로 깊이 정렬 → 벽 앞(아래)에서는 캐릭터가 위에, 벽 뒤(위)에서는 벽이 캐릭터 다리를 가려요
//  · 남북으로 긴 벽은 기둥 머릿돌을 촘촘히 쌓아 윗면을 만들고, 남쪽 끝에 벽 앞면이 보여요
//  · 이음매는 항상 기둥이 덮어서 블록이 중간에 끊겨 보이지 않아요
import { assets } from './AssetManager.js';

const K = (n) => `dungeon4/${n}`;
export const DWALL_KEYS = ['wall_straight', 'pillar_short_a', 'pillar_short_b', 'pillar_torch_b', 'pillar_torch_c', 'pillar_vine', 'pillar_c',
  'pillar_banner_a', 'pillar_banner_b', 'pillar_niche_statue', 'pillar_niche_torch', 'wall_arch_gate', 'wall_stairs', 'wall_stub', 'rubble_c'].map(K);
export const BASE_OFF = 20;
const LIFT = 40;
const MID_POSTS = ['pillar_torch_b', 'pillar_short_b', 'pillar_vine', 'pillar_c', 'pillar_torch_c', 'pillar_short_b'];

export const wallArtReady = () => DWALL_KEYS.every((k) => assets.get(k));

function hexRgb(h) { const n = parseInt(String(h).replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

// 던전마다 다른 색을 살짝 입히기 (계곡 동굴은 원래 보랏빛 그대로)
function tintOf(colors) {
  if (!colors || colors.wall?.[0] === '#4b3f5e') return null;
  return colors.wall?.[1] || null;
}

function drawPiece(ctx, name, x, base, s, tint, extra = {}) {
  const a = assets.get(K(name));
  if (!a) return;
  assets.draw(ctx, K(name), x, base, { scale: s, tint, tintA: tint ? 0.16 : 0, ...extra });
}

function torchGlow(ctx, x, y, t, r = 110) {
  const f = 0.8 + Math.sin(t * 9 + x) * 0.1 + Math.sin(t * 13 + y) * 0.05;
  const gr = ctx.createRadialGradient(x, y, 3, x, y, r);
  gr.addColorStop(0, `rgba(255,170,70,${0.3 * f})`);
  gr.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// 동서로 긴 벽
function horizontal(r, colors, opt) {
  const tint = tintOf(colors);
  const wm = assets.get(K('wall_straight')).m;
  const s = (r.h + LIFT) / wm.h;
  const base = r.y + r.h + BASE_OFF;
  const pm = assets.get(K('pillar_short_a')).m;
  const pw = pm.w * s;
  const n = Math.max(1, Math.ceil((r.w - pw) / (opt.gap || 230)));
  const xs = [];
  for (let i = 0; i <= n; i++) xs.push(r.x + pw / 2 + (i * (r.w - pw)) / n);
  const out = [];
  // 곧은 벽: 기둥 사이를 한 장에서 잘라 그려 이음매가 없게
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i] + pw / 2 - 6, x1 = xs[i + 1] - pw / 2 + 6;
    const span = x1 - x0;
    const srcW = Math.min(wm.w - 12, span / s);
    const sx = (i % 2 ? wm.w - srcW - 6 : 6);
    out.push({
      y: base,
      draw: (ctx) => {
        const a = assets.get(K('wall_straight'));
        ctx.drawImage(a.img, sx, 0, srcW, wm.h, x0, base - wm.h * s, span, wm.h * s);
        const tc = tint && assets.tinted(K('wall_straight'), a.img, tint);
        if (tc) {
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.drawImage(tc, sx, 0, srcW, wm.h, x0, base - wm.h * s, span, wm.h * s);
          ctx.restore();
        }
      },
    });
  }
  xs.forEach((x, i) => {
    const end = i === 0 || i === xs.length - 1;
    const name = opt.posts?.(x, i, end) || (end ? 'pillar_short_a' : MID_POSTS[(i + Math.floor(r.x / 97)) % MID_POSTS.length]);
    const torch = /torch/.test(name);
    out.push({
      y: base + 1,
      draw: (ctx, t) => {
        if (torch) torchGlow(ctx, x, base - assets.get(K(name)).m.h * s * 0.55, t);
        drawPiece(ctx, name, x, base, s, tint);
      },
    });
  });
  return out;
}

// 남북으로 긴 벽: 기둥 머릿돌을 쌓아 윗면, 맨 아래 기둥은 앞면까지
function vertical(r, colors) {
  const tint = tintOf(colors);
  const pm = assets.get(K('pillar_short_a')).m;
  const s = (r.w + 10) / pm.w;
  const ph = pm.h * s;
  const step = ph * 0.34;
  const top = r.y - 20;
  const last = r.y + r.h + BASE_OFF;
  const out = [];
  for (let b = top + ph; ; b += step) {
    const base = Math.min(b, last);
    const name = (Math.round(b / step) % 3 === 0) ? 'pillar_short_b' : 'pillar_short_a';
    out.push({ y: base, draw: (ctx) => drawPiece(ctx, name, r.x + r.w / 2, base, s, tint) });
    if (base >= last) break;
  }
  return out;
}

// 방 안의 작은 돌 덩어리 (네모난 충돌)
function block(r, colors) {
  const tint = tintOf(colors);
  const name = r.h > r.w * 1.1 ? 'pillar_niche_statue' : r.w > r.h * 1.2 ? 'rubble_c' : 'wall_stub';
  const m = assets.get(K(name)).m;
  const s = (r.w + 12) / m.w;
  const base = r.y + r.h + BASE_OFF;
  return [{ y: base, draw: (ctx) => drawPiece(ctx, name, r.x + r.w / 2, base, s, tint) }];
}

// 벽 사각형 목록 → 깊이 정렬용 그리기 목록 [{ y, draw(ctx, t) }]
export function wallDrawables(walls, colors, opt = {}) {
  if (!wallArtReady()) return null;
  const out = [];
  for (const r of walls) {
    if (r.w >= 300 && r.w >= r.h) out.push(...horizontal(r, colors, opt));
    else if (r.h >= 300) out.push(...vertical(r, colors));
    else out.push(...block(r, colors));
  }
  return out;
}

// 봉인된 문: 아치 출입구 (닫혀 있으면 아치 안에 철문)
export function archDrawable(door, colors, isOpen, drawGate) {
  if (!wallArtReady()) return null;
  const tint = tintOf(colors);
  const m = assets.get(K('wall_arch_gate')).m;
  const s = (door.w + 60) / m.w;
  const base = door.y + door.h + BASE_OFF;
  return {
    y: base + 2,
    draw: (ctx, t) => {
      drawPiece(ctx, 'wall_arch_gate', door.x + door.w / 2, base, s, tint);
      if (!isOpen()) drawGate(ctx, { x: door.x + door.w / 2 - 58, y: door.y + door.h + BASE_OFF - 150, w: 116, h: 140 }, t);
    },
  };
}
// 아치 양쪽 기둥 충돌 (문이 열려 있을 때 통로 = 아치 안쪽만)
export function archSolids(door) {
  const side = (door.w - 118) / 2;
  return [{ x: door.x, y: door.y, w: side, h: door.h }, { x: door.x + door.w - side, y: door.y, w: side, h: door.h }];
}

// 입구 계단 (마을로 나가는 길): 가운데 계단은 지나가고, 양쪽 벽은 충돌
export function stairsDrawable(cx, bottom, width, colors) {
  if (!wallArtReady()) return null;
  const tint = tintOf(colors);
  const m = assets.get(K('wall_stairs')).m;
  const s = width / m.w;
  return { y: bottom, draw: (ctx) => drawPiece(ctx, 'wall_stairs', cx, bottom, s, tint) };
}
export function stairsSolids(cx, bottom, width) {
  const s = width / 327;
  const left = cx - width / 2, wallW = 80 * s;
  const h = 222 * s;
  return [
    { x: left, y: bottom - h * 0.62, w: wallW, h: h * 0.62 - 22 },
    { x: left + width - wallW, y: bottom - h * 0.62, w: wallW, h: h * 0.62 - 22 },
  ];
}
