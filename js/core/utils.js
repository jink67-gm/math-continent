// 공통 도우미 함수 모음

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function formatPlayTime(sec) {
  sec = Math.floor(sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분`;
  return '1분 미만';
}

// 소수 계산 오차 없이 숫자를 문자열로 (예: 9.42000001 → "9.42")
export function fmtNum(x) {
  return String(parseFloat(Number(x).toFixed(4)));
}

export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 기본값(base) 위에 저장 데이터(src)를 덮어씌움. 새로 생긴 항목은 기본값으로 채워짐.
export function deepMerge(base, src) {
  if (!isPlainObject(base)) return src === undefined ? base : src;
  const out = { ...base };
  if (!isPlainObject(src)) return out;
  for (const k of Object.keys(src)) {
    out[k] = isPlainObject(base[k]) ? deepMerge(base[k], src[k]) : (src[k] === undefined ? base[k] : src[k]);
  }
  return out;
}

export const clone = (o) => JSON.parse(JSON.stringify(o));

export function withTimeout(promise, ms, label = '작업') {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`${label} 시간 초과`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

// localStorage가 막혀 있어도 게임이 멈추지 않도록 감싼 저장소
export const storage = {
  get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn('[storage] 저장 실패', e);
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* 무시 */ }
  },
};

export function randomId(len = 10) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// 색을 밝게(+) / 어둡게(-)
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => clamp(Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt), 0, 255);
  r = f(r); g = f(g); b = f(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
