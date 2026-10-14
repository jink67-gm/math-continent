// 화면 그리기 담당
// 장면(scene)이 땅과 사물을 알려주면, 카메라를 맞추고 y 순서대로 그립니다.

import { drawHero } from './sprites.js';
import { drawHeroSprite, drawHeroPortrait } from './heroSprites.js';
import { clamp } from '../core/utils.js';
import { artState } from './envArt.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: 0 };
    this.floaters = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    // 고해상도 화면(태블릿·노트북)에서 캔버스 픽셀이 너무 많으면 버벅여요 → 최대 약 240만 픽셀로 제한
    const want = Math.min(2, window.devicePixelRatio || 1);
    const dpr = Math.max(1, Math.min(want, Math.sqrt(2400000 / Math.max(1, this.w * this.h))));
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
  }

  // 카메라를 플레이어 위치로 바로 옮김
  snapCamera(scene, player) {
    this.cam = this.targetCam(scene, player);
  }

  targetCam(scene, player) {
    const b = scene.bounds;
    const worldTop = 0;
    const worldH = b.y + b.h;
    const maxX = Math.max(0, b.x + b.w - this.w);
    const maxY = Math.max(0, worldH - this.h);
    return {
      x: clamp(player.x - this.w / 2, 0, maxX),
      y: clamp(player.y - this.h / 2, worldTop, maxY),
    };
  }

  // 머리 위로 떠오르는 글자 (+5 EXP, 피해 숫자 등)
  addFloater(text, x, y, color = '#ffffff', size = 20) {
    this.floaters.push({ text, x, y, color, size, life: 1.1 });
    if (this.floaters.length > 40) this.floaters.shift();
  }

  // world: WorldManager (scene + 몬스터 + 보상 + 효과)
  render(world, player, heroColor, t, dt, save) {
    const ctx = this.ctx;
    const scene = world.scene;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high'; // 큰 건물 그림을 줄여 그릴 때 깨짐(계단 현상) 줄이기

    const target = this.targetCam(scene, player);
    const k = 1 - Math.pow(0.0005, dt);
    this.cam.x += (target.x - this.cam.x) * k;
    this.cam.y += (target.y - this.cam.y) * k;
    const shake = world.shakeOffset();
    const cam = { x: Math.round(this.cam.x + shake.x), y: Math.round(this.cam.y + shake.y) };

    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    scene.drawGround(ctx, cam, this.w, this.h, t, save, world);

    artState.player = { x: player.x, foot: player.y + 21 };
    const items = [...scene.drawables(t, player, save), ...world.drawables(t)]
      .filter((d) => d.y > cam.y - 60 && d.y < cam.y + this.h + 160);
    const heroOpts = {
      color: heroColor,
      variant: save?.characterVariant,
      t: player.t,
      moving: player.moving,
      facing: player.facing,
      lastHx: player.lastHx,
      attack: player.attackProgress,
      attackStep: player.attacking ? player.comboStep : 0,
      attackProgress: player.attackProgress,
      hitT: player.hitT,
      skillT: player.skillT,
      flash: player.hitT > 0.2 ? 0.8 : 0,
      dodge: player.dodgeT > 0 || player.skillDashT > 0,
      dodgeT: player.dodgeT,
      blink: player.invulnT > 0 && player.dodgeT <= 0 && player.hitT <= 0 && !player.dead && Math.floor(player.t * 16) % 2 === 0,
      guard: player.guardT > 0,
      dead: player.dead,
      falling: player.falling ? player.fallProgress : null,
    };
    items.push({
      y: player.y,
      draw: (c) => {
        // 캐릭터 그림이 있으면 스프라이트, 없으면 기본 그림
        if (!drawHeroSprite(c, player.x, player.y, heroOpts)) drawHero(c, player.x, player.y, heroOpts);
      },
    });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw(ctx);

    world.drawEffects(ctx);
    ctx.restore();

    // 동굴 어둠 (플레이어 주변만 밝게)
    if (scene.darkness) {
      const px = player.x - cam.x;
      const py = player.y - cam.y - 20;
      const grad = ctx.createRadialGradient(px, py, 150, px, py, Math.max(this.w, this.h) * 0.75);
      grad.addColorStop(0, 'rgba(12,8,24,0)');
      grad.addColorStop(0.35, `rgba(12,8,24,${scene.darkness * 0.6})`);
      grad.addColorStop(1, `rgba(12,8,24,${scene.darkness})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.w, this.h);
    }

    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    scene.drawOverlay?.(ctx, t, player, save);
    world.drawOverlay(ctx, t);
    this.drawFloaters(ctx, dt);
    ctx.restore();

    // 맞았을 때 화면 가장자리 붉게
    if (player.flashT > 0) {
      ctx.save();
      ctx.globalAlpha = player.flashT * 1.6;
      const grad = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.35, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.7);
      grad.addColorStop(0, 'rgba(255,60,80,0)');
      grad.addColorStop(1, 'rgba(255,60,80,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.restore();
    }
  }

  drawFloaters(ctx, dt) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2b2140';
    this.floaters = this.floaters.filter((f) => (f.life -= dt) > 0);
    for (const f of this.floaters) {
      const p = 1 - f.life / 1.1;
      ctx.font = `${f.size}px Jua, sans-serif`;
      ctx.globalAlpha = Math.min(1, f.life * 2);
      const y = f.y - p * 46;
      ctx.strokeText(f.text, f.x, y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, y);
    }
    ctx.globalAlpha = 1;
  }

  // 캐릭터 얼굴 그림을 작은 캔버스에
  drawPortrait(canvas, color, scale = 1.25, variant = null) {
    if (variant && drawHeroPortrait(canvas, variant)) return;
    const c = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = canvas.clientWidth || canvas.width;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size, size);
    drawHero(c, size / 2, size / 2 + 8 * scale, { color, scale, facing: { x: 1, y: 0.2 } });
  }
}
