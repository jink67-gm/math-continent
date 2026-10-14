// 보스 그림 — 역수 트롤
import { INK, drawShadow, roundRect } from './sprites.js';
import { shade } from '../core/utils.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/**
 * o: { color, t, facing(1|-1), flash, flipped(0~1), windup(0~1), move, shielded, stunned, raise(0~1 몽둥이 들기) }
 */
export function drawTroll(ctx, x, y, o) {
  const { color = '#6fbf8f', t = 0, facing = 1, flash = 0, flipped = 0, windup = 0, moving = false, shielded = false, stunned = false, raise = 0 } = o;
  const bob = moving ? Math.abs(Math.sin(t * 8)) * -4 : Math.sin(t * 2) * 2;
  drawShadow(ctx, x, y + 6, 60, 16);
  ctx.save();
  ctx.translate(x, y - 46 + bob);
  if (flipped > 0) ctx.rotate(Math.PI * flipped);
  ctx.scale(facing, 1);
  if (windup > 0) ctx.scale(1 + windup * 0.06, 1 - windup * 0.05);
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  const body = flash > 0 ? '#ffffff' : color;

  // 다리
  ctx.fillStyle = shade(color, -0.25);
  const step = moving ? Math.sin(t * 8) * 5 : 0;
  roundRect(ctx, -32, 30 + step, 22, 26, 8); ctx.fill(); ctx.stroke();
  roundRect(ctx, 10, 30 - step, 22, 26, 8); ctx.fill(); ctx.stroke();

  // 몽둥이 (뒤 팔)
  ctx.save();
  ctx.translate(40, -4);
  ctx.rotate(0.5 - raise * 2.2);
  ctx.fillStyle = '#8a5a36';
  ctx.beginPath();
  ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(14, -66); ctx.quadraticCurveTo(0, -80, -14, -66);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8bfcc';
  for (const [sx, sy] of [[-8, -56], [8, -60], [0, -44]]) {
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy); ctx.lineTo(sx, sy - 7); ctx.lineTo(sx + 4, sy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  // 몸통
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 48, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash > 0 ? '#fff' : shade(color, 0.35);
  ellipse(ctx, 0, 14, 30, 24); ctx.fill();
  // 배에 ÷ 무늬
  ctx.fillStyle = INK;
  ctx.font = '26px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('÷', 0, 16);

  // 뿔
  ctx.fillStyle = '#fff3d6';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 22, -38);
    ctx.quadraticCurveTo(s * 40, -60, s * 30, -74);
    ctx.quadraticCurveTo(s * 26, -56, s * 12, -44);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  // 눈
  const angry = windup > 0 || !stunned;
  if (stunned) {
    ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 15, -16, 6, 0, Math.PI * 1.6);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#fff';
    ellipse(ctx, -15, -16, 10, 11); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ellipse(ctx, 15, -16, 10, 11); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK;
    ellipse(ctx, -13, -14, 4.5, 5.5); ctx.fill();
    ellipse(ctx, 17, -14, 4.5, 5.5); ctx.fill();
    if (angry) {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-28, -32); ctx.lineTo(-6, -24);
      ctx.moveTo(28, -32); ctx.lineTo(6, -24);
      ctx.stroke();
    }
  }
  // 엄니
  ctx.fillStyle = '#fffaf0';
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 12, 0); ctx.lineTo(s * 8, -12); ctx.lineTo(s * 4, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  // 앞 팔
  ctx.lineWidth = 5;
  ctx.fillStyle = body;
  ellipse(ctx, -50, 6, 14, 18); ctx.fill(); ctx.stroke();
  ctx.restore();

  if (stunned) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI * 2) / 3;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', x + Math.cos(a) * 44, y - 128 + Math.sin(a) * 10);
    }
  }
  if (shielded) {
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(t * 5) * 0.08;
    ctx.fillStyle = '#9ff3ff';
    ellipse(ctx, x, y - 46, 86, 90);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = '24px Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2fc7e0';
    for (let i = 0; i < 6; i++) {
      const a = t * 1.2 + (i * Math.PI * 2) / 6;
      ctx.fillText(['÷', '½', '¾', '×', '⅓', '='][i], x + Math.cos(a) * 82, y - 46 + Math.sin(a) * 86);
    }
    ctx.restore();
  }
}

export function drawRock(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 8);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#9a8f86';
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rr = r * (0.8 + (i % 2) * 0.25);
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ---------------- 4단계 보스 ----------------
function overlays(ctx, x, y, o) {
  const { t = 0, shielded, stunned } = o;
  if (stunned) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI * 2) / 3;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', x + Math.cos(a) * 44, y - 128 + Math.sin(a) * 10);
    }
  }
  if (shielded) {
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(t * 5) * 0.08;
    ctx.fillStyle = '#9ff3ff';
    ellipse(ctx, x, y - 46, 86, 90);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = '24px Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2fc7e0';
    for (let i = 0; i < 6; i++) {
      const a = t * 1.2 + (i * Math.PI * 2) / 6;
      ctx.fillText(['÷', '½', '¾', '×', '⅓', '='][i], x + Math.cos(a) * 82, y - 46 + Math.sin(a) * 86);
    }
    ctx.restore();
  }
}

function bossBegin(ctx, x, y, o, shadow = 60) {
  const { t = 0, facing = 1, flipped = 0, windup = 0, moving = false } = o;
  const bob = moving ? Math.abs(Math.sin(t * 8)) * -4 : Math.sin(t * 2) * 2;
  drawShadow(ctx, x, y + 6, shadow, 16);
  ctx.save();
  ctx.translate(x, y - 46 + bob);
  if (flipped > 0) ctx.rotate(Math.PI * flipped);
  ctx.scale(facing, 1);
  if (windup > 0) ctx.scale(1 + windup * 0.06, 1 - windup * 0.05);
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
}
const bfill = (o, c) => (o.flash > 0 ? '#ffffff' : c);

function bossEyes(ctx, y, gap, o, glow = '#fff') {
  ctx.fillStyle = glow;
  ellipse(ctx, -gap, y, 9, 10); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ellipse(ctx, gap, y, 9, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ellipse(ctx, -gap + 2, y + 2, 4, 5); ctx.fill();
  ellipse(ctx, gap + 2, y + 2, 4, 5); ctx.fill();
  if (!o.stunned) {
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-gap - 12, y - 16); ctx.lineTo(-gap + 8, y - 9);
    ctx.moveTo(gap + 12, y - 16); ctx.lineTo(gap - 8, y - 9);
    ctx.stroke();
  }
}

export function drawCubeKing(ctx, x, y, o) {
  bossBegin(ctx, x, y, o);
  const c = o.color || '#a77bff';
  ctx.fillStyle = bfill(o, shade(c, 0.3));
  ctx.beginPath(); ctx.moveTo(-46, -38); ctx.lineTo(-26, -56); ctx.lineTo(54, -56); ctx.lineTo(34, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bfill(o, shade(c, -0.25));
  ctx.beginPath(); ctx.moveTo(34, -38); ctx.lineTo(54, -56); ctx.lineTo(54, 30); ctx.lineTo(34, 48); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bfill(o, c);
  ctx.fillRect(-46, -38, 80, 86); ctx.strokeRect(-46, -38, 80, 86);
  ctx.strokeStyle = 'rgba(43,33,64,0.35)';
  ctx.lineWidth = 2;
  for (const g of [-19, 8]) { ctx.beginPath(); ctx.moveTo(g, -38); ctx.lineTo(g, 48); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-46, g + 10); ctx.lineTo(34, g + 10); ctx.stroke(); }
  ctx.strokeStyle = INK;
  bossEyes(ctx, -14, 16, o);
  ctx.fillStyle = '#ffd23f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-26, -56); ctx.lineTo(-24, -82); ctx.lineTo(-10, -66); ctx.lineTo(4, -88); ctx.lineTo(18, -66); ctx.lineTo(32, -82); ctx.lineTo(34, -56); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  overlays(ctx, x, y, o);
}

export function drawKraken(ctx, x, y, o) {
  bossBegin(ctx, x, y, o, 70);
  const c = o.color || '#ff7aa8';
  ctx.fillStyle = bfill(o, shade(c, -0.15));
  for (let i = 0; i < 6; i++) {
    const a = -1.2 + i * 0.48;
    const w = Math.sin(o.t * 4 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * 30, 24);
    ctx.quadraticCurveTo(Math.sin(a) * 60 + w, 50, Math.sin(a) * 70 + w, 70);
    ctx.lineTo(Math.sin(a) * 56 + w, 70);
    ctx.quadraticCurveTo(Math.sin(a) * 40, 50, Math.sin(a) * 16, 26);
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = bfill(o, c);
  ctx.beginPath(); ctx.ellipse(0, -10, 52, 56, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, -18, -40, 12, 8); ctx.fill();
  bossEyes(ctx, -6, 18, o, '#fff6a8');
  ctx.fillStyle = INK;
  ctx.font = '30px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('.', 0, 30);
  ctx.restore();
  overlays(ctx, x, y, o);
}

export function drawScaleKing(ctx, x, y, o) {
  bossBegin(ctx, x, y, o);
  const c = o.color || '#ffcc33';
  ctx.fillStyle = '#c2304a';
  ctx.beginPath(); ctx.moveTo(-44, -20); ctx.quadraticCurveTo(-60, 30, -40, 56); ctx.lineTo(40, 56); ctx.quadraticCurveTo(60, 30, 44, -20); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = bfill(o, '#b8c3d6');
  roundRect(ctx, -40, -40, 80, 92, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bfill(o, '#d6deeb');
  roundRect(ctx, -30, -76, 60, 48, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(-22, -58, 44, 8);
  ctx.fillStyle = o.windup > 0 ? '#ff5a6e' : '#ffe066';
  ctx.fillRect(-18, -57, 10, 6); ctx.fillRect(8, -57, 10, 6);
  ctx.fillStyle = bfill(o, c);
  ctx.beginPath(); ctx.moveTo(-28, -76); ctx.lineTo(-22, -96); ctx.lineTo(-6, -82); ctx.lineTo(0, -100); ctx.lineTo(6, -82); ctx.lineTo(22, -96); ctx.lineTo(28, -76); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // 천칭
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 30); ctx.moveTo(-28, -8); ctx.lineTo(28, -8); ctx.stroke();
  ctx.fillStyle = c;
  const tilt = Math.sin(o.t * 2) * 5;
  ellipse(ctx, -28, 6 + tilt, 12, 5); ctx.fill(); ctx.stroke();
  ellipse(ctx, 28, 6 - tilt, 12, 5); ctx.fill(); ctx.stroke();
  ctx.restore();
  overlays(ctx, x, y, o);
}

export function drawAncientTree(ctx, x, y, o) {
  bossBegin(ctx, x, y, o, 70);
  const c = o.color || '#4f9e5a';
  ctx.fillStyle = bfill(o, '#8a5a36');
  ctx.beginPath(); ctx.moveTo(-34, 56); ctx.lineTo(-24, -10); ctx.lineTo(24, -10); ctx.lineTo(34, 56); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sd * 22, 0); ctx.quadraticCurveTo(sd * 60, -10 + Math.sin(o.t * 3) * 8, sd * 66, 20); ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = '#8a5a36'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 5;
  }
  const blobs = [[0, -60, 50], [-44, -40, 30], [44, -40, 30], [0, -96, 30]];
  ctx.fillStyle = INK;
  for (const [bx, by, r] of blobs) { ellipse(ctx, bx, by, r + 5, r + 5); ctx.fill(); }
  ctx.fillStyle = bfill(o, c);
  for (const [bx, by, r] of blobs) { ellipse(ctx, bx, by, r, r); ctx.fill(); }
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ellipse(ctx, 0, -60, 30, 30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = INK;
  bossEyes(ctx, 14, 12, o, '#ffe066');
  ctx.restore();
  overlays(ctx, x, y, o);
}

export function drawTriGuardian(ctx, x, y, o) {
  bossBegin(ctx, x, y, o, 75);
  const c = o.color || '#b98cff';
  // 원기둥
  ctx.fillStyle = bfill(o, '#9fb7d9');
  ctx.fillRect(-70, -20, 40, 70); ctx.strokeRect(-70, -20, 40, 70);
  ellipse(ctx, -50, -20, 20, 7); ctx.fill(); ctx.stroke();
  // 원뿔
  ctx.fillStyle = bfill(o, c);
  ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(30, 50); ctx.lineTo(-30, 50); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 구
  ctx.fillStyle = bfill(o, '#8fe3ff');
  ellipse(ctx, 52, 14, 30, 30); ctx.fill(); ctx.stroke();
  for (const [ex, ey] of [[-50, 6], [0, 6], [52, 10]]) {
    ctx.fillStyle = '#fff'; ellipse(ctx, ex - 6, ey, 5, 6); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ellipse(ctx, ex + 6, ey, 5, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ellipse(ctx, ex - 5, ey + 1, 2.2, 3); ctx.fill(); ellipse(ctx, ex + 7, ey + 1, 2.2, 3); ctx.fill();
    ctx.lineWidth = 5;
  }
  ctx.restore();
  overlays(ctx, x, y, o);
}

export function drawChaosLord(ctx, x, y, o) {
  bossBegin(ctx, x, y, o, 75);
  const c = o.color || '#7a4fd6';
  ctx.fillStyle = bfill(o, '#2b2140');
  ctx.beginPath(); ctx.moveTo(-58, 56); ctx.quadraticCurveTo(-60, -20, 0, -40); ctx.quadraticCurveTo(60, -20, 58, 56); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bfill(o, c);
  ellipse(ctx, 0, -50, 40, 40); ctx.fill(); ctx.stroke();
  ctx.font = '22px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glyphs = ['÷', '×', '%', 'π', ':', '½'];
  for (let i = 0; i < 6; i++) {
    const a = o.t * 1.5 + (i * Math.PI * 2) / 6;
    ctx.fillStyle = ['#ff6f8e', '#ffd84d', '#9ff3ff', '#7dff9a', '#c7b6ff', '#ff9a3d'][i];
    ctx.fillText(glyphs[i], Math.cos(a) * 62, -50 + Math.sin(a) * 30);
  }
  bossEyes(ctx, -52, 14, o, '#ff6f8e');
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.moveTo(-26, -82); ctx.lineTo(-18, -104); ctx.lineTo(0, -88); ctx.lineTo(18, -104); ctx.lineTo(26, -82); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  overlays(ctx, x, y, o);
}

export const BOSS_SPRITES = {
  troll: drawTroll,
  cubeKing: drawCubeKing,
  kraken: drawKraken,
  scaleKing: drawScaleKing,
  ancientTree: drawAncientTree,
  triGuardian: drawTriGuardian,
  chaosLord: drawChaosLord,
};

// 보스 투사체 모양
export function drawProjectile(ctx, x, y, r, t, kind) {
  if (!kind || kind === 'rock') return drawRock(ctx, x, y, r, t);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  if (kind === 'cube' || kind === 'crystal') {
    ctx.rotate(t * 6);
    ctx.fillStyle = kind === 'cube' ? '#c7b6ff' : '#9ff3ff';
    ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    ctx.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
  } else if (kind === 'ink') {
    ctx.fillStyle = '#4a2f6b';
    ellipse(ctx, 0, 0, r, r * 0.85); ctx.fill(); ctx.stroke();
  } else if (kind === 'sword') {
    ctx.rotate(t * 10);
    ctx.fillStyle = '#e8f1ff';
    ctx.beginPath(); ctx.moveTo(0, -r * 1.3); ctx.lineTo(r * 0.4, r); ctx.lineTo(-r * 0.4, r); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'seed') {
    ctx.fillStyle = '#7dbf4a';
    ellipse(ctx, 0, 0, r * 0.8, r); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = ['#ff6f8e', '#ffd84d', '#9ff3ff'][Math.floor(t * 4) % 3];
    ctx.font = `${r * 2}px Jua, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('÷', 0, 0);
    ctx.fillText('÷', 0, 0);
  }
  ctx.restore();
}
