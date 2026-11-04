// 마을 사람: 숨쉬듯 들썩이기, 말할 때 통통 튀기, 머리 위 이름표, 가끔 산책

import { textStyle, crisp } from '../ui/style.js';

export class Npc {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.key = def.sprite;
    this.home = { x: def.x, y: def.y };
    this.talkIndex = 0;
    this.dir = 'down';

    this.shadow = scene.add.ellipse(def.x, def.y, 11, 4, 0x000000, 0.28);
    this.sprite = scene.add.sprite(def.x, def.y, `ch/${def.sprite}`, 0).setOrigin(0.5, 1);
    this.sprite.play(`${this.key}_idle_down`);
    // 이름표는 작은 글씨를 또렷하게 보이려고 1/3 크기로 그려요 (화면 3배 확대)
    this.tag = crisp(scene.add.text(def.x, def.y, def.name, textStyle(12, '#fff3c4')).setOrigin(0.5, 1).setScale(1 / 3));

    this.feet = scene.add.zone(def.x, def.y, 10, 6);
    scene.physics.add.existing(this.feet, !def.wander);
    if (def.wander) {
      this.feet.body.setImmovable(true);
      this.nextWalk = 0;
    }
    this.headY = -19;
    this.phase = Math.random() * Math.PI * 2;
    this.sync(0);
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
    if (on && this.def.wander) this.feet.body.setVelocity(0, 0);
  }

  // 주인공 쪽을 바라봐요
  face(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    this.sprite.play(`${this.key}_idle_${this.dir}`, true);
  }

  update(time) {
    if (this.def.wander && !this.talking) {
      if (time > this.nextWalk) {
        this.nextWalk = time + 1800 + Math.random() * 2400;
        const a = Math.random() * Math.PI * 2;
        const dx = this.home.x + Math.cos(a) * this.def.wander - this.x;
        const dy = this.home.y + Math.sin(a) * this.def.wander * 0.6 - this.y;
        const len = Math.hypot(dx, dy) || 1;
        this.feet.body.setVelocity((dx / len) * 22, (dy / len) * 22);
        this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        this.sprite.play(`${this.key}_walk_${this.dir}`, true);
        this.scene.time.delayedCall(Math.min(1300, (len / 22) * 1000), () => {
          this.feet.body.setVelocity(0, 0);
          this.sprite.play(`${this.key}_idle_${this.dir}`, true);
        });
      }
    }
    this.sync(time);
  }

  sync(time) {
    const float = this.def.float ? Math.sin(time / 380 + this.phase) * 1.5 - 3 : 0;
    const hop = this.talking ? -Math.abs(Math.sin(time / 110)) * 1.5 : 0;
    const breathe = 1 + Math.sin(time / 600 + this.phase) * 0.03;
    const sx = Math.round(this.feet.x);
    const sy = Math.round(this.feet.y + 3);
    this.sprite.setPosition(sx, sy + float + hop).setScale(1, breathe);
    this.shadow.setPosition(sx, sy - 1).setScale(this.def.float ? 0.8 : 1);
    this.tag.setPosition(sx, sy + this.headY + float);
    this.sprite.setDepth(sy);
    this.shadow.setDepth(sy - 1);
    this.tag.setDepth(100000);
  }
}
