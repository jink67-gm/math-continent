// 4번 지역 퀘스트 — 천칭 왕국 프로포르 (비례식과 비례배분)
// 형식은 data/r1quests.js 와 같아요.

export const R4_MAIN = [
  {
    id: 'meet', title: '왕국 재상 포르 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 재상님께 인사드려요.',
    at: { map: 'rk_town', x: 17.4, y: 10.6 },
    lines: [
      '어서 오시오, {name}! 데시마르의 등대를 밝힌 영웅이로군.',
      '우리 왕국의 천칭은 「비율의 결정」 덕분에 언제나 공평하게 기울지. 그런데 기사왕 레이시오가 결정을 「왕성 지하 저울방」에 가둬 버렸소.',
      '지하로 가는 「기사의 협곡」은 봉인 바위로 막혀 있소. 비 · 비례배분 · 비례식, 세 룬 돌을 모두 깨워야 풀리지.',
      '북쪽 저울 평원에 「비의 룬」, 동쪽 사과 과수원에 「비례배분의 룬」, 남쪽 톱니바퀴 언덕에 「비례식의 룬」이 있소.',
    ],
    reward: { exp: 130, gold: 80 },
  },
  {
    id: 'runes', title: '비 · 비례배분 · 비례식의 룬 깨우기', type: 'rune', target: ['runeRatio', 'runeShare', 'runeGear'],
    desc: '평원·과수원·언덕 위의 룬 돌을 깨워요.',
    at: { runeRatio: { map: 'rk_plain', x: 21.5, y: 6.4 }, runeShare: { map: 'rk_orchard', x: 35.5, y: 27.4 }, runeGear: { map: 'rk_hill', x: 34.5, y: 24.4 } },
    done: ['세 룬이 모두 깨어났어요!', '기사의 협곡 봉인 바위가 풀렸어요. 평원 동쪽이나 과수원 북쪽으로 가요.'],
    reward: { exp: 420, gold: 160, potions: 2 },
  },
  {
    id: 'vault', title: '왕성 지하 저울방 찾기', type: 'enter', target: 'Map:rk_vault1',
    desc: '기사의 협곡 북쪽 절벽의 성문으로 들어가요.',
    at: { map: 'rk_gorge', x: 21, y: 11 },
    done: ['차가운 돌계단이 아래로 이어져요…', '안쪽 봉인된 문 양옆의 룬 기둥 두 개를 깨워야 해요.'],
    reward: { exp: 290, gold: 120 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['scaleA', 'scaleB'],
    desc: '왕성 지하 1층의 룬 기둥 두 개를 모두 깨워요.',
    at: { scaleA: { map: 'rk_vault1', x: 12, y: 15 }, scaleB: { map: 'rk_vault1', x: 24, y: 15 } },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '계단 아래에서 무거운 갑옷 소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 420, potions: 2 },
  },
  {
    id: 'ratio', title: '비율의 기사왕 레이시오', type: 'boss', target: 'ratio',
    desc: '왕성 지하 2층의 레이시오를 물리치고 「비율의 결정」을 되찾아요.',
    at: { map: 'rk_vault2', x: 15.5, y: 12 },
    done: ['레이시오를 물리쳤어요!', '「비율의 결정」을 되찾았어요. 재상님께 가져다드려요.'],
    reward: { exp: 830, gold: 600, potions: 3 },
  },
  {
    id: 'report', title: '재상님께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '비율의 결정을 왕국 재상님께 가져다드려요.',
    at: { map: 'rk_town', x: 17.4, y: 10.6 },
    lines: [
      '오오! 천칭이 다시 반듯하게 균형을 잡았소!',
      '{name}, 그대 덕분에 왕국에 다시 공평함이 돌아왔소.',
      '비례식은 바깥쪽 곱과 안쪽 곱이 같고, 비례배분은 비의 합으로 먼저 나눈다는 걸 잊지 마시오. 과수원 동쪽 길로 가면 원환의 숲 키르쿠스가 나오오.',
    ],
    reward: { exp: 450, gold: 400 },
  },
];

// 곁 퀘스트: 프로포르 사람들의 이야기 (단계는 r1quests.js 설명과 같아요)
export const R4_SIDE = {
  crown: {
    giver: 'guard', title: '공주님의 작은 왕관', after: 1,
    start: ['큰일이오. 어린 공주님이 아끼는 장난감 왕관이 사라졌소!', '꼬마 비율이가 무언가 봤다고 하던데, 먼저 그 아이 이야기를 들어 주겠소?'],
    steps: [
      { type: 'talk', npc: 'child', desc: '꼬마 비율이에게 무엇을 봤는지 물어봐요.', short: '비율이에게 물어보기',
        lines: ['봤어! 너구리가 반짝이는 걸 물고 저울 평원으로 뛰어갔어.', '너구리들은 훔친 걸 기사의 협곡 덤불에 숨긴대. 우리 형아가 그랬어!'] },
      { type: 'kill', kind: 'Racoon', map: 'rk_plain', need: 5, desc: '저울 평원의 장난꾸러기 너구리 5마리를 혼내요.', short: '너구리 혼내 주기' },
      { type: 'find', target: 'find_crown', desc: '기사의 협곡 동쪽 덤불에서 왕관을 찾아요.', short: '덤불에서 왕관 찾기', item: '작은 왕관', lines: ['덤불 속에서 작은 왕관이 반짝여요!'] },
    ],
    ready: ['오오, 바로 이 왕관이오! 공주님이 기뻐하시겠소.', '왕실 기사단의 투구를 드리겠소. 그대는 이제 명예 기사요!'],
    reward: { exp: 220, item: 'knight_helm', gold: 150 },
  },
  juice: {
    giver: 'innkeeper', title: '황금 비율 사과 주스', after: 1,
    start: ['우리 여관 명물은 「황금 비율 사과 주스」예요. 그런데 사과가 똑 떨어졌어요.', '사과 과수원의 갓파들이 사과를 다 따 갔대요. 몇 개만 되찾아 주실래요?'],
    steps: [
      { type: 'collect', kind: 'KappaGreen', map: 'rk_orchard', need: 4, chance: 0.6, item: '빨간 사과', desc: '사과 과수원의 물병 갓파에게서 사과를 되찾아요.', short: '빨간 사과 되찾기' },
      { type: 'solve', npc: 'merchant', desc: '왕실 상인 비비에게 주스 비율을 맞춰 달라고 해요.', short: '비비와 비율 맞추기',
        lines: ['황금 비율 주스? 사과즙과 물의 비율이 맞아야 해.', '비례식을 세우면 금방이야. 같이 맞춰 보자!'], ask: '비율을 맞춰 주스를 만들어요!' },
    ],
    ready: ['음~ 바로 이 맛이에요! 황금 비율!', '손님들이 줄을 섰어요. 회복약과 감사의 금화예요!'],
    reward: { exp: 200, potions: 3, gold: 250 },
  },
  wand: {
    giver: 'smith', title: '기울어진 천칭', after: 1,
    start: ['왕국의 큰 천칭이 기울어졌다는군. 기사 균형이 걱정이 많다네.', '균형에게 무슨 일인지 듣고 와 주겠나? 고치는 김에 좋은 지팡이도 만들어 주지.'],
    steps: [
      { type: 'talk', npc: 'guard', desc: '왕실 기사 균형에게 천칭 이야기를 들어요.', short: '균형에게 듣기',
        lines: ['천칭 안의 톱니가 빠져 버렸소. 톱니바퀴 언덕의 초록 공룡들이 톱니를 삼켜 버린 것 같소.', '톱니를 되찾아야 왕국의 공평함이 돌아온다오.'] },
      { type: 'collect', kind: 'Reptile2', map: 'rk_hill', need: 4, chance: 0.6, item: '톱니 조각', desc: '톱니바퀴 언덕의 초록 공룡에게서 톱니 조각을 모아요.', short: '톱니 조각 모으기' },
      { type: 'solve', npc: 'smith', desc: '대장장이 저울과 함께 톱니 크기를 비례배분해요.', short: '저울과 톱니 맞추기',
        lines: ['톱니를 다시 끼우려면 크기를 비율대로 나눠야 하네.', '비례배분! 자네라면 할 수 있지.'], ask: '톱니를 비율대로 나눠요!' },
    ],
    ready: ['천칭이 반듯해졌다네! 왕국이 한숨 돌렸어.', '남은 톱니로 만든 별빛 지팡이일세. 스킬이 훨씬 강해질 걸세.'],
    reward: { exp: 240, weapon: 'magic_wand', stones: 3 },
  },
  shadow: {
    giver: 'child', title: '그림자로 키 재기', after: 1,
    start: ['나 있잖아, 그림자로 탑의 키를 잴 수 있대! 비례식을 쓰면 된대.', '톱니바퀴 언덕에 가면 큰 탑 그림자가 보인대. 같이 가 볼래?'],
    steps: [
      { type: 'enter', map: 'rk_hill', desc: '톱니바퀴 언덕으로 가서 탑 그림자를 봐요.', short: '톱니바퀴 언덕 가기', lines: ['언덕 위로 긴 그림자가 드리워져 있어요. 그림자 길이를 눈으로 재어 봐요.'] },
      { type: 'kill', kind: 'Snake2', map: 'rk_hill', need: 3, desc: '그림자를 재는 걸 방해하는 초록 뱀 3마리를 쫓아내요.', short: '초록 뱀 쫓아내기' },
      { type: 'solve', npc: 'child', desc: '비율이와 함께 비례식으로 탑의 높이를 구해요.', short: '비율이와 높이 구하기',
        lines: ['그림자 길이를 재어 왔어? 이제 비례식을 세우자!', '내 키랑 내 그림자, 탑이랑 탑 그림자의 비가 같대!'], ask: '비례식으로 높이를 구해요!' },
    ],
    ready: ['와! 탑이 그렇게 높았구나! 형아는 천재야!', '이건 우리 아빠가 쓰던 기사 장화야. 형아한테 줄게!'],
    reward: { exp: 220, gold: 200, item: 'knight_boots' },
  },
};
