// 성장·난이도 규칙을 한곳에 모아 둔 곳
// 숫자를 바꾸면 게임 전체 밸런스가 바뀌어요.

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
    next: Math.round(25 * 1.32 ** n),
  };
}

// 저장 기록에 빠진 값을 채우고, 레벨에 맞는 최대치를 다시 계산해요
export function normalizeStats(s) {
  s.lv = Math.max(1, Math.min(MAX_LV, s.lv || 1));
  s.exp ??= 0;
  s.gold ??= 0;
  s.potions ??= 3;
  s.difficulty = DIFFICULTY[s.difficulty] ? s.difficulty : 'normal';
  const ls = levelStats(s.lv);
  Object.assign(s, { maxHp: ls.maxHp, maxSp: ls.maxSp, next: ls.next });
  s.hp = Math.min(s.maxHp, s.hp ?? s.maxHp);
  s.sp = Math.min(s.maxSp, s.sp ?? s.maxSp);
  s.kills ??= 0;
  return s;
}

// 피해 계산: 공격력 × 배율 ± 10%, 방어력의 절반만큼 줄고, 10% 확률로 치명타(1.5배)
export function rollDamage(atk, mult, def = 0) {
  const crit = Math.random() < 0.1;
  const base = atk * mult * (0.9 + Math.random() * 0.2) * (crit ? 1.5 : 1) - def * 0.5;
  return { dmg: Math.max(1, Math.round(base)), crit };
}
