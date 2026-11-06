// 2~6번 마을과 혼돈의 첨탑 장면: 마을(Town) · 들판(Wild) · 던전(Dungeon)
// 같은 장면을 지역(region)만 바꿔 다시 써요. 지도는 world/gen.js가 만들어요.

import { seeded } from '../world/terrain.js';
import { Npc } from '../world/Npc.js';
import { REGIONS, SPIRE } from '../data/regions.js';
import { makeTown, makeWild, makeDungeon, dungeonDeco, TOWN, WILD, DUNGEON } from '../world/gen.js';
import { WorldScene } from './WorldScene.js';
import { CaveScene } from './CaveScene.js';

const T = 16;

export class TownScene extends WorldScene {
  constructor() { super('Town'); }

  get r() { return REGIONS[this.region] || REGIONS.cubeCity; }
  get info() {
    const r = this.r;
    return { id: `${this.region}_town`, village: this.region, townName: r.name, name: r.name, subtitle: r.subtitle, bgm: 'bgm_town', unit: r.unit, mapV: 1 };
  }

  buildWorld() {
    const m = (this.map = makeTown(this.region));
    this.mapW = TOWN.cols * T;
    this.mapH = TOWN.rows * T;
    this.grid = m.grid;
    this.grid.bake(this, seeded(40 + this.r.n), { theme: this.r.theme }).setDepth(-1000);
    for (const rr of this.grid.solidRects()) this.addSolid(rr.x, rr.y, rr.w, rr.h);
    for (const b of m.buildings) this.placeObject(b);
    for (const p of m.props) this.placeObject(p);
    for (const n of m.nature) this.placeObject(n);
    this.mapBuildings = m.buildings;
    this.npcs = m.npcs.map((d) => new Npc(this, d));
    this.spots = [...m.spots];
    this.exits = m.exits;
    if (!this.game.quests.passed('gate', this.region)) this.placeGate();
  }

  // 북쪽 길을 막은 봉인 바위
  placeGate() {
    const g = this.map.gate;
    this.gate = this.add.container(g.x, g.y).setDepth(g.y);
    const rock = this.add.image(0, 0, 'na/nature', 'rock_grey_stack').setOrigin(0.5, 1).setScale(1.5, 1);
    const seal = this.add.graphics().lineStyle(2, 0xb48cff, 0.9).strokeCircle(0, -24, 11);
    this.tweens.add({ targets: seal, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
    this.gate.add([rock, seal]);
    this.gateSolid = this.addSolid(g.x - g.w / 2, g.y - T, g.w, T);
  }

  onRuneSolved(id) {
    if (id !== 'gate' || !this.gate) return;
    this.gateSolid.destroy();
    this.cameras.main.shake(400, 0.005);
    this.tweens.add({ targets: this.gate, y: this.gate.y - 16, alpha: 0, duration: 1000, onComplete: () => this.gate.destroy() });
    this.fx('fx_smoke', 'na/smoke', this.map.gate.x, this.map.gate.y - 10, { scale: 1.5, depth: this.map.gate.y + 5 });
  }

  spawnPoint(entry) { return this.map.spawns[entry] || this.map.spawns.south; }
  respawnAt() { return ['Town', 'south', this.region]; }
}

export class WildScene extends WorldScene {
  constructor() { super('Wild'); }

  get r() { return REGIONS[this.region] || REGIONS.cubeCity; }
  get info() {
    const r = this.r;
    return { id: `${this.region}_wild`, village: this.region, townName: r.name, name: r.wildName, subtitle: r.name, bgm: 'bgm_field', unit: r.unit, mapV: 1 };
  }

  buildWorld() {
    const m = (this.map = makeWild(this.region));
    this.mapW = WILD.cols * T;
    this.mapH = WILD.rows * T;
    this.grid = m.grid;
    this.grid.bake(this, seeded(60 + this.r.n), { theme: this.r.wildTheme }).setDepth(-1000);
    for (const rr of this.grid.solidRects()) this.addSolid(rr.x, rr.y, rr.w, rr.h);
    const g = this.add.graphics().setDepth(m.mouth.y - 30);
    g.fillStyle(0x0b0710, 1).fillEllipse(m.mouth.x, m.mouth.y + 4, 46, 30);
    g.fillStyle(0x1d1424, 1).fillEllipse(m.mouth.x, m.mouth.y + 10, 38, 16);
    for (const p of m.props) this.placeObject(p);
    for (const n of m.nature) this.placeObject(n);
    this.spots = [...m.spots];
    this.placeChests(m.chests);
    this.exits = m.exits;
    for (const s of m.spawns) this.combat.spawnMonster(s.kind, s.x, s.y, this.r.power);
  }

  spawnPoint(entry) { return entry === 'north' ? this.map.spawns2.north : this.map.spawns2.south; }
  respawnAt() { return ['Town', 'north', this.region]; }
}

export class DungeonScene extends CaveScene {
  constructor() { super('Dungeon'); }

  get r() { return this.region === 'chaosSpire' ? SPIRE : (REGIONS[this.region] || REGIONS.cubeCity); }
  get info() {
    const r = this.r;
    const spire = this.region === 'chaosSpire';
    return {
      id: `${this.region}_dungeon`, village: spire ? 'solidPeaks' : this.region, townName: spire ? REGIONS.solidPeaks.name : r.name,
      name: spire ? SPIRE.name : r.dungeonName, subtitle: spire ? '여섯 단원이 모두 섞인 탑' : r.name, bgm: 'bgm_dungeon', unit: r.unit, mapV: 1,
    };
  }

  mapData() {
    const d = makeDungeon(this.region);
    const spire = this.region === 'chaosSpire';
    const M = {
      COLS: DUNGEON.cols, ROWS: DUNGEON.rows, WIDTH: DUNGEON.cols * T, HEIGHT: DUNGEON.rows * T, WALLS: d.walls, DOOR: d.door, BOSS: d.boss,
      BOSS_ROOM_Y: d.bossRoomY, SPOTS: d.spots, EXITS: d.exits, SPAWNS: d.spawns, CHESTS: d.chests, SPAWN_SOUTH: d.spawn,
      grid: d.grid, power: d.power, tint: this.r.dungeonTint || 0xb8aec8,
      bossCfg: { ...this.r.boss, tier: spire ? 7 : this.r.n || 1 }, sealStep: spire ? 'spireSeal' : 'seal', bossStep: spire ? 'zero' : 'boss',
      respawn: ['Dungeon', 'south', this.region],
    };
    M.deco = () => dungeonDeco(M, 300 + (this.r.n || 7));
    return M;
  }
}
