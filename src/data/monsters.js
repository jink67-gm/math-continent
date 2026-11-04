// 필드 몬스터 (Ninja Adventure, CC0) — 아이들이 보기에 무섭지 않은 것만 골랐어요.
// 쓰러뜨리면 죽는 게 아니라 연기와 함께 「정화」되어 사라져요.
// move: 'hop' 통통 튀며 다가옴 · 'walk' 걸어옴 · 'flutter' 팔랑팔랑 · 'float' 둥둥 떠서 멀리서 구슬을 던짐
// reach: 공격을 시작하는 거리 · lunge: 덮치는 거리

export const MONSTERS = {
  Slime: { name: '말랑 슬라임', hp: 30, atk: 8, def: 0, speed: 30, sight: 80, reach: 22, lunge: 34, exp: 6, gold: [2, 4], move: 'hop' },
  Mushroom: { name: '졸린 버섯', hp: 46, atk: 10, def: 1, speed: 20, sight: 70, reach: 18, lunge: 22, exp: 9, gold: [3, 5], move: 'walk' },
  Butterfly: { name: '장난꾸러기 나비', hp: 26, atk: 7, def: 0, speed: 44, sight: 95, reach: 20, lunge: 30, exp: 8, gold: [2, 5], move: 'flutter', fly: true },
  Spirit: { name: '길 잃은 정령', hp: 38, atk: 11, def: 1, speed: 24, sight: 110, reach: 70, lunge: 0, exp: 11, gold: [3, 6], move: 'float', fly: true, ranged: true },
  Flam: { name: '심술 불꽃', hp: 58, atk: 13, def: 2, speed: 34, sight: 90, reach: 22, lunge: 36, exp: 14, gold: [4, 8], move: 'walk' },
};

export const MONSTER_KEYS = Object.keys(MONSTERS);
