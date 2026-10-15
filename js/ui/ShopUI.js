// 상점 창: 사기 / 팔기
import { OVERLAYS } from '../core/GameState.js';
import { itemBadgeHTML } from '../data/itemArt.js';
import { ITEMS, GRADES, PRICES, sellPrice, STAT_NAMES } from '../data/items.js';
import { escapeHtml } from '../core/utils.js';
import { CONTENT_SHOPS } from '../data/villageContent.js';

// 마을별 판매 목록 (마을이 늘어나면 여기에 추가)
export const SHOP_STOCK = {
  fractionValley: ['potion_s', 'potion_m', 'bread', 'iron_sword', 'leather_armor', 'leather_gloves', 'leather_boots', 'enhance_stone'],
  ...CONTENT_SHOPS,
};

export class ShopUI {
  constructor(game) {
    this.game = game;
    this.tab = 'buy';
  }

  open() {
    this.tab = 'buy';
    this.modal = this.game.ui.modal('<div class="shop-root"></div>', { className: 'modal-shop', overlayType: OVERLAYS.SHOP });
    this.root = this.modal.el.querySelector('.shop-root');
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.render();
  }

  statLine(def) {
    if (!def.stats) return escapeHtml(def.desc || '');
    return Object.entries(def.stats).map(([k, v]) => `${STAT_NAMES[k]} +${v}`).join(' · ');
  }

  render() {
    const g = this.game;
    const s = g.save;
    const stock = SHOP_STOCK[s.currentVillage] || SHOP_STOCK.fractionValley;
    let list;
    if (this.tab === 'buy') {
      list = stock.map((id) => {
        const def = ITEMS[id];
        const price = PRICES[id];
        const can = s.gold >= price;
        return `
          <div class="shop-row" style="--g:${GRADES[def.grade].color}">
            <span class="shop-icon">${itemBadgeHTML(id, { size: 46 })}</span>
            <div class="shop-info"><b>${escapeHtml(def.name)}</b><small>${this.statLine(def)}</small></div>
            <button class="btn btn-small ${can ? 'btn-primary' : 'btn-ghost'}" data-buy="${id}" ${can ? '' : 'disabled'}>🪙 ${price}</button>
          </div>`;
      }).join('');
    } else {
      const items = g.inventory.sorted('all');
      list = items.length ? items.map((it) => {
        const def = ITEMS[it.id];
        return `
          <div class="shop-row" style="--g:${GRADES[def.grade].color}">
            <span class="shop-icon">${itemBadgeHTML(it.id, { size: 46, enhance: it.enhance })}</span>
            <div class="shop-info"><b>${escapeHtml(def.name)}${it.enhance ? ` +${it.enhance}` : ''}</b>
              <small>${it.qty !== undefined ? `${it.qty}개 가지고 있어요` : GRADES[def.grade].name}</small></div>
            <button class="btn btn-small btn-sky" data-sell="${it.uid}">팔기 🪙 ${sellPrice(it.id)}</button>
          </div>`;
      }).join('') : '<p class="empty-note">팔 물건이 없어요. (착용 중인 장비는 팔 수 없어요)</p>';
    }
    this.root.innerHTML = `
      <div class="menu-head">
        <h3 class="panel-title">🛒 상점</h3>
        <div class="bag-gold">🪙 ${s.gold.toLocaleString()}</div>
        <button class="icon-btn" data-close-shop aria-label="닫기">✕</button>
      </div>
      <div class="bag-tabs">
        <button class="${this.tab === 'buy' ? 'on' : ''}" data-tab="buy">사기</button>
        <button class="${this.tab === 'sell' ? 'on' : ''}" data-tab="sell">팔기</button>
      </div>
      <div class="shop-list">${list}</div>`;
  }

  async onClick(e) {
    const g = this.game;
    const s = g.save;
    if (e.target.closest('[data-close-shop]')) {
      this.modal.close();
      return;
    }
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      this.tab = tab.dataset.tab;
      this.render();
      return;
    }
    const buy = e.target.closest('[data-buy]')?.dataset.buy;
    if (buy) {
      const price = PRICES[buy];
      if (s.gold < price) return;
      if (!g.inventory.add(buy, 1)) {
        g.ui.toast('가방이 가득 찼어요!', 'warn');
        return;
      }
      s.gold -= price;
      g.audio.playSfx('item');
      g.ui.toast(`${ITEMS[buy].icon} ${ITEMS[buy].name}을(를) 샀어요!`, 'ok');
      g.markDirty('buy');
      this.render();
      return;
    }
    const sell = e.target.closest('[data-sell]')?.dataset.sell;
    if (sell) {
      const it = g.inventory.find(sell);
      if (!it) return;
      const def = ITEMS[it.id];
      if (def.type === 'equipment' && GRADES[def.grade].order >= 3) {
        const ok = await g.ui.confirm({ title: '정말 팔까요?', message: `${def.name}은(는) ${GRADES[def.grade].name} 장비예요.\n팔면 되찾을 수 없어요.`, okText: '팔기', danger: true });
        if (!ok) return;
      }
      const price = sellPrice(it.id);
      g.inventory.remove(sell, 1);
      s.gold += price;
      g.audio.playSfx('item');
      g.markDirty('sell');
      this.render();
    }
  }
}
