// 스킬: 주인공마다 8가지. 레벨이 되면 그 마을 룬 학자에게 「골라서」 배워요 (스킬 포인트 1 + 룬 문제).
// 배운 스킬은 스킬 포인트로 1~5단계까지 올리고, 네 칸(U·I·O·L)에 골라 끼워요.
//
// kind: 스킬이 하는 일 (Combat.js의 skill_종류) · lv: 배울 수 있는 레벨
// mult: 공격력 배율 · r: 범위(px) · sp: 쓰는 SP · cd: 다시 쓰기까지(ms)
// 단계가 오를 때마다: 피해 +15%, 재사용 대기 -6% (회복·버프·보호막은 효과가 커져요)

export const SKILLS = {
  male: [
    { id: 'spin', name: '회전 베기', kind: 'spin', lv: 1, sp: 8, cd: 3000, mult: 1.5, r: 30, knock: 1.4, icon: ['na/slash', 2], desc: '제자리에서 한 바퀴 돌며 둘레를 베어요' },
    { id: 'dash', name: '돌진', kind: 'dash', lv: 4, sp: 10, cd: 5000, mult: 1.8, r: 16, dist: 72, knock: 1.6, icon: ['na/smoke', 2], desc: '앞으로 빠르게 달려 나가며 부딪힌 적을 베어요' },
    { id: 'wave', name: '검기 날리기', kind: 'wave', lv: 8, sp: 12, cd: 4500, mult: 1.7, r: 11, speed: 210, range: 170, icon: ['na/slashc', 1], desc: '칼바람을 날려 줄지은 적을 모두 꿰뚫어요' },
    { id: 'guard', name: '방패 막기', kind: 'guard', lv: 11, sp: 12, cd: 12000, ms: 3500, cut: 0.8, icon: ['na/shield', 3], desc: '잠깐 동안 받는 피해를 크게 줄여요' },
    { id: 'roar', name: '기합', kind: 'roar', lv: 14, sp: 16, cd: 20000, ms: 8000, boost: 0.3, icon: ['na/sparkc', 1], desc: '기합을 넣어 잠깐 공격력이 올라가요' },
    { id: 'quake', name: '대지 가르기', kind: 'quake', lv: 18, sp: 20, cd: 15000, mult: 2.5, r: 52, knock: 2.6, icon: ['na/sparkc', 3], desc: '땅을 내리쳐 둘레의 적을 모두 날려요' },
    { id: 'flurry', name: '연속 찌르기', kind: 'flurry', lv: 21, sp: 18, cd: 8000, mult: 0.75, hits: 6, r: 16, knock: 0.5, icon: ['na/slash', 3], desc: '눈 깜짝할 새 앞쪽을 여섯 번 찔러요' },
    { id: 'leap', name: '하늘 내려찍기', kind: 'leap', lv: 25, sp: 26, cd: 16000, mult: 3.2, r: 38, range: 100, knock: 2.8, icon: ['na/ring', 2], desc: '높이 뛰어올라 적 한가운데를 내려찍어요' },
  ],
  female: [
    { id: 'fire', name: '불꽃 화살', kind: 'bolt', lv: 1, sp: 6, cd: 1500, mult: 1.7, r: 9, speed: 190, range: 150, icon: ['na/flam', 2], desc: '가장 가까운 적에게 불꽃 화살을 쏴요' },
    { id: 'ice', name: '얼음 고리', kind: 'ice', lv: 4, sp: 10, cd: 6000, mult: 1.4, r: 42, slowMs: 2500, icon: ['na/ice', 4], desc: '둘레를 얼려 적을 느리게 만들어요' },
    { id: 'chain', name: '번개 사슬', kind: 'chain', lv: 8, sp: 12, cd: 5000, mult: 1.6, jumps: 4, range: 110, icon: ['na/star', 3], desc: '번개가 적에서 적으로 네 번 튀어요' },
    { id: 'heal', name: '치유의 빛', kind: 'heal', lv: 11, sp: 14, cd: 15000, ratio: 0.35, icon: ['na/sparkc', 2], desc: 'HP를 크게 채워요' },
    { id: 'barrier', name: '마나 보호막', kind: 'barrier', lv: 14, sp: 16, cd: 18000, ms: 8000, ratio: 0.3, icon: ['na/shield', 1], desc: '최대 HP의 30%만큼 피해를 막아 주는 막' },
    { id: 'star', name: '별똥별', kind: 'star', lv: 18, sp: 22, cd: 18000, mult: 2.2, r: 20, hits: 3, range: 110, icon: ['na/star', 2], desc: '별똥별 세 개가 적에게 떨어져요' },
    { id: 'blink', name: '순간 이동', kind: 'blink', lv: 21, sp: 14, cd: 7000, mult: 1.5, r: 28, dist: 80, icon: ['na/sparkc', 4], desc: '빛이 되어 앞으로 날아가고, 닿은 곳에서 터져요' },
    { id: 'meteor', name: '거대 운석', kind: 'meteor', lv: 25, sp: 30, cd: 22000, mult: 3.8, r: 46, range: 110, icon: ['na/flam', 3], desc: '하늘에서 커다란 운석이 떨어져요' },
  ],
};

// 키보드로 스킬을 쓰는 키 (칸 순서대로). 숫자 1~4도 그대로 돼요.
export const SKILL_KEYS = ['U', 'I', 'O', 'L'];
export const SKILL_MAX_LV = 5;

export function skillsFor(stats) {
  return SKILLS[stats.gender] || SKILLS.male;
}

export function skillById(stats, id) {
  return skillsFor(stats).find((k) => k.id === id) || null;
}

// 단계를 반영한 스킬 (피해·대기·효과). mag: 스킬 피해 보너스(0.1 = +10%)
export function skillAt(sk, lv = 1, mag = 0) {
  const n = Math.max(1, Math.min(SKILL_MAX_LV, lv)) - 1;
  const out = { ...sk, level: n + 1, cd: Math.round(sk.cd * (1 - 0.06 * n)) };
  if (sk.mult) out.mult = sk.mult * (1 + 0.15 * n) * (1 + mag);
  if (sk.ratio) out.ratio = sk.ratio + 0.04 * n;
  if (sk.boost) out.boost = sk.boost + 0.05 * n;
  if (sk.ms && sk.kind !== 'guard') out.ms = sk.ms + 500 * n;
  if (sk.cut) out.cut = Math.min(0.9, sk.cut + 0.02 * n);
  return out;
}

// 이 스킬을 몇 단계까지 올릴 수 있는지 (레벨이 오를수록 더 높이)
export function skillCap(sk, charLv) {
  return Math.max(1, Math.min(SKILL_MAX_LV, 1 + Math.floor((charLv - sk.lv) / 3)));
}
