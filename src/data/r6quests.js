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

export const R6_SIDE = {
  moles: {
    giver: 'climber', title: '눈 두더지 쫓아내기', type: 'kill', kind: 'Mole2', map: 'sp_slope', need: 6, after: 1,
    desc: '눈꽃 비탈의 눈 두더지 6마리를 물리쳐요.',
    start: ['눈꽃 비탈 두더지들이 등산로를 다 파헤쳐 놨어.', '6마리만 쫓아내 줄래? 북쪽 길이야.'],
    ready: ['이제 등산로가 평평해졌어. 고마워!', '산악인들이 쓰는 회복약이야. 받아!'],
    reward: { exp: 520, potions: 3 },
  },
  embers: {
    giver: 'smith', title: '얼음 불꽃 조각', type: 'collect', kind: 'Flam2', map: 'sp_valley', need: 5, chance: 0.6, item: '얼음 불꽃 조각', after: 1,
    desc: '얼음 골짜기의 얼음 불꽃에게서 조각 5개를 모아요.',
    start: ['얼음 불꽃 조각으로 담금질하면 칼이 아주 단단해지지.', '남쪽 골짜기 얼음 불꽃들이 떨어뜨린다네. 5개만 부탁하네!'],
    ready: ['오오, 차가운데 따뜻한 빛이구먼!', '고맙네. 대장간 금고의 금화와 회복약일세.'],
    reward: { exp: 600, gold: 600, potions: 2 },
  },
  axolots: {
    giver: 'innkeeper', title: '파란 우파루파 달래기', type: 'kill', kind: 'AxolotBlue', map: 'sp_lake', need: 5, after: 1,
    desc: '얼어붙은 호수의 파란 우파루파 5마리를 물리쳐요.',
    start: ['얼어붙은 호수 우파루파들이 얼음낚시를 방해해요.', '5마리만 혼내 주면 정말 고맙겠어요.'],
    ready: ['이제 손님들이 얼음낚시를 즐기겠네요!', '감사의 뜻으로 회복약을 넉넉히 드릴게요.'],
    reward: { exp: 600, potions: 3, gold: 240 },
  },
  scarf: {
    giver: 'child', title: '잃어버린 털목도리', type: 'find', target: 'find_scarf', map: 'sp_ridge', need: 1, item: '털목도리', after: 1,
    desc: '구름 능선 동쪽 눈 더미에서 데굴이의 털목도리를 찾아요.',
    start: ['할머니가 떠 준 털목도리를 잃어버렸어… 능선에서 눈싸움하다가 떨어뜨렸나 봐.', '구름 능선 동쪽 눈 더미 쪽이었어. 찾아 줄래?'],
    ready: ['내 목도리다! 이제 하나도 안 추워!', '이건 내가 모은 용돈이야. 헤헤.'],
    reward: { exp: 460, gold: 600 },
  },
};
