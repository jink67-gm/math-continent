// 그림·소리를 모두 불러오고, 주인공·마을 사람 애니메이션을 만들어요.

import { ASSET_ROOT, IMAGE_KEYS, AUDIO, HERO_FRAMES, NPC_SPRITES } from '../data/assets.js';
import { FONT } from '../ui/style.js';

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
    for (const key of IMAGE_KEYS) this.load.image(key, `${key}.webp`);
    for (const [key, path] of Object.entries(AUDIO)) this.load.audio(key, path);
  }

  async create() {
    this.makeHeroAnims();
    this.makeNpcAnims();
    this.label.setText('저장 기록 확인 중...');
    this.registry.set('save', await this.loadPromise);
    this.registry.set('legacy', this.game.saves.legacy);
    this.scene.start('Title');
  }

  makeHeroAnims() {
    const rates = { idle: 2.5, walk: 10, atk: 18, dodge: 14, skill: 12, hit: 10 };
    for (const g of ['male', 'female']) {
      for (const [set, anims] of Object.entries(HERO_FRAMES)) {
        for (const [name, count] of Object.entries(anims)) {
          const kind = name.split('_')[0];
          const frames = [];
          for (let i = 1; i <= count; i++) frames.push({ key: `${set}/${g}/${name}_${i}` });
          this.anims.create({
            key: `${g}_${name}`, frames,
            frameRate: name.startsWith('walk_left') || name.startsWith('walk_right') ? 14 : rates[kind],
            repeat: kind === 'idle' || kind === 'walk' ? -1 : 0,
          });
        }
      }
    }
  }

  makeNpcAnims() {
    const make = (base, key) => {
      this.anims.create({
        key: `${key}_idle`, frameRate: 3, repeat: -1, yoyo: true,
        frames: ['idle_01', 'idle_02', 'idle_03'].map((f) => ({ key: `${base}/${f}` })),
      });
      this.anims.create({
        key: `${key}_talk`, frameRate: 7, repeat: -1,
        frames: ['talk_01', 'talk_02', 'talk_03', 'talk_04'].map((f) => ({ key: `${base}/${f}` })),
      });
    };
    for (const n of NPC_SPRITES) make(`npc3/${n}`, n);
    make('pack4/pipi', 'pipi');
  }
}
