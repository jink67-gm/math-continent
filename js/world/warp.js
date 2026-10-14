// 워프포인트 · 이웃 마을로 가는 출입구 (마을 장면이 함께 씀)
import { assets } from '../render/AssetManager.js';
import { ROUTES, routeFrom, routeTo, VILLAGE_GATES, WARP_SPOT } from '../data/routes.js';

const FIELD_W = 2400;
const FIELD_ROAD_Y = 640;

// 이 마을의 서쪽 입구(앞 길) · 동쪽/남쪽 출구(다음 길)
export function villageLinkExits(village) {
  const out = [];
  const prev = routeTo(village);
  if (prev) {
    const g = VILLAGE_GATES.west;
    out.push({ id: 'toPrevRoute', rect: g.rect, to: prev.id, spawn: { x: FIELD_W - 140, y: FIELD_ROAD_Y }, label: `← ${prev.name}`, dir: 'left', marker: g.marker });
  }
  const next = routeFrom(village);
  if (next) {
    const g = VILLAGE_GATES[next.exitFrom];
    out.push({ id: 'toNextRoute', rect: g.rect, to: next.id, spawn: { x: 140, y: FIELD_ROAD_Y }, label: next.exitFrom === 'south' ? `${next.name} ↓` : `${next.name} →`, dir: next.exitFrom === 'south' ? 'down' : 'right', marker: g.marker });
  }
  return out;
}

export function warpInteractable(village) {
  return { id: `warp_${village}`, kind: 'warp', village, x: WARP_SPOT.x, y: WARP_SPOT.y, r: 95, label: '워프포인트', headY: -118 };
}

export function warpSolid() {
  return { x: WARP_SPOT.x - 34, y: WARP_SPOT.y - 36, w: 68, h: 18 };
}

export const warpActive = (save, village) => !!save?.warpPoints?.includes(village);

// 워프포인트 그림: 마법진 돌 받침(portal 그림) — 꺼져 있으면 회색, 켜지면 푸른 빛 기둥
export function drawWarpPoint(ctx, x, y, active, t, burst = 0) {
  const a = assets.get('buildings/portal');
  ctx.save();
  // 바닥 마법진
  ctx.globalAlpha = active ? 0.55 + Math.sin(t * 3) * 0.15 : 0.25;
  ctx.strokeStyle = active ? '#7fe3ff' : '#9a95a8';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y + 4, 58, 20, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y + 4, 40, 13, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  if (a) {
    assets.draw(ctx, 'buildings/portal', x, y + 8, { scale: 128 / a.m.w, tint: active ? null : '#6a6478', tintA: active ? 0 : 0.55 });
  }
  if (active) {
    const g = ctx.createLinearGradient(0, y - 140, 0, y);
    g.addColorStop(0, 'rgba(127,227,255,0)');
    g.addColorStop(1, `rgba(127,227,255,${0.25 + Math.sin(t * 4) * 0.08})`);
    ctx.fillStyle = g;
    ctx.fillRect(x - 26, y - 140, 52, 140);
  }
  if (burst > 0) {
    // 활성화 순간: 빛 기둥이 크게 솟았다가 사라짐
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, burst * 1.5);
    const g = ctx.createRadialGradient(x, y - 60, 5, x, y - 60, 160);
    g.addColorStop(0, 'rgba(180,240,255,0.9)');
    g.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 170, y - 230, 340, 260);
  }
  ctx.restore();
}

export { ROUTES };
