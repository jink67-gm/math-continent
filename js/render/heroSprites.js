// 주인공 그림 (남성/여성 모험가 스프라이트)
// 상태: 대기 · 이동 · 공격 1/2/3타 · 피격 · 스킬 · 회피 · 쓰러짐
// 그림 파일이 아직 없으면 false를 돌려주고, 기존 캔버스 주인공(drawHero)으로 대신 그려요.

import { assets } from './AssetManager.js';

export const HERO_VARIANTS = {
  male: { id: 'male', name: '남성 모험가', desc: '붉은 망토의 용감한 검사', folder: 'characters/male' },
  female: { id: 'female', name: '여성 모험가', desc: '포니테일의 날렵한 검사', folder: 'characters/female' },
};

const BACK_CYCLE = [1, 2, 3, 2];

export const HERO_HEIGHT = 78; // 화면에 그려지는 몸 높이(px)
const BODY_REF = 170;          // 그림 파일 속 몸 높이(px)
const FOOT = 21;               // 플레이어 좌표(몸 가운데) → 발까지 거리

function frameFor(o) {
  const { moving, facing, t, attackStep, hitT, skillT, dodge, dead } = o;
  if (dead) return { f: 'hit', side: true };
  if (attackStep > 0) return { f: `attack_${attackStep}`, side: true };
  if (skillT > 0) return { f: 'skill', side: true };
  if (hitT > 0) return { f: 'hit', side: true };
  if (dodge) return { f: 'walk_side_2', side: true };
  const down = facing.y > 0.55 && Math.abs(facing.x) < 0.75;
  const up = facing.y < -0.55 && Math.abs(facing.x) < 0.75;
  if (moving) {
    if (down) return { f: `walk_front_${1 + (Math.floor(t * 7) % 2)}`, side: false };
    // 위쪽으로 걷기: 뒷모습 1 → 2 → 3 → 2 반복
    if (up) return { f: `walk_back_${BACK_CYCLE[Math.floor(t * 8) % 4]}`, side: false, back: true };
    return { f: `walk_side_${1 + (Math.floor(t * 10) % 4)}`, side: true };
  }
  if (down) return { f: 'idle_front', side: false };
  if (up) return { f: 'idle_back', side: false, back: true };
  return { f: 'idle_side', side: true };
}

// ================= 새 주인공 시트 (assets/characters2) =================
// 시트 구조(남·녀 같음): 대기 4(아래·위·오른쪽·오른쪽2) / 걷기 아래·위·왼쪽 각 5 / 공격 아래·위·왼쪽 각 3
//                       회피 아래·위·왼쪽 각 2 / 피격 2 / 쓰러짐 2
// 시트에 있는 방향을 먼저 쓰고, 없는 방향(오른쪽 걷기·공격·회피, 왼쪽 대기)만 좌우 반전.
// 모든 프레임 기준점 = 머리 가운데(x) · 발 끝(y) → 걷거나 방향을 바꿔도 몸이 튀지 않음.
const NEW_FOLDER = 'characters2';
const NEW_BODY = { male: 136, female: 146 }; // 시트 속 대기 자세 몸 높이(px)
const STRIDE = 15;                           // 걷기 한 프레임 = 15px 이동 (속도와 발 맞추기)
const track = new Map();                      // 방향 유지·걸음 거리 기억
export const heroDebug = { frame: '', dir: '' }; // 점검용: 지금 그리는 프레임

function pickDir(fx, fy, prev) {
  const ax = Math.abs(fx), ay = Math.abs(fy);
  if (ax < 0.05 && ay < 0.05) return prev || 'down';
  const horiz = fx > 0 ? 'right' : 'left', vert = fy > 0 ? 'down' : 'up';
  // 대각선일 때는 지금 방향을 유지 (그림이 깜빡이지 않게)
  if (prev && (prev === horiz || prev === vert) && Math.min(ax, ay) > 0.35 * Math.max(ax, ay)) return prev;
  return ax >= ay ? horiz : vert;
}

function newFrame(o, st) {
  const d = st.dir;
  const side = d === 'left' || d === 'right';
  const mirror = d === 'right'; // 시트의 옆모습(걷기·공격·회피)은 왼쪽을 봄
  const sd = side ? 'left' : d;
  if (o.dead) return { f: 'down_2', flip: false };
  if (o.attackStep > 0) {
    const p = o.attackProgress ?? 0.5;
    return { f: `attack_${sd}_${p < 0.22 ? 1 : p < 0.62 ? 2 : 3}`, flip: mirror };
  }
  if (o.skillT > 0) return { f: `attack_${sd}_2`, flip: mirror };
  if (o.hitT > 0) return { f: o.hitT > 0.15 ? 'hit_1' : 'hit_2', flip: d === 'right' };
  if (o.dodge) {
    const first = (o.dodgeT ?? 0.1) > 0.09;
    return { f: `dodge_${sd}_${first ? 1 : 2}`, flip: mirror };
  }
  if (o.moving) {
    const i = 1 + (Math.floor(st.phase) % 5);
    return { f: `walk_${sd}_${i}`, flip: mirror };
  }
  if (d === 'right') return { f: 'idle_right', flip: false };
  if (d === 'left') return { f: 'idle_right', flip: true }; // 왼쪽 대기 그림이 시트에 없어 반전
  return { f: `idle_${d}`, flip: false };
}

// ---- v2 방향별 시트 (assets/characters3): 상하좌우 모두 전용 그림, 반전 없음 ----
const V3 = 'characters3';
const V3_BODY = { male: 156, female: 160 };
const V3_STRIDE = 20; // 걷기 한 프레임 = 20px 이동 → 기본 속도(약 195px/s)에서 초당 약 9.7프레임 (동작팩 권장 8~9fps 근처)
// 오른쪽 걷기 4프레임: 남자 1번은 핵심 에셋 v4의 검 든 보정 프레임(같은 원본·같은 크기·같은 기준점), 2~4번은 동작팩 v3
const RIGHT_WALK = { male: [1, 2, 3, 4], female: [1, 2, 3, 4] };
function v3Frame(o, st, variant) {
  const d = st.dir;
  if (o.dead) {
    // 쓰러짐 3단계 (휘청 → 넘어짐 → 엎드림), 그림이 없으면 예전 한 장
    const dt = (o.t || 0) - (st.deadAt ?? (st.deadAt = o.t || 0));
    if (assets.get(`${V3}/${variant}/fallen_seq_3`)) return `fallen_seq_${dt < 0.18 ? 1 : dt < 0.42 ? 2 : 3}`;
    return 'fallen_down_2';
  }
  st.deadAt = null;
  if (o.attackStep > 0) {
    const p = o.attackProgress ?? 0.5;
    return `attack_${d}_${p < 0.22 ? 1 : p < 0.62 ? 2 : 3}`;
  }
  if (o.skillT > 0) return `skill_${d}_1`;
  if (o.hitT > 0) return `hit_${d}_1`;
  if (o.dodge) {
    // 왼쪽 회피는 3프레임 구르기 (2차 팩), 나머지 방향은 2프레임
    if (d === 'left' && assets.get(`${V3}/${variant}/dodge_left_3`)) {
      const p = 1 - (o.dodgeT ?? 0) / 0.18;
      return `dodge_left_${p < 0.34 ? 1 : p < 0.67 ? 2 : 3}`;
    }
    return `dodge_${d}_${(o.dodgeT ?? 0.1) > 0.09 ? 1 : 2}`;
  }
  if (o.moving && d === 'right') return `walk_right_${(RIGHT_WALK[variant] || RIGHT_WALK.male)[Math.floor(st.phase) % 4]}`;
  if (o.moving) return `walk_${d}_${1 + (Math.floor(st.phase) % 4)}`;
  return `idle_${d}_0`;
}

function drawNewHero(ctx, x, y, o, variant) {
  const v3 = !!assets.get(`${V3}/${variant}/idle_down_0`);
  const key0 = v3 ? `${V3}/${variant}/idle_down_0` : `${NEW_FOLDER}/${variant}/idle_down`;
  if (!assets.get(key0)) return false;
  const tk = o.track || (o.scale ? `preview_${variant}` : 'player');
  let st = track.get(tk);
  if (!st) { st = { dir: 'down', phase: 0, x, y }; track.set(tk, st); }
  st.dir = pickDir(o.facing?.x ?? 0, o.facing?.y ?? 1, st.dir);
  const moved = Math.hypot(x - st.x, y - st.y);
  st.x = x; st.y = y;
  const stride = v3 ? V3_STRIDE : STRIDE;
  if (o.moving) st.phase += moved > 0.01 && moved < 60 ? moved / stride : (o.scale ? 0.14 : 0);
  // 추락 4프레임 (핵심 에셋 v4): 걷기·공격 그림 대신 이것만
  if (o.falling != null && assets.get(`pack5/fall/${variant}_1`)) return drawFall(ctx, x, y, o, variant);
  let f, flip = false;
  if (v3) {
    f = v3Frame(o, st, variant);
    // 아직 못 불러온 프레임은 같은 방향 대기 그림으로
    if (!assets.get(`${V3}/${variant}/${f}`)) f = f.startsWith('fall') ? 'fallen_down_2' : `idle_${st.dir}_0`;
  } else ({ f, flip } = newFrame(o, st));
  const folder = v3 ? V3 : NEW_FOLDER;
  let key = `${folder}/${variant}/${f}`;
  if (!assets.get(key)) key = key0;
  if (tk === 'player') { heroDebug.frame = f + (flip ? ' (반전)' : ''); heroDebug.dir = st.dir; }

  const k = o.scale || 1;
  const scale = (HERO_HEIGHT * 1.05 / ((v3 ? V3_BODY : NEW_BODY)[variant] || 140)) * k;
  const footY = y + FOOT * k;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 30, 15, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, footY, (o.dead ? 30 : 19) * k, 6.5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  if (o.guard) assets.draw(ctx, 'effects/shield_bubble', x, y - 14, { height: 96, center: true, alpha: 0.55 + Math.sin((o.t || 0) * 8) * 0.08 });
  if (o.blink) ctx.globalAlpha = 0.4;
  if (o.dodge) {
    const fx = o.facing?.x || 0, fy = o.facing?.y || 0;
    for (let i = 1; i <= 2; i++) assets.draw(ctx, key, x - fx * 16 * i, footY - fy * 16 * i, { scale, flipX: flip, alpha: 0.2 / i });
  }
  const sy = !o.moving && !o.attackStep && !o.dodge && !o.hitT && !o.dead ? 1 + Math.sin((o.t || 0) * 2.6) * 0.012 : 1;
  assets.draw(ctx, key, x, footY, { scale, flipX: flip, sy, flash: o.flash || 0 });
  ctx.restore();
  return true;
}

// 추락: 1 헛디딤(0~18%) → 2 떨어지기 시작(18~42%) → 3 추락 중(42~78%, 아래로 내려가며 작아짐) → 4 먼지(78~100%, 사라짐)
// 그림 크기는 v2 캐릭터와 같은 몸 높이에 맞춤(4프레임 같은 잘라내기 상자 → 같은 배율)
const FALL_BODY = { male: 170, female: 170 }; // 원본 256px 그림 그대로(배율 1) → 걷기 그림과 같은 원본 픽셀 배율이 되도록
function drawFall(ctx, x, y, o, variant) {
  const p = Math.max(0, Math.min(1, o.falling));
  const i = p < 0.18 ? 1 : p < 0.42 ? 2 : p < 0.78 ? 3 : 4;
  const key = `pack5/fall/${variant}_${i}`;
  const a = assets.get(key);
  if (!a) return false;
  const k = o.scale || 1;
  const base = (HERO_HEIGHT * 1.05 / FALL_BODY[variant]) * k;
  const footY = y + FOOT * k;
  let drop = 0, shrink = 1, alpha = 1;
  if (i === 3) { const q = (p - 0.42) / 0.36; drop = q * q * 46 * k; shrink = 1 - q * 0.35; }
  if (i === 4) { const q = (p - 0.78) / 0.22; drop = 46 * k; shrink = 0.8; alpha = 1 - q * 0.9; }
  ctx.save();
  if (i < 4) {
    ctx.fillStyle = `rgba(20, 30, 15, ${0.28 * shrink})`;
    ctx.beginPath(); ctx.ellipse(x, footY, 19 * k * shrink, 6.5 * k * shrink, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha *= alpha;
  const flipX = (o.facing?.x ?? 1) < -0.2;   // v4 추락 그림은 오른쪽을 봄
  assets.draw(ctx, key, x, footY + drop, { scale: base * shrink, flipX });
  ctx.restore();
  return true;
}

// x, y: 플레이어 좌표(몸 가운데). 성공하면 true
export function drawHeroSprite(ctx, x, y, o = {}) {
  const variant = HERO_VARIANTS[o.variant] ? o.variant : 'male';
  if (drawNewHero(ctx, x, y, o, variant)) return true;
  let { f, side, turn } = frameFor(o);
  let key = `${HERO_VARIANTS[variant].folder}/${f}`;
  if (!assets.get(key) && f.includes('back')) {
    // 뒷모습 그림이 아직 없으면 예전처럼 옆모습으로
    ({ f, side, turn } = o.moving ? { f: `walk_side_${1 + (Math.floor((o.t || 0) * 10) % 4)}`, side: true } : { f: 'idle_turn', side: true, turn: true });
    key = `${HERO_VARIANTS[variant].folder}/${f}`;
  }
  if (!assets.get(key)) return false;

  const scale = (HERO_HEIGHT / BODY_REF) * (o.scale || 1);
  const hx = o.lastHx ?? (o.facing?.x || -1);
  // 옆모습 그림은 왼쪽을 보고 있어요 → 오른쪽을 보면 뒤집기. (idle_turn은 오른쪽을 봄)
  const flipX = side ? (turn ? hx < 0 : hx > 0) : false;
  const footY = y + FOOT * (o.scale || 1);

  ctx.save();
  // 그림자
  ctx.fillStyle = 'rgba(20, 30, 15, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, footY, 19 * (o.scale || 1), 6.5 * (o.scale || 1), 0, 0, Math.PI * 2);
  ctx.fill();

  if (o.guard) {
    assets.draw(ctx, 'effects/shield_bubble', x, y - 14, { height: 96, center: true, alpha: 0.55 + Math.sin((o.t || 0) * 8) * 0.08 });
  }
  if (o.blink) ctx.globalAlpha = 0.4;
  if (o.dodge) {
    // 잔상
    const fx = o.facing?.x || 0;
    const fy = o.facing?.y || 0;
    for (let i = 1; i <= 2; i++) {
      assets.draw(ctx, key, x - fx * 14 * i, footY - fy * 14 * i, { scale, flipX, alpha: 0.22 / i });
    }
    ctx.globalAlpha *= 0.85;
  }

  let rot = 0;
  let sx = 1;
  let sy = 1;
  if (o.dead) {
    rot = (flipX ? -1 : 1) * 1.35;
    ctx.globalAlpha *= 0.8;
  } else if (o.attackStep > 0) {
    // 공격: 앞으로 기울였다가 휘두르며 몸을 회전
    const p = o.attackProgress ?? 0;
    const lean = o.attackStep === 3 ? 0.22 : 0.12;
    const swing = p < 0.35 ? -lean * (p / 0.35) : -lean + lean * 2 * Math.min(1, (p - 0.35) / 0.4);
    rot = (flipX ? -1 : 1) * swing * -1;
    if (o.attackStep === 3 && p > 0.35 && p < 0.6) { sx = 1.08; sy = 0.94; }
  } else if (o.hitT > 0) {
    rot = (flipX ? 1 : -1) * 0.12;
  } else if (!o.moving) {
    sy = 1 + Math.sin((o.t || 0) * 3) * 0.012; // 숨쉬기
  } else {
    sy = 1 - Math.abs(Math.sin((o.t || 0) * 10)) * 0.025;
  }
  assets.draw(ctx, key, x, footY, { scale, flipX, rot, sx, sy, flash: o.flash || 0 });
  ctx.restore();
  return true;
}

// 초상화(HUD·캐릭터 선택): 얼굴이 크게 보이도록 위쪽을 잘라 그림
export function drawHeroPortrait(canvas, variant = 'male', { full = false } = {}) {
  const v = HERO_VARIANTS[variant] ? variant : 'male';
  const key = assets.has(`characters3/${v}/idle_down_0`) ? `characters3/${v}/idle_down_0` : assets.has(`${NEW_FOLDER}/${v}/idle_down`) ? `${NEW_FOLDER}/${v}/idle_down` : `${HERO_VARIANTS[v].folder}/idle_front`;
  const c = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = canvas.clientWidth || canvas.width;
  const hgt = canvas.clientHeight || size;
  canvas.width = size * dpr;
  canvas.height = hgt * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, size, hgt);
  const a = assets.get(key);
  if (!a) {
    assets.load(key).then((img) => { if (img) drawHeroPortrait(canvas, variant, { full }); });
    return false;
  }
  const { img, m } = a;
  if (full) {
    const s = Math.min(size / m.w, hgt / m.h) * 0.94;
    c.drawImage(img, (size - m.w * s) / 2, hgt - m.h * s - 2, m.w * s, m.h * s);
  } else {
    // 머리 부분 (위쪽 55%)
    const s = (size * 1.15) / m.w;
    c.drawImage(img, (size - m.w * s) / 2, -m.h * s * 0.02, m.w * s, m.h * s);
  }
  return true;
}
