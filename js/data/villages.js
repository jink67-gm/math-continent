// 6개 마을의 기본 정보
// 3·4단계에서 지도, 몬스터, NPC 정보가 이 파일(또는 villages/ 폴더)에 추가됩니다.

export const VILLAGES = [
  {
    id: 'fractionValley', order: 1, name: '분수 계곡', icon: '🌾', unit: 'fractionDivision',
    mood: '풍차와 농장, 강과 나무다리가 있는 초록 계곡',
    theme: { sky: '#9be7ff', ground: '#8fd96b', ground2: '#82cd5f', accent: '#ffd84d', path: '#ecd09a' },
    crystal: { name: '분수의 결정', color: '#6fdc5a' },
    bgm: 'fractionValley',
    monsters: ['슬라임', '버섯 몬스터', '분수 박쥐'],
    boss: '나눗셈 트롤',
    home: { scene: 'fvVillage', x: 1100, y: 1130 }, levels: '1~6',
  },
  {
    id: 'cubeCity', order: 2, name: '입체 도시', icon: '🧊', unit: 'spatial',
    mood: '큐브 건물과 블록 미로, 공중 다리가 있는 네온 도시',
    theme: { sky: '#c7b3ff', ground: '#9aa7d6', ground2: '#8d9acb', accent: '#3ee6d0', path: '#d8dcf0' },
    crystal: { name: '공간의 결정', color: '#a77bff' },
    bgm: 'cubeCity',
    monsters: ['큐브 골렘', '블록 미믹', '입체 로봇'],
    boss: '큐브 킹',
    home: { scene: 'cc_village', x: 1100, y: 1130 },
  },
  {
    id: 'decimalHarbor', order: 3, name: '소수 항구', icon: '⚓', unit: 'decimalDivision',
    mood: '등대와 배, 시끌벅적한 시장이 있는 바닷가 항구',
    theme: { sky: '#8fd0ff', ground: '#f3e2b3', ground2: '#ead59f', accent: '#ff9a3d', path: '#c99a62' },
    crystal: { name: '소수의 결정', color: '#4aa8ff' },
    bgm: 'decimalHarbor',
    monsters: ['물방울 슬라임', '해적 게', '문어 몬스터'],
    boss: '소수점 크라켄',
    home: { scene: 'dh_village', x: 1100, y: 1130 },
  },
  {
    id: 'ratioKingdom', order: 4, name: '비례 왕국', icon: '🏰', unit: 'proportion',
    mood: '성과 기사단, 저울 시장이 있는 중세 왕국',
    theme: { sky: '#ffd1c4', ground: '#b9c48a', ground2: '#adb97d', accent: '#e8b931', path: '#b8b0a2' },
    crystal: { name: '비례의 결정', color: '#ff5a5a' },
    bgm: 'ratioKingdom',
    monsters: ['비율 고블린', '저울 골렘', '기사 몬스터'],
    boss: '천칭 기사왕',
    home: { scene: 'rk_village', x: 1100, y: 1130 },
  },
  {
    id: 'circleForest', order: 5, name: '원형 숲', icon: '🌳', unit: 'circle',
    mood: '원형 호수와 고대 유적, 원형 제단이 있는 깊은 숲',
    theme: { sky: '#a6f0dc', ground: '#4fae6a', ground2: '#47a260', accent: '#3fd1c8', path: '#9c8a62' },
    crystal: { name: '원의 결정', color: '#2fd4b0' },
    bgm: 'circleForest',
    monsters: ['링 슬라임', '바퀴 몬스터', '원형 골렘'],
    boss: '원주 고대수',
    home: { scene: 'cf_village', x: 1100, y: 1130 },
  },
  {
    id: 'solidPeaks', order: 6, name: '입체 산맥', icon: '🏔️', unit: 'solids',
    mood: '설산과 수정 동굴, 고대 탑이 솟은 산맥',
    theme: { sky: '#d6e8ff', ground: '#eef5ff', ground2: '#e2ecfa', accent: '#b98cff', path: '#c6d3e6' },
    crystal: { name: '입체의 결정', color: '#c08cff' },
    bgm: 'solidPeaks',
    monsters: ['원기둥 골렘', '원뿔 마법사', '구체 정령'],
    boss: '삼형제 수호자',
    home: { scene: 'sp_village', x: 1100, y: 1130 },
  },
];

export const FINAL_AREA = {
  id: 'chaosSpire', name: '혼돈의 첨탑', icon: '🌀', levels: '26~',
  home: { scene: 'chaosSpire', x: 1200, y: 1500 },
  crystal: { name: '혼돈의 결정', color: '#ff6f8e' },
};

// 권장 레벨 표시용
export const VILLAGE_LEVELS = { fractionValley: '1~6', cubeCity: '6~10', decimalHarbor: '10~14', ratioKingdom: '14~18', circleForest: '18~22', solidPeaks: '22~26' };

export const getVillage = (id) => VILLAGES.find((v) => v.id === id) || VILLAGES[0];
