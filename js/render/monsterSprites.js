// 몬스터 그리기 (Canvas 도형) — 나중에 PNG로 바꿀 때는 이 파일만 고치면 됩니다.
import { INK, drawShadow, roundRect } from './sprites.js';
import { shade } from '../core/utils.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function eyes(ctx, ex, ey, gap, angry) {
  ctx.fillStyle = INK;
  ellipse(ctx, ex - gap, ey, 2.4, 3.4); ctx.fill();
  ellipse(ctx, ex + gap, ey, 2.4, 3.4); ctx.fill();
  ctx.fillStyle = '#fff';
  ellipse(ctx, ex - gap + 0.8, ey - 1.3, 0.9, 1); ctx.fill();
  ellipse(ctx, ex + gap + 0.8, ey - 1.3, 0.9, 1); ctx.fill();
  if (angry) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ex - gap - 4, ey - 7); ctx.lineTo(ex - gap + 2, ey - 4.5);
    ctx.moveTo(ex + gap + 4, ey - 7); ctx.lineTo(ex + gap - 2, ey - 4.5);
    ctx.stroke();
  }
}

export function drawSlime(ctx, x, y, o) {
  const { color, t, scale = 1, flash = 0, windup = 0, attacking = false, outline = INK, facing = 1 } = o;
  const bounce = attacking ? 10 : Math.abs(Math.sin(t * 5)) * 4;
  const sq = windup > 0 ? 1 - windup * 0.28 : 1 + Math.sin(t * 10) * 0.03;
  drawShadow(ctx, x, y + 13 * scale, 18 * scale, 6 * scale);
  ctx.save();
  ctx.translate(x, y - bounce * scale);
  ctx.scale(scale * (windup > 0 ? 1 + windup * 0.15 : 1), scale);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.fillStyle = flash > 0 ? '#ffffff' : color;
  ctx.beginPath();
  ctx.moveTo(-19, 12);
  ctx.quadraticCurveTo(-21, -16 * sq, 0, -19 * sq);
  ctx.quadraticCurveTo(21, -16 * sq, 19, 12);
  ctx.quadraticCurveTo(0, 17, -19, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -7, -9 * sq, 5, 3); ctx.fill();
  eyes(ctx, facing * 2, 0, 6, windup > 0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(facing * 2, 4, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function drawMushroom(ctx, x, y, o) {
  const { color, t, scale = 1, flash = 0, windup = 0, outline = INK, moving = false } = o;
  const cap = 1 + windup * 0.3;
  const step = moving ? Math.sin(t * 10) * 2.5 : 0;
  drawShadow(ctx, x, y + 15 * scale, 20 * scale, 6 * scale);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  // 발
  ctx.fillStyle = '#c9a27a';
  ellipse(ctx, -7, 15 + step, 5, 3.5); ctx.fill(); ctx.stroke();
  ellipse(ctx, 7, 15 - step, 5, 3.5); ctx.fill(); ctx.stroke();
  // 줄기
  ctx.fillStyle = flash > 0 ? '#fff' : '#fff3dc';
  roundRect(ctx, -12, -6, 24, 22, 9);
  ctx.fill(); ctx.stroke();
  eyes(ctx, 0, 4, 5, windup > 0);
  // 갓
  ctx.fillStyle = flash > 0 ? '#ffffff' : color;
  ctx.beginPath();
  ctx.moveTo(-25 * cap, -3);
  ctx.quadraticCurveTo(-27 * cap, -31 * cap, 0, -32 * cap);
  ctx.quadraticCurveTo(27 * cap, -31 * cap, 25 * cap, -3);
  ctx.quadraticCurveTo(0, 3, -25 * cap, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  for (const [sx, sy, r] of [[-11, -17, 4.5], [8, -22, 4], [14, -9, 3.5], [-2, -9, 3]]) {
    ellipse(ctx, sx * cap, sy * cap, r, r);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBat(ctx, x, y, o) {
  const { color, t, scale = 1, flash = 0, windup = 0, attacking = false, outline = INK } = o;
  const hover = 26 + Math.sin(t * 4) * 4 + (windup > 0 ? windup * 10 : 0) - (attacking ? 10 : 0);
  const flap = Math.sin(t * (attacking ? 30 : 16));
  drawShadow(ctx, x, y + 12 * scale, 14 * scale, 4 * scale);
  ctx.save();
  ctx.translate(x + (windup > 0 ? Math.sin(t * 60) * 2 : 0), y - hover * scale);
  ctx.scale(scale, scale);
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.fillStyle = flash > 0 ? '#fff' : shade(color, -0.2);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 9, -3);
    ctx.lineTo(side * 34, -12 + flap * 12);
    ctx.lineTo(side * 28, 4 + flap * 4);
    ctx.lineTo(side * 21, 1 + flap * 3);
    ctx.lineTo(side * 15, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = flash > 0 ? '#fff' : color;
  // 귀
  ctx.beginPath();
  ctx.moveTo(-9, -8); ctx.lineTo(-7, -19); ctx.lineTo(-2, -11);
  ctx.moveTo(9, -8); ctx.lineTo(7, -19); ctx.lineTo(2, -11);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, 0, 0, 13, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff6a8';
  ellipse(ctx, -4.5, -1, 3, 3.4); ctx.fill();
  ellipse(ctx, 4.5, -1, 3, 3.4); ctx.fill();
  ctx.fillStyle = INK;
  ellipse(ctx, -4.5, -0.5, 1.4, 2); ctx.fill();
  ellipse(ctx, 4.5, -0.5, 1.4, 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-3, 5); ctx.lineTo(-1.5, 9); ctx.lineTo(0, 5);
  ctx.moveTo(0, 5); ctx.lineTo(1.5, 9); ctx.lineTo(3, 5);
  ctx.fill();
  ctx.restore();
}

export function drawCrown(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(-11, 5);
  ctx.lineTo(-12, -6);
  ctx.lineTo(-5, -1);
  ctx.lineTo(0, -9);
  ctx.lineTo(5, -1);
  ctx.lineTo(12, -6);
  ctx.lineTo(11, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export const MONSTER_SPRITES = {
  slime: drawSlime,
  mushroom: drawMushroom,
  bat: drawBat,
};

// ---------------- 4단계 몬스터 ----------------
function begin(ctx, x, y, o, shadowR = 18, lift = 0) {
  const { scale = 1, outline = INK } = o;
  drawShadow(ctx, x, y + 14 * scale, shadowR * scale, 6 * scale);
  ctx.save();
  ctx.translate(x, y - lift * scale);
  ctx.scale(scale, scale);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
}
const fillOf = (o, c) => (o.flash > 0 ? '#ffffff' : c || o.color);

export function drawCubeMob(ctx, x, y, o) {
  const bounce = o.attacking ? 10 : Math.abs(Math.sin(o.t * 5)) * 4;
  begin(ctx, x, y, o, 18, bounce);
  const sq = o.windup > 0 ? 1 - o.windup * 0.2 : 1;
  ctx.fillStyle = fillOf(o, shade(o.color, 0.3));
  ctx.beginPath();
  ctx.moveTo(-17, -24 * sq); ctx.lineTo(-7, -32 * sq); ctx.lineTo(23, -32 * sq); ctx.lineTo(13, -24 * sq); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fillOf(o, shade(o.color, -0.2));
  ctx.beginPath();
  ctx.moveTo(13, -24 * sq); ctx.lineTo(23, -32 * sq); ctx.lineTo(23, 4); ctx.lineTo(13, 12); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fillOf(o);
  ctx.fillRect(-17, -24 * sq, 30, 36 - (1 - sq) * 24);
  ctx.strokeRect(-17, -24 * sq, 30, 36 - (1 - sq) * 24);
  eyes(ctx, -2, -6, 6, o.windup > 0);
  ctx.restore();
}

export function drawMimic(ctx, x, y, o) {
  begin(ctx, x, y, o, 20);
  const open = o.windup > 0 ? o.windup * 0.6 : Math.max(0, Math.sin(o.t * 2)) * 0.15;
  ctx.fillStyle = fillOf(o);
  roundRect(ctx, -22, -14, 44, 28, 4); ctx.fill(); ctx.stroke();
  ctx.save();
  ctx.translate(-22, -14);
  ctx.rotate(-open);
  ctx.fillStyle = fillOf(o, shade(o.color, 0.15));
  roundRect(ctx, 0, -16, 44, 16, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#c2304a';
  ctx.fillRect(-18, -12, 36, 4 + open * 10);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 10, -13); ctx.lineTo(-11 + i * 10, -6 - open * 6); ctx.lineTo(-6 + i * 10, -13);
    ctx.fill();
  }
  ctx.fillStyle = INK;
  ellipse(ctx, -7, 2, 2.4, 3); ctx.fill();
  ellipse(ctx, 7, 2, 2.4, 3); ctx.fill();
  ctx.restore();
}

export function drawRobot(ctx, x, y, o) {
  const hover = 6 + Math.sin(o.t * 4) * 3;
  begin(ctx, x, y, o, 16, hover);
  ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -40); ctx.stroke();
  ctx.fillStyle = o.windup > 0 ? '#ff5a6e' : '#ffe066';
  ellipse(ctx, 0, -42, 4, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = fillOf(o);
  roundRect(ctx, -18, -30, 36, 28, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2b2140';
  roundRect(ctx, -12, -24, 24, 12, 5); ctx.fill();
  ctx.fillStyle = o.windup > 0 ? '#ff5a6e' : '#9ff3ff';
  ellipse(ctx, -5, -18, 3, 3); ctx.fill();
  ellipse(ctx, 5, -18, 3, 3); ctx.fill();
  ctx.fillStyle = fillOf(o, shade(o.color, -0.2));
  roundRect(ctx, -12, -2, 24, 14, 5); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawCrab(ctx, x, y, o) {
  begin(ctx, x, y, o, 22);
  const claw = o.windup > 0 ? o.windup * 0.6 : Math.sin(o.t * 6) * 0.15;
  ctx.fillStyle = fillOf(o, shade(o.color, -0.15));
  for (const sd of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sd * 14, 4 + i * 3); ctx.lineTo(sd * 26, 10 + i * 4);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(sd * 22, -12);
    ctx.rotate(sd * (-0.4 - claw));
    ctx.fillStyle = fillOf(o);
    ctx.beginPath();
    ctx.ellipse(0, -8, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(0, -8); ctx.lineTo(3, -18); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = fillOf(o);
  ellipse(ctx, 0, 0, 20, 13); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3;
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sd * 6, -10); ctx.lineTo(sd * 7, -20); ctx.stroke();
    ctx.fillStyle = '#fff'; ellipse(ctx, sd * 7, -22, 4, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ellipse(ctx, sd * 7, -22, 1.8, 2); ctx.fill();
  }
  ctx.fillStyle = INK;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('☠', 0, 5);
  ctx.restore();
}

export function drawOctopus(ctx, x, y, o) {
  const bob = Math.sin(o.t * 3) * 3;
  begin(ctx, x, y, o, 18, 4 + bob);
  ctx.fillStyle = fillOf(o, shade(o.color, -0.1));
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    const wv = Math.sin(o.t * 6 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * 14, 4);
    ctx.quadraticCurveTo(Math.sin(a) * 22 + wv, 14, Math.sin(a) * 26, 20);
    ctx.lineTo(Math.sin(a) * 18, 18);
    ctx.quadraticCurveTo(Math.sin(a) * 14 + wv, 10, Math.sin(a) * 8, 4);
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = fillOf(o);
  ctx.beginPath();
  ctx.ellipse(0, -10, 19, 20 * (o.windup > 0 ? 1 + o.windup * 0.15 : 1), 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  eyes(ctx, 0, -8, 6, o.windup > 0);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -8, -20, 4, 3); ctx.fill();
  ctx.restore();
}

export function drawGoblin(ctx, x, y, o) {
  const bounce = o.attacking ? 8 : Math.abs(Math.sin(o.t * 7)) * 3;
  begin(ctx, x, y, o, 16, bounce);
  ctx.fillStyle = fillOf(o);
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sd * 12, -18); ctx.lineTo(sd * 26, -26); ctx.lineTo(sd * 14, -8); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ellipse(ctx, 0, -10, 15, 15); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a36';
  roundRect(ctx, -11, 2, 22, 14, 5); ctx.fill(); ctx.stroke();
  eyes(ctx, 0, -12, 5, true);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-3, 1); ctx.lineTo(-1, -3); ctx.fill();
  ctx.fillStyle = '#e8b931';
  ctx.font = '12px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(':', 0, 13);
  ctx.restore();
}

export function drawGolemMob(ctx, x, y, o) {
  begin(ctx, x, y, o, 22);
  const sw = o.moving ? Math.sin(o.t * 6) * 3 : 0;
  ctx.fillStyle = fillOf(o, shade(o.color, -0.2));
  roundRect(ctx, -26, -18 + sw, 12, 22, 5); ctx.fill(); ctx.stroke();
  roundRect(ctx, 14, -18 - sw, 12, 22, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = fillOf(o);
  roundRect(ctx, -17, -32 * (o.windup > 0 ? 1 + o.windup * 0.15 : 1), 34, 46, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, -6, -22, 5, 3); ctx.fill();
  ctx.fillStyle = o.windup > 0 ? '#ff5a6e' : '#ffe066';
  ellipse(ctx, -6, -12, 3.5, 3.5); ctx.fill();
  ellipse(ctx, 6, -12, 3.5, 3.5); ctx.fill();
  ctx.restore();
}

export function drawKnightMob(ctx, x, y, o) {
  const hover = o.attacking ? 4 : Math.abs(Math.sin(o.t * 5)) * 2;
  begin(ctx, x, y, o, 17, hover);
  ctx.fillStyle = '#c2304a';
  ctx.beginPath(); ctx.moveTo(0, -36); ctx.quadraticCurveTo(10, -46, 14, -36); ctx.lineTo(4, -30); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fillOf(o);
  roundRect(ctx, -16, -32, 32, 44, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(-10, -20, 20, 5);
  ctx.fillStyle = o.windup > 0 ? '#ff5a6e' : '#ffe066';
  ctx.fillRect(-8, -19, 4, 3);
  ctx.fillRect(4, -19, 4, 3);
  ctx.fillStyle = '#e8b931';
  ctx.beginPath(); ctx.moveTo(18, -8); ctx.lineTo(30, -8); ctx.lineTo(30, 6); ctx.lineTo(24, 12); ctx.lineTo(18, 6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawWheelMob(ctx, x, y, o) {
  begin(ctx, x, y, o, 18);
  ctx.save();
  ctx.translate(0, -12);
  ctx.rotate(o.t * (o.attacking ? 14 : 3));
  ctx.fillStyle = fillOf(o);
  ellipse(ctx, 0, 0, 20, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(o.color, 0.35);
  ellipse(ctx, 0, 0, 12, 12); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.stroke();
  }
  ctx.restore();
  eyes(ctx, 0, -14, 5, o.windup > 0);
  ctx.restore();
}

export function drawConeWizard(ctx, x, y, o) {
  const hover = 4 + Math.sin(o.t * 3) * 3;
  begin(ctx, x, y, o, 16, hover);
  ctx.fillStyle = fillOf(o, shade(o.color, -0.25));
  ctx.beginPath(); ctx.moveTo(-18, 12); ctx.quadraticCurveTo(0, 18, 18, 12); ctx.lineTo(12, -6); ctx.lineTo(-12, -6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fillOf(o);
  ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(16, -4); ctx.lineTo(-16, -4); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe066';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 0, -24);
  ctx.fillStyle = o.windup > 0 ? '#ff5a6e' : '#9ff3ff';
  ellipse(ctx, -5, -10, 2.5, 2.5); ctx.fill();
  ellipse(ctx, 5, -10, 2.5, 2.5); ctx.fill();
  ctx.restore();
}

export function drawSphereSpirit(ctx, x, y, o) {
  const hover = 22 + Math.sin(o.t * 3) * 5 - (o.attacking ? 10 : 0);
  begin(ctx, x, y, o, 13, hover);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = o.color;
  ellipse(ctx, 0, -10, 26, 26); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = fillOf(o);
  ellipse(ctx, 0, -10, 16, 16); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(43,33,64,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ellipse(ctx, 0, -10, 16, 5); ctx.stroke();
  ctx.setLineDash([]);
  eyes(ctx, 0, -12, 5, o.windup > 0);
  ctx.restore();
}

Object.assign(MONSTER_SPRITES, {
  cube: drawCubeMob,
  mimic: drawMimic,
  robot: drawRobot,
  crab: drawCrab,
  octopus: drawOctopus,
  goblin: drawGoblin,
  golem: drawGolemMob,
  knight: drawKnightMob,
  wheel: drawWheelMob,
  cone: drawConeWizard,
  sphere: drawSphereSpirit,
});
