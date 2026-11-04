// 화면 위 UI: 상태 막대, 미니맵, 행동 버튼, 조이스틱, 빠른 칸, 대화창, 알림

import { textStyle, crisp, FONT } from '../ui/style.js';
import * as MAP from '../data/fractionValley.js';

const W = 960;
const H = 540;
const GOLD = 0xe8c36a;
const INK = 0x1b1208;

function panel(scene, x, y, w, h, alpha = 0.78) {
  const g = scene.add.graphics();
  g.fillStyle(0x16110b, alpha).fillRoundedRect(x, y, w, h, 8);
  g.lineStyle(2, GOLD, 1).strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 8);
  g.lineStyle(1, 0x6b4a22, 1).strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 6);
  return g;
}

export class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  init(data) {
    this.villageInfo = data.village;
    this.joy = { x: 0, y: 0 };
    this.dialogOpen = false;
  }

  create() {
    this.village = this.scene.get('Village');
    this.stats = this.registry.get('player');
    this.isTouch = this.sys.game.device.input.touch;

    this.makeStatus();
    this.makeMinimap();
    this.makeButtons();
    this.makeQuickSlots();
    this.makeJoystick();
    this.makeDialog();
    this.makePrompt();
    this.toastText = crisp(this.add.text(W / 2, 92, '', textStyle(16, '#ffffff')).setOrigin(0.5).setAlpha(0).setDepth(50));
    this.showBanner(this.villageInfo.name, this.villageInfo.subtitle);

    if (!this.isTouch) {
      crisp(this.add.text(W / 2, H - 10, 'WASD 이동 · J 공격 · K 스킬 · Space 구르기 · E 대화 · Q 회복약',
        textStyle(11, '#d8d0bd')).setOrigin(0.5, 1).setAlpha(0.8));
    }
    this.input.keyboard.on('keydown-Q', () => this.usePotion());
  }

  // ── 상태 (왼쪽 위) ─────────────────────────────
  makeStatus() {
    const s = this.stats;
    panel(this, 10, 10, 262, 78);
    // 얼굴
    const face = this.add.circle(48, 49, 29, 0x2c4a3a).setStrokeStyle(3, GOLD);
    const img = this.add.image(48, 92, `characters5/${s.gender}/idle_down_1`).setOrigin(0.5, 1).setScale(0.62);
    const maskG = this.make.graphics().fillCircle(48, 49, 27);
    img.setMask(maskG.createGeometryMask());
    face.setDepth(0);
    this.add.circle(48, 82, 12, INK).setStrokeStyle(2, GOLD);
    this.lvText = crisp(this.add.text(48, 82, '', textStyle(11, '#ffe9a8')).setOrigin(0.5));
    this.nameText = crisp(this.add.text(86, 18, s.name, textStyle(13, '#fff3c4')));

    this.bars = this.add.graphics();
    this.hpText = crisp(this.add.text(262, 40, '', textStyle(10, '#ffffff')).setOrigin(1, 0.5));
    this.spText = crisp(this.add.text(262, 58, '', textStyle(10, '#ffffff')).setOrigin(1, 0.5));
    crisp(this.add.text(86, 40, 'HP', textStyle(10, '#ff9b8a')).setOrigin(0, 0.5));
    crisp(this.add.text(86, 58, 'SP', textStyle(10, '#9cc8ff')).setOrigin(0, 0.5));
  }

  drawBars() {
    const s = this.stats;
    const g = this.bars.clear();
    const bar = (y, ratio, color, h = 10) => {
      g.fillStyle(0x000000, 0.6).fillRect(106, y - h / 2, 124, h);
      g.fillStyle(color, 1).fillRect(107, y - h / 2 + 1, 122 * Phaser.Math.Clamp(ratio, 0, 1), h - 2);
      g.fillStyle(0xffffff, 0.25).fillRect(107, y - h / 2 + 1, 122 * Phaser.Math.Clamp(ratio, 0, 1), 2);
    };
    bar(40, s.hp / s.maxHp, 0xd8443a);
    bar(58, s.sp / s.maxSp, 0x3d7fe0);
    bar(74, s.exp / s.next, 0xf0c64a, 5);
    this.hpText.setText(`${s.hp}/${s.maxHp}`).setPosition(266, 40);
    this.spText.setText(`${s.sp}/${s.maxSp}`).setPosition(266, 58);
    this.lvText.setText(`${s.lv}`);
  }

  // ── 미니맵 (오른쪽 위) ─────────────────────────
  makeMinimap() {
    const S = 3.2;
    const mw = MAP.COLS * S;
    const mh = MAP.ROWS * S;
    const x0 = W - mw - 18;
    const y0 = 34;
    panel(this, x0 - 8, 10, mw + 16, mh + 32 + 26);
    crisp(this.add.text(x0 + mw / 2, 22, this.villageInfo.name, textStyle(12, '#ffe9a8')).setOrigin(0.5));
    const g = this.add.graphics();
    const grid = this.village.grid;
    const col = { g: 0x5f9b45, d: 0xc9a066, w: 0x3f86c9 };
    for (let ty = 0; ty < MAP.ROWS; ty++) {
      for (let tx = 0; tx < MAP.COLS; tx++) {
        const c = grid.get(tx, ty) === grid.get(tx + 1, ty + 1) ? grid.get(tx, ty) : grid.get(tx + 1, ty + 1);
        g.fillStyle(col[c], 1).fillRect(x0 + tx * S, y0 + ty * S, S + 0.5, S + 0.5);
      }
    }
    g.fillStyle(0x7a5236, 1);
    for (const b of MAP.BUILDINGS) g.fillRect(x0 + (b.x / 64 - 2) * S, y0 + (b.y / 64 - 2.2) * S, 4 * S, 2.2 * S);
    g.lineStyle(1, INK, 1).strokeRect(x0, y0, mw, mh);
    this.mini = { x0, y0, S };
    this.miniDots = this.add.graphics();
    this.goldText = crisp(this.add.text(x0 + mw, y0 + mh + 14, '', textStyle(12, '#ffd866')).setOrigin(1, 0.5));
    this.add.image(x0 + 8, y0 + mh + 14, 'items/consumables/scroll').setScale(0.16);
    crisp(this.add.text(x0 + 18, y0 + mh + 14, '마을', textStyle(11, '#cfe3c8')).setOrigin(0, 0.5));
  }

  drawMinimap(time) {
    const { x0, y0, S } = this.mini;
    const g = this.miniDots.clear();
    const k = S / 64;
    g.fillStyle(0xfff3c4, 1);
    for (const n of this.village.npcs) g.fillCircle(x0 + n.x * k, y0 + n.y * k, 1.6);
    const p = this.village.player;
    const blink = 0.6 + 0.4 * Math.sin(time / 160);
    g.fillStyle(0xff4b3a, blink).fillCircle(x0 + p.x * k, y0 + p.y * k, 3);
    g.lineStyle(1, 0xffffff, 1).strokeCircle(x0 + p.x * k, y0 + p.y * k, 3);
    this.goldText.setText(`${this.stats.gold} G`);
  }

  // ── 행동 버튼 (오른쪽 아래) ─────────────────────
  makeButtons() {
    const mk = (x, y, key, size, icon, label, fn, iconScale = 0.2) => {
      const c = this.add.container(x, y);
      const base = this.add.image(0, 0, key).setDisplaySize(size, size);
      const ic = this.add.image(0, -2, icon).setScale(iconScale).setBlendMode('ADD');
      const t = crisp(this.add.text(0, size / 2 + 2, label, textStyle(10, '#fff3c4')).setOrigin(0.5, 0));
      c.add([base, ic, t]);
      c.setSize(size, size).setInteractive({ useHandCursor: true });
      c.on('pointerdown', (ptr, lx, ly, ev) => { ev?.stopPropagation(); c.setScale(0.9); fn(); });
      c.on('pointerup', () => c.setScale(1));
      c.on('pointerout', () => c.setScale(1));
      return c;
    };
    const v = () => this.village;
    this.btnAttack = mk(W - 70, H - 82, 'ui2/action_attack', 92, 'effects/slash_orange', '공격 J', () => v().doAttack(), 0.18);
    this.btnSkill = mk(W - 168, H - 120, 'ui2/action_skill', 62, 'effects/burst_gold_big', '스킬 K', () => v().doSkill(), 0.1);
    this.btnDodge = mk(W - 150, H - 44, 'ui2/action_dodge', 56, 'effects/dust_cloud', '구르기', () => v().doDodge(), 0.14);
    this.btnTalk = mk(W - 70, H - 190, 'ui2/action_interact', 62, 'effects/heal_green', '대화 E', () => {
      if (this.dialogOpen) this.advanceDialog(); else v().interact();
    }, 0.12);
    this.btnTalk.setVisible(false);
  }

  // ── 빠른 칸 (아래 가운데) ──────────────────────
  makeQuickSlots() {
    const x = W / 2 - 1.5 * 52;
    this.potionCount = 3;
    for (let i = 0; i < 4; i++) {
      const sx = x + i * 52;
      this.add.image(sx, H - 44, 'ui2/item_slot').setDisplaySize(46, 46).setAlpha(0.92);
    }
    const pot = this.add.image(x, H - 46, 'items/consumables/potion_red').setScale(0.22).setInteractive({ useHandCursor: true });
    pot.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.usePotion(); });
    this.potText = crisp(this.add.text(x + 18, H - 26, '', textStyle(11, '#ffffff')).setOrigin(1, 1));
    crisp(this.add.text(x - 18, H - 64, 'Q', textStyle(10, '#ffe9a8')));
  }

  usePotion() {
    const s = this.stats;
    if (this.dialogOpen) return;
    if (this.potionCount <= 0) { this.toast('회복약이 없어요'); return; }
    if (s.hp >= s.maxHp) { this.toast('HP가 이미 가득해요'); return; }
    this.potionCount--;
    s.hp = Math.min(s.maxHp, s.hp + 40);
    this.village.sound.play('sfx_heal', { volume: 0.5 });
  }

  // ── 조이스틱 (왼쪽 아래, 터치 기기) ─────────────
  makeJoystick() {
    const bx = 110;
    const by = H - 110;
    this.joyBase = this.add.circle(bx, by, 58, 0x000000, 0.28).setStrokeStyle(3, GOLD, 0.7);
    this.joyKnob = this.add.circle(bx, by, 26, 0xfff3c4, 0.55).setStrokeStyle(2, INK, 0.8);
    this.joyHome = { x: bx, y: by };
    const show = this.isTouch;
    this.joyBase.setVisible(show);
    this.joyKnob.setVisible(show);
    this.joyPtr = null;
    this.input.on('pointerdown', (p) => {
      if (this.dialogOpen) { this.advanceDialog(); return; }
      if (p.x < W * 0.45 && p.y > H * 0.3 && !this.joyPtr) {
        this.joyPtr = p.id;
        this.joyBase.setPosition(p.x, p.y).setVisible(true);
        this.joyKnob.setPosition(p.x, p.y).setVisible(true);
      }
    });
    this.input.on('pointermove', (p) => {
      if (p.id !== this.joyPtr) return;
      const dx = p.x - this.joyBase.x;
      const dy = p.y - this.joyBase.y;
      const len = Math.hypot(dx, dy);
      const r = Math.min(len, 50);
      const a = Math.atan2(dy, dx);
      this.joyKnob.setPosition(this.joyBase.x + Math.cos(a) * r, this.joyBase.y + Math.sin(a) * r);
      this.joy.x = len > 8 ? (Math.cos(a) * r) / 50 : 0;
      this.joy.y = len > 8 ? (Math.sin(a) * r) / 50 : 0;
    });
    const release = (p) => {
      if (p.id !== this.joyPtr) return;
      this.joyPtr = null;
      this.joy.x = 0;
      this.joy.y = 0;
      this.joyBase.setPosition(this.joyHome.x, this.joyHome.y).setVisible(show);
      this.joyKnob.setPosition(this.joyHome.x, this.joyHome.y).setVisible(show);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  // ── 대화창 ────────────────────────────────────
  makeDialog() {
    const c = this.add.container(0, 0).setDepth(40).setVisible(false);
    const bx = 70;
    const by = H - 150;
    const bw = W - 140;
    const bh = 128;
    const box = panel(this, bx, by, bw, bh, 0.92);
    this.dlgPortraitBg = this.add.graphics();
    this.dlgPortrait = this.add.image(bx + 70, by + bh - 10, 'npc3/portraits/farmer').setOrigin(0.5, 1);
    this.dlgName = crisp(this.add.text(bx + 140, by + 16, '', textStyle(15, '#ffd866')));
    this.dlgText = crisp(this.add.text(bx + 140, by + 44, '', {
      fontFamily: FONT, fontSize: '15px', color: '#fff8e6', lineSpacing: 8, wordWrap: { width: bw - 170, useAdvancedWrap: true },
    }));
    this.dlgArrow = crisp(this.add.text(bx + bw - 24, by + bh - 20, '▼', textStyle(12, '#ffd866')).setOrigin(0.5));
    this.tweens.add({ targets: this.dlgArrow, y: this.dlgArrow.y + 4, duration: 400, yoyo: true, repeat: -1 });
    c.add([box, this.dlgPortraitBg, this.dlgPortrait, this.dlgName, this.dlgText, this.dlgArrow]);
    this.dlg = c;
    this.dlgBox = { bx, by, bw, bh };
  }

  openDialog({ name, portrait, lines, onClose }) {
    this.dialogOpen = true;
    this.dlgPages = Array.isArray(lines) ? lines : [lines];
    this.dlgPage = 0;
    this.dlgOnClose = onClose;
    const { bx, by, bh } = this.dlgBox;
    this.dlgName.setText(name);
    const hasPortrait = !!portrait;
    this.dlgPortrait.setVisible(hasPortrait);
    this.dlgPortraitBg.clear();
    const textX = hasPortrait ? bx + 140 : bx + 28;
    this.dlgName.setX(textX);
    this.dlgText.setX(textX);
    if (hasPortrait) {
      this.dlgPortrait.setTexture(portrait);
      const src = this.dlgPortrait.texture.getSourceImage();
      this.dlgPortrait.setScale(Math.min(112 / src.width, 150 / src.height));
      this.dlgPortrait.setY(by + bh - 6);
      this.dlgPortraitBg.fillStyle(0x2c4a3a, 1).fillRoundedRect(bx + 14, by + 14, 112, bh - 28, 6)
        .lineStyle(2, GOLD, 1).strokeRoundedRect(bx + 14, by + 14, 112, bh - 28, 6);
    }
    this.dlg.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.dlg, alpha: 1, duration: 120 });
    this.village.sound.play('sfx_open', { volume: 0.35 });
    this.showPage();
  }

  showPage() {
    const full = this.dlgPages[this.dlgPage];
    this.dlgTyping = true;
    this.dlgArrow.setVisible(false);
    let i = 0;
    this.dlgText.setText('');
    this.typeEvent?.remove();
    this.typeEvent = this.time.addEvent({
      delay: 28, repeat: full.length - 1,
      callback: () => {
        i++;
        this.dlgText.setText(full.slice(0, i));
        if (i >= full.length) { this.dlgTyping = false; this.dlgArrow.setVisible(true); }
      },
    });
  }

  advanceDialog() {
    if (!this.dialogOpen) return;
    if (this.dlgTyping) {
      this.typeEvent?.remove();
      this.dlgText.setText(this.dlgPages[this.dlgPage]);
      this.dlgTyping = false;
      this.dlgArrow.setVisible(true);
      return;
    }
    this.dlgPage++;
    if (this.dlgPage < this.dlgPages.length) {
      this.village.sound.play('sfx_click', { volume: 0.3 });
      this.showPage();
      return;
    }
    this.dlg.setVisible(false);
    this.village.sound.play('sfx_close', { volume: 0.3 });
    // 같은 키 입력으로 바로 다시 열리지 않게 한 박자 쉬어요
    this.time.delayedCall(120, () => { this.dialogOpen = false; });
    this.dlgOnClose?.();
  }

  // ── 말풍선 표시 (가까이 가면) ──────────────────
  makePrompt() {
    this.prompt = this.add.container(0, 0).setVisible(false).setDepth(30);
    const bg = this.add.graphics();
    const t = crisp(this.add.text(0, 0, '', textStyle(12, '#1b1208', { stroke: '#fff8e6', strokeThickness: 0 })).setOrigin(0.5));
    this.prompt.add([bg, t]);
    this.promptBg = bg;
    this.promptText = t;
    this.tweens.add({ targets: this.prompt, scale: 1.06, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  setPrompt(target) {
    if (!this.prompt) return;
    if (!target) {
      this.prompt.setVisible(false);
      this.btnTalk?.setVisible(false);
      return;
    }
    const cam = this.village.cameras.main;
    const label = target.type === 'npc' ? '대화' : target.spot.label;
    const text = `${this.isTouch ? '💬' : 'E'} ${label}`;
    if (this.promptText.text !== text) {
      this.promptText.setText(text);
      const w = this.promptText.width + 18;
      this.promptBg.clear().fillStyle(0xfff8e6, 0.95).fillRoundedRect(-w / 2, -12, w, 24, 10)
        .lineStyle(2, INK, 1).strokeRoundedRect(-w / 2, -12, w, 24, 10)
        .fillStyle(0xfff8e6, 0.95).fillTriangle(-6, 11, 6, 11, 0, 18);
    }
    this.prompt.setPosition(target.x - cam.scrollX, target.y - cam.scrollY - 26).setVisible(true);
    this.btnTalk.setVisible(true);
  }

  // ── 알림 ──────────────────────────────────────
  toast(msg) {
    this.toastText.setText(msg).setAlpha(1).setY(100);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, y: 90, delay: 1600, duration: 500 });
  }

  showBanner(title, sub) {
    const c = this.add.container(W / 2, 150).setDepth(45).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(-260, -38, 520, 76);
    g.lineStyle(2, GOLD, 0.9).lineBetween(-240, -30, 240, -30).lineBetween(-240, 30, 240, 30);
    const t1 = crisp(this.add.text(0, -8, title, textStyle(28, '#ffe9a8')).setOrigin(0.5));
    const t2 = crisp(this.add.text(0, 18, sub, textStyle(13, '#e6f0dd')).setOrigin(0.5));
    c.add([g, t1, t2]);
    this.tweens.chain({
      targets: c,
      tweens: [{ alpha: 1, duration: 500, delay: 300 }, { alpha: 0, duration: 700, delay: 2200 }],
    });
  }

  update(time) {
    this.drawBars();
    this.drawMinimap(time);
    this.potText.setText(`${this.potionCount}`);
  }
}
