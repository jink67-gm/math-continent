// 대장간 창: 장비 고르기 → 강화 비용 확인 → [강화하기] → 수학 문제 → 정답이면 +1
// 오답이면 재료·골드가 줄어들지 않아요. (5초 뒤 다시 도전)
import { OVERLAYS } from '../core/GameState.js';
import { itemBadgeHTML, itemIconHTML } from '../data/itemArt.js';
import { ITEMS, GRADES, SLOTS, SLOT_IDS, STAT_NAMES } from '../data/items.js';
import { itemStats, MAX_ENHANCE } from '../player/EquipmentManager.js';
import { escapeHtml } from '../core/utils.js';

export class ForgeUI {
  constructor(game) {
    this.game = game;
    this.selected = null;
  }

  open() {
    this.modal = this.game.ui.modal('<div class="forge-root"></div>', { className: 'modal-forge', overlayType: OVERLAYS.SHOP });
    this.root = this.modal.el.querySelector('.forge-root');
    this.root.addEventListener('click', (e) => this.onClick(e));
    const w = this.game.save.equipment.weapon;
    this.selected = w ? w.uid : null;
    this.render();
  }

  allEquipment() {
    const s = this.game.save;
    const worn = SLOT_IDS.map((slot) => s.equipment[slot]).filter(Boolean).map((inst) => ({ inst, worn: true }));
    const bag = s.inventory.filter((i) => ITEMS[i.id]?.type === 'equipment').map((inst) => ({ inst, worn: false }));
    return [...worn, ...bag];
  }

  find(uid) {
    return this.allEquipment().find((e) => e.inst.uid === uid)?.inst || null;
  }

  render() {
    const g = this.game;
    const list = this.allEquipment();
    const inst = this.selected ? this.find(this.selected) : null;
    let detail = '<p class="empty-note">강화할 장비를 골라 주세요.</p>';
    if (inst) {
      const def = ITEMS[inst.id];
      const lv = inst.enhance || 0;
      const now = itemStats(inst);
      const next = itemStats({ ...inst, enhance: lv + 1 });
      if (lv >= MAX_ENHANCE) {
        detail = `<div class="forge-name" style="color:${GRADES[def.grade].color}">${itemBadgeHTML(inst.id, { size: 56, enhance: lv })} ${escapeHtml(def.name)} +${lv}</div><p class="empty-note">최고 단계까지 강화했어요! 🏆</p>`;
      } else {
        const cost = g.equipment.enhanceCost(inst);
        const inv = g.inventory;
        const matRows = cost.mats.map(([id, n]) => {
          const have = inv.count(id);
          return `<li class="${have >= n ? 'ok' : 'lack'}">${itemIconHTML(id, { size: 24 })} ${ITEMS[id].name} <b>${have} / ${n}</b></li>`;
        }).join('');
        const can = g.equipment.canAfford(cost);
        detail = `
          <div class="forge-name" style="color:${GRADES[def.grade].color}">${itemBadgeHTML(inst.id, { size: 56, enhance: lv })} ${escapeHtml(def.name)}</div>
          <div class="forge-step"><span>+${lv}</span> ➜ <span class="next">+${lv + 1}</span></div>
          <ul class="forge-stats">${Object.keys(next).map((k) => `<li>${STAT_NAMES[k]} ${now[k] || 0} ➜ <b>${next[k]}</b></li>`).join('')}</ul>
          <div class="forge-cost">
            <div class="cost-title">필요한 것</div>
            <ul>
              <li class="${g.save.gold >= cost.gold ? 'ok' : 'lack'}">🪙 골드 <b>${g.save.gold} / ${cost.gold}</b></li>
              ${matRows}
            </ul>
          </div>
          <button class="btn btn-primary forge-go" data-enhance ${can ? '' : 'disabled'}>🔨 강화하기 (수학 문제)</button>
          ${can ? '<p class="forge-note">문제를 맞히면 강화 성공! 틀려도 재료는 그대로예요.</p>' : '<p class="forge-note lack">재료나 골드가 모자라요. 몬스터를 사냥해 모아 오세요!</p>'}`;
      }
    }
    this.root.innerHTML = `
      <div class="menu-head">
        <h3 class="panel-title">🔨 쿵쿵의 대장간</h3>
        <div class="bag-gold">🪙 ${g.save.gold.toLocaleString()}</div>
        <button class="icon-btn" data-close-forge aria-label="닫기">✕</button>
      </div>
      <div class="forge-body">
        <div class="forge-list">
          ${list.map(({ inst: it, worn }) => {
            const def = ITEMS[it.id];
            return `<button class="forge-item ${this.selected === it.uid ? 'on' : ''}" data-pick="${it.uid}" style="--g:${GRADES[def.grade].color}">
              <span class="cell-icon">${itemBadgeHTML(it.id, { size: 40, enhance: it.enhance || 0 })}</span>
              <span class="fi-name">${escapeHtml(def.name)} <b>+${it.enhance || 0}</b></span>
              <small>${worn ? `착용 중 · ${SLOTS[def.slot].name}` : SLOTS[def.slot].name}</small>
            </button>`;
          }).join('') || '<p class="empty-note">장비가 없어요.</p>'}
        </div>
        <div class="forge-detail">${detail}</div>
      </div>`;
  }

  async onClick(e) {
    const g = this.game;
    if (e.target.closest('[data-close-forge]')) {
      this.modal.close();
      return;
    }
    const pickBtn = e.target.closest('[data-pick]');
    if (pickBtn) {
      this.selected = pickBtn.dataset.pick;
      this.render();
      return;
    }
    if (!e.target.closest('[data-enhance]')) return;
    const inst = this.find(this.selected);
    if (!inst) return;
    const cost = g.equipment.enhanceCost(inst);
    if (!g.equipment.canAfford(cost)) return;
    const def = ITEMS[inst.id];
    this.modal.close();
    const res = await g.math.start({
      context: 'forge',
      title: `대장간 강화 시험 · ${def.name} +${(inst.enhance || 0) + 1}`,
      allowLater: true,
    });
    if (res.correct && g.equipment.canAfford(cost)) {
      g.equipment.payCost(cost);
      g.equipment.enhance(inst);
      g.equipment.clampHp();
      g.audio.playSfx('forge');
      g.ui.banner('강화 성공!', `${def.icon} ${def.name} +${inst.enhance}`);
      g.markDirty('enhance', { immediate: true });
    } else if (!res.correct) {
      g.ui.toast('재료는 그대로 남아 있어요. 언제든 다시 도전하세요!', 'info');
    }
    this.open();
    this.selected = inst.uid;
    this.render();
  }
}
