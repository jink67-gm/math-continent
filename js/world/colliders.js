// 장식물 충돌 · 길막 정리 (마을·필드 공통)
// - 플레이어 좌표는 몸 가운데, 발은 +21px. 나무·바위·울타리는 "발이 닿는 밑동"만 막아요(겉모습 아래쪽과 맞춤).
// - 큰 나무·바위가 길·다리·출구·NPC를 가리지 않도록 지도를 만들 때 걸러 내요.
// 한 번만 계산해서(장면 만들 때) 매 프레임 다시 만들지 않아요.
import { assets } from '../render/AssetManager.js';

const FOOT = 21;
const TILE = 64;
const ROAD = new Set(['=', 'c', 'S', 'b', 'P']); // P = 광장 (새 광장 타일)

// 발밑 사각형 (x: 가운데, y: 그림 바닥)
export function footRect(x, y, w, h = 12) {
  return { x: x - w / 2, y: y - FOOT - h + 4, w, h };
}

// 장식(decor) 종류별 밑동 너비 (그림 크기 s 배율)
const DECOR_W = { tree: 26, pine: 22, cubeTree: 24, rock: 30, snowman: 30, cubeBlock: 40, tower: 64, lighthouse: 70 };
export function decorSolids(decor) {
  const out = [];
  for (const d of decor) {
    const w = DECOR_W[d.type];
    if (!w) continue;
    out.push(footRect(d.x, d.y, w * (d.s || 1), d.type === 'tower' || d.type === 'lighthouse' ? 26 : 12));
  }
  return out;
}

// 소품(VILLAGE_PROPS 등): 그림 너비 × 비율. 0이면 막지 않음(작은 양동이 등)
const PROP_FRAC = {
  lamppost: 0.16, fence_wood: 0.95, tent: 0.7, campfire: 0.55, cart: 0.7, haystack: 0.7, hay_bale: 0.7,
  barrel: 0.75, barrel_2: 0.75, barrel_open: 0.7, crate: 0.8, crates_stacked: 0.8, logs: 0.75, treasure_pile: 0.6,
  sack: 0, bucket: 0,
};
const PROP_KEY = {
  lamppost: ['pack6/deco_lamppost', 1.42], barrel: ['village2/barrel', 1.05], barrel_2: ['village2/barrel', 1.05],
  fence_wood: ['terrain3/fences_13', 1.5], crate: ['dungeon3/wooden_crates', 1.1], crates_stacked: ['dungeon3/wooden_crates', 1.0],
  barrel_open: ['dungeon3/broken_barrel', 1.0],
};
export function propSolids(list) {
  const out = [];
  for (const p of list) {
    const frac = PROP_FRAC[p.k] ?? 0.6;
    if (!frac) continue;
    const [key, mult] = PROP_KEY[p.k] || [`environment/${p.k}`, 1];
    const m = assets.meta[key];
    const h = p.h * mult;
    const w = m ? (m.w * h) / m.h : p.h;
    out.push(footRect(p.x, p.y + 4, Math.max(14, w * frac), 12));
  }
  return out;
}

// 그 자리 근처에 길(흙길·돌바닥·다리)이 있는지 — 지도 칸으로 확인
export function roadNear(spec, x, y, rx, up, down) {
  const g = spec?.grid;
  if (!g) return false;
  for (let j = Math.floor((y - up) / TILE); j <= Math.floor((y + down) / TILE); j++) {
    const row = g[j];
    if (!row) continue;
    for (let i = Math.floor((x - rx) / TILE); i <= Math.floor((x + rx) / TILE); i++) {
      if (ROAD.has(row[i])) return true;
    }
  }
  return false;
}

// 길·출구·NPC·상호작용 자리를 가리는 장식 빼기 (테두리 숲은 길이 없는 곳에서는 그대로)
export function clearPaths(decor, { spec, exits = [], interactables = [], keep = [] } = {}) {
  return decor.filter((d) => {
    if (keep.includes(d.type)) return true;
    const big = d.type === 'tree' || d.type === 'pine' || d.type === 'cubeTree';
    const s = d.s || 1;
    // 큰 나무: 잎이 위로 크게 퍼지므로 위쪽 길도 확인
    if (roadNear(spec, d.x, d.y, big ? 52 * s : 26, big ? 150 * s : 28, 18)) return false;
    for (const e of exits) {
      const r = e.rect;
      if (d.x > r.x - 90 && d.x < r.x + r.w + 90 && d.y > r.y - 60 && d.y < r.y + r.h + (big ? 200 : 80)) return false;
      if (e.marker && Math.hypot(d.x - e.marker.x, d.y - e.marker.y) < (big ? 130 : 70)) return false;
    }
    for (const o of interactables) {
      if (Math.hypot(d.x - o.x, d.y - o.y) < (big ? 130 : 80)) return false;
    }
    return true;
  });
}
