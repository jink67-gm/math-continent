// 게임 상태 관리
// - base: 지금 있는 "장면" (타이틀, 마을, 필드, 보스...)
// - overlays: 장면 위에 뜬 창 (수학 문제, 인벤토리, 메뉴...)
// 창이 떠 있으면 캐릭터 조작이 멈추고, 맨 위 창만 입력을 받습니다.

export const STATES = Object.freeze({
  BOOT: 'BOOT',
  TITLE: 'TITLE',
  CHARACTER_SETUP: 'CHARACTER_SETUP',
  WORLD: 'WORLD',
  VILLAGE: 'VILLAGE',
  FIELD: 'FIELD',
  BATTLE: 'BATTLE',
  BOSS: 'BOSS',
  GAME_OVER: 'GAME_OVER',
});

export const OVERLAYS = Object.freeze({
  MATH_CHALLENGE: 'MATH_CHALLENGE',
  INVENTORY: 'INVENTORY',
  SHOP: 'SHOP',
  DIALOGUE: 'DIALOGUE',
  MENU: 'MENU',
  SETTINGS: 'SETTINGS',
  CONFIRM: 'CONFIRM',
  REWARD: 'REWARD',
  WORLD_MAP: 'WORLD_MAP',
});

const PLAY_STATES = new Set([STATES.WORLD, STATES.VILLAGE, STATES.FIELD, STATES.BATTLE, STATES.BOSS]);

export class GameStateMachine {
  constructor(bus) {
    this.bus = bus;
    this.base = STATES.BOOT;
    this.overlays = [];
  }

  setBase(state) {
    const prev = this.base;
    this.base = state;
    this.overlays = [];
    this.bus.emit('state:change', { base: state, prev, overlays: [] });
  }

  push(overlay) {
    this.overlays.push(overlay);
    this.bus.emit('state:change', { base: this.base, overlays: [...this.overlays] });
    return overlay;
  }

  pop(overlay) {
    const i = overlay ? this.overlays.lastIndexOf(overlay) : this.overlays.length - 1;
    if (i >= 0) this.overlays.splice(i, 1);
    this.bus.emit('state:change', { base: this.base, overlays: [...this.overlays] });
  }

  has(overlay) {
    return this.overlays.includes(overlay);
  }

  get top() {
    return this.overlays[this.overlays.length - 1] || this.base;
  }

  // 게임 장면 안에 있는가 (창이 떠 있어도 true)
  get inPlay() {
    return PLAY_STATES.has(this.base);
  }

  // 캐릭터를 움직일 수 있는가 (창이 하나도 없을 때만)
  get gameplayActive() {
    return this.inPlay && this.overlays.length === 0;
  }
}
