// 수학 문제에서 쓰는 작은 도우미 (예전 게임 js/core/utils.js에서 필요한 것만 옮김)

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const rand = (a, b) => a + Math.random() * (b - a);

export const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

export function fmtNum(x) {
  return String(parseFloat(Number(x).toFixed(4)));
}
