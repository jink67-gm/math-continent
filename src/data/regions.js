// 2~6번 마을과 혼돈의 첨탑 (기획안의 이름·단원·보스 그대로)
// 마을마다 「마을 → 들판 → 던전」이 한 벌이고, 지도는 world/gen.js가 이 설정으로 만들어요.
// 1번 마을(나눔의 계곡 프락시아)은 따로 손으로 만든 지도를 써요.
//
// power: 몬스터 세기 (1번 마을 초원 = 1) · boss.art: 보스 그림
//   { type: 'mon', sheet: 몬스터 이름, scale } 몬스터 그림을 크게 · { type: 'spirit' } 거대 정령

export const REGION_ORDER = ['cubeCity', 'decimalHarbor', 'ratioKingdom', 'circleForest', 'solidPeaks'];

export const REGIONS = {
  cubeCity: {
    n: 2, name: '쌓기나무 성채 큐베른', subtitle: '공간과 입체', unit: 'spatial',
    theme: 'pink', wildTheme: 'meadow', dungeonTint: 0xc8b8a8,
    wildName: '블록 언덕', dungeonName: '세 방향 미궁',
    power: 2.0, trees: ['trio_pink', 'tree_blossom', 'tree_round', 'tree_green'],
    monsters: ['Mouse', 'Mole', 'Bamboo', 'Owl', 'Slime3'], dungeonMonsters: ['Bamboo', 'Mole', 'Owl', 'Slime3'],
    chief: { sprite: 'Knight', name: '성채 대장 큐브' },
    hint: ['쌓기나무는 위·앞·옆에서 본 모양으로 개수를 셀 수 있어.', '보이지 않는 뒤쪽에도 쌓기나무가 숨어 있을 수 있지!'],
    gate: '성채 문의 룬',
    boss: { id: 'cublox', name: '블록 골렘 큐블록스', art: { type: 'mon', sheet: 'Bamboo', scale: 3.4 }, hp: 1500, atk: 26, def: 6, exp: 90, gold: [130, 160],
      line: '내 블록을 몇 개나 셀 수 있을까?' },
    story: '블록 골렘 큐블록스가 성채의 「입체의 결정」을 미궁에 숨겨 버렸다네. 성채 북쪽 문의 룬을 풀면 블록 언덕으로 나갈 수 있어.',
  },
  decimalHarbor: {
    n: 3, name: '소수점 항구 데시마르', subtitle: '소수의 나눗셈', unit: 'decimalDivision',
    theme: 'sand', wildTheme: 'sand', dungeonTint: 0x9fc0d8,
    wildName: '조개 모래톱', dungeonName: '소용돌이 해저 동굴',
    power: 2.8, trees: ['tree_round', 'tree_lime', 'tree_green'],
    monsters: ['Fish', 'FishRed', 'Axolot', 'Octopus', 'Mollusc'], dungeonMonsters: ['Octopus', 'FishRed', 'Mollusc', 'Axolot'],
    chief: { sprite: 'OldMan3', name: '항구 선장 데시' },
    hint: ['소수로 나눌 때는 나누는 수를 자연수로 만들어 봐.', '두 수의 소수점을 똑같이 옮기면 몫은 그대로란다!'],
    gate: '항구 수문의 룬',
    boss: { id: 'decikraken', name: '소수점 문어왕 데시크라켄', art: { type: 'mon', sheet: 'Octopus2', scale: 3.6 }, hp: 2200, atk: 34, def: 9, exp: 200, gold: [180, 220],
      line: '소수점이 어디로 갔는지 맞혀 봐라!' },
    story: '문어왕 데시크라켄이 등대의 「소수의 결정」을 빼앗아 해저 동굴로 숨었네. 항구 북쪽 수문의 룬을 풀면 모래톱으로 나갈 수 있어.',
  },
  ratioKingdom: {
    n: 4, name: '천칭 왕국 프로포르', subtitle: '비례식과 비례배분', unit: 'proportion',
    theme: 'meadow', wildTheme: 'forest', dungeonTint: 0xc0b0d0,
    wildName: '저울 평원', dungeonName: '왕성 지하 저울방',
    power: 3.6, trees: ['trio_green', 'tree_big', 'tree_round', 'tree_pine'],
    monsters: ['Racoon', 'Snake2', 'KappaGreen', 'Lizard', 'Reptile2'], dungeonMonsters: ['Reptile2', 'KappaGreen', 'Snake2', 'Racoon'],
    chief: { sprite: 'KnightGold', name: '왕국 재상 포르' },
    hint: ['비례식에서 바깥쪽 두 수의 곱과 안쪽 두 수의 곱은 같아.', '비례배분은 전체를 비의 합으로 나누는 것부터 시작하지!'],
    gate: '왕국 성문의 룬',
    boss: { id: 'ratio', name: '비율의 기사왕 레이시오', art: { type: 'mon', sheet: 'Reptile', scale: 3.4 }, hp: 3000, atk: 42, def: 12, exp: 440, gold: [240, 280],
      line: '내 저울은 언제나 같은 비율이다!' },
    story: '기사왕 레이시오가 왕국의 「비율의 결정」을 지하 저울방에 가둬 버렸소. 성문의 룬을 풀면 저울 평원으로 나갈 수 있소.',
  },
  circleForest: {
    n: 5, name: '원환의 숲 키르쿠스', subtitle: '원의 넓이', unit: 'circle',
    theme: 'forest', wildTheme: 'forest', dungeonTint: 0xa8c8a8,
    wildName: '둥근 나무 숲', dungeonName: '고대 원형 유적',
    power: 4.5, trees: ['trio_green', 'tree_big', 'tree_big_orange', 'tree_lime'],
    monsters: ['Owl', 'Mushroom2', 'ButterflyBlue', 'Spirit2', 'Snake3'], dungeonMonsters: ['Spirit2', 'Mushroom2', 'Snake3', 'Owl'],
    chief: { sprite: 'Monk', name: '숲지기 키르' },
    hint: ['원의 넓이는 반지름 × 반지름 × 원주율이야.', '원을 잘게 잘라 붙이면 직사각형에 가까워진단다.'],
    gate: '숲 고리문의 룬',
    boss: { id: 'piant', name: '원주의 고대수 파이엔트', art: { type: 'mon', sheet: 'Owl', scale: 3.6 }, hp: 3900, atk: 50, def: 15, exp: 975, gold: [300, 360],
      line: '내 둘레를 재 보거라. 끝이 없지!' },
    story: '고대수 파이엔트가 숲의 「원의 결정」을 유적 깊이 감춰 버렸단다. 고리문의 룬을 풀면 둥근 나무 숲으로 갈 수 있어.',
  },
  solidPeaks: {
    n: 6, name: '회전체 산맥 볼테라', subtitle: '원기둥, 원뿔, 구', unit: 'solids',
    theme: 'snow', wildTheme: 'snow', dungeonTint: 0xb8c8e0,
    wildName: '눈꽃 비탈', dungeonName: '수정 회전탑',
    power: 5.5, trees: ['tree_snowpine', 'tree_whitepine', 'pines_snow', 'tree_white'],
    monsters: ['DragonYellow', 'Reptile', 'AxolotBlue', 'Flam2', 'Mole2'], dungeonMonsters: ['DragonYellow', 'Flam2', 'Reptile', 'AxolotBlue'],
    chief: { sprite: 'OldWoman', name: '산지기 할머니 볼타' },
    hint: ['직사각형을 한 바퀴 돌리면 원기둥, 직각삼각형을 돌리면 원뿔이 돼.', '반원을 돌리면 구가 된단다.'],
    gate: '산길 관문의 룬',
    boss: { id: 'guardians', name: '세 수호자 실린·코누스·스피라', art: { type: 'mon', sheet: 'Dragon', scale: 3.6 }, hp: 4800, atk: 58, def: 18, exp: 2160, gold: [380, 440],
      line: '원기둥, 원뿔, 구… 우리 셋을 모두 이겨야 한다!' },
    story: '세 수호자가 산의 「회전의 결정」을 탑 꼭대기에 봉인했단다. 관문의 룬을 풀면 눈꽃 비탈로 갈 수 있지.',
  },
};

// 혼돈의 첨탑 (6번 마을 동쪽, 6개 단원 모두)
export const SPIRE = {
  id: 'chaosSpire', name: '혼돈의 첨탑 카오스피어', unit: 'mixed', power: 6.5, dungeonTint: 0xb0a0c8,
  monsters: ['DragonYellow', 'Octopus', 'Spirit2', 'Reptile2', 'Owl', 'Mole2'],
  boss: { id: 'zero', name: '혼돈의 군주 제로', art: { type: 'spirit' }, hp: 6000, atk: 66, def: 20, exp: 4000, gold: [600, 700],
    line: '모든 수를 0으로 만들어 주마!' },
};

// 몬스터 기본값 (새로 쓰는 몬스터들) — 세기는 지역 power로 곱해요
export const EXTRA_MONSTERS = {
  Mouse: { name: '재빠른 생쥐', hp: 26, atk: 8, def: 0, speed: 40, sight: 90, reach: 20, lunge: 32, exp: 7, gold: [2, 4], move: 'walk' },
  Mole: { name: '굴 파는 두더지', hp: 40, atk: 10, def: 1, speed: 24, sight: 80, reach: 20, lunge: 28, exp: 9, gold: [3, 5], move: 'walk' },
  Bamboo: { name: '대나무 블록', hp: 44, atk: 10, def: 2, speed: 26, sight: 80, reach: 22, lunge: 34, exp: 10, gold: [3, 5], move: 'hop' },
  Owl: { name: '꾸벅 부엉이', hp: 30, atk: 9, def: 0, speed: 42, sight: 100, reach: 20, lunge: 30, exp: 9, gold: [2, 5], move: 'flutter', fly: true },
  Slime3: { name: '물방울 슬라임', hp: 32, atk: 8, def: 0, speed: 30, sight: 80, reach: 22, lunge: 34, exp: 7, gold: [2, 4], move: 'hop' },
  Fish: { name: '퐁당 물고기', hp: 30, atk: 9, def: 0, speed: 34, sight: 85, reach: 22, lunge: 34, exp: 8, gold: [2, 5], move: 'hop' },
  FishRed: { name: '빨간 물고기', hp: 36, atk: 10, def: 1, speed: 36, sight: 85, reach: 22, lunge: 36, exp: 9, gold: [3, 5], move: 'hop' },
  Axolot: { name: '방긋 우파루파', hp: 40, atk: 10, def: 1, speed: 28, sight: 80, reach: 20, lunge: 30, exp: 9, gold: [3, 5], move: 'walk' },
  Octopus: { name: '먹물 문어', hp: 36, atk: 11, def: 1, speed: 24, sight: 95, reach: 60, lunge: 0, exp: 11, gold: [3, 6], move: 'float', ranged: true },
  Mollusc: { name: '단단한 소라게', hp: 60, atk: 12, def: 3, speed: 18, sight: 70, reach: 18, lunge: 22, exp: 12, gold: [4, 7], move: 'walk' },
  Racoon: { name: '장난꾸러기 너구리', hp: 42, atk: 11, def: 1, speed: 40, sight: 95, reach: 20, lunge: 34, exp: 10, gold: [3, 6], move: 'walk' },
  Snake2: { name: '초록 뱀', hp: 38, atk: 11, def: 1, speed: 32, sight: 85, reach: 20, lunge: 36, exp: 10, gold: [3, 6], move: 'walk' },
  KappaGreen: { name: '물병 갓파', hp: 40, atk: 11, def: 1, speed: 24, sight: 95, reach: 60, lunge: 0, exp: 12, gold: [3, 6], move: 'float', ranged: true },
  Lizard: { name: '꼬마 도마뱀', hp: 36, atk: 10, def: 1, speed: 38, sight: 90, reach: 20, lunge: 34, exp: 9, gold: [3, 5], move: 'walk' },
  Reptile2: { name: '초록 공룡', hp: 62, atk: 13, def: 3, speed: 22, sight: 80, reach: 22, lunge: 30, exp: 13, gold: [4, 8], move: 'walk' },
  Mushroom2: { name: '파란 버섯', hp: 48, atk: 11, def: 2, speed: 22, sight: 75, reach: 18, lunge: 22, exp: 10, gold: [3, 6], move: 'walk' },
  ButterflyBlue: { name: '파란 나비', hp: 28, atk: 9, def: 0, speed: 46, sight: 95, reach: 20, lunge: 30, exp: 9, gold: [2, 5], move: 'flutter', fly: true },
  Spirit2: { name: '불꽃 정령', hp: 40, atk: 12, def: 1, speed: 24, sight: 95, reach: 60, lunge: 0, exp: 12, gold: [3, 6], move: 'float', fly: true, ranged: true },
  Snake3: { name: '숲 뱀', hp: 40, atk: 12, def: 1, speed: 32, sight: 85, reach: 20, lunge: 36, exp: 11, gold: [3, 6], move: 'walk' },
  DragonYellow: { name: '아기 용', hp: 50, atk: 13, def: 2, speed: 24, sight: 95, reach: 60, lunge: 0, exp: 14, gold: [4, 8], move: 'float', ranged: true },
  Reptile: { name: '파란 공룡', hp: 66, atk: 14, def: 3, speed: 22, sight: 80, reach: 22, lunge: 30, exp: 14, gold: [4, 8], move: 'walk' },
  AxolotBlue: { name: '파란 우파루파', hp: 42, atk: 11, def: 1, speed: 30, sight: 85, reach: 22, lunge: 34, exp: 10, gold: [3, 6], move: 'hop' },
  Flam2: { name: '얼음 불꽃', hp: 56, atk: 13, def: 2, speed: 34, sight: 90, reach: 22, lunge: 36, exp: 13, gold: [4, 8], move: 'walk' },
  Mole2: { name: '눈 두더지', hp: 44, atk: 11, def: 2, speed: 24, sight: 80, reach: 20, lunge: 28, exp: 10, gold: [3, 6], move: 'walk' },
};
