// 캐릭터·사물 그리기 (Canvas 도형)
// 나중에 PNG 그림으로 바꿀 때는 이 파일의 함수 안쪽만 drawImage로 바꾸면 됩니다.

import { shade } from '../core/utils.js';
import { artTree, artBush, artRock, artFlower, artHouse, drawNpcArt, drawPlaque, artNewBuilding, artState } from './envArt.js';
import { assets } from './AssetManager.js';

export const INK = '#2b2140';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

// 오래된 태블릿 브라우저에도 되는 둥근 사각형
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShadow(ctx, x, y, rx, ry = rx * 0.35) {
  ctx.fillStyle = 'rgba(30, 50, 20, 0.22)';
  ellipse(ctx, x, y, rx, ry);
  ctx.fill();
}

// ---------------- 주인공 ----------------
export function drawHero(ctx, x, y, o = {}) {
  const {
    color = '#ff8a5c', t = 0, moving = false, facing = { x: 1, y: 0 },
    attack = -1, dodge = false, scale = 1, blink = false, guard = false, dead = false,
  } = o;
  const fx = facing.x >= 0 ? 1 : -1;
  const bob = moving ? -Math.abs(Math.sin(t * 12)) * 3 : Math.sin(t * 3) * 1;
  const step = moving ? Math.sin(t * 12) * 3 : 0;
  const backView = facing.y < -0.7 && Math.abs(facing.x) < 0.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawShadow(ctx, 0, 21, 17, 6);
  if (dead) {
    ctx.rotate(Math.PI / 2 * 0.9);
    ctx.globalAlpha = 0.75;
  }
  if (dodge) ctx.globalAlpha = 0.7;
  if (blink) ctx.globalAlpha = 0.35;
  if (guard) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t * 8) * 0.08;
    ctx.fillStyle = '#8fe3ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ellipse(ctx, 0, -4, 32, 34);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 발
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#6b4a32';
  ellipse(ctx, -8, 17 + step, 6, 4.5); ctx.fill(); ctx.stroke();
  ellipse(ctx, 8, 17 - step, 6, 4.5); ctx.fill(); ctx.stroke();

  ctx.translate(0, bob);
  if (backView) drawSword(ctx, facing, attack);

  // 몸
  ctx.lineWidth = 4;
  ctx.fillStyle = color;
  ellipse(ctx, 0, 0, 19, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, 0, 7, 11, 7); ctx.fill();

  // 얼굴
  if (!backView) {
    const ex = fx * 3;
    ctx.fillStyle = INK;
    ellipse(ctx, -6 + ex, -2, 2.8, 3.8); ctx.fill();
    ellipse(ctx, 6 + ex, -2, 2.8, 3.8); ctx.fill();
    ctx.fillStyle = '#fff';
    ellipse(ctx, -5.2 + ex, -3.6, 1, 1.2); ctx.fill();
    ellipse(ctx, 6.8 + ex, -3.6, 1, 1.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,110,140,0.55)';
    ellipse(ctx, -11 + ex, 4, 3.2, 2); ctx.fill();
    ellipse(ctx, 11 + ex, 4, 3.2, 2); ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, 3.5, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  // 모험가 모자
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = shade(color, -0.3);
  ctx.beginPath();
  ctx.moveTo(-18, -7);
  ctx.quadraticCurveTo(-13, -24, -2 + fx * 3, -31);
  ctx.quadraticCurveTo(11, -22, 18, -7);
  ctx.quadraticCurveTo(0, -13, -18, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.fillStyle = '#ffe066';
  ellipse(ctx, -2 + fx * 3, -32, 4.5, 4.5); ctx.fill(); ctx.stroke();

  if (!backView) drawSword(ctx, facing, attack);
  ctx.restore();
}

function drawSword(ctx, facing, attack) {
  const base = Math.atan2(facing.y, facing.x);
  let ang;
  if (attack >= 0) {
    ang = base - 1.3 + attack * 2.6;
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - attack);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 4, 40, base - 1.3, ang);
    ctx.stroke();
    ctx.restore();
  } else {
    ang = facing.x >= 0 ? 0.6 : Math.PI - 0.6;
  }
  const off = attack >= 0 ? 12 : 14;
  ctx.save();
  ctx.translate(0, 4);
  ctx.rotate(ang);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#e8f1ff';
  ctx.beginPath();
  ctx.moveTo(off + 6, -3.5);
  ctx.lineTo(off + 30, -2.5);
  ctx.lineTo(off + 36, 0);
  ctx.lineTo(off + 30, 2.5);
  ctx.lineTo(off + 6, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffcc33';
  roundRect(ctx, off + 2, -7, 5, 14, 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a4f2e';
  roundRect(ctx, off - 6, -2.5, 8, 5, 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ---------------- 자연물 ----------------
export function drawTree(ctx, x, y, s = 1, leaf = '#4cbf5a') {
  if (artTree(ctx, x, y, s, leaf)) return;
  drawShadow(ctx, x, y + 2, 26 * s, 8 * s);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#8a5a36';
  roundRect(ctx, x - 6 * s, y - 20 * s, 12 * s, 22 * s, 4);
  ctx.fill(); ctx.stroke();
  const blobs = [[0, -44, 24], [-17, -32, 17], [17, -32, 17], [0, -60, 17]];
  ctx.fillStyle = INK;
  for (const [bx, by, r] of blobs) { ellipse(ctx, x + bx * s, y + by * s, r * s + 4, r * s + 4); ctx.fill(); }
  ctx.fillStyle = leaf;
  for (const [bx, by, r] of blobs) { ellipse(ctx, x + bx * s, y + by * s, r * s, r * s); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ellipse(ctx, x - 7 * s, y - 60 * s, 7 * s, 5 * s); ctx.fill();
  ellipse(ctx, x - 20 * s, y - 36 * s, 5 * s, 4 * s); ctx.fill();
}

export function drawBush(ctx, x, y, s = 1, color = '#5cc95f') {
  if (artBush(ctx, x, y, s, color)) return;
  drawShadow(ctx, x, y + 2, 20 * s, 6 * s);
  const blobs = [[-10, -8, 11], [10, -8, 11], [0, -15, 12]];
  ctx.fillStyle = INK;
  for (const [bx, by, r] of blobs) { ellipse(ctx, x + bx * s, y + by * s, r * s + 3.5, r * s + 3.5); ctx.fill(); }
  ctx.fillStyle = color;
  for (const [bx, by, r] of blobs) { ellipse(ctx, x + bx * s, y + by * s, r * s, r * s); ctx.fill(); }
}

export function drawFlower(ctx, x, y, color = '#ff7aa8') {
  if (artFlower(ctx, x, y, color)) return;
  ctx.strokeStyle = '#3f8f3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 8);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ellipse(ctx, x + Math.cos(a) * 3.6, y - 10 + Math.sin(a) * 3.6, 2.8, 2.8);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe066';
  ellipse(ctx, x, y - 10, 2.2, 2.2);
  ctx.fill();
}

export function drawRock(ctx, x, y, s = 1) {
  if (artRock(ctx, x, y, s)) return;
  drawShadow(ctx, x, y + 1, 16 * s, 5 * s);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#b8bfcc';
  ctx.beginPath();
  ctx.moveTo(x - 15 * s, y);
  ctx.quadraticCurveTo(x - 16 * s, y - 14 * s, x - 4 * s, y - 17 * s);
  ctx.quadraticCurveTo(x + 12 * s, y - 18 * s, x + 15 * s, y - 4 * s);
  ctx.quadraticCurveTo(x + 14 * s, y + 2 * s, x - 15 * s, y);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, x - 5 * s, y - 11 * s, 4 * s, 2.5 * s);
  ctx.fill();
}

export function drawWindmill(ctx, x, y, t) {
  // 풍차 그림이 없어 새 목조 창고로 대신 (농가 분위기 유지)
  if (artNewBuilding(ctx, 'house_roof_green', x, y + 8, 200, { folder: 'buildings' })) return;
  drawShadow(ctx, x, y + 2, 40, 10);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#fff4d6';
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.lineTo(x - 18, y - 110);
  ctx.lineTo(x + 18, y - 110);
  ctx.lineTo(x + 30, y);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e06b4f';
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 108);
  ctx.lineTo(x, y - 140);
  ctx.lineTo(x + 26, y - 108);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a36';
  roundRect(ctx, x - 9, y - 28, 18, 28, 6);
  ctx.fill(); ctx.stroke();
  // 날개
  ctx.save();
  ctx.translate(x, y - 108);
  ctx.rotate(t * 0.8);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.rect(6, -8, 52, 16);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(58, 0);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffcc33';
  ellipse(ctx, 0, 0, 7, 7);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawSign(ctx, x, y, text) {
  if (assets.get('village2/signpost')) {
    assets.draw(ctx, 'village2/signpost', x, y + 4, { height: 78 });
    drawPlaque(ctx, x, y - 92, text);
    return;
  }
  drawShadow(ctx, x, y + 2, 18, 5);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#9a6a40';
  roundRect(ctx, x - 4, y - 40, 8, 42, 3);
  ctx.fill(); ctx.stroke();
  ctx.font = '15px Jua, sans-serif';
  const w = Math.max(80, ctx.measureText(text).width + 24);
  ctx.fillStyle = '#d9a466';
  roundRect(ctx, x - w / 2, y - 66, w, 30, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 50);
}

// 안내 요정
export function drawFairy(ctx, x, y, t) {
  // 새 요정 피피: 대기 3장(2fps) / 대화 4장(4fps), 살짝 떠 있음
  if (assets.get('pack4/pipi/idle_01')) {
    const tk = artState.talk;
    const talking = tk && Math.abs(tk.x - x) < 90 && Math.abs(tk.y - y) < 70;
    const f = talking ? `talk_0${1 + (Math.floor(t * 4) % 4)}` : `idle_0${1 + (Math.floor(t * 2) % 3)}`;
    const fly = 14 + Math.sin(t * 3) * 4;
    drawShadow(ctx, x, y + 2, 14 - fly * 0.2, 4);
    assets.draw(ctx, `pack4/pipi/${f}`, x, y + 2 - fly, { height: 74 });
    return;
  }
  if (drawNpcArt(ctx, 'fairy', x, y, t)) return;
  const by = y - 28 + Math.sin(t * 2.5) * 5;
  drawShadow(ctx, x, y, 12, 4);
  ctx.save();
  ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.1;
  ctx.fillStyle = '#fff6a8';
  ellipse(ctx, x, by, 26, 26);
  ctx.fill();
  ctx.restore();
  const flap = Math.sin(t * 18) * 0.35;
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = 'rgba(190,240,255,0.9)';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(x + side * 6, by - 4);
    ctx.rotate(side * (0.5 + flap));
    ellipse(ctx, side * 11, -4, 12, 7);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 3.5;
  ctx.fillStyle = '#ffd1f0';
  ellipse(ctx, x, by, 11, 11);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ellipse(ctx, x - 3.5, by - 1, 1.6, 2.2); ctx.fill();
  ellipse(ctx, x + 3.5, by - 1, 1.6, 2.2); ctx.fill();
  ctx.fillStyle = '#ffe066';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    const px = x + Math.cos(a) * 6;
    const py = by - 17 + Math.sin(a) * 6;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

// 말풍선
export function drawBubble(ctx, x, y, text) {
  ctx.font = '16px Jua, sans-serif';
  const w = ctx.measureText(text).width + 28;
  const h = 34;
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#fffaf0';
  roundRect(ctx, x - w / 2, y - h, w, h, 12);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 1.5);
  ctx.lineTo(x, y + 9);
  ctx.lineTo(x + 7, y - 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(x - 6, y - 4, 12, 4);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - h / 2 + 1);
}

// 허수아비 (2단계 전투 연습용 자리)
export function drawDummy(ctx, x, y, t, hitT = 0) {
  const wobble = hitT > 0 ? Math.sin(hitT * 40) * 0.15 * hitT * 4 : 0;
  drawShadow(ctx, x, y + 2, 16, 5);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wobble);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#9a6a40';
  roundRect(ctx, -4, -46, 8, 48, 3);
  ctx.fill(); ctx.stroke();
  roundRect(ctx, -26, -38, 52, 8, 3);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f3d27a';
  ellipse(ctx, 0, -26, 16, 14);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c45a';
  ellipse(ctx, 0, -56, 13, 13);
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-6, -60); ctx.lineTo(-2, -56); ctx.moveTo(-2, -60); ctx.lineTo(-6, -56);
  ctx.moveTo(2, -60); ctx.lineTo(6, -56); ctx.moveTo(6, -60); ctx.lineTo(2, -56);
  ctx.stroke();
  ctx.restore();
}

// ---------------- NPC · 물건 ----------------
// 룬 할아버지 (스킬 마스터)
export function drawRuneMaster(ctx, x, y, t) {
  if (drawNpcArt(ctx, 'sage', x, y, t)) return;
  drawShadow(ctx, x, y + 2, 20, 6);
  const sway = Math.sin(t * 1.6) * 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  // 지팡이
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(22, 2); ctx.lineTo(24 + sway, -62); ctx.stroke();
  ctx.strokeStyle = '#9a6a40';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.globalAlpha = 0.45 + Math.sin(t * 3) * 0.15;
  ctx.fillStyle = '#9ff3ff';
  ellipse(ctx, 24 + sway, -68, 12, 12); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#5fe0f0';
  ellipse(ctx, 24 + sway, -68, 6, 6); ctx.fill(); ctx.stroke();
  // 로브
  ctx.lineWidth = 4;
  ctx.fillStyle = '#5767d9';
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.quadraticCurveTo(-16, -30, -10, -36);
  ctx.lineTo(10, -36);
  ctx.quadraticCurveTo(16, -30, 18, 2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // 얼굴
  ctx.fillStyle = '#ffd9b3';
  ellipse(ctx, 0, -42, 12, 11); ctx.fill(); ctx.stroke();
  // 수염
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-11, -40);
  ctx.quadraticCurveTo(-10, -18, 0, -14);
  ctx.quadraticCurveTo(10, -18, 11, -40);
  ctx.quadraticCurveTo(0, -34, -11, -40);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ellipse(ctx, -4, -44, 1.6, 2); ctx.fill();
  ellipse(ctx, 4, -44, 1.6, 2); ctx.fill();
  // 모자
  ctx.fillStyle = '#7b4fd6';
  ctx.beginPath();
  ctx.moveTo(-17, -48);
  ctx.quadraticCurveTo(-4, -60, 4 + sway, -82);
  ctx.quadraticCurveTo(8, -60, 17, -48);
  ctx.quadraticCurveTo(0, -52, -17, -48);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe066';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 1, -56);
  ctx.restore();
}

// 퀘스트 게시판
// 퀘스트 게시판: 새 게시판 그림 (마을 양식별로 다른 게시판)
const BOARD_BY_STYLE = { cube: 'pack4/cube/cube_notice_board', castle: 'pack4/boards/quest_board_guild', harbor: 'pack4/boards/quest_board_blue_roof', snow: 'pack4/boards/quest_board_blue_roof', forest: 'pack4/boards/quest_board_wood' };
export function drawBoard(ctx, x, y, style = null) {
  const bk = BOARD_BY_STYLE[style] || 'pack4/boards/quest_board_wood';
  if (assets.get(bk)) { assets.draw(ctx, bk, x, y + 6, { height: style === 'cube' ? 104 : 112 }); return; }
  drawShadow(ctx, x, y + 2, 34, 7);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#8a5a36';
  roundRect(ctx, -30, -50, 7, 52, 3); ctx.fill(); ctx.stroke();
  roundRect(ctx, 23, -50, 7, 52, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c48a52';
  roundRect(ctx, -36, -62, 72, 44, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b5523b';
  ctx.beginPath();
  ctx.moveTo(-42, -60); ctx.lineTo(0, -76); ctx.lineTo(42, -60); ctx.closePath();
  ctx.fill(); ctx.stroke();
  const notes = [[-28, -56, -0.08, '#fffaf0'], [-4, -58, 0.05, '#fff2a8'], [14, -54, -0.04, '#d8f7e0']];
  ctx.lineWidth = 2.5;
  for (const [nx, ny, r, c] of notes) {
    ctx.save();
    ctx.translate(nx + 8, ny + 15);
    ctx.rotate(r);
    ctx.fillStyle = c;
    ctx.fillRect(-9, -14, 18, 28);
    ctx.strokeRect(-9, -14, 18, 28);
    ctx.strokeStyle = 'rgba(43,33,64,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(-6, -7 + i * 7); ctx.lineTo(6, -7 + i * 7); }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
  }
  ctx.restore();
}

// 고대 룬 돌
export function drawRuneStone(ctx, x, y, active, t) {
  // 새 던전 소품: 부서진 돌기둥 + 룬 빛 (활성화되면 금빛)
  if (assets.get('dungeon3/ruined_stone_post')) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y - 40, 4, x, y - 40, 70);
    g.addColorStop(0, active ? 'rgba(255,215,90,0.55)' : `rgba(140,200,255,${0.25 + Math.sin(t * 2.5) * 0.08})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 70, y - 110, 140, 140);
    assets.draw(ctx, 'dungeon3/ruined_stone_post', x, y + 6, { height: 96 });
    ctx.font = '26px Jua, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = active ? '#ffe27a' : `rgba(160,220,255,${0.6 + Math.sin(t * 3) * 0.3})`;
    ctx.fillText('÷', x, y - 46);
    ctx.restore();
    return;
  }
  drawShadow(ctx, x, y + 2, 26, 7);
  ctx.save();
  ctx.translate(x, y);
  if (active) {
    ctx.globalAlpha = 0.3 + Math.sin(t * 2.5) * 0.12;
    ctx.fillStyle = '#9ff3ff';
    ellipse(ctx, 0, -34, 46, 50);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = active ? '#c7d6e8' : '#9fa8b8';
  ctx.beginPath();
  ctx.moveTo(-22, 2);
  ctx.lineTo(-24, -50);
  ctx.quadraticCurveTo(-20, -74, 0, -76);
  ctx.quadraticCurveTo(20, -74, 24, -50);
  ctx.lineTo(22, 2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.font = '34px Jua, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (active) {
    ctx.shadowColor = '#5fe0f0';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#2fc7e0';
  } else {
    ctx.fillStyle = '#6b7385';
  }
  ctx.fillText('÷', 0, -38);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// 상자 (일반 / 황금 수학 상자)
export function drawChest(ctx, x, y, { golden = false, opened = false, t = 0 } = {}) {
  // 새 보물상자 그림 (수학 상자는 금빛, 연 상자는 어둡게 — 열린 상자 그림은 아직 없음)
  const ck = `pack4/chests/chest_${golden ? 'gold' : 'wood'}_${opened ? 'open' : 'closed'}`;
  if (assets.get(ck)) {
    ctx.save();
    if (golden && !opened) {
      const g = ctx.createRadialGradient(x, y - 20, 4, x, y - 20, 60);
      g.addColorStop(0, `rgba(255,220,90,${0.4 + Math.sin(t * 3) * 0.12})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 60, y - 80, 120, 120);
    }
    assets.draw(ctx, ck, x, y + 6, { height: 56 });
    ctx.restore();
    return;
  }
  if (assets.get('dungeon3/treasure_chest')) {
    ctx.save();
    if (golden && !opened) {
      const g = ctx.createRadialGradient(x, y - 20, 4, x, y - 20, 60);
      g.addColorStop(0, `rgba(255,220,90,${0.45 + Math.sin(t * 3) * 0.12})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 60, y - 80, 120, 120);
    }
    assets.draw(ctx, 'dungeon3/treasure_chest', x, y + 6, { height: 46, alpha: opened ? 0.55 : 1, tint: golden && !opened ? '#ffd23a' : null, tintA: 0.22 });
    ctx.restore();
    return;
  }
  drawShadow(ctx, x, y + 2, 24, 7);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  const body = golden ? '#ffcc33' : '#b57d48';
  const band = golden ? '#e08a1e' : '#7a4f2e';
  if (golden && !opened) {
    ctx.globalAlpha = 0.25 + Math.sin(t * 3) * 0.12;
    ctx.fillStyle = '#fff6a8';
    ellipse(ctx, 0, -14, 40, 30);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = body;
  roundRect(ctx, -22, -22, 44, 24, 4); ctx.fill(); ctx.stroke();
  if (opened) {
    ctx.fillStyle = '#3a2a1f';
    roundRect(ctx, -19, -26, 38, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = body;
    roundRect(ctx, -22, -44, 44, 16, 6); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.quadraticCurveTo(-22, -40, 0, -40);
    ctx.quadraticCurveTo(22, -40, 22, -22);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = band;
    roundRect(ctx, -5, -28, 10, 13, 3); ctx.fill(); ctx.stroke();
    if (golden) {
      ctx.fillStyle = '#fff';
      ctx.font = '13px Jua, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('÷', 0, -21);
    }
  }
  ctx.fillStyle = band;
  ctx.fillRect(-22, -12, 44, 4);
  ctx.strokeRect(-22, -12, 44, 4);
  ctx.restore();
}

// 작은 오두막
export function drawHouse(ctx, x, y) {
  if (artHouse(ctx, x, y, 120, '', 'house_blue')) return;
  drawShadow(ctx, x, y + 2, 62, 12);
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#fff1d0';
  ctx.fillRect(-50, -56, 100, 58);
  ctx.strokeRect(-50, -56, 100, 58);
  ctx.fillStyle = '#c85a3a';
  ctx.beginPath();
  ctx.moveTo(-62, -52); ctx.lineTo(0, -102); ctx.lineTo(62, -52); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a36';
  roundRect(ctx, -12, -36, 24, 38, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fe0ff';
  ctx.fillRect(22, -42, 18, 16); ctx.strokeRect(22, -42, 18, 16);
  ctx.fillRect(-40, -42, 18, 16); ctx.strokeRect(-40, -42, 18, 16);
  ctx.restore();
}

// 바닥에 떨어진 보상
export function drawPickup(ctx, x, y, kind, color, t, icon) {
  const bob = Math.sin(t * 5) * 2.5;
  drawShadow(ctx, x, y + 4, 9, 3);
  ctx.save();
  ctx.translate(x, y - 8 + bob);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  if (kind === 'gold') {
    ctx.fillStyle = '#ffd23f';
    ellipse(ctx, 0, 0, 8, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3a8';
    ellipse(ctx, -2, -2, 2.5, 2.5); ctx.fill();
  } else {
    ctx.fillStyle = color || '#fff';
    ctx.globalAlpha = 0.35;
    ellipse(ctx, 0, 0, 15, 15); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon || '🎁', 0, 1);
  }
  ctx.restore();
}

// 상호작용 안내 (E 대화하기)
export function drawPrompt(ctx, x, y, text, t) {
  // 상호작용 안내: 어두운 반투명 알약 + 금색 테두리, 왼쪽에 키(E) 단추, 오른쪽에 할 일
  const sp = text.indexOf(' ');
  const key = sp > 0 ? text.slice(0, sp) : '';
  const label = sp > 0 ? text.slice(sp + 1) : text;
  ctx.save();
  ctx.font = 'bold 15px NanumSquareRound, Jua, sans-serif';
  const lw = ctx.measureText(label).width;
  const kw = key ? 22 : 0;
  const w = lw + kw + (key ? 26 : 20);
  const h = 28;
  const yy = Math.round(y + Math.sin(t * 4) * 1.5 - h);
  const x0 = Math.round(x - w / 2);
  ctx.fillStyle = 'rgba(20, 14, 32, 0.82)';
  ctx.strokeStyle = '#e8c36a';
  ctx.lineWidth = 2;
  roundRect(ctx, x0, yy, w, h, 14);
  ctx.fill(); ctx.stroke();
  ctx.textBaseline = 'middle';
  if (key) {
    ctx.fillStyle = '#ffe9a8';
    roundRect(ctx, x0 + 5, yy + 4, kw, h - 8, 6);
    ctx.fill();
    ctx.fillStyle = '#2b2140';
    ctx.font = '14px Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(key, x0 + 5 + kw / 2, yy + h / 2 + 1);
  }
  ctx.font = 'bold 15px NanumSquareRound, Jua, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff4d6';
  ctx.fillText(label, x0 + (key ? kw + 13 : 10), yy + h / 2 + 1);
  // 아래로 향한 작은 꼬리
  ctx.fillStyle = 'rgba(20, 14, 32, 0.82)';
  ctx.beginPath(); ctx.moveTo(x - 6, yy + h - 1); ctx.lineTo(x + 6, yy + h - 1); ctx.lineTo(x, yy + h + 6); ctx.closePath(); ctx.fill();
  ctx.restore();
}

