// 던전 장면: 「뒤집힌 동굴」 — 룬 기둥 두 개로 봉인된 문을 열고, 안쪽 방의 인버트롤을 정화해요.

import { T, seeded } from '../world/terrain.js';
import { ASSET_ROOT, BGM } from '../data/assets.js';
import { Boss } from '../world/Boss.js';
import * as MAP from '../data/cave.js';
import { WorldScene } from './WorldScene.js';

export class CaveScene extends WorldScene {
  constructor() { super('Cave'); }

  get info() { return MAP.CAVE; }

  preload() {
    super.preload();
    if (!this.cache.audio.exists('bgm_boss')) this.load.audio('bgm_boss', BGM.bgm_boss.map((p) => ASSET_ROOT + p));
  }

  buildWorld() {
    const q = this.game.quests;
    this.mapW = MAP.WIDTH;
    this.mapH = MAP.HEIGHT;
    this.bossRoomY = MAP.BOSS_ROOM_Y;
    this.grid = MAP.buildTerrain();
    this.grid.bake(this, seeded(17), { theme: 'cave' }).setDepth(-1000).setTint(0xb8aec8);
    for (const r of this.grid.solidRects()) this.addSolid(r.x, r.y, r.w, r.h);

    this.placeBorder();
    for (const w of MAP.WALLS) this.placeWall(w);
    this.placeDoor(q.passed('seal'));
    this.pillars = {};
    for (const s of MAP.SPOTS.filter((p) => p.kind === 'rune')) this.placePillar(s, q.runeLit(s.id) || q.passed('seal'));
    for (const d of MAP.scatterDeco(this.grid)) {
      const img = this.placeObject(d);
      if (d.glow) this.glow(d.x, d.y - 8, img.tintTopLeft);
    }

    this.spots = MAP.SPOTS.filter((s) => s.id !== 'door' || !q.passed('seal'));
    this.exits = MAP.EXITS;
    this.placeChests(MAP.CHESTS);
    for (const s of MAP.SPAWNS) this.combat.spawnMonster(s.kind, s.x, s.y, MAP.CAVE.power);

    // 보스 (정화했으면 그 자리에 분수의 결정 받침대만 남아요)
    if (!q.passed('troll')) {
      this.boss = new Boss(this, this.combat, MAP.BOSS.x, MAP.BOSS.y);
      this.combat.monsters.push(this.boss);
    } else {
      this.placeAltar();
    }
    // 동굴 안은 조금 어둡게 (주인공 둘레는 밝게)
    this.dark = this.add.graphics().setDepth(90000);
  }

  spawnPoint() { return MAP.SPAWN_SOUTH; }
  respawnAt() { return ['Cave', 'south']; }

  // 가장자리 바위
  placeBorder() {
    const rnd = seeded(31);
    const k = ['rock_grey', 'rock_brown', 'rock_grey_tall', 'rock_brown_tall'];
    for (let x = 0.5; x < MAP.COLS; x += 1.6) {
      this.add.image(x * T, 1.6 * T, 'na/nature', k[Math.floor(rnd() * 4)]).setOrigin(0.5, 1).setDepth(T);
      if (Math.abs(x - 20) > 3) this.add.image(x * T, MAP.HEIGHT + 4, 'na/nature', k[Math.floor(rnd() * 4)]).setOrigin(0.5, 1).setDepth(MAP.HEIGHT);
    }
    for (let y = 2.5; y < MAP.ROWS; y += 1.6) {
      this.add.image(0.6 * T, y * T, 'na/nature', k[Math.floor(rnd() * 4)]).setOrigin(0.5, 1).setDepth(y * T);
      this.add.image(MAP.WIDTH - 0.6 * T, y * T, 'na/nature', k[Math.floor(rnd() * 4)]).setOrigin(0.5, 1).setDepth(y * T);
    }
    this.addSolid(0, 0, MAP.WIDTH, 1.4 * T);
    this.addSolid(0, 0, 1.1 * T, MAP.HEIGHT);
    this.addSolid(MAP.WIDTH - 1.1 * T, 0, 1.1 * T, MAP.HEIGHT);
  }

  // 바위벽 한 줄: 그림은 바위 무더기, 충돌은 긴 상자 하나
  placeWall({ y, x0, x1 }) {
    const rnd = seeded(y * 100 + x0);
    for (let x = x0 + 1; x <= x1 + 0.5; x += 2.6) {
      const k = rnd() < 0.5 ? 'rock_grey_stack' : 'rock_brown_big';
      this.add.image(x * T, (y + 1) * T, 'na/nature', k).setOrigin(0.5, 1).setDepth((y + 1) * T);
    }
    this.addSolid(x0 * T, y * T + 2, (x1 - x0 + 1) * T, T);
  }

  placeDoor(open) {
    const d = MAP.DOOR;
    if (open) return;
    this.door = this.add.container(d.x, d.y).setDepth(d.y);
    const rock = this.add.image(0, 0, 'na/nature', 'rock_grey_stack').setOrigin(0.5, 1).setScale(1.7, 1.1);
    const seal = this.add.graphics();
    seal.lineStyle(2, 0xb48cff, 0.9).strokeCircle(0, -26, 12).lineBetween(-8, -26, 8, -26);
    seal.fillStyle(0xb48cff, 1).fillCircle(0, -32, 2).fillCircle(0, -20, 2); // ÷ 모양
    this.tweens.add({ targets: seal, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
    this.door.add([rock, seal]);
    this.doorSolid = this.addSolid(d.x - d.w / 2, d.y - T, d.w, T);
  }

  openDoor() {
    if (!this.door) return;
    this.doorSolid.destroy();
    this.cameras.main.shake(500, 0.006);
    this.sound.play('sfx_seal', { volume: 0.6 });
    this.tweens.add({ targets: this.door, y: this.door.y - 18, alpha: 0, duration: 1200, onComplete: () => this.door.destroy() });
    this.fx('fx_smoke', 'na/smoke', MAP.DOOR.x, MAP.DOOR.y - 10, { scale: 1.6, depth: MAP.DOOR.y + 5 });
    this.spots = this.spots.filter((s) => s.id !== 'door');
  }

  placePillar(s, lit) {
    this.add.image(s.x, s.y - 2, 'na/nature', 'rock_brown_tall').setOrigin(0.5, 1).setDepth(s.y - 2);
    this.addSolid(s.x - 12, s.y - 12, 24, 10);
    const g = this.add.graphics().setDepth(s.y);
    const paint = (on) => {
      g.clear().lineStyle(2, on ? 0xffe066 : 0x8a74c8, on ? 1 : 0.7).strokeCircle(s.x, s.y - 26, 7)
        .fillStyle(on ? 0xffe066 : 0x8a74c8, on ? 1 : 0.6).fillCircle(s.x, s.y - 26, 2.5);
    };
    paint(lit);
    this.pillars[s.id] = { paint, s };
    if (lit) this.glow(s.x, s.y - 26, 0xffe066);
  }

  glow(x, y, tint = 0xbfe6ff) {
    const sp = this.add.sprite(x, y, 'na/spark', 0).setBlendMode('ADD').setDepth(90001).setTint(tint).setScale(1.4);
    sp.play({ key: 'fx_spark', startFrame: Math.floor(Math.random() * 5) });
    this.tweens.add({ targets: sp, alpha: 0.35, duration: 900 + Math.random() * 600, yoyo: true, repeat: -1 });
  }

  placeAltar() {
    const { x, y } = MAP.BOSS;
    this.add.image(x, y, 'na/nature', 'rock_grey').setOrigin(0.5, 1).setDepth(y);
    this.glow(x, y - 22, 0xffe066);
  }

  // ── 퀘스트와 보스 ─────────────────────────────
  onRuneSolved(id) {
    const p = this.pillars[id];
    if (!p) return;
    p.paint(true);
    this.glow(p.s.x, p.s.y - 26, 0xffe066);
  }

  onQuestAdvance(step) {
    if (step.id === 'seal') this.time.delayedCall(600, () => this.openDoor());
  }

  onBossWake(boss) {
    this.bgm?.stop();
    this.bgm = this.sound.add('bgm_boss', { loop: true, volume: 0.4 });
    this.bgm.play();
    this.sound.play('sfx_boss', { volume: 0.55 });
    this.cameras.main.shake(500, 0.006);
    this.hud?.showBanner(boss.def.name, '나누는 수를 뒤집어라! 빨간 경고를 보면 구르기!');
  }

  // 봉인이 걸리면 방 아래쪽에 봉인 룬이 나타나요
  onBossSeal(on) {
    this.spots = this.spots.filter((s) => s.kind !== 'bossSeal');
    this.sealMark?.destroy();
    if (!on) return;
    const s = { id: 'bossSeal', kind: 'bossSeal', name: '수학의 봉인', x: MAP.BOSS.x, y: MAP.BOSS_ROOM_Y - 6, r: 30, label: '봉인 풀기' };
    this.spots.push(s);
    const g = this.add.graphics().setDepth(-400);
    g.lineStyle(2, 0xc8a0ff, 1).strokeCircle(s.x, s.y - 4, 14).strokeCircle(s.x, s.y - 4, 9);
    this.tweens.add({ targets: g, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
    this.sealMark = g;
    this.hud?.toast('보호막! 아래쪽 봉인 룬에서 문제를 풀어 깨뜨려요');
  }

  async useBossSeal() {
    if (!this.boss?.sealed) return;
    const res = await this.game.runes.start({ context: 'boss', unit: this.info.unit });
    if (!this.sys.isActive() || !res.correct || !this.boss?.sealed) return;
    if (this.combat.isGuest) { this.game.party.send({ t: 'unseal' }); this.boss.unseal(); return; }
    this.boss.unseal();
  }

  onBossDefeated() {
    this.bgm?.stop();
    this.bgm = this.sound.add(this.info.bgm, { loop: true, volume: 0.4 });
    this.bgm.play();
    this.time.delayedCall(1200, () => this.game.quests.onBoss('troll'));
  }

  update(time, delta) {
    super.update(time, delta);
    // 어둠: 보이는 곳 전체를 살짝 어둡게 (빛나는 수정은 그 위에 그려져요)
    const wv = this.cameras.main.worldView;
    this.dark.clear().fillStyle(0x0a0614, 0.3).fillRect(wv.x - 4, wv.y - 4, wv.width + 8, wv.height + 8);
  }
}
