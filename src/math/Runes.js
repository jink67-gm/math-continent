// 수학 룬: 문제를 골라 룬 창을 띄우고, 결과를 기록해요.
//
//   const res = await game.runes.start({ context: 'quest', unit: 'fractionDivision' });
//   if (res.correct) { ... 다리가 이어져요 ... }
//
// 오답 규칙 (기획안):
//   틀리면 → 「정답이 아니에요」 + 5초 기다린 뒤 다시 도전, 힌트 보여 주기
//   3번 틀리면 → 같은 단원의 더 쉬운 문제로 바꿔요. 재료·골드는 잃지 않아요.
//   맞히면 → 풀이를 보여 주고 룬이 빛나요.
// 최근 30문제는 다시 내지 않아요.

import { questions } from './questionBank.js';
import { generators } from './generators.js';
import { formatMath } from './mathFormat.js';
import { escapeHtml, pick, shuffle } from './util.js';

export const UNITS = {
  fractionDivision: '분수의 나눗셈',
  spatial: '공간과 입체',
  decimalDivision: '소수의 나눗셈',
  proportion: '비례식과 비례배분',
  circle: '원의 넓이',
  solids: '원기둥, 원뿔, 구',
};

const CONTEXTS = {
  quest: { title: '고대의 룬', icon: '📜', line: '룬에 새겨진 문제를 풀면 장치가 움직여요.', ok: '룬 깨우기' },
  levelup: { title: '성장 시험', icon: '⭐', line: '룬을 풀면 보너스 능력을 받을 수 있어요!', ok: '보너스 고르기' },
  skill: { title: '스킬의 룬', icon: '✨', line: '이 기술을 배우려면 룬을 깨워야 한단다.', ok: '스킬 배우기' },
  forge: { title: '대장간 강화 시험', icon: '🔨', line: '이 문제를 풀면 망치에 힘이 실린다네!', ok: '강화하기' },
  chest: { title: '황금 수학 상자', icon: '🎁', line: '상자에 수학의 자물쇠가 걸려 있어요.', ok: '상자 열기' },
  boss: { title: '수학의 봉인', icon: '🛡️', line: '보스가 보호막을 펼쳤어요! 봉인을 풀어 보호막을 깨뜨려요!', ok: '보호막 깨기!' },
  coop: { title: '협동 룬', icon: '🤝', line: '두 개의 룬을 모두 깨워야 문이 열려요.', ok: '룬 깨우기' },
};

const LEVEL_NAMES = { 1: '기본', 2: '도전', 3: '응용', 4: '핵심' };
const WAIT_SEC = 5;
const RECENT = 30;

// 입력한 답이 맞는지 (빈칸·쉼표·단위 무시, 숫자는 값으로 비교)
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

export class Runes {
  constructor(game) {
    this.game = game;
    this.open = false;
  }

  get stats() { return this.game.registry.get('player'); }
  get piValue() { return this.game.classCfg?.piValue === 3 ? 3 : 3.14; }

  // 레벨이 오를수록 조금씩 어려워져요 (보스는 핵심 문제)
  difficultyFor(context) {
    if (context === 'boss') return 4;
    const lv = this.stats?.lv || 1;
    return lv <= 3 ? 1 : lv <= 7 ? 2 : 3;
  }

  buildPool(unit, d) {
    const fixed = (questions[unit] || []).filter((q) => q.difficulty === d).map((q) => ({ type: 'choice', ...q, unit }));
    const made = [];
    for (const gen of generators[unit] || []) {
      if (!gen.difficulty.includes(d)) continue;
      for (let i = 0; i < 3; i++) {
        try { made.push({ type: 'choice', hint: '', ...gen.make({ piValue: this.piValue }), unit, difficulty: d }); } catch (e) { console.warn('[룬] 문제 만들기 실패', gen.key, e); }
      }
    }
    return [...fixed, ...made];
  }

  pickQuestion(unit, difficulty, exclude = []) {
    const recent = new Set([...(this.stats?.recentQ || []), ...exclude]);
    for (let d = difficulty; d >= 1; d--) {
      const fresh = this.buildPool(unit, d).filter((q) => !recent.has(q.id));
      if (fresh.length) return this.prepare(pick(fresh));
    }
    const any = [1, 2, 3, 4].flatMap((d) => this.buildPool(unit, d)).filter((q) => !exclude.includes(q.id));
    return any.length ? this.prepare(pick(any)) : null;
  }

  prepare(q) {
    return { ...q, choices: q.choices ? shuffle(q.choices) : undefined };
  }

  // 결과: { correct, deferred }
  async start(opts = {}) {
    if (this.open) return { correct: false, busy: true };
    const context = opts.context || 'quest';
    const info = { ...CONTEXTS[context], ...opts };
    const unit = opts.unit || 'fractionDivision';
    const q = this.pickQuestion(unit, opts.difficulty || this.difficultyFor(context));
    if (!q) return { correct: true, skipped: true }; // 문제가 없으면 막지 않아요
    this.open = true;
    const kb = this.game.input.keyboard;
    if (kb) kb.enabled = false; // 답을 쓰는 동안 게임 키가 먹지 않게
    this.play('sfx_math_open');
    try {
      return await this.run(q, info, unit, context);
    } finally {
      this.open = false;
      if (kb) { kb.enabled = true; kb.resetKeys?.(); }
    }
  }

  play(key) {
    try { this.game.sound.play(key, { volume: 0.45 }); } catch { /* 소리 없어도 괜찮아요 */ }
  }

  record(q, correct) {
    const s = this.stats;
    if (!s) return;
    s.math ??= {};
    const u = (s.math[q.unit] ||= { c: 0, w: 0 });
    if (correct) u.c++; else u.w++;
  }

  finish(q, solved, tries, context) {
    const s = this.stats;
    if (!s) return;
    s.recentQ = [q.id, ...(s.recentQ || []).filter((id) => id !== q.id)].slice(0, RECENT);
    this.game.saves.addMathLog?.({
      unit: q.unit, questionId: q.id, correct: solved, firstTry: solved && tries === 1,
      attemptCount: tries, difficulty: q.difficulty, context, timestamp: Date.now(),
    });
  }

  // ── 창 ────────────────────────────────────────
  run(first, info, unit, context) {
    return new Promise((resolve) => {
      const root = document.createElement('div');
      root.className = 'rune-backdrop';
      document.body.appendChild(root);
      let q = first;
      let wrong = 0;
      let tries = 0;
      let locked = false;
      let solved = false;
      let timer = null;
      const $ = (sel) => root.querySelector(sel);
      window.currentRuneQuestion = q; // 점검용

      const close = (result) => {
        clearInterval(timer);
        root.removeEventListener('keydown', onKey);
        document.removeEventListener('keydown', onDocKey, true);
        root.classList.add('closing');
        setTimeout(() => root.remove(), 160);
        resolve(result);
      };

      const render = () => {
        window.currentRuneQuestion = q;
        const answer = q.type === 'choice'
          ? `<div class="rune-choices ${q.choiceImages ? 'img-choices' : ''}">${q.choices.map((c, i) => `
              <button class="rune-choice" type="button" data-i="${i}"><span class="no">${i + 1}</span>
              <span class="txt">${q.choiceImages ? q.choiceImages[c] : formatMath(c)}</span></button>`).join('')}</div>`
          : `<form class="rune-input-row" autocomplete="off">
              <input class="rune-input" type="text" inputmode="decimal" enterkeyhint="done" aria-label="답 입력" placeholder="답" maxlength="12">
              ${q.suffix ? `<span class="rune-suffix">${escapeHtml(q.suffix)}</span>` : ''}
              <button class="rune-btn" type="submit">제출</button></form>`;
        root.innerHTML = `
          <div class="rune-card" role="dialog" aria-modal="true" aria-labelledby="rune-title">
            <div class="rune-head">
              <div class="rune-stone">${info.icon || '✨'}</div>
              <div><div class="rune-title" id="rune-title">${escapeHtml(info.title)}</div>
              <div class="rune-unit">${escapeHtml(UNITS[unit] || unit)} · ${LEVEL_NAMES[q.difficulty] || ''}</div></div>
            </div>
            ${info.line ? `<div class="rune-npc">${escapeHtml(info.line)}</div>` : ''}
            <div class="rune-question">${q.image ? `<div class="rune-figure">${q.image}</div>` : ''}${formatMath(q.question)}</div>
            <div class="rune-answer">${answer}</div>
            <div class="rune-feedback" aria-live="polite"></div>
            <div class="rune-hint" ${wrong > 0 && q.hint ? '' : 'hidden'}>💡 ${formatMath(q.hint || '')}</div>
            ${info.allowLater ? '<div class="rune-foot"><button class="rune-btn ghost" type="button" data-later>나중에 하기</button></div>' : ''}
          </div>`;
        root.querySelectorAll('.rune-choice').forEach((b) => b.addEventListener('click', () => submit(q.choices[Number(b.dataset.i)], b)));
        const form = $('.rune-input-row');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = $('.rune-input');
            if (!input.value.trim()) { input.focus(); return; }
            submit(input.value, null);
          });
          setTimeout(() => $('.rune-input')?.focus(), 60);
        }
        $('[data-later]')?.addEventListener('click', () => {
          if (tries > 0 && !solved) this.finish(q, false, tries, context);
          close({ correct: false, deferred: true });
        });
      };

      const setLocked = (on) => {
        locked = on;
        root.querySelectorAll('.rune-choice').forEach((b) => { b.disabled = on || b.classList.contains('wrong'); });
        const input = $('.rune-input');
        if (input) input.disabled = on;
        const btn = $('.rune-input-row .rune-btn');
        if (btn) btn.disabled = on;
      };

      const submit = (value, btn) => {
        if (locked || solved) return;
        tries++;
        const ok = checkAnswer(q, value);
        this.record(q, ok);
        if (ok) showCorrect(btn); else showWrong(btn);
      };

      const showCorrect = (btn) => {
        solved = true;
        locked = true;
        this.play('sfx_math_correct');
        btn?.classList.add('right');
        this.finish(q, true, tries, context);
        $('.rune-hint').hidden = true;
        $('.rune-feedback').innerHTML = '';
        $('.rune-card').classList.add('glow');
        $('.rune-answer').innerHTML = `<div class="rune-result"><div class="ok">✦ 정답이에요! ✦</div>
          <div class="expl">${formatMath(q.explanation || '')}</div>
          <button class="rune-btn" type="button" data-continue>${escapeHtml(info.ok || '계속하기')}</button></div>`;
        $('[data-later]')?.remove();
        const cont = $('[data-continue]');
        cont.addEventListener('click', () => close({ correct: true, question: q }));
        setTimeout(() => cont.focus(), 60);
      };

      const showWrong = (btn) => {
        this.play('sfx_math_wrong');
        wrong++;
        btn?.classList.add('wrong');
        const card = $('.rune-card');
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
        const swap = wrong >= 3;
        if (q.hint) $('.rune-hint').hidden = false;
        setLocked(true);
        let left = WAIT_SEC;
        const fb = $('.rune-feedback');
        const paint = () => {
          fb.innerHTML = `<div class="wrong">정답이 아니에요.</div><div class="wait">${swap ? '조금 더 쉬운 문제로 바꿔 줄게요. ' : ''}${left}초 뒤에 다시 도전할 수 있어요.</div>`;
        };
        paint();
        clearInterval(timer);
        timer = setInterval(() => {
          left--;
          if (left > 0) { paint(); return; }
          clearInterval(timer);
          fb.innerHTML = '';
          if (swap) {
            this.finish(q, false, tries, context);
            const next = this.pickQuestion(unit, Math.max(1, (q.difficulty || 1) - 1), [q.id]);
            if (next) q = next;
            wrong = 0;
            tries = 0;
            locked = false;
            render();
            return;
          }
          setLocked(false);
          this.play('sfx_math_retry');
          const input = $('.rune-input');
          if (input) { input.value = ''; input.focus(); }
        }, 1000);
      };

      // 1~4로 보기 고르기, 정답 화면에서 Enter로 계속 (게임 키로 새지 않게 여기서 멈춰요)
      const onKey = (e) => {
        e.stopPropagation();
        if (solved && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('[data-continue]')?.click(); return; }
        if (locked || q.type !== 'choice') return;
        const n = Number(e.key);
        if (n >= 1 && n <= q.choices.length) {
          const b = root.querySelector(`.rune-choice[data-i="${n - 1}"]`);
          if (b && !b.disabled) b.click();
        }
      };
      // 포커스가 창 밖(게임 화면)에 있을 때도 숫자키가 먹게
      const onDocKey = (e) => { if (!root.contains(e.target)) onKey(e); };
      root.addEventListener('keydown', onKey);
      document.addEventListener('keydown', onDocKey, true);
      render();
    });
  }
}
