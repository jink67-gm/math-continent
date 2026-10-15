// 가방 창: 착용 장비 5칸 + 아이템 목록 + 선택한 아이템 정보 ([착용] [해제] [사용])

import { OVERLAYS } from '../core/GameState.js';
import { itemIconHTML, itemBadgeHTML } from '../data/itemArt.js';
import { ITEMS, GRADES, SLOTS, SLOT_IDS, STAT_NAMES } from '../data/items.js';
import { INVENTORY_CAP } from '../player/Inventory.js';
import { itemStats } from '../player/EquipmentManager.js';
import { escapeHtml } from '../core/utils.js';

const TABS = [
  { id: 'all', name: '전체' },
  { id: 'equipment', name: '장비' },
  { id: 'consumable', name: '소모품' },
  { id: 'material', name: '재료' },
];

function statText(stats) {
  return Object.entries(stats)
    .filter(([, v]) => v)
    .map(([k, v]) => `${STAT_NAMES[k]} +${k === 'moveSpeed' ? v.toFixed(2) : v}`)
    .join(' · ');
}

export class InventoryUI {
  constructor(game) {
    this.game = game;
    this.tab = 'all';
    this.selected = null; // { where: 'bag'|'equip', uid|slot }
  }

  open(tab = 'all') {
    this.tab = tab === 'equipment' ? 'equipment' : 'all';
    this.selected = null;
    this.modal = this.game.ui.modal('<div class="bag-root"></div>', {
      className: 'modal-bag', overlayType: OVERLAYS.INVENTORY,
      onClose: () => { this.modal = null; },
    });
    this.root = this.modal.el.querySelector('.bag-root');
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.render();
  }

  selectedItem() {
    const s = this.game.save;
    if (!this.selected) return null;
    if (this.selected.where === 'equip') return s.equipment[this.selected.slot];
    return this.game.inventory.find(this.selected.uid);
  }

  render() {
    const g = this.game;
    const s = g.save;
    const t = g.equipment.totals();
    const items = g.inventory.sorted(this.tab);
    const sel = this.selectedItem();
    if (this.selected && !sel) this.selected = null;

    this.root.innerHTML = `
      <div class="menu-head">
        <h3 class="panel-title">🎒 가방 <small class="bag-count">${s.inventory.length} / ${INVENTORY_CAP}</small></h3>
        <div class="bag-gold">🪙 ${s.gold.toLocaleString()}</div>
        <button class="icon-btn" data-close-bag aria-label="닫기">✕</button>
      </div>
      <div class="equip-row">
        ${SLOT_IDS.map((slot) => {
          const inst = s.equipment[slot];
          const def = inst && ITEMS[inst.id];
          const on = this.selected?.where === 'equip' && this.selected.slot === slot;
          return `
            <button class="equip-slot ${def ? `filled g-${def.grade}` : ''} ${on ? 'on' : ''}" data-slot="${slot}" style="--g:${def ? GRADES[def.grade].color : '#cfc8dc'}">
              <span class="slot-icon">${def ? itemIconHTML(inst.id, { size: 40 }) : SLOTS[slot].icon}</span>
              ${inst?.enhance ? `<b class="enh">+${inst.enhance}</b>` : ''}
              <span class="slot-name">${def ? escapeHtml(def.name) : SLOTS[slot].name}</span>
            </button>`;
        }).join('')}
      </div>
      <div class="total-stats">
        <span>⚔️ 공격 <b>${t.attack}</b></span>
        <span>🛡️ 방어 <b>${t.defense}</b></span>
        <span>❤️ HP <b>${Math.floor(s.stats.hp)} / ${t.maxHp}</b></span>
        <span>👟 이동 <b>${t.moveSpeed.toFixed(2)}</b></span>
      </div>
      <div class="bag-tabs" role="tablist">
        ${TABS.map((tb) => `<button role="tab" class="${this.tab === tb.id ? 'on' : ''}" data-tab="${tb.id}">${tb.name}</button>`).join('')}
      </div>
      <div class="bag-body">
        <div class="item-grid">
          ${items.length ? items.map((it) => {
            const def = ITEMS[it.id];
            const on = this.selected?.where === 'bag' && this.selected.uid === it.uid;
            return `
              <button class="item-cell g-${def.grade} ${on ? 'on' : ''}" data-uid="${it.uid}" style="--g:${GRADES[def.grade].color}" title="${escapeHtml(def.name)}">
                <span class="cell-icon">${itemIconHTML(it.id, { size: 40 })}</span>
                ${GRADES[def.grade].order >= 4 ? '<i class="ii-star">★</i>' : ''}
                ${it.qty !== undefined ? `<b class="qty">${it.qty}</b>` : ''}
                ${it.enhance ? `<b class="enh">+${it.enhance}</b>` : ''}
              </button>`;
          }).join('') : '<p class="empty-note">비어 있어요.</p>'}
        </div>
        <div class="item-detail">${this.detailHtml(sel)}</div>
      </div>`;
  }

  detailHtml(inst) {
    if (!inst) return '<p class="empty-note">아이템을 눌러 보세요.</p>';
    const g = this.game;
    const def = ITEMS[inst.id];
    const grade = GRADES[def.grade];
    let stats = '';
    let actions = '';
    if (def.type === 'equipment') {
      const st = itemStats(inst);
      const isEquipped = this.selected.where === 'equip';
      const diff = isEquipped ? null : g.equipment.compare(inst);
      stats = `<ul class="stat-list">${Object.entries(st).map(([k, v]) => {
        const d = diff?.[k];
        const dTxt = d ? `<em class="${d > 0 ? 'up' : 'down'}">(${d > 0 ? '▲' : '▼'}${Math.abs(d)})</em>` : '';
        return `<li>${STAT_NAMES[k]} <b>+${k === 'moveSpeed' ? v.toFixed(2) : v}</b> ${dTxt}</li>`;
      }).join('')}</ul>`;
      if (diff) {
        const lost = Object.entries(diff).filter(([k, v]) => v < 0 && !(k in st));
        if (lost.length) stats += `<p class="lose-note">바꾸면 잃는 능력: ${lost.map(([k, v]) => `${STAT_NAMES[k]} ${v}`).join(', ')}</p>`;
      }
      actions = isEquipped
        ? `<button class="btn btn-ghost btn-small" data-act="unequip">해제하기</button>`
        : `<button class="btn btn-primary btn-small" data-act="equip">착용하기</button>`;
    } else if (def.type === 'consumable') {
      actions = `<button class="btn btn-primary btn-small" data-act="use">사용하기</button>`;
    }
    return `
      <div class="detail-head">${itemBadgeHTML(inst.id, { size: 64, enhance: inst.enhance })}
        <div class="detail-name" style="color:${grade.color}">${escapeHtml(def.name)}${inst.enhance ? ` <span class="enh-tag">+${inst.enhance}</span>` : ''}</div></div>
      <div class="detail-sub"><span class="grade-chip" style="--g:${grade.color}">${grade.name}</span>
        ${def.type === 'equipment' ? SLOTS[def.slot].name : def.type === 'consumable' ? '소모품' : '재료'}
        ${inst.qty !== undefined ? ` · ${inst.qty}개` : ''}
        ${def.type === 'equipment' ? ` · 강화 +${inst.enhance || 0}` : ''}
      </div>
      ${stats}
      <p class="detail-desc">${escapeHtml(def.desc || '')}</p>
      <div class="detail-actions">${actions}</div>`;
  }

  onClick(e) {
    const g = this.game;
    if (e.target.closest('[data-close-bag]')) {
      this.modal.close();
      return;
    }
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      this.tab = tab.dataset.tab;
      this.render();
      return;
    }
    const slot = e.target.closest('[data-slot]');
    if (slot) {
      g.audio.playSfx('select');
      if (g.save.equipment[slot.dataset.slot]) this.selected = { where: 'equip', slot: slot.dataset.slot };
      else {
        this.selected = null;
        this.tab = 'equipment';
      }
      this.render();
      return;
    }
    const cell = e.target.closest('[data-uid]');
    if (cell) {
      g.audio.playSfx('select');
      this.selected = { where: 'bag', uid: cell.dataset.uid };
      this.render();
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const inst = this.selectedItem();
    if (!inst) return;
    if (act === 'equip') {
      const res = g.equipment.equip(inst.uid);
      if (res.ok) {
        g.audio.playSfx('equip');
        this.selected = { where: 'equip', slot: ITEMS[inst.id].slot };
        g.markDirty('equip');
      } else g.ui.toast(res.reason, 'warn');
    } else if (act === 'unequip') {
      const res = g.equipment.unequip(this.selected.slot);
      if (res.ok) {
        g.audio.playSfx('click');
        this.selected = { where: 'bag', uid: inst.uid };
        g.markDirty('equip');
      } else g.ui.toast(res.reason, 'warn');
    } else if (act === 'use') {
      const res = g.inventory.use(inst.uid);
      if (res.ok) {
        g.audio.playSfx('potion');
        g.ui.toast(`❤️ HP ${res.healed} 회복!`, 'ok');
        g.markDirty('use');
      } else g.ui.toast(res.reason, 'warn');
    }
    g.ui.updateHUD();
    this.render();
  }
}
