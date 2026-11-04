// 주인공: 8방향 이동, 3단 콤보 공격, 구르기, 스킬
// 충돌은 발밑의 작은 상자(feet)로만 하고, 그림은 그 위에 따라 붙어요.

const SPEED = 74;
const DODGE_SPEED = 200;
const DODGE_MS = 210;
const ATK_MS = 230;

const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export class Player {
  constructor(scene, x, y, sprite) {
    this.scene = scene;
    this.key = sprite; // 캐릭터 폴더 이름 (예: KnightGold)
    this.dir = 'down';
    this.state = 'move';
    this.combo = 0;
    this.comboUntil = 0;

    this.shadow = scene.add.ellipse(x, y, 12, 4, 0x000000, 0.3);
    this.feet = scene.add.zone(x, y, 9, 5);
    scene.physics.add.existing(this.feet);
    this.feet.body.setCollideWorldBounds(true);
    this.sprite = scene.add.sprite(x, y, `ch/${sprite}`, 0).setOrigin(0.5, 1);
    this.sword = scene.add.image(x, y, 'na/sword').setVisible(false);
    this.play('idle_down');
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }

  play(name) {
    const key = `${this.key}_${name}`;
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) this.sprite.play(key, true);
  }

  facingVector() { return VEC[this.dir]; }

  attack() {
    if (this.state !== 'move') return false;
    const now = this.scene.time.now;
    this.combo = now < this.comboUntil ? (this.combo % 3) + 1 : 1;
    this.comboUntil = now + 600;
    this.state = 'atk';
    this.feet.body.setVelocity(0, 0);
    this.sprite.play(`${this.key}_atk_${this.dir}`, true);
    this.swingSword();
    if (this.combo === 3) {
      const [vx, vy] = this.facingVector();
      this.feet.body.setVelocity(vx * 90, vy * 90);
    }
    this.scene.time.delayedCall(ATK_MS, () => {
      this.feet.body.setVelocity(0, 0);
      this.sword.setVisible(false);
      this.state = 'move';
    });
    return this.combo;
  }

  // 손에 든 칼을 휘두르는 모양 (칼 그림을 돌려서)
  swingSword() {
    const base = { up: 0, right: 90, down: 180, left: 270 }[this.dir];
    const flip = this.combo === 2 ? -1 : 1;
    this.sword.setVisible(true).setOrigin(0.5, 1).setAngle(base - 70 * flip);
    this.scene.tweens.add({ targets: this.sword, angle: base + 70 * flip, duration: 140, ease: 'Quad.out' });
  }

  dodge(vx, vy) {
    if (this.state !== 'move') return false;
    if (!vx && !vy) [vx, vy] = this.facingVector();
    const len = Math.hypot(vx, vy) || 1;
    this.state = 'dodge';
    this.feet.body.setVelocity((vx / len) * DODGE_SPEED, (vy / len) * DODGE_SPEED);
    this.play(`walk_${this.dir}`);
    this.sprite.anims.timeScale = 2.5;
    this.scene.tweens.add({ targets: this.sprite, scaleY: 0.75, scaleX: 1.15, duration: DODGE_MS / 2, yoyo: true });
    this.scene.time.delayedCall(DODGE_MS, () => {
      this.feet.body.setVelocity(0, 0);
      this.sprite.anims.timeScale = 1;
      this.state = 'move';
    });
    return true;
  }

  skill() {
    if (this.state !== 'move') return false;
    this.state = 'skill';
    this.feet.body.setVelocity(0, 0);
    this.sprite.play(`${this.key}_atk_${this.dir}`, true);
    this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 4, duration: 120, yoyo: true });
    this.scene.time.delayedCall(360, () => { this.state = 'move'; });
    return this.dir;
  }

  // vx, vy: -1~1 입력값
  update(vx, vy, locked) {
    if (this.state === 'move') {
      if (locked) { vx = 0; vy = 0; }
      const len = Math.hypot(vx, vy);
      if (len > 0.15) {
        const n = Math.min(1, len);
        this.feet.body.setVelocity((vx / len) * SPEED * n, (vy / len) * SPEED * n);
        if (Math.abs(vx) > Math.abs(vy) * 1.1) this.dir = vx < 0 ? 'left' : 'right';
        else this.dir = vy < 0 ? 'up' : 'down';
        this.play(`walk_${this.dir}`);
      } else {
        this.feet.body.setVelocity(0, 0);
        this.play(`idle_${this.dir}`);
      }
    }
    const sx = Math.round(this.feet.x);
    const sy = Math.round(this.feet.y + 3);
    this.sprite.setPosition(sx, sy);
    this.shadow.setPosition(sx, sy - 1);
    this.sprite.setDepth(sy);
    this.shadow.setDepth(sy - 1);
    // 칼은 손 위치에 (위를 볼 때는 몸 뒤로)
    const hand = { down: [5, -5], up: [-5, -7], left: [-5, -5], right: [5, -5] }[this.dir];
    this.sword.setPosition(sx + hand[0], sy + hand[1]).setDepth(this.dir === 'up' ? sy - 0.5 : sy + 0.5);
  }
}
