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

export const R4_SIDE = {
  racoon: {
    giver: 'guard', title: '장난꾸러기 너구리 쫓아내기', type: 'kill', kind: 'Racoon', map: 'rk_plain', need: 6, after: 1,
    desc: '저울 평원의 너구리 6마리를 물리쳐요.',
    start: ['저울 평원의 너구리들이 상인들 짐을 뒤지고 있소!', '6마리만 쫓아내 주시오. 북쪽 길이오.'],
    ready: ['평원이 조용해졌소. 고맙소!', '기사단의 회복약을 나눠 드리겠소.'],
    reward: { exp: 200, potions: 3 },
  },
  scales: {
    giver: 'smith', title: '반짝이는 도마뱀 비늘', type: 'collect', kind: 'Lizard', map: 'rk_orchard', need: 5, chance: 0.6, item: '도마뱀 비늘', after: 1,
    desc: '사과 과수원의 도마뱀에게서 비늘 5개를 모아요.',
    start: ['반짝이는 도마뱀 비늘을 박아 넣으면 별빛 지팡이를 만들 수 있지.', '동쪽 과수원 도마뱀들이 떨어뜨린다네. 5개만 부탁하네!'],
    ready: ['오오, 아주 고운 비늘이구먼!', '약속대로 별빛 지팡이를 만들어 주지. 최대 SP도 올라간다네!'],
    reward: { exp: 240, weapon: 'magic_wand' },
  },
  kappa: {
    giver: 'innkeeper', title: '물병 갓파 혼내 주기', type: 'kill', kind: 'KappaGreen', map: 'rk_hill', need: 5, after: 1,
    desc: '톱니바퀴 언덕의 물병 갓파 5마리를 물리쳐요.',
    start: ['톱니바퀴 언덕의 갓파들이 물을 뿌려서 손님들 옷이 다 젖어요.', '5마리만 혼내 주면 정말 고맙겠어요.'],
    ready: ['이제 손님들이 뽀송뽀송하겠어요!', '감사의 뜻으로 회복약을 넉넉히 드릴게요.'],
    reward: { exp: 240, potions: 3, gold: 120 },
  },
  crown: {
    giver: 'child', title: '잃어버린 장난감 왕관', type: 'find', target: 'find_crown', map: 'rk_gorge', need: 1, item: '장난감 왕관', after: 1,
    desc: '기사의 협곡 동쪽 덤불에서 비율이의 장난감 왕관을 찾아요.',
    start: ['내 장난감 왕관이 없어졌어! 기사 놀이 하다가 협곡에서 잃어버렸나 봐.', '기사의 협곡 동쪽 덤불 쪽이었어. 찾아 줄래?'],
    ready: ['내 왕관이다! 이제 다시 왕 놀이 할 수 있어!', '이건 내가 모은 용돈이야. 헤헤.'],
    reward: { exp: 180, gold: 300 },
  },
};
