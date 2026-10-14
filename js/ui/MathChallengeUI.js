// 수학 도전 창
// 오답 규칙:
//   1번 틀림 → "정답이 아니에요." + 5초 카운트다운(그동안 제출 불가) + 힌트 표시
//   3번 틀림 → 같은 개념의 더 쉬운 문제로 교체
//   맞힘     → "정답입니다!" + 짧은 풀이

import { formatMath } from '../math/mathFormat.js';
import { escapeHtml } from '../core/utils.js';

export class MathChallengeUI {
  constructor() {
    this.layer = document.getElementById('overlay-layer');
  }

  run(o) {
    return new Promise((resolve) => {
      const root = document.createElement('div');
      root.className = 'modal-backdrop math-backdrop';
      this.layer.appendChild(root);

      let q = o.question;
      let wrongCount = 0;
      let attempts = 0;
      let totalAttempts = 0;
      let locked = false;
      let solved = false;
      let timer = null;

      const $ = (sel) => root.querySelector(sel);

      const close = (result) => {
        clearInterval(timer);
        document.removeEventListener('keydown', onKey, true);
        root.classList.add('closing');
        setTimeout(() => root.remove(), 160);
        resolve(result);
      };

      const render = () => {
        this.currentQuestion = q; // 개발자 도구에서 확인용
        const answerArea = q.type === 'choice'
          ? `<div class="math-choices ${q.choiceImages ? 'img-choices' : ''}">${q.choices.map((c, i) => `
              <button class="choice-btn" type="button" data-i="${i}">
                <span class="choice-no">${i + 1}</span><span class="choice-text">${q.choiceImages ? q.choiceImages[c] : formatMath(c)}</span>
              </button>`).join('')}</div>`
          : `<form class="math-input-row" autocomplete="off">
              <input class="math-input" type="text" inputmode="decimal" enterkeyhint="done"
                     aria-label="답 입력" placeholder="답" maxlength="12">
              ${q.suffix ? `<span class="math-suffix">${escapeHtml(q.suffix)}</span>` : ''}
              <button class="btn btn-primary math-submit" type="submit">제출</button>
            </form>`;

        root.innerHTML = `
          <div class="modal math-card" role="dialog" aria-modal="true" aria-labelledby="mc-title">
            <div class="math-head">
              <div class="math-rune">${o.info.icon || '✨'}</div>
              <div class="math-head-text">
                <div class="math-title" id="mc-title">${escapeHtml(o.info.title)}</div>
                <div class="math-unit">${escapeHtml(o.unitName)} · ${escapeHtml(o.difficultyLabel(q))}</div>
              </div>
            </div>
            ${o.info.npcLine ? `<div class="math-npc">${escapeHtml(o.info.npcLine)}</div>` : ''}
            <div class="math-question">${q.image ? `<div class="math-figure">${q.image}</div>` : ''}${formatMath(q.question)}</div>
            <div class="math-answer">${answerArea}</div>
            <div class="math-feedback" aria-live="polite"></div>
            <div class="math-hint ${wrongCount > 0 && q.hint ? '' : 'hidden'}">💡 ${formatMath(q.hint || '')}</div>
            ${o.allowLater ? '<div class="math-foot"><button class="btn btn-ghost btn-small" type="button" data-later>나중에 도전하기</button></div>' : ''}
          </div>`;

        root.querySelectorAll('.choice-btn').forEach((btn) => {
          btn.addEventListener('click', () => submit(q.choices[Number(btn.dataset.i)], btn));
        });
        const form = $('.math-input-row');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = $('.math-input');
            if (!input.value.trim()) {
              input.focus();
              return;
            }
            submit(input.value, null);
          });
          setTimeout(() => $('.math-input')?.focus(), 60);
        }
        $('[data-later]')?.addEventListener('click', () => {
          if (attempts > 0 && !solved) o.onQuestionDone(q, false, attempts);
          close({ correct: false, deferred: true, attempts: totalAttempts });
        });
      };

      const setLocked = (on) => {
        locked = on;
        root.querySelectorAll('.choice-btn').forEach((b) => {
          b.disabled = on || b.classList.contains('wrong');
        });
        const input = $('.math-input');
        const btn = $('.math-submit');
        if (input) input.disabled = on;
        if (btn) btn.disabled = on;
      };

      const submit = (value, btn) => {
        if (locked || solved) return;
        attempts += 1;
        totalAttempts += 1;
        const correct = o.check(q, value);
        o.onAttempt(q, correct);
        if (correct) {
          showCorrect(btn);
        } else {
          showWrong(btn);
        }
      };

      const showCorrect = (btn) => {
        solved = true;
        locked = true;
        o.sfx('correct');
        btn?.classList.add('right');
        o.onQuestionDone(q, true, attempts);
        $('.math-hint')?.classList.add('hidden');
        $('.math-feedback').innerHTML = '';
        $('.math-answer').innerHTML = `
          <div class="math-result">
            <div class="result-title">정답입니다! 🎉</div>
            <div class="result-expl">${formatMath(q.explanation || '')}</div>
            <button class="btn btn-primary btn-big" type="button" data-continue>${escapeHtml(o.info.successText || '계속하기')}</button>
          </div>`;
        $('[data-later]')?.remove();
        const cont = $('[data-continue]');
        cont.addEventListener('click', () => close({ correct: true, attempts: totalAttempts, question: q }));
        setTimeout(() => cont.focus(), 60);
      };

      const showWrong = (btn) => {
        o.sfx('wrong');
        wrongCount += 1;
        if (btn) btn.classList.add('wrong');
        const card = $('.math-card');
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');

        const willSwap = wrongCount >= 3;
        if (q.hint) $('.math-hint').classList.remove('hidden');
        setLocked(true);

        let left = o.waitSec;
        const fb = $('.math-feedback');
        const paint = () => {
          fb.innerHTML = `
            <div class="wrong-msg">정답이 아니에요.</div>
            <div class="wait-msg">${willSwap ? '새로운 문제로 바꿔 줄게요! ' : ''}${left}초 후 다시 도전할 수 있습니다.</div>
            <div class="countdown" aria-hidden="true">${left}</div>`;
        };
        paint();
        clearInterval(timer);
        timer = setInterval(() => {
          left -= 1;
          if (left > 0) {
            paint();
            return;
          }
          clearInterval(timer);
          fb.innerHTML = '';
          if (willSwap) {
            o.onQuestionDone(q, false, attempts);
            const next = o.requestSwap(q);
            if (next) q = next;
            wrongCount = 0;
            attempts = 0;
            locked = false;
            render();
            return;
          }
          setLocked(false);
          o.sfx?.('mathRetry');
          const input = $('.math-input');
          if (input) {
            input.value = '';
            input.focus();
          }
        }, 1000);
      };

      // 키보드: 1~4로 보기 선택, 정답 화면에서 Enter로 계속
      const onKey = (e) => {
        if (solved && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          $('[data-continue]')?.click();
          return;
        }
        if (locked || q.type !== 'choice') return;
        const n = Number(e.key);
        if (n >= 1 && n <= q.choices.length) {
          const b = root.querySelector(`.choice-btn[data-i="${n - 1}"]`);
          if (b && !b.disabled) b.click();
        }
      };
      document.addEventListener('keydown', onKey, true);

      render();
    });
  }
}
