// 비주얼 테스트용 그림 불러오기 (assets/v2)
// - v2_manifest.json : 건물·소품·몬스터·NPC·효과·UI 크기와 기준점
// - player/frames.json : 주인공 프레임별 기준점 (머리 중심 x, 발 y)
// 그림이 없거나 못 불러오면 그 그림만 빠지고 나머지는 계속 동작합니다.

const BASE = 'assets/v2/';

export const img = new Map();   // key → HTMLImageElement
export let meta = {};
export let frames = {};
export const missing = [];

function loadOne(key, url) {
  return new Promise((resolve) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { img.set(key, im); resolve(im); };
    im.onerror = () => { missing.push(key); resolve(null); };
    im.src = url;
  });
}

async function loadAll(list, parallel = 8, onProgress) {
  let i = 0, done = 0;
  const worker = async () => {
    while (i < list.length) {
      const [k, u] = list[i++];
      await loadOne(k, u);
      done++;
      onProgress?.(done / list.length);
    }
  };
  await Promise.all(Array.from({ length: parallel }, worker));
}

export const TEXTURES = ['grass', 'grass_dark', 'dirt', 'water', 'canopy', 'cliff_top', 'cliff_top2', 'cliff_wall', 'bridge', 'waterfall',
  'decal_flower_blue', 'decal_flower_yellow', 'decal_flower_rose', 'decal_flowerbed', 'decal_bush', 'decal_wildflower', 'decal_daisy', 'decal_bush_flower'];
// 원본 타일(비교용) — 실제 그림 기준 번호
export const RAW_TILES = ['31', '03', '27', '07', '08', '24', '29', '04', '28'];

export async function loadImages(onProgress) {
  const [m, f] = await Promise.all([
    fetch(BASE + 'v2_manifest.json').then((r) => r.json()).catch(() => ({})),
    fetch(BASE + 'player/frames.json').then((r) => r.json()).catch(() => ({})),
  ]);
  meta = m;
  frames = f;
  const list = [];
  for (const k of Object.keys(meta)) list.push([k, `${BASE}${k}.webp`]);
  for (const k of Object.keys(frames)) list.push(['player/' + k, `${BASE}player/${k}.webp`]);
  for (const t of TEXTURES) list.push(['tiles/' + t, `${BASE}tiles/${t}.webp`]);
  for (const t of RAW_TILES) list.push(['raw/' + t, `${BASE}tiles/raw/${t}.webp`]);
  await loadAll(list, 8, onProgress);
}

// 한 가지 색으로 칠한 사본 (피격 번쩍임용) — 한 번 만들면 재사용
const tintCache = new Map();
export function tinted(key, color) {
  const ck = key + '|' + color;
  if (tintCache.has(ck)) return tintCache.get(ck);
  const im = img.get(key);
  if (!im) return null;
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  tintCache.set(ck, c);
  return c;
}
