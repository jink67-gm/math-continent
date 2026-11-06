// 성장·난이도 규칙을 한곳에 모아 둔 곳
// 숫자를 바꾸면 게임 전체 밸런스가 바뀌어요.

import { SLOTS, itemDef, plusBonus, normalizeGear } from './items.js';
import { skillsFor } from './skills.js';

export const MAX_LV = 30;

// 난이도: 학생이 캐릭터를 만들 때 고르고, 마을 게시판에서 바꿀 수 있어요.
// 액션만 바뀌고 수학 문제는 그대로예요. 쉬움에서도 경험치는 줄지 않아요.
export const DIFFICULTY = {
  easy: { label: '쉬움', dmgTaken: 0.5, monHp: 0.7, warnMs: 1000, exp: 1.0, drop: 1.0 },
  normal: { label: '보통', dmgTaken: 1.0, monHp: 1.0, warnMs: 700, exp: 1.0, drop: 1.0 },
  hard: { label: '어려움', dmgTaken: 1.4, monHp: 1.3, warnMs: 500, exp: 1.2, drop: 1.2 },
};
export const DIFF_ORDER = ['easy', 'normal', 'hard'];

export function diff(stats) {
  return DIFFICULTY[stats.difficulty] || DIFFICULTY.normal;
}

// 레벨별 능력치 (레벨에서 바로 계산해서, 예전 저장 기록도 그대로 맞아요)
export function levelStats(lv) {
  const n = lv - 1;
  return {
    maxHp: 120 + n * 14,
    maxSp: 40 + n * 5,
    atk: 12 + n * 3,
    def: 2 + n,
    // 다음 레벨까지 경험치: 1번 지역을 마치면 Lv7쯤, 2번 Lv12, 3번 Lv17, 4번 Lv21, 5번 Lv25, 첨탑까지 마치면 Lv29~30
    next: Math.round((230 * 1.135 ** n) / 5) * 5,
  };
}

// ── 능력치 포인트 ─────────────────────────────────
// 레벨이 오를 때마다 능력치 포인트 3 · 스킬 포인트 1. 성장 시험(수학 문제)을 맞히면 능력치 포인트 2를 더 받아요.
export const STAT_PER_LV = 3;
export const SKILLPT_PER_LV = 1;
export const STATS = {
  str: { name: '힘', desc: '공격력 +2', icon: '💪' },
  vit: { name: '체력', desc: '최대 HP +12 · 방어력 +0.4', icon: '❤️' },
  dex: { name: '솜씨', desc: '치명타 확률 +0.8% · 치명타 피해 +2%', icon: '🎯' },
  int: { name: '지혜', desc: '최대 SP +5 · 스킬 피해 +2.5%', icon: '🔮' },
};

// 레벨 + 능력치 포인트 + 예전 보너스 + 장비 다섯 칸(강화 포함)을 모두 더한 능력치
export function statsOf(s) {
  const ls = levelStats(s.lv);
  const b = s.bonus || {};
  const p = s.stat || {};
  let atk = ls.atk + (b.atk || 0) + (p.str || 0) * 2;
  let atkPct = 0;
  let def = ls.def + (b.def || 0) + (p.vit || 0) * 0.4;
  let hp = ls.maxHp + (b.hp || 0) + (p.vit || 0) * 12;
  let sp = ls.maxSp + (b.sp || 0) + (p.int || 0) * 5;
  let crit = 8 + (p.dex || 0) * 0.8;
  let mag = (p.int || 0) * 2.5;
  let speed = 0;
  for (const slot of SLOTS) {
    const id = s.gear?.[slot];
    const d = itemDef(id);
    if (!d) continue;
    const pb = plusBonus(d, s.plus?.[id] || 0);
    atk += d.atk || 0;
    atkPct += pb.atkPct || 0;
    def += (d.def || 0) + (pb.def || 0);
    hp += (d.hp || 0) + (pb.hp || 0);
    sp += d.sp || 0;
    crit += (d.crit || 0) + (pb.crit || 0);
    mag += d.mag || 0;
    speed += d.speed || 0;
  }
  return {
    ...ls,
    atk: Math.round(atk * (1 + atkPct)),
    def: Math.round(def),
    maxHp: Math.round(hp),
    maxSp: Math.round(sp),
    crit: Math.min(60, crit),             // 치명타 확률 %
    critDmg: 1.5 + (p.dex || 0) * 0.02,    // 치명타 피해 배율
    mag: mag / 100,                        // 스킬 피해 보너스 (0.1 = +10%)
    speed: Math.min(30, speed) / 100,      // 이동 속도 보너스
  };
}

// 스킬 포인트·능력치 포인트를 맞춰요 (예전 기록은 레벨에 맞게 한꺼번에 줘요)
function normalizePoints(s) {
  s.stat ??= { str: 0, vit: 0, dex: 0, int: 0 };
  for (const k of Object.keys(STATS)) s.stat[k] = Math.max(0, Math.floor(s.stat[k] || 0));
  const spent = Object.values(s.stat).reduce((a, v) => a + v, 0);
  // 지금까지 받은 능력치 포인트 = 레벨업 × 3 + 성장 시험 보너스
  s.statEarned ??= (s.lv - 1) * STAT_PER_LV;
  s.statPts = Math.max(0, s.statEarned - spent);
  // 스킬: 배운 스킬 · 단계 · 네 칸
  const pool = skillsFor(s);
  s.learned = (s.learned || []).filter((id) => pool.some((k) => k.id === id));
  if (!s.learned.length) s.learned = [pool[0].id];
  s.skillLv ??= {};
  for (const id of s.learned) s.skillLv[id] = Math.max(1, Math.min(5, Math.floor(s.skillLv[id] || 1)));
  if (!Array.isArray(s.slots) || s.slots.length !== 4) s.slots = [0, 1, 2, 3].map((i) => s.learned[i] || null);
  s.slots = s.slots.map((id) => (id && s.learned.includes(id) ? id : null));
  // 스킬 포인트: 레벨업마다 1 (처음 스킬은 공짜). 배우기·단계 올리기에 써요
  const used = s.learned.length - 1 + Object.values(s.skillLv).reduce((a, v) => a + (v - 1), 0);
  s.skillEarned ??= Math.max((s.lv - 1) * SKILLPT_PER_LV, used);
  s.skillPts = Math.max(0, s.skillEarned - used);
}

// 저장 기록에 빠진 값을 채우고, 레벨에 맞는 최대치를 다시 계산해요
export function normalizeStats(s) {
  s.lv = Math.max(1, Math.min(MAX_LV, s.lv || 1));
  s.exp ??= 0;
  s.gold ??= 0;
  s.potions ??= 3;
  s.difficulty = DIFFICULTY[s.difficulty] ? s.difficulty : 'normal';
  s.bonus ??= {};
  normalizeGear(s);
  s.tests ??= 0; // 아직 안 본 성장 시험 수
  // 배운 스킬 (예전 기록은 레벨에 맞는 스킬을 모두 배운 것으로)
  s.learned ??= skillsFor(s).filter((k) => k.lv <= s.lv).map((k) => k.id);
  normalizePoints(s);
  s.waypoints ??= [];
  s.chests ??= [];
  refreshMax(s);
  s.hp = Math.min(s.maxHp, s.hp ?? s.maxHp);
  s.sp = Math.min(s.maxSp, s.sp ?? s.maxSp);
  s.kills ??= 0;
  s.village ??= 'fractionValley';
  s.saveCode = normalizeCode(s.saveCode) || genCode();
  s.grantsApplied ??= [];
  return s;
}

// 최대 HP·SP·다음 레벨 경험치를 다시 계산해요 (레벨업·장비 바꿀 때)
export function refreshMax(s) {
  const st = statsOf(s);
  Object.assign(s, { maxHp: st.maxHp, maxSp: st.maxSp, next: st.next });
}

// ── 저장 코드 ───────────────────────────────────
// 8글자 (헷갈리는 0·O·1·I는 빼요). 다른 기기에서 이 코드를 넣으면 같은 캐릭터로 이어 해요.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function genCode() {
  const a = new Uint32Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
}

// 입력한 코드를 정리해요 (소문자·빈칸·하이픈 허용). 틀린 모양이면 null
export function normalizeCode(text) {
  const c = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 8 && [...c].every((ch) => CODE_CHARS.includes(ch)) ? c : null;
}

export function formatCode(code) {
  return code ? `${code.slice(0, 4)}-${code.slice(4)}` : '';
}

// ── 지역 단계 (1~7) ──────────────────────────────
// 지도 세기(power)로 정해요: 1번 지역 1 · 2번 2 · … · 6번 6 · 혼돈의 첨탑 7
export function tierOf(power = 1) {
  return power < 1.95 ? 1 : power < 2.75 ? 2 : power < 3.55 ? 3 : power < 4.55 ? 4 : power < 5.55 ? 5 : power < 6.45 ? 6 : 7;
}

// 단계가 높을수록: 더 단단하고, 더 아프고, 더 자주·빨리 공격하고, 공격 패턴이 늘어요
export function monsterScale(power, tier = tierOf(power)) {
  const t = tier - 1;
  return {
    hp: 1.2 * power ** 1.6,
    atk: 1.15 * (1 + (power - 1) * 1.05),
    def: (power - 1) * 3.5,
    speed: 1 + 0.06 * t,
    sight: 1 + 0.05 * t,
    warn: Math.max(0.62, 1 - 0.07 * t),     // 경고 원이 차는 시간
    cool: Math.max(0.5, 1 - 0.09 * t),      // 다음 공격까지 쉬는 시간
    double: t >= 1 ? 0.2 + 0.06 * t : 0,     // 덮친 뒤 한 번 더 덮칠 확률
    slam: t >= 3 ? 0.18 + 0.04 * (t - 3) : 0, // 둘레 내려찍기 확률
    spread: t >= 2 ? (t >= 4 ? 5 : 3) : 1,   // 멀리 쏘는 몬스터 구슬 수
    elite: t >= 1 ? 0.1 + 0.01 * t : 0.06,   // 정예 몬스터가 나올 확률
  };
}

// 다음 지역으로 가려면 이 레벨이 되어야 해요 (지역 출구에 적어요)
export const REGION_MIN_LV = { cubeCity: 7, decimalHarbor: 12, ratioKingdom: 17, circleForest: 21, solidPeaks: 25, chaosSpire: 28 };

// 피해 계산: 공격력 × 배율 ± 10%, 방어력의 절반만큼 줄고, 10% 확률로 치명타(1.5배)
export function rollDamage(atk, mult, def = 0, critPct = 10, critDmg = 1.5) {
  const crit = Math.random() * 100 < critPct;
  const base = atk * mult * (0.9 + Math.random() * 0.2) * (crit ? critDmg : 1) - def * 0.5;
  return { dmg: Math.max(1, Math.round(base)), crit };
}
