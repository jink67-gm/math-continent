// 던전 그림 (새 던전 소품 assets/dungeon3 + 돌바닥 질감)
// - 바닥: 핵심 에셋 v4 64px 타일 15장을 구역별로 섞어 한 번 미리 그려 둠
// - 벽: 돌담 그림을 벽 사각형 안에 이어 붙임 (충돌 사각형과 정확히 같은 자리)
// - 수정·룬 기둥·봉인된 문·포털·횃불·화로·석상·깃발 등은 새 소품 그림
// 그림을 못 불러오면 false → 예전 캔버스 그림
import { assets } from './AssetManager.js';

// 던전 바닥: 핵심 에셋 v4 64×64 타일 15장 (기본 6 · 이끼 3 · 금 간 바닥 3 · 용암 3)
// 모든 타일의 가장자리 10~11px가 똑같이 그려져 있어 어떤 타일끼리 붙여도 이음매가 생기지 않아요(그림 확인 + 경계 색 차이 0).
const V4 = (k) => `pack5/floor/${k}`;
const FLOOR_BASE = ['base_01', 'base_02', 'base_03', 'base_04', 'base_05', 'base_06'];
const FLOOR_MOSS = ['moss_01', 'moss_02', 'moss_03'];
const FLOOR_CRACK = ['crack_01', 'crack_02', 'crack_03'];
const FLOOR_LAVA = ['lava_01', 'lava_02', 'lava_03'];
export const DUNGEON_KEYS = ['dungeon3/stone_wall', 'dungeon3/crumbled_wall_corner', ...[...FLOOR_BASE, ...FLOOR_MOSS, ...FLOOR_CRACK, ...FLOOR_LAVA].map(V4)];
const hash2 = (x, y) => Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;

function hexRgb(h) { const n = parseInt(h.replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

// 부드러운 값 잡음 (구역 나누기용: 이끼 지대 · 금 간 지대 · 용암 지대)
function zoneNoise(x, y, seed, cell) {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const h = (i, j) => hash2(i + seed * 17.3, j - seed * 9.1);
  const a = h(x0, y0) + (h(x0 + 1, y0) - h(x0, y0)) * sx;
  const b = h(x0, y0 + 1) + (h(x0 + 1, y0 + 1) - h(x0, y0 + 1)) * sx;
  return a + (b - a) * sy;
}

// 바닥 캔버스 (장면 하나에 한 번). 용암 타일은 그림만 — 피해 판정은 없어요(기존 규칙 그대로).
export function buildDungeonFloor(W, H, colors, walls, { lava = false } = {}) {
  if (!assets.get(V4('base_01'))) return null;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const T = 64;
  const pick = (list, x, y) => list[Math.floor(hash2(x * 3.1, y * 7.7) * list.length) % list.length];
  for (let ty = 0; ty * T < H; ty++) {
    for (let tx = 0; tx * T < W; tx++) {
      const moss = zoneNoise(tx, ty, 1, 5), crack = zoneNoise(tx, ty, 2, 4), hot = zoneNoise(tx, ty, 3, 6);
      const r = hash2(tx + 0.37, ty + 0.71);
      let k;
      if (lava && hot > 0.55 && r < 0.07) k = pick(FLOOR_LAVA, tx, ty);            // 혼돈의 첨탑: 용암 지대 (용암 돌이 바둑판처럼 보이지 않게 드문드문)
      else if (moss > 0.62 && r < 0.38) k = pick(FLOOR_MOSS, tx, ty);             // 이끼 지대 (덩어리가 바둑판처럼 보이지 않게 드문드문)
      else if (crack > 0.64 && r < 0.34) k = pick(FLOOR_CRACK, tx, ty);           // 금 간 지대
      else if (r < 0.04) k = pick(FLOOR_CRACK, tx, ty);                           // 드문드문 금
      else k = pick(FLOOR_BASE, tx, ty);
      const a = assets.get(V4(k)) || assets.get(V4('base_01'));
      g.drawImage(a.img, tx * T, ty * T, T, T);
    }
  }
  // 마을마다 다른 던전 색을 살짝 입히기
  const [r1, g1, b1] = hexRgb(colors.floor[0]);
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = `rgba(${Math.min(255, r1 * 2)},${Math.min(255, g1 * 2)},${Math.min(255, b1 * 2)},0.55)`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  // 벽 가까이는 어둡게 (벽 그림자)
  g.fillStyle = 'rgba(10,6,20,0.35)';
  for (const w of walls) g.fillRect(w.x - 6, w.y + w.h, w.w + 12, 18);
  return c;
}

// 벽 사각형을 돌담 그림으로 채움
export function drawStoneWall(ctx, r, colors) {
  const a = assets.get('dungeon3/stone_wall');
  if (!a) return false;
  const horiz = r.w >= r.h;
  const h = horiz ? Math.max(r.h + 26, 90) : 74;
  const w = a.m.w * (h / a.m.h);
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x - 4, r.y - 30, r.w + 8, r.h + 34); ctx.clip();
  if (horiz) {
    for (let x = r.x - 10; x < r.x + r.w + 10; x += w * 0.9) ctx.drawImage(a.img, x, r.y + r.h - h + 4, w, h);
  } else {
    const ww = r.w + 10, hh = a.m.h * (ww / a.m.w);
    for (let y = r.y - 20; y < r.y + r.h + 10; y += hh * 0.62) ctx.drawImage(a.img, r.x - 5, y, ww, hh);
  }
  // 던전 색 살짝 입히기
  const [rr, gg, bb] = hexRgb(colors[0]);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(${Math.min(255, rr * 2.2)},${Math.min(255, gg * 2.2)},${Math.min(255, bb * 2.2)},0.55)`;
  ctx.fillRect(r.x - 4, r.y - 30, r.w + 8, r.h + 34);
  ctx.restore();
  return true;
}

const CRYSTAL_BY_HUE = (hex) => {
  const [r, g, b] = hexRgb(hex);
  if (r > g && r > b && r > 180 && g < 150) return 'red_crystal_pedestal';
  if (b > r && r > 120) return 'purple_crystal';
  return 'blue_crystal';
};
export function drawCrystalArt(ctx, x, y, color, s, t) {
  const key = `dungeon3/${CRYSTAL_BY_HUE(color)}`;
  if (!assets.get(key)) return false;
  ctx.save();
  const glow = 0.25 + Math.sin(t * 2 + x) * 0.08;
  const gr = ctx.createRadialGradient(x, y - 20 * s, 2, x, y - 20 * s, 50 * s);
  gr.addColorStop(0, color + Math.round(glow * 255).toString(16).padStart(2, '0'));
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(x - 60 * s, y - 80 * s, 120 * s, 110 * s);
  assets.draw(ctx, key, x, y + 4, { height: 58 * s });
  ctx.restore();
  return true;
}

export function drawRunePillarArt(ctx, x, y, active, t) {
  if (!assets.get('dungeon3/tall_ancient_pillar')) return false;
  ctx.save();
  const gr = ctx.createRadialGradient(x, y - 60, 4, x, y - 60, 90);
  gr.addColorStop(0, active ? 'rgba(255,215,90,0.55)' : `rgba(150,120,255,${0.22 + Math.sin(t * 2.5) * 0.08})`);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(x - 90, y - 160, 180, 190);
  assets.draw(ctx, 'dungeon3/tall_ancient_pillar', x, y + 6, { height: 150 });
  ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = active ? '#ffe27a' : `rgba(190,170,255,${0.6 + Math.sin(t * 3) * 0.3})`;
  ctx.fillText('÷', x, y - 78);
  ctx.restore();
  return true;
}

// 봉인된 문: 보스방 철문 (닫힘), 룬이 빛나며 숨쉬듯 깜빡
export function drawSealedDoorArt(ctx, r, t) {
  if (!assets.get('dungeon3/boss_iron_gate')) return false;
  ctx.save();
  assets.draw(ctx, 'dungeon3/boss_iron_gate', r.x + r.w / 2, r.y + r.h + 6, { height: 150 });
  ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.25;
  ctx.font = '34px Jua, sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#c9a6ff';
  ctx.fillText('÷', r.x + r.w / 2, r.y + r.h - 34);
  ctx.restore();
  return true;
}

export function drawPortalArt(ctx, x, y, t) {
  if (!assets.get('dungeon3/blue_magic_circle')) return false;
  ctx.save();
  ctx.globalAlpha = 0.85 + Math.sin(t * 3) * 0.15;
  assets.draw(ctx, 'dungeon3/blue_magic_circle', x, y + 30, { height: 110 });
  ctx.restore();
  return true;
}

// 던전 장식 (방 구조는 모든 던전이 같아서 위치도 같이 씀)
// solid: 발밑 충돌 크기 [너비, 높이]
export const DUNGEON_DECOR = [
  // 입구 (남서쪽)
  // (입구 계단 양옆으로 비켜 놓음)
  { k: 'large_brazier', x: 40, y: 1610, h: 100, solid: [40, 18], light: true },
  { k: 'large_brazier', x: 385, y: 1610, h: 100, solid: [40, 18], light: true },
  { k: 'wooden_barrel', x: 455, y: 1660, h: 58, solid: [36, 16] },
  { k: 'wooden_crates', x: 470, y: 1560, h: 70, solid: [80, 20] },
  // 첫째 방
  { k: 'skulls', x: 1500, y: 1500, h: 44 }, { k: 'bones', x: 860, y: 1580, h: 40 },
  { k: 'broken_pillar', x: 1960, y: 1240, h: 74, solid: [44, 18] }, { k: 'ruins_rubble_a', x: 1150, y: 1630, h: 70, solid: [80, 22] },
  { k: 'clay_pot', x: 2340, y: 1460, h: 50, solid: [26, 12] }, { k: 'cloth_sack', x: 2300, y: 1500, h: 42 },
  // 서쪽 방
  { k: 'short_ancient_pillar', x: 150, y: 520, h: 110, solid: [46, 20] }, { k: 'short_ancient_pillar', x: 820, y: 520, h: 110, solid: [46, 20] },
  { k: 'ancient_tombstone', x: 600, y: 860, h: 86, solid: [70, 20] }, { k: 'bones', x: 380, y: 300, h: 36 },
  { k: 'hanging_cage', x: 880, y: 175, h: 110 },
  // 동쪽 방 (깊은 곳)
  { k: 'leaning_pillar', x: 1180, y: 1000, h: 110, solid: [40, 18] }, { k: 'stone_coffin', x: 2000, y: 1000, h: 70, solid: [110, 24] },
  { k: 'skulls', x: 1500, y: 980, h: 40 },
  // 보스 방 (봉인된 문 너머)
  { k: 'hooded_knight_statue', x: 1130, y: 200, h: 150, solid: [70, 22] }, { k: 'hooded_knight_statue', x: 2300, y: 200, h: 150, solid: [70, 22], flip: true },
  { k: 'large_brazier', x: 1250, y: 470, h: 96, solid: [40, 18], light: true }, { k: 'large_brazier', x: 2150, y: 470, h: 96, solid: [40, 18], light: true },
  { k: 'ritual_altar', x: 1700, y: 150, h: 96, solid: [150, 26] },
  // (벽 횃불·깃발은 새 석조 벽의 횃불 기둥·깃발 기둥으로 바뀜)
];
const FOOT = 21;
export function decorSolids() {
  return DUNGEON_DECOR.filter((d) => d.solid).map((d) => ({ x: d.x - d.solid[0] / 2, y: d.y - d.solid[1] - FOOT + 6, w: d.solid[0], h: d.solid[1] }));
}
export function decorDrawables(t) {
  return DUNGEON_DECOR.filter((d) => assets.meta[`dungeon3/${d.k}`]).map((d) => ({
    y: d.y,
    draw: (ctx) => {
      if (d.light) {
        const f = 0.8 + Math.sin(t * 9 + d.x) * 0.1 + Math.sin(t * 13) * 0.05;
        const gr = ctx.createRadialGradient(d.x, d.y - d.h * 0.8, 4, d.x, d.y - d.h * 0.8, 120);
        gr.addColorStop(0, `rgba(255,170,70,${0.32 * f})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = gr; ctx.fillRect(d.x - 120, d.y - d.h * 0.8 - 120, 240, 240);
      }
      assets.draw(ctx, `dungeon3/${d.k}`, d.x, d.y + 4, { height: d.h, flipX: !!d.flip });
    },
  }));
}
