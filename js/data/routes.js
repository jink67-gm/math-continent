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
