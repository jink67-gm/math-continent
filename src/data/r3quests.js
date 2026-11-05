// 3번 지역 퀘스트 — 소수점 항구 데시마르 (소수의 나눗셈)
// 형식은 data/r1quests.js 와 같아요.

export const R3_MAIN = [
  {
    id: 'meet', title: '항구 선장 데시 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 선장님께 인사드려요.',
    at: { map: 'dh_town', x: 17.4, y: 8.6 },
    lines: [
      '어서 오게, {name}! 큐베른의 성채를 지킨 영웅이로군.',
      '등대는 「소수의 결정」으로 빛을 내서 배들이 길을 잃지 않지. 그런데 문어왕 데시크라켄이 결정을 「소용돌이 해저 동굴」로 가져가 버렸어.',
      '동굴 입구가 있는 「소용돌이 만」은 봉인 바위로 막혀 있다네. 0.1 · 0.01 · 0.001, 세 소수의 룬 돌을 깨워야 풀리지.',
      '북쪽 조개 모래톱에 「0.1의 룬」, 동쪽 등대 방파제에 「0.01의 룬」, 남쪽 배다리 건너 산호 해안에 「0.001의 룬」이 있네.',
    ],
    reward: { exp: 80, gold: 60 },
  },
  {
    id: 'runes', title: '세 소수의 룬 돌 깨우기', type: 'rune', target: ['runeTenth', 'runeHundredth', 'runeThousandth'],
    desc: '모래톱·방파제·산호 해안 언덕 위의 룬 돌을 깨워요.',
    at: { runeTenth: { map: 'dh_beach', x: 33.5, y: 7.4 }, runeHundredth: { map: 'dh_pier', x: 37.5, y: 21.4 }, runeThousandth: { map: 'dh_reef', x: 34.5, y: 26.9 } },
    done: ['0.1 · 0.01 · 0.001의 룬이 모두 깨어났어요!', '소용돌이 만의 봉인 바위가 풀렸어요. 모래톱 동쪽이나 방파제 북쪽으로 가요.'],
    reward: { exp: 260, gold: 120, potions: 2 },
  },
  {
    id: 'cave', title: '소용돌이 해저 동굴 찾기', type: 'enter', target: 'Map:dh_cave1',
    desc: '소용돌이 만 북쪽 절벽의 동굴로 들어가요.',
    at: { map: 'dh_cove', x: 21, y: 11 },
    done: ['동굴 안에 바닷물이 찰랑거려요…', '안쪽 봉인된 문 양옆의 룬 기둥 두 개를 깨워야 해요.'],
    reward: { exp: 180, gold: 90 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['tideA', 'tideB'],
    desc: '해저 동굴 1층의 룬 기둥 두 개를 모두 깨워요.',
    at: { tideA: { map: 'dh_cave1', x: 12, y: 15 }, tideB: { map: 'dh_cave1', x: 24, y: 15 } },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '계단 아래에서 커다란 물소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 260, potions: 2 },
  },
  {
    id: 'decikraken', title: '소수점 문어왕 데시크라켄', type: 'boss', target: 'decikraken',
    desc: '해저 동굴 2층의 데시크라켄을 물리치고 「소수의 결정」을 되찾아요.',
    at: { map: 'dh_cave2', x: 15.5, y: 12 },
    done: ['데시크라켄을 물리쳤어요!', '「소수의 결정」을 되찾았어요. 선장님께 가져다드려요.'],
    reward: { exp: 520, gold: 450, potions: 3 },
  },
  {
    id: 'report', title: '선장님께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '소수의 결정을 항구 선장님께 가져다드려요.',
    at: { map: 'dh_town', x: 17.4, y: 8.6 },
    lines: [
      '오오! 등대에 다시 불이 켜졌구먼!',
      '{name}, 자네 덕분에 배들이 다시 바다로 나갈 수 있게 됐네.',
      '소수로 나눌 때는 두 수의 소수점을 똑같이 옮겨 자연수로 만들면 쉽다는 걸 잊지 말게. 방파제 동쪽 길로 가면 천칭 왕국 프로포르가 나온다네.',
    ],
    reward: { exp: 280, gold: 300 },
  },
];

export const R3_SIDE = {
  fish: {
    giver: 'sailor', title: '퐁당 물고기 몰아내기', type: 'kill', kind: 'Fish', map: 'dh_beach', need: 6, after: 1,
    desc: '조개 모래톱의 퐁당 물고기 6마리를 물리쳐요.',
    start: ['모래톱 물고기들이 그물을 다 찢어 놨어!', '6마리만 혼내 줄래? 북쪽 모래톱이야.'],
    ready: ['이제 그물을 다시 칠 수 있겠어. 고마워!', '바다에서 건진 회복약이야. 받아!'],
    reward: { exp: 120, potions: 2 },
  },
  shells: {
    giver: 'smith', title: '반짝이는 소라 껍데기', type: 'collect', kind: 'Mollusc', map: 'dh_pier', need: 5, chance: 0.6, item: '소라 껍데기', after: 1,
    desc: '등대 방파제의 소라게에게서 소라 껍데기 5개를 모아요.',
    start: ['단단한 소라 껍데기를 갈아 넣으면 아주 튼튼한 갑옷이 되지.', '동쪽 방파제 소라게들이 가지고 있다네. 5개만 부탁하네!'],
    ready: ['오오, 반짝반짝 단단하구먼!', '약속대로 철 갑옷을 만들어 주지. 가방(B)에서 입어 보게!'],
    reward: { exp: 150, armor: 'iron' },
  },
  octopus: {
    giver: 'innkeeper', title: '먹물 문어 혼내 주기', type: 'kill', kind: 'Octopus', map: 'dh_reef', need: 5, after: 1,
    desc: '산호 해안의 먹물 문어 5마리를 물리쳐요.',
    start: ['산호 해안 문어들이 손님들한테 먹물을 쏘아 대요.', '5마리만 혼내 주면 손님들이 좋아할 거예요.'],
    ready: ['이제 손님들이 바닷가를 마음껏 걷겠네요!', '감사의 뜻으로 회복약을 넉넉히 드릴게요.'],
    reward: { exp: 150, potions: 3, gold: 80 },
  },
  pearl: {
    giver: 'child', title: '잃어버린 진주', type: 'find', target: 'find_pearl', map: 'dh_cove', need: 1, item: '진주', after: 1,
    desc: '소용돌이 만 동쪽 조개 더미에서 소라의 진주를 찾아요.',
    start: ['엄마한테 받은 진주를 바닷가에서 떨어뜨렸어…', '소용돌이 만 동쪽 조개 더미 쪽이었던 것 같아. 찾아 줄래?'],
    ready: ['내 진주다! 정말 고마워!', '이건 내가 모은 용돈이야. 헤헤.'],
    reward: { exp: 110, gold: 200 },
  },
};
