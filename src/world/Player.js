// 주인공: 8방향 이동, 3단 콤보 공격, 구르기, 스킬
// 충돌은 발밑의 작은 상자(feet)로만 하고, 그림은 그 위에 따라 붙어요.
// (그림 크기가 동작마다 달라도 충돌 상자가 흔들리지 않게)

const SPEED = 210;
const DODGE_SPEED = 560;
const DODGE_MS = 230;
const SCALE = 0.62;

export class Player {
  constructor(scene, x, y, gender = 'male') {
    this.scene = scene;
    this.g = gender;
    this.dir = 'down';
    this.side = 'right'; // 위·아래를 볼 때 구르기 방향
    this.state = 'move';
    this.combo = 0;
    this.comboUntil = 0;

    this.shadow = scene.add.ellipse(x, y, 46, 16, 0x000000, 0.28);
    this.feet = scene.add.zone(x, y, 28, 14);
    scene.physics.add.existing(this.feet);
    this.feet.body.setCollideWorldBounds(true);
    this.sprite = scene.add.sprite(x, y, `characters5/${gender}/idle_down_1`).setOrigin(0.5, 1).setScale(SCALE);
    this.play('idle_down');

    this.sprite.on('animationcomplete', (anim) => {
      if (/_(atk|skill|dodge)_/.test(anim.key)) this.state = 'move';
    });
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }

  play(name) {
    const key = `${this.g}_${name}`;
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) this.sprite.play(key, true);
  }

  facingVector() {
    return { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
  }

  attack() {
    if (this.state !== 'move') return false;
    const now = this.scene.time.now;
    this.combo = now < this.comboUntil ? (this.combo % 3) + 1 : 1;
    this.comboUntil = now + 650;
    this.state = 'atk';
    this.feet.body.setVelocity(0, 0);
    this.sprite.play(`${this.g}_atk_${this.dir}`);
    // 세 번째 공격은 조금 앞으로 내딛어요
    if (this.combo === 3) {
      const [vx, vy] = this.facingVector();
      this.feet.body.setVelocity(vx * 240, vy * 240);
      this.scene.time.delayedCall(120, () => this.state === 'atk' && this.feet.body.setVelocity(0, 0));
    }
    return this.combo;
  }

  dodge(vx, vy) {
    if (this.state !== 'move') return false;
    if (!vx && !vy) [vx, vy] = this.facingVector();
    const len = Math.hypot(vx, vy) || 1;
    if (vx) this.side = vx < 0 ? 'left' : 'right';
    this.state = 'dodge';
    this.feet.body.setVelocity((vx / len) * DODGE_SPEED, (vy / len) * DODGE_SPEED);
    this.sprite.play(`${this.g}_dodge_${this.side}`);
    this.scene.time.delayedCall(DODGE_MS, () => this.feet.body.setVelocity(0, 0));
    return true;
  }

  skill() {
    if (this.state !== 'move') return false;
    this.state = 'skill';
    this.feet.body.setVelocity(0, 0);
    const side = this.dir === 'left' || this.dir === 'right' ? this.dir : this.side;
    this.sprite.play(`${this.g}_skill_${side}`);
    return side;
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
        if (vx) this.side = vx < 0 ? 'left' : 'right';
        this.play(`walk_${this.dir}`);
      } else {
        this.feet.body.setVelocity(0, 0);
        this.play(`idle_${this.dir}`);
      }
    }
    this.sprite.setPosition(Math.round(this.feet.x), Math.round(this.feet.y + 7));
    this.shadow.setPosition(this.sprite.x, this.sprite.y - 4);
    this.sprite.setDepth(this.sprite.y);
    this.shadow.setDepth(this.sprite.y - 1);
  }
}
