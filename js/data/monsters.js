import { CONTENT_MONSTERS, CONTENT_BOSSES } from './villageContent.js';

// 몬스터 목록
// behavior: 'hop' 뛰어들기 / 'puff' 주변 포자 폭발 / 'swoop' 날아서 돌진
// tier: normal 일반 / elite 엘리트 (강화 몬스터는 스폰할 때 일정 확률로 생김)
// drops: [{ id, chance(0~1), qty: [최소, 최대] }]

export const MONSTERS = {
  // ---------- 분수 계곡 ----------
  slime: {
    name: '슬라임', sprite: 'slime', color: '#7ee06b', tier: 'normal',
    hp: 30, attack: 6, defense: 0, speed: 55, radius: 16,
    exp: 6, gold: [2, 4],
    aggro: 170, attackRange: 75, windup: 0.45, cooldown: 1.6, behavior: 'hop',
    drops: [
      { id: 'slime_jelly', chance: 0.5 },
      { id: 'potion_s', chance: 0.06 },
      { id: 'cotton_gloves', chance: 0.03 },
      { id: 'straw_shoes', chance: 0.03 },
    ],
  },
  mushroom: {
    name: '버섯 몬스터', sprite: 'mushroom', color: '#ff6b5c', tier: 'normal',
    hp: 45, attack: 8, defense: 1, speed: 45, radius: 17,
    exp: 9, gold: [3, 6],
    aggro: 150, attackRange: 60, windup: 0.6, cooldown: 2.2, behavior: 'puff', puffRadius: 72,
    drops: [
      { id: 'mushroom_spore', chance: 0.6 },
      { id: 'potion_s', chance: 0.08 },
      { id: 'leather_gloves', chance: 0.03 },
      { id: 'leather_armor', chance: 0.02 },
    ],
  },
  bat: {
    name: '분수 박쥐', sprite: 'bat', color: '#9b7bff', tier: 'normal',
    hp: 34, attack: 7, defense: 0, speed: 85, radius: 15, flying: true,
    exp: 8, gold: [2, 5],
    aggro: 220, attackRange: 160, windup: 0.5, cooldown: 2.0, behavior: 'swoop',
    drops: [
      { id: 'bat_wing', chance: 0.5 },
      { id: 'enhance_stone', chance: 0.05 },
      { id: 'leather_boots', chance: 0.02 },
    ],
  },
  bigMushroom: {
    name: '큰 버섯', sprite: 'mushroom', color: '#e8483a', tier: 'elite', scale: 1.75,
    hp: 220, attack: 14, defense: 3, speed: 42, radius: 30,
    exp: 45, gold: [20, 30],
    aggro: 210, attackRange: 85, windup: 0.8, cooldown: 2.4, behavior: 'puff', puffRadius: 115,
    drops: [
      { id: 'mushroom_spore', chance: 1, qty: [2, 4] },
      { id: 'enhance_stone', chance: 0.6 },
      { id: 'potion_m', chance: 0.4 },
      { id: 'iron_sword', chance: 0.15 },
      { id: 'clover_necklace', chance: 0.1 },
    ],
  },

  wildBoar: {
    name: '멧돼지', sprite: 'boar', color: '#b5653a', tier: 'normal',
    hp: 52, attack: 8, defense: 1, speed: 62, radius: 18,
    exp: 10, gold: [3, 6],
    aggro: 210, attackRange: 200, windup: 0.65, cooldown: 2.4, behavior: 'swoop',
    drops: [
      { id: 'slime_jelly', chance: 0.35 },
      { id: 'potion_s', chance: 0.08 },
      { id: 'leather_armor', chance: 0.02 },
    ],
  },

  // ---------- 분수 계곡 동굴 ----------
  rockSlime: {
    name: '바위 슬라임', sprite: 'slime', color: '#8fa9c9', tier: 'normal',
    hp: 58, attack: 10, defense: 2, speed: 55, radius: 17,
    exp: 12, gold: [4, 7],
    aggro: 180, attackRange: 78, windup: 0.42, cooldown: 1.5, behavior: 'hop',
    drops: [
      { id: 'slime_jelly', chance: 0.6 },
      { id: 'enhance_stone', chance: 0.08 },
      { id: 'potion_s', chance: 0.08 },
    ],
  },
  shadowBat: {
    name: '그림자 박쥐', sprite: 'bat', color: '#6b4fb8', tier: 'normal',
    hp: 48, attack: 11, defense: 1, speed: 95, radius: 15, flying: true,
    exp: 13, gold: [4, 7],
    aggro: 240, attackRange: 170, windup: 0.45, cooldown: 1.8, behavior: 'swoop',
    drops: [
      { id: 'bat_wing', chance: 0.6 },
      { id: 'enhance_stone', chance: 0.06 },
      { id: 'leather_boots', chance: 0.03 },
    ],
  },
  caveMushroom: {
    name: '동굴 버섯', sprite: 'mushroom', color: '#c95cf0', tier: 'normal',
    hp: 70, attack: 12, defense: 2, speed: 45, radius: 18,
    exp: 15, gold: [5, 8],
    aggro: 160, attackRange: 62, windup: 0.55, cooldown: 2.0, behavior: 'puff', puffRadius: 80,
    drops: [
      { id: 'mushroom_spore', chance: 0.7 },
      { id: 'potion_s', chance: 0.1 },
      { id: 'leaf_armor', chance: 0.015 },
    ],
  },
};

// ---------- 보스 ----------
// seals: 이 HP 비율이 되면 「수학의 봉인」 발동 (보호막 → 수학 문제 1개 → 정답이면 보호막 파괴)
export const BOSSES = {
  reciprocalTroll: {
    name: '역수 트롤', village: 'fractionValley', color: '#6fbf8f',
    hp: 1100, attack: 17, defense: 4, speed: 75, radius: 46, scale: 1,
    exp: 220, gold: [140, 170],
    seals: [0.66, 0.33],
    drops: [
      { id: 'fraction_ring', chance: 1 },
      { id: 'enhance_stone', chance: 1, qty: [2, 3] },
      { id: 'potion_m', chance: 1, qty: [1, 2] },
    ],
  },
};

Object.assign(MONSTERS, CONTENT_MONSTERS);
Object.assign(BOSSES, CONTENT_BOSSES);

// 강화 몬스터: 스폰할 때 일정 확률로 일반 몬스터가 강해짐
export const STRONG_VARIANT = {
  chance: 0.15,
  prefix: '단단한',
  hp: 1.7,
  attack: 1.3,
  exp: 1.6,
  gold: 1.5,
  dropBonus: 1.5,
};
