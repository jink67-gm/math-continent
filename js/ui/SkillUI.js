// 스킬 창
//  - master 모드: 룬 할아버지에게 새 스킬 배우기 (수학의 룬 문제)
//  - manage 모드: 배운 스킬을 1·2·3번 칸에 넣기 (최대 3개 장착)
import { OVERLAYS } from '../core/GameState.js';
import { assets } from '../render/AssetManager.js';
const SKILL_ART = { spin: 'ui/skill_wind', dash: 'ui/skill_light', smash: 'ui/skill_fire', guard: 'ui/skill_ice', meteor: 'ui/skill_void', healRune: 'effects/heal_green' };
import { SKILLS, SKILL_ORDER } from '../data/skills.js';
import { escapeHtml } from '../core/utils.js';
import { SLOT_UNLOCK, SLOT_KEYS } from '../player/SkillManager.js';

export class SkillUI {
  constructor(game) {
    this.game = game;
  }

  open(mode = 'manage') {
    this.mode = mode;
    this.modal = this.game.ui.modal('<div class="skill-root"></div>', {
      className: 'modal-skills', overlayType: OVERLAYS.MENU,
    });
    this.root = this.modal.el.querySelector('.skill-root');
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.render();
  }

  render() {
    const g = this.game;
    const sm = g.skills;
    const slots = g.save.skillSlots;
    const touch = g.input.isTouch;
    // 화면에 보이는 키 = 실제로 눌리는 키 (PC: 숫자 1·2·3 또는 K·L·U, 모바일: 스킬 버튼 1·2·3)
    const keyOf = (i) => (touch ? `버튼 ${i + 1}` : `${SLOT_KEYS[i][0]} · ${SLOT_KEYS[i][1]}`);
    const open = [0, 1, 2].map((i) => sm.slotOpen(i));
    const art = (id) => (SKILL_ART[id] && assets.url(SKILL_ART[id]) ? `<img class="slot-sk-img" src="${assets.url(SKILL_ART[id])}" alt="">` : SKILLS[id].icon);
    this.root.innerHTML = `
      <div class="menu-head">
        <h3 class="panel-title">${this.mode === 'master' ? '🔮 룬 할아버지의 기술' : '✨ 스킬'}</h3>
        <button class="icon-btn" data-close-skill aria-label="닫기">✕</button>
      </div>
      <div class="slot-row">
        ${slots.map((id, i) => `
          <div class="skill-slot ${open[i] ? '' : 'locked'}">
            <span class="slot-key">${i + 1}번 칸<small>${keyOf(i)}</small></span>
            <span class="slot-skill">${!open[i] ? `🔒 LEVEL ${SLOT_UNLOCK[i]}에 열려요` : id && sm.has(id) ? `${art(id)} ${SKILLS[id].name}` : '비어 있음'}</span>
          </div>`).join('')}
      </div>
      ${this.mode === 'master' ? '<p class="skill-note">새 스킬을 배우려면 수학의 룬 문제를 풀어야 해요. 틀려도 다시 도전할 수 있어요!</p>' : ''}
      <div class="skill-list">
        ${SKILL_ORDER.map((id) => {
          const def = SKILLS[id];
          const learned = sm.has(id);
          const can = sm.canLearn(id);
          let action = '';
          if (learned) {
            action = `<div class="skill-actions">
              ${[0, 1, 2].map((i) => (open[i]
                ? `<button class="btn btn-small ${slots[i] === id ? 'btn-sky' : 'btn-ghost'}" data-slot="${i}" data-id="${id}">${i + 1}번 칸</button>`
                : `<button class="btn btn-small btn-ghost slot-locked" disabled title="LEVEL ${SLOT_UNLOCK[i]}에 열려요">🔒 ${i + 1}번</button>`)).join('')}
            </div>`;
          } else if (this.mode === 'master' && can.ok) {
            action = `<button class="btn btn-primary btn-small learn-btn" data-learn="${id}">문제 풀고<br>배우기</button>`;
          } else {
            action = `<span class="skill-lock">🔒 ${escapeHtml(can.reason)}</span>`;
          }
          return `
            <div class="skill-card ${learned ? 'learned' : can.ok ? 'ready' : 'locked'}">
              <div class="skill-icon">${SKILL_ART[id] && assets.url(SKILL_ART[id]) ? `<img class="sk-card-img" src="${assets.url(SKILL_ART[id])}" alt="">` : def.icon}</div>
              <div class="skill-info">
                <div class="skill-name">${def.name} ${learned ? '<span class="learned-chip">배움</span>' : ''}</div>
                <div class="skill-desc">${escapeHtml(def.desc)}</div>
                <div class="skill-meta">${escapeHtml(def.power)} · 재사용 ${def.cooldown}초</div>
              </div>
              <div class="skill-act">${action}</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  async onClick(e) {
    const g = this.game;
    if (e.target.closest('[data-close-skill]')) {
      this.modal.close();
      return;
    }
    const learn = e.target.closest('[data-learn]')?.dataset.learn;
    if (learn) {
      this.modal.close();
      await g.learnSkill(learn);
      return;
    }
    const slotBtn = e.target.closest('[data-slot]');
    if (slotBtn && !slotBtn.disabled) {
      if (g.skills.assign(Number(slotBtn.dataset.slot), slotBtn.dataset.id) === false) return;
      g.audio.playSfx('click');
      g.markDirty('skill-slot');
      this.render();
    }
  }
}
