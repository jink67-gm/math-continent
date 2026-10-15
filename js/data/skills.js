// 스킬 목록 (공통 모험가)
// require: 배우는 조건 (level 레벨, quest 끝내야 하는 퀘스트)
// 스킬 마스터에게 수학의 룬 문제를 풀어야 배울 수 있어요.
// 나중에 직업(전사·궁수·마법사)을 추가할 때는 class 필드로 나누면 됩니다.

export const SKILLS = {
  spin: {
    name: '회전베기', icon: '🌀', effect: 'spin',
    desc: '주위의 적을 한 바퀴 베어요.', power: '공격력 × 1.4',
    cooldown: 4, mult: 1.4, radius: 100,
    require: { level: 2 },
  },
  dash: {
    name: '돌진', icon: '⚡', effect: 'dash',
    desc: '앞으로 빠르게 돌진하며 부딪힌 적을 베어요. 돌진하는 동안 피해를 받지 않아요.', power: '공격력 × 1.3',
    cooldown: 5, mult: 1.3,
    require: { level: 4 },
  },
  smash: {
    name: '강타', icon: '🔨', effect: 'smash',
    desc: '앞쪽 적에게 강한 일격! 멀리 밀쳐내요.', power: '공격력 × 2.6',
    cooldown: 6, mult: 2.6,
    require: { level: 5, quest: 'q_rune' },
  },
  guard: {
    name: '방어 자세', icon: '🛡️', effect: 'guard',
    desc: '5초 동안 받는 피해가 절반으로 줄어요.', power: '받는 피해 50% 감소',
    cooldown: 14, duration: 5,
    require: { level: 7 },
  },
  meteor: {
    name: '수학 유성', icon: '☄️', effect: 'meteor',
    desc: '하늘에서 숫자 유성을 떨어뜨려 넓은 범위의 적을 공격해요.', power: '공격력 × 2.2 (넓은 범위)',
    cooldown: 10, mult: 2.2, radius: 170,
    require: { level: 12 },
  },
  healRune: {
    name: '회복의 룬', icon: '💚', effect: 'heal',
    desc: '회복의 룬을 그려 최대 HP의 35%를 회복해요.', power: '최대 HP 35% 회복',
    cooldown: 25, ratio: 0.35,
    require: { level: 16 },
  },
};

export const SKILL_ORDER = ['spin', 'dash', 'smash', 'guard', 'meteor', 'healRune'];
