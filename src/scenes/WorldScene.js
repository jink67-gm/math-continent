// 마을과 필드가 함께 쓰는 바탕 장면: 주인공, 카메라, 키보드, HUD, 전투, 저장, 출구
// 각 장면은 buildWorld()에서 땅·건물·사람·몬스터를 놓고, spawnPoint()로 시작 위치를 정해요.

import { Player } from '../world/Player.js';
import { Combat } from '../combat/Combat.js';
import { RemotePlayer } from '../world/RemotePlayer.js';
import { ASSET_ROOT, BGM, HEROES } from '../data/assets.js';
import { normalizeStats, refreshMax, statsOf, DIFFICULTY, DIFF_ORDER } from '../data/rules.js';
import { weaponOf, giveItem, itemDef } from '../data/items.js';
import { openShop, openForge, openBag, openWorldMap, openCharacter, openTravel, openQuests } from '../ui/Panels.js';
import { textStyle, crisp, ZOOM } from '../ui/style.js';
import { SKILL_KEYS } from '../data/skills.js';

export { ZOOM };

export class WorldScene extends Phaser.Scene {
  // info: { id, name, subtitle, bgm, mapV }
  init(data) {
    this.entry = data?.entry || null;
    if (data?.region) this.region = data.region;
  }

  // 퀘스트 화살표·장소 이름 (2~6번 마을의 첨탑만 따로 구분해요)
  get placeKey() { return this.region === 'chaosSpire' ? `${this.scene.key}:chaosSpire` : this.scene.key; }
  // 협동: 같은 지도에 있는지 비교할 때 쓰는 이름 (지역·지도까지 구분)
  get syncKey() { return `${this.scene.key}:${this.region || this.mapId || ''}`; }

  preload() {
    const key = this.info.bgm;
    if (!this.cache.audio.exists(key)) this.load.audio(key, BGM[key].map((p) => ASSET_ROOT + p));
  }

  create() {
    const stats = normalizeStats(this.registry.get('player'));
    // 같은 장면을 다시 열 때 이전 값이 남지 않게
    this.leaving = false;
    this.worldPaused = false;
    this.boss = null;
    this.solids = this.physics.add.staticGroup();
    this.npcs = [];
    this.spots = [];
    this.exits = [];
    this.mapBuildings = [];
    this.combat = new Combat(this);

    this.buildWorld();
    this.physics.world.setBounds(0, 0, this.mapW, this.mapH);

    // 주인공: 출구로 들어왔으면 그 앞에서, 이어하기면 저장된 자리에서
    const saved = !this.entry && (stats.area || stats.village) === this.info.id && stats.pos && stats.mapV === this.info.mapV ? stats.pos : null;
    const at = saved || this.spawnPoint(this.entry);
    this.player = new Player(this, at.x, at.y, HEROES[stats.gender] || HEROES.male);
    this.physics.add.collider(this.player.feet, this.solids);
    this.player.setWeapon(weaponOf(stats).hand);
    this.player.speedMul = 1 + statsOf(stats).speed;
    for (const n of this.npcs) {
      this.physics.add.collider(this.player.feet, n.feet);
      if (n.def.wander) this.physics.add.collider(n.feet, this.solids);
    }
    for (const e of this.exits) {
      const z = this.add.zone(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h);
      this.physics.add.existing(z, true);
      this.physics.add.overlap(this.player.feet, z, () => this.onExit(e));
    }
    // 들어오자마자 다시 나가지 않게
    this.exitCooldown = this.time.now + 1200;

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, this.mapW, this.mapH).setRoundPixels(true);
    // 카메라는 주인공을 따라가요. 보스가 깨어 있으면 보스 쪽으로 조금 당겨서 둘 다 보이게 해요
    this.camFocus = this.add.zone(at.x, at.y, 1, 1);
    cam.startFollow(this.camFocus, true, 0.12, 0.12, 0, 0);
    cam.fadeIn(500, 0, 0, 0);

    this.setupKeys();
    this.scene.launch('Hud', { worldKey: this.scene.key, info: this.info });
    this.hud = this.scene.get('Hud');
    this.quests = this.game.quests;
    this.quests.scene = this;
    this.time.delayedCall(700, () => { this.quests.onEnter(this.scene.key, this.region, this.placeKey); if (this.mapId) this.quests.onEnterMap(this.mapId); });
    // 처음 시작하면 안내 정령 피피가 먼저 다가와 말을 걸어요
    const guide = this.npcs.find((n) => n.id === this.quests.step?.target && this.quests.step?.id === 'pipi');
    if (guide) {
      let tries = 0;
      const greet = () => {
        if (this.quests.step?.id !== 'pipi' || this.hud?.dialogOpen) return;
        if (this.locked && ++tries < 10) { this.time.delayedCall(500, greet); return; }
        if (!this.locked) this.talkTo(guide);
      };
      this.time.delayedCall(1400, greet);
    }

    this.sound.stopAll();
    this.bgm = this.sound.add(this.info.bgm, { loop: true, volume: 0.4 });
    this.bgm.play();

    // 자동 저장: 3분마다 + 창을 닫거나 다른 앱으로 넘어갈 때
    this.lastTick = this.time.now;
    this.time.addEvent({ delay: 180000, loop: true, callback: () => this.saveGame() });
    // 선생님의 선물·학급 설정: 들어올 때 한 번, 그 뒤 90초마다 확인
    this.time.delayedCall(2500, () => this.checkTeacher());
    this.time.addEvent({ delay: 90000, loop: true, callback: () => this.checkTeacher() });
    const saveNow = () => this.saveGame({ now: true });
    this.game.events.on('save:now', saveNow);
    this.events.once('shutdown', () => {
      this.bgm?.stop();
      this.game.events.off('save:now', saveNow);
      this.scene.stop('Hud');
    });
  }

  addSolid(x, y, w, h) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.add(z);
    return z;
  }

  placeObject(o) {
    const sheet = this.objectSheet(o.k);
    const img = this.add.image(Math.round(o.x), Math.round(o.y), sheet, o.k).setOrigin(0.5, 1);
    img.setDepth(o.flat ? -900 : o.y);
    if (o.solid === 'building') {
      // 지붕은 지나갈 수 있게 아래쪽(벽)만 막아요
      const w = img.width - 4;
      const h = Math.min(img.height * 0.45, 26);
      this.addSolid(o.x - w / 2, o.y - h, w, h - 1);
    } else if (Array.isArray(o.solid)) {
      const [w, h] = o.solid;
      this.addSolid(o.x - w / 2, o.y - h, w, h);
    }
    return img;
  }

  objectSheet(name) {
    for (const s of ['na/house', 'na/nature', 'na/element', 'na/reliefd', 'zl/props', 'zl/town', 'na/laundry']) if (this.textures.get(s).has(name)) return s;
    return 'na/nature';
  }

  setupKeys() {
    const k = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,J,K,E,Q,SPACE,ENTER,ONE,TWO,THREE,FOUR,U,I,O,L');
    this.keys = k;
    const dlg = () => this.hud?.dialogOpen;
    k.SPACE.on('down', () => (dlg() ? this.hud.advanceDialog() : this.combat.dodge(...this.moveInput())));
    k.E.on('down', () => (dlg() ? this.hud.advanceDialog() : this.interact()));
    k.ENTER.on('down', () => dlg() && this.hud.advanceDialog());
    k.J.on('down', () => (dlg() ? this.hud.advanceDialog() : this.combat.attack()));
    // 스킬: 1~4 또는 U·I·O·L (K는 예전처럼 첫 번째 스킬)
    [['ONE', 'U'], ['TWO', 'I'], ['THREE', 'O'], ['FOUR', 'L']].forEach((names, i) => {
      for (const n of names) k[n].on('down', () => !dlg() && this.combat.castSkill(i));
    });
  }

  // ── 입력 ─────────────────────────────────────
  moveInput() {
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (this.hud?.joy && (this.hud.joy.x || this.hud.joy.y)) { vx = this.hud.joy.x; vy = this.hud.joy.y; }
    return [vx, vy];
  }

  moveInputOr(fallback) {
    const [vx, vy] = this.moveInput();
    return Math.hypot(vx, vy) > 0.15 ? [vx, vy] : fallback;
  }

  get locked() { return !!this.hud?.dialogOpen || this.player?.state === 'down' || !!this.game.runes?.open || !!this.game.panelOpen; }

  // 빛줄기 폭발: 가운데에서 밝은 선이 사방으로 쫙 퍼졌다가 사라져요 (스킬 · 3단 베기)
  burst(x, y, { color = 0xfff2b0, rays = 14, len = 34, ms = 260, depth = 0, width = 2.2 } = {}) {
    const g = this.add.graphics({ x, y }).setDepth(depth).setBlendMode('ADD');
    const R = Phaser.Math;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + R.FloatBetween(-0.18, 0.18);
      const l = len * R.FloatBetween(0.55, 1.1);
      const w = width * R.FloatBetween(0.6, 1.2);
      const c = Math.cos(a);
      const s = Math.sin(a);
      // 바깥쪽 색 줄기 + 안쪽 흰 심
      g.fillStyle(color, 0.85).fillTriangle(-s * w, c * w, s * w, -c * w, c * l, s * l);
      g.fillStyle(0xffffff, 0.9).fillTriangle(-s * w * 0.4, c * w * 0.4, s * w * 0.4, -c * w * 0.4, c * l * 0.6, s * l * 0.6);
    }
    g.fillStyle(color, 0.4).fillCircle(0, 0, len * 0.22);
    g.fillStyle(0xffffff, 0.9).fillCircle(0, 0, len * 0.1);
    g.setScale(0.35).setRotation(R.FloatBetween(0, Math.PI));
    this.tweens.add({ targets: g, scale: 1, duration: ms * 0.45, ease: 'Cubic.out' });
    this.tweens.add({ targets: g, alpha: 0, duration: ms * 0.6, delay: ms * 0.4, onComplete: () => g.destroy() });
    return g;
  }

  fx(anim, sheet, x, y, { angle = 0, scale = 1, depth = 0, add = false, flipY = false } = {}) {
    const s = this.add.sprite(x, y, sheet, 0).setAngle(angle).setScale(scale).setDepth(depth).setFlipY(flipY);
    if (add) s.setBlendMode('ADD');
    s.play(anim);
    s.once('animationcomplete', () => s.destroy());
    return s;
  }

  // ── 대화·살펴보기 ─────────────────────────────
  nearest() {
    const px = this.player.x;
    const py = this.player.y;
    let best = null;
    let bestD = Infinity;
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - px, (n.y - py) * 1.3);
      if (d < 22 && d < bestD) { best = { type: 'npc', npc: n, x: n.x, y: n.y + n.headY - 4 }; bestD = d; }
    }
    for (const s of this.spots) {
      const d = Math.hypot(s.x - px, (s.y - py) * 1.3);
      if (d < s.r && d < bestD) { best = { type: 'spot', spot: s, x: s.x, y: s.y - 20 }; bestD = d; }
    }
    // 협동: 쓰러진 친구 곁에 가면 일으킬 수 있어요
    const r = this.combat.remote;
    if (r && r.state === 'down' && Math.hypot(r.x - px, r.y - py) < 24) best = { type: 'revive', x: r.x, y: r.y - 22, spot: { label: '일으키기' } };
    return best;
  }

  interact() {
    if (this.locked) return;
    const t = this.nearest();
    if (!t) return;
    if (t.type === 'revive') {
      this.game.party.send({ t: 'revive' });
      this.fx('fx_sparkc', 'na/sparkc', t.x, t.y + 14, { scale: 1.3, depth: t.y + 40, add: true }).setTint(0x9dff9d);
      this.sound.play('sfx_heal', { volume: 0.5 });
      this.hud.toast('친구를 일으켰어요!');
      return;
    }
    if (t.type === 'npc') { this.talkTo(t.npc); return; }
    this.useSpot(t.spot);
  }

  talkTo(n) {
    n.face(this.player.x, this.player.y);
    n.setTalking(true);
    if (this.player.canAct) this.player.faceTo(n.x, n.y);
    const q = this.quests.talk(n.id);
    this.hud.openDialog({
      name: n.def.name, portrait: `face/${n.key}`, lines: q ? q.lines : n.nextLines(),
      onClose: () => {
        n.setTalking(false);
        q?.after?.();
        if (!q && n.def.role === 'shop') openShop(this.game, this);
        if (!q && n.def.role === 'forge') openForge(this.game, this);
      },
    });
  }

  useSpot(s) {
    const stats = this.registry.get('player');
    if (s.kind === 'heal') {
      stats.hp = stats.maxHp;
      stats.sp = stats.maxSp;
      this.sound.play('sfx_heal', { volume: 0.6 });
      this.fx('fx_sparkc', 'na/sparkc', this.player.x, this.player.y - 8, { scale: 1.2, depth: this.player.y + 30, add: true });
      // 마을 샘 = 체크포인트: 처음 쓰면 등록되고, 등록한 마을끼리 빠르게 이동할 수 있어요
      const town = this.mapId && this.rc?.town === this.mapId ? this.mapId : null;
      stats.waypoints ??= [];
      const fresh = town && !stats.waypoints.includes(town);
      if (fresh) stats.waypoints.push(town);
      this.time.delayedCall(10, () => this.saveGame({ now: !!fresh }));
      const lines = [...(s.lines?.[0] || ['HP와 SP가 모두 회복됐어요!'])];
      if (fresh) lines.push('✦ 이 마을이 체크포인트로 등록됐어요! 다른 마을의 샘이나 지도(M)에서 빠르게 이동할 수 있어요.');
      this.hud.openDialog({ name: s.name, lines, onClose: () => {
        if (!town || stats.waypoints.length < 2) return;
        this.time.delayedCall(150, () => this.hud.openChoice({
          title: '빠른 이동', note: '등록한 다른 마을로 바로 갈까요?',
          options: [{ id: 'go', label: '마을 고르기' }, { id: 'no', label: '여기 있을래요' }],
          onPick: (id) => { if (id === 'go') openTravel(this.game, this); },
        }));
      } });
      return;
    }
    if (s.kind === 'rune') { this.useRune(s); return; }
    if (s.kind === 'bossSeal') { this.useBossSeal?.(); return; }
    if (s.kind === 'chest') { this.openChest(s); return; }
    if (s.kind === 'find') {
      if (!this.quests.onFind(s.id)) this.hud.openDialog({ name: s.name, lines: s.lines[0] });
      return;
    }
    if (s.kind === 'difficulty') {
      const now = DIFFICULTY[stats.difficulty].label;
      this.hud.openChoice({
        title: `모험 난이도 (지금: ${now})`,
        note: '전투만 바뀌고 수학 문제는 같아요. 언제든 다시 바꿀 수 있어요.',
        options: DIFF_ORDER.map((id) => ({ id, label: DIFFICULTY[id].label })),
        current: stats.difficulty,
        onPick: (id) => {
          stats.difficulty = id;
          this.hud.toast(`난이도를 「${DIFFICULTY[id].label}」(으)로 바꿨어요`);
          this.saveGame();
        },
      });
      return;
    }
    this.hud.openDialog({ name: s.name, lines: s.lines[0] });
  }

  // ── 룬 ───────────────────────────────────────
  // 퀘스트가 이 룬을 기다리고 있을 때만 문제가 나와요
  async useRune(s) {
    if (this.quests.runeLit(s.id)) { this.hud.openDialog({ name: s.name, lines: s.litLines || ['룬이 환하게 빛나고 있어요.'] }); return; }
    if (!this.quests.canRune(s.id)) { this.hud.openDialog({ name: s.name, lines: s.sleepLines || ['룬이 아직 잠들어 있어요.', '촌장님께 먼저 이야기를 들어 봐요.'] }); return; }
    this.player.feet.body.setVelocity(0, 0);
    const res = await this.game.runes.start({ context: 'quest', unit: this.info.unit || 'fractionDivision', title: s.name, line: s.runeLine });
    if (!this.sys.isActive()) return;
    if (!res.correct) { this.hud.toast('언제든 다시 도전할 수 있어요'); return; }
    this.sound.play('sfx_seal', { volume: 0.5 });
    this.fx('fx_ring', 'na/ring', s.x, s.y - 6, { scale: 2.5, depth: s.y + 40, add: true }).setTint(0xb8a0ff);
    this.fx('fx_sparkc', 'na/sparkc', s.x, s.y - 10, { scale: 1.6, depth: s.y + 41, add: true });
    this.onRuneSolved?.(s.id);
    this.quests.onRune(s.id);
    if (this.combat.coop) this.game.party.send({ t: 'rune', id: s.id }); // 친구 화면에서도 룬이 깨어나요
  }

  openBag() { if (!this.locked) openBag(this.game, this); }
  openSkills(tab = 'skills') { if (!this.game.panelOpen && !this.game.runes?.open) openCharacter(this.game, this, tab); }
  openMap() { if (!this.locked) openWorldMap(this.game, this); }
  openQuests() { if (!this.locked) openQuests(this.game, this); }

  // ── 성장 룬 ──────────────────────────────────
  async learnSkill(sk) {
    const stats = this.registry.get('player');
    if ((stats.skillPts || 0) < 1) { this.hud.toast('스킬 포인트가 없어요. 레벨을 올려 포인트를 모아요'); return; }
    const res = await this.game.runes.start({ context: 'skill', unit: this.info.unit, allowLater: true, line: `「${sk.name}」의 룬이에요. 풀면 새 기술을 배워요!` });
    if (!this.sys.isActive() || !res.correct) return;
    if (!stats.learned.includes(sk.id)) {
      stats.learned.push(sk.id);
      stats.skillPts = Math.max(0, (stats.skillPts || 0) - 1);
      stats.skillLv ??= {};
      stats.skillLv[sk.id] = 1;
      // 빈 칸이 있으면 바로 끼워요
      const empty = stats.slots.indexOf(null);
      if (empty >= 0) stats.slots[empty] = sk.id;
      this.hud?.refreshSkills?.();
    }
    this.sound.play('sfx_unlock', { volume: 0.55 });
    this.fx('fx_ring', 'na/ring', this.player.x, this.player.y - 4, { scale: 2.4, depth: this.player.y + 30, add: true }).setTint(0xb8a0ff);
    const slot = stats.slots.indexOf(sk.id);
    this.hud.showBanner(`새 스킬: ${sk.name}`, slot < 0 ? '능력(C) 창의 스킬 칸에 끼워서 써요' : this.hud.isTouch ? `${slot + 1}번째 스킬 단추로 쓸 수 있어요` : `${SKILL_KEYS[slot]} 키로 쓸 수 있어요`);
    this.saveGame({ now: true });
  }

  // 레벨업 성장 시험: 맞히면 보너스 능력치를 골라요 (미뤄도 돼요)
  async growthTest() {
    const stats = this.registry.get('player');
    if (!stats.tests || this.locked) return;
    const res = await this.game.runes.start({ context: 'levelup', unit: this.info.unit, allowLater: true, line: '룬을 풀면 보너스 능력치 포인트 2를 받아요!' });
    if (!this.sys.isActive() || !res.correct) return;
    // 맞히면 보너스 능력치 포인트 2 → 능력 창에서 원하는 곳에 올려요
    stats.tests = Math.max(0, stats.tests - 1);
    stats.statEarned = (stats.statEarned || 0) + 2;
    stats.statPts = (stats.statPts || 0) + 2;
    this.sound.play('sfx_levelup', { volume: 0.5 });
    this.hud.showBanner('보너스 능력치 +2!', '능력(C) 창에서 힘·체력·솜씨·지혜에 나눠 올려요');
    this.saveGame({ now: true });
  }

  // 황금 수학 상자: 룬을 풀면 열려요 (한 번만)
  async openChest(c) {
    const stats = this.registry.get('player');
    if (stats.chests.includes(c.id)) { this.hud.openDialog({ name: '빈 상자', lines: ['이미 열어 본 상자예요.'] }); return; }
    const res = await this.game.runes.start({ context: 'chest', unit: this.info.unit, allowLater: true });
    if (!this.sys.isActive() || !res.correct) return;
    stats.chests.push(c.id);
    c.sprite?.setFrame(1);
    this.sound.play('sfx_chest', { volume: 0.55 });
    this.fx('fx_sparkc', 'na/sparkc', c.x, c.y - 8, { scale: 1.4, depth: c.y + 30, add: true }).setTint(0xffe066);
    const got = [];
    if (c.gold) { this.combat.dropCoins(c.x, c.y + 6, c.gold); got.push(`${c.gold} G`); }
    if (c.potions) { stats.potions += c.potions; got.push(`회복약 ${c.potions}개`); }
    for (const id of [c.weapon, c.armor, c.item].filter(Boolean)) if (giveItem(stats, id)) got.push(itemDef(id).name);
    // 상자에는 강화석도 들어 있어요
    const st = 1 + (Math.random() < 0.5 ? 1 : 0);
    stats.stones = (stats.stones || 0) + st;
    got.push(`강화석 ${st}개`);
    this.hud.showBanner('황금 수학 상자!', got.join(' · '));
    this.saveGame({ now: true });
  }

  placeChests(list) {
    const stats = this.registry.get('player');
    for (const c of list || []) {
      const opened = stats.chests.includes(c.id);
      c.sprite = this.add.sprite(c.x, c.y, 'na/chest', opened ? 1 : 0).setOrigin(0.5, 1).setScale(1.2).setDepth(c.y).setTint(0xffe9a0);
      this.addSolid(c.x - 8, c.y - 6, 16, 6);
      if (!opened) {
        const sp = this.add.sprite(c.x, c.y - 16, 'na/spark', 0).setBlendMode('ADD').setDepth(c.y + 1).setTint(0xffe066);
        sp.play('fx_spark');
      }
      this.spots.push({ ...c, kind: 'chest', name: '황금 수학 상자', r: 22, label: '상자 열기' });
    }
  }

  // ── 출구 ─────────────────────────────────────
  onExit(e) {
    if (this.exitCooldown > this.time.now || this.leaving) return;
    this.exitCooldown = this.time.now + 2500;
    if (!e.scene) { this.hud?.toast(`「${e.to}」은(는) 다음 단계에서 열려요`); return; }
    if (e.requires && !this.quests.passed(e.requires) && !this.game.classCfg?.unlockAll) { this.hud?.toast(e.lockedMsg || '아직 갈 수 없어요'); return; }
    // 다음 지역은 레벨이 되어야 갈 수 있어요 (충분히 강해진 뒤에)
    const need = this.exitMinLv?.(e) || 0;
    const lv = this.registry.get('player').lv;
    if (lv < need && !this.game.classCfg?.unlockAll) {
      this.hud?.showBanner(`Lv ${need}부터 갈 수 있어요`, `지금 Lv ${lv} · 몬스터를 물리치고 곁 퀘스트를 하며 더 강해져요!`);
      this.bounceBack(e);
      return;
    }
    this.goTo(e.scene, e.entry, e.region, e.map);
  }

  // 막힌 출구에서 한 걸음 뒤로
  bounceBack(e) {
    const p = this.player;
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    p.feet.body.reset(p.x + (dx / len) * 14, p.y + (dy / len) * 14);
  }

  goTo(sceneKey, entry, region, map) {
    this.leaving = true;
    this.saveGame();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey, { entry, region, map }));
  }

  // 쓰러지면 잃는 것 없이 마을 입구에서 다시 시작해요
  onPlayerDown() {
    const stats = this.registry.get('player');
    this.player.knockDown();
    // 협동 중이면 10초 동안 친구가 일으켜 줄 수 있어요
    const wait = this.combat.coop ? 10000 : 1800;
    this.hud?.showBanner('쓰러졌어요…', this.combat.coop ? '친구가 곁에 와서 일으켜 줄 수 있어요 (10초)' : '잃는 것은 없어요. 다시 힘을 내요!');
    this.downTimer = this.time.delayedCall(wait, () => {
      if (this.player.state !== 'down') return;
      stats.hp = stats.maxHp;
      stats.sp = stats.maxSp;
      const [key, entry, region, map] = this.respawnAt?.() || ['Map', 'plaza', null, 'village'];
      this.goTo(key, entry, region, map);
    });
  }

  // 친구가 일으켜 줬어요
  revive() {
    if (this.player.state !== 'down') return;
    const stats = this.registry.get('player');
    this.downTimer?.remove();
    stats.hp = Math.round(stats.maxHp * 0.5);
    this.player.state = 'move';
    this.player.sprite.setAngle(0);
    this.player.invUntil = this.time.now + 2000;
    this.fx('fx_sparkc', 'na/sparkc', this.player.x, this.player.y - 8, { scale: 1.4, depth: this.player.y + 30, add: true }).setTint(0x9dff9d);
    this.hud?.toast('친구가 일으켜 줬어요!');
  }

  // 친구가 룬을 깨웠어요 (협동 룬)
  onPeerRune(id) {
    if (!this.quests.canRune(id)) return;
    const s = this.spots.find((p) => p.id === id);
    if (s) this.fx('fx_ring', 'na/ring', s.x, s.y - 6, { scale: 2.5, depth: s.y + 40, add: true }).setTint(0xb8a0ff);
    this.onRuneSolved?.(id);
    this.quests.onRune(id);
    this.hud?.toast('친구가 룬을 깨웠어요!');
  }

  // 인사말 말풍선
  say(text, who = this.player) {
    const t = crisp(this.add.text(who.x, who.y - 30, text, textStyle(13, '#1b1208', { backgroundColor: '#fff8e6', padding: { x: 6, y: 3 }, strokeThickness: 0 })))
      .setOrigin(0.5).setScale(1 / ZOOM).setDepth(100005);
    this.tweens.add({ targets: t, y: t.y - 6, alpha: 0, delay: 1600, duration: 500, onComplete: () => t.destroy() });
  }

  async checkTeacher() {
    const saves = this.game.saves;
    const stats = this.registry.get('player');
    this.game.classCfg = (await saves.fetchClassConfig()) || this.game.classCfg || null;
    const grants = await saves.fetchGrants(stats.saveCode);
    if (!this.sys.isActive() || this.leaving) return;
    for (const g of grants) {
      if (!stats.grantsApplied.includes(g.id)) this.applyGrant(g);
      saves.removeGrant(stats.saveCode, g.id);
    }
  }

  // 선생님이 보낸 경험치·골드·회복약을 받아요 (같은 선물은 한 번만)
  applyGrant(g) {
    const stats = this.registry.get('player');
    const exp = Math.max(0, Math.min(5000, Math.floor(g.exp || 0)));
    const gold = Math.max(0, Math.min(10000, Math.floor(g.gold || 0)));
    const potions = Math.max(0, Math.min(20, Math.floor(g.potions || 0)));
    stats.grantsApplied = [...stats.grantsApplied, g.id].slice(-40);
    stats.gold += gold;
    stats.potions = (stats.potions || 0) + potions;
    const got = [exp && `경험치 ${exp}`, gold && `${gold} G`, potions && `회복약 ${potions}개`].filter(Boolean).join(' · ');
    this.sound.play('sfx_quest', { volume: 0.5 });
    this.hud?.showBanner('선생님의 선물!', g.note ? `${g.note} (${got})` : got);
    if (exp) this.time.delayedCall(1200, () => this.combat.gainExp(exp));
    this.saveGame({ now: true });
  }

  // ── 2인 협동: 내 모습 보내기, 친구 모습·몬스터 받기 ──
  syncParty(time) {
    const party = this.game.party;
    const c = this.combat;
    if (!party?.active) {
      c.setCoop(false);
      this.removeRemote();
      return;
    }
    const stats = this.registry.get('player');
    const p = this.player;
    const r = (v) => Math.round(v * 10) / 10;
    party.sendState({ s: this.syncKey, x: r(p.x), y: r(p.y), d: p.dir, st: p.state, hp: stats.hp, mhp: stats.maxHp, lv: stats.lv });
    const together = party.together(this.syncKey);
    if (together && !c.remote) c.remote = new RemotePlayer(this, { ...party.peer, x: party.peerState.x, y: party.peerState.y });
    if (!together) this.removeRemote();
    c.setCoop(together);
    if (together) {
      c.remote.update(party.peerState);
      if (party.isHost && time > (this.monSendAt || 0)) {
        this.monSendAt = time + 100;
        if (c.monsters.length) party.sendMon(this.syncKey.replace(/[.#$[\]/]/g, '_'), c.monsters.map((m) => m.snapshot()));
      }
      if (!party.isHost) {
        const arr = party.mon[this.syncKey.replace(/[.#$[\]/]/g, '_')];
        if (arr) c.monsters.forEach((m, i) => m.applySnapshot(arr[i]));
      }
    }
    c.handleEvents(party.takeEvents());
  }

  updateCamFocus() {
    const p = this.player.sprite;
    let fx = p.x;
    let fy = p.y - 10;
    const b = this.boss;
    if (b?.engaged) {
      fx += Phaser.Math.Clamp((b.x - p.x) * 0.5, -40, 40);
      fy += Phaser.Math.Clamp((b.y - 20 - p.y) * 0.5, -24, 24);
    }
    this.camFocus.setPosition(fx, fy);
  }

  removeRemote() {
    if (!this.combat.remote) return;
    this.combat.remote.destroy();
    this.combat.remote = null;
  }

  saveGame({ now = false } = {}) {
    const stats = this.registry.get('player');
    if (!this.player) return;
    stats.village = this.info.village || this.info.id; // 필드는 가까운 마을 이름으로 저장 (보안 규칙과 맞추려고)
    stats.area = this.info.id;
    stats.region = this.region || null;
    stats.map = this.mapId || null;
    stats.scene = this.scene.key;
    stats.mapV = this.info.mapV;
    stats.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    if (stats.hp <= 0) stats.hp = stats.maxHp;
    this.game.saves.save(stats, { now });
  }

  update(time, delta) {
    // 룬 창이 열려 있는 동안은 세상이 멈춰요 (보스도 기다려 줘요)
    const paused = (!!this.game.runes?.open || !!this.game.panelOpen) && !this.combat.coop;
    if (paused !== !!this.worldPaused) {
      this.worldPaused = paused;
      // 물리·움직임·예약된 공격(시간)까지 모두 멈춰요
      if (paused) { this.physics.world.pause(); this.tweens.pauseAll(); this.time.paused = true; this.anims.pauseAll(); }
      else { this.physics.world.resume(); this.tweens.resumeAll(); this.time.paused = false; this.anims.resumeAll(); }
    }
    if (paused) return;
    const stats = this.registry.get('player');
    stats.playTime = (stats.playTime || 0) + Math.min(1, (time - this.lastTick) / 1000);
    this.lastTick = time;
    // 공격: 누를 때마다 1·2·3타, 2타 뒤 잠깐 쉬고 누르면 강타, 꾹 누르면 힘 모으기
    this.combat.updateCharge(time, !!(this.keys.J.isDown || this.hud?.attackHeld) && !this.locked);
    if (!this.combat.frozen) {
      const [vx, vy] = this.moveInput();
      this.player.update(vx, vy, this.locked);
    }
    this.syncParty(time);
    this.combat.update(time, delta);
    this.updateCamFocus();
    for (const n of this.npcs) n.update(time);
    this.hud?.setPrompt(this.locked ? null : this.nearest());
  }
}
