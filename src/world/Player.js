// 주인공: 8방향 이동, 공격 자세, 구르기(무적), 맞으면 밀려나기, 스킬 시전
// 충돌은 발밑의 작은 상자(feet)로만 하고, 그림은 그 위에 따라 붙어요.
// 언제 때리고 누가 맞는지는 Combat.js가 정해요. 여기서는 몸의 움직임만 다뤄요.

const SPEED = 76;
const DODGE_SPEED = 210;
const DODGE_MS = 230;
const DODGE_INV_MS = 300; // 구르기 무적 시간

const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
// 칼 그림은 손잡이가 위, 칼날이 아래를 향해요. 보는 쪽으로 칼날이 향하게 돌리는 각도
const BLADE = { down: 0, left: 90, up: 180, right: -90 };

export class Player {
  constructor(scene, x, y, sprite) {
    this.scene = scene;
    this.key = sprite; // 캐릭터 폴더 이름 (예: KnightGold)
    this.dir = 'down';
    this.state = 'move';
    this.invUntil = 0;
    this.guardUntil = 0;
    this.actionEnd = null;

    this.shadow = scene.add.ellipse(x, y, 12, 4, 0x000000, 0.3);
    this.feet = scene.add.zone(x, y, 9, 5);
    scene.physics.add.existing(this.feet);
    this.feet.body.setCollideWorldBounds(true);
    this.sprite = scene.add.sprite(x, y, `ch/${sprite}`, 0).setOrigin(0.5, 1);
    this.sword = scene.add.image(x, y, 'na/sword').setFlipY(true).setVisible(false);
    this.lift = 0; // 점프할 때 몸만 위로
    this.play('idle_down');
  }

  // 끼운 무기 그림으로 바꿔요
  // 기본 칼(na/sword)만 손잡이가 아래라서 뒤집어 다른 칼처럼 손잡이를 위로 맞춰요
  setWeapon(key) {
    if (key && this.scene.textures.exists(key)) this.sword.setTexture(key).setFlipY(key === 'na/sword');
  }

  get x() { return this.feet.x; }
  get y() { return this.feet.y; }
  get canAct() { return this.state === 'move'; }
  get invulnerable() { return this.scene.time.now < this.invUntil || this.state === 'down'; }
  get guarding() { return this.scene.time.now < this.guardUntil; }

  play(name) {
    const key = `${this.key}_${name}`;
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) this.sprite.play(key, true);
  }

  facingVector() { return VEC[this.dir]; }

  faceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (!dx && !dy) return;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  }

  // 정해진 시간 동안 다른 행동을 못 하게 하고, 끝나면 onEnd를 불러요
  lock(state, ms, onEnd) {
    this.state = state;
    this.actionEnd?.remove();
    this.actionEnd = this.scene.time.delayedCall(ms, () => {
      this.actionEnd = null;
      if (this.state !== state) return;
      this.feet.body.setVelocity(0, 0);
      this.sword.setVisible(false);
      this.sprite.anims.timeScale = 1;
      this.state = 'move';
      onEnd?.();
    });
  }

  // 공격 한 번: 앞으로 내딛으며 손잡이를 쥔 칼을 앞쪽으로 빠르게 베어요 (2타는 반대로, 3타는 크게)
  // 칼날 자국(초승달)은 Combat.js가 그려요.
  swing(combo, ms, onEnd) {
    const [vx, vy] = this.facingVector();
    const step = combo === 3 ? 120 : 55;
    this.feet.body.setVelocity(vx * step, vy * step);
    this.scene.time.delayedCall(combo === 3 ? 120 : 80, () => {
      if (this.state === 'atk') this.feet.body.setVelocity(0, 0);
    });
    this.sprite.play(`${this.key}_atk_${this.dir}`, true);
    const base = BLADE[this.dir];
    const flip = combo === 2 ? -1 : 1;
    const arc = combo === 3 ? 80 : 60;
    this.scene.tweens.killTweensOf(this.sword);
    this.sword.setVisible(true).setOrigin(0.5, 0.15).setScale(combo === 3 ? 1.35 : 1.15).setAngle(base - arc * flip);
    this.scene.tweens.add({ targets: this.sword, angle: base + arc * flip, duration: combo === 3 ? 110 : 75, ease: 'Cubic.out' });
    this.lean(combo === 3 ? 1.25 : 1.15);
    this.lock('atk', ms, onEnd);
  }

  // 휘두르는 쪽으로 몸을 쭉 뻗었다가 돌아와요
  lean(k) {
    const side = this.dir === 'left' || this.dir === 'right';
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(1).setAngle(0);
    this.scene.tweens.add({ targets: this.sprite, scaleX: side ? k : 2 - k, scaleY: side ? 2 - k : k, duration: 60, yoyo: true, ease: 'Quad.out' });
  }

  // 칼을 한 바퀴 돌려요 (회전 베기)
  spin(ms) {
    this.sprite.play(`${this.key}_atk_${this.dir}`, true);
    this.scene.tweens.killTweensOf(this.sword);
    const base = BLADE[this.dir];
    this.sword.setVisible(true).setOrigin(0.5, 0.15).setScale(1.4).setAngle(base);
    this.scene.tweens.add({ targets: this.sword, angle: base + 360, duration: ms * 0.6, ease: 'Cubic.out' });
    this.feet.body.setVelocity(0, 0);
    this.lock('cast', ms);
  }

  // 제자리에서 스킬을 쓰는 자세
  cast(ms, { jump = 0 } = {}) {
    this.feet.body.setVelocity(0, 0);
    this.sprite.play(`${this.key}_atk_${this.dir}`, true);
    if (jump) this.scene.tweens.add({ targets: this, lift: jump, duration: ms * 0.45, yoyo: true, ease: 'Quad.out' });
    this.lock('cast', ms);
  }

  // 빠르게 미끄러지듯 이동 (구르기·돌진)
  rush(vx, vy, speed, ms, state = 'dodge', invMs = ms) {
    const len = Math.hypot(vx, vy) || 1;
    this.feet.body.setVelocity((vx / len) * speed, (vy / len) * speed);
    this.invUntil = Math.max(this.invUntil, this.scene.time.now + invMs);
    this.lock(state, ms);
  }

  dodge(vx, vy) {
    if (!this.canAct) return false;
    if (Math.hypot(vx, vy) < 0.15) [vx, vy] = this.facingVector();
    else this.faceTo(this.x + vx, this.y + vy);
    this.play(`walk_${this.dir}`);
    this.sprite.anims.timeScale = 2.5;
    this.scene.tweens.add({ targets: this.sprite, scaleY: 0.72, scaleX: 1.18, duration: DODGE_MS / 2, yoyo: true });
    this.rush(vx, vy, DODGE_SPEED, DODGE_MS, 'dodge', DODGE_INV_MS);
    return true;
  }

  // 맞았을 때: 뒤로 밀리고, 잠깐 깜빡이며 무적
  hurt(fromX, fromY, power = 1) {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.sword.setVisible(false);
    this.feet.body.setVelocity((dx / len) * 150 * power, (dy / len) * 150 * power);
    this.invUntil = this.scene.time.now + 750;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
    this.lock('hurt', 200);
  }

  knockDown() {
    this.actionEnd?.remove();
    this.state = 'down';
    this.sword.setVisible(false);
    this.feet.body.setVelocity(0, 0);
    this.sprite.anims.stop();
    this.scene.tweens.add({ targets: this.sprite, angle: 90, duration: 300 });
  }

  // vx, vy: -1~1 입력값
  update(vx, vy, locked) {
    const now = this.scene.time.now;
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
    // 맞은 뒤 무적일 때는 깜빡깜빡 (구르기 중에는 안 깜빡여요)
    const blink = this.state !== 'dodge' && this.state !== 'down' && now < this.invUntil && Math.floor(now / 70) % 2 === 0;
    this.sprite.setPosition(sx, sy - Math.round(this.lift)).setAlpha(blink ? 0.35 : 1);
    this.shadow.setPosition(sx, sy - 1).setScale(1 - this.lift / 40);
    this.sprite.setDepth(sy);
    this.shadow.setDepth(sy - 1);
    // 칼은 손 위치에 (위를 볼 때는 몸 뒤로)
    const hand = { down: [5, -5], up: [-5, -7], left: [-5, -5], right: [5, -5] }[this.dir];
    this.sword.setPosition(sx + hand[0], sy + hand[1] - this.lift).setDepth(this.dir === 'up' ? sy - 0.5 : sy + 0.5);
  }
}
