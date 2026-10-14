// 분수 계곡 마을·동굴 그림 (Canvas 도형)
import { INK, drawShadow, roundRect } from './sprites.js';
import { artHouse, artBuilding, artPine, artEnv, drawNpcArt, npcArtKey, drawPlaque, artNewBuilding, drawNpc3 } from './envArt.js';
import { assets } from './AssetManager.js';
import { shade } from '../core/utils.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function face(ctx, x, y, s = 1) {
  ctx.fillStyle = INK;
  ellipse(ctx, x - 4 * s, y, 1.7 * s, 2.3 * s); ctx.fill();
  ellipse(ctx, x + 4 * s, y, 1.7 * s, 2.3 * s); ctx.fill();
  ctx.fillStyle = 'rgba(255,110,140,0.5)';
  ellipse(ctx, x - 8 * s, y + 4 * s, 2.6 * s, 1.6 * s); ctx.fill();
  ellipse(ctx, x + 8 * s, y + 4 * s, 2.6 * s, 1.6 * s); ctx.fill();
}

// ---------------- 마을 건물 ----------------
export function drawCottage(ctx, x, y, { wall = '#fff1d0', roof = '#d9674a', w = 130, h = 70, windmill = false, t = 0, sign = '' } = {}) {
  if (artHouse(ctx, x, y, w, sign, windmill ? 'house_blue' : null)) {
    // 새 건물 그림에는 캔버스 풍차 날개를 붙이지 않음 (예전 그림일 때만)
    if (windmill && !assets.get('buildings3/house_red')) drawMillBlades(ctx, x + w * 0.18, y - h - w * 0.32, t);
    return;
  }
  drawShadow(ctx, x, y + 2, w * 0.55, 12);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = wall;
  ctx.fillRect(-w / 2, -h, w, h);
  ctx.strokeRect(-w / 2, -h, w, h);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 14, -h + 4);
  ctx.lineTo(0, -h - w * 0.45);
  ctx.lineTo(w / 2 + 14, -h + 4);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(roof, -0.25);
  ctx.fillRect(-w / 2 - 6, -h - 2, w + 12, 8);
  ctx.strokeRect(-w / 2 - 6, -h - 2, w + 12, 8);
  ctx.fillStyle = '#8a5a36';
  roundRect(ctx, -13, -40, 26, 42, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fe0ff';
  for (const wx of [-w / 2 + 16, w / 2 - 36]) {
    ctx.fillRect(wx, -h + 18, 20, 18);
    ctx.strokeRect(wx, -h + 18, 20, 18);
  }
  if (sign) {
    ctx.font = '14px Jua, sans-serif';
    const sw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#ffe9a8';
    roundRect(ctx, -sw / 2, -h - 12, sw, 22, 7);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sign, 0, -h - 1);
  }
  if (windmill) {
    ctx.save();
    ctx.translate(0, -h - w * 0.32);
    ctx.rotate(t * 0.9);
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(6, -7, 46, 14);
      ctx.strokeRect(6, -7, 46, 14);
    }
    ctx.fillStyle = '#ffcc33';
    ellipse(ctx, 0, 0, 7, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// 밭 — 몇 칸 중 몇 칸에 작물이 자라는지 보이는 "분수 밭"
export function drawFarmPlot(ctx, x, y, w, h, parts, filled, crop = '#ffcf3f') {
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#b7865a';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill(); ctx.stroke();
  const pw = w / parts;
  for (let i = 0; i < parts; i++) {
    const px = x + i * pw;
    ctx.fillStyle = i % 2 ? '#a77650' : '#b07f56';
    ctx.fillRect(px + 3, y + 3, pw - 6, h - 6);
    if (i < filled) {
      for (let j = 0; j < 3; j++) {
        const cx = px + pw / 2;
        const cy = y + 14 + j * ((h - 24) / 2);
        ctx.fillStyle = '#4fae4a';
        ellipse(ctx, cx, cy, 7, 5); ctx.fill();
        ctx.fillStyle = crop;
        ellipse(ctx, cx, cy - 4, 4, 4); ctx.fill();
      }
    }
    if (i > 0) {
      ctx.strokeStyle = 'rgba(43,33,64,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, y + 2);
      ctx.lineTo(px, y + h - 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawFence(ctx, x1, y, x2) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#d9a466';
  ctx.fillRect(x1, y - 14, x2 - x1, 5);
  ctx.strokeRect(x1, y - 14, x2 - x1, 5);
  for (let x = x1; x <= x2; x += 26) {
    roundRect(ctx, x - 4, y - 24, 8, 26, 3);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

export function drawFountain(ctx, x, y, t) {
  // 치유의 샘: 새 우물 그림 + 반짝이는 하트
  const well = assets.get('village2/well');
  if (well) {
    assets.draw(ctx, 'village2/well', x, y + 10, { height: 118 });
    ctx.save();
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.85;
    ctx.fillText('💖', x, y - 112 + Math.sin(t * 3) * 3);
    ctx.restore();
    return;
  }
  if (artBuilding(ctx, 'statue', x, y, 150, 22)) return;
  drawShadow(ctx, x, y + 4, 62, 16);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#c9cfdb';
  ellipse(ctx, 0, 0, 60, 26); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6fd6ff';
  ellipse(ctx, 0, -3, 48, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    const r = ((t * 20 + i * 14) % 42) + 4;
    ctx.globalAlpha = 1 - r / 46;
    ellipse(ctx, 0, -3, r, r * 0.38);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#dfe4ee';
  roundRect(ctx, -9, -46, 18, 44, 6); ctx.fill(); ctx.stroke();
  ellipse(ctx, 0, -48, 20, 8); ctx.fill(); ctx.stroke();
  // 물줄기
  ctx.strokeStyle = '#bff0ff';
  ctx.lineWidth = 4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.quadraticCurveTo(side * 22, -72 - Math.sin(t * 6) * 3, side * 30, -10);
    ctx.stroke();
  }
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('💖', 0, -60 + Math.sin(t * 3) * 3);
  ctx.restore();
}

// ---------------- 마을 사람들 ----------------
export function drawChief(ctx, x, y, t) {
  if (drawNpcArt(ctx, 'merchant', x, y, t)) return;
  drawShadow(ctx, x, y + 2, 20, 6);
  const b = Math.sin(t * 2) * 1.2;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#5fae5a';
  roundRect(ctx, -17, -38 + b, 34, 40, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd9b3';
  ellipse(ctx, 0, -46 + b, 14, 13); ctx.fill(); ctx.stroke();
  face(ctx, 0, -48 + b, 1);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-5, -41 + b, 7, 3.5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(5, -41 + b, 7, 3.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.fillStyle = '#f2d36b';
  ellipse(ctx, 0, -57 + b, 26, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -60 + b, 13, 11, 0, Math.PI, 0);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e0533f';
  ctx.fillRect(-13, -63 + b, 26, 4);
  ctx.restore();
}

export function drawMerchantStall(ctx, x, y, t) {
  // 새 시장 가판대 + 여행 상인
  // 상점: 새 상점 건물(pack6) 앞에 상인
  { const m = assets.meta['pack6/bld_house_shop']; if (m && assets.get('pack6/bld_house_shop')) { assets.draw(ctx, 'pack6/bld_house_shop', x, y + 10, { scale: 232 / m.w }); drawNpc3(ctx, 'traveling_merchant', x, y + 44, t); drawPlaque(ctx, x, y + 4, '상점'); return; } }
  if (artNewBuilding(ctx, 'house_shop', x, y + 8, 230, { folder: 'buildings' })) { drawNpc3(ctx, 'traveling_merchant', x, y + 44, t); drawPlaque(ctx, x, y + 4, '상점'); return; }
  if (artNewBuilding(ctx, 'market_stall', x, y + 8, 170)) { drawNpc3(ctx, 'traveling_merchant', x, y + 44, t); drawPlaque(ctx, x, y - 132, '상점'); return; }
  if (artEnv(ctx, 'tent', x, y + 10, 128)) { drawNpcArt(ctx, 'alchemist', x, y + 6, t); drawPlaque(ctx, x, y - 120, '상점'); return; }
  drawShadow(ctx, x, y + 2, 70, 14);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  // 상인
  const b = Math.sin(t * 2.4) * 1.5;
  ctx.fillStyle = '#ff9ec2';
  roundRect(ctx, -16, -64 + b, 32, 30, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe0c4';
  ellipse(ctx, 0, -72 + b, 13, 12); ctx.fill(); ctx.stroke();
  face(ctx, 0, -73 + b, 1);
  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath();
  ctx.moveTo(-12, -80 + b); ctx.lineTo(-8, -94 + b); ctx.lineTo(-2, -82 + b);
  ctx.moveTo(12, -80 + b); ctx.lineTo(8, -94 + b); ctx.lineTo(2, -82 + b);
  ctx.fill(); ctx.stroke();
  // 판매대
  ctx.fillStyle = '#c48a52';
  ctx.fillRect(-60, -36, 120, 38);
  ctx.strokeRect(-60, -36, 120, 38);
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧪', -36, -40);
  ctx.fillText('🍶', -12, -40);
  ctx.fillText('🗡️', 14, -40);
  ctx.fillText('🛡️', 38, -40);
  // 기둥 + 차양
  ctx.fillStyle = '#8a5a36';
  ctx.fillRect(-62, -108, 7, 72); ctx.strokeRect(-62, -108, 7, 72);
  ctx.fillRect(55, -108, 7, 72); ctx.strokeRect(55, -108, 7, 72);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#fffaf0' : '#ff6f8e';
    ctx.beginPath();
    const sx = -70 + i * 23.3;
    ctx.moveTo(sx, -122);
    ctx.lineTo(sx + 23.3, -122);
    ctx.lineTo(sx + 23.3, -104);
    ctx.quadraticCurveTo(sx + 11.6, -96, sx, -104);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

export function drawSmithy(ctx, x, y, t) {
  // 새 대장간 건물 + 대장장이
  if (artNewBuilding(ctx, 'house_forge', x - 6, y + 8, 236, { folder: 'buildings' })) { drawNpc3(ctx, 'blacksmith', x + 86, y + 54, t, { face: -1 }); drawPlaque(ctx, x - 10, y + 6, '대장간'); return; }
  if (artNewBuilding(ctx, 'blacksmith', x - 10, y + 4, 205)) { drawNpc3(ctx, 'blacksmith', x + 74, y + 54, t, { face: -1 }); drawPlaque(ctx, x - 10, y + 2, '대장간'); return; }
  if (artBuilding(ctx, 'house_forge', x, y - 4, 200)) { drawNpcArt(ctx, 'blacksmith', x + 48, y + 8, t, { face: -1 }); drawPlaque(ctx, x - 30, y - 10, '대장간'); return; }
  drawShadow(ctx, x, y + 2, 76, 14);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  // 화로
  ctx.fillStyle = '#7c7f8f';
  roundRect(ctx, 22, -70, 56, 70, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2b2140';
  roundRect(ctx, 34, -40, 32, 26, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff9a3d';
  ellipse(ctx, 50, -24 + Math.sin(t * 9) * 1.5, 11, 8 + Math.sin(t * 7) * 2); ctx.fill();
  ctx.fillStyle = '#ffe066';
  ellipse(ctx, 50, -22, 5, 4); ctx.fill();
  // 모루
  ctx.fillStyle = '#5a5e70';
  ctx.beginPath();
  ctx.moveTo(-70, -26); ctx.lineTo(-24, -26); ctx.lineTo(-30, -16); ctx.lineTo(-38, -14);
  ctx.lineTo(-38, 0); ctx.lineTo(-58, 0); ctx.lineTo(-58, -14); ctx.lineTo(-66, -16);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // 대장장이
  const hit = Math.max(0, Math.sin(t * 4));
  ctx.fillStyle = '#ffb98a';
  ellipse(ctx, -8, -58, 15, 14); ctx.fill(); ctx.stroke();
  face(ctx, -8, -60, 1);
  ctx.fillStyle = '#8a4f2e';
  ctx.beginPath();
  ctx.moveTo(-20, -54); ctx.quadraticCurveTo(-8, -32, 4, -54); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6b4a32';
  roundRect(ctx, -26, -44, 36, 44, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#a0764a';
  roundRect(ctx, -18, -38, 20, 34, 5); ctx.fill(); ctx.stroke();
  // 망치
  ctx.save();
  ctx.translate(-26, -40);
  ctx.rotate(-0.9 + hit * 1.1);
  ctx.fillStyle = '#9a6a40';
  ctx.fillRect(-3, -34, 6, 34); ctx.strokeRect(-3, -34, 6, 34);
  ctx.fillStyle = '#8f95a8';
  roundRect(ctx, -12, -44, 24, 14, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ---------------- 다리 · 절벽 · 동굴 ----------------
// 가로로 흐르는 강 위의 세로 다리
// 출발의 초원 마을 출구 장식 다리 (보완 에셋 v5, 128×320 원본 크기 그대로 · 돌리거나 늘이지 않음)
// cx: 다리 가운데 x, bottomY: 다리 아래 끝 y. 그림만 그리고 충돌·통행 판정은 없어요.
export function drawExitBridge(ctx, cx, bottomY) {
  const a = assets.get('pack5/bridge/meadow_exit_128x320');
  if (!a) return false;
  ctx.drawImage(a.img, Math.round(cx - a.m.w / 2), Math.round(bottomY - a.m.h));
  return true;
}

export function drawBridge(ctx, x, y, w, h, broken, t) {
  // 세로 다리 (보완 에셋 v5, 128×320): 원본 크기 그대로(늘리지 않음) 강 가운데에 놓고 위아래는 강둑에 걸쳐요.
  // 판자 폭(약 92px)이 지나가는 틈(100px)과 거의 같아요. 부서진 다리는 위·아래 끝만.
  const ex = assets.get('pack5/bridge/meadow_exit_128x320');
  if (ex) {
    const dx = Math.round(x + w / 2 - ex.m.w / 2), dy = Math.round(y + h / 2 - ex.m.h / 2);
    if (!broken) ctx.drawImage(ex.img, dx, dy);
    else {
      const k = 0.3, ph = Math.round(ex.m.h * k);
      ctx.drawImage(ex.img, 0, 0, ex.m.w, ph, dx, dy, ex.m.w, ph);
      ctx.drawImage(ex.img, 0, ex.m.h - ph, ex.m.w, ph, dx, dy + ex.m.h - ph, ex.m.w, ph);
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
      ctx.fillStyle = '#9ff3ff'; ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('÷', x + w / 2, y + h / 2 + 10);
      ctx.restore();
    }
    return;
  }
  // 전용 세로 다리 (부족 에셋 1차 팩)를 3조각으로: 위 다리머리 · 가운데 판자(반복) · 아래 다리머리
  // 가운데 판자 폭(난간 포함 73px)이 실제 지나가는 폭(w)과 같아지도록 크기를 맞추고(최대 1.4배),
  // 강 폭만큼은 판자 구간을 그대로 반복해 이어요 (늘이거나 찌그러뜨리지 않음)
  const nb = assets.get('pack4/bridges/bridge_ns_wood');
  if (nb) {
    const TOP = 140, MID0 = 140, MID1 = 198;         // 원본 그림의 행(px): 0~140 위 머리, 140~198 판자, 198~끝 아래 머리
    const s = Math.min(1.4, w / 73);
    const dw = nb.m.w * s, dx = x + w / 2 - dw / 2;
    const capTop = y + 14, capBot = y + h - 14;        // 다리머리 기둥이 강둑에 걸리도록
    const midH = (MID1 - MID0) * s;
    ctx.drawImage(nb.img, 0, 0, nb.m.w, TOP, dx, capTop - TOP * s, dw, TOP * s);
    const gapA = broken ? capTop + (capBot - capTop) * 0.22 : capBot;
    for (let yy = capTop; yy < gapA; yy += midH) {
      const hh = Math.min(midH, gapA - yy);
      ctx.drawImage(nb.img, 0, MID0, nb.m.w, hh / s, dx, yy, dw, hh);
    }
    if (broken) {
      const gapB = capTop + (capBot - capTop) * 0.78;
      for (let yy = gapB; yy < capBot; yy += midH) {
        const hh = Math.min(midH, capBot - yy);
        ctx.drawImage(nb.img, 0, MID0, nb.m.w, hh / s, dx, yy, dw, hh);
      }
    }
    ctx.drawImage(nb.img, 0, MID1, nb.m.w, nb.m.h - MID1, dx, capBot, dw, (nb.m.h - MID1) * s);
    if (broken) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
      ctx.fillStyle = '#9ff3ff'; ctx.font = '30px Jua, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('÷', x + w / 2, y + h / 2 + 10);
      ctx.restore();
    }
    return;
  }
  // 새 다리: 다리 그림(가로로 건너는 다리)의 판자·밧줄을 세로로 돌려 이어 붙인 그림 + 기둥 4개
  const deck = assets.get('terrain3/bridge_v_deck'), post = assets.get('terrain3/bridge_post');
  if (deck && post) {
    const s = (w + 26) / deck.m.w;
    const dh = h + 30;
    ctx.save();
    const pieces = broken ? [[0, 0.32], [0.7, 1]] : [[0, 1]];
    for (const [a, b] of pieces) {
      const sy0 = (deck.m.h * 0.08) + a * dh / s, sh = (b - a) * dh / s;
      ctx.drawImage(deck.img, 0, sy0, deck.m.w, Math.min(sh, deck.m.h - sy0), x - 13, y - 15 + a * dh, deck.m.w * s, Math.min(sh, deck.m.h - sy0) * s);
    }
    const ps = 0.62;
    for (const [px, py] of [[x - 8, y - 22], [x + w + 8, y - 22], [x - 8, y + h + 10], [x + w + 8, y + h + 10]]) {
      ctx.drawImage(post.img, px - post.m.w * ps / 2, py - post.m.h * ps, post.m.w * ps, post.m.h * ps);
    }
    if (broken) {
      ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
      ctx.fillStyle = '#9ff3ff';
      ctx.font = '26px Jua, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('÷', x + w / 2, y + h / 2 + 8);
    }
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  for (let yy = y; yy < y + h; yy += 16) {
    const mid = yy > y + h * 0.3 && yy < y + h * 0.72;
    if (broken && mid) continue;
    ctx.fillStyle = (yy / 16) % 2 ? '#c48a52' : '#b57d48';
    ctx.fillRect(x, yy, w, 16);
    ctx.strokeRect(x, yy, w, 16);
  }
  ctx.fillStyle = '#8a5a36';
  for (const bx of [x - 8, x + w - 2]) {
    ctx.fillRect(bx, y - 12, 10, h + 24);
    ctx.strokeRect(bx, y - 12, 10, h + 24);
  }
  if (broken) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25;
    ctx.fillStyle = '#9ff3ff';
    ctx.font = '26px Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('÷', x + w / 2, y + h / 2 + 8);
    ctx.restore();
  }
  ctx.restore();
}

export function drawCaveMouth(ctx, x, y, t) {
  if (assets.get('dungeon3/cave_entrance')) { assets.draw(ctx, 'dungeon3/cave_entrance', x, y + 14, { height: 170 }); return; }
  if (artBuilding(ctx, 'dungeon_gate', x, y, 250, 16)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#7d6b5c';
  ctx.beginPath();
  ctx.moveTo(-120, 10);
  ctx.quadraticCurveTo(-110, -120, 0, -130);
  ctx.quadraticCurveTo(110, -120, 120, 10);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1f1830';
  ctx.beginPath();
  ctx.moveTo(-62, 10);
  ctx.quadraticCurveTo(-58, -82, 0, -86);
  ctx.quadraticCurveTo(58, -82, 62, 10);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.15;
  ctx.fillStyle = '#b38cff';
  ellipse(ctx, 0, -30, 24, 30);
  ctx.fill();
  ctx.restore();
}

export function drawCliff(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#9b8673';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#b39d88';
  for (let i = 0; i < w; i += 90) {
    ctx.fillRect(x + i + 10, y + h - 36, 60, 10);
  }
  ctx.fillStyle = '#7fbf5a';
  ctx.fillRect(x, y, w, 26);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.restore();
}

export function drawRockWall(ctx, r, colors = ['#4b3f5e', '#5d4f72']) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#140f22';
  ctx.fillStyle = colors[0];
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = colors[1];
  roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, Math.min(18, r.h - 12), 8);
  ctx.fill();
  ctx.restore();
}

export function drawCrystal(ctx, x, y, color, s = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = 0.25 + Math.sin(t * 2 + x) * 0.1;
  ctx.fillStyle = color;
  ellipse(ctx, 0, -14, 26, 22);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  for (const [dx, h, w] of [[-9, 24, 8], [0, 34, 10], [9, 20, 8]]) {
    ctx.fillStyle = shade(color, dx === 0 ? 0.25 : 0);
    ctx.beginPath();
    ctx.moveTo(dx - w / 2, 0);
    ctx.lineTo(dx - w / 2, -h + 6);
    ctx.lineTo(dx, -h);
    ctx.lineTo(dx + w / 2, -h + 6);
    ctx.lineTo(dx + w / 2, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

export function drawRunePillar(ctx, x, y, active, t) {
  drawShadow(ctx, x, y + 2, 22, 7);
  ctx.save();
  ctx.translate(x, y);
  if (active) {
    ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.12;
    ctx.fillStyle = '#ffe066';
    ellipse(ctx, 0, -50, 40, 60);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = active ? '#b8c3e6' : '#7a7591';
  roundRect(ctx, -16, -96, 32, 98, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = active ? '#ffe066' : '#5b5670';
  ctx.beginPath();
  ctx.moveTo(0, -122); ctx.lineTo(14, -100); ctx.lineTo(0, -92); ctx.lineTo(-14, -100);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.font = '26px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (active) {
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = active ? '#ff9a1f' : '#3a3550';
  ctx.fillText('÷', 0, -50);
  ctx.restore();
}

export function drawSealedDoor(ctx, r, t) {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#6a5d84';
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,15,34,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(r.x + r.w / 2, r.y + 6);
  ctx.lineTo(r.x + r.w / 2, r.y + r.h - 6);
  ctx.stroke();
  ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
  ctx.fillStyle = '#ff6f8e';
  ctx.font = '34px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('÷', r.x + r.w / 2, r.y + r.h / 2);
  ctx.restore();
}

export function drawPortal(ctx, x, y, t, label) {
  if (artBuilding(ctx, 'portal', x, y, 120, 14)) { if (label) drawPlaque(ctx, x, y - 132, label); return; }
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.5 - i * 0.12;
    ctx.strokeStyle = ['#9ff3ff', '#c7b6ff', '#fff6a8'][i];
    ctx.lineWidth = 6;
    ellipse(ctx, 0, -6, 38 + i * 8 + Math.sin(t * 3 + i) * 3, 16 + i * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#c7f3ff';
  ellipse(ctx, 0, -6, 36, 14);
  ctx.fill();
  ctx.restore();
  if (label) {
    ctx.save();
    ctx.font = '14px Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.strokeText(label, x, y - 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y - 34);
    ctx.restore();
  }
}

// 땅바닥 출구 표시 (화살표 + 이름)
export function drawExitMarker(ctx, x, y, label, dir, t) {
  ctx.save();
  const bob = Math.sin(t * 4) * 4;
  ctx.translate(x, y);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  const a = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[dir] || 0;
  ctx.save();
  ctx.rotate(a);
  ctx.translate(bob, 0);
  ctx.beginPath();
  ctx.moveTo(18, 0); ctx.lineTo(0, -14); ctx.lineTo(0, -6); ctx.lineTo(-16, -6);
  ctx.lineTo(-16, 6); ctx.lineTo(0, 6); ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.font = '15px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeText(label, 0, dir === 'down' ? -26 : 34);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 0, dir === 'down' ? -26 : 34);
  ctx.restore();
}

// ---------------- 4단계 마을 양식 ----------------
const STYLE_HATS = {
  cube: '#a77bff', harbor: '#2f6fbf', castle: '#ffcc33', forest: '#4fae4a', snow: '#e8eef8',
};

// 마을 사람(촌장 등): 마을 양식에 따라 모자가 달라요
export function drawVillager(ctx, x, y, t, { style = 'cube', robe = '#ff8a5c', role = 'chief' } = {}) {
  if (drawNpcArt(ctx, npcArtKey(role, style), x, y, t)) return;
  drawShadow(ctx, x, y + 2, 20, 6);
  const b = Math.sin(t * 2) * 1.2;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = robe;
  roundRect(ctx, -17, -38 + b, 34, 40, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd9b3';
  ellipse(ctx, 0, -46 + b, 14, 13); ctx.fill(); ctx.stroke();
  face(ctx, 0, -47 + b, 1);
  const hat = STYLE_HATS[style] || '#ffcc33';
  ctx.fillStyle = hat;
  if (style === 'cube') {
    ctx.fillRect(-12, -72 + b, 24, 16); ctx.strokeRect(-12, -72 + b, 24, 16);
  } else if (style === 'harbor') {
    ctx.beginPath(); ctx.ellipse(0, -58 + b, 18, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    roundRect(ctx, -12, -70 + b, 24, 12, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ellipse(ctx, 0, -64 + b, 3, 3); ctx.fill();
  } else if (style === 'castle') {
    ctx.beginPath();
    ctx.moveTo(-13, -56 + b); ctx.lineTo(-13, -70 + b); ctx.lineTo(-6, -63 + b); ctx.lineTo(0, -72 + b); ctx.lineTo(6, -63 + b); ctx.lineTo(13, -70 + b); ctx.lineTo(13, -56 + b); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (style === 'forest') {
    for (const a of [-0.7, 0, 0.7]) {
      ctx.save(); ctx.translate(0, -58 + b); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, -8, 5, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  } else {
    ctx.beginPath(); ctx.ellipse(0, -60 + b, 16, 10, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ellipse(ctx, 0, -72 + b, 5, 5); ctx.fill(); ctx.stroke();
  }
  if (role === 'chief') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-5, -40 + b, 6, 3, -0.3, 0, Math.PI * 2);
    ctx.ellipse(5, -40 + b, 6, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCubeBuilding(ctx, x, y, { w = 120, h = 110, color = '#9aa7d6', t = 0, sign = '' } = {}) {
  drawShadow(ctx, x, y + 2, w * 0.6, 12);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  const d = 22;
  ctx.fillStyle = shade(color, 0.3);
  ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.lineTo(-w / 2 + d, -h - d); ctx.lineTo(w / 2 + d, -h - d); ctx.lineTo(w / 2, -h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(color, -0.25);
  ctx.beginPath(); ctx.moveTo(w / 2, -h); ctx.lineTo(w / 2 + d, -h - d); ctx.lineTo(w / 2 + d, -d); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h, w, h); ctx.strokeRect(-w / 2, -h, w, h);
  for (let r = 0; r < Math.floor((h - 40) / 28); r++) {
    for (let c = 0; c < Math.floor(w / 32); c++) {
      ctx.fillStyle = (r + c + Math.floor(t)) % 3 === 0 ? '#fff6a8' : '#3ee6d0';
      ctx.fillRect(-w / 2 + 10 + c * 32, -h + 12 + r * 28, 18, 16);
      ctx.strokeRect(-w / 2 + 10 + c * 32, -h + 12 + r * 28, 18, 16);
    }
  }
  ctx.fillStyle = '#5b4fa0';
  roundRect(ctx, -12, -36, 24, 36, 4); ctx.fill(); ctx.stroke();
  if (sign) {
    ctx.font = '14px Jua, sans-serif';
    const sw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#3ee6d0';
    roundRect(ctx, -sw / 2, -h - 10, sw, 22, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sign, 0, -h + 1);
  }
  ctx.restore();
}

export function drawLighthouse(ctx, x, y, lit, t) {
  drawShadow(ctx, x, y + 2, 40, 10);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#e8364f';
    const top = -40 - i * 40;
    const wb = 36 - i * 4;
    const wt = 36 - (i + 1) * 4;
    ctx.beginPath(); ctx.moveTo(-wb, top + 40); ctx.lineTo(-wt, top); ctx.lineTo(wt, top); ctx.lineTo(wb, top + 40); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = lit ? '#fff6a8' : '#5a5e70';
  roundRect(ctx, -22, -200, 44, 34, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8364f';
  ctx.beginPath(); ctx.moveTo(-28, -200); ctx.lineTo(0, -228); ctx.lineTo(28, -200); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (lit) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff6a8';
    ctx.beginPath(); ctx.moveTo(0, -184); ctx.lineTo(Math.cos(t) * 260, -184 + Math.sin(t) * 60 - 40); ctx.lineTo(Math.cos(t) * 260, -184 + Math.sin(t) * 60 + 40); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawBoat(ctx, x, y, t, color = '#e8364f') {
  const bob = Math.sin(t * 2 + x) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#9a6a40';
  ctx.beginPath(); ctx.moveTo(-50, -10); ctx.lineTo(50, -10); ctx.lineTo(36, 14); ctx.lineTo(-36, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(-3, -80, 6, 70); ctx.strokeRect(-3, -80, 6, 70);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(4, -78); ctx.lineTo(44, -26); ctx.lineTo(4, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawStoneHouse(ctx, x, y, { w = 130, h = 70, roof = '#c2304a', sign = '' } = {}) {
  if (artHouse(ctx, x, y, w, sign, 'house_blue')) return;
  drawCottage(ctx, x, y, { w, h, roof, wall: '#d9d2c4', sign });
  ctx.save();
  ctx.strokeStyle = 'rgba(43,33,64,0.25)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < Math.floor(w / 26); c++) {
      ctx.strokeRect(x - w / 2 + 4 + c * 26 + (r % 2) * 13, y - h + 46 + r * 8, 22, 8);
    }
  }
  ctx.restore();
}

export function drawCastleTower(ctx, x, y, flag = '#c2304a') {
  drawShadow(ctx, x, y + 2, 46, 12);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#c9c2b4';
  ctx.fillRect(-36, -200, 72, 200); ctx.strokeRect(-36, -200, 72, 200);
  for (let i = 0; i < 4; i++) { ctx.fillRect(-36 + i * 22, -218, 14, 18); ctx.strokeRect(-36 + i * 22, -218, 14, 18); }
  ctx.fillStyle = '#4a3f63';
  roundRect(ctx, -10, -140, 20, 30, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a36';
  ctx.fillRect(-2, -270, 4, 52);
  ctx.fillStyle = flag;
  ctx.beginPath(); ctx.moveTo(2, -270); ctx.lineTo(40, -258); ctx.lineTo(2, -246); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawTreeHouse(ctx, x, y, { sign = '', t = 0 } = {}) {
  drawShadow(ctx, x, y + 2, 66, 14);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#8a5a36';
  ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-28, -80); ctx.lineTo(28, -80); ctx.lineTo(40, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a3a22';
  roundRect(ctx, -12, -40, 24, 40, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff6a8';
  ellipse(ctx, 0, -60, 8, 8); ctx.fill(); ctx.stroke();
  const blobs = [[0, -120, 56], [-50, -96, 36], [50, -96, 36], [0, -160, 36]];
  ctx.fillStyle = INK;
  for (const [bx, by, r] of blobs) { ellipse(ctx, bx, by, r + 4, r + 4); ctx.fill(); }
  ctx.fillStyle = '#4fae5a';
  for (const [bx, by, r] of blobs) { ellipse(ctx, bx, by, r, r); ctx.fill(); }
  if (sign) {
    ctx.font = '14px Jua, sans-serif';
    const sw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#ffe9a8';
    roundRect(ctx, -sw / 2, -96, sw, 22, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sign, 0, -85);
  }
  ctx.restore();
}

export function drawCabin(ctx, x, y, { w = 130, sign = '' } = {}) {
  if (artHouse(ctx, x, y, w, sign, 'house_blue')) return;
  drawCottage(ctx, x, y, { w, roof: '#7a4f2e', wall: '#c48a52', sign });
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 14, y - 66);
  ctx.quadraticCurveTo(x, y - 70 - w * 0.5, x + w / 2 + 14, y - 66);
  ctx.quadraticCurveTo(x, y - 74 - w * 0.25, x - w / 2 - 14, y - 66);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawPine(ctx, x, y, s = 1, snow = true) {
  if (artPine(ctx, x, y, s)) return;
  drawShadow(ctx, x, y + 2, 22 * s, 6 * s);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#8a5a36';
  ctx.fillRect(-5, -14, 10, 16); ctx.strokeRect(-5, -14, 10, 16);
  for (let i = 0; i < 3; i++) {
    const w = 30 - i * 7;
    const top = -40 - i * 22;
    ctx.fillStyle = '#3f8f5a';
    ctx.beginPath(); ctx.moveTo(-w, top + 28); ctx.lineTo(0, top - 6); ctx.lineTo(w, top + 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (snow) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-w * 0.45, top + 10); ctx.lineTo(0, top - 6); ctx.lineTo(w * 0.45, top + 10); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawSnowman(ctx, x, y) {
  drawShadow(ctx, x, y + 2, 18, 5);
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, x, y - 14, 17, 16); ctx.fill(); ctx.stroke();
  ellipse(ctx, x, y - 40, 12, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ellipse(ctx, x - 4, y - 42, 1.8, 2); ctx.fill();
  ellipse(ctx, x + 4, y - 42, 1.8, 2); ctx.fill();
  ctx.fillStyle = '#ff9a3d';
  ctx.beginPath(); ctx.moveTo(x, y - 39); ctx.lineTo(x + 10, y - 37); ctx.lineTo(x, y - 35); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// 마을 북쪽 길을 막는 수학 룬 장벽 (풀면 사라져요)
export function drawGateBarrier(ctx, r, color, t) {
  ctx.save();
  ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.15;
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = '30px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let gx = r.x + 40; gx < r.x + r.w; gx += 80) ctx.fillText('÷', gx, r.y + r.h / 2 + Math.sin(t * 3 + gx) * 3);
  ctx.restore();
}

// 집 지붕 위 풍차 날개 (그림 집 위에 덧그림)
function drawMillBlades(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.8);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2a1c12';
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#f6ecd6';
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(46, -9);
    ctx.lineTo(46, 9);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#7a4f2e';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
