// 바닥 질감: 체크무늬 대신 그림처럼 자연스러운 땅
// - 512px 질감(풀잎·얼룩 / 돌바닥 금·자갈)을 한 번 만들어 두고 반복
// - 그 위에 큰 빛·그늘 얼룩을 세계 좌표에 고정해서 반복 느낌을 줄여요
const cache = new Map();

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shadeHex(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function makeTexture(a, b, kind) {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d');
  const rnd = seeded(kind === 'stone' ? 99 : 7);
  c.fillStyle = a;
  c.fillRect(0, 0, S, S);
  // 큰 얼룩 (경계가 이어지도록 9칸에 같이 그림)
  const blot = (x, y, r, color, alpha) => {
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, color.replace('rgb', 'rgba').replace(')', `,${alpha})`));
        g.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ',0)'));
        c.fillStyle = g;
        c.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      }
    }
  };
  for (let i = 0; i < 22; i++) blot(rnd() * S, rnd() * S, 40 + rnd() * 90, shadeHex(b, (rnd() - 0.5) * 0.08), 0.55);
  for (let i = 0; i < 14; i++) blot(rnd() * S, rnd() * S, 20 + rnd() * 50, shadeHex(a, 0.05 + rnd() * 0.04), 0.5);
  if (kind === 'grass') {
    // 풀잎
    for (let i = 0; i < 900; i++) {
      const x = rnd() * S;
      const y = rnd() * S;
      const h = 4 + rnd() * 7;
      const lean = (rnd() - 0.5) * 4;
      c.strokeStyle = rnd() < 0.5 ? shadeHex(a, -0.12 - rnd() * 0.08) : shadeHex(a, 0.07 + rnd() * 0.05);
      c.globalAlpha = 0.35 + rnd() * 0.35;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + lean * 0.5, y - h * 0.6, x + lean, y - h);
      c.stroke();
    }
    c.globalAlpha = 1;
  } else {
    // 돌바닥: 판석 금 + 자갈
    c.strokeStyle = 'rgba(10,8,20,0.22)';
    c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      let x = rnd() * S;
      let y = rnd() * S;
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rnd() - 0.5) * 50;
        y += (rnd() - 0.5) * 50;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    for (let i = 0; i < 160; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
      c.beginPath();
      c.ellipse(rnd() * S, rnd() * S, 1.5 + rnd() * 4, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  return cv;
}

// a: 기본 색, b: 얼룩 색, kind: 'grass' | 'stone'
export function drawTerrain(ctx, cam, w, h, a, b, kind = 'grass') {
  const key = `${a}|${b}|${kind}`;
  let pat = cache.get(key);
  if (!pat) {
    try {
      pat = ctx.createPattern(makeTexture(a, b, kind), 'repeat');
    } catch (e) {
      pat = null;
    }
    cache.set(key, pat);
  }
  ctx.fillStyle = pat || a;
  ctx.fillRect(cam.x - 2, cam.y - 2, w + 4, h + 4);
  // 큰 빛·그늘 얼룩 (세계 좌표 360px 칸마다 하나)
  const C = 360;
  for (let gy = Math.floor(cam.y / C) - 1; gy <= Math.floor((cam.y + h) / C) + 1; gy++) {
    for (let gx = Math.floor(cam.x / C) - 1; gx <= Math.floor((cam.x + w) / C) + 1; gx++) {
      const r = Math.abs(Math.sin(gx * 127.1 + gy * 311.7) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin(gx * 269.5 + gy * 183.3) * 12345.678) % 1;
      const x = gx * C + r * C;
      const y = gy * C + r2 * C;
      const rad = 140 + r * 160;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const light = r2 > 0.5;
      g.addColorStop(0, light ? 'rgba(255,250,200,0.10)' : 'rgba(10,30,10,0.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
}
