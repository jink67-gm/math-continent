// 장비와 상점 물건
// 무기는 공격력, 갑옷은 방어력·최대 HP를 올려요. 대장장이에게서 +1 ~ +5까지 강화할 수 있어요.
// 강화 한 번마다 무기 공격력 +15%, 갑옷 방어력 +1·HP +6 (재료: 골드).
// 그림: Ninja Adventure Items (CC0)

export const WEAPONS = {
  wood_sword: { name: '나무 검', atk: 0, price: 0, icon: 'items/sword_wood', desc: '처음 받은 연습용 검' },
  iron_sword: { name: '철 검', atk: 5, price: 120, icon: 'items/sword_iron', desc: '튼튼한 철로 만든 검' },
  katana: { name: '바람 검', atk: 10, price: 320, icon: 'items/katana', desc: '바람처럼 가벼운 검' },
  magic_wand: { name: '별빛 지팡이', atk: 9, sp: 15, price: 300, icon: 'items/wand', desc: '최대 SP도 올려 주는 지팡이' },
};

export const ARMORS = {
  cloth: { name: '여행자 옷', def: 0, hp: 0, price: 0, icon: 'items/armor_cloth', desc: '편한 여행자 옷' },
  leather: { name: '가죽 갑옷', def: 3, hp: 20, price: 110, icon: 'items/armor_leather', desc: '가벼운 가죽 갑옷' },
  iron: { name: '철 갑옷', def: 6, hp: 40, price: 300, icon: 'items/armor_iron', desc: '단단한 철 갑옷' },
};

// 상점에서 파는 것 (루루 상점)
export const SHOP = [
  { kind: 'potion', name: '회복약', price: 15, desc: 'HP를 35% 채워 줘요 (Q)' },
  { kind: 'weapon', id: 'iron_sword' },
  { kind: 'armor', id: 'leather' },
  { kind: 'weapon', id: 'magic_wand' },
  { kind: 'weapon', id: 'katana' },
  { kind: 'armor', id: 'iron' },
];

export const MAX_PLUS = 5;
export const upgradeCost = (plus) => 40 + plus * 45;

export function weaponOf(s) { return WEAPONS[s.gear?.weapon] || WEAPONS.wood_sword; }
export function armorOf(s) { return ARMORS[s.gear?.armor] || ARMORS.cloth; }
