// 던전·보스 지도의 테마: 바닥 무늬 · 벽 틀 · 물/용암 · 어둠의 정도 · 불빛 · 떠다니는 것들
// 지도 설정(data/rNmaps.js)에 style: '테마 이름' 과 필요하면 torches: [[x, y], ...] 를 적어요.
//
//   labyrinth 돌 미궁 (어두운 돌바닥 · 갈색 벽돌 벽 · 횃불)
//   sea       바다 동굴 (모래 물가 · 푸른 어둠 · 물방울)
//   palace    궁궐 (대리석 무늬 바닥 · 융단 · 밝은 벽 틀 · 화로 불빛 · 먼지 반짝임)
//   ruins     덩굴 유적 (초록 대리석 · 초록 벽돌 · 나뭇잎 · 빛줄기)
//   lava      용암 동굴 (용암 강 · 붉은 어둠 · 불티 · 열기 안개)
//   grove     숲 깊은 곳 바깥 (나뭇잎 · 빛줄기)          ← 바깥 보스 지도
//   summit    눈 덮인 정상 바깥 (눈보라 · 구름 안개)        ← 바깥 보스 지도
//   whirl     소용돌이 바다 바깥 (빙글빙글 물결)            ← 바깥 보스 지도
// 그림: Ninja Adventure TilesetInteriorFloor · TilesetWallSimple · FX/Environment (CC0), 용암은 tools/build_lava.py

const T = 16;
const FLOOR_COLS = 22; // TilesetInteriorFloor 가로 칸
const WALL_COLS = 10;  // TilesetWallSimple 가로 칸

const rnd16 = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

export const STYLES = {
  labyrinth: {
    floor: { kind: 'random', tiles: [[12, 13], [13, 13], [12, 14], [13, 14], [16, 13], [17, 13], [18, 13], [16, 14], [17, 14], [18, 14]] },
    path: { kind: 'random', tiles: [[16, 15], [17, 15], [18, 15], [19, 13]] },
    wall: [0, 6], dark: 0.8, shade: [10, 8, 18], fx: ['dust'], deco: ['zl_crates', 'barrel', 'zl_rock', 'zl_pebbles'],
  },
  sea: {
    water: 'sand', dark: 0.72, shade: [4, 16, 34], fx: ['bubbles'], deco: ['crystal_b', 'crystal_c', 'zl_rock', 'zl_pebbles', 'rock_grey_s'],
  },
  palace: {
    floor: { kind: 'panel', origin: [11, 0] }, path: { kind: 'panel', origin: [0, 6] },
    wall: [0, 0], dark: 0.42, shade: [24, 12, 6], fx: ['dust'], deco: ['zl_pot_blue', 'zl_plant_big', 'zl_pot_white', 'barrel'],
  },
  ruins: {
    floor: { kind: 'panel', origin: [11, 6] }, path: { kind: 'random', tiles: [[12, 7], [13, 7], [12, 8]] },
    wall: [5, 6], dark: 0.5, shade: [6, 18, 10], fx: ['leaves', 'rays'], deco: ['bush_a', 'bush_c', 'grass_a', 'flower_b', 'zl_rock'],
  },
  lava: {
    water: 'lava', dark: 0.62, shade: [30, 6, 2], fx: ['embers', 'fog'], deco: ['ore_a', 'ore_b', 'rock_brown_s', 'zl_rock'],
  },
  grove: { fx: ['leaves', 'rays'] },
  summit: { fx: ['snow', 'fog'], fogAlpha: 0.1 },
  whirl: { fx: ['whirl'] },
};

// 바닥 무늬를 한 장에 구워요 (벽·물 칸은 빼고). 길('d')은 path 무늬로.
export function paintFloor(scene, b, style) {
  if (!style?.floor) return null;
  const rt = scene.add.renderTexture(0, 0, b.cols * T, b.rows * T).setOrigin(0, 0).setDepth(-990);
  const pick = (spec, x, y) => {
    if (spec.kind === 'panel') return [spec.origin[0] + (x % 3), spec.origin[1] + (y % 3)];
    return spec.tiles[rnd16(x, y) % spec.tiles.length];
  };
  rt.beginDraw();
  for (let y = 0; y < b.rows; y++) {
    for (let x = 0; x < b.cols; x++) {
      if (b.isWall(x, y) || b.grid.get(x, y) === 'w') continue;
      const spec = b.grid.get(x, y) === 'd' && style.path ? style.path : style.floor;
      const [fx, fy] = pick(spec, x, y);
      rt.batchDrawFrame('na/ifloor', fy * FLOOR_COLS + fx, x * T, y * T);
    }
  }
  rt.endDraw();
  return rt;
}

// 벽 덩어리 크기 (작은 기둥은 벽 틀 대신 돌기둥으로 그려요)
function wallSize(b, x, y) {
  if (!b._wallComp) {
    b._wallComp = new Map();
    for (let yy = 0; yy < b.rows; yy++) {
      for (let xx = 0; xx < b.cols; xx++) {
        if (!b.isWall(xx, yy) || b._wallComp.has(`${xx},${yy}`)) continue;
        const cells = [];
        const stack = [[xx, yy]];
        const seen = new Set([`${xx},${yy}`]);
        while (stack.length) {
          const [cx, cy] = stack.pop();
          cells.push(`${cx},${cy}`);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const k = `${cx + dx},${cy + dy}`;
            if (!seen.has(k) && b.isWall(cx + dx, cy + dy)) { seen.add(k); stack.push([cx + dx, cy + dy]); }
          }
        }
        for (const k of cells) b._wallComp.set(k, cells.length);
      }
    }
  }
  return b._wallComp.get(`${x},${y}`) || 0;
}

// 벽 틀 (TilesetWallSimple 5×5 묶음): 열린 쪽을 보고 모서리·가장자리 조각을 골라요. 안쪽 칸은 어둡게 채워요.
// 작은 기둥(8칸 이하)은 false를 돌려줘서 돌기둥(동굴 바위 그림)으로 그리게 해요.
export function drawStyledWall(scene, g, b, x, y, [gx, gy]) {
  if (wallSize(b, x, y) <= 8) return false;
  const open = (dx, dy) => b.in(x + dx, y + dy) && !b.isWall(x + dx, y + dy);
  const u = open(0, -1);
  const d = open(0, 1);
  const l = open(-1, 0);
  const r = open(1, 0);
  let piece = null;
  if (d && r && !u && !l) piece = [0, 0];
  else if (d && l && !u && !r) piece = [4, 0];
  else if (u && r && !d && !l) piece = [0, 4];
  else if (u && l && !d && !r) piece = [4, 4];
  else if (d) piece = [x % 2 ? 1 : 3, 0];
  else if (u) piece = [x % 2 ? 1 : 3, 4];
  else if (r) piece = [0, 1 + (y % 3)];
  else if (l) piece = [4, 1 + (y % 3)];
  if (!piece) {
    g.fillStyle(0x16121a, 1).fillRect(x * T, y * T, T, T);
    return true;
  }
  scene.add.image(x * T, y * T, 'na/iwall', (gy + piece[1]) * WALL_COLS + gx + piece[0]).setOrigin(0, 0).setDepth(-870);
  return true;
}

// 작은 그림들 (점·나뭇잎·빛 동그라미)을 한 번만 만들어 둬요
export function ensureTextures(scene) {
  const tex = scene.textures;
  if (!tex.exists('px_dot')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1).fillCircle(2, 2, 2).generateTexture('px_dot', 4, 4).destroy();
  }
  if (!tex.exists('px_leaf')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x7cc85a, 1).fillEllipse(3, 2, 6, 3).fillStyle(0x4f9a3a, 1).fillRect(1, 2, 4, 1).generateTexture('px_leaf', 6, 4).destroy();
  }
  if (!tex.exists('light_glow')) {
    const c = tex.createCanvas('light_glow', 128, 128);
    const ctx = c.getContext();
    const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    c.refresh();
  }
}

// 화로·횃불: 받침 + 일렁이는 불꽃 + 어둠 위로 비치는 불빛
export function placeTorches(scene, list) {
  ensureTextures(scene);
  for (const [tx, ty] of list || []) {
    const x = tx * T;
    const y = ty * T;
    const g = scene.add.graphics().setDepth(y - 1);
    g.fillStyle(0x2a2226, 1).fillRect(x - 5, y - 8, 10, 8).fillStyle(0x6a5a52, 1).fillRect(x - 6, y - 10, 12, 3);
    const f = scene.add.sprite(x, y - 14, 'na/flam', 1).setBlendMode('ADD').setScale(0.42).setDepth(y + 1);
    f.play('fx_flam_loop');
    const glow = scene.add.image(x, y - 12, 'light_glow').setBlendMode('ADD').setTint(0xffa040).setScale(0.9).setAlpha(0.55).setDepth(90001);
    scene.tweens.add({ targets: glow, alpha: 0.38, scale: 0.8, duration: 260 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.addSolid(x - 5, y - 6, 10, 6);
  }
}

// 떠다니는 것들·빛줄기·안개·소용돌이
export function addAtmosphere(scene, style, W, H) {
  if (!style?.fx) return;
  ensureTextures(scene);
  const fx = style.fx;
  const emit = (texture, cfg) => scene.add.particles(0, 0, texture, cfg).setDepth(90002);
  if (fx.includes('embers')) emit('px_dot', { x: { min: 0, max: W }, y: { min: H * 0.2, max: H }, lifespan: 3200, speedY: { min: -28, max: -10 }, speedX: { min: -6, max: 6 }, scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.95, end: 0 }, tint: [0xff7a2a, 0xffb040, 0xff4a1a], blendMode: 'ADD', frequency: 90 });
  if (fx.includes('bubbles')) emit('px_dot', { x: { min: 0, max: W }, y: { min: H * 0.3, max: H }, lifespan: 4200, speedY: { min: -16, max: -6 }, speedX: { min: -3, max: 3 }, scale: { start: 0.6, end: 1.2 }, alpha: { start: 0.6, end: 0 }, tint: 0x9fe4ff, frequency: 140 });
  if (fx.includes('dust')) emit('px_dot', { x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 6000, speedY: { min: -4, max: 4 }, speedX: { min: -5, max: 5 }, scale: { start: 0.5, end: 0.3 }, alpha: { start: 0, end: 0.5, ease: 'Sine.inOut' }, tint: 0xfff0c0, blendMode: 'ADD', frequency: 160 });
  if (fx.includes('leaves')) emit('px_leaf', { x: { min: 0, max: W }, y: { min: -10, max: H * 0.6 }, lifespan: 7000, speedY: { min: 6, max: 14 }, speedX: { min: -10, max: 4 }, rotate: { min: 0, max: 360 }, scale: { min: 0.7, max: 1.1 }, alpha: { start: 0.9, end: 0 }, frequency: 260 });
  if (fx.includes('snow')) emit('px_dot', { x: { min: -40, max: W }, y: { min: -10, max: H * 0.5 }, lifespan: 6000, speedY: { min: 14, max: 30 }, speedX: { min: 6, max: 18 }, scale: { min: 0.4, max: 0.9 }, alpha: { start: 0.95, end: 0.2 }, tint: 0xffffff, frequency: 45 });
  if (fx.includes('rays')) {
    for (let i = 0; i < 4; i++) {
      const r = scene.add.image(W * (0.15 + i * 0.24), 30 + (i % 2) * 40, 'fx/raylight').setOrigin(0.5, 0).setBlendMode('ADD').setAlpha(0.28).setScale(1.2, 1.8).setDepth(90003);
      scene.tweens.add({ targets: r, alpha: 0.12, duration: 2400 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }
  if (fx.includes('fog')) {
    const f = scene.add.tileSprite(0, 0, W, H, 'fx/fog').setOrigin(0, 0).setAlpha(style.fogAlpha ?? 0.18).setDepth(90003);
    if (style.water === 'lava') f.setTint(0xff9a6a);
    scene.events.on('update', () => { f.tilePositionX += 0.15; f.tilePositionY += 0.05; });
  }
  if (fx.includes('whirl')) {
    const g = scene.add.graphics().setDepth(-850);
    let a = 0;
    scene.events.on('update', () => {
      a += 0.01;
      g.clear();
      for (let k = 0; k < 4; k++) {
        const rr = W * 0.62 + k * 22;
        g.lineStyle(2, 0xe8fbff, 0.35 - k * 0.06);
        g.beginPath();
        g.arc(W / 2, H * 0.42, rr, a + k * 0.7, a + k * 0.7 + Math.PI * 0.9);
        g.strokePath();
      }
    });
  }
}
