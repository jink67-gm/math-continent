// 마을 양식별 전용 그림 (잔여 에셋 2차 팩: 항구 · 눈 · 큐브 도시)
// 기능 위치(촌장·상점·대장간·샘·게시판·출구)는 그대로 두고 그림만 양식에 맞게 바꿉니다.
// 그림을 못 불러오면 false → 기존 공통 그림으로 그려요.
import { assets } from '../render/AssetManager.js';
import { drawNew, drawPlaque, hashPick, artNewBuilding, drawNpc3 } from '../render/envArt.js';

const K = (k) => `pack4/${k}`;

// 마을 건물
// - 눈 마을: 핵심 에셋 v4 전용 건물 (눈 지붕 집 3종 · 촌장 집 · 대장간)
// - 항구 마을: 핵심 에셋 v4 어부 집 2종(부두 쪽 동쪽 집) · 배 수리소 겸 대장간, 촌장 집·룬의 집은 기존 건물
// - 큐브 도시: 2차 팩 큐브 건물
// 충돌 사각형·NPC·출입 위치는 그대로(TemplateVillage.solids) — 그림만 바뀌어요.
const V4 = (k) => `pack5/${k}`;
const V4_HOUSES = {
  snow: { main: ['snow/chief_house', 2.0], rune: ['snow/house_2', 1.85], others: [['snow/house_1', 1.75], ['snow/house_3', 1.9], ['snow/house_2', 1.8]] },
  // 항구 어부 집: 보완 에셋 v5의 눈 없는 항구 전용 그림 (1 파란 지붕 · 2 빨간 지붕). 폭 기준이라 차지하는 자리는 예전과 같아요
  harbor: { others: [['harbor/fisher_house_1', 1.85], ['harbor/fisher_house_2', 1.85]] },
};
const OLD_HARBOR = ['house_blue', 'house_roof_red'];
export function drawKitBuilding(ctx, style, b) {
  const set = V4_HOUSES[style];
  if (set) {
    const rune = b.sign && /룬/.test(b.sign);
    if (style === 'harbor' && (b.main || rune)) return false; // 촌장 집·룬의 집은 새 건물 세트(buildingSet)
    let e = b.main ? set.main : rune ? set.rune : null;
    if (!e && !b.main && !rune) e = set.others[(Math.round(b.x / 10) + Math.round(b.y / 10)) % set.others.length];
    if (e && drawNew(ctx, V4(e[0]), b.x, b.y + 10, null, { fade: true, width: b.w * e[1] })) {
      if (b.sign) drawPlaque(ctx, b.x, b.y + 4, b.sign);
      return true;
    }
    if (style === 'harbor' && !b.main && !rune) {
      if (!artNewBuilding(ctx, hashPick(b.x, b.y, OLD_HARBOR), b.x, b.y + 10, b.w * 1.62, { folder: 'buildings' })) return false;
      if (b.sign) drawPlaque(ctx, b.x, b.y + 2, b.sign);
      return true;
    }
    return false;
  }
  if (style !== 'cube') return false;
  const key = b.main ? 'cube/cube_research_tower' : b.sign ? 'cube/cube_portal_building' : hashPick(b.x, b.y, ['cube/cube_house', 'cube/cube_shop', 'cube/cube_house']);
  if (!drawNew(ctx, K(key), b.x, b.y + 8, b.w * 1.95, { fade: true })) return false;
  if (b.sign) drawPlaque(ctx, b.x, b.y + 4, b.sign);
  return true;
}

// 대장간 (눈 마을 전용 대장간 · 항구 배 수리소) — 대장장이 NPC와 대화 위치는 그대로
// 마을별 대장간 (그림 키 전체 경로)
const KIT_SMITHY = { snow: ['pack5/snow/smithy', 250, -6, 2], harbor: ['pack5/harbor/shipyard_smithy', 262, -4, 4], cube: ['pack6/bld_cube_smithy', 226, -6, 10] };
export function drawKitSmithy(ctx, style, x, y, t) {
  const e = KIT_SMITHY[style];
  if (!e || !drawNew(ctx, e[0], x + e[2], y + e[3], null, { fade: true, width: e[1] })) return false;
  drawNpc3(ctx, 'blacksmith', x + 74, y + 54, t, { face: -1 });
  drawPlaque(ctx, x - 10, y + 2, style === 'harbor' ? '배 수리소 · 대장간' : style === 'cube' ? '큐브 대장간' : '대장간');
  return true;
}

// 상점 가판대 / 치유의 샘 / 마을 표지판
export const KIT_STALL = { cube: ['cube/cube_market_stall', 150], harbor: ['harbor/fish_market_stall', 150] };
export const KIT_FOUNTAIN = { cube: ['cube/crystal_fountain', 120] };
export const KIT_SIGN = { harbor: ['harbor/harbor_sign', 90], snow: ['snow/snow_signpost', 92] };
export const KIT_LAMP = { harbor: 'harbor/harbor_lamp', snow: 'snow/snow_street_lamp', cube: 'cube/cube_lantern_a' };

export function drawKit(ctx, table, style, x, y) {
  const e = table[style];
  return !!(e && drawNew(ctx, K(e[0]), x, y + 6, e[1]));
}

// 장식 종류별 대체 (눈 나무 · 눈 덤불 · 눈사람 · 큐브 장식 · 등대 · 배)
export function drawKitDecor(ctx, style, d) {
  const flip = hashPick(d.y, d.x, [false, true]);
  switch (d.type) {
    case 'pine': if (style === 'snow') return drawNew(ctx, K(`snow/${hashPick(d.x, d.y, ['pine_a', 'pine_b', 'pine_c'])}`), d.x, d.y + 8, 172 * d.s, { fade: true, flip }); return false;
    case 'bush': if (style === 'snow') return drawNew(ctx, K(`snow/${hashPick(d.x, d.y, ['snow_bush_plain', 'snow_bush_small', 'snow_bush_holly'])}`), d.x, d.y + 4, 46 * d.s, { flip }); return false;
    // 눈사람: 2차 팩 snowman_hood는 원본 오른쪽이 잘려 있어 빼고 빨강·파랑 2종만
    case 'snowman': return drawNew(ctx, K(`snow/${hashPick(d.x, d.y, ['snowman_red', 'snowman_blue', 'snowman_red'])}`), d.x, d.y + 4, 74);
    case 'cubeBlock': return drawNew(ctx, K(`cube/${hashPick(d.x, d.y, ['cube_planter', 'cube_monument', 'cube_planter'])}`), d.x, d.y + 6, 70);
    case 'lighthouse': return drawNew(ctx, K('harbor/lighthouse'), d.x, d.y + 8, 230, { fade: true });
    case 'boat': return drawNew(ctx, K(d.color ? 'harbor/rowboat' : 'harbor/sailboat'), d.x, d.y + 10, d.color ? 64 : 150, { flip: !!d.color });
    default: return false;
  }
}

// 양식별 추가 소품 (빈 땅에만, 큰 것은 발밑 충돌)
export const KIT_EXTRAS = {
  harbor: [
    { k: 'harbor/dock_wide', x: 2080, y: 1180, h: 96 }, { k: 'harbor/cargo_stack', x: 1975, y: 1060, h: 66, solid: [130, 24] },
    { k: 'harbor/fishing_net', x: 2010, y: 960, h: 86, solid: [50, 16] }, { k: 'harbor/anchor_statue', x: 1330, y: 1050, h: 70, solid: [70, 22] },
    { k: 'harbor/banner_post', x: 985, y: 700, h: 100, solid: [26, 12] }, { k: 'harbor/banner_post', x: 1215, y: 700, h: 100, solid: [26, 12] },
    { k: 'harbor/cargo_crane', x: 1985, y: 1560, h: 150, solid: [110, 26] },
    { k: 'harbor/ship_large', x: 2150, y: 760, h: 200 }, { k: 'harbor/dock_small', x: 2085, y: 860, h: 70 },
  ],
  snow: [
    { k: 'snow/snow_bench', x: 880, y: 1200, h: 46, solid: [86, 16] }, { k: 'snow/snow_logs', x: 420, y: 1060, h: 48, solid: [96, 18] },
    { k: 'snow/snow_camp_props', x: 1830, y: 1080, h: 54, solid: [100, 18] }, { k: 'snow/snow_lantern_hanging', x: 985, y: 700, h: 96 },
    { k: 'snow/snow_lantern_hanging', x: 1215, y: 700, h: 96 }, { k: 'snow/snow_fence_horizontal', x: 230, y: 1015, h: 56, solid: [140, 14] },
    { k: 'snow/snow_fence_horizontal', x: 1950, y: 1015, h: 56, solid: [140, 14] },
  ],
  cube: [
    { k: 'cube/cube_portal_stand', x: 990, y: 440, h: 96, solid: [56, 18] }, { k: 'cube/cube_portal_stand', x: 1210, y: 440, h: 96, solid: [56, 18] },
    { k: 'cube/cube_bench', x: 880, y: 1200, h: 44, solid: [86, 16] }, { k: 'cube/cube_monument', x: 1330, y: 1050, h: 80, solid: [60, 20] },
    { k: 'cube/cube_planter', x: 420, y: 1060, h: 56, solid: [80, 18] }, { k: 'cube/cube_planter', x: 1830, y: 1080, h: 56, solid: [80, 18] },
  ],
};
const FOOT = 21;
export function kitSolids(style) {
  return (KIT_EXTRAS[style] || []).filter((e) => e.solid).map((e) => ({ x: e.x - e.solid[0] / 2, y: e.y - e.solid[1] - FOOT + 6, w: e.solid[0], h: e.solid[1] }));
}
export function kitDrawables(style) {
  return (KIT_EXTRAS[style] || []).filter((e) => assets.meta[K(e.k)]).map((e) => ({
    y: e.k.includes('dock') ? e.y - 60 : e.y,
    draw: (ctx) => drawNew(ctx, K(e.k), e.x, e.y + 4, e.h, { fade: e.h > 120 }),
  }));
}

// 공통 가로등 자리(광장 네 귀퉁이)를 양식별 가로등으로
const LAMP_SPOTS = [[1002, 872], [1198, 872], [1002, 1265], [1198, 1265]];
export function kitLamps(style) {
  const k = KIT_LAMP[style];
  if (!k || !assets.meta[K(k)]) return null;
  return LAMP_SPOTS.map(([x, y], i) => ({ y, draw: (ctx) => drawNew(ctx, K(style === 'cube' && i % 2 ? 'cube/cube_lantern_b' : k), x, y + 4, 86) }));
}
