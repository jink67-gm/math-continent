// 2번 지역 퀘스트 — 쌓기나무 성채 큐베른 (공간과 입체)
// 형식은 data/r1quests.js 와 같아요.

export const R2_MAIN = [
  {
    id: 'meet', title: '성채 대장 큐브 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 성채 대장님께 인사드려요.',
    at: { map: 'cb_town', x: 17.4, y: 10.6 },
    lines: [
      '어서 오게, {name}! 프락시아를 구한 영웅이로군.',
      '큐베른은 「입체의 결정」 덕분에 무너지지 않고 서 있는 성채라네. 그런데 블록 골렘 큐블록스가 결정을 「세 방향 미궁」에 숨겨 버렸어.',
      '미궁으로 가는 「세 갈래 능선」 길은 봉인 바위로 막혀 있지. 위·앞·옆, 세 시점의 룬 돌을 모두 깨워야 풀린다네.',
      '북쪽 블록 언덕에 「위의 룬」, 동쪽 채석장에 「앞의 룬」, 남쪽 벚꽃 숲길에 「옆의 룬」이 있네. 마을 사람들 부탁도 들어주며 힘을 기르게!',
    ],
    reward: { exp: 40, gold: 40 },
  },
  {
    id: 'runes', title: '위·앞·옆의 룬 돌 깨우기', type: 'rune', target: ['runeTop', 'runeFront', 'runeSide'],
    desc: '블록 언덕·채석장·벚꽃 숲길 언덕 위의 룬 돌을 깨워요.',
    at: { runeTop: { map: 'cb_blocks', x: 9.5, y: 7.4 }, runeFront: { map: 'cb_quarry', x: 35.5, y: 26.4 }, runeSide: { map: 'cb_grove', x: 8.5, y: 24.4 } },
    done: ['위·앞·옆의 룬이 모두 깨어났어요!', '세 갈래 능선의 봉인 바위가 풀렸어요. 블록 언덕 동쪽이나 채석장 북쪽으로 능선에 올라요.'],
    reward: { exp: 140, gold: 80, potions: 2 },
  },
  {
    id: 'maze', title: '세 방향 미궁 찾기', type: 'enter', target: 'Map:cb_maze1',
    desc: '세 갈래 능선 북쪽 절벽의 미궁으로 들어가요.',
    at: { map: 'cb_ridge', x: 21, y: 11 },
    done: ['블록이 빽빽하게 쌓인 미궁이에요…', '안쪽 봉인된 문 양옆의 룬 기둥 두 개를 깨워야 해요.'],
    reward: { exp: 100, gold: 60 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['mazeA', 'mazeB'],
    desc: '미궁 1층의 룬 기둥 두 개를 모두 깨워요.',
    at: { mazeA: { map: 'cb_maze1', x: 12, y: 15 }, mazeB: { map: 'cb_maze1', x: 24, y: 15 } },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '계단 아래에서 블록이 덜그럭거리는 소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 150, potions: 2 },
  },
  {
    id: 'cublox', title: '블록 골렘 큐블록스', type: 'boss', target: 'cublox',
    desc: '미궁 2층의 큐블록스를 물리치고 「입체의 결정」을 되찾아요.',
    at: { map: 'cb_maze2', x: 15.5, y: 12 },
    done: ['큐블록스를 물리쳤어요!', '「입체의 결정」을 되찾았어요. 성채 대장님께 가져다드려요.'],
    reward: { exp: 300, gold: 300, potions: 2 },
  },
  {
    id: 'report', title: '대장님께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '입체의 결정을 성채 대장님께 가져다드려요.',
    at: { map: 'cb_town', x: 17.4, y: 10.6 },
    lines: [
      '오오! 입체의 결정이 다시 빛나는구먼!',
      '{name}, 자네 덕분에 성채가 다시 튼튼해졌네.',
      '쌓기나무는 위·앞·옆 모양을 함께 봐야 개수를 정확히 알 수 있다는 걸 잊지 말게. 채석장 동쪽 길로 가면 소수점 항구 데시마르가 나온다네.',
    ],
    reward: { exp: 160, gold: 200 },
  },
];

export const R2_SIDE = {
  mice: {
    giver: 'soldier', title: '재빠른 생쥐 쫓아내기', type: 'kill', kind: 'Mouse', map: 'cb_blocks', need: 6, after: 1,
    desc: '블록 언덕의 생쥐 6마리를 물리쳐요.',
    start: ['블록 언덕의 생쥐들이 성벽 블록을 갉아 먹고 있소!', '6마리만 쫓아내 주시오. 북쪽 길로 나가면 되오.'],
    ready: ['성벽이 무사하오. 고맙소!', '병사들이 쓰는 회복약을 나눠 드리겠소.'],
    reward: { exp: 70, potions: 2 },
  },
  ore: {
    giver: 'smith', title: '반짝이는 블록 원석', type: 'collect', kind: 'Mole', map: 'cb_quarry', need: 5, chance: 0.6, item: '블록 원석', after: 1,
    desc: '채석장의 두더지에게서 블록 원석 5개를 모아요.',
    start: ['좋은 검을 만들려면 반짝이는 블록 원석이 필요하다네.', '동쪽 채석장 두더지들이 땅속에서 캐 오지. 5개만 부탁하네!'],
    ready: ['오오, 아주 단단한 원석이구먼!', '약속대로 바람처럼 가벼운 검을 만들어 주지. 가방(B)에서 끼워 보게!'],
    reward: { exp: 90, weapon: 'katana' },
  },
  owls: {
    giver: 'innkeeper', title: '꾸벅 부엉이 깨우기', type: 'kill', kind: 'Owl', map: 'cb_grove', need: 5, after: 1,
    desc: '벚꽃 숲길의 부엉이 5마리를 물리쳐요.',
    start: ['벚꽃 숲길의 부엉이들이 밤새 울어서 손님들이 잠을 못 자요.', '5마리만 혼내 주면 조용해질 거예요.'],
    ready: ['이제 푹 잘 수 있겠어요. 고마워요!', '가벼운 가죽 갑옷을 드릴게요. 가방(B)에서 입어 보세요.'],
    reward: { exp: 90, armor: 'leather', potions: 1 },
  },
  block: {
    giver: 'child', title: '잃어버린 나무 블록', type: 'find', target: 'find_block', map: 'cb_ridge', need: 1, item: '나무 블록', after: 1,
    desc: '세 갈래 능선 동쪽 풀숲에서 큐티의 나무 블록을 찾아요.',
    start: ['내 나무 블록 하나가 없어졌어! 그게 있어야 탑을 완성하는데…', '세 갈래 능선 동쪽 풀숲에 떨어뜨린 것 같아. 찾아 줄래?'],
    ready: ['내 블록이다! 이제 탑을 끝까지 쌓을 수 있어!', '이건 내가 모은 용돈이야. 헤헤.'],
    reward: { exp: 70, gold: 120 },
  },
};
