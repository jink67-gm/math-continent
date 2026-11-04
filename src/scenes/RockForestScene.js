// 필드 장면: 「계곡 바위 숲」 — 마을 북쪽, 동굴로 가는 길

import { seeded } from '../world/terrain.js';
import * as MAP from '../data/rockForest.js';
import { WorldScene } from './WorldScene.js';

export class RockForestScene extends WorldScene {
  constructor() { super('RockForest'); }

  get info() { return MAP.FOREST; }

  buildWorld() {
    this.mapW = MAP.WIDTH;
    this.mapH = MAP.HEIGHT;
    this.grid = MAP.buildTerrain();
    this.grid.bake(this, seeded(13), { theme: 'forest' }).setDepth(-1000);
    for (const r of this.grid.solidRects()) this.addSolid(r.x, r.y, r.w, r.h);
    // 동굴 입구: 바위 사이의 어두운 구멍
    const m = MAP.CAVE_MOUTH;
    const g = this.add.graphics().setDepth(m.y - 30);
    g.fillStyle(0x0b0710, 1).fillEllipse(m.x, m.y + 4, 46, 30);
    g.fillStyle(0x1d1424, 1).fillEllipse(m.x, m.y + 10, 38, 16);
    for (const p of MAP.PROPS) this.placeObject(p);
    for (const n of MAP.scatterNature(this.grid)) this.placeObject(n);
    this.spots = [...MAP.SPOTS];
    this.placeChests(MAP.CHESTS);
    this.exits = MAP.EXITS;
    for (const s of MAP.SPAWNS) this.combat.spawnMonster(s.kind, s.x, s.y, MAP.FOREST.power);
  }

  spawnPoint(entry) {
    return entry === 'north' ? MAP.SPAWN_NORTH : MAP.SPAWN_SOUTH;
  }
}
