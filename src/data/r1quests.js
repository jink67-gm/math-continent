// 1번 지역 퀘스트 — 마을에서 받고, 마을 밖 여러 지도를 돌며 해내요.
//
// 메인 이야기 (차례대로):
//   type  talk(사람) · rune(룬 여러 개, 아무 순서) · enter(지도 도착) · boss(보스 물리치기)
//   at    화살표가 가리킬 곳 { map, x, y } — 룬은 룬마다 따로
// 곁 퀘스트 (마을 사람이 줘요, 머리 위 「!」):
//   type  kill(몬스터 물리치기) · collect(몬스터가 떨어뜨리는 물건) · find(숨은 물건 찾기)
//   need  몇 번 · map 어디서 · kind 어떤 몬스터 · after 메인 단계 몇 번째부터 받을 수 있는지
// 대사 속 {name}은 주인공 이름으로 바뀌어요.

export const R1_MAIN = [
  {
    id: 'pipi', title: '안내 정령 피피와 이야기하기', type: 'talk', target: 'pipi',
    desc: '광장 분수 옆에 떠 있는 안내 정령 피피에게 말을 걸어요.',
    at: { map: 'village', x: 18.6, y: 22.2 },
    lines: [
      '{name}님, 프락시아 마을에 잘 왔어요! 저는 안내 정령 피피예요. 앞으로 계속 곁에서 도와줄게요.',
      '여기는 여섯 마을 중 첫 번째, 나눔의 계곡 프락시아예요. 결정을 잃어서 풍차가 힘없이 돌고 있죠?',
      '{controls}',
      '먼저 마을 위쪽 언덕, 큰 집 앞의 풍차 촌장 모모님께 인사드려요. 노란 화살표가 길을 알려 줄 거예요!',
    ],
    reward: { exp: 10, potions: 1 },
  },
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
    desc: '동굴 2층의 인버트롤을 물리치고 「분수의 결정」을 되찾아요.',
    at: { map: 'cave2', x: 15.5, y: 12 },
    done: ['인버트롤을 물리쳤어요!', '「분수의 결정」을 되찾았어요. 촌장님께 가져다드려요.'],
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

// 곁 퀘스트: 마을 사람마다 이야기가 있어요. steps를 차례로 해내고, 부탁한 사람에게 돌아가 보상을 받아요.
// 단계: talk(npc와 이야기) · solve(npc가 내는 수학 문제) · kill · collect(item) · find(target 자리) · enter(map)
export const R1_SIDE = {
  bread: {
    giver: 'innkeeper', title: '여관의 나눔 빵', after: 2,
    start: ['어쩌면 좋아요… 손님들과 나눠 먹을 빵을 구우려는데, 바람개비 들판의 슬라임들이 밀가루 자루를 몽땅 끌고 가 버렸어요.', '밀가루 자루 세 개만 찾아다 주실래요? 상인 루루가 빵을 똑같이 나누는 걸 도와준대요.'],
    steps: [
      { type: 'collect', kind: 'Slime', map: 'east_field', need: 3, chance: 0.6, item: '밀가루 자루', desc: '바람개비 들판의 슬라임에게서 밀가루 자루를 되찾아요.', short: '밀가루 자루 찾기' },
      { type: 'solve', npc: 'merchant', desc: '상인 루루와 빵을 똑같이 나눠요.', short: '루루와 빵 나누기',
        lines: ['밀가루를 찾았구나! 이제 구운 빵을 손님 수에 맞게 똑같이 나눠야 해.', '나누기를 잘하는 너라면 금방 풀 거야!'], ask: '빵을 똑같이 나누려면 어떻게 계산할까요?' },
    ],
    ready: ['고소한 빵 냄새가 여관 가득 퍼졌어요!', '손님들이 모두 한 조각씩 나눠 먹었대요. 이건 여관에서 드리는 선물이에요.'],
    reward: { exp: 55, potions: 3, gold: 30 },
  },
  sword: {
    giver: 'smith', title: '경비병의 새 검', after: 2,
    start: ['쾅! 경비병 단단이 검이 너무 낡았다고 투덜대더군.', '어떤 검을 원하는지 먼저 물어봐 주겠나? 나는 망치질 준비를 해 두지.'],
    steps: [
      { type: 'talk', npc: 'guard', desc: '경비병 단단에게 어떤 검을 원하는지 물어봐요.', short: '단단에게 물어보기',
        lines: ['새 검? 그렇다면 묵직하고 튼튼한 대검이 좋겠소!', '대장장이가 그러는데, 쇠를 단단하게 하려면 시냇가 버섯의 반짝이는 포자가 필요하다더군.'] },
      { type: 'collect', kind: 'Mushroom', map: 'stream', need: 4, chance: 0.6, item: '반짝이는 포자', desc: '졸졸 시냇가의 졸린 버섯에게서 반짝이는 포자를 모아요.', short: '반짝이는 포자 모으기' },
      { type: 'solve', npc: 'smith', desc: '쿵쿵과 함께 쇠를 알맞게 나눠 담금질해요.', short: '쿵쿵과 담금질하기',
        lines: ['포자를 가져왔군! 이제 쇳물을 틀에 똑같이 나눠 부어야 하네.', '계산이 틀리면 칼날이 비뚤어지지. 도와주게!'], ask: '쇳물을 틀에 똑같이 나눠 부어요!' },
    ],
    ready: ['쾅! 쾅! 다 됐다! 단단이 쓸 검을 만들고 남은 쇠로 자네 검도 하나 만들었지.', '든든한 대검일세. 장비(B) 창에서 끼워 보게!'],
    reward: { exp: 60, weapon: 'iron_sword', stones: 2 },
  },
  spirits: {
    giver: 'pipi', title: '길 잃은 정령 친구들', after: 2,
    start: ['{name}님… 사실 나무꾼 숲에 사는 정령들은 제 친구들이에요.', '혼돈의 바람을 맞고 길을 잃어서 사람들에게 구슬을 던지고 있대요. 친구들을 진정시켜 줄래요?'],
    steps: [
      { type: 'enter', map: 'forest', desc: '서쪽 나무꾼 숲으로 가요.', short: '나무꾼 숲으로', lines: ['숲속 어딘가에서 보랏빛 기운이 느껴져요…'] },
      { type: 'kill', kind: 'Spirit', map: 'forest', need: 4, desc: '길 잃은 정령 4마리를 진정시켜요.', short: '정령 진정시키기' },
      { type: 'talk', npc: 'runeMaster', desc: '룬 할아버지께 정령을 원래대로 돌리는 방법을 여쭤봐요.', short: '룬 할아버지께 여쭙기',
        lines: ['허허, 정령들이 혼돈의 바람을 맞았구나.', '걱정 마라. 피피에게 이 「맑음의 룬」을 전해 주면 친구들이 다시 맑아질 게다.'] },
    ],
    ready: ['맑음의 룬이에요! 이제 친구들이 다시 웃을 수 있겠어요.', '고마워요, {name}님. 이건 숲에서 찾은 행운의 네잎 클로버예요!'],
    reward: { exp: 60, potions: 2, item: 'clover' },
  },
  ball: {
    giver: 'child', title: '콩이의 빨간 공', after: 2,
    start: ['으앙… 내 빨간 공이 바람에 날아가 버렸어!', '경비병 아저씨가 어디로 날아갔는지 봤대. 같이 찾아 줄래?'],
    steps: [
      { type: 'talk', npc: 'guard', desc: '경비병 단단에게 공이 어디로 갔는지 물어봐요.', short: '단단에게 물어보기',
        lines: ['빨간 공? 아까 바람을 타고 북쪽 「바람의 언덕」으로 날아가더군.', '언덕 오른쪽 아래 풀숲 근처였소. 나비들이 공을 가지고 노는 것 같던데…'] },
      { type: 'kill', kind: 'Butterfly', map: 'hill', need: 3, desc: '바람의 언덕에서 공을 가지고 노는 나비 3마리를 쫓아내요.', short: '장난꾸러기 나비 쫓기' },
      { type: 'find', target: 'ball', desc: '바람의 언덕 오른쪽 아래 풀숲에서 공을 찾아요.', short: '풀숲에서 공 찾기', item: '빨간 공', lines: ['풀숲 사이에서 빨간 공을 찾았어요!'] },
    ],
    ready: ['내 공이다! 정말 고마워!', '이건 아빠가 만들어 준 가죽 모자야. 나보다 형한테 더 잘 어울릴 것 같아!'],
    reward: { exp: 45, gold: 60, item: 'cap' },
  },
};
