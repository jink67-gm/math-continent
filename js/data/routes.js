// 마을과 마을을 잇는 길 (연결 필드) · 워프포인트
// 기존 마을 이름·단원 순서 그대로: 분수 계곡 → 입체 도시 → 소수 항구 → 비례 왕국 → 원형 숲 → 입체 산맥
// - 길은 다음 마을이 열렸을 때(앞 마을 보스 처치, 기존 규칙)만 지나갈 수 있어요.
// - 워프포인트는 마을에 실제로 도착해 직접 활성화해야 월드맵 빠른 이동이 열려요.

export const VILLAGE_CHAIN = [
  { village: 'fractionValley', scene: 'fvVillage', style: 'valley' },
  { village: 'cubeCity', scene: 'cc_village', style: 'cube' },
  { village: 'decimalHarbor', scene: 'dh_village', style: 'harbor' },
  { village: 'ratioKingdom', scene: 'rk_village', style: 'castle' },
  { village: 'circleForest', scene: 'cf_village', style: 'forest' },
  { village: 'solidPeaks', scene: 'sp_village', style: 'snow' },
];

// 마을 쪽 출입구 (모든 마을이 같은 지도 틀이라 좌표가 같아요)
export const VILLAGE_GATES = {
  west: { rect: { x: 0, y: 840, w: 40, h: 120 }, spawn: { x: 120, y: 900 }, marker: { x: 70, y: 860 } },
  east: { rect: { x: 2160, y: 840, w: 40, h: 120 }, spawn: { x: 2070, y: 900 }, marker: { x: 2120, y: 860 } },
  // 소수 항구는 동쪽이 바다라 남쪽 큰길로 나가요
  south: { rect: { x: 1030, y: 1560, w: 140, h: 45 }, spawn: { x: 1100, y: 1480 }, marker: { x: 1100, y: 1530 } },
};

// 워프포인트: 마을 광장 남동쪽 빈터 (출구·건물·NPC와 겹치지 않는 자리)
export const WARP_SPOT = { x: 1340, y: 1390 };
export const WARP_ARRIVE = { x: 1340, y: 1455 };

// 연결 필드 5개 — 다음 마을의 분위기가 점점 나타나도록 (자연 → 목적지 양식)
export const ROUTES = [
  {
    id: 'route_1', from: 'fractionValley', to: 'cubeCity', name: '수정 언덕길', fromStyle: 'valley', toStyle: 'cube',
    ground: 'grass', mobs: ['wildBoar', 'cubeGolem'], exitFrom: 'east',
    flavor: '풀밭 사이로 푸른 수정 조각이 하나둘 보이기 시작해요.',
  },
  {
    id: 'route_2', from: 'cubeCity', to: 'decimalHarbor', name: '바닷바람 해안길', fromStyle: 'cube', toStyle: 'harbor',
    ground: 'grass', mobs: ['cubeGolem', 'dropSlime'], exitFrom: 'east',
    flavor: '짠 바닷바람이 불어오고 갈매기 소리가 들려요.',
  },
  {
    id: 'route_3', from: 'decimalHarbor', to: 'ratioKingdom', name: '왕국 대로', fromStyle: 'harbor', toStyle: 'castle',
    ground: 'grass', mobs: ['dropSlime', 'ratioGoblin'], exitFrom: 'south',
    flavor: '돌로 포장된 넓은 길 끝에 왕국의 깃발이 보여요.',
  },
  {
    id: 'route_4', from: 'ratioKingdom', to: 'circleForest', name: '고목 숲길', fromStyle: 'castle', toStyle: 'forest',
    ground: 'forest', mobs: ['ratioGoblin', 'ringSlime'], exitFrom: 'east',
    flavor: '나무가 점점 크고 빽빽해져요. 동그란 버섯이 원을 그리며 자라 있어요.',
  },
  {
    id: 'route_5', from: 'circleForest', to: 'solidPeaks', name: '눈보라 고개', fromStyle: 'forest', toStyle: 'snow',
    ground: 'snow', mobs: ['ringSlime', 'cylinderGolem'], exitFrom: 'east',
    flavor: '발밑에 눈이 쌓이기 시작했어요. 저 너머에 설산이 보여요.',
  },
];

export const routeFrom = (village) => ROUTES.find((r) => r.from === village);
export const routeTo = (village) => ROUTES.find((r) => r.to === village);
export const chainOf = (village) => VILLAGE_CHAIN.find((c) => c.village === village);

// ⑭ 던전으로 가는 탐험 길: 마을 → (마을 북쪽 계단) → 탐험 필드 → … → 던전 입구
// 뒤쪽 마을일수록 필드가 늘어나 던전까지 가는 길이 길어져요 (1 → 1 → 2 → 2 → 3 → 3)
// entrance: cave 절벽 동굴 / gate 석조 아치 / ruin 무너진 유적 아치
export const TRAILS = {
  fractionValley: {
    prefix: 'fv', village: 'fvVillage', dungeon: 'fvCave', style: 'valley', entrance: 'cave',
    fields: [{ name: '계곡 바위 숲', mobs: ['slime', 'mushroom', 'wildBoar'], flavor: '바위틈 사이로 동굴에서 부는 서늘한 바람이 느껴져요.' }],
  },
  cubeCity: {
    prefix: 'cc', village: 'cc_village', dungeon: 'cc_dungeon', style: 'cube', entrance: 'gate',
    fields: [{ name: '큐브 채석장', mobs: ['cubeGolem', 'blockMimic'], flavor: '네모반듯하게 잘린 돌 블록이 여기저기 쌓여 있어요.' }],
  },
  decimalHarbor: {
    prefix: 'dh', village: 'dh_village', dungeon: 'dh_dungeon', style: 'harbor', entrance: 'cave',
    fields: [
      { name: '갯바위 해안', mobs: ['dropSlime', 'pirateCrab'], flavor: '파도가 갯바위에 부딪혀 하얗게 부서져요.' },
      { name: '썰물 모래톱', mobs: ['pirateCrab', 'inkOctopus'], flavor: '물이 빠진 모래톱 끝에 바닷속 동굴 입구가 드러났어요.' },
    ],
  },
  ratioKingdom: {
    prefix: 'rk', village: 'rk_village', dungeon: 'rk_dungeon', style: 'castle', entrance: 'gate',
    fields: [
      { name: '왕실 사냥터', mobs: ['ratioGoblin', 'goblinArcher'], flavor: '왕실 기사들이 훈련하던 넓은 사냥터예요.' },
      { name: '무너진 성벽 길', mobs: ['scaleGolem', 'knightMob'], flavor: '옛 성벽을 따라가면 지하 감옥 입구가 나와요.' },
    ],
  },
  circleForest: {
    prefix: 'cf', village: 'cf_village', dungeon: 'cf_dungeon', style: 'forest', entrance: 'ruin',
    fields: [
      { name: '이끼 오솔길', mobs: ['ringSlime', 'leafSprite'], flavor: '이끼 낀 오솔길이 숲 깊은 곳으로 이어져요.' },
      { name: '버섯 고리 숲', mobs: ['wheelMob', 'ringSlime'], flavor: '버섯이 동그랗게 원을 그리며 자라 있어요.' },
      { name: '고대 유적 숲', mobs: ['roundGolem', 'leafSprite'], flavor: '나무 사이로 둥근 돌기둥 유적이 보이기 시작해요.' },
    ],
  },
  solidPeaks: {
    prefix: 'sp', village: 'sp_village', dungeon: 'sp_dungeon', style: 'snow', entrance: 'cave',
    fields: [
      { name: '얼음 계곡', mobs: ['cylinderGolem', 'sphereSpirit'], flavor: '얼어붙은 계곡물 위로 찬바람이 불어요.' },
      { name: '눈보라 능선', mobs: ['sphereSpirit', 'coneWizard'], flavor: '눈보라 너머로 반짝이는 수정 빙벽이 보여요.' },
      { name: '수정 빙벽', mobs: ['coneWizard', 'cylinderGolem'], flavor: '빙벽 아래에 수정 탑으로 들어가는 얼음 동굴이 있어요.' },
    ],
  },
};
export const trailSceneId = (prefix, i) => `${prefix}_trail${i + 1}`;
export const trailOf = (village) => TRAILS[village];
// 마을 북쪽 계단에서 첫 탐험 필드로 · 던전 입구에서 마지막 필드로 돌아올 때 위치
export const TRAIL_SIZE = { w: 1600, h: 2000 };
export const TRAIL_BOTTOM_SPAWN = { x: 800, y: 1890 };
export const TRAIL_TOP_SPAWN = { x: 800, y: 250 };
export const TRAIL_ENTRANCE_SPAWN = { x: 800, y: 420 };
export const VILLAGE_NORTH_SPAWN = { x: 1100, y: 305 };
