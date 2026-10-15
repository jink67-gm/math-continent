// 문제 글자 → 화면 표시용 HTML
// 문제은행에서는 분수를 이렇게 씁니다:
//   {3/4}   → 4분의 3 (위아래로 쌓인 분수)
//   {1 2/3} → 1과 3분의 2 (대분수)
//   줄바꿈은 \n

import { escapeHtml } from '../core/utils.js';

const frac = (n, d) => `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`;

export function formatMath(text) {
  let s = escapeHtml(text ?? '');
  s = s.replace(/\{(\d+)\s+(\d+)\/(\d+)\}/g, (_, w, n, d) => `<span class="mixed"><span class="whole">${w}</span>${frac(n, d)}</span>`);
  s = s.replace(/\{(\d+)\/(\d+)\}/g, (_, n, d) => frac(n, d));
  s = s.replace(/\n/g, '<br>');
  return s;
}

// 화면 읽기 프로그램용 글자 (예: "3/4")
export function plainMath(text) {
  return String(text ?? '')
    .replace(/\{(\d+)\s+(\d+)\/(\d+)\}/g, '$1과 $2/$3')
    .replace(/\{(\d+)\/(\d+)\}/g, '$1/$2');
}
