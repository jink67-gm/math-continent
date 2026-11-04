// 마을 장면: 땅·건물·소품·마을 사람을 놓고 주인공을 움직여요.
// 화면 위 UI(HUD, 대화창, 조이스틱)는 HudScene이 따로 그려요.

import { T, seeded } from '../world/terrain.js';
import { Player } from '../world/Player.js';
import { Npc } from '../world/Npc.js';
import { textStyle, crisp } from '../ui/style.js';
import * as MAP from '../data/fractionValley.js';
import { ASSET_ROOT, BGM } from '../data/assets.js';

export class VillageScene extends Phaser.Scene {
  constructor() { super('Village'); }

  preload() {
    const key = MAP.VILLAGE.bgm;
    if (!this.cache.audio.exists(key)) this.load.audio(key, ASSET_ROOT + BGM[key]);
  }

  create() {
    const stats = this.registry.get('player');
    this.physics.world.setBounds(0, 0, MAP.WIDTH, MAP.HEIGHT);
    this.solids = this.physics.add.staticGroup();

    // 땅
    this.grid = MAP.buildTerrain();
    this.grid.bake(this, seeded(7)).setDepth(-1000);
    for (const r of this.grid.solidRects()) this.addSolid(r.x, r.y, r.w, r.h);

    // 건물·소품·자연
    for (const b of MAP.BUILDINGS) this.placeObject(b);
    for (const p of MAP.PROPS) this.placeObject(p);
    for (const n of MAP.scatterNature(this.grid)) this.placeObject(n);
    this.placeBrokenBridge();

    // 주인공
    const at = stats.village === MAP.VILLAGE.id && stats.pos ? stats.pos : MAP.VILLAGE.spawn;
    this.player = new Player(this, at.x, at.y, stats.gender);
    this.physics.add.collider(this.player.feet, this.solids);

    // 마을 사람
    this.npcs = MAP.NPCS.map((d) => new Npc(this, d));
    for (const n of this.npcs) {
      this.physics.add.collider(this.player.feet, n.feet);
      if (n.def.wander) this.physics.add.collider(n.feet, this.solids);
    }
    this.spots = MAP.SPOTS;

    // 마을 밖으로 나가는 길
    this.exitZones = MAP.EXITS.map((e) => {
      const z = this.add.zone(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h);
      this.physics.add.existing(z, true);
      this.physics.add.overlap(this.player.feet, z, () => this.onExit(e));
      return z;
    });

    // 카메라
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP.WIDTH, MAP.HEIGHT);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12, 0, 40);
    cam.fadeIn(500, 0, 0, 0);

    // 키보드
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,J,K,E,SPACE,ENTER');
    this.keys.J.on('down', () => this.doAttack());
    this.keys.K.on('down', () => this.doSkill());
    this.keys.SPACE.on('down', () => (this.hud?.dialogOpen ? this.hud.advanceDialog() : this.doDodge()));
    this.keys.E.on('down', () => (this.hud?.dialogOpen ? this.hud.advanceDialog() : this.interact()));
    this.keys.ENTER.on('down', () => this.hud?.dialogOpen && this.hud.advanceDialog());

    // HUD
    this.scene.launch('Hud', { village: MAP.VILLAGE });
    this.hud = this.scene.get('Hud');

    this.sound.stopAll();
    this.bgm = this.sound.add(MAP.VILLAGE.bgm, { loop: true, volume: 0.4 });
    this.bgm.play();

    // 자동 저장: 3분마다 + 창을 닫거나 다른 앱으로 넘어갈 때
    // (30초 → 3분: Firestore 하루 무료 쓰기 한도를 아끼려고. 이 기기에는 저장할 때마다 바로 남아요)
    this.lastTick = this.time.now;
    this.time.addEvent({ delay: 180000, loop: true, callback: () => this.saveGame() });
    const saveNow = () => this.saveGame({ now: true });
    this.game.events.on('save:now', saveNow);

    this.events.once('shutdown', () => {
      this.bgm?.stop();
      this.game.events.off('save:now', saveNow);
    });
  }

  addSolid(x, y, w, h) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.add(z);
    return z;
  }

  placeObject(o) {
    const img = this.add.image(o.x, o.y, o.k).setOrigin(0.5, 1).setScale(o.s);
    img.setDepth(o.flat ? -900 + o.y / 10000 : o.y);
    if (o.k === 'village2/plaza_round') img.setDepth(-950);
    if (o.solid === 'building') {
      const w = img.displayWidth * 0.86;
      const h = img.displayHeight * 0.36;
      this.addSolid(o.x - w / 2, o.y - h - 4, w, h);
    } else if (Array.isArray(o.solid)) {
      const [w, h] = o.solid;
      this.addSolid(o.x - w / 2, o.y - h, w, h);
    }
    if (o.label && o.k.includes('garden_plot')) {
      crisp(this.add.text(o.x, o.y - img.displayHeight - 2, o.label, textStyle(13, '#fff7d6'))
        .setOrigin(0.5, 1).setDepth(o.y + 1));
    }
    return img;
  }

  // 가운데가 끊어진 나무다리
  placeBrokenBridge() {
    const { x, top, bottom } = MAP.BRIDGE;
    const key = 'terrain3/bridge_v_deck';
    const src = this.textures.get(key).getSourceImage();
    const s = (bottom - top) / src.height;
    const cut = src.height * 0.36;
    this.add.image(x, top, key).setOrigin(0.5, 0).setScale(s).setCrop(0, 0, src.width, cut).setDepth(-800);
    this.add.image(x, top, key).setOrigin(0.5, 0).setScale(s)
      .setCrop(0, src.height - cut, src.width, cut).setDepth(-800);
    // 물에 떠내려가는 판자 조각
    const plank = this.add.image(x + 30, top + (bottom - top) / 2, key).setScale(s * 0.5)
      .setCrop(0, src.height * 0.45, src.width, src.height * 0.08).setAngle(18).setDepth(-799);
    this.tweens.add({ targets: plank, y: plank.y + 6, angle: 24, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // ── 입력 ─────────────────────────────────────
  moveInput() {
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (this.hud?.joy && (this.hud.joy.x || this.hud.joy.y)) { vx = this.hud.joy.x; vy = this.hud.joy.y; }
    return [vx, vy];
  }

  get locked() { return !!this.hud?.dialogOpen; }

  doAttack() {
    if (this.locked) return;
    const combo = this.player.attack();
    if (!combo) return;
    this.sound.play(`sfx_swing${combo}`, { volume: 0.5 });
    const [fx, fy] = this.player.facingVector();
    const fxKey = combo === 3 ? 'effects/slash_orange' : 'effects/slash_blue';
    const slash = this.add.image(this.player.x + fx * 44, this.player.y - 40 + fy * 30, fxKey)
      .setScale(combo === 3 ? 0.55 : 0.42).setDepth(this.player.y + 50).setBlendMode('ADD')
      .setAngle({ up: -90, down: 90, left: 180, right: 0 }[this.player.dir] + (combo === 2 ? 30 : 0));
    if (this.player.dir === 'left') slash.setFlipY(true);
    this.tweens.add({ targets: slash, alpha: 0, scale: slash.scale * 1.25, duration: 220, onComplete: () => slash.destroy() });
  }

  doDodge() {
    if (this.locked) return;
    const [vx, vy] = this.moveInput();
    if (!this.player.dodge(vx, vy)) return;
    this.sound.play('sfx_dodge', { volume: 0.5 });
    const dust = this.add.image(this.player.x, this.player.y + 4, 'effects/dust_cloud').setScale(0.3).setAlpha(0.8)
      .setDepth(this.player.y - 2);
    this.tweens.add({ targets: dust, alpha: 0, scale: 0.45, duration: 400, onComplete: () => dust.destroy() });
  }

  doSkill() {
    if (this.locked) return;
    const stats = this.registry.get('player');
    if (stats.sp < 10) { this.hud?.toast('SP가 부족해요'); return; }
    const side = this.player.skill();
    if (!side) return;
    stats.sp -= 10;
    this.sound.play('sfx_skill', { volume: 0.5 });
    const fx = this.add.image(this.player.x + (side === 'left' ? -60 : 60), this.player.y - 46, 'effects/burst_gold_big')
      .setScale(0.2).setBlendMode('ADD').setDepth(this.player.y + 50);
    this.tweens.add({ targets: fx, scale: 0.55, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
    this.cameras.main.shake(120, 0.004);
  }

  // 가장 가까운 대화 상대·살펴볼 곳
  nearest() {
    const px = this.player.x;
    const py = this.player.y;
    let best = null;
    let bestD = Infinity;
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - px, (n.y - py) * 1.3);
      if (d < 90 && d < bestD) { best = { type: 'npc', npc: n, x: n.x, y: n.y + n.headY - 6 }; bestD = d; }
    }
    for (const s of this.spots) {
      const d = Math.hypot(s.x - px, (s.y - py) * 1.3);
      if (d < s.r && d < bestD) { best = { type: 'spot', spot: s, x: s.x, y: s.y - 70 }; bestD = d; }
    }
    return best;
  }

  interact() {
    if (this.locked) return;
    const t = this.nearest();
    if (!t) return;
    if (t.type === 'npc') {
      const n = t.npc;
      n.face(this.player.x);
      n.setTalking(true);
      const portrait = n.def.portrait || `npc3/portraits/${n.def.sprite}`;
      this.hud.openDialog({ name: n.def.name, portrait, lines: n.nextLines(), onClose: () => n.setTalking(false) });
    } else {
      const s = t.spot;
      if (s.kind === 'heal') {
        const stats = this.registry.get('player');
        stats.hp = stats.maxHp;
        this.time.delayedCall(10, () => this.saveGame());
        stats.sp = stats.maxSp;
        this.sound.play('sfx_heal', { volume: 0.6 });
        const fx = this.add.image(this.player.x, this.player.y - 40, 'effects/heal_green').setScale(0.3)
          .setBlendMode('ADD').setDepth(this.player.y + 60);
        this.tweens.add({ targets: fx, y: fx.y - 40, alpha: 0, duration: 900, onComplete: () => fx.destroy() });
      }
      this.hud.openDialog({ name: s.name, lines: s.lines[0] });
    }
  }

  onExit(e) {
    if (this.exitCooldown > this.time.now) return;
    this.exitCooldown = this.time.now + 2500;
    this.hud?.toast(`「${e.to}」은(는) 다음 단계에서 열려요`);
  }

  saveGame({ now = false } = {}) {
    const stats = this.registry.get('player');
    stats.village = MAP.VILLAGE.id;
    stats.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    this.game.saves.save(stats, { now });
  }

  update(time) {
    // 플레이 시간(초)
    const stats = this.registry.get('player');
    stats.playTime = (stats.playTime || 0) + Math.min(1, (time - this.lastTick) / 1000);
    this.lastTick = time;
    const [vx, vy] = this.moveInput();
    this.player.update(vx, vy, this.locked);
    for (const n of this.npcs) n.update(time);
    this.hud?.setPrompt(this.locked ? null : this.nearest());
  }
}

export { T };
