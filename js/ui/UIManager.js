// 화면 UI 담당: 타이틀, 캐릭터 만들기, HUD, 창(모달), 알림, 저장 표시

import { VILLAGES, getVillage, FINAL_AREA, VILLAGE_LEVELS } from '../data/villages.js';
import { RANKS } from '../data/ranks.js';
import { UNITS } from '../data/units.js';
import { OVERLAYS } from '../core/GameState.js';
import { HERO_COLORS, BONUS_OPTIONS, expToNext } from '../player/Player.js';
import { escapeHtml, formatPlayTime, storage } from '../core/utils.js';
import { drawHero } from '../render/sprites.js';
import { drawHeroSprite, HERO_VARIANTS } from '../render/heroSprites.js';
import { assets } from '../render/AssetManager.js';
import { DialogueUI } from './DialogueUI.js';
import { InventoryUI } from './InventoryUI.js';
import { QuestUI } from './QuestUI.js';
import { SkillUI } from './SkillUI.js';
import { ShopUI } from './ShopUI.js';
import { ForgeUI } from './ForgeUI.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { SKILLS } from '../data/skills.js';
import { SLOT_UNLOCK } from '../player/SkillManager.js';
import { QUESTS } from '../data/quests.js';

const $ = (sel, root = document) => root.querySelector(sel);

// 스킬 아이콘 그림
const SKILL_ART = { spin: 'ui/skill_wind', dash: 'ui/skill_light', smash: 'ui/skill_fire', guard: 'ui/skill_ice', meteor: 'ui/skill_void', healRune: 'effects/heal_green' };

const SAVE_TEXT = {
  saving: { text: '저장 중...', cls: 'saving' },
  saved: { text: '✓ 저장됨', cls: 'saved' },
  local: { text: '✓ 기기에 저장됨', cls: 'saved' },
  offline: { text: '오프라인 저장 · 연결되면 다시 저장해요', cls: 'offline' },
  conflict: { text: '다른 곳에 더 최신 기록이 있어요', cls: 'offline' },
  error: { text: '⚠ 저장 실패', cls: 'error' },
};

export class UIManager {
  constructor(game) {
    this.game = game;
    this.screen = $('#screen-layer');
    this.overlay = $('#overlay-layer');
    this.toastLayer = $('#toast-layer');
    this.hud = $('#hud');
    this.touch = $('#touch-controls');
    this.dev = $('#dev-panel');
    this.saveEl = $('#save-indicator');
    this.saveFadeTimer = null;
    this.previewRaf = null;
    this.dialogue = new DialogueUI(this);
    this.bag = new InventoryUI(game);
    this.questUI = new QuestUI(game);
    this.skillUI = new SkillUI(game);
    this.shopUI = new ShopUI(game);
    this.forgeUI = new ForgeUI(game);
    this.interactLabel = undefined;
    this.skillBarKey = '';
  }

  init() {
    this.game.bus.on('save:status', ({ status }) => this.setSaveStatus(status));
    this.game.bus.on('save:conflict', () => {
      this.toast('다른 기기(또는 다른 창)에 더 최신 기록이 있어요. 새로고침하면 최신 기록을 불러와요.', 'warn', 5000);
    });
  }

  // ---------------- 화면 ----------------
  clearScreen() {
    cancelAnimationFrame(this.previewRaf);
    this.screen.innerHTML = '';
  }

  showLoading(text) {
    this.screen.innerHTML = `
      <div class="screen loading-screen">
        <div class="loading-gem"></div>
        <div class="loading-text">${escapeHtml(text)}</div>
      </div>`;
  }

  cloudStatusInfo() {
    const { firebase, auth } = this.game;
    if (!firebase.configured) return { cls: 'warn', text: '⚠ Firebase 설정 전 — 기록은 이 기기에만 저장돼요' };
    if (auth.isCloud) return { cls: 'ok', text: '☁️ 클라우드 저장 연결됨' };
    return { cls: 'warn', text: '☁️ 클라우드 연결 안 됨 — 이 기기에 먼저 저장하고, 연결되면 다시 저장해요' };
  }

  showTitle(summary, handlers) {
    cancelAnimationFrame(this.previewRaf);
    const cloud = this.cloudStatusInfo();
    const cont = summary
      ? `<span class="btn-sub">${escapeHtml(summary.nickname)} · Lv ${summary.level} · ${escapeHtml(getVillage(summary.currentVillage).name)} · ${formatPlayTime(summary.playTime)}</span>`
      : '<span class="btn-sub">저장된 모험이 없어요</span>';

    this.screen.innerHTML = `
      <div class="screen title-screen">
        <div class="sky-deco">
          <span class="cloud c1"></span><span class="cloud c2"></span><span class="cloud c3"></span>
          <span class="hill h1"></span><span class="hill h2"></span><span class="hill h3"></span>
        </div>
        ${assets.url('characters/male/skill') ? `<div class="title-heroes"><img class="r" src="${assets.url('characters/male/skill')}" alt=""><img src="${assets.url('characters/female/skill')}" alt=""></div>` : ''}
        <div class="title-content">
          <div class="crystal-row">
            ${VILLAGES.map((v, i) => `<span class="crystal" style="--c:${v.crystal.color}; --d:${i * 0.25}s" title="${v.crystal.name}"><i></i></span>`).join('')}
          </div>
          <h1 class="logo">수학 대륙</h1>
          <div class="logo-ribbon">여섯 마을의 봉인</div>
          <div class="title-menu">
            <button class="btn btn-primary btn-big" data-act="new">⚔️ 새 게임</button>
            <button class="btn btn-sky btn-big btn-stack" data-act="continue" ${summary ? '' : 'disabled'}>
              <span>📖 이어하기</span>${cont}
            </button>
            <button class="btn btn-ghost" data-act="settings">⚙️ 설정</button>
          </div>
          <div class="title-status ${cloud.cls}">${cloud.text}</div>
        </div>
      </div>`;

    this.screen.querySelector('[data-act="new"]').addEventListener('click', handlers.onNew);
    this.screen.querySelector('[data-act="continue"]').addEventListener('click', handlers.onContinue);
    this.screen.querySelector('[data-act="settings"]').addEventListener('click', handlers.onSettings);
  }

  // 캐릭터 만들기 → { nickname, color } 또는 null(뒤로)
  showCharacterSetup() {
    return new Promise((resolve) => {
      const color = HERO_COLORS[0].color;
      let variant = 'male';
      this.screen.innerHTML = `
        <div class="screen setup-screen">
          <div class="panel setup-card">
            <h2 class="panel-title">캐릭터를 선택하세요!</h2>
            <div class="hero-pick" role="radiogroup" aria-label="캐릭터 선택">
              ${Object.values(HERO_VARIANTS).map((v, i) => `
                <button class="hero-card ${i === 0 ? 'on' : ''}" data-variant="${v.id}" role="radio" aria-checked="${i === 0}">
                  <canvas class="hero-card-art" aria-hidden="true"></canvas>
                  <b class="hero-card-name">${v.name}</b>
                  <small class="hero-card-desc">${v.desc}</small>
                </button>`).join('')}
            </div>
            <p class="hero-pick-note">두 캐릭터는 모습만 다르고 능력치와 모험은 똑같아요.</p>
            <label class="field-label" for="nick-input">별명 <small>실명이 아니어도 돼요 · 2~10글자</small></label>
            <input id="nick-input" class="text-input" maxlength="10" placeholder="예: 분수용사" autocomplete="off">
            <div class="field-error" aria-live="polite"></div>
            <div class="row-btns">
              <button class="btn btn-ghost" data-act="back">뒤로</button>
              <button class="btn btn-primary" data-act="start">모험 시작하기</button>
            </div>
          </div>
        </div>`;

      // 카드 미리보기: 고른 캐릭터는 걷고, 아닌 캐릭터는 가만히 서 있어요
      const cards = [...this.screen.querySelectorAll('.hero-card')];
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ctxs = cards.map((card) => {
        const cv = card.querySelector('canvas');
        cv.width = 130 * dpr;
        cv.height = 150 * dpr;
        return cv.getContext('2d');
      });
      const t0 = performance.now();
      const paint = () => {
        const t = (performance.now() - t0) / 1000;
        cards.forEach((card, i) => {
          const ctx = ctxs[i];
          const v = card.dataset.variant;
          const on = v === variant;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, 130, 150);
          const opts = { variant: v, t, moving: on, facing: on ? { x: 1, y: 0 } : { x: 0, y: 1 }, lastHx: 1, scale: 1.55 };
          // 고른 캐릭터는 가끔 공격 동작도 보여 줘요
          const cyc = t % 3.2;
          if (on && cyc > 2.2) {
            const step = 1 + Math.min(2, Math.floor((cyc - 2.2) / 0.34));
            opts.moving = false;
            opts.attackStep = step;
            opts.attackProgress = ((cyc - 2.2) % 0.34) / 0.34;
          }
          if (!drawHeroSprite(ctx, 65, 92, opts)) drawHero(ctx, 65, 92, { color, t, scale: 1.9, facing: { x: 1, y: 0.2 } });
        });
        this.previewRaf = requestAnimationFrame(paint);
      };
      paint();

      cards.forEach((b) => {
        b.addEventListener('click', () => {
          variant = b.dataset.variant;
          cards.forEach((c) => {
            c.classList.toggle('on', c === b);
            c.setAttribute('aria-checked', String(c === b));
          });
          this.game.audio.playSfx('select');
        });
      });

      const input = this.screen.querySelector('#nick-input');
      const err = this.screen.querySelector('.field-error');
      setTimeout(() => input.focus(), 100);

      const done = (val) => {
        cancelAnimationFrame(this.previewRaf);
        resolve(val);
      };
      const start = () => {
        const nick = input.value.trim().replace(/\s+/g, ' ');
        if (nick.length < 2) {
          err.textContent = '별명을 2글자 이상 써 주세요.';
          input.focus();
          return;
        }
        if (/[<>{}]/.test(nick)) {
          err.textContent = '< > { } 기호는 쓸 수 없어요.';
          return;
        }
        done({ nickname: nick, color, characterVariant: variant });
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
      this.screen.querySelector('[data-act="start"]').addEventListener('click', start);
      this.screen.querySelector('[data-act="back"]').addEventListener('click', () => done(null));
    });
  }

  // ---------------- HUD ----------------
  showHUD(on) {
    this.hud.classList.toggle('hidden', !on);
    this.touch.classList.toggle('hidden', !on || !this.game.input.isTouch);
    this.dev.classList.toggle('hidden', !on || !this.game.config.devTools);
    if (on && !this.hud.dataset.built) this.buildHUD();
    if (on) this.updateHUD(true);
  }

  buildHUD() {
    this.hud.dataset.built = '1';
    this.hud.innerHTML = `
      <div class="hud-left panel-mini">
        <div class="hud-portrait"><canvas></canvas><div class="hud-level">Lv <b data-hud="level">1</b></div></div>
        <div class="hud-bars">
          <div class="hud-name" data-hud="name"></div>
          <div class="bar hp"><div class="fill" data-hud="hpFill"></div><span data-hud="hpText"></span></div>
          <div class="bar exp"><div class="fill" data-hud="expFill"></div><span data-hud="expText"></span></div>
        </div>
      </div>
      <div class="hud-center">
        <div class="hud-place" data-hud="place"></div>
        <button class="trial-badge hidden" data-hud="trial">⭐ 성장 시험 <b data-hud="trialCount">1</b></button>
      </div>
      <div class="hud-right">
        <div class="hud-gold panel-mini">🪙 <b data-hud="gold">0</b></div>
        <button class="hud-btn menu-gear" data-hud="menu" aria-label="메뉴">☰</button>
      </div>
      <div class="quest-tracker" data-hud="tracker"></div>
      <div class="skill-bar ${this.game.input.isTouch ? 'hidden' : ''}">
        <div class="sb-slot" data-sb="attack"><span class="sb-icon">${assets.url('items/weapons/sword_iron') ? `<img class="sk-img sk-item" src="${assets.url('items/weapons/sword_iron')}" alt="">` : '⚔️'}</span><kbd>J</kbd></div>
        <div class="sb-slot" data-sb="0"><span class="sb-icon">·</span><i class="cd"></i><kbd>1·K</kbd></div>
        <div class="sb-slot" data-sb="1"><span class="sb-icon">·</span><i class="cd"></i><kbd>2·L</kbd></div>
        <div class="sb-slot" data-sb="2"><span class="sb-icon">·</span><i class="cd"></i><kbd>3·U</kbd></div>
        <div class="sb-slot" data-sb="dodge"><span class="sb-icon">${assets.url('effects/dust_cloud') ? `<img class="sk-img sk-item" src="${assets.url('effects/dust_cloud')}" alt="">` : '💨'}</span><kbd>Space</kbd></div>
        <div class="sb-slot" data-sb="potion"><span class="sb-icon">${assets.url('items/consumables/potion_red') ? `<img class="sk-img sk-item" src="${assets.url('items/consumables/potion_red')}" alt="">` : '🧪'}</span><b class="sb-count">0</b><kbd>Q</kbd></div>
      </div>
      <div class="key-hint ${this.game.input.isTouch ? 'hidden' : ''}">
        <span><kbd>WASD</kbd> 이동</span><span><kbd>E</kbd> 대화·살펴보기</span>
        <span><kbd>I</kbd> 가방</span><span><kbd>Esc</kbd> 메뉴</span>
      </div>`;
    this.hudRefs = {};
    this.hud.querySelectorAll('[data-hud]').forEach((el) => { this.hudRefs[el.dataset.hud] = el; });
    this.hudRefs.menu.addEventListener('click', () => this.game.openMenu());
    this.hudRefs.trial.addEventListener('click', () => this.game.runGrowthTrial());

    this.game.input.buildTouchControls(this.touch);
    if (this.game.config.devTools) this.buildDevPanel();
  }

  updateHUD(full = false) {
    const s = this.game.save;
    if (!s || !this.hudRefs) return;
    const r = this.hudRefs;
    const need = expToNext(s.level);
    const maxHp = this.game.equipment.totals().maxHp;
    const hp = Math.floor(s.stats.hp);
    r.level.textContent = s.level;
    r.name.textContent = s.nickname;
    const hpP = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    r.hpFill.style.width = `${hpP}%`;
    r.hpFill.style.setProperty('--p', Math.max(1, hpP)); // 새 게이지 그림 크기 맞춤
    r.hpText.textContent = `HP ${hp} / ${maxHp}`;
    r.hpFill.parentElement.classList.toggle('low', hp / maxHp < 0.3);
    this.updateQuestTracker();
    const exP = Math.min(100, (s.exp / need) * 100);
    r.expFill.style.width = `${exP}%`;
    r.expFill.style.setProperty('--p', Math.max(1, exP));
    r.expText.textContent = `EXP ${s.exp} / ${need}`;
    r.gold.textContent = s.gold.toLocaleString();
    const v = getVillage(s.currentVillage);
    r.place.textContent = `${v.icon} ${v.name} · ${this.game.world.scene?.name || ''}`;
    r.trial.classList.toggle('hidden', !(s.pendingLevelBonus > 0));
    r.trialCount.textContent = s.pendingLevelBonus;
    const pk = `${s.appearance.color}|${s.characterVariant}|${assets.images.size > 0}`;
    if (full || this.portraitKey !== pk) {
      this.portraitKey = pk;
      this.game.renderer.drawPortrait(this.hud.querySelector('.hud-portrait canvas'), s.appearance.color, 1.15, s.characterVariant || 'male');
    }
  }

  updateQuestTracker() {
    const el = this.hudRefs?.tracker;
    if (!el) return;
    const q = this.game.quests;
    const ids = q.tracked().slice(0, 3);
    const html = ids.map((id) => {
      const st = q.status(id);
      return `<div class="qt-row ${st}"><b>${st === 'complete' ? '✅' : '📜'} ${escapeHtml(QUESTS[id].title)}</b><span>${escapeHtml(q.progressText(id))}</span></div>`;
    }).join('');
    if (el.dataset.html !== html) {
      el.dataset.html = html;
      el.innerHTML = html;
      el.classList.toggle('hidden', !ids.length);
    }
  }

  // NPC 근처에서 터치용 [💬 대화하기] 버튼 보이기
  setInteract(label) {
    if (this.interactLabel === label) return;
    this.interactLabel = label;
    const btn = this.touch.querySelector('.act-interact');
    if (!btn) return;
    btn.classList.toggle('hidden', !label);
    if (label) btn.querySelector('span').textContent = label;
  }

  // 스킬 칸 아이콘·재사용 대기 표시 (매 프레임 호출, 바뀐 것만 다시 그림)
  updateSkillBar() {
    const g = this.game;
    const s = g.save;
    if (!s || !this.hudRefs) return;
    const slots = s.skillSlots;
    const cds = slots.map((id) => Math.round(g.skills.cooldownRatio(id) * 20) / 20);
    const pots = g.inventory.potionCount();
    const open = [0, 1, 2].map((i) => g.skills.slotOpen(i));
    const key = `${slots.join(',')}|${cds.join(',')}|${pots}|${open.join(',')}|${s.skills.length}`;
    if (key === this.skillBarKey) return;
    this.skillBarKey = key;
    const paint = (el, i) => {
      if (!el) return;
      const locked = !open[i];
      const id = locked || !g.skills.has(slots[i]) ? null : slots[i];
      const ic = el.querySelector('.sb-icon, .act-icon');
      const url = id && assets.url(SKILL_ART[id]);
      if (locked) ic.innerHTML = `<span class="sb-lock">🔒<small>Lv${SLOT_UNLOCK[i]}</small></span>`;
      else if (url) ic.innerHTML = `<img class="sk-img" src="${url}" alt="">`;
      else ic.textContent = id ? SKILLS[id].icon : '·';
      el.classList.toggle('empty', !id);
      el.classList.toggle('locked', locked);
      el.classList.toggle('cooling', cds[i] > 0 && !locked);
      el.style.setProperty('--cd', locked ? 0 : cds[i]);
      el.title = locked ? `${i + 1}번 칸: LEVEL ${SLOT_UNLOCK[i]}에 열려요` : id ? SKILLS[id].name : '빈 스킬 칸';
    };
    paint(this.hud.querySelector('[data-sb="0"]'), 0);
    paint(this.hud.querySelector('[data-sb="1"]'), 1);
    paint(this.hud.querySelector('[data-sb="2"]'), 2);
    paint(this.touch.querySelector('.act-skill1'), 0);
    paint(this.touch.querySelector('.act-skill2'), 1);
    paint(this.touch.querySelector('.act-skill3'), 2);
    const pc = this.hud.querySelector('.sb-count');
    if (pc) pc.textContent = pots;
    const tc = this.touch.querySelector('.act-count');
    if (tc) tc.textContent = pots;
  }

  openBag(tab) {
    this.bag.open(tab);
  }

  openShop() {
    this.shopUI.open();
  }

  openForge() {
    this.forgeUI.open();
  }

  // ---------- 엔딩 ----------
  showEnding(s) {
    this.toastLayer.replaceChildren();
    this.toastLayer.style.visibility = 'hidden';
    const done = (resolve) => () => { this.toastLayer.style.visibility = ''; resolve(); };
    return new Promise((resolve) => {
      const m = this.modal(`
        <div class="ending">
          <div class="crystal-row big">
            ${VILLAGES.map((v, i) => `<span class="crystal" style="--c:${v.crystal.color}; --d:${i * 0.2}s"><i></i></span>`).join('')}
          </div>
          <h2 class="ending-title">수학 대륙에 평화가!</h2>
          <p><b>${escapeHtml(s.nickname)}</b> 모험가님이 여섯 마을의 결정을 모두 되찾고<br>혼돈의 군주를 물리쳤어요!</p>
          <div class="stat-box">
            <div class="stat-row"><span>레벨</span><b>${s.level}</b></div>
            <div class="stat-row"><span>등급</span><b>🎖️ ${RANKS[s.rank || 0].name}</b></div>
            <div class="stat-row"><span>맞힌 수학 문제</span><b>${s.correctAnswers}개</b></div>
            <div class="stat-row"><span>최고 연속 정답</span><b>${s.bestStreak}회</b></div>
            <div class="stat-row"><span>물리친 몬스터</span><b>${s.counters.kills}마리</b></div>
            <div class="stat-row"><span>모험한 시간</span><b>${formatPlayTime(s.playTime)}</b></div>
          </div>
          <p class="ending-note">초등학교 6학년 2학기 수학 여행을 모두 마쳤어요. 정말 멋져요! 🎉<br>
            게임은 계속 즐길 수 있어요. 장비를 더 강화하고 업적을 모아 보세요!</p>
          <button class="btn btn-primary btn-big" data-close>모험 계속하기</button>
        </div>`, { className: 'modal-ending', dismissible: false, overlayType: OVERLAYS.REWARD, onClose: done(resolve) });
      void m;
    });
  }

  // ---------- 보스 체력바 ----------
  showBossBar(boss) {
    let el = document.getElementById('boss-bar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boss-bar';
      document.getElementById('app').appendChild(el);
    }
    el.innerHTML = `
      <div class="boss-name">👹 ${escapeHtml(boss.name)}</div>
      <div class="boss-hp"><div class="fill"></div>
        ${boss.def.seals.map((r) => `<i class="seal-mark" style="left:${r * 100}%" title="수학의 봉인"></i>`).join('')}
      </div>
      <div class="boss-seals"></div>`;
    el.classList.remove('hidden');
    this.bossBar = el;
    this.updateBossBar(boss);
  }

  updateBossBar(boss) {
    if (!this.bossBar || !boss) return;
    const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
    this.bossBar.querySelector('.fill').style.width = `${pct}%`;
    this.bossBar.querySelector('.fill').style.setProperty('--p', Math.max(1, pct));
    const done = boss.sealsTotal - boss.sealsLeft.length - (boss.shielded ? 1 : 0);
    const left = boss.sealsTotal - done;
    this.bossBar.querySelector('.boss-seals').textContent = boss.shielded
      ? `🛡️ ${boss.def.shieldName || '수학의 봉인'} 발동 중!`
      : (left > 0 ? `수학의 봉인 ${left}개 남음` : '마지막 힘을 쥐어짜고 있다!');
    this.bossBar.classList.toggle('shielded', boss.shielded);
    // 2페이즈 표시 (전용 보스)
    const ph = this.bossBar.querySelector('.boss-name');
    if (ph && boss.lastPhase >= 2 && !ph.dataset.p2) {
      ph.dataset.p2 = '1';
      ph.textContent += ' · 2페이즈';
    }
  }

  hideBossBar() {
    this.bossBar?.classList.add('hidden');
    this.bossBar = null;
  }

  // 장면 전환 페이드
  fade(on) {
    let el = document.getElementById('fade');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fade';
      document.getElementById('app').appendChild(el);
    }
    return new Promise((res) => {
      requestAnimationFrame(() => {
        el.classList.toggle('on', on);
        setTimeout(res, 260);
      });
    });
  }

  openQuests() {
    this.questUI.open();
  }

  openSkills(mode = 'manage') {
    this.skillUI.open(mode);
  }

  openAchievements() {
    const got = new Set(this.game.save.achievements);
    this.modal(`
      <div class="menu-head">
        <h3 class="panel-title">🏆 업적 <small class="bag-count">${got.size} / ${ACHIEVEMENTS.length}</small></h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="ach-list">
        ${ACHIEVEMENTS.map((a) => `
          <div class="ach ${got.has(a.id) ? 'got' : ''}">
            <span class="ach-icon">${got.has(a.id) ? a.icon : '🔒'}</span>
            <div><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)}</small></div>
          </div>`).join('')}
      </div>`, { className: 'modal-wide', overlayType: OVERLAYS.MENU });
  }

  // ---------------- 테스트 패널 ----------------
  buildDevPanel() {
    this.dev.innerHTML = `
      <button class="dev-toggle" aria-expanded="false">🧪 테스트</button>
      <div class="dev-body hidden">
        <button data-dev="exp">EXP +20</button>
        <button data-dev="gold">골드 +25</button>
        <button data-dev="item">장비 받기</button>
        <button data-dev="heal">HP 회복</button>
        <button data-dev="q2">문제 테스트</button>
        <button data-dev="q4">보스 문제</button>
        <button data-dev="pi">원주율 문제</button>
        <button data-dev="save">저장 데이터 보기</button>
      </div>`;
    const toggle = this.dev.querySelector('.dev-toggle');
    const body = this.dev.querySelector('.dev-body');
    toggle.addEventListener('click', () => {
      body.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!body.classList.contains('hidden')));
    });
    body.addEventListener('click', (e) => {
      const act = e.target.closest('[data-dev]')?.dataset.dev;
      if (act) this.game.devAction(act);
    });
  }

  // ---------------- 창(모달) ----------------
  modal(html, { className = '', backdropClass = '', dismissible = true, overlayType = OVERLAYS.MENU, onClose } = {}) {
    const root = document.createElement('div');
    root.className = `modal-backdrop ${backdropClass}`;
    root.innerHTML = `<div class="modal ${className}" role="dialog" aria-modal="true">${html}</div>`;
    this.overlay.appendChild(root);
    if (overlayType) this.game.state.push(overlayType);
    if (overlayType === OVERLAYS.MENU || overlayType === OVERLAYS.SETTINGS) this.game.audio.playSfx('menuOpen');
    let closed = false;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible && root === this.overlay.lastElementChild) {
        e.stopPropagation();
        close();
      }
    };
    const close = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      if (overlayType) this.game.state.pop(overlayType);
      this.game.input.clearPressed();
      root.classList.add('closing');
      if (overlayType === OVERLAYS.MENU || overlayType === OVERLAYS.SETTINGS) this.game.audio.playSfx('menuClose');
      setTimeout(() => root.remove(), 160);
      onClose?.();
    };
    if (dismissible) {
      root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); });
    }
    document.addEventListener('keydown', onKey, true);
    root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    root._close = close;
    return { root, el: root.firstElementChild, close };
  }

  confirm({ title, message, okText = '확인', cancelText = '취소', danger = false }) {
    return new Promise((resolve) => {
      let answered = false;
      const m = this.modal(`
        <h3 class="panel-title">${escapeHtml(title)}</h3>
        <p class="modal-msg">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <div class="row-btns">
          <button class="btn btn-ghost" data-no>${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${escapeHtml(okText)}</button>
        </div>`, {
        className: 'modal-small',
        overlayType: OVERLAYS.CONFIRM,
        onClose: () => { if (!answered) resolve(false); },
      });
      m.el.querySelector('[data-yes]').addEventListener('click', () => { answered = true; m.close(); resolve(true); });
      m.el.querySelector('[data-no]').addEventListener('click', () => { answered = true; m.close(); resolve(false); });
      setTimeout(() => m.el.querySelector('[data-no]').focus(), 50);
    });
  }

  alert({ title, html, okText = '좋아요!' }) {
    return new Promise((resolve) => {
      const m = this.modal(`
        <h3 class="panel-title">${escapeHtml(title)}</h3>
        <div class="modal-msg">${html}</div>
        <div class="row-btns"><button class="btn btn-primary" data-close>${escapeHtml(okText)}</button></div>`,
      { className: 'modal-small', overlayType: OVERLAYS.DIALOGUE, onClose: resolve });
      setTimeout(() => m.el.querySelector('[data-close]').focus(), 50);
    });
  }

  // 성장 시험 통과 → 보너스 고르기
  pickLevelBonus() {
    return new Promise((resolve) => {
      const m = this.modal(`
        <h3 class="panel-title">⭐ 성장 보너스를 골라요!</h3>
        <div class="bonus-row">
          ${BONUS_OPTIONS.map((o) => `
            <button class="bonus-card" data-bonus="${o.id}">
              <span class="bonus-icon">${o.icon}</span>
              <span class="bonus-label">${o.label}</span>
              <span class="bonus-desc">${o.desc}</span>
            </button>`).join('')}
        </div>`, { className: 'modal-bonus', dismissible: false, overlayType: OVERLAYS.REWARD });
      m.el.querySelectorAll('[data-bonus]').forEach((b) => {
        b.addEventListener('click', () => {
          m.close();
          resolve(b.dataset.bonus);
        });
      });
    });
  }

  openMenu(handlers) {
    const s = this.game.save;
    const st = this.game.equipment.totals();
    const m = this.modal(`
      <div class="menu-head">
        <h3 class="panel-title">메뉴</h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="menu-grid five">
        <button class="menu-item" data-m="inventory">🎒<span>가방</span></button>
        <button class="menu-item" data-m="equipment">🛡️<span>장비</span></button>
        <button class="menu-item" data-m="quests">📜<span>퀘스트</span></button>
        <button class="menu-item" data-m="skills">✨<span>스킬</span></button>
        <button class="menu-item" data-m="achievements">🏆<span>업적</span></button>
        <button class="menu-item" data-m="map">🗺️<span>월드맵</span></button>
        <button class="menu-item" data-m="home">🏘️<span>마을로 귀환</span></button>
        <button class="menu-item" data-m="settings">⚙️<span>설정</span></button>
        <button class="menu-item" data-m="title">🚪<span>타이틀로</span></button>
      </div>
      <div class="stat-box">
        <div class="stat-row"><span>레벨</span><b>${s.level}</b></div>
        <div class="stat-row"><span>등급</span><b>🎖️ ${RANKS[s.rank || 0].name}</b></div>
        <div class="stat-row"><span>되찾은 결정</span><b>💎 ${s.crystals.length} / 6</b></div>
        <div class="stat-row"><span>HP</span><b>${Math.floor(s.stats.hp)} / ${st.maxHp}</b></div>
        <div class="stat-row"><span>공격력</span><b>${st.attack}</b></div>
        <div class="stat-row"><span>방어력</span><b>${st.defense}</b></div>
        <div class="stat-row"><span>이동속도</span><b>${st.moveSpeed.toFixed(2)}</b></div>
        <div class="stat-row"><span>처치한 몬스터</span><b>${s.counters.kills}마리</b></div>
        <div class="stat-row"><span>수학 정답</span><b>${s.correctAnswers}개</b></div>
        <div class="stat-row"><span>최고 연속 정답</span><b>${s.bestStreak}회</b></div>
        <div class="stat-row"><span>플레이 시간</span><b>${formatPlayTime(s.playTime)}</b></div>
        <div class="stat-row"><span>저장 상태</span><b>${this.saveStatusText()}</b></div>
      </div>
      <button class="btn btn-sky btn-small save-now" data-m="saveNow">💾 지금 저장하기</button>`, {
      className: 'modal-menu', overlayType: OVERLAYS.MENU,
    });
    m.el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-m]')?.dataset.m;
      if (!act) return;
      m.close();
      handlers[act]?.();
    });
  }

  saveStatusText() {
    const st = this.game.saveManager.status;
    return SAVE_TEXT[st]?.text || '대기 중';
  }

  openWorldMap() {
    const s = this.game.save;
    const allOpen = this.game.getEffectiveSettings().allVillagesOpen;
    const m = this.modal(`
      <div class="menu-head">
        <h3 class="panel-title">🗺️ 수학 대륙</h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="map-grid">
        ${VILLAGES.map((v) => {
          // 빠른 이동: 그 마을의 워프포인트를 직접 활성화했을 때만 (방문·열림과 따로)
          const unlocked = allOpen || s.unlockedVillages.includes(v.id);
          const open = allOpen || (s.warpPoints || ['fractionValley']).includes(v.id);
          const cleared = s.bossesDefeated.includes(v.id);
          return `
            <button class="map-card ${open ? 'open' : 'locked'} ${v.home && open ? 'travel' : ''}" data-village="${v.id}" style="--c:${v.crystal.color}; --bg:${v.theme.ground}">
              <div class="map-icon">${open ? v.icon : unlocked ? '🌀' : '🔒'}</div>
              <div class="map-name">${v.order}. ${escapeHtml(v.name)}</div>
              <div class="map-unit">${escapeHtml(UNITS[v.unit].name)}</div>
              <div class="map-unit">권장 Lv ${VILLAGE_LEVELS[v.id] || ''}</div>
              <div class="map-state">${open ? (cleared ? '💎 결정 회복 · 이동하기' : '✨ 이동하기') : unlocked ? '워프포인트 미발견' : '🔒 길이 막혀 있어요'}</div>
            </button>`;
        }).join('')}
        ${(() => {
          const fOpen = allOpen || VILLAGES.every((v) => s.bossesDefeated.includes(v.id));
          const fDone = s.bossesDefeated.includes(FINAL_AREA.id);
          return `<button class="map-card final ${fOpen ? 'open travel' : 'locked'}" data-village="${FINAL_AREA.id}" style="--c:${FINAL_AREA.crystal.color}; --bg:#4a3a6a">
            <div class="map-icon">${fOpen ? FINAL_AREA.icon : '🔒'}</div>
            <div class="map-name">${FINAL_AREA.name}</div>
            <div class="map-unit">6개 단원 모두 · 권장 Lv ${FINAL_AREA.levels}</div>
            <div class="map-state">${fDone ? '🏆 클리어' : fOpen ? '이동하기' : '결정 6개 필요'}</div>
          </button>`;
        })()}
      </div>
      <p class="map-note">마을에 직접 걸어가서 워프포인트를 활성화하면 그 마을로 바로 이동할 수 있어요. 마을과 마을은 길로 이어져 있어요.${allOpen ? ' (교사 설정: 모든 마을 열기 켜짐)' : ''}</p>`,
    { className: 'modal-map', overlayType: OVERLAYS.WORLD_MAP });
    m.el.querySelectorAll('[data-village]').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.dataset.village === FINAL_AREA.id) {
          const fOpen = allOpen || VILLAGES.every((v) => s.bossesDefeated.includes(v.id));
          if (!fOpen) this.toast('🔒 여섯 마을의 결정을 모두 되찾으면 열려요.', 'info');
          else { m.close(); this.game.travelTo(FINAL_AREA.id); }
          return;
        }
        const v = VILLAGES.find((x) => x.id === b.dataset.village);
        const open = allOpen || (s.warpPoints || ['fractionValley']).includes(v.id);
        if (!open) {
          if (s.unlockedVillages.includes(v.id)) this.toast('🌀 아직 워프포인트를 발견하지 않았습니다. 길을 따라 걸어가서 마을의 워프포인트를 활성화해 주세요.', 'info', 3200);
          else this.toast('🔒 앞 마을의 보스를 물리치면 그 마을로 가는 길이 열려요.', 'info');
        } else if (!v.home) {
          this.toast(`${v.name}은(는) 4단계에서 만들어져요!`, 'info');
        } else {
          m.close();
          this.game.travelTo(v.id);
        }
      });
    });
    return m;
  }

  openSettings({ inGame }) {
    const a = this.game.audio.settings;
    const m = this.modal(`
      <div class="menu-head">
        <h3 class="panel-title">⚙️ 설정</h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="sec-title">🔊 소리</div>
      ${[['masterVolume', '전체 음량', null], ['bgmVolume', '배경음악', 'bgmOn'], ['sfxVolume', '효과음', 'sfxOn']].map(([k, label, on]) => `
        <div class="audio-row">
          <label for="vol-${k}">${label}</label>
          <input id="vol-${k}" type="range" min="0" max="1" step="0.05" value="${a[k] ?? 0.8}" data-s="${k}">
          <output data-out="${k}">${Math.round((a[k] ?? 0.8) * 100)}%</output>
          ${on ? `<label class="toggle"><input type="checkbox" ${a[on] !== false ? 'checked' : ''} data-s="${on}"> 켜기</label>` : '<span></span>'}
        </div>`).join('')}
      <label class="setting-row check"><span>🔇 모든 소리 끄기 (음소거)</span>
        <input type="checkbox" ${a.muted ? 'checked' : ''} data-s="muted"></label>
      <div class="divider"></div>
      <button class="btn btn-ghost btn-small" data-teacher>👩‍🏫 교사 설정</button>
      <p class="setting-note">소리 설정은 이 기기에 저장돼서 새로고침해도 그대로예요.</p>`, {
      className: 'modal-settings', overlayType: OVERLAYS.SETTINGS,
    });
    m.el.querySelectorAll('[data-s]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const key = inp.dataset.s;
        const val = inp.type === 'checkbox' ? inp.checked : Number(inp.value);
        this.game.setAudioSetting(key, val);
        const out = m.el.querySelector(`[data-out="${key}"]`);
        if (out) out.textContent = `${Math.round(val * 100)}%`;

      });
      inp.addEventListener('change', () => this.game.audio.playSfx('click'));
    });
    m.el.querySelector('[data-teacher]').addEventListener('click', () => {
      m.close();
      this.openTeacherPin();
    });
  }

  openTeacherPin() {
    const m = this.modal(`
      <h3 class="panel-title">👩‍🏫 교사 설정</h3>
      <p class="modal-msg">교사용 비밀번호를 입력하세요.</p>
      <input class="text-input pin-input" type="password" inputmode="numeric" maxlength="12" autocomplete="off" aria-label="비밀번호">
      <div class="field-error" aria-live="polite"></div>
      <div class="row-btns">
        <button class="btn btn-ghost" data-close>취소</button>
        <button class="btn btn-primary" data-ok>확인</button>
      </div>`, { className: 'modal-small', overlayType: OVERLAYS.SETTINGS });
    const input = m.el.querySelector('.pin-input');
    const go = () => {
      if (input.value === String(this.game.config.teacherPin)) {
        m.close();
        this.openTeacherSettings();
      } else {
        m.el.querySelector('.field-error').textContent = '비밀번호가 달라요.';
        input.value = '';
        input.focus();
      }
    };
    m.el.querySelector('[data-ok]').addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => input.focus(), 50);
  }

  openTeacherSettings() {
    const eff = this.game.getEffectiveSettings();
    const m = this.modal(`
      <div class="menu-head">
        <h3 class="panel-title">👩‍🏫 교사 설정</h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <div class="setting-row"><span>원주율</span>
        <div class="seg">
          <button data-pi="3" class="${eff.piValue === 3 ? 'on' : ''}">3</button>
          <button data-pi="3.14" class="${eff.piValue === 3.14 ? 'on' : ''}">3.14</button>
        </div>
      </div>
      <label class="setting-row check"><span>모든 마을 열기</span>
        <input type="checkbox" data-allopen ${eff.allVillagesOpen ? 'checked' : ''}></label>
      <p class="setting-note">이 설정은 <b>이 기기에만</b> 적용돼요.<br>
        반 전체 기본값은 GitHub의 <code>js/config.js</code> 파일에서 바꿀 수 있어요.</p>
      <button class="btn btn-ghost btn-small" data-reset>기본값으로 되돌리기</button>`, {
      className: 'modal-settings', overlayType: OVERLAYS.SETTINGS,
    });
    m.el.querySelectorAll('[data-pi]').forEach((b) => {
      b.addEventListener('click', () => {
        this.game.setTeacherSetting('piValue', Number(b.dataset.pi));
        m.el.querySelectorAll('[data-pi]').forEach((x) => x.classList.toggle('on', x === b));
        this.toast(`원주율을 ${b.dataset.pi}(으)로 설정했어요.`, 'ok');
      });
    });
    m.el.querySelector('[data-allopen]').addEventListener('change', (e) => {
      this.game.setTeacherSetting('allVillagesOpen', e.target.checked);
      this.toast(e.target.checked ? '모든 마을을 열었어요.' : '마을 잠금을 원래대로 했어요.', 'ok');
    });
    m.el.querySelector('[data-reset]').addEventListener('click', () => {
      this.game.resetTeacherSettings();
      m.close();
      this.toast('교사 설정을 기본값으로 되돌렸어요.', 'ok');
    });
  }

  showSaveData() {
    const s = this.game.save;
    const view = {
      nickname: s.nickname, level: s.level, exp: s.exp, gold: s.gold,
      stats: s.stats, pendingLevelBonus: s.pendingLevelBonus,
      correctAnswers: s.correctAnswers, wrongAnswers: s.wrongAnswers,
      currentStreak: s.currentStreak, bestStreak: s.bestStreak,
      equipment: Object.fromEntries(Object.entries(s.equipment).map(([k, v]) => [k, v ? `${v.id} +${v.enhance || 0}` : null])),
      inventory: s.inventory.map((i) => `${i.id}${i.qty !== undefined ? ` ×${i.qty}` : ` +${i.enhance || 0}`}`),
      skills: s.skills, skillSlots: s.skillSlots, quests: s.quests,
      counters: s.counters, achievements: s.achievements,
      mathProgress: s.mathProgress, recentQuestionIds: s.recentQuestionIds,
      saveVersion: s.saveVersion, playTime: Math.floor(s.playTime),
      저장모드: this.game.auth.mode, uid: this.game.auth.uid,
      보내지못한풀이기록: this.game.saveManager.pendingLogCount(),
    };
    this.modal(`
      <div class="menu-head">
        <h3 class="panel-title">💾 저장 데이터</h3>
        <button class="icon-btn" data-close aria-label="닫기">✕</button>
      </div>
      <pre class="json-view">${escapeHtml(JSON.stringify(view, null, 2))}</pre>`, {
      className: 'modal-wide', overlayType: OVERLAYS.DIALOGUE,
    });
  }

  // ---------------- 알림 ----------------
  toast(text, type = 'info', ms = 2600) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = text;
    this.toastLayer.appendChild(el);
    while (this.toastLayer.children.length > 3) this.toastLayer.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  // 큰 배너는 겹치지 않도록 차례대로 보여 줘요 (최대 3개까지 대기)
  banner(title, sub = '') {
    if (!this.bannerQueue) this.bannerQueue = [];
    this.bannerQueue.push({ title, sub });
    while (this.bannerQueue.length > 3) this.bannerQueue.shift();
    if (!this.bannerBusy) this.nextBanner();
  }

  nextBanner() {
    const b = this.bannerQueue.shift();
    if (!b) { this.bannerBusy = false; return; }
    this.bannerBusy = true;
    const el = document.createElement('div');
    el.className = 'big-banner';
    el.innerHTML = `<div class="banner-title">${escapeHtml(b.title)}</div>${b.sub ? `<div class="banner-sub">${escapeHtml(b.sub)}</div>` : ''}`;
    document.getElementById('app').appendChild(el);
    const ms = this.bannerQueue.length ? 1000 : 1500; // 짧게 보였다 사라지는 작은 알림
    setTimeout(() => { el.remove(); this.nextBanner(); }, ms);
  }

  setSaveStatus(status) {
    const info = SAVE_TEXT[status];
    if (!info) return;
    const el = this.saveEl;
    el.textContent = info.text;
    el.className = `save-indicator show ${info.cls}`;
    clearTimeout(this.saveFadeTimer);
    if (info.cls === 'saved') {
      this.saveFadeTimer = setTimeout(() => el.classList.add('dim'), 2500);
    }
  }

  hideSaveStatus() {
    this.saveEl.className = 'save-indicator';
  }

  closeAllModals() {
    // 창을 닫을 때 게임 상태(열린 창 목록)도 함께 정리 — 그냥 지우면 조작이 멈춘 채로 남아요
    for (const el of [...this.overlay.children]) {
      if (el._close) el._close();
      else el.remove();
    }
  }

  // 저장된 오디오 설정 (타이틀 화면용)
  static loadDeviceAudio() {
    return storage.get('mathContinent.audio') || null;
  }
}
