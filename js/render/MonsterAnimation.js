// 몬스터 공통 애니메이션 (그림 한 장만으로 움직임 표현)
// ─────────────────────────────────────────────────────────────
// 몬스터마다 걷기·공격·피격 그림을 따로 만들지 않고,
// 기존 PNG에 위치·회전·크기·색 변화만 줘서 움직이는 것처럼 보이게 해요.
//
//  · 이동 방식(move)   : bounce(통통) / hover(공중 흔들) / heavy(무거운 걸음) / sway(좌우 기울임)
//  · 공격 방식(attack) : lunge(근접: 당겼다 튀어나감) / dash(돌진: 웅크림 + 잔상)
//                        shoot(원거리: 뒤로 기울였다 반동) / cast(범위: 부풀었다 눌림) / leap(점프)
//  · 피격 · 처치 연출  : 모든 몬스터 공통
//
// 몬스터별 설정은 js/data/monsterLooks.js 에 move: '...' 로 바꿀 수 있어요.
// 설정이 없으면 이름·그림·비행 여부로 자동으로 골라요 → 새 몬스터도 바로 적용돼요.

export const HIT_TIME = 0.12;   // 피격 반응 시간
export const DEATH_TIME = 0.65; // 처치 연출 시간

// 이동 방식별 수치 (여기 숫자만 바꾸면 느낌이 달라져요)
export const MOVE_STYLES = {
  bounce: { speed: 9, hop: 9, squash: 0.16, idleJiggle: 0.04 },
  hover: { speed: 4, float: 5, tilt: 0.12, idleFloat: 4 },
  heavy: { speed: 5, step: 3, tilt: 0.05, squash: 0.05 },
  sway: { speed: 10, step: 3, tilt: 0.09 },
};

// 공격 종류(AI) → 공격 동작
const ATTACK_STYLE = {
  melee: 'lunge', guard: 'lunge',
  charge: 'dash',
  jump: 'leap',
  ranged: 'shoot', burst: 'shoot', fan: 'shoot', ring: 'shoot',
  aoe: 'cast', summon: 'cast',
};

export function moveStyleOf(m) {
  if (m._move) return m._move;
  const L = m.look || {};
  const art = `${L.art || ''} ${m.def?.sprite || ''} ${m.type || ''}`.toLowerCase();
  let s = L.move;
  if (!s) {
    if (L.flyH || m.def?.flying) s = 'hover';
    else if (/slime/.test(art)) s = 'bounce';
    else if (/golem|cube|beetle|worm|toad|shield/.test(art)) s = 'heavy';
    else s = 'sway';
  }
  m._move = MOVE_STYLES[s] ? s : 'sway';
  return m._move;
}

export function attackStyleOf(m) {
  return ATTACK_STYLE[m.currentAttack] || 'lunge';
}

const ease = (k) => 1 - (1 - k) * (1 - k);

// 이번 프레임의 몸 변형 계산
// 반환: ox, oy(위치) / rot(회전) / sx, sy(크기) / alpha / tint(번쩍임 색), tintA
export function animTransform(m) {
  const t = m.t || 0;
  const r = { ox: 0, oy: 0, rot: 0, sx: 1, sy: 1, alpha: 1, tint: null, tintA: 0 };
  const face = m.facing || 1;

  // ---------- 처치 ----------
  if (m.dead) {
    const p = Math.min(1, (m.deathT || 0) / DEATH_TIME);
    if (p < 0.18) {
      // 1) 잠깐 밝게 번쩍 + 살짝 커짐
      const k = p / 0.18;
      r.sx = r.sy = 1 + 0.12 * k;
      r.tint = '#ffffff';
      r.tintA = 0.9;
    } else {
      // 2) 작아지면서 투명해짐 (살짝 떠오르며 회전)
      const k = (p - 0.18) / 0.82;
      r.sx = r.sy = 1.12 * (1 - ease(k) * 0.85);
      r.alpha = 1 - k;
      r.oy = -k * 14;
      r.rot = face * k * 0.5;
      r.tint = '#ffffff';
      r.tintA = 0.6 * (1 - k);
    }
    return r;
  }

  // ---------- 이동 / 대기 ----------
  const style = moveStyleOf(m);
  const S = MOVE_STYLES[style];
  if (m.moving) {
    const ph = t * S.speed;
    if (style === 'bounce') {
      const h = Math.abs(Math.sin(ph));
      r.oy = -h * S.hop;
      // 땅에 닿을 때 납작, 공중에선 길쭉
      r.sy = 1 + (h - 0.5) * S.squash * 1.4;
      r.sx = 2 - r.sy;
    } else if (style === 'hover') {
      r.oy = Math.sin(ph) * S.float;
      r.rot = face * S.tilt + Math.sin(ph * 0.5) * 0.04;
    } else if (style === 'heavy') {
      const step = Math.abs(Math.sin(ph));
      r.oy = -step * S.step;
      r.rot = Math.sin(ph) * S.tilt;
      // 발이 땅에 닿는 순간 쿵 (살짝 눌림)
      const land = Math.max(0, 1 - step * 4);
      r.sy = 1 - land * S.squash;
      r.sx = 1 + land * S.squash * 0.6;
    } else {
      r.oy = -Math.abs(Math.sin(ph)) * S.step;
      r.rot = Math.sin(ph) * S.tilt;
    }
  } else if (style === 'bounce') {
    r.sy = 1 + Math.sin(t * 3) * S.idleJiggle;
    r.sx = 2 - r.sy;
  } else if (style === 'hover') {
    r.oy = Math.sin(t * 2.5) * S.idleFloat;
  } else {
    r.sy = 1 + Math.sin(t * 2.6) * 0.02; // 숨쉬기
  }

  // ---------- 공격 ----------
  const atk = attackStyleOf(m);
  const wt = m.windupTime || 0.6;
  if (m.state === 'windup') {
    const k = Math.min(1, m.stateT / wt);
    const shake = Math.sin(t * 60) * k * 1.4;
    if (atk === 'lunge') {
      // 몸을 뒤로 당김
      r.ox = -face * 9 * ease(k) + shake;
      r.rot = -face * 0.14 * k;
      r.sx = 1 - 0.05 * k;
    } else if (atk === 'dash') {
      // 웅크리며 힘 모으기
      r.sy = 1 - 0.16 * k;
      r.sx = 1 + 0.1 * k;
      r.ox = -face * 5 * k + shake;
      r.rot = face * 0.12 * k;
    } else if (atk === 'shoot') {
      // 뒤로 살짝 기울이기
      r.rot = -face * 0.16 * k;
      r.ox = -face * 4 * k;
      r.sy = 1 + 0.05 * k;
    } else if (atk === 'cast') {
      // 부풀며 힘 모으기 (맥박)
      const pulse = 1 + 0.1 * k + Math.sin(t * 22) * 0.03 * k;
      r.sx = pulse;
      r.sy = pulse;
    } else if (atk === 'leap') {
      r.sy = 1 - 0.2 * k;
      r.sx = 1 + 0.12 * k;
    }
  } else if (m.state === 'attack') {
    const k = Math.min(1, m.stateT / 0.18);
    if (atk === 'lunge') {
      // 앞으로 튀어나감
      r.ox = face * 12 * (1 - Math.abs(1 - k * 2) * 0.4);
      r.rot = face * 0.16 * (1 - k * 0.5);
      r.sx = 1.12 - 0.08 * k;
    } else if (atk === 'dash') {
      r.rot = face * 0.22;
      r.sx = 1.15;
      r.sy = 0.9;
    } else if (atk === 'shoot') {
      // 발사 반동
      r.ox = -face * 7 * (1 - k);
      r.rot = face * 0.08 * (1 - k);
    } else if (atk === 'cast') {
      r.sy = 0.85 + 0.15 * k;
      r.sx = 1.15 - 0.15 * k;
    } else if (atk === 'leap') {
      r.sy = 1.12;
      r.sx = 0.92;
    }
  } else if (m.state === 'recover' && m.missed) {
    // 빗나가서 어지러움
    r.rot = Math.sin(t * 9) * 0.12;
  }

  // ---------- 피격 (모든 몬스터 공통) ----------
  if (m.hitT > 0) {
    const k = m.hitT / HIT_TIME; // 1 → 0
    const d = m.hitDir || { x: -face, y: 0 };
    const push = (m.hitCrit ? 11 : 7) * k;
    r.ox += d.x * push;
    r.oy += d.y * push * 0.5;
    r.rot += (d.x >= 0 ? 1 : -1) * 0.18 * k;
    r.sx *= 1 + 0.1 * k;
    r.sy *= 1 - 0.1 * k;
    r.tint = m.hitCrit ? '#ff3b4f' : '#ffffff';
    r.tintA = Math.min(1, 0.95 * k + 0.2);
  }
  return r;
}

// 돌진 잔상: 위치 기록 (그리기 때 호출)
export function trackTrail(m) {
  const dashing = m.state === 'attack' && attackStyleOf(m) === 'dash' && !m.dead;
  if (!dashing) {
    if (m._trail?.length) m._trail.length = 0;
    return null;
  }
  if (!m._trail) m._trail = [];
  m._trail.push({ x: m.x, y: m.y });
  if (m._trail.length > 6) m._trail.shift();
  return m._trail;
}

// 피격 반응 시작 (CombatManager가 모든 몬스터에게 공통으로 호출)
export function startHit(m, fromX, fromY, crit) {
  const dx = m.x - fromX;
  const dy = m.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  m.hitT = HIT_TIME;
  m.hitDir = { x: dx / d, y: dy / d };
  m.hitCrit = !!crit;
}

// ---------- 파티클 (피격·처치 공통) ----------
// CombatManager.effects 에 { type: 'particles', parts: [...] } 로 넣고 그려요
export function makeParticles(x, y, { count = 7, colors = ['#ffffff', '#fff3a8'], speed = 170, size = 3.2, life = 0.38, up = 60, stars = false } = {}) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.45 + Math.random() * 0.75);
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.7 - up * Math.random(),
      s: size * (0.6 + Math.random() * 0.8),
      c: colors[i % colors.length],
      star: stars && i % 3 === 0,
      rot: Math.random() * 6,
    });
  }
  return { type: 'particles', parts, life, max: life };
}

export function updateParticles(e, dt) {
  for (const p of e.parts) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.9;
    p.vy = p.vy * 0.9 + 260 * dt; // 살짝 떨어짐
    p.rot += dt * 8;
  }
}

export function drawParticles(ctx, e) {
  const k = 1 - e.life / e.max;
  ctx.globalAlpha = 1 - k * k;
  for (const p of e.parts) {
    const s = p.s * (1 - k * 0.6);
    ctx.fillStyle = p.c;
    if (p.star) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 ? s * 0.45 : s * 1.6;
        const a = (i / 8) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
