import { CONTENT_ITEMS, CONTENT_PRICES } from './villageContent.js';

// 아이템 목록
// type: 'equipment' | 'consumable' | 'material'
// 장비 stats: attack 공격력, defense 방어력, maxHp 최대 HP, moveSpeed 이동속도
// enhance: 강화 +1마다 오르는 능력치

export const GRADES = {
  common: { name: '일반', color: '#8f98ab', order: 1 },
  uncommon: { name: '고급', color: '#3fb950', order: 2 },
  rare: { name: '희귀', color: '#3d8bff', order: 3 },
  epic: { name: '영웅', color: '#a65cff', order: 4 },
  legendary: { name: '전설', color: '#ff9a1f', order: 5 },
};

export const SLOTS = {
  weapon: { name: '무기', icon: '⚔️' },
  armor: { name: '갑옷', icon: '👕' },
  gloves: { name: '장갑', icon: '🧤' },
  boots: { name: '신발', icon: '👢' },
  accessory: { name: '장신구', icon: '💍' },
};
export const SLOT_IDS = Object.keys(SLOTS);

export const STAT_NAMES = {
  attack: '공격력',
  defense: '방어력',
  maxHp: '최대 HP',
  moveSpeed: '이동속도',
};

export const ITEMS = {
  // ---------- 무기 ----------
  wood_sword: {
    name: '나무 검', type: 'equipment', slot: 'weapon', grade: 'common', icon: '🗡️',
    stats: { attack: 3 }, enhance: { attack: 1 },
    desc: '모험가의 첫 검. 가볍고 튼튼해요.',
  },
  iron_sword: {
    name: '철검', type: 'equipment', slot: 'weapon', grade: 'uncommon', icon: '⚔️',
    stats: { attack: 7 }, enhance: { attack: 2 },
    desc: '대장간에서 두드려 만든 믿음직한 검.',
  },
  wind_sword: {
    name: '바람의 검', type: 'equipment', slot: 'weapon', grade: 'rare', icon: '🌬️',
    stats: { attack: 12, moveSpeed: 0.2 }, enhance: { attack: 3 },
    desc: '계곡 바람을 담은 검. 들고 있으면 발이 가벼워요.',
  },
  // ---------- 갑옷 ----------
  cloth_armor: {
    name: '천 옷', type: 'equipment', slot: 'armor', grade: 'common', icon: '👕',
    stats: { defense: 1, maxHp: 5 }, enhance: { defense: 1 },
    desc: '포근한 여행용 옷.',
  },
  leather_armor: {
    name: '가죽 갑옷', type: 'equipment', slot: 'armor', grade: 'uncommon', icon: '🦺',
    stats: { defense: 3, maxHp: 15 }, enhance: { defense: 1, maxHp: 5 },
    desc: '질긴 가죽으로 만든 갑옷.',
  },
  leaf_armor: {
    name: '풀잎 갑옷', type: 'equipment', slot: 'armor', grade: 'rare', icon: '🌿',
    stats: { defense: 5, maxHp: 30 }, enhance: { defense: 2, maxHp: 5 },
    desc: '계곡의 풀잎을 엮은 신비한 갑옷.',
  },
  // ---------- 장갑 ----------
  cotton_gloves: {
    name: '면장갑', type: 'equipment', slot: 'gloves', grade: 'common', icon: '🧤',
    stats: { attack: 1 }, enhance: { attack: 1 },
    desc: '손이 미끄러지지 않아요.',
  },
  leather_gloves: {
    name: '가죽 장갑', type: 'equipment', slot: 'gloves', grade: 'uncommon', icon: '🥊',
    stats: { attack: 2, defense: 1 }, enhance: { attack: 1 },
    desc: '검을 단단히 쥘 수 있어요.',
  },
  // ---------- 신발 ----------
  straw_shoes: {
    name: '짚신', type: 'equipment', slot: 'boots', grade: 'common', icon: '🩴',
    stats: { moveSpeed: 0.1 }, enhance: { defense: 1 },
    desc: '가볍게 걸을 수 있는 짚신.',
  },
  leather_boots: {
    name: '가죽 장화', type: 'equipment', slot: 'boots', grade: 'uncommon', icon: '👢',
    stats: { moveSpeed: 0.25, defense: 1 }, enhance: { defense: 1 },
    desc: '진흙길도 거뜬해요.',
  },
  // ---------- 장신구 ----------
  clover_necklace: {
    name: '네잎클로버 목걸이', type: 'equipment', slot: 'accessory', grade: 'rare', icon: '🍀',
    stats: { maxHp: 20, attack: 2 }, enhance: { maxHp: 5 },
    desc: '행운이 깃든 목걸이.',
  },
  fraction_ring: {
    name: '분수 반지', type: 'equipment', slot: 'accessory', grade: 'epic', icon: '💍',
    stats: { attack: 5, defense: 3, maxHp: 30 }, enhance: { attack: 1, defense: 1 },
    desc: '분수의 결정 조각이 박힌 반지.',
  },

  // ---------- 소모품 ----------
  potion_s: {
    name: '작은 회복약', type: 'consumable', grade: 'common', icon: '🧪', heal: 40,
    desc: 'HP를 40 회복해요.',
  },
  potion_m: {
    name: '회복약', type: 'consumable', grade: 'uncommon', icon: '🍶', heal: 100,
    desc: 'HP를 100 회복해요.',
  },
  bread: {
    name: '갓 구운 빵', type: 'consumable', grade: 'common', icon: '🍞', heal: 60,
    desc: '고소한 빵. HP를 60 회복해요. (가방에서 먹어요)',
  },
  roast_meat: {
    name: '구운 고기', type: 'consumable', grade: 'uncommon', icon: '🍖', heal: 160,
    desc: '든든한 고기. HP를 160 회복해요. (가방에서 먹어요)',
  },

  // ---------- 재료 ----------
  slime_jelly: { name: '슬라임 젤리', type: 'material', grade: 'common', icon: '🟢', desc: '말랑말랑한 젤리. 대장장이가 강화 재료로 써요.' },
  mushroom_spore: { name: '버섯 포자', type: 'material', grade: 'common', icon: '🍄', desc: '반짝이는 포자 가루.' },
  bat_wing: { name: '박쥐 날개', type: 'material', grade: 'common', icon: '🦇', desc: '얇고 가벼운 날개.' },
  enhance_stone: { name: '강화석', type: 'material', grade: 'uncommon', icon: '💠', desc: '장비를 강화할 때 쓰는 빛나는 돌.' },
};

export const getItem = (id) => ITEMS[id];
export const isStackable = (id) => ITEMS[id] && ITEMS[id].type !== 'equipment';

// 가격 (상점에서 살 때). 팔 때는 40%를 받아요.
export const PRICES = {
  wood_sword: 20, iron_sword: 120, wind_sword: 400,
  cloth_armor: 15, leather_armor: 110, leaf_armor: 380,
  cotton_gloves: 25, leather_gloves: 90,
  straw_shoes: 20, leather_boots: 100,
  clover_necklace: 300, fraction_ring: 800,
  potion_s: 20, potion_m: 55, bread: 28, roast_meat: 75,
  slime_jelly: 6, mushroom_spore: 8, bat_wing: 8, enhance_stone: 40,
};
Object.assign(ITEMS, CONTENT_ITEMS);
Object.assign(PRICES, CONTENT_PRICES);
export const SELL_RATE = 0.4;
export const sellPrice = (id) => Math.max(1, Math.floor((PRICES[id] || 2) * SELL_RATE));
