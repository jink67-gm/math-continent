// 그림·소리를 모두 불러오고, 캐릭터·효과 애니메이션을 만들어요.

import { ASSET_ROOT, SHEETS, IMAGES, CHARACTERS, OBJECTS, BGM, AUDIO } from '../data/assets.js';
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
    this.load.audio('bgm_title', BGM.bgm_title);
    for (const [key, path] of Object.entries(AUDIO)) this.load.audio(key, path);
  }

  async create() {
    this.makeObjectFrames();
    this.makeCharacterAnims();
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

  makeFxAnims() {
    this.anims.create({ key: 'fx_slash', frames: this.anims.generateFrameNumbers('na/slash'), frameRate: 20 });
    this.anims.create({ key: 'fx_smoke', frames: this.anims.generateFrameNumbers('na/smoke'), frameRate: 16 });
    this.anims.create({ key: 'fx_sparkc', frames: this.anims.generateFrameNumbers('na/sparkc'), frameRate: 14 });
    this.anims.create({ key: 'fx_spark', frames: this.anims.generateFrameNumbers('na/spark'), frameRate: 10, repeat: -1 });
  }
}
