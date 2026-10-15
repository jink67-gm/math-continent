// 던전 장치 — 마을마다 다른 진행 방식 (방 배치는 같은 동굴 틀, 길을 여는 방법·순서가 달라요)
//  · 큐브 미궁(입체 도시): 쌓기나무 장치를 풀면 큐브 블록 벽이 내려가요 → 서쪽 방 먼저, 그다음 동쪽 길
//  · 침수 동굴(소수 항구): 수문 장치로 물길을 빼야 건너갈 수 있어요 → 물길 2곳
//  · 기사단 요새(비례 왕국): 비례식 창살문 → 동쪽 방 먼저, 그다음 서쪽 방 (큐브 미궁과 반대 순서)
//  · 고대 원형 유적(원형 숲): 서쪽 길이 무너져 있고, 원형 제단을 깨우면 마법진 순간이동으로 건너가요
//  · 얼음 동굴(입체 산맥): 빙판에서는 미끄러져요. 얼음벽은 화로 장치를 풀어 녹여요
// 장치 상태는 activatedRunes에 저장돼요(기존 저장 구조 그대로) → 다시 들어와도 열린 채로.
import { assets } from '../render/AssetManager.js';
import { drawPlaque } from '../render/envArt.js';

// 공통 동굴 틀: 서쪽 틈 {0,1030,400,80} · 동쪽 틈 {1500,1030,900,80} · 봉인된 문 앞 (1690,700)
const WEST_GAP = { x: 0, y: 1030, w: 400, h: 80 };
const EAST_GAP = { x: 1500, y: 1030, w: 900, h: 80 };

export const GIMMICKS = {
  cube: {
    title: '큐브 미궁',
    gates: [
      { id: 'blockA', look: 'block', rect: WEST_GAP, term: { x: 330, y: 1330, art: 'cube' }, name: '쌓기나무 장치 ①', open: ['블록 벽이 내려갔어요!', '서쪽 방으로 갈 수 있어요'] },
      { id: 'blockB', look: 'block', rect: EAST_GAP, term: { x: 640, y: 830, art: 'cube' }, name: '쌓기나무 장치 ②', open: ['블록 벽이 내려갔어요!', '동쪽 미궁으로 가는 길이 열렸어요'] },
    ],
    idle: '정육면체 블록이 쌓인 장치예요. 쌓기나무 개수를 맞히면 블록 벽이 움직인대요.',
    prompt: '장치 화면에 쌓기나무 모양이 떠올라요.\n문제를 풀면 블록 벽이 내려가요!',
  },
  harbor: {
    title: '침수 동굴',
    gates: [
      { id: 'sluiceA', look: 'water', rect: { x: 1150, y: 1110, w: 120, h: 590 }, term: { x: 930, y: 1460, art: 'anchor' }, name: '서쪽 수문 장치', open: ['수문이 열렸어요!', '물이 빠져 동쪽으로 건널 수 있어요'] },
      { id: 'sluiceB', look: 'water', rect: { x: 1480, y: 640, w: 420, h: 200 }, term: { x: 560, y: 830, art: 'anchor' }, name: '북쪽 수문 장치', open: ['수문이 열렸어요!', '봉인된 문 앞의 물이 빠졌어요'] },
    ],
    idle: '바닷물이 들어찬 물길을 조절하는 수문 장치예요.',
    prompt: '수문 눈금이 소수로 적혀 있어요.\n계산을 맞히면 물이 빠져요!',
  },
  castle: {
    title: '기사단 요새',
    gates: [
      { id: 'portA', look: 'bars', rect: EAST_GAP, term: { x: 1300, y: 1460, art: 'knight' }, name: '동쪽 창살문 장치', open: ['창살문이 올라갔어요!', '동쪽 요새로 들어갈 수 있어요'] },
      { id: 'portB', look: 'bars', rect: WEST_GAP, term: { x: 1650, y: 900, art: 'knight' }, name: '서쪽 창살문 장치', open: ['창살문이 올라갔어요!', '서쪽 요새로 들어갈 수 있어요'] },
    ],
    idle: '창살문을 올리는 도르래 장치예요. 비율이 맞아야 움직인대요.',
    prompt: '도르래 톱니의 비율을 맞히면 창살문이 올라가요!',
  },
  forest: {
    title: '고대 원형 유적',
    walls: [{ rect: WEST_GAP, look: 'rubble' }],
    gates: [],
    altar: { id: 'ringAltar', x: 520, y: 1300, name: '원형 제단', open: ['원형 제단이 깨어났어요!', '마법진을 밟으면 서쪽 방으로 순간이동해요'] },
    pads: [
      { a: { x: 300, y: 1420 }, b: { x: 560, y: 860 }, need: 'ringAltar' },
      { a: { x: 230, y: 560 }, b: { x: 1340, y: 900 }, need: null },
    ],
    idle: '둥근 돌이 원을 그리며 놓인 제단이에요.',
    prompt: '제단의 원에 원주와 넓이를 묻는 룬이 새겨져 있어요.\n풀면 마법진이 깨어나요!',
  },
  snow: {
    title: '얼음 동굴',
    ice: [{ x: 1100, y: 1150, w: 1300, h: 470 }, { x: 1150, y: 700, w: 760, h: 290 }],
    gates: [
      { id: 'iceWall', look: 'ice', rect: EAST_GAP, term: { x: 1900, y: 1470, art: 'brazier' }, name: '얼음 녹이는 화로', open: ['얼음벽이 녹았어요!', '동쪽 얼음 동굴로 갈 수 있어요'] },
    ],
    idle: '꺼져 있는 커다란 화로예요. 불을 붙이면 얼음벽이 녹을 것 같아요.',
    prompt: '화로의 룬에 입체도형 문제가 새겨져 있어요.\n풀면 불이 붙어 얼음벽이 녹아요!',
  },
};

const TERM_ART = {
  cube: ['pack4/cube/cube_portal_stand', 104],
  anchor: ['pack4/harbor/anchor_statue', 80],
  knight: ['dungeon3/hooded_knight_statue', 110],
  brazier: ['dungeon3/large_brazier', 96],
};

export class Gimmicks {
  constructor(style, prefix) {
    this.cfg = GIMMICKS[style] || null;
    this.prefix = prefix;
    this.padCd = 0;
    this.slide = { x: 0, y: 0 };
  }

  gid(id) { return `${this.prefix}_${id}`; }
  on(save, id) {
    if (save?.activatedRunes?.includes(this.gid(id))) return true;
    // 장치가 생기기 전에 이미 봉인을 푼 저장(기존 진행)은 길을 막지 않아요
    const q3 = save?.quests?.[`${this.prefix}_q3`]?.state;
    return q3 === 'complete' || q3 === 'done';
  }

  // 장치(수학 문제로 여는 것)들 → 상호작용 목록
  interactables() {
    const c = this.cfg;
    if (!c) return [];
    const out = c.gates.map((g) => ({
      id: this.gid(g.id), kind: 'switch', x: g.term.x, y: g.term.y, r: 90, label: g.name, headY: -120,
      name: g.name, idleText: c.idle, promptText: c.prompt, doneText: `${g.name}: 이미 작동했어요.`,
      mathTitle: g.name, actionLabel: '장치 작동', doneBanner: g.open,
    }));
    if (c.altar) {
      const a = c.altar;
      out.push({
        id: this.gid(a.id), kind: 'switch', x: a.x, y: a.y, r: 100, label: a.name, headY: -110,
        name: a.name, idleText: c.idle, promptText: c.prompt, doneText: '원형 제단이 푸르게 빛나고 있어요.',
        mathTitle: a.name, actionLabel: '제단 깨우기', doneBanner: a.open,
      });
    }
    return out;
  }

  solids(save) {
    const c = this.cfg;
    if (!c) return [];
    const list = [];
    for (const g of c.gates) if (!this.on(save, g.id)) list.push(g.rect);
    for (const w of c.walls || []) list.push(w.rect);
    for (const g of c.gates) list.push({ x: g.term.x - 26, y: g.term.y - 34, w: 52, h: 16 });
    if (c.altar) list.push({ x: c.altar.x - 70, y: c.altar.y - 40, w: 140, h: 22 });
    return list;
  }

  iceAt(x, y) {
    return !!this.cfg?.ice?.some((r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
  }

  // 매 프레임: 빙판 미끄러짐 · 마법진 순간이동
  tick(dt, world, prev) {
    const c = this.cfg;
    if (!c) return;
    const g = world.game;
    const p = g.player;
    // 빙판: 입력은 가속만 하고, 멈추려 해도 한동안 미끄러져요 (공격·회피 중에는 평소대로)
    if (c.ice && !p.dead && !p.falling) {
      const onIce = this.iceAt(p.x, p.y + 21);
      if (onIce && dt > 0 && !p.attacking && p.dodgeT <= 0 && p.skillDashT <= 0) {
        const vx = (p.x - prev.x) / dt, vy = (p.y - prev.y) / dt;
        const k = Math.min(1, dt * 2.2); // 낮을수록 더 미끄러움
        this.slide.x += (vx - this.slide.x) * k;
        this.slide.y += (vy - this.slide.y) * k;
        p.x = prev.x + this.slide.x * dt;
        p.y = prev.y + this.slide.y * dt;
      } else {
        this.slide.x = onIce ? this.slide.x : 0;
        this.slide.y = onIce ? this.slide.y : 0;
      }
    }
    // 마법진: 밟으면 짝 마법진으로
    this.padCd = Math.max(0, this.padCd - dt);
    if (c.pads && this.padCd <= 0) {
      for (const pad of c.pads) {
        if (pad.need && !this.on(g.save, pad.need)) continue;
        for (const [from, to] of [[pad.a, pad.b], [pad.b, pad.a]]) {
          if (Math.hypot(p.x - from.x, p.y + 21 - from.y) < 34) {
            p.x = to.x; p.y = to.y - 21 + 50;
            this.padCd = 1.2;
            g.audio.playSfx('heal');
            world.combat.effects.push({ type: 'art', key: 'effects/pillar_blue', x: to.x, y: to.y - 40, h: 150, life: 0.6, max: 0.6 });
            g.renderer.snapCamera(world.scene, p);
            return;
          }
        }
      }
    }
  }

  drawGround(ctx, save, t) {
    const c = this.cfg;
    if (!c) return;
    // 빙판
    const water = assets.get('tiles3/water_0');
    for (const r of c.ice || []) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      if (water) { ctx.fillStyle = ctx.createPattern(water.img, 'repeat'); ctx.fillRect(r.x, r.y, r.w, r.h); }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#cfefff';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    }
    // 물길 (수문) — 열리면 젖은 바닥만 남음
    for (const g of c.gates) {
      if (g.look !== 'water') continue;
      const r = g.rect;
      ctx.save();
      if (!this.on(save, g.id) && water) {
        ctx.fillStyle = ctx.createPattern(water.img, 'repeat');
        ctx.translate((t * 12) % 64, 0);
        ctx.fillRect(r.x - (t * 12) % 64, r.y, r.w, r.h);
      } else {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      ctx.restore();
    }
    // 마법진
    for (const pad of c.pads || []) {
      const live = !pad.need || this.on(save, pad.need);
      for (const p of [pad.a, pad.b]) {
        assets.draw(ctx, 'dungeon3/blue_magic_circle', p.x, p.y + 30, { height: 64, alpha: live ? 0.75 + Math.sin(t * 4) * 0.2 : 0.3 });
      }
    }
  }

  drawables(save, t) {
    const c = this.cfg;
    if (!c) return [];
    const list = [];
    for (const g of c.gates) {
      const open = this.on(save, g.id);
      const r = g.rect;
      if (g.look === 'block' || g.look === 'ice') {
        const key = g.look === 'block' ? 'dungeon3/purple_crystal' : 'dungeon3/blue_crystal';
        for (let x = r.x + 40; x < r.x + r.w; x += 70) {
          list.push({ y: r.y + r.h, draw: (ctx) => assets.draw(ctx, key, x, r.y + r.h + 4, { height: open ? 28 : 86, alpha: open ? 0.35 : 1, tint: g.look === 'ice' ? '#e8f8ff' : null, tintA: g.look === 'ice' ? 0.35 : 0 }) });
        }
      } else if (g.look === 'bars') {
        for (let x = r.x + 100; x < r.x + r.w; x += 190) {
          list.push({ y: r.y + r.h, draw: (ctx) => assets.draw(ctx, 'dungeon3/small_iron_gate', x, r.y + r.h + 6 - (open ? 70 : 0), { height: 112, alpha: open ? 0.3 : 1 }) });
        }
      }
      const [art, h] = TERM_ART[g.term.art];
      list.push({
        y: g.term.y,
        draw: (ctx) => {
          assets.draw(ctx, art, g.term.x, g.term.y + 6, { height: h, tint: open ? null : '#5a5470', tintA: open ? 0 : 0.35 });
          if (g.term.art === 'brazier' && open) assets.draw(ctx, 'effects/burst_orange', g.term.x, g.term.y - h + 20, { height: 50 + Math.sin(t * 9) * 6, center: true, blend: 'lighter', alpha: 0.85 });
        },
      });
    }
    for (const w of c.walls || []) {
      const r = w.rect;
      for (let x = r.x + 50; x < r.x + r.w; x += 95) {
        const key = (x / 95) % 2 < 1 ? 'dungeon3/ruins_rubble_a' : 'dungeon3/ruins_rubble_b';
        list.push({ y: r.y + r.h, draw: (ctx) => assets.draw(ctx, key, x, r.y + r.h + 8, { height: 96 }) });
      }
    }
    if (c.altar) {
      const a = c.altar;
      list.push({ y: a.y, draw: (ctx) => assets.draw(ctx, 'dungeon3/ritual_altar', a.x, a.y + 10, { height: 100, tint: this.on(save, a.id) ? '#9ff3ff' : null, tintA: this.on(save, a.id) ? 0.25 + Math.sin(t * 3) * 0.1 : 0 }) });
    }
    return list;
  }

  drawOverlay(ctx, save, player) {
    const c = this.cfg;
    if (!c || !player) return;
    // 막힌 곳 앞에서 무엇을 해야 하는지 안내
    for (const g of c.gates) {
      if (this.on(save, g.id)) continue;
      const r = g.rect;
      const cx = Math.max(r.x + 60, Math.min(r.x + r.w - 60, player.x));
      if (Math.hypot(player.x - cx, player.y - (r.y + r.h / 2)) < 170) drawPlaque(ctx, cx, r.y - 14, `🔒 ${g.name}를 작동시키세요`);
    }
    for (const w of c.walls || []) {
      const r = w.rect;
      if (Math.hypot(player.x - (r.x + r.w / 2), player.y - (r.y + r.h)) < 200) drawPlaque(ctx, r.x + r.w / 2, r.y - 14, '무너진 길 — 원형 제단의 마법진을 이용하세요');
    }
  }
}
