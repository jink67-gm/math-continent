// 게임 전체를 연결하는 중심
// 각 담당(저장, 입력, 화면, 전투, 퀘스트, 수학 문제...)을 만들고, 장면 이동과 메인 루프를 관리합니다.

import { WARP_ARRIVE } from '../data/routes.js';
import { assets } from '../render/AssetManager.js';
import { GAME_CONFIG } from '../config.js';
import { EventBus } from './EventBus.js';
import { GameStateMachine, STATES } from './GameState.js';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { SaveManager } from './SaveManager.js';
import { AchievementManager } from './AchievementManager.js';
import { storage, withTimeout, pick } from './utils.js';
import { FirebaseManager } from '../firebase/FirebaseManager.js';
import { AuthManager } from '../firebase/AuthManager.js';
import { Player, createNewSave, BONUS_OPTIONS } from '../player/Player.js';
import { Inventory } from '../player/Inventory.js';
import { EquipmentManager } from '../player/EquipmentManager.js';
import { SkillManager, SLOT_UNLOCK, SLOT_KEYS } from '../player/SkillManager.js';
import { MathChallengeManager } from '../math/MathChallengeManager.js';
import { Renderer } from '../render/Renderer.js';
import { UIManager } from '../ui/UIManager.js';
import { WorldManager } from '../world/WorldManager.js';
import { QuestManager } from '../world/QuestManager.js';
import { Interactions } from '../world/Interactions.js';
import { createScene } from '../world/scenes.js';
import { getVillage, VILLAGES, FINAL_AREA } from '../data/villages.js';
import { RANKS } from '../data/ranks.js';
import { UNITS } from '../data/units.js';
import { SKILLS } from '../data/skills.js';
import { ITEMS } from '../data/items.js';

const TEACHER_KEY = 'mathContinent.teacher';
const AUDIO_KEY = 'mathContinent.audio';

export class Game {
  constructor() {
    this.config = GAME_CONFIG;
    this.bus = new EventBus();
    this.state = new GameStateMachine(this.bus);
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.firebase = new FirebaseManager();
    this.auth = new AuthManager(this.firebase);
    this.saveManager = new SaveManager({ firebase: this.firebase, auth: this.auth, bus: this.bus, config: this.config });
    this.renderer = new Renderer(document.getElementById('game-canvas'));

    this.inventory = new Inventory(this);
    this.equipment = new EquipmentManager(this);
    this.skills = new SkillManager(this);
    this.quests = new QuestManager(this);
    this.achievements = new AchievementManager(this);
    this.world = new WorldManager(this);
    this.interactions = new Interactions(this);
    this.ui = new UIManager(this);
    this.math = new MathChallengeManager(this);

    this.save = null; // 지금 플레이 중인 기록
    this.existingSave = null; // 타이틀에서 "이어하기"로 불러올 기록
    this.player = null;
    this.time = 0;
    this.lastFrame = 0;
    this.autosaveTimer = null;
    this.trialAt = null;
    this.downHandling = false;
    this.changingScene = false;
    this.holdTrials = false;
    this.hitStop = 0; // 타격 순간 아주 잠깐 멈춤
  }

  get scene() {
    return this.world.scene;
  }

  async boot() {
    this.ui.init();
    const deviceAudio = storage.get(AUDIO_KEY);
    if (deviceAudio) {
      // 예전 '소리 끄기' 설정을 새 설정으로 옮김

      this.audio.applySettings(deviceAudio);
    }
    this.ui.showLoading('모험을 준비하는 중...');
    // 그림 파일 불러오기 (오래 걸려도 6초 뒤에는 그냥 시작 — 나머지는 게임 중에 불러와요)
    try { await withTimeout(assets.init(), 6000, '그림 불러오기'); } catch (e) { console.warn(e); }
    // 글꼴(나눔스퀘어라운드 · 주아, assets/fonts) — 캔버스 글씨(이름표·데미지 숫자)도 같은 글꼴로 그리도록 미리 불러와요
    try {
      if (document.fonts?.load) await withTimeout(Promise.all(['20px Jua', '16px NanumSquareRound', 'bold 16px NanumSquareRound'].map((f) => document.fonts.load(f, '가1'))), 3000, '글꼴 불러오기');
    } catch (e) { console.warn(e); }

    try { await withTimeout(this.firebase.init(), 8000, 'Firebase 연결'); } catch (e) { console.warn(e); }
    try { await withTimeout(this.auth.signIn(), 8000, '로그인'); } catch (e) { console.warn(e); }
    if (!this.auth.uid) this.auth.useLocal();

    try {
      this.existingSave = await this.saveManager.loadBest();
    } catch (e) {
      console.error('[Game] 기록 불러오기 실패', e);
      this.existingSave = null;
    }

    this.bindGlobalEvents();
    this.goTitle();
    requestAnimationFrame((t) => this.loop(t));
  }

  bindGlobalEvents() {
    const flush = () => {
      if (this.save && this.state.inPlay) this.markDirty('leave', { immediate: true });
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    window.addEventListener('pagehide', flush);
  }

  get currentUnit() {
    return getVillage(this.save?.currentVillage).unit;
  }

  // ---------------- 장면 이동 ----------------
  goTitle() {
    if (this.save && this.state.inPlay) {
      this.markDirty('title', { immediate: true });
      this.existingSave = this.save;
    }
    this.stopAutosave();
    this.save = null;
    this.player = null;
    this.world.endBossFight();
    this.world.scene = null;
    this.ui.hideBossBar();
    this.ui.closeAllModals();
    this.ui.showHUD(false);
    this.input.reset();
    this.state.setBase(STATES.TITLE);
    this.audio.playBgm('title');
    this.ui.showTitle(this.existingSave, {
      onNew: () => this.newGame(),
      onContinue: () => this.continueGame(),
      onSettings: () => this.ui.openSettings({ inGame: false }),
    });
  }

  async newGame() {
    this.audio.playSfx('click');
    const old = this.existingSave;
    if (old) {
      const ok1 = await this.ui.confirm({
        title: '새 게임',
        message: '현재 모험 기록이 있습니다.\n새 게임을 시작하면 기존 기록을 초기화합니다.',
        okText: '계속',
        danger: true,
      });
      if (!ok1) return;
      const ok2 = await this.ui.confirm({
        title: '정말 초기화할까요?',
        message: `「${old.nickname}」의 Lv ${old.level} 모험 기록이 사라지고,\n되돌릴 수 없어요.`,
        okText: '초기화하고 새로 시작',
        cancelText: '그만두기',
        danger: true,
      });
      if (!ok2) return;
    }
    this.state.setBase(STATES.CHARACTER_SETUP);
    const info = await this.ui.showCharacterSetup();
    if (!info) {
      this.goTitle();
      return;
    }
    const save = createNewSave({ ...info, uid: this.auth.uid });
    save.settings = { ...this.audio.settings };
    this.startPlay(save, { isNew: true });
  }

  continueGame() {
    if (!this.existingSave) return;
    this.audio.playSfx('click');
    this.startPlay(this.existingSave, { isNew: false });
  }

  startPlay(save, { isNew }) {
    this.ui.clearScreen();
    this.save = save;
    this.equipment.giveStarterKit();
    // ② 개발 점검용 맵(예전 '새싹 마을' 등)에 저장돼 있던 기록은 정식 지역(출발의 초원)에서 이어서
    const devParam = new URLSearchParams(location.search).get('test');
    if (/^test/.test(String(save.currentArea)) && !devParam) {
      save.currentArea = 'meadow';
      save.position = null;
    }
    const scene = createScene(save.currentArea);
    if (!save.position || save.currentArea !== scene.id) save.position = { ...scene.spawn };
    this.player = new Player(save);
    this.world.load(scene);
    this.skills.reset();
    this.equipment.clampHp();
    if (save.stats.hp <= 0) save.stats.hp = this.equipment.totals().maxHp;
    this.renderer.snapCamera(scene, this.player);
    if (!save.visitedVillages.includes(save.currentVillage)) save.visitedVillages.push(save.currentVillage);

    this.state.setBase(STATES.FIELD);
    this.ui.showHUD(true);
    this.audio.playBgm(scene.bgm || getVillage(save.currentVillage).bgm);
    this.achievements.check({ silent: true });
    this.markDirty(isNew ? 'new' : 'continue', { immediate: true });
    this.existingSave = save;
    this.startAutosave();
    // 주소 끝에 ?test=village 또는 ?test=forest 를 붙이면 새 에셋 테스트 맵으로 바로 이동
    const testMap = new URLSearchParams(location.search).get('test');
    if (testMap && !String(save.currentArea).startsWith('test')) {
      setTimeout(() => this.changeScene(testMap === 'forest' ? 'testForest' : 'testVillage'), 600);
    }

    if (isNew) {
      this.ui.alert({
        title: '수학 대륙에 온 것을 환영해요!',
        okText: '모험 시작!',
        html: `
          <p><b>${save.nickname.replace(/[<>&]/g, '')}</b> 모험가님, 반가워요!</p>
          <ul class="welcome-list">
            <li>먼저 <b>안내 요정 피피</b>에게 말을 걸어 보세요.</li>
            <li>몬스터를 물리치면 경험치와 아이템을 얻어요.</li>
            <li>레벨이 오르면 <b>⭐ 성장 시험</b>, 스킬을 배울 땐 <b>🔮 수학의 룬</b>!</li>
            <li>오른쪽 위에 <b>저장 표시</b>가 보이면 기록이 저장된 거예요.</li>
          </ul>`,
      });
    } else {
      this.ui.toast(`어서 와요, ${save.nickname}! 모험을 이어서 시작해요.`, 'ok');
      if (save.pendingLevelBonus > 0) {
        setTimeout(() => this.ui.toast(`도전하지 않은 성장 시험이 ${save.pendingLevelBonus}개 있어요. 위쪽 ⭐ 버튼!`, 'info', 4000), 900);
      }
    }
  }

  // ---------------- 저장 ----------------
  markDirty(reason, { immediate = false } = {}) {
    if (!this.save) return;
    if (this.player && !this.player.dead) {
      this.save.position = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    }
    if (this.scene) this.save.currentArea = this.scene.id;
    this.save.stats.hp = Math.floor(this.save.stats.hp);
    this.saveManager.save(this.save, { immediate });
    this.ui.updateHUD();
  }

  startAutosave() {
    this.stopAutosave();
    this.autosaveTimer = setInterval(() => {
      if (this.save && this.state.inPlay) this.markDirty('periodic');
    }, this.config.autosaveIntervalSec * 1000);
  }

  stopAutosave() {
    clearInterval(this.autosaveTimer);
    this.autosaveTimer = null;
  }

  // ---------------- 메인 루프 ----------------
  loop(now) {
    const dt = Math.min(0.05, (now - (this.lastFrame || now)) / 1000);
    this.lastFrame = now;
    this.time += dt;

    if (this.state.inPlay && this.player && this.scene) {
      if (this.state.gameplayActive) {
        if (this.input.consume('menu')) this.openMenu();
        else if (this.input.consume('inventory')) this.ui.openBag();
      }
      let wdt = dt;
      if (this.hitStop > 0) {
        this.hitStop -= dt;
        wdt = dt * 0.06;
      }
      this.world.update(wdt);
      if (!document.hidden) this.save.playTime += dt;
      this.renderer.render(this.world, this.player, this.save.appearance.color, this.time, dt, this.save);
      this.ui.updateSkillBar();

      if (this.world.boss) this.ui.updateBossBar(this.world.boss);

      // 레벨업 직후 성장 시험 (다른 창이 닫힌 뒤에, 보스전 중에는 끝난 뒤에)
      if (this.trialAt !== null && this.time >= this.trialAt && this.state.gameplayActive && !this.player.dead && !this.world.boss && !this.holdTrials) {
        this.trialAt = null;
        this.runGrowthTrial();
      }
    }

    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---------------- 성장 ----------------
  gainExp(amount) {
    const levels = this.player.addExp(amount);
    if (levels > 0) this.onLevelUp(levels);
    else {
      setTimeout(() => this.audio.playSfx('exp'), 180);
      this.markDirty('exp');
    }
  }

  onLevelUp(levels) {
    const s = this.save;
    this.equipment.clampHp();
    this.audio.playSfx('levelUp');
    this.ui.banner('LEVEL UP!', `Lv ${s.level} · HP·공격력·방어력 상승`);
    this.renderer.addFloater('LEVEL UP!', this.player.x, this.player.y - 60, '#ffe066', 26);
    s.pendingLevelBonus += levels;
    this.bus.emit('level:up', { level: s.level });
    this.markDirty('levelup', { immediate: true });
    this.trialAt = this.time + 1.2;
    const nr = this.nextRank();
    if (nr && s.level === nr.level) {
      setTimeout(() => this.ui.toast(`🎖️ 승급 시험을 볼 수 있어요! 룬 현자를 찾아가 보세요. (${nr.name})`, 'info', 4000), 2600);
    }
    // 스킬 칸이 새로 열렸으면 안내
    const opened = SLOT_UNLOCK.map((lv, i) => (s.level >= lv && s.level - levels < lv && i > 0 ? i : -1)).filter((i) => i > 0);
    for (const i of opened) {
      setTimeout(() => {
        this.ui.banner('스킬 칸 열림!', `${i + 1}번 스킬 칸을 쓸 수 있어요`);
        this.ui.toast(`🔓 ${i + 1}번 스킬 칸이 열렸어요! 메뉴 → 스킬에서 배운 스킬을 넣어 보세요.`, 'ok', 4000);
        this.ui.updateSkillBar?.(true);
      }, 1500);
    }
    const newSkill = this.skills.learnable();
    if (newSkill.length) {
      setTimeout(() => this.ui.toast(`✨ 새 스킬을 배울 수 있어요! 룬 할아버지를 찾아가 보세요.`, 'info', 3500), 1800);
    }
  }

  // 성장 시험: 맞히면 보너스 능력치 선택, 미루면 ⭐ 버튼으로 나중에
  async runGrowthTrial() {
    const s = this.save;
    if (!s || s.pendingLevelBonus <= 0 || this.math.active || this.state.overlays.length) return;
    const res = await this.math.start({ context: 'levelup', allowLater: true });
    if (!this.save) return;
    if (res.correct) {
      const id = await this.ui.pickLevelBonus();
      this.player.applyBonus(id);
      s.pendingLevelBonus = Math.max(0, s.pendingLevelBonus - 1);
      this.equipment.clampHp();
      this.audio.playSfx('confirm');
      const opt = BONUS_OPTIONS.find((o) => o.id === id);
      this.ui.toast(`${opt.icon} ${opt.label}! ${opt.desc}`, 'ok');
      this.markDirty('bonus', { immediate: true });
      if (s.pendingLevelBonus > 0) {
        setTimeout(() => this.ui.toast(`남은 성장 시험 ${s.pendingLevelBonus}개 — 위쪽 ⭐ 버튼`, 'info'), 700);
      }
    } else if (res.deferred) {
      this.ui.toast('성장 시험은 위쪽 ⭐ 버튼으로 언제든 다시 도전할 수 있어요.', 'info', 3500);
      this.ui.updateHUD();
    }
  }

  // 스킬 배우기: 수학의 룬 문제 → 정답이면 NEW SKILL!
  async learnSkill(id) {
    const def = SKILLS[id];
    if (!this.skills.canLearn(id).ok) return;
    const res = await this.math.start({
      context: 'skill',
      title: `스킬의 룬 · ${def.name}`,
      allowLater: true,
    });
    if (!res.correct || !this.save) return;
    this.skills.learn(id);
    this.audio.playSfx('skillLearn');
    this.ui.banner('NEW SKILL!', `${def.icon} ${def.name}`);
    const slot = this.save.skillSlots.indexOf(id);
    const key = this.input.isTouch ? `${slot + 1}번 스킬 버튼` : `${SLOT_KEYS[slot]?.[0]} 또는 ${SLOT_KEYS[slot]?.[1]} 키`;
    setTimeout(() => {
      this.ui.toast(slot >= 0 ? `${def.icon} ${def.name}: ${key}로 사용해요!` : `메뉴 → 스킬에서 ${def.name}을(를) 칸에 넣어 주세요.`, 'ok', 3500);
    }, 1200);
    this.markDirty('skill', { immediate: true });
  }

  usePotion() {
    const uid = this.inventory.quickPotionUid();
    if (!uid) {
      this.world.toastOnce('noPotion', '회복약이 없어요.', 'warn');
      return;
    }
    const res = this.inventory.use(uid);
    if (res.ok) {
      this.audio.playSfx('potion');
      this.renderer.addFloater(`+${res.healed} HP`, this.player.x, this.player.y - 50, '#7dff9a', 20);
      this.markDirty('potion');
    } else {
      this.world.toastOnce('potionFull', res.reason, 'info');
    }
  }

  // ---------------- 장면 이동 ----------------
  async changeScene(id, spawn) {
    if (this.changingScene || !this.save) return;
    this.changingScene = true;
    this.input.reset();
    await this.ui.fade(true);
    if (!this.save) {
      this.changingScene = false;
      return;
    }
    const scene = createScene(id);
    this.world.load(scene);
    this.player.x = spawn?.x ?? scene.spawn.x;
    this.player.y = spawn?.y ?? scene.spawn.y;
    this.player.knock = { x: 0, y: 0 };
    this.save.currentArea = scene.id;
    this.save.currentVillage = scene.village || this.save.currentVillage;
    if (!this.save.visitedVillages.includes(this.save.currentVillage)) this.save.visitedVillages.push(this.save.currentVillage);
    this.renderer.snapCamera(scene, this.player);
    this.audio.playBgm(scene.bgm || getVillage(this.save.currentVillage).bgm);
    this.markDirty('scene', { immediate: true });
    await this.ui.fade(false);
    this.ui.toast(`📍 ${scene.name}`, 'info', 1800);
    this.changingScene = false;
  }

  travelTo(villageId) {
    if (this.world.boss) {
      this.ui.toast('보스와 싸우는 중에는 이동할 수 없어요!', 'warn');
      return;
    }
    const v = villageId === FINAL_AREA.id ? FINAL_AREA : getVillage(villageId);
    if (!v.home) return;
    // 마을로 빠른 이동하면 그 마을 워프포인트 앞에 도착 (최종 지역은 기존 위치)
    const at = villageId === FINAL_AREA.id ? { x: v.home.x, y: v.home.y } : WARP_ARRIVE;
    this.changeScene(v.home.scene, at);
  }

  // ---------------- 보스 ----------------
  onBossStart(boss) {
    this.audio.playBgm('boss');
    this.audio.playSfx('bossAppear');
    this.ui.banner(`${boss.name} 등장!`, '봉인이 나타나면 수학 문제로 깨뜨리세요');
    this.ui.showBossBar(boss);
    this.world.shake(8);
  }

  // 수학의 봉인: 정답을 맞힐 때까지 (틀리면 5초 대기 · 3번 틀리면 쉬운 문제로) → 보호막 파괴
  async bossSeal(boss) {
    this.audio.playSfx('shieldUp');
    const res = await this.math.start({
      context: 'boss',
      unit: boss.def.unit || this.currentUnit,
      npcLine: boss.def.sealLine || `${boss.name}이(가) 수학의 보호막을 펼쳤다! 문제를 풀어 봉인을 깨뜨리자!`,
      allowLater: false,
    });
    if (!this.save || boss.dead || this.world.boss !== boss) return;
    if (res.correct || res.skipped) {
      boss.breakShield();
      this.audio.playSfx('sealBreak');
      this.ui.banner('보호막 파괴!', `${boss.name}이(가) 잠시 기절했어요! 지금이 기회!`);
      this.world.shake(10);
    } else {
      boss.sealPending = true;
    }
  }

  onBossDefeated(boss) {
    if (boss.def.village === FINAL_AREA.id) {
      this.onFinalBossDefeated(boss);
      return;
    }
    const s = this.save;
    const v = getVillage(boss.def.village || s.currentVillage);
    this.world.boss = null;
    this.ui.hideBossBar();
    if (!s.bossesDefeated.includes(v.id)) s.bossesDefeated.push(v.id);
    if (!s.crystals.includes(v.id)) s.crystals.push(v.id);
    const next = VILLAGES.find((x) => x.order === v.order + 1);
    if (next && !s.unlockedVillages.includes(next.id)) s.unlockedVillages.push(next.id);
    this.bus.emit('boss:defeated', { id: boss.id, village: v.id });
    // 승리 음악을 잠깐 연주한 뒤 원래 음악으로
    this.audio.playSfx('bossDefeat');
    this.audio.playBgm('clear');
    const sceneId = this.scene.id;
    setTimeout(() => { if (this.scene?.id === sceneId && !this.world.boss) this.audio.playBgm(this.scene.bgm); }, 9000);
    this.ui.banner('BOSS CLEAR!', `${boss.name}을(를) 물리쳤어요!`);
    this.markDirty('boss', { immediate: true });
    this.holdTrials = true;
    setTimeout(async () => {
      if (!this.save) {
        this.holdTrials = false;
        return;
      }
      await this.ui.alert({
        title: `💎 ${v.crystal.name}을(를) 되찾았어요!`,
        okText: '좋아요!',
        html: `
          <div class="crystal-get" style="--c:${v.crystal.color}"><span class="crystal"><i></i></span></div>
          <p><b>${v.name}</b>의 풍차가 다시 힘차게 돌기 시작했어요!</p>
          <ul class="welcome-list">
            <li>바닥에 떨어진 보상을 주워 가세요.</li>
            <li>보스 방의 <b>빛나는 포털</b>을 타면 마을로 돌아가요.</li>
            <li>촌장님께 보고하면 추가 보상이 있어요.</li>
            ${next ? `<li>🗺️ 다음 마을 <b>「${next.name}」</b>이(가) 열렸어요! 월드맵에서 이동하세요.</li>` : ''}
            ${this.allSixCleared() ? '<li>🌀 여섯 결정이 모두 모였어요! <b>「혼돈의 첨탑」</b>이 열렸어요!</li>' : ''}
          </ul>`,
      });
      this.holdTrials = false;
      if (this.save?.pendingLevelBonus > 0) this.trialAt = this.time + 0.8;
    }, 1600);
  }

  allSixCleared() {
    return VILLAGES.every((v) => this.save.bossesDefeated.includes(v.id));
  }

  // 최종 보스: 엔딩
  onFinalBossDefeated(boss) {
    const s = this.save;
    this.world.boss = null;
    this.ui.hideBossBar();
    if (!s.bossesDefeated.includes(FINAL_AREA.id)) s.bossesDefeated.push(FINAL_AREA.id);
    s.endingSeen = true;
    this.bus.emit('boss:defeated', { id: boss.id, village: FINAL_AREA.id });
    this.audio.playSfx('bossDefeat');
    this.audio.playBgm('clear');
    this.ui.banner('ALL CLEAR!', '수학 대륙에 평화가 찾아왔어요');
    this.markDirty('final', { immediate: true });
    this.holdTrials = true;
    setTimeout(async () => {
      if (!this.save) { this.holdTrials = false; return; }
      await this.ui.showEnding(s);
      this.holdTrials = false;
      if (this.save?.pendingLevelBonus > 0) this.trialAt = this.time + 0.8;
    }, 1800);
  }

  // 승급 시험 (룬 현자에게서)
  nextRank() {
    const r = RANKS[(this.save.rank || 0) + 1];
    return r || null;
  }

  async rankUp() {
    const r = this.nextRank();
    if (!r || this.save.level < r.level) return;
    const res = await this.math.start({
      context: 'classUp',
      title: `승급 시험 · ${r.name}`,
      npcLine: '지금까지 배운 수학의 핵심을 보여 다오. 맞히면 새로운 힘이 깨어난다!',
      allowLater: true,
    });
    if (!res.correct || !this.save) return;
    const st = this.save.stats;
    st.attack += r.bonus.attack;
    st.defense += r.bonus.defense;
    st.maxHp += r.bonus.maxHp;
    st.hp += r.bonus.maxHp;
    this.save.rank = r.id;
    this.audio.playSfx('levelUp');
    this.ui.banner('승급!', `🎖️ ${r.name} (공격 +${r.bonus.attack} · 방어 +${r.bonus.defense} · HP +${r.bonus.maxHp})`);
    this.bus.emit('level:up', { level: this.save.level });
    this.markDirty('rank', { immediate: true });
  }

  // 보스전 도중 쓰러졌을 때
  onBossEnd() {
    this.ui.hideBossBar();
    this.audio.playBgm(this.scene.bgm);
    this.ui.toast('보스의 체력이 다시 회복됐어요. 준비가 되면 다시 도전하세요!', 'info', 4000);
  }

  interact(obj) {
    this.interactions.run(obj);
  }

  onPlayerDown() {
    if (this.downHandling) return;
    this.downHandling = true;
    this.save.counters.deaths = (this.save.counters.deaths || 0) + 1;
    this.audio.playSfx('playerHurt');
    setTimeout(async () => {
      await this.ui.alert({
        title: '쓰러졌어요!',
        okText: '다시 일어나기',
        html: '<p>괜찮아요! 잃어버린 것은 하나도 없어요.<br>출발 지점에서 체력을 모두 회복하고 다시 시작해요.</p>',
      });
      this.downHandling = false;
      if (!this.save) return;
      this.world.respawnPlayer();
      this.markDirty('revive', { immediate: true });
    }, 900);
  }

  // ---------------- 메뉴·설정 ----------------
  openMenu() {
    if (!this.save || this.state.overlays.length) return;
    this.audio.playSfx('click');
    this.ui.openMenu({
      inventory: () => this.ui.openBag('all'),
      equipment: () => this.ui.openBag('equipment'),
      quests: () => this.ui.openQuests(),
      skills: () => this.ui.openSkills('manage'),
      achievements: () => this.ui.openAchievements(),
      map: () => this.ui.openWorldMap(),
      home: () => {
        // 마을로 귀환: 지금 마을의 워프포인트가 켜져 있으면 그 마을, 아니면 가장 최근에 켠 워프포인트 마을
        const wp = this.save.warpPoints || ['fractionValley'];
        const allOpen = this.getEffectiveSettings().allVillagesOpen;
        const target = allOpen || wp.includes(this.save.currentVillage) ? this.save.currentVillage : wp[wp.length - 1];
        if (target !== this.save.currentVillage) this.ui.toast('이 마을의 워프포인트가 아직 꺼져 있어서, 마지막으로 켠 워프포인트로 돌아가요.', 'info', 2600);
        this.travelTo(target);
      },
      settings: () => this.ui.openSettings({ inGame: true }),
      title: () => this.goTitle(),
      saveNow: () => {
        this.markDirty('manual', { immediate: true });
        this.ui.toast('저장했어요!', 'ok');
      },
    });
  }

  setAudioSetting(key, value) {
    this.audio.applySettings({ [key]: value });
    storage.set(AUDIO_KEY, this.audio.settings);
    if (this.save) {
      this.save.settings = { ...this.audio.settings };
      this.markDirty('settings');
    }
  }

  getTeacherSettings() {
    return storage.get(TEACHER_KEY) || {};
  }

  // 교사 설정(이 기기) > config.js 기본값
  getEffectiveSettings() {
    const t = this.getTeacherSettings();
    return {
      piValue: t.piValue === 3 || t.piValue === 3.14 ? t.piValue : this.config.piValue,
      allVillagesOpen: typeof t.allVillagesOpen === 'boolean' ? t.allVillagesOpen : this.config.allVillagesOpen,
    };
  }

  setTeacherSetting(key, value) {
    storage.set(TEACHER_KEY, { ...this.getTeacherSettings(), [key]: value });
  }

  resetTeacherSettings() {
    storage.remove(TEACHER_KEY);
  }

  // ---------------- 테스트 버튼 (config.devTools) ----------------
  async devAction(act) {
    if (!this.save || this.state.overlays.length) return;
    if (act === 'exp') {
      this.renderer.addFloater('+20 EXP', this.player.x, this.player.y - 46, '#ffe066');
      this.gainExp(20);
    } else if (act === 'gold') {
      this.save.gold += 25;
      this.audio.playSfx('item');
      this.renderer.addFloater('+25 G', this.player.x, this.player.y - 46, '#ffd24d');
      this.markDirty('gold');
    } else if (act === 'item') {
      const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].type === 'equipment');
      const id = pick(ids);
      if (this.inventory.add(id, 1)) {
        this.ui.toast(`${ITEMS[id].icon} ${ITEMS[id].name}을(를) 받았어요.`, 'ok');
        this.markDirty('dev-item');
      }
    } else if (act === 'heal') {
      this.save.stats.hp = this.equipment.totals().maxHp;
      this.markDirty('dev-heal');
    } else if (act === 'q2' || act === 'q4') {
      const d = act === 'q4' ? 4 : this.math.difficultyFor('test');
      await this.math.start({ context: d === 4 ? 'boss' : 'test', difficulty: d, allowLater: true });
    } else if (act === 'pi') {
      await this.math.start({ context: 'test', unit: 'circle', difficulty: 1 + Math.floor(Math.random() * 3), allowLater: true });
    } else if (act === 'save') {
      this.ui.showSaveData();
    }
  }
}
