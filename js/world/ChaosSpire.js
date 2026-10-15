// 「혼돈의 첨탑」 — 6개 마을의 결정을 모두 되찾으면 열리는 최종 지역
// 긴 복도(여러 마을의 몬스터) → 꼭대기 방에서 최종 보스 「혼돈의 군주」 (수학의 봉인 3번, 6개 단원에서 골고루)
import { drawRockWall, drawCrystal, drawPortal, drawExitMarker } from '../render/valleySprites.js';
import { drawTerrain } from '../render/terrain.js';
import { assets } from '../render/AssetManager.js';
import { DUNGEON_KEYS, buildDungeonFloor, drawStoneWall, drawCrystalArt, drawPortalArt } from '../render/dungeonArt.js';
import { FINAL_CONTENT } from '../data/villageContent.js';

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOCK = { x: 800, y: 600, w: 800, h: 40 };

export class ChaosSpire {
  constructor() {
    const F = FINAL_CONTENT;
    this.id = 'chaosSpire';
    this.name = F.name;
    this.village = null;
    this.bossKey = 'chaosSpire';
    this.bgm = 'boss';
    this.darkness = 0.4;
    this.colors = { floor: F.dungeon.floor, wall: F.dungeon.wall, decor: F.dungeon.decor };
    this.bounds = { x: 0, y: 0, w: 2400, h: 1800 };
    this.spawn = { x: 1200, y: 1690 };
    this.walls = [
      { x: 0, y: 640, w: 800, h: 1160 },
      { x: 1600, y: 640, w: 800, h: 1160 },
      { x: 0, y: 0, w: 300, h: 640 },
      { x: 2100, y: 0, w: 300, h: 640 },
      { x: 0, y: 0, w: 2400, h: 70 },
    ];
    this.interactables = [];
    this.exits = [
      { id: 'toMap', rect: { x: 1100, y: 1755, w: 200, h: 45 }, action: 'map', label: '🗺️ 월드맵', dir: 'down', marker: { x: 1200, y: 1735 } },
    ];
    this.zones = [
      { id: 'spireHall', rect: { x: 850, y: 760, w: 700, h: 800 }, types: ['coneWizard', 'sphereSpirit', 'cylinderGolem', 'inkOctopus', 'knightMob', 'lavaDrake'], max: 6, respawn: 12 },
    ];
    this.areas = [];
    this.boss = {
      id: F.boss.id,
      trigger: { x: 320, y: 80, w: 1760, h: 500 },
      spawn: { x: 1200, y: 300 },
      portal: { x: 1200, y: 360, to: 'fvVillage', spawn: { x: 1100, y: 1130 }, label: '분수 계곡으로 돌아가기' },
    };
    const rnd = seeded(7777);
    this.crystals = [];
    for (let i = 0; i < 26; i++) {
      const x = 330 + rnd() * 1740;
      const y = 100 + rnd() * 1650;
      if (this.walls.some((w) => x > w.x - 30 && x < w.x + w.w + 30 && y > w.y - 30 && y < w.y + w.h + 30)) continue;
      if (Math.hypot(x - 1200, y - 300) < 260) continue;
      this.crystals.push({ x, y, c: this.colors.decor[i % 3], s: 0.6 + rnd() * 0.6 });
    }
  }

  solids(save, world) {
    const list = [...this.walls];
    if (world?.boss) list.push(LOCK);
    return list;
  }

  activeExits(save) {
    const list = [...this.exits];
    if (save?.bossesDefeated.includes(this.bossKey)) {
      const p = this.boss.portal;
      list.push({ id: 'portal', rect: { x: p.x - 40, y: p.y - 30, w: 80, h: 50 }, to: p.to, spawn: p.spawn, label: p.label });
    }
    return list;
  }

  drawGround(ctx, cam, w, h, t, save, world) {
    // 새 돌바닥 (못 불러왔으면 예전 바닥)
    if (!this.floor && DUNGEON_KEYS.every((k) => assets.get(k))) this.floor = buildDungeonFloor(this.bounds.w, this.bounds.h, this.colors, this.walls, { lava: true });
    if (!this.floor) DUNGEON_KEYS.forEach((k) => assets.load(k));
    if (this.floor) {
      const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y));
      const sw = Math.min(this.floor.width - sx, Math.ceil(w) + 2), sh = Math.min(this.floor.height - sy, Math.ceil(h) + 2);
      ctx.fillStyle = '#120c1c'; ctx.fillRect(cam.x, cam.y, w, h);
      if (sw > 0 && sh > 0) ctx.drawImage(this.floor, sx, sy, sw, sh, sx, sy, sw, sh);
    } else drawTerrain(ctx, cam, w, h, this.colors.floor[0], this.colors.floor[1], 'stone');
    ctx.save();
    ctx.translate(1200, 330);
    ctx.rotate(t * 0.2);
    ctx.strokeStyle = 'rgba(255,111,142,0.35)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(320, 0);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 230, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    for (const wall of this.walls) if (!drawStoneWall(ctx, wall, this.colors.wall)) drawRockWall(ctx, wall, this.colors.wall);
    if (world?.boss) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.2;
      ctx.fillStyle = '#ff6f8e';
      ctx.fillRect(LOCK.x, LOCK.y + 10, LOCK.w, 20);
      ctx.restore();
    }
    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
  }

  drawables(t, player, save) {
    const list = this.crystals.map((c) => ({ y: c.y, draw: (ctx) => drawCrystalArt(ctx, c.x, c.y, c.c, c.s, t) || drawCrystal(ctx, c.x, c.y, c.c, c.s, t) }));
    if (save?.bossesDefeated.includes(this.bossKey)) {
      const p = this.boss.portal;
      list.push({ y: p.y - 20, draw: (ctx) => { drawPortalArt(ctx, p.x, p.y, t); drawPortal(ctx, p.x, p.y, t, p.label); } });
    }
    return list;
  }
}
