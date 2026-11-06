// 이야기 인트로: 새 게임을 시작하면 한 번 보여 줘요 (타이틀의 「이야기 보기」로 다시 볼 수 있어요)
//  1. 평화로운 수학 대륙과 여섯 결정   2. 혼돈의 첨탑에서 깨어난 제로
//  3. 흩어진 결정과 여섯 몬스터          4. 안내 정령 피피와 예언
//  5. 새벽길의 모험가                   6. 제목
// 화면을 누르거나 Space·Enter로 넘기고, 오른쪽 위 「건너뛰기」로 바로 시작해요.
// 그림은 모두 게임에 있는 Ninja Adventure 그림(CC0)과 코드로 그린 하늘·산·결정이에요.

import { textStyle, crisp } from '../ui/style.js';
import { TerrainGrid, seeded } from '../world/terrain.js';
import { ASSET_ROOT, HEROES } from '../data/assets.js';
import { ensureTextures } from '../world/DungeonStyle.js';

const W = 960;
const H = 540;
const GROUND = 372; // 땅 윗선

// 여섯 결정: 이름 · 빛깔 · 그 결정을 차지한 몬스터 그림
const CRYSTALS = [
  { name: '분수', color: 0x6fdc6f, boss: 'troll' },
  { name: '입체', color: 0xffb347, boss: 'frog' },
  { name: '소수', color: 0x4fa3ff, boss: 'frog2' },
  { name: '비율', color: 0xffe066, boss: 'samuraiBlue' },
  { name: '원', color: 0x3fd6c0, boss: 'tenguBlue' },
  { name: '회전', color: 0xff6a5a, boss: 'samuraiRed' },
];

const SKY = {
  day: [0x6fb6e8, 0xf6d9a8],
  dusk: [0x2b2d5e, 0xe88a6a],
  chaos: [0x1a0f2e, 0x5a2a6e],
  night: [0x070914, 0x1a2140],
  dawn: [0x3a4f8a, 0xffb27a],
};

export class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  // next: 인트로가 끝나면 갈 곳 { scene, data } · stats: 주인공 (이름·성별)
  init(data) {
    this.next = data.next || { scene: 'Title' };
    this.hero = data.stats || null;
  }

  preload() {
    this.load.setPath(ASSET_ROOT);
    if (!this.textures.exists('fx/mill')) this.load.spritesheet('fx/mill', 'na/fx/mill.png', { frameWidth: 64, frameHeight: 64 });
    if (!this.textures.exists('fx/aura_purple')) this.load.spritesheet('fx/aura_purple', 'na/fx/aura_purple.png', { frameWidth: 32, frameHeight: 32 });
    if (!this.textures.exists('fx/aura_white')) this.load.spritesheet('fx/aura_white', 'na/fx/aura_white.png', { frameWidth: 32, frameHeight: 32 });
    if (!this.cache.audio.exists('bgm_story')) this.load.audio('bgm_story', ['na/music/story.ogg', 'na/music/story.mp3']);
    if (!this.cache.audio.exists('bgm_tension')) this.load.audio('bgm_tension', ['na/music/tension.ogg', 'na/music/tension.mp3']);
  }

  create() {
    ensureTextures(this);
    this.makeTextures();
    this.finished = false;

    this.sky = this.add.graphics().setDepth(-100);
    this.skyFrom = SKY.day;
    this.paintSky(SKY.day);
    this.makeStars();
    this.makeSun();
    this.makeMountains();
    this.makeGround();
    this.makeVillage();
    this.world = this.add.layer().setDepth(10); // 장면마다 바뀌는 것들
    this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(80);
    this.shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(60);
    this.makeNarration();
    this.makeSkip();

    this.sound.stopAll();
    this.music = {};
    this.playMusic('bgm_story');

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown', (e) => {
      if (e.code === 'Escape') this.finish();
      else if (['Space', 'Enter', 'KeyJ', 'KeyE', 'NumpadEnter'].includes(e.code)) this.advance();
    });

    this.beats = this.makeBeats();
    this.beatIndex = -1;
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(500, () => this.nextBeat());
  }

  // ── 그림 재료 ─────────────────────────────────
  makeTextures() {
    if (!this.textures.exists('intro_crystal')) {
      // 도트 결정: 왼쪽은 밝은 면, 오른쪽은 어두운 면 (흰색으로 그려서 색은 나중에 입혀요)
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillPoints([{ x: 6, y: 0 }, { x: 12, y: 7 }, { x: 6, y: 20 }, { x: 0, y: 7 }], true);
      g.fillStyle(0xb8b8c8, 1).fillPoints([{ x: 6, y: 0 }, { x: 12, y: 7 }, { x: 6, y: 20 }], true);
      g.fillStyle(0xe8e8f0, 1).fillPoints([{ x: 0, y: 7 }, { x: 12, y: 7 }, { x: 6, y: 9 }], true);
      g.fillStyle(0xffffff, 1).fillRect(3, 4, 2, 2);
      g.generateTexture('intro_crystal', 12, 20);
      g.destroy();
    }
    if (!this.anims.exists('intro_mill')) {
      this.anims.create({ key: 'intro_mill', frames: this.anims.generateFrameNumbers('fx/mill'), frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'intro_aura_p', frames: this.anims.generateFrameNumbers('fx/aura_purple'), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'intro_aura_w', frames: this.anims.generateFrameNumbers('fx/aura_white'), frameRate: 8, repeat: -1 });
    }
  }

  paintSky([top, bottom]) {
    this.sky.clear().fillGradientStyle(top, top, bottom, bottom, 1).fillRect(0, 0, W, H);
  }

  // 하늘빛을 천천히 바꿔요
  skyTo(name, ms = 1600) {
    const from = this.skyFrom;
    const to = SKY[name];
    this.skyFrom = to;
    const mix = (a, b, t) => Phaser.Display.Color.ObjectToColor(Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(a), Phaser.Display.Color.IntegerToColor(b), 100, t * 100)).color;
    this.tweens.addCounter({
      from: 0, to: 1, duration: ms,
      onUpdate: (tw) => { const t = tw.getValue(); this.paintSky([mix(from[0], to[0], t), mix(from[1], to[1], t)]); },
    });
  }

  makeStars() {
    const rnd = seeded(77);
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      const s = this.add.rectangle(rnd() * W, rnd() * (GROUND - 80), rnd() < 0.2 ? 3 : 2, rnd() < 0.2 ? 3 : 2, 0xffffff, 0).setDepth(-90);
      s.base = 0.35 + rnd() * 0.6;
      this.tweens.add({ targets: s, scale: 0.4, duration: 600 + rnd() * 900, yoyo: true, repeat: -1, delay: rnd() * 800 });
      this.stars.push(s);
    }
  }

  starsTo(alpha, ms = 1500) {
    for (const s of this.stars) this.tweens.add({ targets: s, alpha: alpha * s.base, duration: ms });
  }

  makeSun() {
    this.sunGlow = this.add.image(760, 250, 'light_glow').setScale(3.2).setTint(0xffe6a0).setAlpha(0.6).setBlendMode('ADD').setDepth(-85);
    this.sun = this.add.circle(760, 250, 34, 0xfff1c0).setDepth(-84);
  }

  makeMountains() {
    const ridge = (y0, amp, seed, color, depth) => {
      const rnd = seeded(seed);
      const pts = [{ x: 0, y: H }];
      let y = y0;
      for (let x = 0; x <= W; x += 32) {
        y = Phaser.Math.Clamp(y + (rnd() - 0.5) * amp, y0 - amp * 1.4, y0 + amp * 0.4);
        pts.push({ x, y: Math.round(y / 4) * 4 });
      }
      pts.push({ x: W, y: H });
      return this.add.graphics().fillStyle(color, 1).fillPoints(pts, true).setDepth(depth);
    };
    this.far = ridge(250, 60, 11, 0x5d79a8, -80);
    this.near = ridge(300, 44, 23, 0x3e5f6e, -70);
    // 혼돈의 첨탑 (가운데 멀리, 2장에서 솟아올라요)
    const g = this.add.graphics().setDepth(-75);
    g.fillStyle(0x24163a, 1).fillPoints([{ x: -26, y: 0 }, { x: -16, y: -150 }, { x: -6, y: -200 }, { x: 0, y: -236 }, { x: 6, y: -200 }, { x: 16, y: -150 }, { x: 26, y: 0 }], true);
    g.fillStyle(0x3a2458, 1).fillPoints([{ x: 0, y: -236 }, { x: 6, y: -200 }, { x: 16, y: -150 }, { x: 26, y: 0 }, { x: 4, y: 0 }], true);
    g.fillStyle(0xc58bff, 1).fillRect(-3, -170, 6, 10).fillRect(-3, -110, 6, 10).fillRect(-3, -50, 6, 10);
    this.spire = g.setPosition(W / 2, 330 + 250);
    this.spireGlow = this.add.image(W / 2, 110, 'light_glow').setScale(2).setTint(0xb46cff).setBlendMode('ADD').setAlpha(0).setDepth(-74);
  }

  makeGround() {
    const g = new TerrainGrid(20, 4);
    g.rect(0, 2, 20, 1, 'd');
    const rt = g.bake(this, seeded(5));
    rt.setScale(3).setPosition(0, GROUND).setDepth(-60);
    this.groundRt = rt;
    // 땅 위 나무와 꽃
    this.trees = [];
    for (const [k, x, s] of [['tree_big', 70, 3], ['tree_pine', 900, 3], ['tree_big_pink', 840, 2.5], ['tree_pine', 150, 2.5]]) {
      this.trees.push(this.add.image(x, GROUND + 40, 'na/nature', k).setOrigin(0.5, 1).setScale(s).setDepth(5));
    }
  }

  makeVillage() {
    // 풍차 마을 (프락시아): 집 몇 채 + 돌아가는 풍차 날개
    const v = this.add.container(0, 0).setDepth(-50);
    const house = (k, x, s) => v.add(this.add.image(x, GROUND + 22, 'na/house', k).setOrigin(0.5, 1).setScale(s));
    house('house_orange', 300, 2);
    house('house_red', 640, 2);
    house('house_round', 470, 2.4);
    this.mill = this.add.sprite(470, GROUND - 92, 'fx/mill', 0).setScale(2.2).play('intro_mill');
    v.add(this.mill);
    this.village = v;
  }

  // ── 글 상자 ───────────────────────────────────
  makeNarration() {
    const y = 432;
    this.box = this.add.container(0, 0).setDepth(90);
    const g = this.add.graphics();
    g.fillStyle(0x0b0812, 0.72).fillRoundedRect(60, y, W - 120, 92, 12);
    g.lineStyle(2, 0xe8c36a, 0.9).strokeRoundedRect(61, y + 1, W - 122, 90, 12);
    this.nameTag = this.add.container(92, y);
    this.nameBg = this.add.graphics();
    this.nameText = crisp(this.add.text(0, 0, '', textStyle(15, '#ffe9a8')).setOrigin(0, 0.5));
    this.nameTag.add([this.nameBg, this.nameText]).setVisible(false);
    this.line = crisp(this.add.text(W / 2, y + 46, '', textStyle(19, '#fff8e6', { align: 'center', lineSpacing: 8, wordWrap: { width: W - 200, useAdvancedWrap: true } })).setOrigin(0.5));
    this.more = crisp(this.add.text(W - 92, y + 74, '▼', textStyle(13, '#ffd866')).setOrigin(0.5));
    this.tweens.add({ targets: this.more, y: this.more.y + 4, duration: 420, yoyo: true, repeat: -1 });
    this.box.add([g, this.nameTag, this.line, this.more]);
    this.box.setAlpha(0);
  }

  makeSkip() {
    const c = this.add.container(W - 86, 32).setDepth(95);
    const g = this.add.graphics().fillStyle(0x0b0812, 0.6).fillRoundedRect(-66, -17, 132, 34, 17).lineStyle(1, 0xe8c36a, 0.8).strokeRoundedRect(-66, -17, 132, 34, 17);
    const t = crisp(this.add.text(0, 0, '건너뛰기 ▶▶', textStyle(14, '#fff3c4')).setOrigin(0.5));
    c.add([g, t]).setSize(132, 34).setInteractive({ useHandCursor: true });
    c.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.finish(); });
  }

  // speaker: 말하는 사람 (없으면 이야기꾼) · color: 이름표 색
  say(text, speaker = null, color = '#ffe9a8') {
    const name = this.hero?.name || '모험가';
    const full = text.replaceAll('{name}', name);
    this.tweens.add({ targets: this.box, alpha: 1, duration: 250 });
    this.nameTag.setVisible(!!speaker);
    if (speaker) {
      this.nameText.setText(speaker).setColor(color);
      const w = this.nameText.width + 26;
      this.nameBg.clear().fillStyle(0x1c1426, 1).fillRoundedRect(-13, -15, w, 30, 10).lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1).strokeRoundedRect(-13, -15, w, 30, 10);
    }
    this.line.setFontStyle(speaker ? 'bold' : 'normal');
    this.typing = true;
    this.more.setVisible(false);
    this.full = full;
    let i = 0;
    this.line.setText('');
    this.typeEvent?.remove();
    this.typeEvent = this.time.addEvent({
      delay: 34, repeat: full.length - 1,
      callback: () => { i++; this.line.setText(full.slice(0, i)); if (i >= full.length) this.doneTyping(); },
    });
  }

  doneTyping() {
    this.typing = false;
    this.more.setVisible(true);
  }

  advance() {
    if (this.finished || this.waiting) return;
    if (this.typing) { this.typeEvent?.remove(); this.line.setText(this.full); this.doneTyping(); return; }
    this.sound.play('sfx_click', { volume: 0.25 });
    this.nextLine();
  }

  nextLine() {
    const beat = this.beats[this.beatIndex];
    this.lineIndex++;
    const step = beat?.lines[this.lineIndex];
    if (!step) { this.nextBeat(); return; }
    // 한 줄: [글, 말하는 사람, 이름표 색, 이 줄을 보여 줄 때 할 일]
    const [text, speaker, color, act] = step;
    act?.();
    if (text) this.say(text, speaker, color);
  }

  nextBeat() {
    this.beatIndex++;
    const beat = this.beats[this.beatIndex];
    if (!beat) { this.finish(); return; }
    this.lineIndex = -1;
    // 장면 바꾸는 동안은 잠깐 넘기기를 막아요
    this.waiting = true;
    this.tweens.add({ targets: this.box, alpha: 0, duration: 200 });
    const wait = beat.enter?.() ?? 0;
    this.time.delayedCall(wait, () => { this.waiting = false; this.nextLine(); });
  }

  // ── 음악 ──────────────────────────────────────
  playMusic(key, fadeMs = 0) {
    if (!this.cache.audio.exists(key)) return;
    for (const [k, m] of Object.entries(this.music)) {
      if (k === key) continue;
      this.tweens.add({ targets: m, volume: 0, duration: 900, onComplete: () => m.stop() });
      delete this.music[k];
    }
    if (this.music[key]) return;
    const m = this.sound.add(key, { loop: true, volume: fadeMs ? 0 : 0.42 });
    m.play();
    if (fadeMs) this.tweens.add({ targets: m, volume: 0.42, duration: fadeMs });
    this.music[key] = m;
  }

  // ── 장면 ──────────────────────────────────────
  makeBeats() {
    const PIPI = ['안내 정령 피피', '#9be8ff'];
    const ZERO = ['혼돈의 군주 제로', '#d7a8ff'];
    return [
      { enter: () => this.scenePeace(), lines: [
        ['숫자와 도형이 살아 숨 쉬는 땅, 수학 대륙.'],
        ['이 대륙의 여섯 마을은 저마다 빛나는 「수학의 결정」을 지키며 살았어요.', null, null, () => this.showCrystalNames()],
        ['결정의 빛 덕분에 풍차는 돌고, 등대는 반짝이고, 숲의 나무는 둥글게 자랐지요.'],
      ] },
      { enter: () => this.sceneChaos(), lines: [
        ['그러던 어느 날, 대륙 한가운데 「혼돈의 첨탑」에서 누군가 깨어났어요.'],
        ['후후후… 복잡한 계산은 이제 그만! 모든 답을 0으로 만들어 주마!', ...ZERO, () => this.zeroLaugh()],
      ] },
      { enter: () => this.sceneScatter(), lines: [
        ['혼돈의 군주 제로가 일으킨 바람에, 여섯 결정은 대륙 곳곳으로 흩어지고 말았어요.'],
        ['심술궂게 변한 몬스터들이 결정을 하나씩 차지하고는 깊은 곳에 숨어 버렸지요.', null, null, () => this.showThieves()],
        ['결정의 빛이 약해지자 풍차는 멈추고, 마을들은 점점 기운을 잃어 갔어요.', null, null, () => this.dimWorld()],
      ] },
      { enter: () => this.sceneHope(), lines: [
        ['하지만 희망은 아직 남아 있었어요.'],
        ['오래된 예언을 기억하는 작은 정령이 있었거든요.'],
        ['수학의 룬을 깨우는 모험가가 나타나, 여섯 결정을 되찾으리라.', ...PIPI, () => this.prophecy()],
      ] },
      { enter: () => this.sceneDawn(), lines: [
        ['찾았다! {name}님, 당신이 바로 그 모험가예요!', ...PIPI],
        ['문제를 하나씩 풀 때마다 룬이 깨어나고, 결정의 빛이 돌아올 거예요.', ...PIPI],
        ['자, 함께 프락시아 마을로 가요!', ...PIPI],
      ] },
      { enter: () => this.sceneTitle(), lines: [] },
    ];
  }

  // 1. 평화로운 대륙: 마을 위로 여섯 결정이 둥실
  scenePeace() {
    this.skyTo('day', 10);
    this.crystals = CRYSTALS.map((c, i) => {
      const a = Math.PI + (i / (CRYSTALS.length - 1)) * Math.PI;
      const x = W / 2 + Math.cos(a) * 280;
      const y = 200 + Math.sin(a) * 110;
      const glow = this.add.image(x, y, 'light_glow').setScale(0.9).setTint(c.color).setBlendMode('ADD').setAlpha(0);
      const s = this.add.image(x, y, 'intro_crystal').setScale(3).setTint(c.color).setAlpha(0);
      const label = crisp(this.add.text(x, y + 44, `${c.name}의 결정`, textStyle(13, '#fff8e6')).setOrigin(0.5).setAlpha(0));
      this.world.add([glow, s, label]);
      this.tweens.add({ targets: [s, glow], alpha: 1, duration: 700, delay: 300 + i * 160 });
      this.tweens.add({ targets: [s, glow], y: y - 8, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 200 });
      this.tweens.add({ targets: glow, scale: 1.15, duration: 900, yoyo: true, repeat: -1, delay: i * 150 });
      return { ...c, s, glow, label, x, y };
    });
    return 1500;
  }

  showCrystalNames() {
    this.crystals.forEach((c, i) => this.tweens.add({ targets: c.label, alpha: 1, duration: 400, delay: i * 140 }));
    this.sound.play('sfx_seal', { volume: 0.3 });
  }

  // 2. 하늘이 보랏빛으로, 첨탑이 솟고 제로가 나타나요
  sceneChaos() {
    this.crystals.forEach((c) => this.tweens.add({ targets: c.label, alpha: 0, duration: 300 }));
    this.playMusic('bgm_tension', 1200);
    this.skyTo('chaos', 2200);
    this.starsTo(0.5);
    this.tweens.add({ targets: [this.sun, this.sunGlow], y: '+=260', alpha: 0, duration: 2200 });
    this.tweens.add({ targets: this.far, alpha: 0.75, duration: 2000 });
    this.cameras.main.shake(1800, 0.004);
    this.tweens.add({ targets: this.spire, y: 330, duration: 2000, ease: 'Cubic.out' });
    this.time.delayedCall(1700, () => {
      this.lightning(W / 2 - 160, 0);
      this.spireGlow.setAlpha(0.7);
      this.tweens.add({ targets: this.spireGlow, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
      // 제로: 첨탑 꼭대기 위에 둥실
      this.zeroAura = this.add.sprite(W / 2, 112, 'fx/aura_purple', 0).setScale(4.2).setBlendMode('ADD').setAlpha(0).play('intro_aura_p');
      this.zero = this.add.sprite(W / 2, 140, 'boss/tenguRed_idle', 0).setScale(1.4).setAlpha(0).play('tenguRed_idle');
      this.world.add([this.zeroAura, this.zero]);
      this.tweens.add({ targets: [this.zero, this.zeroAura], alpha: 1, duration: 900 });
      this.tweens.add({ targets: [this.zero, this.zeroAura], y: '-=8', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.sound.play('sfx_boss', { volume: 0.45 });
    });
    // 결정들은 첨탑 쪽으로 조금 끌려가요
    this.crystals.forEach((c) => this.tweens.add({ targets: [c.s, c.glow], x: c.x + (W / 2 - c.x) * 0.15, duration: 2400 }));
    return 3000;
  }

  zeroLaugh() {
    this.zero.play('tenguRed_attack');
    this.zero.once('animationcomplete', () => this.zero.play('tenguRed_idle'));
    this.cameras.main.shake(400, 0.006);
    this.lightning(W / 2 + 200, 20);
  }

  lightning(x, y) {
    const g = this.add.graphics().setDepth(70).setBlendMode('ADD');
    const pts = [{ x, y }];
    let cx = x;
    for (let cy = y; cy < GROUND - 40; cy += 26) { cx += Phaser.Math.Between(-22, 22); pts.push({ x: cx, y: cy }); }
    g.lineStyle(7, 0xb46cff, 0.5).strokePoints(pts).lineStyle(3, 0xffffff, 1).strokePoints(pts);
    this.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
    this.flash.setFillStyle(0xe6d4ff, 0.55);
    this.tweens.add({ targets: this.flash, fillAlpha: 0, duration: 420 });
    this.sound.play('sfx_impact', { volume: 0.35 });
  }

  // 3. 결정이 사방으로 흩어지고, 여섯 몬스터가 하나씩 차지해요
  sceneScatter() {
    this.zero.play('tenguRed_attack');
    this.zero.once('animationcomplete', () => this.zero.play('tenguRed_idle'));
    // 보랏빛 바람 고리
    for (let i = 0; i < 3; i++) {
      const r = this.add.image(W / 2, 140, 'light_glow').setTint(0xb46cff).setBlendMode('ADD').setScale(0.4).setAlpha(0.8).setDepth(55);
      this.tweens.add({ targets: r, scale: 9, alpha: 0, duration: 1300, delay: i * 220, onComplete: () => r.destroy() });
    }
    this.sound.play('sfx_boss_blast', { volume: 0.4 });
    this.cameras.main.shake(700, 0.008);
    const out = [[-120, 60], [-80, -120], [300, -140], [W - 300, -140], [W + 80, -120], [W + 120, 60]];
    this.crystals.forEach((c, i) => {
      this.tweens.killTweensOf([c.s, c.glow]);
      const [tx, ty] = out[i];
      this.tweens.add({ targets: [c.s, c.glow], x: tx, y: ty, angle: 540, duration: 1100, delay: 200 + i * 70, ease: 'Cubic.in' });
      // 반짝이 꼬리
      for (let k = 0; k < 5; k++) {
        this.time.delayedCall(260 + i * 70 + k * 120, () => {
          const t = this.add.image(c.s.x, c.s.y, 'light_glow').setTint(c.color).setBlendMode('ADD').setScale(0.25).setDepth(9);
          this.tweens.add({ targets: t, alpha: 0, scale: 0.05, duration: 500, onComplete: () => t.destroy() });
        });
      }
    });
    return 1800;
  }

  showThieves() {
    // 결정을 품은 여섯 몬스터 (어두운 그림자 + 결정 빛)
    // 뒤의 마을은 흐리게 해서 몬스터가 잘 보이게
    this.tweens.add({ targets: [this.village, ...this.trees], alpha: 0.35, duration: 600 });
    this.thieves = CRYSTALS.map((c, i) => {
      const x = 130 + i * 140;
      const key = c.boss;
      const tex = `boss/${key}_idle`;
      const s = this.add.sprite(x, GROUND + 36, tex, 0).setOrigin(0.5, 1).play(`${key}_idle`).setTint(0x4a3466).setAlpha(0);
      s.setScale(Math.min(1.5, 110 / s.height));
      const gl = this.add.image(x, GROUND + 36 - s.displayHeight - 14, 'light_glow').setTint(c.color).setBlendMode('ADD').setScale(0.55).setAlpha(0);
      const cr = this.add.image(gl.x, gl.y, 'intro_crystal').setScale(1.8).setTint(c.color).setAlpha(0);
      this.world.add([s, gl, cr]);
      this.tweens.add({ targets: [s, gl, cr], alpha: 1, duration: 450, delay: i * 260 });
      this.tweens.add({ targets: [gl, cr], y: '-=5', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 100 });
      this.time.delayedCall(i * 260, () => this.sound.play('sfx_lunge', { volume: 0.18 }));
      return [s, gl, cr];
    }).flat();
  }

  dimWorld() {
    this.mill.anims.timeScale = 1;
    this.tweens.addCounter({ from: 1, to: 0, duration: 1800, onUpdate: (t) => { this.mill.anims.timeScale = Math.max(0.01, t.getValue()); }, onComplete: () => this.mill.anims.pause() });
    this.tweens.add({ targets: this.shade, fillAlpha: 0.35, duration: 1800 });
  }

  // 4. 어둠 속으로 작은 빛(피피)이 내려와요
  sceneHope() {
    this.playMusic('bgm_story', 1500);
    this.skyTo('night', 1800);
    this.starsTo(1);
    this.tweens.add({ targets: this.shade, fillAlpha: 0.55, duration: 1200 });
    this.tweens.killTweensOf(this.spireGlow);
    this.tweens.add({ targets: [...this.thieves, this.zero, this.zeroAura], alpha: 0, duration: 1200 });
    this.tweens.add({ targets: this.spireGlow, alpha: 0.12, duration: 1200 });
    this.tweens.add({ targets: [this.village, ...this.trees], alpha: 1, duration: 1500 });
    this.tweens.add({ targets: this.spire, alpha: 0.5, duration: 1200 });
    this.pipiGlow = this.add.image(W / 2, -40, 'light_glow').setScale(1.6).setTint(0xbff2ff).setBlendMode('ADD').setDepth(65);
    this.pipiAura = this.add.sprite(W / 2, -40, 'fx/aura_white', 0).setScale(3).setBlendMode('ADD').setAlpha(0.7).setDepth(65).play('intro_aura_w');
    this.pipi = this.add.sprite(W / 2, -40, 'ch/Spirit', 0).setScale(5).setDepth(66).play('Spirit_idle_down');
    const parts = [this.pipi, this.pipiGlow, this.pipiAura];
    this.tweens.add({ targets: parts, y: 230, duration: 2200, ease: 'Sine.out', delay: 400 });
    this.time.delayedCall(2600, () => {
      this.tweens.add({ targets: parts, y: 220, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.sound.play('sfx_unlock', { volume: 0.35 });
    });
    return 2800;
  }

  prophecy() {
    // 예언의 글: 가운데 위에 금빛으로
    const t = crisp(this.add.text(W / 2, 92, '수학의 룬을 깨우는 모험가가 나타나\n여섯 결정을 되찾으리라', textStyle(26, '#ffe9a8', { align: 'center', lineSpacing: 10, strokeThickness: 6 }))).setOrigin(0.5).setAlpha(0).setDepth(67);
    this.tweens.add({ targets: t, alpha: 1, duration: 900 });
    this.prophecyText = t;
    for (let i = 0; i < 6; i++) {
      const sp = this.add.sprite(W / 2 - 220 + i * 88, 92 + Phaser.Math.Between(-30, 30), 'na/spark', 0).setBlendMode('ADD').setDepth(67).play({ key: 'fx_spark', startFrame: i % 7 });
      this.tweens.add({ targets: sp, alpha: 0.2, y: sp.y - 8, duration: 900 + i * 120, yoyo: true, repeat: -1 });
      this.world.add(sp);
    }
  }

  // 5. 새벽길: 모험가가 걸어오고 피피가 날아와요
  sceneDawn() {
    this.prophecyText?.destroy();
    this.skyTo('dawn', 2200);
    this.starsTo(0.15, 2000);
    this.sun.setPosition(760, GROUND + 60).setAlpha(1).setFillStyle(0xffd9a0);
    this.sunGlow.setPosition(760, GROUND + 60).setAlpha(0.7);
    this.tweens.add({ targets: [this.sun, this.sunGlow], y: 280, duration: 3000, ease: 'Sine.out' });
    this.tweens.add({ targets: this.shade, fillAlpha: 0, duration: 2200 });
    this.tweens.add({ targets: this.spire, alpha: 0.25, duration: 2200 });
    this.mill.anims.resume();
    this.mill.anims.timeScale = 0.4; // 아직은 느리게
    const key = HEROES[this.hero?.gender] || HEROES.male;
    this.heroSpr = this.add.sprite(-40, GROUND + 52, `ch/${key}`, 0).setOrigin(0.5, 1).setScale(5).setDepth(40).play(`${key}_walk_right`);
    this.heroShadow = this.add.ellipse(-40, GROUND + 52, 50, 12, 0x000000, 0.25).setDepth(39);
    this.tweens.add({ targets: [this.heroSpr, this.heroShadow], x: W / 2 - 60, duration: 2600, ease: 'Sine.out', onComplete: () => this.heroSpr.play(`${key}_idle_right`) });
    // 피피는 모험가 옆으로
    const parts = [this.pipi, this.pipiGlow, this.pipiAura];
    this.tweens.killTweensOf(parts);
    this.tweens.add({ targets: parts, x: W / 2 + 50, y: GROUND - 30, duration: 2400, ease: 'Sine.inOut' });
    this.time.delayedCall(2500, () => {
      this.pipi.setFlipX(true);
      this.tweens.add({ targets: parts, y: GROUND - 40, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    return 2900;
  }

  // 6. 제목
  sceneTitle() {
    this.mill.anims.timeScale = 1;
    this.tweens.add({ targets: this.shade, fillAlpha: 0.45, duration: 800 });
    const title = crisp(this.add.text(W / 2, 170, '수학 대륙', textStyle(66, '#fff3c4', { strokeThickness: 10 })).setOrigin(0.5).setAlpha(0).setDepth(70));
    const sub = crisp(this.add.text(W / 2, 232, '여섯 마을의 봉인', textStyle(22, '#ffd866')).setOrigin(0.5).setAlpha(0).setDepth(70));
    const gems = CRYSTALS.map((c, i) => this.add.image(W / 2 - 125 + i * 50, 96, 'intro_crystal').setScale(2).setTint(c.color).setAlpha(0).setDepth(70));
    this.tweens.add({ targets: [title, sub, ...gems], alpha: 1, duration: 900 });
    gems.forEach((g, i) => this.tweens.add({ targets: g, y: 90, duration: 900, yoyo: true, repeat: -1, delay: i * 140, ease: 'Sine.inOut' }));
    this.sound.play('sfx_quest', { volume: 0.4 });
    const tap = crisp(this.add.text(W / 2, 470, '화면을 누르면 모험이 시작돼요', textStyle(16, '#e6f0dd'))).setOrigin(0.5).setAlpha(0).setDepth(70);
    this.tweens.add({ targets: tap, alpha: 1, duration: 600, delay: 1200, onComplete: () => this.tweens.add({ targets: tap, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 }) });
    this.time.delayedCall(1200, () => { this.titleReady = true; });
    return 99999999; // 글 없이 기다려요 (누르면 끝나요)
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.hero) this.hero.introSeen = true;
    for (const m of Object.values(this.music)) this.tweens.add({ targets: m, volume: 0, duration: 600 });
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.sound.stopAll();
      this.scene.start(this.next.scene, this.next.data);
    });
  }

  update() {
    // 제목 화면에서는 누르면 끝나요 (nextBeat가 기다리는 중이라 advance가 막혀 있어서 따로 받아요)
    if (this.titleReady && !this.titleHooked) {
      this.titleHooked = true;
      this.input.once('pointerdown', () => this.finish());
      this.input.keyboard.once('keydown', () => this.finish());
    }
  }
}
