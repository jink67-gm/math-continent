// 필드 장면: 「출발의 초원」 — 마을 남쪽 사냥터
// 몬스터를 정화하며 경험치·골드를 모으고 레벨을 올려요.

import { seeded } from '../world/terrain.js';
import { Npc } from '../world/Npc.js';
import * as MAP from '../data/startMeadow.js';
import { WorldScene } from './WorldScene.js';

export class FieldScene extends WorldScene {
  constructor() { super('Field'); }

  get info() { return MAP.FIELD; }

  buildWorld() {
    this.mapW = MAP.WIDTH;
    this.mapH = MAP.HEIGHT;
    this.grid = MAP.buildTerrain();
    this.grid.bake(this, seeded(11)).setDepth(-1000);
    for (const r of this.grid.solidRects()) this.addSolid(r.x, r.y, r.w, r.h);
    for (const p of MAP.PROPS) this.placeObject(p);
    for (const n of MAP.scatterNature(this.grid)) this.placeObject(n);

    this.npcs = MAP.NPCS.map((d) => new Npc(this, d));
    this.spots = MAP.SPOTS;
    this.exits = MAP.EXITS;
    for (const s of MAP.SPAWNS) this.combat.spawnMonster(s.kind, s.x, s.y);
  }

  spawnPoint() {
    return MAP.SPAWN;
  }
}
