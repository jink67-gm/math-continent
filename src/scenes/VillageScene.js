// 마을 장면: 땅·건물·소품·마을 사람을 놓아요. 마을 안은 안전해서 몬스터가 없어요.
// 그림은 16px 픽셀이라 카메라를 3배로 키워서 보여요.
// 주인공·카메라·입력·저장은 WorldScene, 화면 위 UI는 HudScene이 맡아요.

import { T, seeded } from '../world/terrain.js';
import { Npc } from '../world/Npc.js';
import { textStyle, crisp } from '../ui/style.js';
import * as MAP from '../data/fractionValley.js';
import { WorldScene, ZOOM } from './WorldScene.js';

export { ZOOM };

export class VillageScene extends WorldScene {
  constructor() { super('Village'); }

  get info() { return MAP.VILLAGE; }

  buildWorld() {
    this.mapW = MAP.WIDTH;
    this.mapH = MAP.HEIGHT;
    this.grid = MAP.buildTerrain();
    this.grid.bake(this, seeded(7)).setDepth(-1000);
    // 다리가 고쳐지면 다리 칸은 물이어도 걸을 수 있어요
    const B = MAP.BRIDGE;
    this.bridgeOpen = this.game.quests.passed('bridge');
    const water = this.grid.blocked.bind(this.grid);
    this.grid.blocked = (x, y) => water(x, y) && !(this.bridgeOpen && x >= B.x0 && x <= B.x1 && y >= B.y0 && y <= B.y1);
    this.buildTerrainSolids();

    for (const b of MAP.BUILDINGS) this.placeObject(b);
    for (const p of MAP.PROPS) this.placeObject(p);
    for (const n of MAP.scatterNature(this.grid)) this.placeObject(n);
    this.placePlots();
    this.placeBrokenBridge();
    this.placeSpringSparkles();
    this.mapBuildings = MAP.BUILDINGS;

    this.npcs = MAP.NPCS.map((d) => new Npc(this, d));
    this.spots = [...MAP.SPOTS];
    this.exits = MAP.EXITS;
  }

  buildTerrainSolids() {
    this.terrainSolids?.forEach((z) => z.destroy());
    this.terrainSolids = this.grid.solidRects().map((r) => this.addSolid(r.x, r.y, r.w, r.h));
  }

  // 다리 룬을 풀면 판자가 하나씩 놓이며 다리가 이어져요
  onRuneSolved(id) {
    if (id !== 'bridge') return;
    this.bridgeOpen = true;
    this.buildTerrainSolids();
    this.floatPlank?.destroy();
    const { x0, x1, gap } = MAP.BRIDGE;
    const cols = 448 / T;
    for (let x = x0; x <= x1; x++) {
      const p = this.add.image(x * T, gap * T - 20, 'na/water', 13 * cols + (x === x0 ? 1 : 2)).setOrigin(0, 0).setDepth(-800).setAlpha(0);
      this.tweens.add({ targets: p, y: gap * T, alpha: 1, duration: 450, delay: (x - x0) * 220, ease: 'Bounce.out' });
    }
    this.cameras.main.shake(200, 0.003);
  }

  spawnPoint(entry) {
    if (entry === 'north') return { x: MAP.VILLAGE.spawn.x, y: 3 * T };
    if (entry === 'east') return { x: MAP.WIDTH - 2.5 * T, y: (MAP.ROAD + 1) * T };
    if (entry === 'south') return { x: MAP.VILLAGE.spawn.x, y: MAP.HEIGHT - 3 * T };
    return MAP.VILLAGE.spawn;
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
    const fixed = this.bridgeOpen;
    for (let y = y0; y <= y1; y++) {
      if (y === gap && !fixed) continue;
      for (let x = x0; x <= x1; x++) {
        this.add.image(x * T, y * T, 'na/water', 13 * cols + (x === x0 ? 1 : 2)).setOrigin(0, 0).setDepth(-800);
      }
    }
    if (fixed) return;
    // 떠내려가는 판자
    const plank = this.floatPlank = this.add.image((x0 + 1.3) * T, gap * T + 8, 'na/water', 13 * cols + 1).setAngle(20).setDepth(-799);
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
}
