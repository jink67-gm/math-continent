// 스킬 4칸: 주인공마다 다르고, 레벨 1·3·5·8에 하나씩 열려요.
// kind: 스킬이 하는 일 (Combat.js의 castSkill에서 처리)
// mult: 공격력 배율 · r: 범위(px) · sp: 쓰는 SP · cd: 다시 쓰기까지(ms)

export const SKILLS = {
  male: [
    { id: 'spin', name: '회전 베기', kind: 'spin', lv: 1, sp: 8, cd: 3000, mult: 1.5, r: 30, knock: 1.4, icon: ['na/slash', 2] },
    { id: 'dash', name: '돌진', kind: 'dash', lv: 3, sp: 10, cd: 5000, mult: 1.8, r: 16, dist: 72, knock: 1.6, icon: ['na/smoke', 2] },
    { id: 'guard', name: '방패 막기', kind: 'guard', lv: 5, sp: 12, cd: 12000, ms: 3500, cut: 0.8, icon: ['na/shield', 3] },
    { id: 'quake', name: '대지 가르기', kind: 'quake', lv: 8, sp: 20, cd: 15000, mult: 2.5, r: 52, knock: 2.6, icon: ['na/sparkc', 3] },
  ],
  female: [
    { id: 'fire', name: '불꽃 화살', kind: 'bolt', lv: 1, sp: 6, cd: 1500, mult: 1.7, r: 9, speed: 190, range: 150, icon: ['na/flam', 2] },
    { id: 'ice', name: '얼음 고리', kind: 'ice', lv: 3, sp: 10, cd: 6000, mult: 1.4, r: 42, slowMs: 2500, icon: ['na/ice', 4] },
    { id: 'heal', name: '치유의 빛', kind: 'heal', lv: 5, sp: 14, cd: 15000, ratio: 0.35, icon: ['na/sparkc', 2] },
    { id: 'star', name: '별똥별', kind: 'star', lv: 8, sp: 22, cd: 18000, mult: 2.2, r: 20, hits: 3, range: 110, icon: ['na/star', 2] },
  ],
};

export function skillsFor(stats) {
  return SKILLS[stats.gender] || SKILLS.male;
}
