// 승급 (클래스 성장) — 레벨이 되면 룬 현자에게 「승급 시험」(수학 핵심 문제)을 보고 승급해요.
export const RANKS = [
  { id: 0, name: '견습 모험가', level: 1, bonus: null },
  { id: 1, name: '숙련 모험가', level: 10, bonus: { attack: 5, defense: 3, maxHp: 30 } },
  { id: 2, name: '수학 기사', level: 18, bonus: { attack: 8, defense: 5, maxHp: 50 } },
  { id: 3, name: '대륙의 수호자', level: 26, bonus: { attack: 12, defense: 8, maxHp: 80 } },
];
