// 마을 분위기 — 양식별 전용 구역 + 보스 처치 뒤 바뀌는 마을 모습
//  · 원형 숲: 고대 돌기둥이 원을 그리는 '원형 숲터'와 거목·버섯 고리, 숲 그늘(어두운 바닥빛)
//  · 입체 산맥: 보스를 물리치기 전에는 주민 둘이 광장에서 얼어붙어 있어요 → 처치하면 풀려나요
//  · 모든 마을: 보스 처치 뒤 광장에 깃발 기둥과 축하하는 주민이 나타나요 (저장값 bossesDefeated 그대로 사용)
import { assets } from '../render/AssetManager.js';
import { drawNew, drawPlaque, drawNpc3 } from '../render/envArt.js';

const FOOT = 21;

// 고정 소품: { key, x, y(바닥), h(그릴 높이), solid:[너비, 높이] }
const EXTRAS = {
  forest: [
    // 남서쪽 빈터: 거목 + 버섯 고리 (원 모양)
    { key: 'nature/tree_big', x: 800, y: 1450, h: 210, solid: [56, 20] },
    ...ring(800, 1462, 118, 42, 8).map(([x, y]) => ({ key: 'environment/mushrooms', x, y, h: 26 })),
    // 북쪽 숲터(관문 너머): 고대 돌기둥 원
    ...ring(480, 430, 150, 58, 7).map(([x, y], i) => ({ key: i % 2 ? 'dungeon3/short_ancient_pillar' : 'dungeon3/tall_ancient_pillar', x, y, h: i % 2 ? 70 : 104, solid: [26, 12] })),
    { key: 'environment/stump', x: 480, y: 436, h: 40, solid: [44, 14] },
    { key: 'nature/tree_big_yellow', x: 1720, y: 440, h: 200, solid: [56, 20] },
    { key: 'environment/logs', x: 1560, y: 470, h: 50, solid: [60, 14] },
  ],
};

function ring(cx, cy, rx, ry, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    out.push([Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)]);
  }
  return out;
}

const avail = (k) => !!assets.meta[k];

export function moodSolids(style) {
  return (EXTRAS[style] || []).filter((e) => e.solid).map((e) => ({ x: e.x - e.solid[0] / 2, y: e.y - e.solid[1] - FOOT + 8, w: e.solid[0], h: e.solid[1] }));
}

// 광장 축하 자리 (분수·게시판·벤치와 겹치지 않는 곳)
const FEST_POSTS = [[880, 1010], [1320, 990]];
const FEST_FOLK = [['village_guide', 975, 995, 1], ['librarian', 1228, 1000, -1]];

export function moodDrawables(style, village, save, t) {
  const out = [];
  for (const e of EXTRAS[style] || []) {
    if (!avail(e.key)) continue;
    out.push({ y: e.y, draw: (ctx) => drawNew(ctx, e.key, e.x, e.y + 4, e.h, { fade: e.h > 150 }) });
  }
  if (style === 'forest' && avail('dungeon3/tall_ancient_pillar')) {
    out.push({ y: 300, draw: (ctx) => drawPlaque(ctx, 480, 520, '원형 숲터') });
  }
  const cleared = !!save?.bossesDefeated?.includes(village);
  if (style === 'snow' && !cleared) {
    // 얼어붙은 주민 (보스를 물리치면 풀려나요)
    for (const [id, x, y, face] of FEST_FOLK) {
      const k = `npc3/${id}/idle_01`;
      if (!avail(k)) continue;
      out.push({
        y,
        draw: (ctx) => {
          const m = assets.meta[k];
          const s = 86 / m.h;
          assets.draw(ctx, k, x, y + 3, { scale: s, flipX: face < 0, tint: '#bfe6ff', tintA: 0.62 });
        },
      });
    }
    out.push({ y: 1010, draw: (ctx) => drawPlaque(ctx, 1100, 905, '얼어붙은 주민들') });
  }
  if (cleared) {
    const post = style === 'snow' ? 'pack4/snow/snow_lantern_hanging' : 'pack4/harbor/banner_post';
    if (avail(post)) for (const [x, y] of FEST_POSTS) out.push({ y, draw: (ctx) => drawNew(ctx, post, x, y + 4, 96) });
    for (const [id, x, y, face] of FEST_FOLK) {
      out.push({
        y,
        draw: (ctx) => {
          // 축하하며 통통 뛰는 주민 (대화 프레임 사용)
          const hop = Math.max(0, Math.sin(t * 5 + x)) * 6;
          drawNpc3(ctx, id, x, y - hop, t, { talk: true, face });
        },
      });
    }
  }
  return out;
}

export function moodSolidsFor(style, village, save) {
  const list = moodSolids(style);
  // 얼어붙은/축하하는 주민은 발밑만 막아요
  if (style === 'snow' || save?.bossesDefeated?.includes(village)) {
    for (const [, x, y] of FEST_FOLK) list.push({ x: x - 16, y: y - 10, w: 32, h: 14 });
    for (const [x, y] of FEST_POSTS) if (save?.bossesDefeated?.includes(village)) list.push({ x: x - 12, y: y - 12, w: 24, h: 12 });
  }
  return list;
}

// 전용 소품 자리에 있던 일반 나무·덤불은 치워요
const CLEAR = { forest: [[800, 1440, 170], [480, 430, 200], [1720, 440, 110], [1560, 470, 60]] };
export function moodClear(style, d) {
  return !(CLEAR[style] || []).some(([x, y, r]) => Math.hypot(d.x - x, d.y - y) < r);
}

// 숲 그늘: 원형 숲만 바닥을 살짝 어둡고 푸르게
export function moodGround(ctx, style, cam, w, h) {
  if (style !== 'forest') return;
  ctx.save();
  ctx.fillStyle = 'rgba(16, 54, 34, 0.2)';
  ctx.fillRect(cam.x, cam.y, w, h);
  ctx.restore();
}
