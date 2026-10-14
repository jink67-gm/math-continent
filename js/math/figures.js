// 문제용 그림 (SVG 글자로 만들어서 문제 화면에 그대로 넣어요)
// - 쌓기나무 (비스듬히 본 그림 / 위에서 본 모양에 수 쓰기 / 앞·옆에서 본 모양)
// - 원기둥 · 원뿔 · 구 (부분 강조)

const INK = '#2b2140';
const FACE = { front: '#ffd27a', top: '#fff0c4', side: '#e9b55a' };

// grid[행][열] = 쌓은 개수, 0행이 가장 뒤쪽, 마지막 행이 가장 앞쪽
export function isoStackSvg(grid, s = 26) {
  const rows = grid.length;
  const cols = grid[0].length;
  const maxH = Math.max(1, ...grid.flat());
  const pad = 6;
  const ox = pad;
  const oy = pad + maxH * s + rows * 0.5 * s;
  const w = pad * 2 + cols * s + rows * 0.5 * s;
  const h = oy + pad;
  const cubes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let y = 0; y < grid[r][c]; y++) cubes.push({ X: c, Y: y, Z: rows - 1 - r });
    }
  }
  cubes.sort((a, b) => b.Z - a.Z || a.X - b.X || a.Y - b.Y);
  const poly = (pts, fill) => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  let body = '';
  for (const { X, Y, Z } of cubes) {
    const px = ox + X * s + Z * 0.5 * s;
    const py = oy - Y * s - Z * 0.5 * s;
    body += poly([[px, py], [px + s, py], [px + s, py - s], [px, py - s]], FACE.front);
    body += poly([[px, py - s], [px + s, py - s], [px + 1.5 * s, py - 1.5 * s], [px + 0.5 * s, py - 1.5 * s]], FACE.top);
    body += poly([[px + s, py], [px + s, py - s], [px + 1.5 * s, py - 1.5 * s], [px + 1.5 * s, py - 0.5 * s]], FACE.side);
  }
  return `<svg class="fig" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" width="${Math.round(w * 1.15)}" height="${Math.round(h * 1.15)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// 위에서 본 모양에 수 쓰기
export function topGridSvg(grid, { numbers = true } = {}) {
  const s = 34;
  const rows = grid.length;
  const cols = grid[0].length;
  const pad = 6;
  const w = cols * s + pad * 2;
  const h = rows * s + pad * 2 + 22;
  let body = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const x = pad + c * s;
      const y = pad + r * s;
      body += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${FACE.top}" stroke="${INK}" stroke-width="2"/>`;
      if (numbers) body += `<text x="${x + s / 2}" y="${y + s / 2 + 7}" text-anchor="middle" font-size="20" font-family="Jua, sans-serif" fill="${INK}">${grid[r][c]}</text>`;
    }
  }
  const ay = pad + rows * s + 4;
  body += `<text x="${w / 2}" y="${ay + 15}" text-anchor="middle" font-size="13" font-family="Jua, sans-serif" fill="#5a4f73">▲ 앞</text>`;
  return `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${Math.round(w * 1.2)}" height="${Math.round(h * 1.2)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// 앞(또는 옆)에서 본 모양: heights[i] = 왼쪽부터 i번째 줄의 높이
export function viewSvg(heights, s = 15) {
  const maxH = Math.max(1, ...heights, 3);
  const pad = 4;
  const w = heights.length * s + pad * 2;
  const h = maxH * s + pad * 2;
  let body = '';
  heights.forEach((ht, i) => {
    for (let y = 0; y < ht; y++) {
      body += `<rect x="${pad + i * s}" y="${h - pad - (y + 1) * s}" width="${s}" height="${s}" fill="${FACE.front}" stroke="${INK}" stroke-width="1.6"/>`;
    }
  });
  return `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// 앞에서 본 모양: 열마다 가장 높은 개수
export const frontView = (grid) => grid[0].map((_, c) => Math.max(...grid.map((row) => row[c])));
// 오른쪽 옆에서 본 모양: 화면 왼쪽이 앞, 오른쪽이 뒤
export const rightView = (grid) => grid.map((row) => Math.max(...row)).reverse();

// ---------------- 원기둥 · 원뿔 · 구 ----------------
const HL = '#ff4d6d';

export function cylinderSvg(hl = null) {
  const top = hl === 'base' ? 'fill="#ffd1dc" stroke="' + HL + '" stroke-width="4"' : `fill="#d9ecff" stroke="${INK}" stroke-width="2.5"`;
  const side = hl === 'side' ? '#ffd1dc' : '#bcdcff';
  const hLine = hl === 'height' ? `<line x1="132" y1="34" x2="132" y2="146" stroke="${HL}" stroke-width="4"/><text x="140" y="96" font-size="15" fill="${HL}" font-family="Jua">?</text>` : '';
  return `<svg class="fig" viewBox="0 0 160 180" width="170" height="190" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 34 L30 146 A50 16 0 0 0 130 146 L130 34" fill="${side}" stroke="${hl === 'side' ? HL : INK}" stroke-width="${hl === 'side' ? 4 : 2.5}"/>
    <path d="M30 146 A50 16 0 0 1 130 146" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>
    <ellipse cx="80" cy="34" rx="50" ry="16" ${top}/>
    ${hLine}
  </svg>`;
}

export function coneSvg(hl = null) {
  const parts = [];
  parts.push(`<path d="M80 18 L28 146 A52 16 0 0 0 132 146 Z" fill="#ffe0b8" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
  parts.push(`<path d="M28 146 A52 16 0 0 1 132 146" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>`);
  if (hl === 'slant') parts.push(`<line x1="80" y1="18" x2="132" y2="146" stroke="${HL}" stroke-width="5"/>`);
  if (hl === 'height') parts.push(`<line x1="80" y1="18" x2="80" y2="146" stroke="${HL}" stroke-width="4"/><rect x="80" y="136" width="10" height="10" fill="none" stroke="${HL}" stroke-width="2"/>`);
  if (hl === 'radius') parts.push(`<line x1="80" y1="146" x2="132" y2="146" stroke="${HL}" stroke-width="4"/><circle cx="80" cy="146" r="3" fill="${INK}"/>`);
  if (hl === 'apex') parts.push(`<circle cx="80" cy="18" r="7" fill="${HL}" stroke="${INK}" stroke-width="2"/>`);
  return `<svg class="fig" viewBox="0 0 160 175" width="170" height="185" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

export function sphereSvg(hl = null) {
  const parts = [`<circle cx="80" cy="80" r="62" fill="#e6d9ff" stroke="${INK}" stroke-width="2.5"/>`,
    `<ellipse cx="80" cy="80" rx="62" ry="16" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 4"/>`];
  if (hl === 'center') parts.push(`<circle cx="80" cy="80" r="6" fill="${HL}" stroke="${INK}" stroke-width="2"/>`);
  if (hl === 'radius') parts.push(`<circle cx="80" cy="80" r="3" fill="${INK}"/><line x1="80" y1="80" x2="142" y2="80" stroke="${HL}" stroke-width="4"/>`);
  return `<svg class="fig" viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

// 평면도형 (돌리기 문제용)
export function shapeSvg(kind) {
  let shape;
  if (kind === 'rect') shape = `<rect x="70" y="20" width="50" height="100" fill="#ffd27a" stroke="${INK}" stroke-width="2.5"/>`;
  else if (kind === 'triangle') shape = `<path d="M70 20 L70 120 L125 120 Z" fill="#ffd27a" stroke="${INK}" stroke-width="2.5"/>`;
  else shape = `<path d="M70 20 A50 50 0 0 1 70 120 Z" fill="#ffd27a" stroke="${INK}" stroke-width="2.5"/>`;
  return `<svg class="fig" viewBox="0 0 160 140" width="160" height="140" xmlns="http://www.w3.org/2000/svg">
    <line x1="70" y1="6" x2="70" y2="134" stroke="${HL}" stroke-width="3" stroke-dasharray="7 5"/>${shape}
    <text x="40" y="74" font-size="14" fill="${HL}" font-family="Jua">축</text></svg>`;
}
