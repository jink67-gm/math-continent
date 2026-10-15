// 플레이어 데이터(저장되는 것)와 움직임·전투 상태(저장되지 않는 것)

import { UNIT_IDS } from '../data/units.js';
import { deepMerge, clamp } from '../core/utils.js';

export const SCHEMA_VERSION = 2;

export const HERO_COLORS = [
  { id: 'sunset', name: '노을', color: '#ff8a5c' },
  { id: 'sky', name: '하늘', color: '#4fc0ff' },
  { id: 'grape', name: '보라', color: '#9b7bff' },
  { id: 'sprout', name: '새싹', color: '#4fd283' },
  { id: 'sunny', name: '햇살', color: '#ffc93c' },
];

// 레벨업마다 자동으로 오르는 기본 성장
export const BASE_GROWTH = { maxHp: 10, attack: 2, defense: 1 };

// 성장 시험을 통과하면 고르는 보너스
export const BONUS_OPTIONS = [
  { id: 'maxHp', icon: '❤️', label: '체력 강화', desc: '최대 HP +15', amount: 15 },
  { id: 'attack', icon: '⚔️', label: '공격 강화', desc: '공격력 +3', amount: 3 },
  { id: 'defense', icon: '🛡️', label: '방어 강화', desc: '방어력 +2', amount: 2 },
];

// 다음 레벨까지 필요한 경험치
export function expToNext(level) {
  const n = level - 1;
  return Math.floor(25 + 15 * n + 4 * n * n);
}

// 새 모험 기록 만들기 (Firestore에 저장되는 구조)
export function createNewSave({ nickname, uid, color, characterVariant }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    saveVersion: 0,
    uid: uid || null,
    nickname: nickname || '모험가',
    appearance: { color: color || HERO_COLORS[0].color },
    characterVariant: characterVariant === 'female' ? 'female' : 'male',
    createdAt: Date.now(),
    lastSavedAt: 0,
    playTime: 0,

    level: 1,
    exp: 0,
    gold: 50,
    // 기본 능력치 (레벨 성장 + 성장 보너스). 장비 능력치는 따로 더해져요.
    stats: { hp: 100, maxHp: 100, attack: 10, defense: 3, moveSpeed: 3.2 },
    bonusStats: { maxHp: 0, attack: 0, defense: 0 },
    pendingLevelBonus: 0,

    currentVillage: 'fractionValley',
    currentArea: 'meadow',
    position: null,
    unlockedVillages: ['fractionValley'],
    visitedVillages: [],
    // 워프포인트를 직접 활성화한 마을 (방문 기록과 따로) — 월드맵 빠른 이동은 여기 있는 마을만
    warpPoints: ['fractionValley'],

    equipment: { weapon: null, armor: null, gloves: null, boots: null, accessory: null },
    inventory: [],
    itemSeq: 0,
    starterKitGiven: false,

    // 처음에는 기본 스킬 1개(회전베기)만 — 2·3번 칸은 레벨이 오르면 열려요
    skills: ['spin'],
    skillSlots: ['spin', null, null],
    rank: 0,

    quests: {},
    bossesDefeated: [],
    crystals: [],
    openedChests: [],
    activatedRunes: [],

    counters: {
      kills: 0, eliteKills: 0, killsByType: {},
      questsDone: 0, bestGrade: 1, bestEnhance: 0,
      chestsOpened: 0, specialChests: 0, deaths: 0,
    },

    mathProgress: Object.fromEntries(UNIT_IDS.map((u) => [u, { correct: 0, wrong: 0, solved: 0, streak: 0 }])),
    correctAnswers: 0,
    wrongAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    recentQuestionIds: [],

    achievements: [],
    settings: { bgmVolume: 0.6, sfxVolume: 0.8, muted: false },
  };
}

// 예전 버전 저장 데이터에 새 항목이 없으면 기본값으로 채움
export function migrateSave(raw) {
  if (!raw) return null;
  const base = createNewSave({ nickname: raw.nickname, uid: raw.uid, color: raw.appearance?.color });
  const merged = deepMerge(base, raw);
  merged.schemaVersion = SCHEMA_VERSION;
  // 예전 기록에는 캐릭터 정보가 없어요 → 남성 모험가로
  if (merged.characterVariant !== 'male' && merged.characterVariant !== 'female') merged.characterVariant = 'male';
  // 워프포인트: 예전 기록에는 없음 → 시작 마을 + 보스를 물리친 마을(이미 가 본 곳)만 활성화
  if (!Array.isArray(raw.warpPoints)) merged.warpPoints = ['fractionValley', ...(merged.bossesDefeated || []).filter((v) => /^(cubeCity|decimalHarbor|ratioKingdom|circleForest|solidPeaks)$/.test(v))];
  // 스킬 칸: 예전 2칸 기록 → 3칸 (기존 장착 스킬은 그대로, 새 칸은 비어 있음)
  if (!Array.isArray(merged.skillSlots)) merged.skillSlots = [null, null, null];
  merged.skillSlots = [0, 1, 2].map((i) => merged.skillSlots[i] ?? null);
  // 배운 스킬이 하나도 없던 기록에는 기본 스킬(회전베기)을 1번 칸에 (기존 스킬·칸은 그대로)
  if (!Array.isArray(merged.skills)) merged.skills = [];
  if (!merged.skills.length) {
    merged.skills = ['spin'];
    if (!merged.skillSlots[0]) merged.skillSlots[0] = 'spin';
  }
  return merged;
}

// 기본 공격 3단 콤보
// time: 휘두르는 시간 / hitAt: 이 비율에서 실제로 맞음 / lunge: 앞으로 나가는 속도
// mult: 피해 배율 / range·minDot: 공격 범위(거리·앞쪽 각도) / knock: 밀어내기
// stop: 맞혔을 때 잠깐 멈춤(히트스톱) / shake: 화면 흔들림 / after: 3타 뒤 쉬는 시간
export const COMBO = [
  { time: 0.24, hitAt: 0.38, lunge: 150, mult: 1.0, range: 66, minDot: 0.2, knock: 150, stop: 0.045, shake: 0, fx: 'slash_blue', sfx: 'slash1' },
  { time: 0.27, hitAt: 0.38, lunge: 170, mult: 1.2, range: 76, minDot: -0.15, knock: 200, stop: 0.055, shake: 2, fx: 'slash_orange', sfx: 'slash2' },
  { time: 0.44, hitAt: 0.45, lunge: 260, mult: 1.9, range: 92, minDot: -0.4, knock: 420, stop: 0.1, shake: 7, fx: 'slash_purple', sfx: 'slash3', after: 0.38 },
];
const COMBO_WINDOW = 0.4; // 휘두르기가 끝난 뒤 이 시간 안에 누르면 다음 타로 이어짐
const DODGE_TIME = 0.18;
const DODGE_COOLDOWN = 0.6;
const SKILL_DASH_TIME = 0.24;

export class Player {
  constructor(save) {
    this.save = save;
    this.x = save.position?.x ?? 0;
    this.y = save.position?.y ?? 0;
    this.facing = { x: 1, y: 0 };
    this.moving = false;
    this.t = 0;
    this.attackT = 0;      // 지금 휘두르는 중이면 남은 시간
    this.comboStep = 0;    // 1, 2, 3 (0이면 공격 중 아님)
    this.comboWindow = 0;  // 다음 타를 이어서 누를 수 있는 남은 시간
    this.comboQueued = false;
    this.comboRest = 0;    // 3타 뒤 쉬는 시간
    this.hitDone = false;
    this.hitT = 0;         // 맞은 모습
    this.skillT = 0;       // 스킬 쓰는 모습
    this.lastHx = 1;       // 마지막으로 본 좌우 방향
    this.dodgeT = 0;
    this.dodgeCd = 0;
    this.dodgeDir = { x: 1, y: 0 };
    this.skillDashT = 0;
    this.skillDashDir = { x: 1, y: 0 };
    this.invulnT = 0;
    this.flashT = 0;
    this.guardT = 0;
    this.knock = { x: 0, y: 0 };
    this.sinceHit = 99;
    this.dead = false;
    this.confuseT = 0;
  }

  get stats() {
    return this.save.stats;
  }

  get attackProgress() {
    if (this.attackT <= 0 || !this.comboStep) return -1;
    return 1 - this.attackT / COMBO[this.comboStep - 1].time;
  }

  get attacking() {
    return this.attackT > 0 && this.comboStep > 0;
  }

  // 공격 시작 (다음 타)
  startSwing(step, aim) {
    this.comboStep = step;
    this.attackT = COMBO[step - 1].time;
    this.hitDone = false;
    this.comboQueued = false;
    if (aim) {
      const len = Math.hypot(aim.x, aim.y) || 1;
      this.facing = { x: aim.x / len, y: aim.y / len };
      if (Math.abs(this.facing.x) > 0.2) this.lastHx = Math.sign(this.facing.x);
    }
  }

  cancelCombo() {
    this.attackT = 0;
    this.comboStep = 0;
    this.comboWindow = 0;
    this.comboQueued = false;
  }

  get invulnerable() {
    return this.invulnT > 0 || this.skillDashT > 0 || this.dead || this.falling;
  }

  // 경험치 추가 → 오른 레벨 수를 돌려줌
  addExp(amount) {
    const s = this.save;
    s.exp += amount;
    let gained = 0;
    while (s.exp >= expToNext(s.level)) {
      s.exp -= expToNext(s.level);
      s.level += 1;
      gained += 1;
      this.applyBaseGrowth();
    }
    return gained;
  }

  applyBaseGrowth() {
    const st = this.stats;
    st.maxHp += BASE_GROWTH.maxHp;
    st.attack += BASE_GROWTH.attack;
    st.defense += BASE_GROWTH.defense;
    st.hp = st.maxHp + 9999; // 가득 채움 (장비 HP 포함 최댓값으로 Game에서 맞춤)
  }

  applyBonus(id) {
    const opt = BONUS_OPTIONS.find((o) => o.id === id);
    if (!opt) return;
    this.stats[id] += opt.amount;
    this.save.bonusStats[id] = (this.save.bonusStats[id] || 0) + opt.amount;
    if (id === 'maxHp') this.stats.hp += opt.amount;
  }

  hurt(dmg, fromX, fromY) {
    if (this.invulnerable) return false;
    this.stats.hp = Math.max(0, this.stats.hp - dmg);
    this.invulnT = 0.7;
    this.flashT = 0.25;
    this.hitT = 0.3;
    this.sinceHit = 0;
    this.cancelCombo();
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.knock = { x: (dx / len) * 280, y: (dy / len) * 280 };
    if (this.stats.hp <= 0) this.dead = true;
    return true;
  }

  revive(x, y, maxHp) {
    this.dead = false;
    this.confuseT = 0;
    this.x = x;
    this.y = y;
    this.stats.hp = maxHp;
    this.invulnT = 2;
    this.knock = { x: 0, y: 0 };
  }

  // 추락 (함정·절벽 같은 장치가 부를 때만): 헛디딤 → 떨어지기 시작 → 추락 → 사라짐(먼지)
  // 추락하는 동안은 이동·공격·회피 입력을 받지 않아요. 끝나면 to(안전한 위치)로 돌아와요.
  // 피해·부활 규칙은 부르는 쪽(기존 규칙)이 정해요 — 여기서는 피해를 주지 않아요.
  startFall({ to = null, dur = 1.1 } = {}) {
    if (this.dead || this.falling) return false;
    this.falling = true;
    this.fallT = 0;
    this.fallDur = dur;
    this.fallTo = to;
    this.moving = false;
    this.attackT = 0;
    this.comboStep = 0;
    this.comboQueued = false;
    this.dodgeT = 0;
    this.skillDashT = 0;
    return true;
  }

  get fallProgress() {
    return this.falling ? Math.min(1, this.fallT / (this.fallDur || 1)) : 0;
  }

  startSkillDash() {
    this.skillDashT = SKILL_DASH_TIME;
    this.skillDashDir = { ...this.facing };
  }

  // 한 프레임 움직임. 일어난 일(공격 등)을 배열로 돌려줌
  update(dt, input, bounds, totals, aimAssist) {
    const events = [];
    this.t += dt;
    this.hitT = Math.max(0, this.hitT - dt);
    this.skillT = Math.max(0, this.skillT - dt);
    this.comboRest = Math.max(0, this.comboRest - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.guardT = Math.max(0, this.guardT - dt);
    this.sinceHit += dt;
    this.confuseT = Math.max(0, this.confuseT - dt);
    if (this.dead) return events;
    if (this.falling) {
      this.moving = false;
      this.fallT += dt;
      if (this.fallT >= this.fallDur) {
        this.falling = false;
        if (this.fallTo) { this.x = this.fallTo.x; this.y = this.fallTo.y; }
        this.invulnT = Math.max(this.invulnT, 0.6);
        events.push({ type: 'fallEnd' });
      }
      return events;
    }

    const ax = input.axis();
    if (this.confuseT > 0) {
      ax.x = -ax.x;
      ax.y = -ax.y;
    }
    const len = Math.hypot(ax.x, ax.y);
    this.moving = len > 0.1;
    if (this.moving && this.skillDashT <= 0 && this.dodgeT <= 0 && !this.attacking) this.facing = { x: ax.x / len, y: ax.y / len };
    if (Math.abs(this.facing.x) > 0.2) this.lastHx = Math.sign(this.facing.x);

    // ---------- 3단 콤보 ----------
    let lungeV = 0;
    if (this.attacking) {
      const c = COMBO[this.comboStep - 1];
      const p = 1 - this.attackT / c.time;
      if (p < 0.55) lungeV = c.lunge * (1 - p / 0.55);
      if (!this.hitDone && p >= c.hitAt) {
        this.hitDone = true;
        events.push({ type: 'attackHit', step: this.comboStep });
      }
      this.attackT -= dt;
      if (this.attackT <= 0) {
        this.attackT = 0;
        if (this.comboStep >= COMBO.length) {
          this.comboRest = c.after || 0.35;
          this.comboStep = 0;
          this.comboWindow = 0;
        } else if (this.comboQueued) {
          const next = this.comboStep + 1;
          this.startSwing(next, this.aimFor(ax, len, aimAssist));
          events.push({ type: 'attackStart', step: next });
        } else {
          this.comboWindow = COMBO_WINDOW;
        }
      }
    } else if (this.comboWindow > 0) {
      this.comboWindow -= dt;
      if (this.comboWindow <= 0) this.comboStep = 0;
    }

    const speed = (totals?.moveSpeed ?? this.stats.moveSpeed) * 60;
    if (this.skillDashT > 0) {
      this.skillDashT -= dt;
      this.x += this.skillDashDir.x * speed * 4.2 * dt;
      this.y += this.skillDashDir.y * speed * 4.2 * dt;
      this.moving = true;
    } else if (this.dodgeT > 0) {
      this.dodgeT -= dt;
      this.x += this.dodgeDir.x * speed * 2.8 * dt;
      this.y += this.dodgeDir.y * speed * 2.8 * dt;
    } else {
      // 공격하는 동안은 천천히 움직이고, 휘두를 때 앞으로 살짝 나가요
      const moveK = this.attacking ? 0.2 : 1;
      this.x += ax.x * speed * moveK * dt + this.facing.x * lungeV * dt;
      this.y += ax.y * speed * moveK * dt + this.facing.y * lungeV * dt;
    }

    // 맞았을 때 밀려남
    this.x += this.knock.x * dt;
    this.y += this.knock.y * dt;
    const f = Math.pow(0.002, dt);
    this.knock.x *= f;
    this.knock.y *= f;

    if (bounds) {
      this.x = clamp(this.x, bounds.x + 24, bounds.x + bounds.w - 24);
      this.y = clamp(this.y, bounds.y + 30, bounds.y + bounds.h - 24);
    }

    if (input.consume('attack') && this.skillDashT <= 0 && this.dodgeT <= 0) {
      if (this.attacking) {
        // 휘두르는 도중 누르면 다음 타 예약 (너무 이르면 무시)
        if (this.comboStep < COMBO.length && this.attackProgress > 0.3) this.comboQueued = true;
      } else if (this.comboRest <= 0) {
        const next = this.comboWindow > 0 && this.comboStep > 0 ? this.comboStep + 1 : 1;
        this.comboWindow = 0;
        this.startSwing(next, this.aimFor(ax, len, aimAssist));
        events.push({ type: 'attackStart', step: next });
      }
    }
    if (input.consume('dodge') && this.dodgeCd <= 0) {
      this.cancelCombo();
      this.dodgeT = DODGE_TIME;
      this.dodgeCd = DODGE_COOLDOWN;
      this.dodgeDir = { ...this.facing };
      this.invulnT = Math.max(this.invulnT, DODGE_TIME + 0.08);
      events.push('dodge');
    }
    if (input.consume('skill1')) events.push('skill1');
    if (input.consume('skill2')) events.push('skill2');
    if (input.consume('skill3')) events.push('skill3');
    if (input.consume('potion')) events.push('potion');
    return events;
  }

  // 공격 방향: 누르고 있는 방향 → 없으면 가까운 몬스터 쪽(조준 도움) → 그것도 없으면 보던 방향
  aimFor(ax, len, aimAssist) {
    if (len > 0.1) return { x: ax.x, y: ax.y };
    const tgt = aimAssist?.(this);
    if (tgt) return { x: tgt.x - this.x, y: tgt.y - this.y };
    return null;
  }
}
