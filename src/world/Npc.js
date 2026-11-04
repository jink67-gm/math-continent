// 마을 사람: 제자리 숨쉬기, 말할 때 입 움직이기, 머리 위 이름표, 가끔 산책

import { textStyle, crisp } from '../ui/style.js';

const SCALE = 0.72;

export class Npc {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.home = { x: def.x, y: def.y };
    this.talkIndex = 0;
    const animBase = def.sprite;
    this.animBase = animBase;
    const first = animBase === 'pipi' ? 'pack4/pipi/idle_01' : `npc3/${animBase}/idle_01`;

    this.shadow = scene.add.ellipse(def.x, def.y, 40, 14, 0x000000, 0.25);
    this.sprite = scene.add.sprite(def.x, def.y, first).setOrigin(0.5, 1).setScale(SCALE);
    this.sprite.play(`${animBase}_idle`);
    this.sprite.anims.setProgress(Math.random());
    this.tag = crisp(scene.add.text(def.x, def.y, def.name, textStyle(12, '#fff3c4')).setOrigin(0.5, 1));

    this.feet = scene.add.zone(def.x, def.y, 30, 16);
    scene.physics.add.existing(this.feet, !def.wander);
    if (def.wander) {
      this.feet.body.setImmovable(true);
      this.nextWalk = 0;
    }
    this.headY = -this.sprite.displayHeight - 4;
    this.sync();
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }

  nextLines() {
    const lines = this.def.lines[this.talkIndex % this.def.lines.length];
    this.talkIndex++;
    return lines;
  }

  setTalking(on) {
    this.talking = on;
    this.sprite.play(`${this.animBase}_${on ? 'talk' : 'idle'}`, true);
    if (on && this.feet.body.setVelocity) this.feet.body.setVelocity(0, 0);
  }

  // 주인공 쪽을 바라봐요 (그림이 정면뿐이라 좌우만 뒤집어요)
  face(px) {
    this.sprite.setFlipX(px < this.x - 6);
  }

  update(time) {
    if (this.def.wander && !this.talking) {
      if (time > this.nextWalk) {
        this.nextWalk = time + 1800 + Math.random() * 2200;
        const a = Math.random() * Math.PI * 2;
        const dx = this.home.x + Math.cos(a) * this.def.wander - this.x;
        const dy = this.home.y + Math.sin(a) * this.def.wander * 0.6 - this.y;
        const len = Math.hypot(dx, dy) || 1;
        this.feet.body.setVelocity((dx / len) * 50, (dy / len) * 50);
        this.sprite.setFlipX(dx < 0);
        this.scene.time.delayedCall(Math.min(1400, (len / 50) * 1000), () => this.feet.body.setVelocity(0, 0));
      }
    }
    this.sync(time);
  }

  sync(time = 0) {
    const bob = this.def.float ? Math.sin(time / 380) * 4 - 10 : 0;
    this.sprite.setPosition(Math.round(this.feet.x), Math.round(this.feet.y + 8 + bob));
    this.shadow.setPosition(this.feet.x, this.feet.y + 4).setScale(this.def.float ? 0.8 - bob / 60 : 1);
    this.tag.setPosition(this.sprite.x, this.sprite.y + this.headY);
    this.sprite.setDepth(this.sprite.y - bob);
    this.shadow.setDepth(this.sprite.y - bob - 1);
    this.tag.setDepth(100000);
  }
}
