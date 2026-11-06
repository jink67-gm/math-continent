// 2번 지역 퀘스트 — 쌓기나무 성채 큐베른 (공간과 입체)
// 형식은 data/r1quests.js 와 같아요.

export const R2_MAIN = [
  {
    id: 'meet', title: '성채 대장 큐브 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 성채 대장님께 인사드려요.',
    at: { map: 'cb_town', x: 17.4, y: 10.6 },
    lines: [
      '어서 오게, {name}! 프락시아를 구한 영웅이로군.',
      '큐베른은 「입체의 결정」 덕분에 무너지지 않고 서 있는 성채라네. 그런데 블록 두꺼비 큐블록스가 결정을 「세 방향 미궁」에 숨겨 버렸어.',
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
    id: 'cublox', title: '블록 두꺼비 큐블록스', type: 'boss', target: 'cublox',
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

// 곁 퀘스트: 큐베른 사람들의 이야기 (단계는 r1quests.js 설명과 같아요)
export const R2_SIDE = {
  master: {
    giver: 'master', title: '각진 사범의 첫 수업', after: 1,
    start: ['자네가 프락시아를 구했다는 모험가인가? 칼 쓰는 손이 아직 거칠구먼.', '내 비장의 콤보 「띄워 베기」를 가르쳐 주지. 단, 수련을 모두 마쳐야 하네!', '먼저 성채 병사 네모에게 가서 수련 상대가 되어 달라고 하게.'],
    steps: [
      { type: 'talk', npc: 'soldier', desc: '성채 병사 네모에게 수련을 부탁해요.', short: '네모에게 수련 부탁',
        lines: ['사범님 수업이라고? 하하, 나도 그 수업에서 엉덩방아를 백 번은 찧었지.', '내가 상대해 주긴 어렵고… 블록 언덕의 대나무 블록이 딱 좋은 수련 상대야. 다섯 개만 베고 와!'] },
      { type: 'kill', kind: 'Bamboo', map: 'cb_blocks', need: 5, desc: '블록 언덕의 대나무 블록 5개를 베어요.', short: '대나무 블록 베기' },
      { type: 'solve', npc: 'master', desc: '각진 사범의 「각도 시험」을 풀어요.', short: '사범의 시험 풀기',
        lines: ['좋아, 손목은 풀렸군. 마지막은 머리 시험이다.', '적을 띄우려면 모양을 정확히 봐야 하지. 이 문제를 풀어 보게!'], ask: '모양을 정확히 보는 눈이 콤보의 시작이다!' },
    ],
    ready: ['훌륭하다! 이제 「띄워 베기」를 알려 주지.', 'J를 두 번 휘두르고, 한 박자 쉬었다가 다시 J! 적을 하늘로 띄워 올린 다음 공중에서 두 번 더 베는 거다.', '스킬처럼 SP가 들지 않으니, 박자만 익히면 언제든 쓸 수 있네.'],
    reward: { exp: 100, combo: 'launch', gold: 80 },
  },
  tower: {
    giver: 'child', title: '무너진 블록 탑', after: 1,
    start: ['흑흑… 내가 열흘 동안 쌓은 블록 탑이 무너졌어.', '채석장 생쥐들이 블록을 물고 도망갔고, 제일 꼭대기 블록은 능선까지 굴러갔대!'],
    steps: [
      { type: 'collect', kind: 'Mouse', map: 'cb_quarry', need: 4, chance: 0.6, item: '나무 블록', desc: '쌓기나무 채석장의 생쥐에게서 나무 블록을 되찾아요.', short: '나무 블록 되찾기' },
      { type: 'find', target: 'find_block', desc: '세 갈래 능선 동쪽 풀숲에서 꼭대기 블록을 찾아요.', short: '꼭대기 블록 찾기', item: '꼭대기 블록', lines: ['풀숲 사이에 반짝이는 꼭대기 블록이 있어요!'] },
      { type: 'solve', npc: 'child', desc: '큐티와 함께 탑을 다시 쌓아요.', short: '큐티와 탑 쌓기',
        lines: ['블록을 다 찾았어! 이제 다시 쌓자.', '위에서 보고, 앞에서 보고, 옆에서 본 모양이 맞아야 해. 같이 생각해 줄래?'], ask: '쌓기나무 탑을 다시 쌓아요!' },
    ],
    ready: ['우와, 전보다 더 멋진 탑이 됐어!', '이건 내 보물 1호, 엄마가 사 준 가죽 신발이야. 발이 빨라진대!'],
    reward: { exp: 85, gold: 120, item: 'shoes' },
  },
  shield: {
    giver: 'smith', title: '성채의 깨진 투구', after: 1,
    start: ['쿵! 어제 성채 병사들 투구가 줄줄이 깨져서 들어왔다네.', '어떻게 된 일인지 네모에게 들어 보고, 새 투구를 만들 단단한 광석을 구해 주겠나?'],
    steps: [
      { type: 'talk', npc: 'soldier', desc: '성채 병사 네모에게 투구가 왜 깨졌는지 물어봐요.', short: '네모에게 물어보기',
        lines: ['채석장 두더지들이 땅굴을 파는 바람에 성벽 돌이 떨어졌어. 머리가 아직도 얼얼해!', '두더지들 굴 속에 단단한 광석이 많대. 그걸로 만들면 튼튼할 거야.'] },
      { type: 'collect', kind: 'Mole', map: 'cb_quarry', need: 4, chance: 0.6, item: '단단한 광석', desc: '채석장 두더지에게서 단단한 광석을 모아요.', short: '단단한 광석 모으기' },
      { type: 'solve', npc: 'smith', desc: '모루와 함께 투구 틀을 맞춰요.', short: '모루와 투구 만들기',
        lines: ['좋은 광석이군! 이제 틀에 맞게 쌓아야 하네.', '쌓기나무처럼 몇 개가 들어가는지 정확히 세어 주게.'], ask: '틀에 들어가는 쌓기나무는 몇 개일까요?' },
    ],
    ready: ['쿵! 쿵! 성채 병사들 투구를 모두 고치고 하나가 남았네.', '자네 머리에 꼭 맞을 철 투구일세. 강화석도 몇 개 챙겨 주지.'],
    reward: { exp: 90, item: 'helm', stones: 2 },
  },
  owls: {
    giver: 'innkeeper', title: '잠 못 드는 여관', after: 1,
    start: ['하아암… 요즘 벚꽃 숲길 부엉이들이 밤새 우는 바람에 손님들이 한숨도 못 자요.', '부엉이들을 조용히 시켜 주시고, 상인 토토에게 자장가 오르골도 받아다 주실래요?'],
    steps: [
      { type: 'kill', kind: 'Owl', map: 'cb_grove', need: 5, desc: '벚꽃 숲길의 꾸벅 부엉이 5마리를 물리쳐요.', short: '시끄러운 부엉이 달래기' },
      { type: 'solve', npc: 'merchant', desc: '상인 토토에게서 자장가 오르골을 사 와요.', short: '토토에게 오르골 받기',
        lines: ['자장가 오르골? 마지막 하나 남았어. 상자에 쏙 들어가는지 확인해 줄래?', '상자 크기를 맞혀야 포장해 줄 수 있거든!'], ask: '오르골 상자 문제를 풀어요!' },
    ],
    ready: ['오르골 소리를 들으니 저도 졸음이 와요… 하아암.', '덕분에 손님들이 푹 잤대요. 여관 비상금이에요. 회복약도 챙겨 가세요!'],
    reward: { exp: 80, gold: 150, potions: 3 },
  },
};
