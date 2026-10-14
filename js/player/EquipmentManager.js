// 장비 착용·해제, 능력치 합산, 강화
// 최종 능력치 = 기본 능력치(레벨·보너스) + 착용 장비(강화 포함)

import { ITEMS, SLOT_IDS } from '../data/items.js';
import { VILLAGE_MATERIALS } from '../data/villageContent.js';

// 장비 하나의 능력치 (강화 단계 포함)
export function itemStats(inst) {
  const def = ITEMS[inst.id];
  if (!def) return {};
  const out = { ...(def.stats || {}) };
  const lv = inst.enhance || 0;
  for (const [k, v] of Object.entries(def.enhance || {})) out[k] = (out[k] || 0) + v * lv;
  return out;
}

export const MAX_ENHANCE = 10;

export class EquipmentManager {
  constructor(game) {
    this.game = game;
  }

  get save() {
    return this.game.save;
  }

  totals() {
    const s = this.save;
    const t = {
      maxHp: s.stats.maxHp,
      attack: s.stats.attack,
      defense: s.stats.defense,
      moveSpeed: s.stats.moveSpeed,
    };
    for (const slot of SLOT_IDS) {
      const inst = s.equipment[slot];
      if (!inst) continue;
      for (const [k, v] of Object.entries(itemStats(inst))) t[k] = (t[k] || 0) + v;
    }
    t.moveSpeed = Math.round(t.moveSpeed * 100) / 100;
    return t;
  }

  clampHp() {
    const max = this.totals().maxHp;
    this.save.stats.hp = Math.max(0, Math.min(this.save.stats.hp, max));
  }

  equip(uid) {
    const inv = this.game.inventory;
    const inst = inv.find(uid);
    const def = inst && ITEMS[inst.id];
    if (!def || def.type !== 'equipment') return { ok: false, reason: '장비가 아니에요.' };
    const slot = def.slot;
    const prev = this.save.equipment[slot];
    inv.items.splice(inv.items.indexOf(inst), 1);
    this.save.equipment[slot] = inst;
    if (prev) inv.items.push(prev);
    this.clampHp();
    this.game.bus.emit('equip:changed', { slot, inst, prev });
    return { ok: true, prev };
  }

  unequip(slot) {
    const inv = this.game.inventory;
    const inst = this.save.equipment[slot];
    if (!inst) return { ok: false, reason: '착용한 장비가 없어요.' };
    if (inv.isFull()) return { ok: false, reason: '가방이 가득 찼어요.' };
    inv.items.push(inst);
    this.save.equipment[slot] = null;
    this.clampHp();
    this.game.bus.emit('equip:changed', { slot, inst: null, prev: inst });
    return { ok: true };
  }

  // 같은 부위에 착용 중인 장비와 비교한 차이
  compare(inst) {
    const def = ITEMS[inst.id];
    const cur = this.save.equipment[def.slot];
    const a = itemStats(inst);
    const b = cur ? itemStats(cur) : {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const diff = {};
    for (const k of keys) diff[k] = Math.round(((a[k] || 0) - (b[k] || 0)) * 100) / 100;
    return diff;
  }

  // 강화 비용: 골드 + 재료 (강화 단계가 오를수록 비싸져요)
  enhanceCost(inst) {
    // 재료는 지금 있는 마을의 재료를 써요 (분수 계곡: 슬라임 젤리·버섯 포자)
    const lv = inst.enhance || 0;
    const [common, rare] = VILLAGE_MATERIALS[this.save.currentVillage] || VILLAGE_MATERIALS.fractionValley;
    const gold = 15 + lv * 20;
    let mats;
    if (lv < 2) mats = [[common, 2 + lv]];
    else if (lv < 4) mats = [[common, 2], [rare, 2]];
    else if (lv < 6) mats = [[rare, 2], ['enhance_stone', 1]];
    else mats = [[rare, 3], ['enhance_stone', lv - 4]];
    return { gold, mats };
  }

  canAfford(cost) {
    const inv = this.game.inventory;
    return this.save.gold >= cost.gold && cost.mats.every(([id, n]) => inv.count(id) >= n);
  }

  payCost(cost) {
    this.save.gold -= cost.gold;
    for (const [id, n] of cost.mats) this.game.inventory.removeById(id, n);
  }

  // 강화 +1 (재료 확인·수학 문제는 대장간 창에서 처리한 뒤 호출)
  enhance(inst) {
    if ((inst.enhance || 0) >= MAX_ENHANCE) return false;
    inst.enhance = (inst.enhance || 0) + 1;
    const c = this.save.counters;
    c.bestEnhance = Math.max(c.bestEnhance || 0, inst.enhance);
    this.game.bus.emit('equip:enhanced', { inst });
    return true;
  }

  // 처음 시작할 때 주는 기본 장비
  giveStarterKit() {
    const s = this.save;
    if (s.starterKitGiven) return;
    const inv = this.game.inventory;
    if (!s.equipment.weapon) s.equipment.weapon = { uid: inv.newUid(), id: 'wood_sword', enhance: 0 };
    if (!s.equipment.armor) s.equipment.armor = { uid: inv.newUid(), id: 'cloth_armor', enhance: 0 };
    inv.add('potion_s', 3);
    s.starterKitGiven = true;
    s.stats.hp = this.totals().maxHp;
  }
}
