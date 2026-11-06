// 화면 위 UI: 상태 막대, 미니맵, 행동 버튼, 조이스틱, 빠른 칸, 대화창, 알림

import { textStyle, crisp, FONT } from '../ui/style.js';
import { HEROES } from '../data/assets.js';
import { DIFFICULTY, formatCode } from '../data/rules.js';
import { T } from '../world/terrain.js';
import { SKILL_KEYS } from '../data/skills.js';

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
    this.worldKey = data.worldKey;
    this.worldInfo = data.info;
    this.attackHeld = false;
    this.joy = { x: 0, y: 0 };
    this.dialogOpen = false;
  }

  create() {
    this.world = this.scene.get(this.worldKey);
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
    this.showBanner(this.worldInfo.name, this.worldInfo.subtitle);

    this.input.keyboard.on('keydown-Q', () => this.usePotion());
    this.makeSaveIndicator();
    this.makeMenuButton();
    this.partyText = crisp(this.add.text(16, 112, '', textStyle(12, '#9be8ff')));
    // 퀘스트 알림판과 길 안내 화살표
    this.questBg = this.add.graphics();
    this.questText = crisp(this.add.text(16, 132, '', textStyle(12, '#fff3c4', { lineSpacing: 4 })));
    this.arrow = this.add.graphics().setDepth(5);
    this.bossBar = this.add.graphics().setDepth(6);
    // 성장 시험 단추 (레벨업하면 생겨요, 미뤄도 돼요)
    this.testBtn = this.add.container(16, 214).setVisible(false);
    const tg = this.add.graphics();
    tg.fillStyle(0x3b2a7a, 0.92).fillRoundedRect(0, 0, 150, 30, 8).lineStyle(2, 0xffd866, 1).strokeRoundedRect(0, 0, 150, 30, 8);
    this.testText = crisp(this.add.text(75, 15, '', textStyle(12, '#ffe9a8')).setOrigin(0.5));
    this.testBtn.add([tg, this.testText]).setSize(150, 30).setInteractive(new Phaser.Geom.Rectangle(0, 0, 150, 30), Phaser.Geom.Rectangle.Contains);
    this.testBtn.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.world.growthTest(); });
    this.tweens.add({ targets: this.testBtn, alpha: 0.7, duration: 700, yoyo: true, repeat: -1 });
    this.input.keyboard.on('keydown-T', () => this.world.growthTest());
    this.input.keyboard.on('keydown-B', () => !this.dialogOpen && this.world.openBag());
    this.input.keyboard.on('keydown-M', () => !this.dialogOpen && this.world.openMap());
    // 지도 단추 (메뉴 옆)
    const mc = this.add.container(386, 32);
    const mg = this.add.graphics().fillStyle(0x16110b, 0.85).fillRoundedRect(-30, -16, 60, 32, 8).lineStyle(2, GOLD, 1).strokeRoundedRect(-30, -16, 60, 32, 8);
    mc.add([mg, crisp(this.add.text(0, 0, this.isTouch ? '지도' : '지도 M', textStyle(13, '#ffe9a8')).setOrigin(0.5))]).setSize(60, 32).setInteractive({ useHandCursor: true });
    mc.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); if (!this.dialogOpen) this.world.openMap(); });
    // 협동 인사말 (정해진 말만 보낼 수 있어요)
    this.greet = this.add.container(16, 252).setVisible(false);
    ['안녕!', '고마워!', '여기야!', '잘했어!'].forEach((txt, i) => {
      const x = (i % 2) * 76;
      const y = Math.floor(i / 2) * 30;
      const g = this.add.graphics().fillStyle(0x16110b, 0.85).fillRoundedRect(x, y, 70, 26, 8).lineStyle(1, 0x9be8ff, 1).strokeRoundedRect(x, y, 70, 26, 8);
      const t = crisp(this.add.text(x + 35, y + 13, txt, textStyle(11, '#9be8ff')).setOrigin(0.5));
      const z = this.add.zone(x + 35, y + 13, 70, 26).setInteractive({ useHandCursor: true });
      z.on('pointerdown', (p, lx, ly, ev) => {
        ev?.stopPropagation();
        if (this.greetAt > this.time.now) return;
        this.greetAt = this.time.now + 1200;
        this.game.party.send({ t: 'say', text: txt });
        this.world.say(txt);
      });
      this.greet.add([g, t, z]);
    });
    this.bossName = crisp(this.add.text(W / 2 + 10, 26, '', textStyle(13, '#ffe9a8')).setOrigin(0.5).setDepth(7));
    const pmsg = (m) => this.toast(m);
    this.game.events.on('party:msg', pmsg);
    this.events.once('shutdown', () => this.game.events.off('party:msg', pmsg));
    this.boostText = crisp(this.add.text(W - 18, 200, '', textStyle(13, '#ffe066')).setOrigin(1, 0.5));
    this.tweens.add({ targets: this.boostText, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
    this.hurtFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xff2a1a, 0).setDepth(60);
  }

  // ── 메뉴 (상태 막대 오른쪽): 저장 코드 보기, 소리 켜기/끄기 ──
  makeMenuButton() {
    const c = this.add.container(320, 32);
    const g = this.add.graphics();
    g.fillStyle(0x16110b, 0.85).fillRoundedRect(-30, -16, 60, 32, 8).lineStyle(2, GOLD, 1).strokeRoundedRect(-30, -16, 60, 32, 8);
    const t = crisp(this.add.text(0, 0, '메뉴', textStyle(13, '#ffe9a8')).setOrigin(0.5));
    c.add([g, t]).setSize(60, 32).setInteractive({ useHandCursor: true });
    c.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); if (!this.dialogOpen) this.openMenu(); });
    this.input.keyboard.on('keydown-ESC', () => { if (this.menuItems) this.closeMenu(); else if (!this.dialogOpen) this.openMenu(); });
  }

  openMenu() {
    const s = this.stats;
    this.dialogOpen = true;
    this.choiceOpen = true;
    const items = [];
    this.menuItems = items;
    const bw = 460;
    const bh = 320;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2 - 10;
    items.push(panel(this, bx, by, bw, bh, 0.95).setDepth(46));
    items.push(crisp(this.add.text(W / 2, by + 28, '메뉴', textStyle(18, '#ffe9a8')).setOrigin(0.5).setDepth(47)));
    items.push(crisp(this.add.text(W / 2, by + 62, '내 저장 코드', textStyle(13, '#cfe3c8')).setOrigin(0.5).setDepth(47)));
    items.push(crisp(this.add.text(W / 2, by + 98, formatCode(s.saveCode), textStyle(34, '#ffffff', { strokeThickness: 6 })).setOrigin(0.5).setDepth(47)));
    items.push(crisp(this.add.text(W / 2, by + 136, '다른 기기에서 「저장 코드로 불러오기」에 이 코드를 넣으면\n같은 캐릭터로 이어서 할 수 있어요. 친구에게는 알려 주지 마세요!',
      textStyle(11, '#e6f0dd', { align: 'center', lineSpacing: 4 })).setOrigin(0.5, 0).setDepth(47)));
    const btn = (x, y, w, label, fn) => {
      const g = this.add.graphics().setDepth(47);
      const t = crisp(this.add.text(x, y, label, textStyle(15, '#ffffff')).setOrigin(0.5).setDepth(48));
      const paint = (txt) => {
        t.setText(txt);
        g.clear().fillStyle(0x3a2c1c, 1).fillRoundedRect(x - w / 2, y - 19, w, 38, 8).lineStyle(2, GOLD, 1).strokeRoundedRect(x - w / 2, y - 19, w, 38, 8);
      };
      paint(label);
      const z = this.add.zone(x, y, w, 38).setInteractive({ useHandCursor: true }).setDepth(49);
      z.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.world.sound.play('sfx_click', { volume: 0.4 }); fn(paint); });
      items.push(g, t, z);
    };
    const soundLabel = () => (this.game.sound.mute ? '소리 켜기' : '소리 끄기');
    btn(W / 2 - 140, by + 214, 128, '가방 (B)', () => { this.closeMenu(); this.world.openBag(); });
    btn(W / 2 + 140, by + 214, 128, soundLabel(), (paint) => {
      this.game.sound.mute = !this.game.sound.mute;
      try { localStorage.setItem('mathContinent.mute', this.game.sound.mute ? '1' : '0'); } catch { /* 저장 못 해도 괜찮아요 */ }
      paint(soundLabel());
    });
    btn(W / 2, by + 214, 128, '친구와 함께', () => { this.closeMenu(true); this.openParty(); });
    btn(W / 2, by + 270, 128, '닫기', () => this.closeMenu());
    this.world.sound.play('sfx_open', { volume: 0.35 });
  }

  closeMenu(keepOpen = false) {
    this.menuItems?.forEach((o) => o.destroy());
    this.menuItems = null;
    if (keepOpen) return;
    this.choiceOpen = false;
    this.time.delayedCall(120, () => { this.dialogOpen = false; });
  }

  // ── 친구와 함께하기 (2인 협동) ──────────────────
  openParty(msg = '') {
    const party = this.game.party;
    const me = this.stats;
    this.dialogOpen = true;
    this.choiceOpen = true;
    this.menuItems?.forEach((o) => o.destroy());
    const items = [];
    this.menuItems = items;
    const bw = 500;
    const bh = 300;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2 - 10;
    const text = (x, y, t, size, color, extra) => {
      const o = crisp(this.add.text(x, y, t, textStyle(size, color, extra)).setOrigin(0.5).setDepth(47));
      items.push(o);
      return o;
    };
    items.push(panel(this, bx, by, bw, bh, 0.95).setDepth(46));
    text(W / 2, by + 28, '친구와 함께하기 (2명)', 18, '#ffe9a8');
    const btn = (x, y, w, label, fn) => {
      const g = this.add.graphics().setDepth(47);
      g.fillStyle(0x3a2c1c, 1).fillRoundedRect(x - w / 2, y - 19, w, 38, 8).lineStyle(2, GOLD, 1).strokeRoundedRect(x - w / 2, y - 19, w, 38, 8);
      const t = crisp(this.add.text(x, y, label, textStyle(15, '#ffffff')).setOrigin(0.5).setDepth(48));
      const z = this.add.zone(x, y, w, 38).setInteractive({ useHandCursor: true }).setDepth(49);
      z.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.world.sound.play('sfx_click', { volume: 0.4 }); fn(); });
      items.push(g, t, z);
    };
    const status = text(W / 2, by + 228, msg, 12, '#ffb36b');
    const busy = async (job) => {
      status.setColor('#cfe3c8').setText('연결하는 중...');
      const res = await job();
      if (!this.sys.isActive()) return;
      if (res?.error) status.setColor('#ffb36b').setText(res.error);
      else this.openParty();
    };
    const meInfo = { name: me.name, gender: me.gender, lv: me.lv };
    if (!party.active) {
      text(W / 2, by + 66, '함께하면 몬스터가 1.5배 단단해지지만, 둘이 같이 잡아서\n혼자일 때보다 느리게 크지 않아요. 아이템은 각자 따로 나와요.', 12, '#e6f0dd', { align: 'center', lineSpacing: 4 });
      btn(W / 2 - 120, by + 128, 190, '방 만들기', () => busy(() => party.create(meInfo)));
      text(W / 2 - 120, by + 172, '방 번호가 생기면\n친구에게 알려 주세요', 11, '#cfe3c8', { align: 'center' });
      const input = this.add.dom(W / 2 + 120, by + 128).createElement('input');
      input.node.className = 'name-input';
      input.node.style.width = '170px';
      input.node.placeholder = '친구의 방 번호';
      input.node.inputMode = 'numeric';
      input.node.maxLength = 4;
      items.push(input);
      const join = () => busy(() => party.join(input.node.value.trim(), meInfo));
      input.node.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') join(); });
      btn(W / 2 + 120, by + 180, 190, '친구 방에 들어가기', join);
    } else {
      text(W / 2, by + 66, '방 번호', 12, '#cfe3c8');
      text(W / 2, by + 96, party.room, 34, '#ffffff', { strokeThickness: 6 });
      const peer = party.peer;
      text(W / 2, by + 140, peer ? `${me.name}  +  ${peer.name} (Lv${peer.lv})` : '친구를 기다리는 중... 이 번호를 친구에게 알려 주세요', 14, peer ? '#9be8ff' : '#ffe9a8');
      text(W / 2, by + 168, '같은 곳(마을·필드)에 있으면 서로 보이고 함께 싸울 수 있어요.', 11, '#e6f0dd');
      btn(W / 2 - 90, by + 262, 160, '파티 나가기', () => busy(async () => { await party.leave(); }));
    }
    btn(W / 2 + (party.active ? 90 : 0), by + 262, 160, '닫기', () => this.closeMenu());
    // 친구가 들어오거나 나가면 창을 새로 그려요
    const refresh = () => { if (this.menuItems === items) this.openParty(); };
    this.game.events.once('party:msg', refresh);
    items.push({ destroy: () => this.game.events.off('party:msg', refresh) });
  }

  drawBoss() {
    const b = this.world.boss;
    const g = this.bossBar.clear();
    if (!b?.engaged) { this.bossName.setText(''); return; }
    const x = W / 2 - 130;
    const y = 38;
    const w = 280;
    g.fillStyle(0x16110b, 0.85).fillRoundedRect(x - 6, y - 22, w + 12, 40, 8).lineStyle(2, GOLD, 1).strokeRoundedRect(x - 6, y - 22, w + 12, 40, 8);
    g.fillStyle(0x000000, 0.7).fillRect(x, y, w, 10);
    g.fillStyle(b.sealed ? 0xb48cff : 0xe0563c, 1).fillRect(x + 1, y + 1, (w - 2) * Math.max(0, b.hp / b.maxHp), 8);
    for (const m of [0.66, 0.33]) g.fillStyle(0xffffff, 0.7).fillRect(x + w * m, y, 2, 10);
    this.bossName.setText(b.sealed ? `${b.def.name} · 보호막!` : b.def.name);
  }

  drawQuest(time) {
    const q = this.game.quests;
    const text = q.tracker();
    if (text !== this.questText.text) {
      this.questText.setText(text);
      // 읽기 쉽게 반투명 바탕
      this.questBg.clear().fillStyle(0x0f0b06, 0.5).fillRoundedRect(10, 126, this.questText.width + 14, this.questText.height + 12, 6);
    }
    const g = this.arrow.clear();
    const goal = q.goal(this.world.placeKey);
    const p = this.world.player;
    if (!goal || this.dialogOpen) return;
    const dx = goal.x - p.x;
    const dy = goal.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 36) return;
    // 주인공 둘레에 목표 쪽을 가리키는 노란 화살표
    const cam = this.world.cameras.main;
    const wv = cam.worldView;
    const a = Math.atan2(dy, dx);
    const r = 34 + Math.sin(time / 180) * 4;
    const cx = (p.x - wv.x) * cam.zoom + Math.cos(a) * r * 1.6;
    const cy = (p.y - 8 - wv.y) * cam.zoom + Math.sin(a) * r * 1.6;
    const pt = (ang, len) => [cx + Math.cos(a + ang) * len, cy + Math.sin(a + ang) * len];
    const [x1, y1] = pt(0, 14);
    const [x2, y2] = pt(2.5, 11);
    const [x3, y3] = pt(-2.5, 11);
    g.fillStyle(0x1b1208, 0.8).fillTriangle(x1 + 2, y1 + 2, x2 + 2, y2 + 2, x3 + 2, y3 + 2);
    g.fillStyle(0xffd866, 0.95).fillTriangle(x1, y1, x2, y2, x3, y3);
  }

  flashHurt() {
    this.tweens.killTweensOf(this.hurtFlash);
    this.hurtFlash.setFillStyle(0xff2a1a, 0.22);
    this.tweens.add({ targets: this.hurtFlash, fillAlpha: 0, duration: 300 });
  }

  // ── 상태 (왼쪽 위) ─────────────────────────────
  makeStatus() {
    const s = this.stats;
    panel(this, 10, 10, 270, 84);
    // 얼굴 + 레벨 배지
    this.add.circle(50, 48, 30, 0x2c4a3a).setStrokeStyle(3, GOLD);
    const img = this.add.image(50, 48, `face/${HEROES[s.gender] || HEROES.male}`).setScale(1.3);
    const maskG = this.make.graphics().fillCircle(50, 48, 28);
    img.setMask(maskG.createGeometryMask());
    this.add.graphics().fillStyle(INK, 1).fillRoundedRect(28, 72, 44, 18, 9).lineStyle(2, GOLD, 1).strokeRoundedRect(28, 72, 44, 18, 9);
    this.lvText = crisp(this.add.text(50, 81, '', textStyle(12, '#ffe9a8')).setOrigin(0.5));
    this.nameText = crisp(this.add.text(92, 15, s.name, textStyle(14, '#fff3c4')));

    // 막대: 글자(HP·SP)는 막대 왼쪽, 숫자는 막대 안 가운데
    this.bars = this.add.graphics();
    this.barBox = { x: 118, w: 150 };
    crisp(this.add.text(92, 45, 'HP', textStyle(11, '#ff9b8a')).setOrigin(0, 0.5));
    crisp(this.add.text(92, 63, 'SP', textStyle(11, '#9cc8ff')).setOrigin(0, 0.5));
    crisp(this.add.text(92, 79, 'EXP', textStyle(9, '#f0d68a')).setOrigin(0, 0.5));
    const mid = this.barBox.x + this.barBox.w / 2;
    this.hpText = crisp(this.add.text(mid, 45, '', textStyle(10, '#ffffff', { strokeThickness: 3 })).setOrigin(0.5));
    this.spText = crisp(this.add.text(mid, 63, '', textStyle(10, '#ffffff', { strokeThickness: 3 })).setOrigin(0.5));
  }

  drawBars() {
    const s = this.stats;
    const g = this.bars.clear();
    const { x, w } = this.barBox;
    const bar = (y, ratio, color, h) => {
      const r = Phaser.Math.Clamp(ratio, 0, 1);
      g.fillStyle(0x000000, 0.65).fillRoundedRect(x, y - h / 2, w, h, 3);
      if (r > 0) {
        g.fillStyle(color, 1).fillRoundedRect(x + 1, y - h / 2 + 1, Math.max(4, (w - 2) * r), h - 2, 2);
        g.fillStyle(0xffffff, 0.22).fillRect(x + 2, y - h / 2 + 2, Math.max(0, (w - 4) * r), 2);
      }
    };
    bar(45, s.hp / s.maxHp, 0xd8443a, 14);
    bar(63, s.sp / s.maxSp, 0x3d7fe0, 14);
    bar(79, s.exp / s.next, 0xf0c64a, 6);
    this.hpText.setText(`${s.hp} / ${s.maxHp}`);
    this.spText.setText(`${s.sp} / ${s.maxSp}`);
    this.lvText.setText(`Lv ${s.lv}`);
  }

  // ── 미니맵 (오른쪽 위) ─────────────────────────
  makeMinimap() {
    const S = 3;
    const grid = this.world.grid;
    const mw = grid.cols * S;
    const mh = grid.rows * S;
    const x0 = W - mw - 18;
    const y0 = 34;
    panel(this, x0 - 8, 10, mw + 16, mh + 32 + 26);
    crisp(this.add.text(x0 + mw / 2, 22, this.worldInfo.name, textStyle(12, '#ffe9a8')).setOrigin(0.5));
    const g = this.add.graphics();
    const col = { g: 0x5f9b45, d: 0xc9a066, w: 0x3f86c9 };
    for (let ty = 0; ty < grid.rows; ty++) {
      for (let tx = 0; tx < grid.cols; tx++) {
        const c = grid.get(tx, ty);
        g.fillStyle(col[c], 1).fillRect(x0 + tx * S, y0 + ty * S, S + 0.5, S + 0.5);
      }
    }
    g.fillStyle(0x7a5236, 1);
    for (const b of this.world.mapBuildings) g.fillRect(x0 + (b.x / T - 1.5) * S, y0 + (b.y / T - 2.5) * S, 3 * S, 2.5 * S);
    g.lineStyle(1, INK, 1).strokeRect(x0, y0, mw, mh);
    this.mini = { x0, y0, S };
    this.miniDots = this.add.graphics();
    this.goldText = crisp(this.add.text(x0 + mw, y0 + mh + 14, '', textStyle(12, '#ffd866')).setOrigin(1, 0.5));
    this.add.image(x0 + 8, y0 + mh + 14, 'items/consumables/scroll').setScale(0.16);
    this.diffText = crisp(this.add.text(x0 + 18, y0 + mh + 14, '', textStyle(11, '#cfe3c8')).setOrigin(0, 0.5));
  }

  drawMinimap(time) {
    const { x0, y0, S } = this.mini;
    const g = this.miniDots.clear();
    const k = S / T;
    g.fillStyle(0xfff3c4, 1);
    for (const n of this.world.npcs) g.fillCircle(x0 + n.x * k, y0 + n.y * k, 1.6);
    g.fillStyle(0xff9a3c, 1);
    for (const m of this.world.combat.monsters) if (m.alive) g.fillRect(x0 + m.x * k - 1, y0 + m.y * k - 1, 2, 2);
    const p = this.world.player;
    const blink = 0.6 + 0.4 * Math.sin(time / 160);
    g.fillStyle(0xff4b3a, blink).fillCircle(x0 + p.x * k, y0 + p.y * k, 3);
    g.lineStyle(1, 0xffffff, 1).strokeCircle(x0 + p.x * k, y0 + p.y * k, 3);
    this.goldText.setText(`${this.stats.gold} G`);
    this.diffText.setText(`난이도 ${DIFFICULTY[this.stats.difficulty]?.label || '보통'}`);
  }

  // ── 행동 버튼 (오른쪽 아래) ─────────────────────
  // 공격 버튼 둘레에 스킬 4칸, 왼쪽 아래에 구르기
  makeButtons() {
    const mk = (x, y, key, size, icon, label, fn, iconScale = 0.2) => {
      const c = this.add.container(x, y);
      const base = this.add.image(0, 0, key).setDisplaySize(size, size);
      const [ik, ifr] = Array.isArray(icon) ? icon : [icon, undefined];
      const ic = this.add.image(0, -2, ik, ifr).setScale(iconScale);
      const t = crisp(this.add.text(0, size / 2 + 2, label, textStyle(10, '#fff3c4')).setOrigin(0.5, 0));
      c.add([base, ic, t]);
      c.setSize(size, size).setInteractive({ useHandCursor: true });
      c.on('pointerdown', (ptr, lx, ly, ev) => { ev?.stopPropagation(); c.setScale(0.9); fn(); });
      c.on('pointerup', () => c.setScale(1));
      c.on('pointerout', () => c.setScale(1));
      c.icon = ic;
      c.label = t;
      return c;
    };
    const v = () => this.world;
    const ax = W - 78;
    const ay = H - 86;
    this.btnAttack = mk(ax, ay, 'ui2/action_attack', 96, ['na/slash', 1], this.isTouch ? '공격' : '공격 J', () => {
      if (this.dialogOpen) { this.advanceDialog(); return; }
      this.attackHeld = true;
      v().combat.attack();
    }, 2);
    // 누르고 있으면 콤보가 이어져요
    const release = () => { this.attackHeld = false; };
    this.btnAttack.on('pointerup', release);
    this.btnAttack.on('pointerout', release);
    this.input.on('pointerup', release);

    this.btnDodge = mk(W - 225, H - 52, 'ui2/action_dodge', 58, ['na/smoke', 1], this.isTouch ? '구르기' : '구르기 Space', () => v().combat.dodge(...v().moveInput()), 1.2);
    this.btnDodge.dial = this.add.graphics();
    this.btnDodge.add(this.btnDodge.dial);

    // 스킬 4칸: 공격 버튼 둘레에 부채꼴로
    this.skillBtns = [];
    const keys = SKILL_KEYS;
    const angles = [180, 213, 246, 279];
    v().combat.skills.forEach((sk, i) => {
      const a = Phaser.Math.DegToRad(angles[i]);
      const x = ax + Math.cos(a) * 100;
      const y = ay + Math.sin(a) * 100;
      const b = mk(x, y, 'ui2/action_skill', 54, sk.icon, this.isTouch ? '' : keys[i], () => v().combat.castSkill(i), 1.1);
      b.label.setY(-40).setFontSize(13).setText(this.isTouch ? '' : keys[i]);
      b.dial = this.add.graphics();
      b.lockText = crisp(this.add.text(0, 0, '', textStyle(11, '#ffe9a8')).setOrigin(0.5));
      b.cdText = crisp(this.add.text(0, 0, '', textStyle(13, '#ffffff')).setOrigin(0.5));
      b.add([b.dial, b.lockText, b.cdText]);
      b.name = sk.name;
      this.skillBtns.push(b);
    });

    if (!this.textures.exists('icon_talk')) {
      // 말풍선 아이콘 (점 세 개)
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(INK, 1).fillRoundedRect(0, 0, 34, 24, 9).fillTriangle(8, 20, 16, 20, 6, 30);
      g.fillStyle(0xfff8e6, 1).fillRoundedRect(2, 2, 30, 20, 8).fillTriangle(9, 19, 15, 19, 8, 27);
      g.fillStyle(INK, 1).fillCircle(10, 12, 2.5).fillCircle(17, 12, 2.5).fillCircle(24, 12, 2.5);
      g.generateTexture('icon_talk', 34, 31);
      g.destroy();
    }
    this.btnTalk = mk(W - 230, H - 250, 'ui2/action_interact', 62, ['icon_talk'], this.isTouch ? '대화' : '대화 E', () => {
      if (this.dialogOpen) this.advanceDialog(); else v().interact();
    }, 1);
    this.btnTalk.setVisible(false);
  }

  // 스킬 칸: 잠김(레벨) · 재사용 대기(어두운 부채꼴과 남은 초) · SP 부족(빨간 테두리)
  drawSkills() {
    const c = this.world.combat;
    this.skillBtns.forEach((b, i) => {
      const st = c.skillState(i);
      const g = b.dial.clear();
      const r = 23;
      b.icon.setAlpha(st.locked ? 0.25 : 1);
      b.lockText.setText(st.locked ? `Lv${st.sk.lv}` : st.unlearned ? '배우기' : '');
      if (st.unlearned) b.icon.setAlpha(0.35);
      if (!st.locked && st.cdRatio > 0) {
        g.fillStyle(0x000000, 0.6).slice(0, -2, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * st.cdRatio, false).fillPath();
        b.cdText.setText(`${Math.ceil(st.cdLeft / 1000)}`);
      } else {
        b.cdText.setText('');
      }
      if (!st.locked && st.noSp) g.lineStyle(2, 0xff5a4a, 0.9).strokeCircle(0, -2, r);
    });
    // 구르기 대기 시간
    const d = c.dodgeState();
    const dg = this.btnDodge.dial.clear();
    if (d.cdRatio > 0) dg.fillStyle(0x000000, 0.55).slice(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * d.cdRatio, false).fillPath();
  }

  // ── 빠른 칸 (아래 가운데) ──────────────────────
  makeQuickSlots() {
    const x = W / 2 - 1.5 * 52;
    for (let i = 0; i < 4; i++) {
      const sx = x + i * 52;
      this.add.image(sx, H - 44, 'ui2/item_slot').setDisplaySize(46, 46).setAlpha(0.92);
    }
    const pot = this.add.image(x, H - 46, 'items/consumables/potion_red').setScale(0.22).setInteractive({ useHandCursor: true });
    pot.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.usePotion(); });
    this.potText = crisp(this.add.text(x + 18, H - 26, '', textStyle(11, '#ffffff')).setOrigin(1, 1));
    if (!this.isTouch) crisp(this.add.text(x - 19, H - 66, 'Q', textStyle(11, '#ffe9a8')));
  }

  usePotion() {
    const s = this.stats;
    if (this.dialogOpen) return;
    if (s.potions <= 0) { this.toast('회복약이 없어요'); return; }
    if (s.hp >= s.maxHp) { this.toast('HP가 이미 가득해요'); return; }
    s.potions--;
    const heal = Math.min(s.maxHp - s.hp, Math.round(s.maxHp * 0.35));
    s.hp += heal;
    this.world.combat.popNumber(this.world.player.x, this.world.player.y - 20, `+${heal}`, '#8dff8a', 14);
    this.world.sound.play('sfx_potion', { volume: 0.5 });
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
      if (p.x < W * 0.45 && p.y > H * 0.3 && this.joyPtr === null) {
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
    this.dlgPortrait = this.add.image(bx + 70, by + bh - 10, 'face/OldMan').setOrigin(0.5, 0.5);
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
      this.dlgPortrait.setScale(Math.floor(Math.min(104 / src.width, (bh - 36) / src.height)));
      this.dlgPortrait.setPosition(bx + 70, by + bh / 2);
      this.dlgPortraitBg.fillStyle(0x2c4a3a, 1).fillRoundedRect(bx + 14, by + 14, 112, bh - 28, 6)
        .lineStyle(2, GOLD, 1).strokeRoundedRect(bx + 14, by + 14, 112, bh - 28, 6);
    }
    this.dlg.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.dlg, alpha: 1, duration: 120 });
    this.world.sound.play('sfx_open', { volume: 0.35 });
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

  // 고르기 창 (예: 난이도). 고르거나 닫기를 누를 때까지 주인공은 멈춰 있어요.
  openChoice({ title, note, options, current, onPick, closable = true }) {
    this.dialogOpen = true;
    this.choiceOpen = true;
    const items = [];
    const bw = 460;
    const bh = 210;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2 - 20;
    items.push(panel(this, bx, by, bw, bh, 0.95).setDepth(46));
    items.push(crisp(this.add.text(W / 2, by + 30, title, textStyle(17, '#ffe9a8')).setOrigin(0.5).setDepth(47)));
    items.push(crisp(this.add.text(W / 2, by + 60, note, textStyle(12, '#e6f0dd', { align: 'center', wordWrap: { width: bw - 50 } })).setOrigin(0.5, 0).setDepth(47)));
    const close = () => {
      items.forEach((o) => o.destroy());
      this.choiceOpen = false;
      this.time.delayedCall(120, () => { this.dialogOpen = false; });
    };
    const button = (x, y, w, label, on, fn) => {
      const g = this.add.graphics().setDepth(47);
      g.fillStyle(on ? 0x2f6a3a : 0x3a2c1c, 1).fillRoundedRect(x - w / 2, y - 20, w, 40, 8)
        .lineStyle(2, on ? 0xffd866 : GOLD, 1).strokeRoundedRect(x - w / 2, y - 20, w, 40, 8);
      const t = crisp(this.add.text(x, y, label, textStyle(16, '#ffffff')).setOrigin(0.5).setDepth(48));
      const z = this.add.zone(x, y, w, 40).setInteractive({ useHandCursor: true }).setDepth(49);
      z.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.world.sound.play('sfx_click', { volume: 0.4 }); fn(); });
      items.push(g, t, z);
    };
    options.forEach((o, i) => {
      const x = W / 2 + (i - (options.length - 1) / 2) * 140;
      button(x, by + 128, 120, o.label, o.id === current, () => { close(); onPick(o.id); });
    });
    if (closable) button(W / 2, by + 180, 100, '닫기', false, close);
    this.world.sound.play('sfx_open', { volume: 0.35 });
  }

  advanceDialog() {
    if (!this.dialogOpen || this.choiceOpen) return;
    if (this.dlgTyping) {
      this.typeEvent?.remove();
      this.dlgText.setText(this.dlgPages[this.dlgPage]);
      this.dlgTyping = false;
      this.dlgArrow.setVisible(true);
      return;
    }
    this.dlgPage++;
    if (this.dlgPage < this.dlgPages.length) {
      this.world.sound.play('sfx_click', { volume: 0.3 });
      this.showPage();
      return;
    }
    this.dlg.setVisible(false);
    this.world.sound.play('sfx_close', { volume: 0.3 });
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
    const cam = this.world.cameras.main;
    const label = target.type === 'npc' ? '대화' : target.spot.label;
    const text = `${this.isTouch ? '💬' : 'E'} ${label}`;
    if (this.promptText.text !== text) {
      this.promptText.setText(text);
      const w = this.promptText.width + 18;
      this.promptBg.clear().fillStyle(0xfff8e6, 0.95).fillRoundedRect(-w / 2, -12, w, 24, 10)
        .lineStyle(2, INK, 1).strokeRoundedRect(-w / 2, -12, w, 24, 10)
        .fillStyle(0xfff8e6, 0.95).fillTriangle(-6, 11, 6, 11, 0, 18);
    }
    // 마을 카메라는 확대돼 있어서, 세상 좌표를 화면 좌표로 바꿔요
    const wv = cam.worldView;
    this.prompt.setPosition((target.x - wv.x) * cam.zoom, (target.y - wv.y) * cam.zoom - 16).setVisible(true);
    this.btnTalk.setVisible(true);
  }

  // ── 저장 표시 (상태 막대 아래) ─────────────────
  makeSaveIndicator() {
    const t = crisp(this.add.text(16, 96, '', textStyle(11, '#cfe3c8')).setAlpha(0));
    const words = {
      saving: ['저장 중…', '#ffe9a8'], saved: ['✓ 저장됨', '#9be38a'],
      local: ['✓ 이 기기에 저장됨', '#9be38a'], offline: ['인터넷 연결 안 됨 · 이 기기에 저장됨', '#ffb36b'],
      error: ['저장 실패', '#ff7a6a'],
    };
    const show = (s) => {
      const [msg, color] = words[s] || ['', '#ffffff'];
      this.tweens.killTweensOf(t);
      t.setText(msg).setColor(color).setAlpha(1);
      if (s !== 'saving') this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 600 });
    };
    this.game.events.on('save:status', show);
    this.events.once('shutdown', () => this.game.events.off('save:status', show));
  }

  // ── 알림 ──────────────────────────────────────
  toast(msg) {
    this.toastText.setText(msg).setAlpha(1).setY(100);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, y: 90, delay: 1600, duration: 500 });
  }

  // 큰 알림: 여러 개가 한꺼번에 오면 차례로 보여 줘요
  showBanner(title, sub) {
    (this.bannerQueue ||= []).push([title, sub]);
    if (!this.bannerBusy) this.nextBanner();
  }

  nextBanner() {
    const item = this.bannerQueue.shift();
    if (!item) { this.bannerBusy = false; return; }
    this.bannerBusy = true;
    const [title, sub] = item;
    const c = this.add.container(W / 2, 150).setDepth(45).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(-260, -38, 520, 76);
    g.lineStyle(2, GOLD, 0.9).lineBetween(-240, -30, 240, -30).lineBetween(-240, 30, 240, 30);
    const t1 = crisp(this.add.text(0, -8, title, textStyle(28, '#ffe9a8')).setOrigin(0.5));
    const t2 = crisp(this.add.text(0, 18, sub, textStyle(13, '#e6f0dd')).setOrigin(0.5));
    c.add([g, t1, t2]);
    this.tweens.chain({
      targets: c,
      tweens: [{ alpha: 1, duration: 350, delay: 100 }, { alpha: 0, duration: 500, delay: 1900 }],
      onComplete: () => { c.destroy(); this.nextBanner(); },
    });
  }

  update(time) {
    this.drawBars();
    this.drawSkills();
    this.drawMinimap(time);
    this.potText.setText(`${this.stats.potions ?? 0}`);
    const party = this.game.party;
    const peer = party.active && party.peer;
    const together = peer && this.world.combat.coop;
    this.drawQuest(time);
    this.drawBoss();
    const tests = this.stats.tests || 0;
    this.testBtn.setVisible(tests > 0);
    // 알림판 길이에 맞춰 단추들을 아래로 쌓아요
    const below = 132 + this.questText.height + 14;
    this.testBtn.setY(below);
    this.greet.setY(tests > 0 ? below + 38 : below);
    if (tests) this.testText.setText(`⭐ 성장 시험 ${tests}${this.isTouch ? '' : ' (T)'}`);
    this.partyText.setText(!party.active ? '' : !peer ? `파티 방 ${party.room} · 친구를 기다리는 중`
      : `함께: ${peer.name} Lv${party.peerState?.lv || peer.lv}${together ? '' : ' (다른 곳에 있어요)'}`);
    this.greet.setVisible(!!together);
    const boost = this.world.combat.boost() > 1;
    this.boostText.setText(boost ? '★ 경험치 2배 시간!' : '');
  }
}
