// 그림·소리를 모두 불러오고, 캐릭터·효과 애니메이션을 만들어요.

import { ASSET_ROOT, SHEETS, IMAGES, CHARACTERS, OBJECTS, BGM, AUDIO, MONSTER_SHEETS, BOSS_SHEETS } from '../data/assets.js';
import { FONT } from '../ui/style.js';

export const DIRS = ['down', 'up', 'left', 'right'];

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 40, '수학 대륙', { fontFamily: FONT, fontSize: '32px', color: '#ffe9a8' })
      .setOrigin(0.5).setResolution(2);
    const barBg = this.add.rectangle(width / 2, height / 2 + 10, 320, 14, 0x2a3a2e).setStrokeStyle(2, 0xe8c36a);
    const bar = this.add.rectangle(barBg.x - 158, barBg.y, 0, 10, 0x7fd36b).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 40, '모험을 준비하는 중...', { fontFamily: FONT, fontSize: '14px', color: '#cfe3c8' })
      .setOrigin(0.5).setResolution(2);
    this.load.on('progress', (p) => { bar.width = 316 * p; });
    this.load.on('loaderror', (file) => console.warn('불러오기 실패:', file.src));
    this.label = label;
    this.loadPromise = this.game.saves.load().catch(() => null);

    this.load.setPath(ASSET_ROOT);
    for (const [key, v] of Object.entries(SHEETS)) {
      const [path, fw = 16, fh = fw] = Array.isArray(v) ? v : [v];
      this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fh });
    }
    for (const [key, path] of Object.entries(IMAGES)) this.load.image(key, path);
    for (const c of CHARACTERS) {
      this.load.spritesheet(`ch/${c}`, `na/chars/${c}/SpriteSheet.png`, { frameWidth: 16, frameHeight: 16 });
      this.load.image(`face/${c}`, `na/chars/${c}/Faceset.png`);
    }
    for (const m of MONSTER_SHEETS) this.load.spritesheet(`mon/${m}`, `na/mon/${m}.png`, { frameWidth: 16, frameHeight: 16 });
    for (const [key, [path, fw]] of Object.entries(BOSS_SHEETS)) this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fw });
    this.load.image('face/troll', 'na/boss/troll/face.png');
    this.load.audio('bgm_title', BGM.bgm_title);
    for (const [key, path] of Object.entries(AUDIO)) this.load.audio(key, path);
  }

  async create() {
    this.makeObjectFrames();
    this.makeCharacterAnims();
    this.makeMonsterAnims();
    this.makeBossAnims();
    this.makeFxAnims();
    this.label.setText('저장 기록 확인 중...');
    this.registry.set('save', await this.loadPromise);
    this.registry.set('legacy', this.game.saves.legacy);
    this.scene.start('Title');
  }

  // 큰 타일 그림에서 집·나무·소품을 잘라 이름을 붙여요
  makeObjectFrames() {
    for (const [name, [sheet, x, y, w, h]] of Object.entries(OBJECTS)) {
      this.textures.get(sheet).add(name, 0, x * 16, y * 16, w * 16, h * 16);
    }
  }

  makeCharacterAnims() {
    for (const c of CHARACTERS) {
      const key = `ch/${c}`;
      DIRS.forEach((dir, d) => {
        this.anims.create({ key: `${c}_walk_${dir}`, frames: this.anims.generateFrameNumbers(key, { frames: [d, d + 4, d + 8, d + 12] }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: `${c}_idle_${dir}`, frames: this.anims.generateFrameNumbers(key, { frames: [d] }), frameRate: 1 });
        this.anims.create({ key: `${c}_atk_${dir}`, frames: this.anims.generateFrameNumbers(key, { frames: [16 + d, 16 + d] }), frameRate: 9 });
      });
    }
  }

  makeMonsterAnims() {
    for (const m of MONSTER_SHEETS) {
      DIRS.forEach((dir, d) => {
        this.anims.create({ key: `mon_${m}_${dir}`, frames: this.anims.generateFrameNumbers(`mon/${m}`, { frames: [d, d + 4, d + 8, d + 12] }), frameRate: 7, repeat: -1 });
      });
    }
  }

  makeBossAnims() {
    const a = (key, sheet, rate, repeat = -1) => this.anims.create({ key, frames: this.anims.generateFrameNumbers(sheet), frameRate: rate, repeat });
    a('troll_idle', 'boss/troll_idle', 7);
    a('troll_attack', 'boss/troll_attack', 12, 0);
    a('troll_jump', 'boss/troll_jump', 10, 0);
    a('troll_charge', 'boss/troll_charge', 8);
    a('spirit_idle', 'boss/spirit_idle', 7);
    a('spirit_hit', 'boss/spirit_hit', 10, 0);
  }

  makeFxAnims() {
    this.anims.create({ key: 'fx_fountain', frames: this.anims.generateFrameNumbers('zl/fountain'), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'fx_flam', frames: this.anims.generateFrameNumbers('na/flam'), frameRate: 14 });
    this.anims.create({ key: 'fx_flam_loop', frames: this.anims.generateFrameNumbers('na/flam', { frames: [1, 2] }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'fx_ice', frames: this.anims.generateFrameNumbers('na/ice'), frameRate: 16 });
    this.anims.create({ key: 'fx_shield', frames: this.anims.generateFrameNumbers('na/shield'), frameRate: 12 });
    this.anims.create({ key: 'fx_star', frames: this.anims.generateFrameNumbers('na/star'), frameRate: 14 });
    this.anims.create({ key: 'fx_ring', frames: this.anims.generateFrameNumbers('na/ring'), frameRate: 14 });
    this.anims.create({ key: 'fx_slash', frames: this.anims.generateFrameNumbers('na/slash'), frameRate: 20 });
    this.anims.create({ key: 'fx_slashc', frames: this.anims.generateFrameNumbers('na/slashc'), frameRate: 24 });
    this.anims.create({ key: 'fx_slashdc', frames: this.anims.generateFrameNumbers('na/slashdc'), frameRate: 20 });
    this.anims.create({ key: 'fx_slashcirc', frames: this.anims.generateFrameNumbers('na/slashcirc'), frameRate: 18 });
    this.anims.create({ key: 'fx_smoke', frames: this.anims.generateFrameNumbers('na/smoke'), frameRate: 16 });
    this.anims.create({ key: 'fx_sparkc', frames: this.anims.generateFrameNumbers('na/sparkc'), frameRate: 14 });
    this.anims.create({ key: 'fx_spark', frames: this.anims.generateFrameNumbers('na/spark'), frameRate: 10, repeat: -1 });
  }
}
