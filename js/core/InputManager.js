// 키보드 + 터치(가상 조이스틱, 버튼) 입력을 한곳에서 처리

const KEY_ACTIONS = {
  attack: ['KeyJ', 'KeyZ'],
  // 스킬 칸 3개: 숫자키 1·2·3 (예전 K·L 키도 그대로 쓸 수 있어요)
  skill1: ['Digit1', 'Numpad1', 'KeyK', 'KeyX'],
  skill2: ['Digit2', 'Numpad2', 'KeyL', 'KeyC'],
  skill3: ['Digit3', 'Numpad3', 'KeyU', 'KeyV'],
  dodge: ['Space', 'ShiftLeft', 'ShiftRight'],
  menu: ['Escape'],
  inventory: ['KeyI'],
  interact: ['KeyE'],
  potion: ['KeyQ'],
};

const MOVE_KEYS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
};

const GAME_KEYS = new Set([...Object.values(KEY_ACTIONS).flat(), ...Object.values(MOVE_KEYS).flat()]);

function isTyping(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
}

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.joy = { x: 0, y: 0, active: false };
    this.enabled = true;
    this.isTouch = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.reset());
  }

  onKeyDown(e) {
    if (isTyping(e.target)) return;
    if (this.enabled && GAME_KEYS.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    for (const [action, codes] of Object.entries(KEY_ACTIONS)) {
      if (codes.includes(e.code)) this.pressed.add(action);
    }
  }

  // 창을 닫을 때: 창 안에서 누른 키가 게임으로 새어 나가지 않게
  clearPressed() {
    this.pressed.clear();
  }

  reset() {
    this.keys.clear();
    this.pressed.clear();
    this.joy = { x: 0, y: 0, active: false };
  }

  down(list) {
    return list.some((c) => this.keys.has(c));
  }

  // 이동 방향 (-1 ~ 1)
  axis() {
    if (this.joy.active) return { x: this.joy.x, y: this.joy.y };
    let x = (this.down(MOVE_KEYS.right) ? 1 : 0) - (this.down(MOVE_KEYS.left) ? 1 : 0);
    let y = (this.down(MOVE_KEYS.down) ? 1 : 0) - (this.down(MOVE_KEYS.up) ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  // 이번 프레임에 눌린 행동을 한 번만 꺼내 씀
  consume(action) {
    if (this.pressed.has(action)) {
      this.pressed.delete(action);
      return true;
    }
    return false;
  }

  endFrame() {
    this.pressed.clear();
  }

  // 화면 터치 조작 만들기
  buildTouchControls(container) {
    container.innerHTML = `
      <div class="joystick" data-joystick>
        <div class="joy-base"><div class="joy-knob"></div></div>
      </div>
      <div class="action-pad">
        <button class="act-btn act-skill1" data-action="skill1" aria-label="스킬 1"><span class="act-icon">✨</span><i class="cd"></i></button>
        <button class="act-btn act-skill2" data-action="skill2" aria-label="스킬 2"><span class="act-icon">✨</span><i class="cd"></i></button>
        <button class="act-btn act-skill3" data-action="skill3" aria-label="스킬 3"><span class="act-icon">✨</span><i class="cd"></i></button>
        <button class="act-btn act-dodge" data-action="dodge" aria-label="회피"><img class="act-img" src="assets/effects/dust_cloud.webp" alt="" draggable="false" onerror="this.replaceWith('💨')"></button>
        <button class="act-btn act-potion" data-action="potion" aria-label="회복약"><img class="act-img" src="assets/items/consumables/potion_red.webp" alt="" draggable="false" onerror="this.replaceWith('🧪')"><b class="act-count">0</b></button>
        <button class="act-btn act-attack" data-action="attack" aria-label="공격"><img class="act-img" src="assets/items/weapons/sword_iron.webp" alt="" draggable="false" onerror="this.replaceWith('⚔️')"></button>
        <button class="act-interact hidden" data-action="interact"><img class="act-img" src="assets/npc3/icons/speech_talk.webp" alt="" draggable="false" onerror="this.replaceWith('💬')"> <span>대화하기</span></button>
      </div>`;

    const zone = container.querySelector('[data-joystick]');
    const base = zone.querySelector('.joy-base');
    const knob = zone.querySelector('.joy-knob');
    let pid = null;
    const R = 46;

    const move = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const mag = Math.min(1, len / R);
      this.joy = mag < 0.15 ? { x: 0, y: 0, active: true } : { x: dx / R, y: dy / R, active: true };
    };
    const end = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      knob.style.transform = '';
      this.joy = { x: 0, y: 0, active: false };
    };

    zone.addEventListener('pointerdown', (e) => {
      pid = e.pointerId;
      zone.setPointerCapture(pid);
      move(e);
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === pid) move(e); });
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.pressed.add(btn.dataset.action);
        btn.classList.add('pressed');
      });
      const up = () => btn.classList.remove('pressed');
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }
}
