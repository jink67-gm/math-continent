// 타이틀: 새 게임 / 이어하기 → 주인공 고르기 → 마을로

import { textStyle, crisp } from '../ui/style.js';
import { TerrainGrid, seeded } from '../world/terrain.js';
import { HEROES } from '../data/assets.js';
import { skillsFor } from '../data/skills.js';
import { DIFFICULTY, DIFF_ORDER, normalizeStats, normalizeCode } from '../data/rules.js';

const W = 960;
const H = 540;
export function newStats(name, gender, difficulty = 'normal') {
  return normalizeStats({
    name, gender, difficulty, lv: 1, exp: 0, gold: 50, potions: 3, learned: [skillsFor({ gender })[0].id],
    village: 'fractionValley', scene: 'Village', pos: null, playTime: 0,
  });
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    // 배경: 초원 타일 + 어두운 하늘빛
    const g = new TerrainGrid(20, 12);
    g.rect(9, 0, 10, 11, 'd');
    g.bake(this, seeded(3)).setScale(3).setAlpha(0.55);
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1b2a4a, 0x1b2a4a, 0x14201a, 0x14201a, 0.85, 0.85, 0.4, 0.4).fillRect(0, 0, W, H);
    for (const [k, x, s] of [['tree_big', 90, 4], ['tree_pine', 880, 4], ['tree_big_pink', 790, 3], ['tree_pine', 190, 3]]) {
      this.add.image(x, H + 10, 'na/nature', k).setOrigin(0.5, 1).setScale(s).setTint(0x8899aa);
    }

    const gems = [0x6fdc6f, 0xa77bff, 0x4fa3ff, 0xff5a5a, 0x3fd6c0, 0xc58bff];
    gems.forEach((c, i) => {
      const d = this.add.star(W / 2 - 125 + i * 50, 92, 4, 7, 16, c).setStrokeStyle(2, 0xffffff, 0.8);
      this.tweens.add({ targets: d, y: 86, duration: 900, yoyo: true, repeat: -1, delay: i * 140, ease: 'Sine.inOut' });
    });
    crisp(this.add.text(W / 2, 160, '수학 대륙', textStyle(64, '#fff3c4', { strokeThickness: 10 })).setOrigin(0.5));
    crisp(this.add.text(W / 2, 220, '여섯 마을의 봉인', textStyle(20, '#ffd866')).setOrigin(0.5));

    this.heroL = this.add.sprite(250, 470, `ch/${HEROES.male}`, 0).setOrigin(0.5, 1).setScale(8).play(`${HEROES.male}_walk_down`);
    this.heroR = this.add.sprite(710, 470, `ch/${HEROES.female}`, 0).setOrigin(0.5, 1).setScale(8).play(`${HEROES.female}_walk_down`);

    this.menu = this.add.container(0, 0);
    const save = this.registry.get('save');
    this.button(W / 2, 300, '새 게임', 'ui2/button_primary', () => (save ? this.confirmNew() : this.openSelect()), this.menu);
    const cont = this.button(W / 2, 360, save ? `이어하기 · ${save.name}` : '이어하기', 'ui2/button_brown', () => save && this.startGame(save), this.menu);
    if (!save) cont.setAlpha(0.5);
    this.button(W / 2, 420, '저장 코드로 불러오기', 'ui2/button_brown', () => this.openCodeLoad(), this.menu, 260, 40, 15);

    crisp(this.add.text(W / 2, H - 14, '6학년 2학기 수학 RPG · 화면을 누르면 소리가 나요', textStyle(11, '#c9d6c2')).setOrigin(0.5, 1));

    this.sound.stopAll();
    const playBgm = () => { if (!this.bgm) { this.bgm = this.sound.add('bgm_title', { loop: true, volume: 0.4 }); this.bgm.play(); } };
    if (this.sound.locked) this.sound.once('unlocked', playBgm); else playBgm();
  }

  button(x, y, label, key, fn, parent, w = 260, h = 48, size = 18) {
    const c = this.add.container(x, y);
    const bg = this.add.image(0, 0, key).setDisplaySize(w, h);
    const t = crisp(this.add.text(0, 0, label, textStyle(size, '#ffffff')).setOrigin(0.5));
    c.add([bg, t]).setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => c.setScale(1.04));
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerdown', () => { this.sound.play('sfx_click', { volume: 0.4 }); fn(); });
    parent?.add(c);
    return c;
  }

  openSelect() {
    this.menu.setVisible(false);
    this.heroL.setVisible(false);
    this.heroR.setVisible(false);
    // 컨테이너 안에 컨테이너를 넣으면 클릭이 안 먹어서, 하나씩 놓고 목록으로 지워요
    const box = [];
    const keep = (o) => { box.push(o); return o; };
    const g = keep(this.add.graphics());
    g.fillStyle(0x16110b, 0.92).fillRoundedRect(W / 2 - 300, 236, 600, 296, 10)
      .lineStyle(3, 0xe8c36a, 1).strokeRoundedRect(W / 2 - 300, 236, 600, 296, 10);
    keep(crisp(this.add.text(W / 2, 258, '모험가를 골라 주세요', textStyle(18, '#ffe9a8')).setOrigin(0.5)));

    let gender = 'male';
    const cards = {};
    for (const [gd, x, label] of [['male', W / 2 - 150, '남성 모험가'], ['female', W / 2 + 150, '여성 모험가']]) {
      const c = keep(this.add.container(x, 398));
      const frame = this.add.graphics();
      const spr = this.add.sprite(0, 50, `ch/${HEROES[gd]}`, 0).setOrigin(0.5, 1).setScale(6).play(`${HEROES[gd]}_idle_down`);
      const t = crisp(this.add.text(0, 66, label, textStyle(13, '#fff3c4')).setOrigin(0.5));
      c.add([frame, spr, t]).setSize(150, 170).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => { gender = gd; this.sound.play('sfx_click', { volume: 0.4 }); paint(); });
      cards[gd] = { c, frame, spr };
    }
    const paint = () => {
      for (const [gd, { frame, spr }] of Object.entries(cards)) {
        const on = gd === gender;
        frame.clear().fillStyle(on ? 0x2f4f7a : 0x2a2420, 1).fillRoundedRect(-75, -85, 150, 170, 8)
          .lineStyle(on ? 3 : 1, on ? 0xffd866 : 0x6b4a22, 1).strokeRoundedRect(-75, -85, 150, 170, 8);
        spr.play(on ? `${HEROES[gd]}_walk_down` : `${HEROES[gd]}_idle_down`, true);
      }
    };
    paint();

    const input = keep(this.add.dom(W / 2, 298).createElement('input', 'class: name-input'));
    input.node.className = 'name-input';
    input.node.placeholder = '별명 (2~10글자)';
    input.node.maxLength = 10;
    // 기존 게임에서 쓰던 별명이 있으면 미리 채워 둬요
    const legacy = this.registry.get('legacy');
    if (legacy?.nickname) input.node.value = legacy.nickname;

    const start = () => {
      input.node.blur(); // 한글 입력 중인 글자를 확정해요
      const name = input.node.value.trim();
      if (name.length < 2) { input.node.focus(); input.node.style.borderColor = '#ff6a5a'; return; }
      this.startGame(newStats(name, gender, difficulty));
    };
    input.node.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) start(); });
    // 난이도 (가운데 아래): 전투만 바뀌고, 마을 게시판에서 언제든 바꿀 수 있어요
    let difficulty = 'normal';
    const diffBtns = {};
    const paintDiff = () => {
      for (const [id, b] of Object.entries(diffBtns)) b.setAlpha(id === difficulty ? 1 : 0.45).setScale(id === difficulty ? 1.05 : 1);
    };
    keep(crisp(this.add.text(W / 2, 486, '난이도', textStyle(11, '#ffe9a8')).setOrigin(0.5)));
    DIFF_ORDER.forEach((id, i) => {
      const b = keep(this.button(W / 2 - 74 + i * 74, 508, DIFFICULTY[id].label, 'ui2/button_brown', () => { difficulty = id; paintDiff(); }, null, 68, 28, 12));
      diffBtns[id] = b;
    });
    paintDiff();
    keep(this.button(W / 2 + 200, 506, '모험 시작!', 'ui2/button_green', start, null, 170, 34, 15));
    keep(this.button(W / 2 - 200, 506, '뒤로', 'ui2/button_brown', () => {
      box.forEach((o) => o.destroy());
      this.menu.setVisible(true);
      this.heroL.setVisible(true);
      this.heroR.setVisible(true);
    }, null, 170, 34, 15));
  }

  // 다른 기기에서 하던 캐릭터를 저장 코드로 불러와요
  openCodeLoad() {
    this.menu.setVisible(false);
    const box = [];
    const keep = (o) => { box.push(o); return o; };
    const g = keep(this.add.graphics());
    g.fillStyle(0x16110b, 0.94).fillRoundedRect(W / 2 - 250, 250, 500, 200, 10)
      .lineStyle(3, 0xe8c36a, 1).strokeRoundedRect(W / 2 - 250, 250, 500, 200, 10);
    keep(crisp(this.add.text(W / 2, 278, '저장 코드 8글자를 넣어 주세요', textStyle(16, '#ffe9a8')).setOrigin(0.5)));
    const input = keep(this.add.dom(W / 2, 326).createElement('input', 'class: name-input'));
    input.node.className = 'name-input';
    input.node.placeholder = '예: K7QM-3PXA';
    input.node.maxLength = 9;
    input.node.style.textTransform = 'uppercase';
    input.node.style.letterSpacing = '2px';
    const msg = keep(crisp(this.add.text(W / 2, 364, '', textStyle(12, '#ff9b8a')).setOrigin(0.5)));
    const close = () => { box.forEach((o) => o.destroy()); this.menu.setVisible(true); };
    let busy = false;
    const go = async () => {
      if (busy) return;
      const code = normalizeCode(input.node.value);
      if (!code) { msg.setColor('#ff9b8a').setText('8글자를 모두 넣어 주세요 (숫자 0·1, 글자 O·I는 없어요)'); return; }
      busy = true;
      msg.setColor('#cfe3c8').setText('불러오는 중...');
      const res = await this.game.saves.loadByCode(code);
      busy = false;
      if (!this.sys.isActive()) return;
      if (res.error) { msg.setColor('#ff9b8a').setText(res.error); return; }
      box.forEach((o) => o.destroy());
      this.startGame(res.save);
    };
    input.node.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) go(); });
    keep(this.button(W / 2 - 100, 412, '뒤로', 'ui2/button_brown', close, null, 170, 36, 15));
    keep(this.button(W / 2 + 100, 412, '불러오기', 'ui2/button_green', go, null, 170, 36, 15));
    input.node.focus();
  }

  // 이어할 기록이 있을 때 새 게임을 누르면 한 번 더 물어봐요
  confirmNew() {
    this.menu.setVisible(false);
    const box = [];
    const g = this.add.graphics();
    g.fillStyle(0x16110b, 0.94).fillRoundedRect(W / 2 - 230, 270, 460, 160, 10)
      .lineStyle(3, 0xe8c36a, 1).strokeRoundedRect(W / 2 - 230, 270, 460, 160, 10);
    box.push(g);
    box.push(crisp(this.add.text(W / 2, 318, '지금까지의 모험 기록이 지워져요.\n새로 시작할까요?',
      textStyle(15, '#fff3c4', { align: 'center', lineSpacing: 6 })).setOrigin(0.5)));
    const close = () => box.forEach((o) => o.destroy());
    box.push(this.button(W / 2 - 100, 390, '취소', 'ui2/button_brown', () => { close(); this.menu.setVisible(true); }, null, 170, 36, 15));
    box.push(this.button(W / 2 + 100, 390, '새로 시작', 'ui2/button_primary', () => { close(); this.openSelect(); }, null, 170, 36, 15));
  }

  startGame(stats) {
    normalizeStats(stats);
    this.registry.set('player', stats);
    this.game.saves.save(stats, { now: true });
    this.sound.play('sfx_confirm', { volume: 0.5 });
    this.cameras.main.fadeOut(400, 0, 0, 0);
    // 예전 1번 마을 장면(Village·Field·RockForest·Cave)으로 저장된 기록은 새 프락시아 마을에서 시작해요
    let scene = ['Town', 'Wild', 'Dungeon', 'Map'].includes(stats.scene) ? stats.scene : 'Map';
    let map = stats.scene === 'Map' ? stats.map : 'village';
    // 큐베른·데시마르는 여러 지도 구조로 바뀌었어요: 예전 마을·들판·던전에 있었다면 그 지역 마을 지도로
    const moved = { cubeCity: 'cb_town', decimalHarbor: 'dh_town', ratioKingdom: 'rk_town', circleForest: 'ck_town' }[stats.region];
    if (scene !== 'Map' && moved) { scene = 'Map'; map = moved; }
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, { region: stats.region, map }));
  }
}
