// 협동 친구의 모습: 받은 위치로 부드럽게 따라가고, 걷기·공격 모습과 이름·HP를 보여 줘요.

import { HEROES } from '../data/assets.js';
import { textStyle, crisp } from '../ui/style.js';

export class RemotePlayer {
  constructor(scene, info) {
    this.scene = scene;
    this.key = HEROES[info.gender] || HEROES.male;
    this.x = info.x ?? 0;
    this.y = info.y ?? 0;
    this.state = 'move';
    this.shadow = scene.add.ellipse(this.x, this.y, 12, 4, 0x000000, 0.3);
    this.sprite = scene.add.sprite(this.x, this.y, `ch/${this.key}`, 0).setOrigin(0.5, 1);
    this.tag = crisp(scene.add.text(this.x, this.y, info.name, textStyle(12, '#9be8ff'))).setOrigin(0.5, 1).setScale(1 / 3);
    this.bar = scene.add.graphics();
    this.lastAtk = 0;
  }

  update(st) {
    if (!st) return;
    // 받은 자리로 부드럽게 (멀리 떨어졌으면 바로 옮겨요)
    const far = Math.hypot(st.x - this.x, st.y - this.y) > 80;
    this.x = far ? st.x : this.x + (st.x - this.x) * 0.3;
    this.y = far ? st.y : this.y + (st.y - this.y) * 0.3;
    this.state = st.st;
    const moving = Math.hypot(st.x - this.x, st.y - this.y) > 0.6;
    let anim = `${this.key}_${moving ? 'walk' : 'idle'}_${st.d || 'down'}`;
    if (st.st === 'atk' || st.st === 'cast') anim = `${this.key}_atk_${st.d || 'down'}`;
    if (this.sprite.anims.currentAnim?.key !== anim) this.sprite.play(anim, true);
    this.sprite.setAngle(st.st === 'down' ? 90 : 0);
    const sx = Math.round(this.x);
    const sy = Math.round(this.y + 3);
    this.sprite.setPosition(sx, sy).setDepth(sy);
    this.shadow.setPosition(sx, sy - 1).setDepth(sy - 1);
    this.tag.setPosition(sx, sy - 20).setDepth(100000);
    const r = Math.max(0, Math.min(1, (st.hp || 0) / (st.mhp || 1)));
    this.bar.clear().setDepth(100000)
      .fillStyle(0x000000, 0.7).fillRect(sx - 8, sy - 19, 16, 3)
      .fillStyle(0x6be06b, 1).fillRect(sx - 7.5, sy - 18.5, 15 * r, 2);
  }

  destroy() {
    this.shadow.destroy();
    this.sprite.destroy();
    this.tag.destroy();
    this.bar.destroy();
  }
}
