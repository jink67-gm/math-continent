// 마을 2~6의 던전 — 계곡 동굴과 같은 구조(방 3개 + 봉인된 문 + 보스 방)에
// 마을마다 다른 색·몬스터·보스를 입혀요. 내용은 data/villageContent.js에서 가져와요.
import { FractionCave } from './FractionCave.js';
import { Gimmicks } from './dungeonGimmicks.js';

export class TemplateDungeon extends FractionCave {
  constructor(c) {
    super();
    const s = c.s;
    this.id = `${s}_dungeon`;
    this.name = c.dungeon.name;
    this.village = c.village;
    this.bossKey = c.village;
    this.bgm = 'dungeon';
    this.darkness = c.style === 'snow' ? 0.35 : 0.5;
    this.colors = { floor: c.dungeon.floor, wall: c.dungeon.wall, decor: c.dungeon.decor };
    this.runeIds = [`${s}_runeA`, `${s}_runeB`];
    this.crystals.forEach((cr, i) => { cr.c = c.dungeon.decor[i % c.dungeon.decor.length]; });

    for (const o of this.interactables) {
      if (o.id === 'caveRuneA') o.id = `${s}_runeA`;
      else if (o.id === 'caveRuneB') o.id = `${s}_runeB`;
      else if (o.id === 'caveDoor') { o.id = `${s}_door`; o.runes = this.runeIds; }
      else if (o.id === 'caveGolden') o.id = `${s}_golden`;
      else if (o.id === 'caveChest') o.id = `${s}_chest`;
    }

    const [m1, m2, m3, m4] = c.mobs.map((m) => m[0]);
    const extra = m4 ? [m4] : [];
    this.zones = [
      { id: `${s}R1`, rect: { x: 500, y: 1170, w: 1750, h: 440 }, types: [m1, m2], max: 5, respawn: 9 },
      { id: `${s}R2`, rect: { x: 100, y: 120, w: 780, h: 840 }, types: [m2, m3, ...extra], max: 5, respawn: 10 },
      { id: `${s}R3`, rect: { x: 1120, y: 690, w: 1050, h: 300 }, types: [m3, m1, ...extra], max: 5, respawn: 10 },
      { id: `${s}Elite`, rect: { x: 1500, y: 1200, w: 300, h: 300 }, types: [`${s}_elite`], max: 1, respawn: 80 },
    ];
    this.areas = [{ id: `${s}_deep`, name: `${c.dungeon.name} 깊은 곳`, rect: { x: 1040, y: 640, w: 1360, h: 390 } }];
    this.exits = [
      { id: 'toVillage', rect: { x: 110, y: 1648, w: 200, h: 52 }, to: `${s}_village`, spawn: { x: 1100, y: 380 }, label: '마을로', dir: 'down', marker: { x: 210, y: 1625 } },
    ];
    this.boss = {
      ...this.boss,
      id: c.boss.id,
      portal: { x: 1700, y: 330, to: `${s}_village`, spawn: { x: 1100, y: 1130 }, label: '마을로 돌아가기' },
    };
    // 마을마다 다른 던전 장치 (dungeonGimmicks.js)
    this.gimmicks = new Gimmicks(c.style, s);
    this.interactables.push(...this.gimmicks.interactables());
    // 장치 근처의 수정 장식은 치움
    const spots = this.interactables;
    this.crystals = this.crystals.filter((cr) => !spots.some((o) => Math.hypot(o.x - cr.x, o.y - cr.y) < 120));
  }

  solids(save, world) {
    return [...super.solids(save, world), ...this.gimmicks.solids(save)];
  }

  tick(dt, world, prev) {
    this.gimmicks.tick(dt, world, prev);
  }

  drawGround(ctx, cam, w, h, t, save, world) {
    super.drawGround(ctx, cam, w, h, t, save, world);
    this.gimmicks.drawGround(ctx, save, t);
  }

  drawables(t, player, save) {
    return [...super.drawables(t, player, save), ...this.gimmicks.drawables(save, t)];
  }

  drawOverlay(ctx, t, player, save) {
    super.drawOverlay(ctx, t, player, save);
    this.gimmicks.drawOverlay(ctx, save, player);
  }
}
