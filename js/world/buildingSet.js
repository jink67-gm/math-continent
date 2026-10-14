// 새 마을 건물·길가 장식 (pack6: 건물 시트 10종 · 장식 시트 12종을 개별 PNG로 분리)
// 원본은 가로 260~360px → 화면에서는 0.6~0.95배로 줄여 그려 선명해요(늘리지 않음).
// 마을 양식(style)마다 쓰는 건물이 달라요:
//   valley(분수 계곡) · castle(비례 왕국) · forest(원형 숲) · harbor(소수 항구: 촌장·룬의 집만) — snow·cube는 전용 세트(villageKits)
import { assets } from '../render/AssetManager.js';
import { drawPlaque, artState } from '../render/envArt.js';

export const P6 = (k) => `pack6/${k}`;
const FOOT = 21;

// 일반 집 5종 (같은 그림이 붙어 반복되지 않게 위치 순서로 돌려 씀)
const HOUSES = {
  valley: ['bld_house_thatch', 'bld_house_red', 'bld_house_blue', 'bld_house_green'],
  castle: ['bld_house_red', 'bld_house_blue', 'bld_house_green', 'bld_house_red'],
  forest: ['bld_house_green', 'bld_house_blue', 'bld_house_green', 'bld_house_red'],
  harbor: ['bld_house_blue', 'bld_house_red'],
};
// 특별한 건물 (랜드마크)
const MAIN = { valley: ['bld_chief_house', 270], castle: ['bld_castle', 300], forest: ['bld_house_thatch', 250], harbor: ['bld_house_blue', 248] }; // 분수 계곡만 붉은 저택 — 숲은 초가 오두막, 항구는 푸른 지붕 집
const RUNE = { valley: ['bld_magic_lab', 200], castle: ['bld_church', 196], forest: ['bld_magic_lab', 206], harbor: ['bld_magic_lab', 196] };
const HOUSE_W = 226;

// b: { x, y, main, sign, i } → { key, width } (그림이 없으면 null)
export function buildingFor(style, b) {
  const set = HOUSES[style];
  if (!set) return null;
  let e;
  if (b.main) e = MAIN[style];
  else if (b.sign && /룬/.test(b.sign)) e = RUNE[style];
  else e = [set[(b.i ?? 0) % set.length], HOUSE_W];
  if (!e || !assets.meta[P6(e[0])]) return null;
  return { key: P6(e[0]), width: e[1] };
}

// 건물 충돌: 그림 바닥(벽이 땅에 닿는 곳)만. 지붕 쪽은 뒤로 지나갈 수 있고(반투명), 앞 계단 쪽은 비워 둠
export function buildingSolid(style, b) {
  const spec = buildingFor(style, b);
  if (!spec) return null;
  const sw = spec.width * (spec.key.includes('castle') || spec.key.includes('church') ? 0.62 : 0.66);
  return { x: b.x - sw / 2, y: b.y - 58, w: sw, h: 46 };
}

function fade(x, y, w, h) {
  const p = artState.player;
  if (!p) return 1;
  // 건물 뒤(위쪽)에 있으면 반투명
  return p.foot < y - 6 && p.foot > y - h + 20 && Math.abs(p.x - x) < w * 0.45 ? 0.55 : 1;
}

export function drawBuildingSet(ctx, style, b) {
  const spec = buildingFor(style, b);
  if (!spec) return false;
  const a = assets.get(spec.key);
  if (!a) return false;
  const s = spec.width / a.m.w;
  const y = b.y + 10;
  assets.draw(ctx, spec.key, b.x, y, { scale: s, alpha: fade(b.x, y, spec.width, a.m.h * s) });
  if (b.sign) drawPlaque(ctx, b.x, b.y + 4, b.sign);
  return true;
}

// ---------- 길가 장식 ----------
// 장식 하나: { k, x, y(그림 바닥), w(그릴 너비), solid(밑동 너비 비율, 0이면 통과) }
export function decoDrawables(list) {
  return list.filter((d) => assets.meta[P6(d.k)]).map((d) => ({
    y: d.y,
    draw: (ctx) => {
      const m = assets.meta[P6(d.k)];
      assets.draw(ctx, P6(d.k), d.x, d.y, { scale: d.w / m.w });
    },
  }));
}
export function decoSolids(list) {
  return list.filter((d) => d.solid).map((d) => {
    const w = d.w * d.solid;
    return { x: d.x - w / 2, y: d.y - FOOT - 14, w, h: 16 };
  });
}

// 마을 양식별 길가 장식 배치 (광장·집 앞·상점 옆 — 길목과 출구는 비워 둠)
// 공통 배치: 광장(1100,1080) · 촌장 집(760,860) · 상점(1460,900) · 대장간(560,1230) · 게시판(1290,1180) · 남쪽 출구(1100,1560)
const DECO_SETS = {
  valley: [
    { k: 'deco_flowerbed_round', x: 600, y: 930, w: 110, solid: 0.7 },
    { k: 'deco_planter_box', x: 340, y: 885, w: 120, solid: 0.8 },
    { k: 'deco_bench_flowers', x: 905, y: 1182, w: 130, solid: 0.7 },
    { k: 'deco_goods_pile', x: 1610, y: 905, w: 110, solid: 0.7 },
    { k: 'deco_shrub_rocks', x: 1760, y: 1330, w: 110, solid: 0.6 },
    { k: 'deco_planter_box', x: 1880, y: 885, w: 120, solid: 0.8 },
  ],
  castle: [
    { k: 'deco_garden_gate', x: 600, y: 940, w: 120, solid: 0.6 },
    { k: 'deco_planter_box', x: 340, y: 885, w: 120, solid: 0.8 },
    { k: 'deco_bench_flowers', x: 905, y: 1182, w: 130, solid: 0.7 },
    { k: 'deco_goods_pile', x: 1610, y: 905, w: 110, solid: 0.7 },
    { k: 'deco_flowerbed_round', x: 1760, y: 1330, w: 110, solid: 0.7 },
  ],
  forest: [
    { k: 'deco_shrub_rocks', x: 600, y: 935, w: 115, solid: 0.6 },
    { k: 'deco_flowerbed_round', x: 340, y: 890, w: 110, solid: 0.7 },
    { k: 'deco_bench_flowers', x: 905, y: 1182, w: 130, solid: 0.7 },
    { k: 'deco_flower_arch', x: 1760, y: 1330, w: 120, solid: 0 },
    { k: 'deco_shrub_rocks', x: 1880, y: 890, w: 110, solid: 0.6 },
  ],
  harbor: [
    { k: 'deco_goods_pile', x: 1610, y: 905, w: 110, solid: 0.7 },
    { k: 'deco_bench_flowers', x: 905, y: 1182, w: 130, solid: 0.7 },
  ],
};
export function decoFor(style) { return DECO_SETS[style] || []; }

// 치유의 샘 · 게시판 · 표지판 · 가로등 (양식별)
const HEAL = { valley: ['deco_fountain', 200], castle: ['deco_fountain', 200], harbor: ['deco_fountain', 196], forest: ['deco_flower_well', 150] };
export function drawHealSpot(ctx, style, x, y) {
  const e = HEAL[style];
  const m = e && assets.meta[P6(e[0])];
  if (!m || !assets.get(P6(e[0]))) return false;
  assets.draw(ctx, P6(e[0]), x, y + 22, { scale: e[1] / m.w });
  return true;
}
export function drawBoardSet(ctx, style, x, y) {
  if (!['valley', 'castle', 'forest'].includes(style)) return false;
  const m = assets.meta[P6('deco_quest_board')];
  if (!m || !assets.get(P6('deco_quest_board'))) return false;
  assets.draw(ctx, P6('deco_quest_board'), x, y + 10, { scale: 128 / m.w });
  return true;
}
export function drawSignSet(ctx, x, y, text) {
  const m = assets.meta[P6('deco_signpost')];
  if (!m || !assets.get(P6('deco_signpost'))) return false;
  assets.draw(ctx, P6('deco_signpost'), x, y + 8, { scale: 86 / m.w });
  if (text) drawPlaque(ctx, x, y - 112, text);
  return true;
}
