// 장비 · 강화석 · 상점 물건
//
// 장비 자리 5곳: 무기 · 머리 · 몸 · 발 · 장신구 (가방에서 자리마다 하나씩 껴요)
//   무기: 공격력 (마법책·지팡이는 스킬 피해 mag도) · 머리/몸: 방어력·HP · 발: 방어력·이동 속도 · 장신구: 치명타·SP·스킬 피해
//   tier(1~6): 몇 번 지역 상점부터 파는지. 높은 지역일수록 좋은 장비가 나와요.
// 강화: 대장장이에게 골드 + 강화석을 내고 +1 ~ +10. 단계가 높을수록 성공 확률이 낮아요.
//   강화 전에 수학 문제를 풀면 확률이 올라가요 (문제 하나에 +15%, 두 개까지).
//   실패해도 장비 단계는 내려가지 않고, 다음 도전 확률이 조금 올라가요.
// 그림: 무기는 Ninja Adventure Items (CC0), 방어구·장신구는 기존 아이콘에 색만 바꿔 단계를 나타내요.

const W = (img) => ({ icon: `na/items/${img}.png`, hand: `hand/${img}` });

export const WEAPONS = {
  wood_sword: { name: '수련용 환도', tier: 1, atk: 0, price: 0, ...W('Hwando'), desc: '조선의 칼 「환도」를 본뜬 수련용 검' },
  oak_club: { name: '참나무 몽둥이', tier: 1, atk: 4, price: 70, ...W('Club'), desc: '단단한 참나무로 깎은 몽둥이' },
  iron_sword: { name: '든든한 대검', tier: 1, atk: 7, price: 150, ...W('BigSword'), desc: '묵직하고 튼튼한 검' },
  old_book: { name: '낡은 마법책', tier: 1, atk: 3, sp: 10, mag: 10, price: 130, ...W('Book'), desc: '스킬 피해 +10% · 최대 SP +10' },
  rapier: { name: '은빛 세검', tier: 2, atk: 12, crit: 5, price: 380, ...W('Rapier'), desc: '가볍고 날카로워 치명타가 잘 나요' },
  magic_wand: { name: '별빛 지팡이', tier: 2, atk: 10, sp: 15, mag: 15, price: 360, ...W('MagicWand'), desc: '스킬 피해 +15% · 최대 SP +15' },
  sai: { name: '쌍갈래 차', tier: 3, atk: 18, crit: 8, price: 760, ...W('Sai'), desc: '항구 경비대의 쌍갈래 무기' },
  katana: { name: '바람 검', tier: 3, atk: 20, price: 820, ...W('Katana'), desc: '바람처럼 가벼운 검' },
  lance: { name: '파도 창', tier: 4, atk: 28, sp: 10, price: 1500, ...W('Lance'), desc: '왕국 기사단의 긴 창' },
  ninjaku: { name: '달빛 직도', tier: 4, atk: 30, crit: 6, price: 1600, ...W('Ninjaku'), desc: '곧게 뻗은 짧은 칼' },
  hammer: { name: '천칭 망치', tier: 5, atk: 40, price: 2600, ...W('Hammer'), desc: '한 번에 크게 내려치는 망치' },
  axe: { name: '숲지기 도끼', tier: 5, atk: 42, crit: 4, price: 2700, ...W('Axe'), desc: '숲지기가 쓰던 도끼' },
  lance2: { name: '별똥 창', tier: 6, atk: 54, crit: 5, sp: 15, price: 4200, ...W('Lance2'), desc: '별빛이 깃든 창' },
  hero_sword: { name: '영웅의 검', tier: 6, atk: 60, mag: 10, price: 4800, ...W('Sword'), desc: '예언 속 모험가의 검' },
};

// 방어구·장신구: 자리마다 6단계
const ICON = {
  head: 'items/armor/helmet.webp', body: 'items/armor/armor_plate.webp', feet: 'items/armor/boots_leather.webp',
};
const ACC_ICON = ['items/accessories/clover.webp', 'items/accessories/ring_sapphire.webp', 'items/accessories/amulet_amethyst.webp',
  'items/accessories/orb_blue.webp', 'items/accessories/clover.webp', 'items/accessories/amulet_amethyst.webp'];
// 단계마다 아이콘 색 (CSS hue-rotate 각도)
const HUE = [0, 180, 200, 40, 90, 320];
const PRICE = [100, 300, 700, 1400, 2400, 3800];

function gearSet(slot, names, stats, priceK) {
  const out = {};
  names.forEach(([id, name], i) => {
    out[id] = { slot, name, tier: i + 1, ...stats(i), price: Math.round(PRICE[i] * priceK / 10) * 10, icon: slot === 'acc' ? ACC_ICON[i] : ICON[slot], hue: slot === 'acc' && i < 4 ? 0 : HUE[i] };
  });
  return out;
}

export const ARMORS = {
  cloth: { slot: 'body', name: '여행자 옷', tier: 1, def: 0, hp: 0, price: 0, icon: 'items/armor/armor_plate.webp', hue: 60, desc: '편한 여행자 옷' },
  ...gearSet('body', [['leather', '가죽 갑옷'], ['iron', '철 갑옷'], ['scale', '비늘 갑옷'], ['royal', '왕실 갑옷'], ['grove', '숲지기 갑옷'], ['volcano', '화산 갑옷']],
    (i) => ({ def: [3, 6, 10, 15, 21, 28][i], hp: [20, 40, 65, 95, 130, 170][i] }), 1.2),
  ...gearSet('head', [['cap', '가죽 모자'], ['helm', '철 투구'], ['coral_helm', '산호 투구'], ['knight_helm', '기사 투구'], ['leaf_crown', '잎새 관'], ['flame_helm', '불꽃 투구']],
    (i) => ({ def: [1, 3, 5, 8, 11, 15][i], hp: [8, 16, 26, 38, 52, 70][i] }), 0.8),
  ...gearSet('feet', [['shoes', '가죽 신발'], ['boots', '철 장화'], ['wader', '물새 장화'], ['knight_boots', '기사 장화'], ['wind_shoes', '바람 신'], ['cloud_shoes', '구름 신']],
    (i) => ({ def: [1, 2, 4, 6, 9, 12][i], speed: [3, 4, 5, 6, 8, 10][i] }), 0.7),
  ...gearSet('acc', [['clover', '네잎 클로버'], ['ring', '사파이어 반지'], ['amulet', '자수정 목걸이'], ['orb', '파란 구슬'], ['gold_clover', '황금 클로버'], ['star_amulet', '별의 목걸이']],
    (i) => [{ crit: 3, hp: 10 }, { sp: 15, mag: 5 }, { crit: 5, hp: 30 }, { mag: 12, sp: 25 }, { crit: 8, hp: 60 }, { crit: 10, mag: 15, hp: 80 }][i], 1.0),
};
// 단계별 설명 (자동)
for (const d of Object.values(ARMORS)) d.desc ??= `${d.tier}단계 ${SLOT_NAME_OF(d.slot)}`;
function SLOT_NAME_OF(slot) { return { head: '머리 장비', body: '몸 장비', feet: '발 장비', acc: '장신구' }[slot]; }

export const SLOTS = ['weapon', 'head', 'body', 'feet', 'acc'];
export const SLOT_NAMES = { weapon: '무기', head: '머리', body: '몸', feet: '발', acc: '장신구' };

export function itemDef(id) { return WEAPONS[id] || ARMORS[id] || null; }
export function slotOf(id) { return WEAPONS[id] ? 'weapon' : ARMORS[id]?.slot || null; }

// ── 강화 ───────────────────────────────────────
export const MAX_PLUS = 10;
// 다음 단계(+1 ~ +10)로 갈 때 성공 확률(%)
export const ENHANCE_RATE = [95, 90, 80, 70, 60, 50, 42, 35, 28, 22];
export const MATH_BONUS = 15; // 문제 하나 맞힐 때마다 +15%
export const MATH_MAX = 2;    // 문제는 두 개까지
// 필요한 재료: +1~+5는 강화석, +6~+10은 빛나는 강화석
export function enhanceCost(def, plus) {
  const tier = def?.tier || 1;
  const gold = Math.round((30 + plus * 25) * tier);
  if (plus < 5) return { gold, stones: plus < 3 ? 1 : 2, stones2: 0 };
  return { gold, stones: 0, stones2: plus < 8 ? 1 : 2 };
}
// 강화 효과: 무기 공격력 +8%씩 · 방어구 방어력 +1, HP +5씩 · 장신구 치명타 +0.5%·HP +5씩
export function plusBonus(def, plus) {
  if (!plus || !def) return {};
  if (!def.slot) return { atkPct: 0.08 * plus };
  if (def.slot === 'acc') return { crit: 0.5 * plus, hp: 5 * plus };
  return { def: plus, hp: 5 * plus };
}

// ── 상점 (지역마다 그 지역 단계까지의 물건) ─────────────
export const STONE = { name: '강화석', icon: 'items/materials/ore_stone.webp', price: 80, desc: '+1~+5 강화에 써요' };
export const STONE2 = { name: '빛나는 강화석', icon: 'items/materials/crystal_blue.webp', price: 450, desc: '+6~+10 강화에 써요 (4번 지역부터)' };
export const POTION = { name: '회복약', icon: 'items/consumables/potion_red.webp', price: 15, desc: 'HP를 35% 채워 줘요 (Q)' };

export function shopList(tier) {
  const list = [{ kind: 'potion' }, { kind: 'stone' }];
  if (tier >= 4) list.push({ kind: 'stone2' });
  for (const [id, d] of Object.entries(WEAPONS)) if (d.price && d.tier <= tier && d.tier >= tier - 1) list.push({ kind: 'gear', id });
  for (const [id, d] of Object.entries(ARMORS)) if (d.price && d.tier <= tier && d.tier >= tier - 1) list.push({ kind: 'gear', id });
  return list;
}

// ── 지금 낀 장비 ───────────────────────────────────
export function weaponOf(s) { return WEAPONS[s.gear?.weapon] || WEAPONS.wood_sword; }
export function armorOf(s) { return ARMORS[s.gear?.body] || ARMORS.cloth; }
export function plusOf(s, id) { return s.plus?.[id] || 0; }

// 예전 저장 기록(무기·갑옷 두 칸)을 다섯 칸으로 옮겨요
export function normalizeGear(s) {
  const g = s.gear || {};
  s.plus ??= {};
  if ('armor' in g || 'wPlus' in g) {
    if (g.plus) for (const [k, v] of Object.entries(g.plus)) s.plus[k.replace(/^a_/, '')] = Math.max(s.plus[k.replace(/^a_/, '')] || 0, v || 0);
    if (g.weapon) s.plus[g.weapon] = Math.max(s.plus[g.weapon] || 0, g.wPlus || 0);
    if (g.armor) s.plus[g.armor] = Math.max(s.plus[g.armor] || 0, g.aPlus || 0);
    s.gear = { weapon: g.weapon || 'wood_sword', body: g.armor || 'cloth' };
  }
  s.gear ??= {};
  s.gear.weapon ??= 'wood_sword';
  s.gear.body ??= 'cloth';
  const bag = s.bag || {};
  if (bag.weapons || bag.armors) {
    s.bag = { weapon: [...(bag.weapons || [])], head: [], body: [...(bag.armors || [])], feet: [], acc: [] };
  }
  s.bag ??= {};
  for (const slot of SLOTS) s.bag[slot] ??= [];
  for (const slot of SLOTS) {
    const id = s.gear[slot];
    if (id && !s.bag[slot].includes(id)) s.bag[slot].push(id);
    s.bag[slot] = s.bag[slot].filter((x) => itemDef(x) && slotOf(x) === slot);
  }
  if (!s.bag.weapon.length) s.bag.weapon.push('wood_sword');
  if (!s.bag.body.length) s.bag.body.push('cloth');
  for (const [k, v] of Object.entries(s.plus)) s.plus[k] = Math.max(0, Math.min(MAX_PLUS, Math.floor(v || 0)));
  s.stones ??= 0;
  s.stones2 ??= 0;
  s.pity ??= {};
  return s;
}

// 장비를 가방에 넣어요 (이미 있으면 그대로). 넣었으면 true
export function giveItem(s, id) {
  const slot = slotOf(id);
  if (!slot) return false;
  if (s.bag[slot].includes(id)) return false;
  s.bag[slot].push(id);
  return true;
}
