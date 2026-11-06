// 3번 지역 퀘스트 — 소수점 항구 데시마르 (소수의 나눗셈)
// 형식은 data/r1quests.js 와 같아요.

export const R3_MAIN = [
  {
    id: 'meet', title: '항구 선장 데시 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 선장님께 인사드려요.',
    at: { map: 'dh_town', x: 17.4, y: 8.6 },
    lines: [
      '어서 오게, {name}! 큐베른의 성채를 지킨 영웅이로군.',
      '등대는 「소수의 결정」으로 빛을 내서 배들이 길을 잃지 않지. 그런데 바다두꺼비 데시토드가 결정을 「소용돌이 해저 동굴」로 가져가 버렸어.',
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
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '동굴 끝 바깥에서 커다란 물소리가 들려요. 회복약을 챙겨요.'],
    reward: { exp: 260, potions: 2 },
  },
  {
    id: 'decikraken', title: '소수점 바다두꺼비 데시토드', type: 'boss', target: 'decikraken',
    desc: '해저 동굴을 빠져나간 소용돌이 바위섬의 데시토드를 물리치고 「소수의 결정」을 되찾아요.',
    at: { map: 'dh_cave2', x: 15.5, y: 12 },
    done: ['데시토드를 물리쳤어요!', '「소수의 결정」을 되찾았어요. 선장님께 가져다드려요.'],
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

// 곁 퀘스트: 데시마르 사람들의 이야기 (단계는 r1quests.js 설명과 같아요)
export const R3_SIDE = {
  lighthouse: {
    giver: 'samurai', title: '등대 무사의 찌르기', after: 1,
    start: ['나는 등대를 지키는 무사 파랑이오. 요즘 산호 해안 문어들이 먹물을 뿜어 등대 불빛을 가리고 있소.', '문어들을 물리쳐 불빛을 되찾아 준다면, 내 콤보 「모아 찌르기」를 전해 주겠소.'],
    steps: [
      { type: 'kill', kind: 'Octopus', map: 'dh_reef', need: 5, desc: '산호 해안의 먹물 문어 5마리를 물리쳐요.', short: '먹물 문어 물리치기' },
      { type: 'talk', npc: 'sailor', desc: '선원 돌핀에게 등대 불빛이 돌아왔는지 물어봐요.', short: '돌핀에게 확인하기',
        lines: ['오! 방금 바다에서 등대 불빛이 똑똑히 보였어!', '파랑 무사님께 고맙다고 전해 줘. 그분 찌르기는 정말 번개 같다니까.'] },
      { type: 'solve', npc: 'samurai', desc: '파랑 무사의 「한 점」 시험을 풀어요.', short: '무사의 시험 풀기',
        lines: ['불빛이 돌아왔구려. 마지막 시험이오.', '찌르기는 한 점을 정확히 노려야 하오. 소수점 하나 틀려도 빗나가지.'], ask: '소수점까지 정확하게!' },
    ],
    ready: ['좋소. 「모아 찌르기」를 알려 주겠소.', 'J를 꾹 눌러 힘을 모았다가 떼시오. 앞으로 미끄러지며 줄지은 적을 한꺼번에 꿰뚫는다오.', '더 오래 모으면 세 번 연달아 찌르지. SP는 들지 않소.'],
    reward: { exp: 160, combo: 'pierce', gold: 120 },
  },
  net: {
    giver: 'sailor', title: '찢어진 그물', after: 1,
    start: ['큰일이야! 내 그물이 찢어져서 고기를 한 마리도 못 잡았어.', '모래톱 물고기들이 가진 튼튼한 해초로 기우면 되는데… 도와줄래?'],
    steps: [
      { type: 'collect', kind: 'Fish', map: 'dh_beach', need: 4, chance: 0.6, item: '튼튼한 해초', desc: '조개 모래톱의 퐁당 물고기에게서 튼튼한 해초를 모아요.', short: '튼튼한 해초 모으기' },
      { type: 'solve', npc: 'merchant', desc: '항구 상인 마리에게 해초를 알맞은 길이로 잘라 달라고 해요.', short: '마리와 해초 자르기',
        lines: ['해초를 그물 실로 쓰려고? 똑같은 길이로 잘라야 해.', '몇 도막이 나오는지 계산해 줄래? 소수 나눗셈이야!'], ask: '해초를 몇 도막으로 자를 수 있을까요?' },
    ],
    ready: ['그물이 새것처럼 튼튼해졌어!', '오늘 잡은 고기를 판 돈이야. 그리고 이 물새 장화, 물가에서 미끄러지지 않아!'],
    reward: { exp: 140, gold: 200, item: 'wader' },
  },
  pearl: {
    giver: 'child', title: '엄마의 진주', after: 1,
    start: ['엄마 생신 선물로 진주를 주우러 갔다가… 소용돌이 만에 떨어뜨렸어.', '엄마한테는 비밀이야! 여관에 있는 엄마한테 슬쩍 생신 날짜만 물어봐 줄래?'],
    steps: [
      { type: 'talk', npc: 'innkeeper', desc: '여관 주인 파도(소라 엄마)에게 슬쩍 이야기를 들어 봐요.', short: '파도에게 슬쩍 묻기',
        lines: ['어머, 소라 친구구나? 내 생일은 바로 내일이란다.', '소라가 요즘 소용돌이 만 동쪽 조개 더미 쪽을 자꾸 들락거리던데… 무슨 일일까?'] },
      { type: 'kill', kind: 'Mollusc', map: 'dh_cove', need: 3, desc: '소용돌이 만에서 진주를 노리는 소라게 3마리를 쫓아요.', short: '소라게 쫓아내기' },
      { type: 'find', target: 'find_pearl', desc: '소용돌이 만 동쪽 조개 더미에서 진주를 찾아요.', short: '조개 더미에서 진주 찾기', item: '진주', lines: ['조개 사이에서 동그란 진주가 반짝여요!'] },
    ],
    ready: ['내 진주다! 엄마가 정말 좋아하실 거야!', '이건 우리 집에 대대로 내려오는 자수정 목걸이래. 모험가한테 주라고 엄마가 그랬어! (엄마는 다 알고 계셨나 봐)'],
    reward: { exp: 120, gold: 150, item: 'amulet' },
  },
  shell: {
    giver: 'smith', title: '소라 껍데기 갑옷', after: 1,
    start: ['단단한 소라 껍데기를 갈아 넣으면 아주 튼튼한 갑옷이 되지.', '등대 방파제 소라게들이 가지고 있다네. 다섯 개만 부탁하네!'],
    steps: [
      { type: 'collect', kind: 'Mollusc', map: 'dh_pier', need: 5, chance: 0.6, item: '소라 껍데기', desc: '등대 방파제의 소라게에게서 소라 껍데기를 모아요.', short: '소라 껍데기 모으기' },
      { type: 'solve', npc: 'smith', desc: '닻쇠와 함께 껍데기 가루를 알맞게 섞어요.', short: '닻쇠와 갑옷 만들기',
        lines: ['껍데기 가루를 쇳물에 섞을 차례야.', '비율이 소수점 하나만 틀려도 갑옷이 물러진다네. 계산해 주게!'], ask: '가루를 몇 번에 나눠 넣을까요?' },
    ],
    ready: ['오오, 반짝반짝 단단하구먼!', '철 갑옷일세. 장비(B) 창에서 입어 보게! 강화석도 넣어 두었네.'],
    reward: { exp: 150, armor: 'iron', stones: 2 },
  },
};
