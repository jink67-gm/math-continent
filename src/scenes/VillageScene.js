// 마을 장면: 땅·건물·소품·마을 사람을 놓고 주인공을 움직여요.
// 그림은 16px 픽셀이라 카메라를 3배로 키워서 보여요.
// 화면 위 UI(HUD, 대화창, 조이스틱)는 HudScene이 따로 그려요.

import { T, seeded } from '../world/terrain.js';
import { Player } from '../world/Player.js';
import { Npc } from '../world/Npc.js';
import { textStyle, crisp } from '../ui/style.js';
import * as MAP from '../data/fractionValley.js';
import { ASSET_ROOT, BGM, HEROES } from '../data/assets.js';

export const ZOOM = 3;
const MAP_VERSION = 2; // 지도 크기가 바뀌면 올려요 (예전 위치로 불러오지 않게)

export class VillageScene extends Phaser.Scene {
  constructor() { super('Village'); }

  preload() {
    const key = MAP.VILLAGE.bgm;
    if (!this.cache.audio.exists(key)) this.load.audio(key, BGM[key].map((p) => ASSET_ROOT + p));
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
    this.placePlots();
    this.placeBrokenBridge();
    this.placeSpringSparkles();

    // 주인공
    const at = stats.village === MAP.VILLAGE.id && stats.pos && stats.mapV === MAP_VERSION ? stats.pos : MAP.VILLAGE.spawn;
    this.player = new Player(this, at.x, at.y, HEROES[stats.gender] || HEROES.male);
    this.physics.add.collider(this.player.feet, this.solids);

    // 마을 사람
    this.npcs = MAP.NPCS.map((d) => new Npc(this, d));
    for (const n of this.npcs) {
      this.physics.add.collider(this.player.feet, n.feet);
      if (n.def.wander) this.physics.add.collider(n.feet, this.solids);
    }
    this.spots = MAP.SPOTS;

    // 마을 밖으로 나가는 길
    for (const e of MAP.EXITS) {
      const z = this.add.zone(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h);
      this.physics.add.existing(z, true);
      this.physics.add.overlap(this.player.feet, z, () => this.onExit(e));
    }

    // 카메라
    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, MAP.WIDTH, MAP.HEIGHT).setRoundPixels(true);
    cam.startFollow(this.player.sprite, true, 0.15, 0.15, 0, 10);
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

    // 자동 저장: 30초마다 + 창을 닫거나 다른 앱으로 넘어갈 때
    this.lastTick = this.time.now;
    this.time.addEvent({ delay: 30000, loop: true, callback: () => this.saveGame() });
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

  // 분수 밭: 8칸 중 일부에만 싹을 심어요
  placePlots() {
    for (const p of MAP.PLOTS) {
      const x0 = p.x * T;
      const y0 = p.y * T;
      for (let cy = 0; cy < 2; cy++) {
        for (let cx = 0; cx < 4; cx++) {
          // 밭 테두리 조각 (TilesetField 3×3 묶음: 0~2줄)
          const col = cx === 0 ? 0 : cx === 3 ? 2 : 1;
          const row = cy === 0 ? 0 : 2;
          this.add.image(x0 + cx * T, y0 + cy * T, 'na/field', row * 5 + col).setOrigin(0, 0).setDepth(-900);
        }
      }
      // 8칸을 셀 수 있게 칸 사이에 옅은 선
      const lines = this.add.graphics().setDepth(-899);
      lines.lineStyle(1, 0x8a4a1e, 0.55);
      for (let i = 1; i < 4; i++) lines.lineBetween(x0 + i * T + 0.5, y0 + 3, x0 + i * T + 0.5, y0 + 2 * T - 3);
      lines.lineBetween(x0 + 3, y0 + T + 0.5, x0 + 4 * T - 3, y0 + T + 0.5);
      for (let i = 0; i < p.planted; i++) {
        const cx = i % 4;
        const cy = Math.floor(i / 4);
        this.add.image(x0 + cx * T + 8, y0 + cy * T + 14, 'na/nature', 'crop').setOrigin(0.5, 1).setDepth(y0 + cy * T + 14);
      }
      crisp(this.add.text(x0 + 2 * T, y0 - 2, p.label, textStyle(12, '#fff7d6')).setOrigin(0.5, 1).setScale(1 / ZOOM))
        .setDepth(y0 + 1);
      this.addSolid(x0, y0 + 4, 4 * T, 2 * T - 6);
    }
  }

  // 가운데가 끊어진 나무다리 (TilesetWater 아래쪽 나무판)
  placeBrokenBridge() {
    const { x0, x1, y0, y1, gap } = MAP.BRIDGE;
    const cols = 448 / T;
    for (let y = y0; y <= y1; y++) {
      if (y === gap) continue;
      for (let x = x0; x <= x1; x++) {
        this.add.image(x * T, y * T, 'na/water', 13 * cols + (x === x0 ? 1 : 2)).setOrigin(0, 0).setDepth(-800);
      }
    }
    // 떠내려가는 판자
    const plank = this.add.image((x0 + 1.3) * T, gap * T + 8, 'na/water', 13 * cols + 1).setAngle(20).setDepth(-799);
    this.tweens.add({ targets: plank, y: plank.y + 2, angle: 28, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // 치유의 샘 위로 반짝이는 빛 (판타지 분위기)
  placeSpringSparkles() {
    const s = MAP.SPOTS.find((p) => p.kind === 'heal');
    for (let i = 0; i < 5; i++) {
      const sp = this.add.sprite(s.x + (Math.random() - 0.5) * 30, s.y - 28 - Math.random() * 10, 'na/spark', 0)
        .setBlendMode('ADD').setAlpha(0.85).setDepth(s.y + 40);
      sp.play({ key: 'fx_spark', startFrame: i % 7 });
      this.tweens.add({ targets: sp, y: sp.y - 10, alpha: 0.2, duration: 1400 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
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

  fx(anim, sheet, x, y, { angle = 0, scale = 1, depth = 0, add = false } = {}) {
    const s = this.add.sprite(x, y, sheet, 0).setAngle(angle).setScale(scale).setDepth(depth);
    if (add) s.setBlendMode('ADD');
    s.play(anim);
    s.once('animationcomplete', () => s.destroy());
    return s;
  }

  doAttack() {
    if (this.locked) return;
    const combo = this.player.attack();
    if (!combo) return;
    this.sound.play(`sfx_swing${combo}`, { volume: 0.5 });
    const [fx, fy] = this.player.facingVector();
    const angle = { right: 0, down: 90, left: 180, up: 270 }[this.player.dir];
    this.fx('fx_slash', 'na/slash', this.player.x + fx * 12, this.player.y - 6 + fy * 9,
      { angle, scale: combo === 3 ? 1.2 : 0.9, depth: this.player.y + 20 });
  }

  doDodge() {
    if (this.locked) return;
    const [vx, vy] = this.moveInput();
    if (!this.player.dodge(vx, vy)) return;
    this.sound.play('sfx_dodge', { volume: 0.5 });
    this.fx('fx_smoke', 'na/smoke', this.player.x, this.player.y - 4, { scale: 0.6, depth: this.player.y - 2 });
  }

  doSkill() {
    if (this.locked) return;
    const stats = this.registry.get('player');
    if (stats.sp < 10) { this.hud?.toast('SP가 부족해요'); return; }
    if (!this.player.skill()) return;
    stats.sp -= 10;
    this.sound.play('sfx_skill', { volume: 0.5 });
    this.fx('fx_sparkc', 'na/sparkc', this.player.x, this.player.y - 6, { scale: 1.6, depth: this.player.y + 20, add: true });
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
    } else {
      const s = t.spot;
      if (s.kind === 'heal') {
        const stats = this.registry.get('player');
        stats.hp = stats.maxHp;
        stats.sp = stats.maxSp;
        this.sound.play('sfx_heal', { volume: 0.6 });
        this.fx('fx_sparkc', 'na/sparkc', this.player.x, this.player.y - 8, { scale: 1.2, depth: this.player.y + 30, add: true });
        this.time.delayedCall(10, () => this.saveGame());
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
    stats.mapV = MAP_VERSION;
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
