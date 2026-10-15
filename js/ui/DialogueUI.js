// NPC 대화창 (화면 아래쪽에 뜨는 말풍선 창)
import { OVERLAYS } from '../core/GameState.js';
import { NPCS } from '../data/npcs.js';
import { escapeHtml } from '../core/utils.js';
import { drawNpcPortrait } from '../render/portraits.js';

export class DialogueUI {
  constructor(ui) {
    this.ui = ui;
  }

  /**
   * @param {object} o
   *   npc: NPC id (data/npcs.js) 또는 그림 종류('rune', 'chest', 'goldenChest')
   *   name: 이름 (npc에 없을 때)
   *   title: 이름 아래 작은 제목
   *   text: 대사 (\n 줄바꿈)
   *   options: [{ label, value, primary }]
   * @returns {Promise<value|null>} 고른 버튼 값 (창을 닫으면 null)
   */
  show({ npc, name, title, text, options = [{ label: '확인', value: 'ok', primary: true }], dismissible = true }) {
    return new Promise((resolve) => {
      const info = NPCS[npc] || { name: name || '', portrait: npc };
      let answered = false;
      const m = this.ui.modal(`
        <div class="dlg-head">
          <canvas class="dlg-portrait" aria-hidden="true"></canvas>
          <div class="dlg-who">
            <div class="dlg-name">${escapeHtml(name || info.name)}</div>
            ${title ? `<div class="dlg-title">${escapeHtml(title)}</div>` : ''}
          </div>
        </div>
        <div class="dlg-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
        <div class="dlg-options">
          ${options.map((o, i) => `<button class="btn ${o.primary ? 'btn-primary' : 'btn-ghost'} btn-small" data-i="${i}">${escapeHtml(o.label)}</button>`).join('')}
        </div>`, {
        className: 'modal-dialogue',
        backdropClass: 'dialogue-backdrop',
        overlayType: OVERLAYS.DIALOGUE,
        dismissible,
        onClose: () => { if (!answered) resolve(null); },
      });
      drawNpcPortrait(m.el.querySelector('.dlg-portrait'), info.portrait || npc, this.ui.game.time);
      m.el.querySelectorAll('[data-i]').forEach((b) => {
        b.addEventListener('click', () => {
          answered = true;
          this.ui.game.audio.playSfx(b.classList.contains('btn-primary') ? 'confirm' : 'click');
          m.close();
          resolve(options[Number(b.dataset.i)].value);
        });
      });
      setTimeout(() => m.el.querySelector('.btn-primary, [data-i]')?.focus(), 60);
    });
  }
}
