// 마을과 필드가 함께 쓰는 바탕 장면: 주인공, 카메라, 키보드, HUD, 전투, 저장, 출구
// 각 장면은 buildWorld()에서 땅·건물·사람·몬스터를 놓고, spawnPoint()로 시작 위치를 정해요.

import { Player } from '../world/Player.js';
import { Combat } from '../combat/Combat.js';
import { ASSET_ROOT, BGM, HEROES } from '../data/assets.js';
import { normalizeStats, DIFFICULTY, DIFF_ORDER } from '../data/rules.js';

export const ZOOM = 3;

export class WorldScene extends Phaser.Scene {
  // info: { id, name, subtitle, bgm, mapV }
  init(data) {
    this.entry = data?.entry || null;
  }

  preload() {
    const key = this.info.bgm;
    if (!this.cache.audio.exists(key)) this.load.audio(key, BGM[key].map((p) => ASSET_ROOT + p));
  }

  create() {
    const stats = normalizeStats(this.registry.get('player'));
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
    cam.startFollow(this.player.sprite, true, 0.15, 0.15, 0, 10);
    cam.fadeIn(500, 0, 0, 0);

    this.setupKeys();
    this.scene.launch('Hud', { worldKey: this.scene.key, info: this.info });
    this.hud = this.scene.get('Hud');

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
    for (const s of ['na/house', 'na/nature', 'na/element']) if (this.textures.get(s).has(name)) return s;
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
    [['ONE', 'U', 'K'], ['TWO', 'I'], ['THREE', 'O'], ['FOUR', 'L']].forEach((names, i) => {
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

  get locked() { return !!this.hud?.dialogOpen || this.player?.state === 'down'; }

  fx(anim, sheet, x, y, { angle = 0, scale = 1, depth = 0, add = false } = {}) {
    const s = this.add.sprite(x, y, sheet, 0).setAngle(angle).setScale(scale).setDepth(depth);
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
    return best;
  }

  interact() {
    if (this.locked) return;
    const t = this.nearest();
    if (!t) return;
    if (t.type === 'npc') {
      const n = t.npc;
      n.face(this.player.x, this.player.y);
      n.setTalking(true);
      this.hud.openDialog({ name: n.def.name, portrait: `face/${n.key}`, lines: n.nextLines(), onClose: () => n.setTalking(false) });
      return;
    }
    const s = t.spot;
    const stats = this.registry.get('player');
    if (s.kind === 'heal') {
      stats.hp = stats.maxHp;
      stats.sp = stats.maxSp;
      this.sound.play('sfx_heal', { volume: 0.6 });
      this.fx('fx_sparkc', 'na/sparkc', this.player.x, this.player.y - 8, { scale: 1.2, depth: this.player.y + 30, add: true });
      this.time.delayedCall(10, () => this.saveGame());
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

  // ── 출구 ─────────────────────────────────────
  onExit(e) {
    if (this.exitCooldown > this.time.now || this.leaving) return;
    this.exitCooldown = this.time.now + 2500;
    if (!e.scene) { this.hud?.toast(`「${e.to}」은(는) 다음 단계에서 열려요`); return; }
    this.goTo(e.scene, e.entry);
  }

  goTo(sceneKey, entry) {
    this.leaving = true;
    this.saveGame();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey, { entry }));
  }

  // 쓰러지면 잃는 것 없이 마을 입구에서 다시 시작해요
  onPlayerDown() {
    const stats = this.registry.get('player');
    this.player.knockDown();
    this.hud?.showBanner('쓰러졌어요…', '잃는 것은 없어요. 마을에서 다시 힘을 내요!');
    this.time.delayedCall(1800, () => {
      stats.hp = stats.maxHp;
      stats.sp = stats.maxSp;
      this.goTo('Village', 'south');
    });
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

  saveGame({ now = false } = {}) {
    const stats = this.registry.get('player');
    if (!this.player) return;
    stats.village = this.info.village || this.info.id; // 필드는 가까운 마을 이름으로 저장 (보안 규칙과 맞추려고)
    stats.area = this.info.id;
    stats.scene = this.scene.key;
    stats.mapV = this.info.mapV;
    stats.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    if (stats.hp <= 0) stats.hp = stats.maxHp;
    this.game.saves.save(stats, { now });
  }

  update(time, delta) {
    const stats = this.registry.get('player');
    stats.playTime = (stats.playTime || 0) + Math.min(1, (time - this.lastTick) / 1000);
    this.lastTick = time;
    // 공격 버튼(J 또는 화면 버튼)을 누르고 있으면 콤보가 계속 이어져요
    if ((this.keys.J.isDown || this.hud?.attackHeld) && !this.locked) this.combat.attack();
    if (!this.combat.frozen) {
      const [vx, vy] = this.moveInput();
      this.player.update(vx, vy, this.locked);
    }
    this.combat.update(time, delta);
    for (const n of this.npcs) n.update(time);
    this.hud?.setPrompt(this.locked ? null : this.nearest());
  }
}
