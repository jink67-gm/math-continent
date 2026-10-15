// 환경·건물·NPC 그림 연결 (그림이 없으면 false → 기존 캔버스 그림 사용)
import { assets } from './AssetManager.js';

// ---------- 새 에셋 공통 상태 ----------
// artState.player: 이번 프레임 플레이어 발 위치 (Renderer가 넣어 줌) → 나무·건물 뒤에 있으면 반투명
// artState.talk: 지금 대화 중인 NPC 위치 (Interactions가 넣어 줌) → 그 NPC는 말하는 동작
export const artState = { player: null, talk: null, fades: new Map() };

// 큰 물체 뒤에 플레이어가 있으면 0.5, 아니면 1 (부드럽게 바뀜)
function fadeFor(x, y, w, h, id) {
  const p = artState.player;
  let target = 1;
  if (p && p.foot < y - 6) {
    const r = { x: x - w / 2, y: y - h, w, h: h * 0.92 };
    if (p.x + 18 > r.x && p.x - 18 < r.x + r.w && p.foot > r.y && p.foot - 70 < r.y + r.h) target = 0.5;
  }
  const k = id ?? `${Math.round(x)},${Math.round(y)}`;
  let a = artState.fades.get(k) ?? 1;
  a += (target - a) * 0.2;
  artState.fades.set(k, a);
  return a;
}

// 새 그림 그리기: 높이(height) 또는 너비(width)로 크기 맞추고(가로세로 비율 유지), 원하면 가림 처리
export function drawNew(ctx, key, x, y, height, { fade = false, flip = false, alpha = 1, width = null } = {}) {
  const a = assets.get(key);
  if (!a) return false;
  const s = width ? width / a.m.w : height / a.m.h;
  const al = fade ? fadeFor(x, y, a.m.w * s * 0.8, a.m.h * s) : 1;
  return assets.draw(ctx, key, x, y, { scale: s, flipX: flip, alpha: al * alpha });
}

// 위치로 정해지는 "랜덤" (매 프레임 같은 그림이 나오도록)
export function hashPick(x, y, list) {
  const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  return list[Math.floor(h * list.length)];
}

function hue(color) {
  const m = /^#?([0-9a-f]{6})$/i.exec(color || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return { h: 0, s: 0 };
  const d = max - min;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: d / max };
}

export function artTree(ctx, x, y, s, leaf) {
  // 새 자연물(assets/nature): 큰 나무 · 노란 큰 나무 · 작은 나무
  const nk = hashPick(x, y, ['tree_big', 'tree_big', 'tree_big_yellow', 'tree_small', 'tree_big', 'tree_young']);
  const nh = nk === 'tree_small' ? 128 : nk === 'tree_young' ? 112 : 172;
  if (drawNew(ctx, `nature/${nk}`, x, y + 8, nh * s, { fade: true, flip: hashPick(y, x, [false, true]) })) return true;
  const hh = hue(leaf);
  let key;
  if (hh && hh.s > 0.3 && (hh.h < 45 || hh.h > 330)) key = hh.h > 330 || hh.h < 15 ? 'tree_pink' : 'tree_orange';
  else key = hashPick(x, y, ['tree_green', 'tree_green', 'tree_small', 'tree_green', 'tree_small']);
  return assets.draw(ctx, `environment/${key}`, x, y + 6, { height: (key === 'tree_small' ? 100 : 112) * s });
}

export function artPine(ctx, x, y, s) {
  if (drawNew(ctx, 'nature/tree_pine', x, y + 8, 168 * s, { fade: true, flip: hashPick(y, x, [false, true]) })) return true;
  return assets.draw(ctx, 'environment/tree_pine', x, y + 4, { height: 110 * s });
}

export function artBush(ctx, x, y, s, color) {
  const nb = hashPick(x, y, ['bush', 'bush_flower', 'bush_berry', 'bush', 'bush_yellow']);
  if (drawNew(ctx, `nature/${nb}`, x, y + 4, 46 * s, { flip: hashPick(y, x, [false, true]) })) return true;
  const hh = hue(color);
  const list = hh && hh.h > 150 && hh.h < 200
    ? ['bush_blueberry', 'plant_leafy', 'fern']
    : ['bush_white_flower', 'bush_blueberry', 'bush_redberry', 'bush_yellow', 'bush_pink_flower', 'bush_daisy', 'plant_leafy', 'fern'];
  const key = hashPick(x, y, list);
  return assets.draw(ctx, `environment/${key}`, x, y + 3, { height: 38 * s });
}

export function artRock(ctx, x, y, s) {
  const nr = hashPick(x, y, ['rock_mid', 'rock_small', 'rock_tiny', 'rock_small']);
  if (drawNew(ctx, `nature/${nr}`, x, y + 4, (nr === 'rock_mid' ? 46 : nr === 'rock_small' ? 38 : 28) * s)) return true;
  const key = hashPick(x, y, ['rock_small', 'rock_flat', 'rock_tiny', 'rock_small', 'rock_mossy']);
  return assets.draw(ctx, `environment/${key}`, x, y + 3, { height: (key === 'rock_mossy' ? 40 : 30) * s });
}

export function artFlower(ctx, x, y, color) {
  const hh = hue(color);
  let key = 'flower_daisy';
  if (hh) {
    if (hh.s < 0.2) key = 'flower_daisy';
    else if (hh.h < 20 || hh.h > 320) key = 'flower_red';
    else if (hh.h < 70) key = 'flower_yellow';
    else if (hh.h > 240) key = 'flower_lavender';
  }
  return assets.draw(ctx, `environment/${key}`, x, y + 2, { height: 20 });
}

// 나무 간판
export function drawPlaque(ctx, x, y, text) {
  if (!text) return;
  ctx.save();
  ctx.font = '14px Jua, sans-serif';
  const w = Math.max(54, ctx.measureText(text).width + 20);
  ctx.fillStyle = '#5a3d26';
  ctx.strokeStyle = '#2a1c12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - w / 2, y - 12, w, 24, 6) : ctx.rect(x - w / 2, y - 12, w, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe7a3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

// 집 그림 고르기 — 새 마을 건물 시트(pack6, 원본 가로 250~350px)를 화면에서 줄여 그려 선명하게
// 일반 집 5종(초가·빨강·파랑·초록 지붕 + 상점) / 촌장 집 / 교회 / 성 / 마법 연구소 / 큐브 대장간
// 화면 너비(px): 일반 집 200 · 촌장 집 260 · 랜드마크 200~270 → 원본의 0.6~0.9배 (늘리지 않음)
// (마을 장면은 js/world/buildingSet.js가 먼저 그리고, 여기는 초원의 집 등 나머지 자리에 써요)
export const PACK6_W = {
  bld_house_red: 210, bld_house_blue: 215, bld_house_green: 210, bld_house_thatch: 205, bld_house_shop: 210,
  bld_chief_house: 262, bld_church: 196, bld_castle: 270, bld_magic_lab: 200, bld_cube_smithy: 230,
};
const HOUSE_POOL = ['bld_house_red', 'bld_house_blue', 'bld_house_thatch', 'bld_house_green', 'bld_house_red', 'bld_house_blue'];
export function newHouseKey(x, y, sign = '', art = null) {
  if (art && PACK6_W[art]) return art;
  if (/왕궁/.test(sign)) return 'bld_castle';
  if (/촌장|시청|선장|장로|산지기/.test(sign)) return 'bld_chief_house';
  if (/룬/.test(sign)) return 'bld_magic_lab';
  return HOUSE_POOL[(Math.round(x / 37) + Math.round(y / 53)) % HOUSE_POOL.length];
}
// 충돌 너비: 그려지는 건물 너비의 72% (지붕 끝·화분은 지나갈 수 있게, 벽·기초만 막음)
export function houseFootWidth(x, y, w, sign = '', art = null) {
  const key = newHouseKey(x, y, sign, art);
  return assets.meta[`pack6/${key}`] ? PACK6_W[key] * 0.72 : w + 12;
}
export function artNewBuilding(ctx, key, x, y, width, { fade = true, folder = 'buildings3' } = {}) {
  const a = assets.get(`${folder}/${key}`);
  if (!a) return false;
  const s = Math.min(width / a.m.w, folder === 'buildings3' ? 9 : 0.9);
  const al = fade ? fadeFor(x, y, a.m.w * s * 0.9, a.m.h * s) : 1;
  return assets.draw(ctx, `${folder}/${key}`, x, y, { scale: s, alpha: al });
}

export function artHouse(ctx, x, y, w, sign, kind = null) {
  const key = newHouseKey(x, y, sign, kind);
  if (artNewBuilding(ctx, key, x, y + 12, PACK6_W[key], { folder: 'pack6' })) {
    if (sign) drawPlaque(ctx, x, y + 8, sign);
    return true;
  }
  const old = /촌장|시청|선장|왕궁|장로|산지기/.test(sign) ? 'house_blue' : /룬/.test(sign) ? 'house_roof_purple' : 'house_roof_red';
  if (artNewBuilding(ctx, old, x, y + 10, w * 1.62, { folder: 'buildings' })) {
    if (sign) drawPlaque(ctx, x, y + 6, sign);
    return true;
  }
  return false;
}

export function artBuilding(ctx, key, x, y, width, oy = 8) {
  const a = assets.get(`buildings/${key}`);
  if (!a) return false;
  return assets.draw(ctx, `buildings/${key}`, x, y + oy, { scale: width / a.m.w });
}

export function artEnv(ctx, key, x, y, height) {
  return assets.draw(ctx, `environment/${key}`, x, y, { height });
}

// ---------- NPC ----------
// 역할·마을별 NPC 그림
const CHIEF_BY_STYLE = { valley: 'merchant', cube: 'scholar', harbor: 'merchant', castle: 'knight', forest: 'elf_archer', peak: 'scholar', snow: 'scholar' };
export function npcArtKey(role, style) {
  if (role === 'chief') return CHIEF_BY_STYLE[style] || 'knight';
  if (role === 'merchant' || role === 'shop') return 'alchemist';
  if (role === 'smith' || role === 'forge') return 'blacksmith';
  if (role === 'sage' || role === 'skill') return 'sage';
  if (role === 'fairy') return 'fairy';
  return null;
}

export const NPC_HEIGHT = 74;

// 예전 NPC 이름 → 새 NPC 애니메이션(assets/npc3) 이름
export const NPC3 = {
  merchant: 'math_sage', sage: 'mysterious_mage', alchemist: 'traveling_merchant', blacksmith: 'blacksmith',
  scholar: 'librarian', knight: 'town_guard', elf_archer: 'village_guide',
};
const NPC3_H = 86; // 화면 높이(px) — 주인공과 비슷하게

// 새 NPC: 대기 3프레임(2fps) / 대화 4프레임(4fps), 발 기준
export function drawNpc3(ctx, id, x, y, t, { talk = null, face = 1 } = {}) {
  const idle = assets.get(`npc3/${id}/idle_01`);
  if (!idle) return false;
  const tk = artState.talk;
  const talking = talk ?? (tk && Math.abs(tk.x - x) < 90 && Math.abs(tk.y - y) < 70);
  const seed = (x * 0.37) % 1;
  const f = talking ? `talk_0${1 + (Math.floor(t * 4 + seed * 4) % 4)}` : `idle_0${1 + (Math.floor(t * 2 + seed * 3) % 3)}`;
  const key = assets.get(`npc3/${id}/${f}`) ? `npc3/${id}/${f}` : `npc3/${id}/idle_01`;
  const s = NPC3_H / idle.m.h;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 30, 15, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  assets.draw(ctx, key, x, y + 3, { scale: s, flipX: face < 0 });
  ctx.restore();
  return true;
}

export function drawNpcArt(ctx, key, x, y, t, { talk = false, face = 1 } = {}) {
  if (!key) return false;
  if (NPC3[key] && drawNpc3(ctx, NPC3[key], x, y, t, { face, talk: talk || null })) return true;
  const k = `npc/${key}_${talk ? 'talk' : 'idle'}`;
  const idle = assets.get(`npc/${key}_idle`);
  if (!idle || !assets.get(k)) return false;
  const s = NPC_HEIGHT / idle.m.h * (key === 'fairy' ? 0.85 : 1);
  ctx.save();
  ctx.fillStyle = 'rgba(20, 30, 15, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const fly = key === 'fairy' ? 18 + Math.sin(t * 3) * 5 : 0;
  assets.draw(ctx, k, x, y + 2 - fly, { scale: s, flipX: face < 0, sy: 1 + Math.sin(t * 2.2) * 0.012 });
  ctx.restore();
  return true;
}

// ---------- 장식 소품 (충돌 없음, 보기만) ----------
// k: environment 그림 이름, h: 높이(px)
export const VILLAGE_PROPS = [
  { k: 'crates_stacked', x: 1575, y: 868, h: 52 }, { k: 'barrel', x: 1340, y: 872, h: 40 },
  { k: 'barrel_open', x: 1372, y: 884, h: 36 },
  { k: 'logs', x: 690, y: 1192, h: 40 }, { k: 'barrel_2', x: 432, y: 1188, h: 40 },
  { k: 'lamppost', x: 1002, y: 872, h: 82 }, { k: 'lamppost', x: 1198, y: 872, h: 82 },
  { k: 'lamppost', x: 1002, y: 1265, h: 82 }, { k: 'lamppost', x: 1198, y: 1265, h: 82 },
];
export const FARM_PROPS = [
  { k: 'fence_wood', x: 185, y: 958, h: 34 }, { k: 'fence_wood', x: 292, y: 958, h: 34 },
  { k: 'hay_bale', x: 250, y: 1262, h: 40 }, { k: 'haystack', x: 1960, y: 1262, h: 62 },
  { k: 'fence_wood', x: 1880, y: 958, h: 34 }, { k: 'fence_wood', x: 1990, y: 958, h: 34 },
  { k: 'sack', x: 1880, y: 1255, h: 32 }, { k: 'bucket', x: 330, y: 1262, h: 26 },
];
export const MEADOW_PROPS = [
  { k: 'tent', x: 1300, y: 640, h: 96 }, { k: 'campfire', x: 1200, y: 700, h: 58 }, { k: 'logs', x: 1140, y: 690, h: 34 },
  { k: 'lamppost', x: 1062, y: 690, h: 82 }, { k: 'lamppost', x: 905, y: 470, h: 82 },
  { k: 'barrel', x: 330, y: 560, h: 38 }, { k: 'crate', x: 372, y: 572, h: 34 }, { k: 'haystack', x: 140, y: 590, h: 58 },
  { k: 'fence_wood', x: 640, y: 420, h: 34 }, { k: 'fence_wood', x: 745, y: 420, h: 34 },
  { k: 'fence_wood', x: 1150, y: 420, h: 34 }, { k: 'fence_wood', x: 1255, y: 420, h: 34 },
  { k: 'cart', x: 560, y: 610, h: 50 }, { k: 'treasure_pile', x: 1860, y: 1180, h: 44 },
];

// 예전 소품 → 새 그림 (있으면). 높이 배율 m
const PROP_NEW = {
  lamppost: ['pack6/deco_lamppost', 1.42], barrel: ['village2/barrel', 1.05], barrel_2: ['village2/barrel', 1.05],
  fence_wood: ['terrain3/fences_13', 1.5], signpost: ['village2/signpost', 1.2], crate: ['dungeon3/wooden_crates', 1.1],
  crates_stacked: ['dungeon3/wooden_crates', 1.0], sack: ['dungeon3/cloth_sack', 1.1], bucket: ['dungeon3/wood_bucket', 1.2],
  barrel_open: ['dungeon3/broken_barrel', 1.0],
};
export function propDrawables(list) {
  return list.map((p) => ({
    y: p.y,
    draw: (ctx) => {
      const n = PROP_NEW[p.k];
      if (n && assets.get(n[0])) { assets.draw(ctx, n[0], p.x, p.y + 4, { height: p.h * n[1] }); return; }
      assets.draw(ctx, `environment/${p.k}`, p.x, p.y + 2, { height: p.h });
    },
  }));
}
