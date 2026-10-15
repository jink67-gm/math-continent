// 「계곡 동굴」 — 분수 계곡 던전
// 방 1(입구) → 방 2(서쪽 위, 룬 기둥 A) → 방 3(동쪽, 룬 기둥 B) → 봉인된 문 → 보스 방(봉인 제단 → 나눗셈 트롤)
// 룬 기둥 2개를 수학으로 깨우면 봉인된 문이 열려요.

import { drawChest, INK } from '../render/sprites.js';
import { drawTerrain } from '../render/terrain.js';
import { drawRockWall, drawCrystal, drawRunePillar, drawSealedDoor, drawPortal, drawExitMarker } from '../render/valleySprites.js';
import { assets } from '../render/AssetManager.js';
import {
  DUNGEON_KEYS, buildDungeonFloor, drawStoneWall, drawCrystalArt, drawRunePillarArt, drawSealedDoorArt, drawPortalArt,
  decorSolids, decorDrawables,
} from '../render/dungeonArt.js';
import { TRAIL_ENTRANCE_SPAWN } from '../data/routes.js';
import { wallDrawables, archDrawable, archSolids, stairsDrawable, stairsSolids, wallArtReady, DWALL_KEYS } from '../render/dungeonWalls.js';

// 아치 안 봉인: 쇠창살 + 보랏빛 봉인 막 + ÷ 룬
function drawArchSeal(ctx, r, t) {
  const cx = r.x + r.w / 2, bottom = r.y + r.h + 6;
  ctx.save();
  const g = ctx.createLinearGradient(0, r.y, 0, bottom);
  g.addColorStop(0, `rgba(150,110,255,${0.28 + Math.sin(t * 3) * 0.08})`);
  g.addColorStop(1, 'rgba(150,110,255,0.05)');
  ctx.fillStyle = g;
  ctx.fillRect(r.x + 4, r.y + 8, r.w - 8, r.h - 2);
  if (assets.get('dungeon3/small_iron_gate')) assets.draw(ctx, 'dungeon3/small_iron_gate', cx, bottom, { scale: (r.w - 6) / 213 });
  ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.25;
  ctx.font = '34px Jua, sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#d8c2ff';
  ctx.fillText('÷', cx, r.y + 44);
  ctx.restore();
}

// 입구 계단 (마을로 나가는 출구 위치)
const STAIRS = { cx: 210, bottom: 1712, width: 270 };
// 위쪽 벽의 기둥 모양: 보스 방 쪽은 깃발 기둥, 제단 위는 석상 벽감
export function caveWallPosts(x, i, end) {
  if (end) return null;
  if (x > 1080 && Math.abs(x - 1700) < 110) return 'pillar_niche_statue';
  if (x > 1080 && (Math.abs(x - 1400) < 110 || Math.abs(x - 2000) < 110)) return x < 1700 ? 'pillar_banner_a' : 'pillar_banner_b';
  return null;
}

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOOR = { x: 1600, y: 560, w: 180, h: 80 };

export class FractionCave {
  constructor() {
    this.id = 'fvCave';
    this.name = '계곡 동굴';
    this.village = 'fractionValley';
    this.bgm = 'dungeon';
    this.darkness = 0.55;
    this.bossKey = 'fractionValley';
    this.colors = { floor: ['#3d3354', '#433a5c'], wall: ['#4b3f5e', '#5d4f72'], decor: ['#b38cff', '#6fdc5a', '#5ec8f2', '#ff9ec2'] };
    this.runeIds = ['caveRuneA', 'caveRuneB'];
    this.bounds = { x: 0, y: 0, w: 2400, h: 1700 };
    this.spawn = { x: 210, y: 1540 };

    this.walls = [
      { x: 400, y: 1030, w: 1100, h: 80 },
      { x: 960, y: 70, w: 80, h: 960 }, // 위쪽 벽까지 이어 붙임 (예전엔 50px 틈이 있어 봉인된 문을 돌아갈 수 있었어요)
      { x: 1040, y: 560, w: 560, h: 80 },
      { x: 1780, y: 560, w: 620, h: 80 },
      { x: 620, y: 1290, w: 90, h: 90 },
      { x: 1700, y: 1330, w: 110, h: 80 },
      { x: 420, y: 480, w: 90, h: 110 },
      { x: 0, y: 0, w: 2400, h: 70 },
    ];

    this.interactables = [
      {
        id: 'caveRuneA', kind: 'rune', portrait: 'pillar', x: 230, y: 300, r: 85, label: '룬 기둥', headY: -134,
        name: '서쪽 룬 기둥',
        idleText: '「÷」 무늬가 새겨진 돌기둥이에요. 아직은 잠들어 있어요.',
        promptText: '봉인을 푸는 룬 기둥이에요.\n문제를 풀어 룬을 깨워 볼까요?',
        doneText: '룬 기둥이 황금빛으로 빛나고 있어요.',
        mathTitle: '봉인의 룬 기둥', actionLabel: '룬 깨우기', doneBanner: ['룬 기둥 활성화!', '봉인이 약해지고 있어요'],
      },
      {
        id: 'caveRuneB', kind: 'rune', portrait: 'pillar', x: 2260, y: 760, r: 85, label: '룬 기둥', headY: -134,
        name: '동쪽 룬 기둥',
        idleText: '「÷」 무늬가 새겨진 돌기둥이에요. 아직은 잠들어 있어요.',
        promptText: '봉인을 푸는 룬 기둥이에요.\n문제를 풀어 룬을 깨워 볼까요?',
        doneText: '룬 기둥이 황금빛으로 빛나고 있어요.',
        mathTitle: '봉인의 룬 기둥', actionLabel: '룬 깨우기', doneBanner: ['룬 기둥 활성화!', '봉인이 약해지고 있어요'],
      },
      { id: 'caveDoor', kind: 'door', x: 1690, y: 700, r: 100, label: '봉인된 문', headY: -110, runes: ['caveRuneA', 'caveRuneB'] },
      { id: 'caveGolden', kind: 'chest', golden: true, x: 700, y: 210, r: 70, label: '수학 상자 열기', headY: -56 },
      { id: 'caveChest', kind: 'chest', golden: false, x: 2280, y: 1600, r: 70, label: '상자 열기', headY: -52 },
    ];

    this.exits = [
      // ⑭ 동굴 밖 = 계곡 바위 숲 (동굴 입구 바로 앞)
      { id: 'toVillage', rect: { x: 110, y: 1648, w: 200, h: 52 }, to: 'fv_trail1', spawn: { ...TRAIL_ENTRANCE_SPAWN }, label: '계곡 바위 숲', dir: 'down', marker: { x: 210, y: 1625 } },
    ];

    this.zones = [
      { id: 'caveR1', rect: { x: 500, y: 1170, w: 1750, h: 440 }, types: ['rockSlime'], max: 5, respawn: 9 },
      { id: 'caveR2', rect: { x: 100, y: 120, w: 780, h: 840 }, types: ['shadowBat', 'rockSlime'], max: 5, respawn: 10 },
      { id: 'caveR3', rect: { x: 1120, y: 690, w: 1050, h: 300 }, types: ['caveMushroom', 'shadowBat'], max: 5, respawn: 10 },
    ];

    this.areas = [
      { id: 'caveDeep', name: '동굴 깊은 곳', rect: { x: 1040, y: 640, w: 1360, h: 390 } },
    ];

    // ⑨ 봉인 제단: 문이 열려도 보스가 바로 나오지 않아요 → 촌장 퀘스트를 받고, 제단에서 봉인 의식(수학)을 하면 깨어나요
    this.ritual = {
      id: 'fvRitual', kind: 'ritual', x: 1700, y: 215, r: 110, label: '봉인 제단 살펴보기', headY: -150,
      quest: 'q_boss', unit: 'fractionDivision',
      lockedText: '제단에 오래된 봉인 무늬가 새겨져 있어요. 무늬 사이로 금이 가 있고, 안쪽에서 낮은 숨소리가 들려요…\n(마을 촌장님께 먼저 이야기를 들어 보세요.)',
      storyText: '촌장님 말대로 봉인 무늬에 금이 가 있어요! 금 사이로 「÷」 룬이 깜빡여요.\n분수의 나눗셈 룬을 맞춰 봉인을 다시 세워야 해요.',
      awakenText: '룬을 맞추자 제단이 환하게 빛났어요… 그런데 금이 간 봉인이 버티지 못하고 산산조각!\n「크르르… 누가 내 잠을 깨웠느냐!」\n나눗셈 트롤이 깨어났어요!',
      awakenBanner: '나눗셈 트롤이 깨어났어요!',
    };
    this.interactables.push(this.ritual);

    this.boss = {
      id: 'reciprocalTroll',
      ritualId: 'fvRitual',
      trigger: { x: 1080, y: 80, w: 1290, h: 420 },
      spawn: { x: 1700, y: 300 },
      arena: { x: 1040, y: 70, w: 1360, h: 490 },
      lock: DOOR,
      portal: { x: 1700, y: 330, to: 'fvVillage', spawn: { x: 1100, y: 1130 }, label: '마을로 돌아가기' },
    };

    this.crystals = [];
    this.floorSpots = [];
    const rnd = seeded(4242);
    const colors = this.colors.decor;
    for (let i = 0; i < 46; i++) {
      const x = 80 + rnd() * 2240;
      const y = 100 + rnd() * 1560;
      if (this.inWall(x, y, 40)) continue;
      if (this.interactables.some((o) => Math.hypot(o.x - x, o.y - y) < 120)) continue;
      if (Math.hypot(x - 1700, y - 300) < 300) continue;
      this.crystals.push({ x, y, c: colors[Math.floor(rnd() * colors.length)], s: 0.6 + rnd() * 0.6 });
    }
    for (let i = 0; i < 90; i++) {
      this.floorSpots.push({ x: rnd() * 2400, y: rnd() * 1700, r: 10 + rnd() * 26 });
    }
  }

  inWall(x, y, pad = 0) {
    return this.walls.some((w) => x > w.x - pad && x < w.x + w.w + pad && y > w.y - pad && y < w.y + w.h + pad);
  }

  doorOpen(save) {
    return this.runeIds.every((id) => save?.activatedRunes.includes(id));
  }

  solids(save, world) {
    const list = [...this.walls, ...(this.decorSolidList ||= decorSolids())];
    if (!this.doorOpen(save) || world?.boss) list.push(DOOR);
    if (wallArtReady()) list.push(...archSolids(DOOR), ...stairsSolids(STAIRS.cx, STAIRS.bottom, STAIRS.width));
    return list;
  }

  // 새 석조 벽 그리기 목록 (한 번 만들어 두고, 그릴 때 시간 t만 넘겨 줌)
  wallItems(save) {
    if (this.wallCache === undefined || this.wallCache === null) {
      const items = wallDrawables(this.walls, this.colors, { posts: caveWallPosts });
      if (!items) { DWALL_KEYS.forEach((k) => assets.load(k)); return null; }
      items.push(archDrawable(DOOR, this.colors, () => this.doorOpen(this.saveRef), drawArchSeal));
      items.push(stairsDrawable(STAIRS.cx, STAIRS.bottom, STAIRS.width, this.colors));
      this.wallCache = items;
    }
    return this.wallCache;
  }

  activeExits(save) {
    const list = [...this.exits];
    if (save?.bossesDefeated.includes(this.bossKey)) {
      const p = this.boss.portal;
      list.push({ id: 'portal', rect: { x: p.x - 40, y: p.y - 30, w: 80, h: 50 }, to: p.to, spawn: p.spawn, label: p.label, portal: true });
    }
    return list;
  }

  drawGround(ctx, cam, w, h, t, save, world) {
    // 새 돌바닥 (한 번 그려 둠). 그림을 못 불러왔으면 예전 바닥
    if (!this.floor && DUNGEON_KEYS.every((k) => assets.get(k))) this.floor = buildDungeonFloor(this.bounds.w, this.bounds.h, this.colors, this.walls);
    if (!this.floor) DUNGEON_KEYS.forEach((k) => assets.load(k));
    if (this.floor) {
      const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y));
      const sw = Math.min(this.floor.width - sx, Math.ceil(w) + 2), sh = Math.min(this.floor.height - sy, Math.ceil(h) + 2);
      ctx.fillStyle = '#161020'; ctx.fillRect(cam.x, cam.y, w, h);
      if (sw > 0 && sh > 0) ctx.drawImage(this.floor, sx, sy, sw, sh, sx, sy, sw, sh);
    } else drawTerrain(ctx, cam, w, h, this.colors.floor[0], this.colors.floor[1], 'stone');
    ctx.fillStyle = 'rgba(20,15,34,0.25)';
    for (const s of this.floor ? [] : this.floorSpots) {
      if (s.x < cam.x - 40 || s.x > cam.x + w + 40 || s.y < cam.y - 40 || s.y > cam.y + h + 40) continue;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 보스 방 바닥 무늬
    const a = this.boss.arena;
    ctx.strokeStyle = 'rgba(255,111,142,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2 + 10, 300, 160, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '120px Jua, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,111,142,0.12)';
    ctx.fillText('÷', a.x + a.w / 2, a.y + a.h / 2 + 10);

    const newWalls = this.wallItems(save);
    if (!newWalls) for (const wall of this.walls) if (!drawStoneWall(ctx, wall, this.colors.wall)) drawRockWall(ctx, wall, this.colors.wall);
    if (newWalls) {
      // 새 벽은 drawables에서 깊이 정렬해서 그려요 (봉인된 문 = 아치 안 철문)
      if (this.doorOpen(save) && world?.boss) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.2;
        ctx.fillStyle = '#ff6f8e';
        ctx.fillRect(DOOR.x + 30, DOOR.y + 50, DOOR.w - 60, 16);
        ctx.restore();
      }
    } else if (!this.doorOpen(save)) {
      if (!drawSealedDoorArt(ctx, DOOR, t)) drawSealedDoor(ctx, DOOR, t);
    } else if (world?.boss) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.2;
      ctx.fillStyle = '#ff6f8e';
      ctx.fillRect(DOOR.x, DOOR.y + 30, DOOR.w, 20);
      ctx.restore();
    }
    for (const ex of this.exits) drawExitMarker(ctx, ex.marker.x, ex.marker.y, ex.label, ex.dir, t);
  }

  drawables(t, player, save) {
    this.saveRef = save;
    const walls = this.wallItems(save);
    const list = walls ? walls.map((d) => ({ y: d.y, draw: (ctx) => d.draw(ctx, t) })) : [];
    list.push(...this.crystals.map((c) => ({ y: c.y, draw: (ctx) => drawCrystalArt(ctx, c.x, c.y, c.c, c.s, t) || drawCrystal(ctx, c.x, c.y, c.c, c.s, t) })));
    list.push(...decorDrawables(t));
    for (const o of this.interactables) {
      if (o.kind === 'rune') list.push({ y: o.y, draw: (ctx) => drawRunePillarArt(ctx, o.x, o.y, save?.activatedRunes.includes(o.id), t) || drawRunePillar(ctx, o.x, o.y, save?.activatedRunes.includes(o.id), t) });
      else if (o.kind === 'chest') list.push({ y: o.y, draw: (ctx) => drawChest(ctx, o.x, o.y, { golden: o.golden, opened: save?.openedChests.includes(o.id), t }) });
    }
    if (save?.bossesDefeated.includes(this.bossKey)) {
      const p = this.boss.portal;
      list.push({ y: p.y - 20, draw: (ctx) => { drawPortalArt(ctx, p.x, p.y, t); drawPortal(ctx, p.x, p.y, t, p.label); } });
    }
    const rt = this.ritual;
    if (rt && this.doorOpen(save) && !save?.activatedRunes.includes(rt.id) && !save?.bossesDefeated.includes(this.bossKey)) {
      // 금 간 봉인에서 새어 나오는 빛 (조사할 곳 표시)
      list.push({
        y: 90,
        draw: (ctx) => {
          ctx.save();
          const a = 0.28 + Math.sin(t * 3) * 0.1;
          const gr = ctx.createRadialGradient(rt.x, 140, 6, rt.x, 140, 120);
          gr.addColorStop(0, `rgba(190,140,255,${a + 0.2})`);
          gr.addColorStop(1, 'rgba(190,140,255,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(rt.x - 120, 20, 240, 240);
          ctx.restore();
        },
      });
    }
    return list;
  }

  drawOverlay(ctx, t, player, save) {
    if (!this.doorOpen(save) && player && Math.hypot(player.x - 1690, player.y - 700) < 260) {
      const n = this.runeIds.filter((id) => save?.activatedRunes.includes(id)).length;
      ctx.font = '15px Jua, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.strokeText(`룬 기둥 ${n} / 2`, 1690, 545);
      ctx.fillStyle = '#ffe066';
      ctx.fillText(`룬 기둥 ${n} / 2`, 1690, 545);
    }
  }
}
