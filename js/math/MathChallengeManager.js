// 수학 도전 관리
// - 상황(레벨업, 스킬, 강화, 보스...)에 맞는 문제를 골라 띄움
// - 최근에 낸 문제는 피함 (recentQuestionIds)
// - 정답/오답 기록, 풀이 기록(mathLogs) 남김
//
// 사용 예:
//   const result = await game.math.start({ context: 'forge', allowLater: true });
//   if (result.correct) { ...강화 성공... }

import { questions } from './questionBank.js';
import { generators } from './generators.js';
import { UNITS } from '../data/units.js';
import { OVERLAYS } from '../core/GameState.js';
import { pick, shuffle } from '../core/utils.js';
import { MathChallengeUI } from '../ui/MathChallengeUI.js';

export const CHALLENGE_CONTEXTS = {
  levelup: { title: '성장 시험', icon: '⭐', npcLine: '더 강해질 준비가 되었나요? 수학의 룬을 풀면 보너스 능력을 고를 수 있어요!', successText: '보너스 고르기' },
  skill: { title: '스킬의 룬', icon: '✨', npcLine: '이 기술을 배우려면 수학의 룬을 활성화해야 해!', successText: '스킬 배우기' },
  forge: { title: '대장간 강화 시험', icon: '🔨', npcLine: '이 문제를 풀면 망치에 힘이 실린다네!', successText: '강화하기' },
  chest: { title: '보물상자의 봉인', icon: '🎁', npcLine: '상자에 수학의 자물쇠가 걸려 있어요.', successText: '상자 열기' },
  quest: { title: '마을의 수수께끼', icon: '📜', npcLine: '고대 장치를 움직이려면 이 문제를 풀어야 해요.', successText: '장치 가동' },
  boss: { title: '수학의 봉인', icon: '🛡️', npcLine: '보스가 보호막을 펼쳤다! 봉인을 풀어 보호막을 깨뜨리자!', successText: '보호막 파괴!' },
  classUp: { title: '승급 시험', icon: '👑', npcLine: '새로운 힘을 깨울 시간이에요.', successText: '승급하기' },
  test: { title: '문제 테스트', icon: '🧪', npcLine: '', successText: '닫기' },
};

export const DIFFICULTY_LABELS = { 1: '기본', 2: '도전', 3: '응용', 4: '핵심' };

// 입력한 답이 맞는지 확인
export function checkAnswer(q, given) {
  if (q.type === 'choice') return given === q.answer;
  const norm = (s) => String(s ?? '').replace(/\s+/g, '').replace(/,/g, '');
  let a = norm(given);
  const b = norm(q.answer);
  const suffix = norm(q.suffix);
  if (suffix && a.endsWith(suffix)) a = a.slice(0, -suffix.length);
  if (a === '') return false;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return Math.abs(na - nb) < 1e-9;
  return a === b;
}

export class MathChallengeManager {
  constructor(game) {
    this.game = game;
    this.ui = new MathChallengeUI();
    this.active = false;
  }

  get save() {
    return this.game.save;
  }

  get piValue() {
    return this.game.getEffectiveSettings().piValue;
  }

  // 학생 레벨과 마을 진행도에 따라 난이도 결정
  difficultyFor(context) {
    if (context === 'boss' || context === 'classUp') return 4;
    const lv = this.save?.level || 1;
    const cleared = this.save?.bossesDefeated?.length || 0;
    let d = lv <= 3 ? 1 : lv <= 7 ? 2 : 3;
    if (cleared >= 3) d = Math.max(d, 2);
    return d;
  }

  normalize(q, unit, difficulty) {
    return { type: 'choice', hint: '', image: null, ...q, unit, difficulty: q.difficulty || difficulty };
  }

  // 해당 단원·난이도의 후보 문제 (고정 문제 + 자동 생성 문제)
  buildPool(unit, difficulty) {
    const fixed = (questions[unit] || []).filter((q) => q.difficulty === difficulty);
    const made = [];
    for (const gen of generators[unit] || []) {
      if (!gen.difficulty.includes(difficulty)) continue;
      for (let i = 0; i < 3; i++) {
        try {
          made.push(this.normalize(gen.make({ piValue: this.piValue }), unit, difficulty));
        } catch (e) {
          console.error('[Math] 문제 생성 오류', gen.key, e);
        }
      }
    }
    return [...fixed, ...made];
  }

  pickQuestion(unit, difficulty, excludeIds = []) {
    const recent = new Set([...(this.save?.recentQuestionIds || []), ...excludeIds]);
    // 원하는 난이도부터 한 단계씩 내려가며 "최근에 안 본" 문제 찾기
    for (let d = difficulty; d >= 1; d--) {
      const fresh = this.buildPool(unit, d).filter((q) => !recent.has(q.id));
      if (fresh.length) return this.prepare(pick(fresh));
    }
    // 모두 최근에 봤다면 어쩔 수 없이 다시 출제 (지금 문제만 빼고)
    const any = [1, 2, 3, 4].flatMap((d) => this.buildPool(unit, d)).filter((q) => !excludeIds.includes(q.id));
    return any.length ? this.prepare(pick(any)) : null;
  }

  prepare(q) {
    return { ...q, choices: q.choices ? shuffle(q.choices) : undefined };
  }

  /**
   * 수학 도전 시작
   * @param {object} opts
   *   context: 'levelup' | 'skill' | 'forge' | 'chest' | 'quest' | 'boss' | 'classUp' | 'test'
   *   unit: 단원 (생략하면 현재 마을 단원)
   *   difficulty: 1~4 (생략하면 자동)
   *   allowLater: '나중에 도전하기' 버튼 표시
   *   title, npcLine, successText: 문구 바꾸기
   * @returns {Promise<{correct:boolean, deferred?:boolean, attempts?:number, question?:object}>}
   */
  async start(opts = {}) {
    if (this.active) return { correct: false, busy: true };
    const context = opts.context || 'test';
    const info = { ...CHALLENGE_CONTEXTS[context], ...pickDefined(opts, ['title', 'npcLine', 'successText', 'icon']) };
    let unit = opts.unit || this.game.currentUnit;
    // 혼돈의 첨탑: 6개 단원 중에서 골고루
    if (unit === 'mixed') unit = pick(Object.keys(UNITS));
    const difficulty = opts.difficulty || this.difficultyFor(context);

    const first = this.pickQuestion(unit, difficulty);
    if (!first) {
      // 문제가 하나도 없으면 진행을 막지 않음
      console.warn('[Math] 출제할 문제가 없어 통과 처리합니다:', unit);
      return { correct: true, skipped: true };
    }

    this.active = true;
    this.game.state.push(OVERLAYS.MATH_CHALLENGE);
    try {
      this.game.audio.playSfx('mathOpen');
      return await this.ui.run({
        question: first,
        info,
        unitName: UNITS[unit]?.name || unit,
        difficultyLabel: (q) => DIFFICULTY_LABELS[q.difficulty] || '',
        allowLater: !!opts.allowLater,
        waitSec: this.game.config.wrongAnswerWaitSec,
        check: checkAnswer,
        onAttempt: (q, correct) => this.recordAttempt(q, correct),
        onQuestionDone: (q, solved, attemptCount) => this.finishQuestion(q, solved, attemptCount, context),
        requestSwap: (q) => this.pickQuestion(unit, Math.max(1, q.difficulty - 1), [q.id]),
        sfx: (key) => this.game.audio.playSfx(key),
      });
    } finally {
      this.active = false;
      this.game.state.pop(OVERLAYS.MATH_CHALLENGE);
      this.game.input.clearPressed();
    }
  }

  recordAttempt(q, correct) {
    const s = this.save;
    if (!s) return;
    const up = (s.mathProgress[q.unit] ||= { correct: 0, wrong: 0, solved: 0, streak: 0 });
    if (correct) {
      s.correctAnswers += 1;
      up.correct += 1;
      up.solved += 1;
      up.streak += 1;
      s.currentStreak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    } else {
      s.wrongAnswers += 1;
      up.wrong += 1;
      up.streak = 0;
      s.currentStreak = 0;
    }
    this.game.bus.emit('math:attempt', { question: q, correct });
  }

  finishQuestion(q, solved, attemptCount, context) {
    const s = this.save;
    if (!s) return;
    const limit = this.game.config.recentQuestionLimit;
    s.recentQuestionIds = [q.id, ...s.recentQuestionIds.filter((id) => id !== q.id)].slice(0, limit);
    this.game.saveManager.addMathLog({
      unit: q.unit,
      questionId: q.id,
      correct: solved,
      firstTry: solved && attemptCount === 1,
      attemptCount,
      difficulty: q.difficulty,
      context,
      timestamp: Date.now(),
    });
    this.game.markDirty('math', { immediate: solved });
  }
}

function pickDefined(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
