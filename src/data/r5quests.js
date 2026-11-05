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
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '계단 아래에서 커다란 나뭇잎 소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 670, potions: 2 },
  },
  {
    id: 'piant', title: '원주의 숲수호자 파이엔트', type: 'boss', target: 'piant',
    desc: '유적 2층의 파이엔트를 물리치고 「원의 결정」을 되찾아요.',
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

export const R5_SIDE = {
  owls: {
    giver: 'ranger', title: '꾸벅 부엉이 깨우기', type: 'kill', kind: 'Owl', map: 'ck_ring', need: 6, after: 1,
    desc: '둥근 나무 숲의 부엉이 6마리를 물리쳐요.',
    start: ['둥근 나무 숲 부엉이들이 사냥길을 막고 있어.', '6마리만 혼내 줄래? 북쪽 길이야.'],
    ready: ['이제 사냥길이 뚫렸어. 고마워!', '사냥꾼들이 쓰는 회복약이야. 받아!'],
    reward: { exp: 330, potions: 3 },
  },
  spores: {
    giver: 'smith', title: '반딧불 버섯 포자', type: 'collect', kind: 'Mushroom2', map: 'ck_glade', need: 5, chance: 0.6, item: '반딧불 포자', after: 1,
    desc: '버섯 빈터의 버섯에게서 반딧불 포자 5개를 모아요.',
    start: ['반딧불 포자를 녹여 바르면 칼날이 반짝반짝 빛나지.', '남쪽 버섯 빈터 버섯들이 가지고 있다네. 5개만 부탁하네!'],
    ready: ['오오, 은은하게 빛나는구먼!', '고맙네. 대장간 금고에서 꺼낸 금화와 회복약일세.'],
    reward: { exp: 380, gold: 400, potions: 2 },
  },
  butterflies: {
    giver: 'innkeeper', title: '파란 나비 쫓아내기', type: 'kill', kind: 'ButterflyBlue', map: 'ck_lake', need: 5, after: 1,
    desc: '보름달 호수의 파란 나비 5마리를 물리쳐요.',
    start: ['보름달 호수 나비들이 손님들 도시락을 노려요.', '5마리만 쫓아내 주면 정말 고맙겠어요.'],
    ready: ['이제 손님들이 호숫가에서 편히 쉬겠네요!', '감사의 뜻으로 회복약을 넉넉히 드릴게요.'],
    reward: { exp: 380, potions: 3, gold: 160 },
  },
  compass: {
    giver: 'child', title: '잃어버린 컴퍼스', type: 'find', target: 'find_compass', map: 'ck_path', need: 1, item: '컴퍼스', after: 1,
    desc: '고대 유적 길 동쪽 덤불에서 동글이의 컴퍼스를 찾아요.',
    start: ['원을 그리던 내 컴퍼스가 없어졌어! 유적 길에서 놀다가 떨어뜨렸나 봐.', '고대 유적 길 동쪽 덤불 쪽이었어. 찾아 줄래?'],
    ready: ['내 컴퍼스다! 이제 다시 동그라미를 그릴 수 있어!', '이건 내가 모은 용돈이야. 헤헤.'],
    reward: { exp: 290, gold: 400 },
  },
};
