// 퀘스트 창: 진행 중 / 받을 수 있는 퀘스트 / 완료한 퀘스트
import { OVERLAYS } from '../core/GameState.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { escapeHtml } from '../core/utils.js';

const TYPE_LABEL = {
  kill: '⚔️ 처치', collect: '🎒 수집', talk: '💬 대화', explore: '🧭 탐험', rune: '🔮 수학 룬', boss: '👑 보스',
};

export class QuestUI {
  constructor(game) {
    this.game = game;
  }

  open() {
    const q = this.game.quests;
    const tracked = q.tracked();
    const avail = QUEST_ORDER.filter((id) => q.status(id) === 'available');
    const done = QUEST_ORDER.filter((id) => q.status(id) === 'done');

    const card = (id) => {
      const qd = QUESTS[id];
      const st = q.status(id);
      const need = qd.count || 1;
      const prog = st === 'complete' ? need : q.progress(id);
      const showBar = ['kill', 'collect'].includes(qd.type);
      return `
        <div class="quest-card ${st}">
          <div class="quest-top">
            <span class="quest-type">${TYPE_LABEL[qd.type] || ''}</span>
            <b class="quest-title">${escapeHtml(qd.title)}</b>
            ${st === 'complete' ? '<span class="quest-done-chip">보고 가능</span>' : ''}
          </div>
          <p class="quest-desc">${escapeHtml(qd.desc)}</p>
          ${showBar ? `<div class="bar quest-bar"><div class="fill" style="width:${(prog / need) * 100}%"></div><span>${prog} / ${need}</span></div>` : ''}
          <div class="quest-meta">${st === 'complete' ? `✓ ${escapeHtml(NPCS[qd.giver].name)}에게 보고하세요` : escapeHtml(q.progressText(id))} · 보상: ${escapeHtml(q.rewardText(id))}</div>
        </div>`;
    };

    this.game.ui.modal(`
      <div class="menu-head">
        <h3 class="panel-title">📜 퀘스트</h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <h4 class="sec-title">진행 중</h4>
      ${tracked.length ? tracked.map(card).join('') : '<p class="empty-note">진행 중인 퀘스트가 없어요.</p>'}
      ${avail.length ? `<h4 class="sec-title">받을 수 있는 퀘스트</h4>
        <ul class="avail-list">${avail.map((id) => `<li>📜 <b>${escapeHtml(QUESTS[id].title)}</b> — ${escapeHtml(NPCS[QUESTS[id].giver].name)}에게 가 보세요</li>`).join('')}</ul>` : ''}
      ${done.length ? `<h4 class="sec-title">완료 (${done.length})</h4>
        <ul class="done-list">${done.map((id) => `<li>✅ ${escapeHtml(QUESTS[id].title)}</li>`).join('')}</ul>` : ''}`, {
      className: 'modal-quests', overlayType: OVERLAYS.MENU,
    });
  }
}
