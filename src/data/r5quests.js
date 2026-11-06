// 5번 지역 퀘스트 — 원환의 숲 키르쿠스 (원의 넓이)
// 형식은 data/r1quests.js 와 같아요.

export const R5_MAIN = [
  {
    id: 'meet', title: '숲지기 키르 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 숲지기님께 인사드려요.',
    at: { map: 'ck_town', x: 17.4, y: 10.6 },
    lines: [
      '어서 오너라, {name}. 천칭 왕국에 공평함을 되찾아 준 영웅이구나.',
      '이 숲의 나무들은 「원의 결정」 덕분에 둥글게 자란단다. 그런데 숲수호자 파이엔트가 결정을 「고대 원형 유적」 깊이 감춰 버렸어.',
      '유적으로 가는 「고대 유적 길」은 봉인 바위로 막혀 있지. 반지름 · 원주율 · 원의 넓이, 세 룬 돌을 모두 깨워야 풀린단다.',
      '북쪽 둥근 나무 숲에 「반지름의 룬」, 동쪽 보름달 호수에 「원주율의 룬」, 남쪽 버섯 빈터에 「원의 넓이의 룬」이 있어.',
    ],
    reward: { exp: 210, gold: 100 },
  },
  {
    id: 'runes', title: '반지름 · 원주율 · 원의 넓이의 룬 깨우기', type: 'rune', target: ['runeRadius', 'runePi', 'runeArea'],
    desc: '둥근 나무 숲·보름달 호수·버섯 빈터 언덕 위의 룬 돌을 깨워요.',
    at: { runeRadius: { map: 'ck_ring', x: 8.5, y: 7.4 }, runePi: { map: 'ck_lake', x: 35.5, y: 27.4 }, runeArea: { map: 'ck_glade', x: 21.5, y: 27.4 } },
    done: ['세 룬이 모두 깨어났어요!', '고대 유적 길의 봉인 바위가 풀렸어요. 둥근 나무 숲 동쪽이나 호수 북쪽으로 가요.'],
    reward: { exp: 670, gold: 200, potions: 2 },
  },
  {
    id: 'ruin', title: '고대 원형 유적 찾기', type: 'enter', target: 'Map:ck_ruin1',
    desc: '고대 유적 길 북쪽 절벽의 유적으로 들어가요.',
    at: { map: 'ck_path', x: 21, y: 11 },
    done: ['둥근 돌기둥들이 늘어선 유적이에요…', '안쪽 봉인된 문 양옆의 룬 기둥 두 개를 깨워야 해요.'],
    reward: { exp: 460, gold: 150 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['circleA', 'circleB'],
    desc: '유적 1층의 룬 기둥 두 개를 모두 깨워요.',
    at: { circleA: { map: 'ck_ruin1', x: 12, y: 15 }, circleB: { map: 'ck_ruin1', x: 24, y: 15 } },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '유적 너머 숲 깊은 곳에서 커다란 날갯짓 소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 670, potions: 2 },
  },
  {
    id: 'piant', title: '원주의 숲수호자 파이엔트', type: 'boss', target: 'piant',
    desc: '유적 너머 숲 깊은 곳 제단의 파이엔트를 물리치고 「원의 결정」을 되찾아요.',
    at: { map: 'ck_ruin2', x: 15.5, y: 12 },
    done: ['파이엔트를 물리쳤어요!', '「원의 결정」을 되찾았어요. 숲지기님께 가져다드려요.'],
    reward: { exp: 1330, gold: 750, potions: 3 },
  },
  {
    id: 'report', title: '숲지기님께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '원의 결정을 숲지기님께 가져다드려요.',
    at: { map: 'ck_town', x: 17.4, y: 10.6 },
    lines: [
      '오오! 숲의 나무들이 다시 둥글게 숨을 쉬는구나!',
      '{name}, 네 덕분에 키르쿠스가 다시 푸르러졌단다.',
      '원의 넓이는 반지름 × 반지름 × 원주율이라는 걸 잊지 말거라. 호수 동쪽 길로 가면 회전체 산맥 볼테라가 나온단다.',
    ],
    reward: { exp: 720, gold: 500 },
  },
];

// 곁 퀘스트: 키르쿠스 사람들의 이야기 (단계는 r1quests.js 설명과 같아요)
export const R5_SIDE = {
  nest: {
    giver: 'ranger', title: '부엉이 둥지 지키기', after: 1,
    start: ['개굴! 나는 숲을 지키는 사냥꾼 활대야. 혼돈의 바람 때문에 둥근 나무 숲 부엉이들이 사나워졌어.', '부엉이들을 진정시키고, 아기 부엉이들이 덮을 부드러운 이끼도 구해 줄래?'],
    steps: [
      { type: 'kill', kind: 'Owl', map: 'ck_ring', need: 5, desc: '둥근 나무 숲의 사나워진 부엉이 5마리를 진정시켜요.', short: '부엉이 진정시키기' },
      { type: 'talk', npc: 'innkeeper', desc: '여관 주인 보름에게 이끼를 어디서 구하는지 물어봐요.', short: '보름에게 묻기',
        lines: ['부드러운 이끼? 버섯 빈터 파란 버섯들이 머리에 이고 다니던걸요.', '조금씩만 나눠 달라고 하면 될 거예요. (물론 버섯들은 순순히 주지 않겠지만요!)'] },
      { type: 'collect', kind: 'Mushroom2', map: 'ck_glade', need: 3, chance: 0.6, item: '부드러운 이끼', desc: '버섯 빈터의 파란 버섯에게서 이끼를 모아요.', short: '부드러운 이끼 모으기' },
    ],
    ready: ['아기 부엉이들이 이끼 이불을 덮고 새근새근 자. 개굴!', '이건 숲의 정령이 엮었다는 잎새 관이야. 머리가 맑아질 거야.'],
    reward: { exp: 320, potions: 3, item: 'leaf_crown' },
  },
  compass: {
    giver: 'child', title: '컴퍼스로 그린 원', after: 1,
    start: ['어흥! (아니, 나는 사자 아니고 동글이야.) 내 컴퍼스가 없어졌어!', '도토리 아저씨가 고대 유적 길에서 봤대. 같이 찾아 줄래?'],
    steps: [
      { type: 'talk', npc: 'merchant', desc: '숲 상인 도토리에게 컴퍼스를 어디서 봤는지 물어봐요.', short: '도토리에게 묻기',
        lines: ['아, 그 반짝이는 컴퍼스? 고대 유적 길 동쪽 덤불에 떨어져 있었어.', '내가 주우려는데 파란 나비들이 몰려와서 도망쳤지 뭐야.'] },
      { type: 'find', target: 'find_compass', desc: '고대 유적 길 동쪽 덤불에서 컴퍼스를 찾아요.', short: '덤불에서 컴퍼스 찾기', item: '컴퍼스', lines: ['덤불 속에서 컴퍼스를 찾았어요!'] },
      { type: 'solve', npc: 'child', desc: '동글이와 컴퍼스로 원을 그리고 넓이를 구해요.', short: '동글이와 원의 넓이',
        lines: ['찾았다! 이제 커다란 원을 그려 볼래.', '반지름 × 반지름 × 원주율! 넓이는 얼마일까?'], ask: '원의 넓이를 구해요!' },
    ],
    ready: ['내가 그린 원 중에 제일 동그래!', '이건 할아버지가 준 파란 구슬이야. 마법 힘이 세진대. 어흥!'],
    reward: { exp: 300, gold: 400, item: 'orb' },
  },
  scale: {
    giver: 'smith', title: '둥근 방패의 은빛 비늘', after: 1,
    start: ['어흥, 나는 대장장이 둥글이다! 숲지기들을 위한 둥근 방패를 만들고 있지.', '보름달 호수 숲 뱀의 은빛 비늘이 필요해. 네 개만 부탁한다!'],
    steps: [
      { type: 'collect', kind: 'Snake3', map: 'ck_lake', need: 4, chance: 0.6, item: '은빛 비늘', desc: '보름달 호수의 숲 뱀에게서 은빛 비늘을 모아요.', short: '은빛 비늘 모으기' },
      { type: 'solve', npc: 'smith', desc: '둥글과 함께 둥근 방패의 넓이를 계산해요.', short: '둥글과 방패 만들기',
        lines: ['비늘을 방패에 빙 둘러 붙이려면 방패 넓이를 알아야 해.', '둥근 방패니까… 원의 넓이! 계산해 줘!'], ask: '둥근 방패의 넓이를 구해요!' },
    ],
    ready: ['어흥! 반짝이는 방패가 완성됐다!', '남은 비늘로 만든 숲지기 갑옷이다. 강화석도 챙겨 가라!'],
    reward: { exp: 360, armor: 'grove', stones: 3 },
  },
  letter: {
    giver: 'innkeeper', title: '파란 나비의 편지', after: 1,
    start: ['보름달 호수에 사는 오랜 친구가 편지를 파란 나비에게 맡겼는데, 나비들이 편지를 갖고 놀고 있대요.', '편지를 되찾아 숲지기 키르님께 전해 주실래요? 두 분이 오랜 친구거든요.'],
    steps: [
      { type: 'kill', kind: 'ButterflyBlue', map: 'ck_lake', need: 5, desc: '보름달 호수의 파란 나비 5마리에게서 편지를 되찾아요.', short: '편지 되찾기' },
      { type: 'talk', npc: 'chief', desc: '숲지기 키르에게 편지를 전해요.', short: '키르에게 편지 전하기',
        lines: ['이건… 볼테라의 산지기 할머니가 보낸 편지로구나!', '「산에 눈보라가 심상치 않으니 조심하라」고 적혀 있구나. 고맙다, 보름에게도 잘 받았다고 전해 주렴.'] },
    ],
    ready: ['편지가 잘 전해졌다니 다행이에요!', '감사의 뜻으로 회복약을 넉넉히 드릴게요. 다음 산길은 춥대요.'],
    reward: { exp: 300, potions: 4, gold: 200 },
  },
};
