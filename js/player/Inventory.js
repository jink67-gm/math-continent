// 가방(인벤토리)
// 저장 모양:
//   장비: { uid, id, enhance }
//   소모품·재료: { uid, id, qty }  (같은 종류는 한 칸에 쌓임)

import { ITEMS, GRADES, isStackable } from '../data/items.js';

export const INVENTORY_CAP = 40;
const TYPE_ORDER = { equipment: 0, consumable: 1, material: 2 };

export class Inventory {
  constructor(game) {
    this.game = game;
  }

  get save() {
    return this.game.save;
  }

  get items() {
    return this.save.inventory;
  }

  newUid() {
    const s = this.save;
    s.itemSeq = (s.itemSeq || 0) + 1;
    return `i${Date.now().toString(36)}${s.itemSeq}`;
  }

  isFull() {
    return this.items.length >= INVENTORY_CAP;
  }

  find(uid) {
    return this.items.find((i) => i.uid === uid);
  }

  count(id) {
    return this.items.filter((i) => i.id === id).reduce((n, i) => n + (i.qty || 1), 0);
  }

  // 아이템 넣기 → 실제로 넣은 개수 (가방이 가득 차면 0)
  add(id, qty = 1, { enhance = 0 } = {}) {
    const def = ITEMS[id];
    if (!def || qty <= 0) return 0;
    let added = 0;
    if (isStackable(id)) {
      let stack = this.items.find((i) => i.id === id);
      if (!stack) {
        if (this.isFull()) return 0;
        stack = { uid: this.newUid(), id, qty: 0 };
        this.items.push(stack);
      }
      stack.qty += qty;
      added = qty;
    } else {
      for (let i = 0; i < qty && !this.isFull(); i++) {
        this.items.push({ uid: this.newUid(), id, enhance });
        added += 1;
      }
      if (added) {
        const c = this.save.counters;
        c.bestGrade = Math.max(c.bestGrade || 1, GRADES[def.grade].order);
      }
    }
    if (added) this.game.bus.emit('item:gained', { id, qty: added });
    return added;
  }

  remove(uid, qty = 1) {
    const idx = this.items.findIndex((i) => i.uid === uid);
    if (idx < 0) return false;
    const it = this.items[idx];
    if (it.qty !== undefined) {
      it.qty -= qty;
      if (it.qty <= 0) this.items.splice(idx, 1);
    } else {
      this.items.splice(idx, 1);
    }
    return true;
  }

  removeById(id, qty = 1) {
    if (this.count(id) < qty) return false;
    let left = qty;
    for (const it of [...this.items]) {
      if (it.id !== id || left <= 0) continue;
      const take = Math.min(left, it.qty || 1);
      this.remove(it.uid, take);
      left -= take;
    }
    return true;
  }

  // 소모품 사용
  use(uid) {
    const it = this.find(uid);
    const def = it && ITEMS[it.id];
    if (!def || def.type !== 'consumable') return { ok: false, reason: '사용할 수 없는 아이템이에요.' };
    if (def.heal) {
      const max = this.game.equipment.totals().maxHp;
      const st = this.save.stats;
      if (st.hp >= max) return { ok: false, reason: 'HP가 이미 가득 차 있어요.' };
      const before = st.hp;
      st.hp = Math.min(max, st.hp + def.heal);
      this.remove(uid, 1);
      return { ok: true, healed: st.hp - before, name: def.name };
    }
    return { ok: false, reason: '사용할 수 없는 아이템이에요.' };
  }

  // 빠른 회복약: 모자란 HP를 채울 수 있는 가장 작은 약 (없으면 가장 큰 약)
  quickPotionUid() {
    const order = ['potion_s', 'potion_m', 'potion_l'];
    const have = order.map((id) => this.items.find((i) => i.id === id)).filter(Boolean);
    if (!have.length) return null;
    const missing = this.game.equipment.totals().maxHp - this.save.stats.hp;
    const fit = have.find((it) => ITEMS[it.id].heal >= missing);
    return (fit || have[have.length - 1]).uid;
  }

  potionCount() {
    return this.count('potion_s') + this.count('potion_m') + this.count('potion_l');
  }

  sorted(filter = 'all') {
    return this.items
      .filter((i) => filter === 'all' || ITEMS[i.id]?.type === filter)
      .sort((a, b) => {
        const da = ITEMS[a.id];
        const db = ITEMS[b.id];
        return (TYPE_ORDER[da.type] - TYPE_ORDER[db.type])
          || (GRADES[db.grade].order - GRADES[da.grade].order)
          || da.name.localeCompare(db.name, 'ko');
      });
  }
}
