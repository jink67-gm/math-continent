// 6번 지역 퀘스트 — 회전체 산맥 볼테라 (원기둥, 원뿔, 구) + 마지막 혼돈의 첨탑
// 형식은 data/r1quests.js 와 같아요. 첨탑 단계(spire~zero)는 예전 던전 장면(Dungeon:chaosSpire)에서 이어져요.

import { SPIRE } from './regions.js';

const TO_SPIRE = { map: 'sp_town', x: 43, y: 18.5 }; // 마을 동쪽 길 끝

export const R6_MAIN = [
  {
    id: 'meet', title: '산지기 할머니 볼타 만나기', type: 'talk', target: 'chief',
    desc: '마을 위쪽 언덕, 큰 집 앞의 산지기 할머니께 인사드려요.',
    at: { map: 'sp_town', x: 17.4, y: 10.6 },
    lines: [
      '아이고, {name}! 숲을 되살린 영웅이 이 산골까지 와 주었구나.',
      '이 산은 「회전의 결정」 덕분에 눈보라가 빙글빙글 돌아 잠잠해진단다. 그런데 대장군 볼텍스가 결정을 산속 「불꽃 용암굴」 너머 「구름 위 정상」에 봉인해 버렸어.',
      '용암굴로 가는 「구름 능선」은 봉인 바위로 막혀 있지. 원기둥 · 원뿔 · 구, 세 룬 돌을 모두 깨워야 풀린단다.',
      '북쪽 눈꽃 비탈에 「원기둥의 룬」, 남쪽 얼음 골짜기에 「원뿔의 룬」, 골짜기 동쪽 얼어붙은 호수 섬에 「구의 룬」이 있어.',
    ],
    reward: { exp: 340, gold: 120 },
  },
  {
    id: 'runes', title: '원기둥 · 원뿔 · 구의 룬 깨우기', type: 'rune', target: ['runeCylinder', 'runeCone', 'runeSphere'],
    desc: '눈꽃 비탈·얼음 골짜기·얼어붙은 호수의 룬 돌을 깨워요.',
    at: { runeCylinder: { map: 'sp_slope', x: 21.5, y: 6.4 }, runeCone: { map: 'sp_valley', x: 9.5, y: 24.4 }, runeSphere: { map: 'sp_lake', x: 21.5, y: 18 } },
    done: ['세 룬이 모두 깨어났어요!', '구름 능선의 봉인 바위가 풀렸어요. 눈꽃 비탈 동쪽이나 호수 북쪽으로 가요.'],
    reward: { exp: 1070, gold: 240, potions: 3 },
  },
  {
    id: 'tower', title: '불꽃 용암굴 찾기', type: 'enter', target: 'Map:sp_tower1',
    desc: '구름 능선 북쪽 절벽의 용암굴로 들어가요.',
    at: { map: 'sp_ridge', x: 21, y: 11 },
    done: ['뜨거운 용암이 흐르는 동굴이에요…', '안쪽 봉인된 문 양옆의 룬 기둥 두 개를 깨워야 해요.'],
    reward: { exp: 740, gold: 180 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['solidA', 'solidB'],
    desc: '용암굴의 룬 기둥 두 개를 모두 깨워요.',
    at: { solidA: { map: 'sp_tower1', x: 12, y: 15 }, solidB: { map: 'sp_tower1', x: 24, y: 15 } },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '동굴 너머 정상에서 무거운 갑옷 소리가 울려요. 회복약을 챙겨요.'],
    reward: { exp: 1070, potions: 3 },
  },
  {
    id: 'guardians', title: '회전의 대장군 볼텍스', type: 'boss', target: 'guardians',
    desc: '구름 위 정상의 볼텍스를 물리치고 「회전의 결정」을 되찾아요.',
    at: { map: 'sp_tower2', x: 15.5, y: 12 },
    done: ['볼텍스를 물리쳤어요!', '「회전의 결정」을 되찾았어요. 산지기 할머니께 가져다드려요.'],
    reward: { exp: 2130, gold: 900, potions: 3 },
  },
  {
    id: 'report', title: '할머니께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '회전의 결정을 산지기 할머니께 가져다드려요.',
    at: { map: 'sp_town', x: 17.4, y: 10.6 },
    lines: [
      '오오! 눈보라가 잠잠해졌구나!',
      '{name}, 네 덕분에 볼테라에 다시 햇살이 비친단다.',
      '이제 마을 동쪽 「혼돈의 첨탑」만 남았구나. 여섯 결정의 힘을 모아 혼돈의 군주 제로를 막아 다오!',
    ],
    reward: { exp: 1150, gold: 600 },
  },
  {
    id: 'spire', title: '혼돈의 첨탑으로', type: 'enter', target: 'Dungeon:chaosSpire',
    desc: '마을 동쪽 길 끝의 혼돈의 첨탑으로 들어가요.',
    at: TO_SPIRE,
    done: ['여섯 단원의 문제가 모두 섞인 탑이에요.', '룬 기둥 두 개를 깨워 꼭대기로 가요!'],
    reward: { exp: 500 },
  },
  {
    id: 'spireSeal', title: '혼돈의 봉인 풀기', type: 'rune', target: ['sA', 'sB'],
    desc: '첨탑의 룬 기둥 두 개를 깨워요 (여섯 단원 섞어서).',
    at: { sA: TO_SPIRE, sB: TO_SPIRE },
    goals: { 'Dungeon:chaosSpire': [20, 23] },
    done: ['혼돈의 문이 열렸어요!'],
    reward: { exp: 800, potions: 3 },
  },
  {
    id: 'zero', title: SPIRE.boss.name, type: 'boss', target: SPIRE.boss.id,
    desc: '탑 꼭대기의 혼돈의 군주 제로를 물리쳐요!',
    at: TO_SPIRE,
    goals: { 'Dungeon:chaosSpire': [20, 12] },
    done: ['혼돈의 군주 제로를 물리쳤어요!', '여섯 결정의 빛이 수학 대륙 전체로 퍼져 나가요.', '축하해요, {name}! 여섯 마을의 봉인을 모두 지켜 냈어요!'],
    reward: { exp: 2000, gold: 1000 },
  },
];

// 곁 퀘스트: 볼테라 사람들의 이야기 (단계는 r1quests.js 설명과 같아요)
export const R6_SIDE = {
  scarf: {
    giver: 'child', title: '할머니의 털목도리', after: 1,
    start: ['쉿, 나는 꼬마 닌자 데굴이! …사실은 할머니가 떠 준 목도리를 잃어버렸어.', '할머니께 들키면 안 돼! 어디서 잃어버렸는지 할머니께 슬쩍 물어봐 줄래?'],
    steps: [
      { type: 'talk', npc: 'chief', desc: '산지기 할머니 볼타에게 슬쩍 물어봐요.', short: '할머니께 슬쩍 묻기',
        lines: ['데굴이가 목도리를? 호호, 이미 다 알고 있단다.', '어제 구름 능선에서 눈싸움하다 흘렸겠지. 눈꽃 비탈 두더지들이 털실을 물어 가니 조심하렴.'] },
      { type: 'kill', kind: 'Mole2', map: 'sp_slope', need: 4, desc: '털실을 물어 가는 눈꽃 비탈의 눈 두더지 4마리를 쫓아요.', short: '눈 두더지 쫓기' },
      { type: 'find', target: 'find_scarf', desc: '구름 능선 동쪽 눈 더미에서 목도리를 찾아요.', short: '눈 더미에서 목도리 찾기', item: '털목도리', lines: ['눈 더미 속에서 따뜻한 털목도리를 찾았어요!'] },
    ],
    ready: ['내 목도리다! 하나도 안 추워!', '이건 닌자 수련용 구름 신이야. 발이 구름처럼 가벼워져!'],
    reward: { exp: 480, gold: 600, item: 'cloud_shoes' },
  },
  summit: {
    giver: 'climber', title: '정상으로 가는 길', after: 1,
    start: ['나는 산악인 오름. 구름 위 정상까지 가는 길을 지도로 만들고 있어.', '그런데 구름 능선의 아기 용들이 길을 막고 불을 뿜어! 길을 열어 줄래?'],
    steps: [
      { type: 'enter', map: 'sp_ridge', desc: '구름 능선으로 가 봐요.', short: '구름 능선 가기', lines: ['구름 사이로 아기 용들이 날아다녀요. 조심해요!'] },
      { type: 'kill', kind: 'DragonYellow', map: 'sp_ridge', need: 4, desc: '구름 능선의 아기 용 4마리를 물리쳐요.', short: '아기 용 물리치기' },
      { type: 'solve', npc: 'climber', desc: '오름과 함께 산 모양(원뿔)의 부피를 계산해요.', short: '오름과 산 부피 재기',
        lines: ['길이 열렸어! 이제 지도에 산의 크기를 적어야 해.', '산은 원뿔 모양이야. 원뿔의 부피는 원기둥의 3분의 1!'], ask: '산 모양의 부피를 구해요!' },
    ],
    ready: ['지도가 완성됐어! 이제 누구든 정상까지 갈 수 있어.', '이건 내가 정상에서 주운 불꽃 투구야. 빛나는 강화석도 줄게!'],
    reward: { exp: 560, item: 'flame_helm', stones2: 1 },
  },
  ember: {
    giver: 'smith', title: '얼음 불꽃 담금질', after: 1,
    start: ['최고의 갑옷은 얼음 불꽃으로 담금질해야 하지! 얼음 골짜기 얼음 불꽃에게서 조각을 구해 오게.', '그리고 여관 화로도 빌려야 하는데… 온기에게 부탁해 주겠나?'],
    steps: [
      { type: 'collect', kind: 'Flam2', map: 'sp_valley', need: 5, chance: 0.6, item: '얼음 불꽃 조각', desc: '얼음 골짜기의 얼음 불꽃에게서 조각을 모아요.', short: '얼음 불꽃 조각 모으기' },
      { type: 'talk', npc: 'innkeeper', desc: '여관 주인 온기에게 화로를 빌려요.', short: '온기에게 화로 빌리기',
        lines: ['어흥~ 화로? 손님들 몸 녹이는 화로인데… 모험가님 부탁이면 빌려 드려야죠!', '대신 다 쓰면 꼭 돌려주세요. 수프를 끓여야 하거든요.'] },
      { type: 'solve', npc: 'smith', desc: '빙글과 함께 원기둥 화로의 들이를 계산해요.', short: '빙글과 담금질하기',
        lines: ['화로까지! 이제 쇳물이 화로에 얼마나 들어가는지 알아야 하네.', '원기둥 들이 = 밑넓이 × 높이! 계산해 주게!'], ask: '원기둥 화로의 들이를 구해요!' },
    ],
    ready: ['얼음 불꽃으로 담금질한 화산 갑옷일세! 뜨겁고도 단단하지.', '빛나는 강화석도 가져가게. 첨탑이 머지않았어.'],
    reward: { exp: 600, armor: 'volcano', stones2: 2 },
  },
  soup: {
    giver: 'innkeeper', title: '따뜻한 무 수프', after: 1,
    start: ['어흥~ 산을 오르는 손님들께 따뜻한 무 수프를 드리고 싶은데, 무가 꽁꽁 얼어붙은 호수 두더지들 굴에 있대요.', '무를 구해 주시고, 눈송이에게 냄비 크기도 물어봐 주실래요?'],
    steps: [
      { type: 'collect', kind: 'Mole2', map: 'sp_lake', need: 4, chance: 0.6, item: '얼음 무', desc: '얼어붙은 호수의 눈 두더지에게서 얼음 무를 모아요.', short: '얼음 무 모으기' },
      { type: 'solve', npc: 'merchant', desc: '산골 상인 눈송이와 수프 냄비(원기둥)의 들이를 계산해요.', short: '눈송이와 냄비 고르기',
        lines: ['수프 냄비? 이 원기둥 냄비면 딱이야!', '손님 모두에게 한 그릇씩 돌아가는지 들이를 계산해 볼까?'], ask: '냄비의 들이를 구해요!' },
    ],
    ready: ['보글보글~ 따뜻한 무 수프 완성!', '손님들이 몸을 녹이고 힘을 냈대요. 이건 별의 목걸이, 산 위 별을 닮았죠?'],
    reward: { exp: 500, potions: 4, item: 'star_amulet' },
  },
};
