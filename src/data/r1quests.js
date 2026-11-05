// 1번 지역 퀘스트 — 마을에서 받고, 마을 밖 여러 지도를 돌며 해내요.
//
// 메인 이야기 (차례대로):
//   type  talk(사람) · rune(룬 여러 개, 아무 순서) · enter(지도 도착) · boss(보스 정화)
//   at    화살표가 가리킬 곳 { map, x, y } — 룬은 룬마다 따로
// 곁 퀘스트 (마을 사람이 줘요, 머리 위 「!」):
//   type  kill(몬스터 정화) · collect(몬스터가 떨어뜨리는 물건) · find(숨은 물건 찾기)
//   need  몇 번 · map 어디서 · kind 어떤 몬스터 · after 메인 단계 몇 번째부터 받을 수 있는지
// 대사 속 {name}은 주인공 이름으로 바뀌어요.

export const R1_MAIN = [
  {
    id: 'meet', title: '풍차 촌장 모모 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 촌장님께 인사드려요.',
    at: { map: 'village', x: 17.6, y: 12.8 },
    lines: [
      '오오, {name}! 정령 피피가 말한 모험가로군.',
      '우리 계곡의 풍차는 「분수의 결정」의 힘으로 돈다네. 그런데 뒤집기 트롤 인버트롤이 결정을 가져가 동굴로 숨어 버렸어.',
      '동굴로 가는 「돌다리 고개」는 오래된 봉인으로 막혀 있지. 봉인을 풀려면 마을 밖 세 곳의 룬 돌을 깨워야 한다네.',
      '동쪽 바람개비 들판, 남쪽 졸졸 시냇가, 서쪽 나무꾼 숲이야. 마을 사람들 부탁도 들어주며 힘을 기르게!',
    ],
    reward: { exp: 15, gold: 20 },
  },
  {
    id: 'runes', title: '세 곳의 룬 돌 깨우기', type: 'rune', target: ['runeA', 'runeB', 'runeC'],
    desc: '들판·시냇가·숲 언덕 위의 룬 돌을 깨워요.',
    at: { runeA: { map: 'east_field', x: 34.5, y: 9.4 }, runeB: { map: 'stream', x: 34.5, y: 23.6 }, runeC: { map: 'forest', x: 9.5, y: 8 } },
    done: ['세 룬 돌이 모두 깨어났어요!', '바람의 언덕 북쪽 「돌다리 고개」의 봉인이 풀렸어요. 마을 북쪽으로 나가 언덕을 올라요.'],
    reward: { exp: 60, gold: 40, potions: 2 },
  },
  {
    id: 'cave', title: '뒤집힌 동굴 찾기', type: 'enter', target: 'Map:cave1',
    desc: '바람의 언덕을 지나 돌다리 고개의 동굴로 들어가요.',
    at: { map: 'pass', x: 21, y: 11 },
    done: ['서늘한 바람이 불어와요…', '동굴 안쪽 봉인된 문 양옆의 룬 기둥 두 개를 깨워야 해요.'],
    reward: { exp: 50, gold: 30 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['caveA', 'caveB'],
    desc: '동굴 1층의 룬 기둥 두 개를 모두 깨워요.',
    at: { caveA: { map: 'cave1', x: 12, y: 15 }, caveB: { map: 'cave1', x: 24, y: 15 } },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '문 너머 계단 아래에서 커다란 숨소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 70, potions: 2 },
  },
  {
    id: 'troll', title: '뒤집기 트롤 인버트롤', type: 'boss', target: 'troll',
    desc: '동굴 2층의 인버트롤을 정화하고 「분수의 결정」을 되찾아요.',
    at: { map: 'cave2', x: 15.5, y: 12 },
    done: ['인버트롤이 정화됐어요!', '「분수의 결정」을 되찾았어요. 촌장님께 가져다드려요.'],
    reward: { exp: 150, gold: 100, potions: 2 },
  },
  {
    id: 'report', title: '촌장님께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '분수의 결정을 촌장님께 가져다드려요.',
    at: { map: 'village', x: 17.6, y: 12.8 },
    lines: [
      '오오! 분수의 결정이 다시 반짝이는구먼!',
      '보게, 풍차가 힘차게 돌기 시작했어. {name}, 자네는 나눔의 계곡의 영웅일세!',
      '나누기는 「뒤집어서 곱하기」라는 걸 잊지 말게. 바람개비 들판 동쪽 길로 가면 큐베른이 나온다네.',
    ],
    reward: { exp: 80, gold: 80 },
  },
];

export const R1_SIDE = {
  slime: {
    giver: 'pipi', title: '말랑 슬라임 정화', type: 'kill', kind: 'Slime', map: 'east_field', need: 5, after: 1,
    desc: '바람개비 들판의 슬라임 5마리를 정화해요.',
    start: ['바람개비 들판의 슬라임들이 심술이 났어요.', '5마리만 정화해 주실래요? 동쪽 길로 나가면 돼요!'],
    ready: ['우와, 들판이 한결 맑아졌어요!', '고마워요! 이건 제 선물이에요.'],
    reward: { exp: 30, potions: 2 },
  },
  spore: {
    giver: 'smith', title: '반짝이는 버섯 포자', type: 'collect', kind: 'Mushroom', map: 'stream', need: 5, chance: 0.6, item: '버섯 포자', after: 1,
    desc: '졸졸 시냇가의 버섯에게서 버섯 포자 5개를 모아요.',
    start: ['쾅! 좋은 검을 만들려면 반짝이는 버섯 포자가 필요하지.', '남쪽 시냇가의 졸린 버섯들이 가지고 있다네. 5개만 부탁하네!'],
    ready: ['오오, 반짝반짝하구먼!', '약속한 대로 튼튼한 대검을 만들어 주지. 가방(B)에서 끼워 보게!'],
    reward: { exp: 45, weapon: 'iron_sword' },
  },
  spirit: {
    giver: 'innkeeper', title: '길 잃은 정령 달래기', type: 'kill', kind: 'Spirit', map: 'forest', need: 4, after: 1,
    desc: '나무꾼 숲의 길 잃은 정령 4마리를 정화해요.',
    start: ['요즘 서쪽 숲에서 길 잃은 정령들이 구슬을 던진대요.', '4마리만 정화해 주면 손님들이 안심하겠어요.'],
    ready: ['숲이 조용해졌다니 다행이에요.', '든든하게 회복약을 챙겨 드릴게요.'],
    reward: { exp: 60, potions: 3 },
  },
  ball: {
    giver: 'child', title: '잃어버린 공', type: 'find', target: 'ball', map: 'hill', need: 1, item: '빨간 공', after: 1,
    desc: '바람의 언덕 오른쪽 아래 풀숲에서 콩이의 공을 찾아요.',
    start: ['내 빨간 공이 바람에 날아가서 언덕까지 굴러갔어…', '바람의 언덕 오른쪽 아래 풀숲에 있을 거야. 찾아 줄래?'],
    ready: ['내 공이다! 고마워!', '이건 내가 모은 용돈이야. 헤헤.'],
    reward: { exp: 40, gold: 60 },
  },
};
