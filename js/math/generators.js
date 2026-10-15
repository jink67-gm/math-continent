// =====================================================
// 숫자를 바꿔 자동으로 만드는 문제
// =====================================================
// 학생이 같은 문제를 반복해서 보지 않도록, 같은 유형을 숫자만 바꿔 만들어 냅니다.
// 각 생성기: { key, difficulty: [가능한 난이도], make(ctx) → 문제 }
// ctx.piValue: 교사가 설정한 원주율 (3 또는 3.14)

import { Fraction, rawFrac } from './Fraction.js';
import { randInt, pick, shuffle, gcd, fmtNum } from '../core/utils.js';
import { unitGenerators } from './unitGenerators.js';

// 정답 + 오답 후보로 보기 4개 만들기 (겹치지 않게)
function buildChoices(correct, wrongs, filler) {
  const set = new Set([correct]);
  for (const w of wrongs) {
    if (set.size >= 4) break;
    if (w && w !== correct) set.add(w);
  }
  let guard = 0;
  while (set.size < 4 && guard++ < 50) {
    const f = filler();
    if (f && f !== correct) set.add(f);
  }
  return shuffle([...set]);
}

function coprimePair(minD, maxD) {
  for (let i = 0; i < 50; i++) {
    const d = randInt(minD, maxD);
    const n = randInt(1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
  return [1, 2];
}

const randomFracMarkup = () => {
  const [n, d] = coprimePair(2, 9);
  return new Fraction(n * randInt(1, 3), d).toMarkup();
};

// ---------------------------------------------------
// 분수의 나눗셈
// ---------------------------------------------------
const fractionDivision = [
  {
    key: 'sameDen',
    difficulty: [1],
    make() {
      const b = randInt(1, 3);
      const k = randInt(2, 4);
      const a = b * k;
      const den = randInt(a + 1, a + 6);
      return {
        id: `fd-g-sd-${a}-${b}-${den}`,
        type: 'input',
        topic: '분모가 같은 분수의 나눗셈',
        question: `${rawFrac(a, den)} ÷ ${rawFrac(b, den)} = □`,
        answer: String(k),
        explanation: `분모가 같으면 분자끼리 나누어요.\n${rawFrac(a, den)} ÷ ${rawFrac(b, den)} = ${a} ÷ ${b} = ${k}`,
        hint: '분모가 같을 때는 분자끼리 나누면 돼요.',
      };
    },
  },
  {
    key: 'natByFrac',
    difficulty: [1, 2],
    make() {
      const [p, q] = (() => {
        for (let i = 0; i < 50; i++) {
          const q2 = randInt(3, 9);
          const p2 = randInt(2, q2 - 1);
          if (gcd(p2, q2) === 1) return [p2, q2];
        }
        return [2, 3];
      })();
      const m = randInt(2, 5);
      const n = p * m;
      const ans = m * q;
      return {
        id: `fd-g-nf-${n}-${p}-${q}`,
        type: 'input',
        topic: '(자연수) ÷ (분수)',
        question: `${n} ÷ ${rawFrac(p, q)} = □`,
        answer: String(ans),
        explanation: `${n} ÷ ${rawFrac(p, q)} = (${n} ÷ ${p}) × ${q} = ${ans}`,
        hint: `${n}을(를) ${p}로 나눈 뒤 ${q}를 곱해 보세요.`,
      };
    },
  },
  {
    key: 'diffDen',
    difficulty: [2],
    make() {
      let a, b, c, d;
      do {
        [a, b] = coprimePair(2, 9);
        [c, d] = coprimePair(2, 9);
      } while (b === d);
      const A = new Fraction(a, b);
      const C = new Fraction(c, d);
      const ans = A.div(C);
      const rawN = a * d;
      const rawD = b * c;
      const correct = ans.toMarkup();
      const middle = rawFrac(rawN, rawD);
      const simplified = ` = ${middle}${correct !== middle ? ` = ${correct}` : ''}`;
      return {
        id: `fd-g-dd-${a}-${b}-${c}-${d}`,
        type: 'choice',
        topic: '(분수) ÷ (분수)',
        question: `${rawFrac(a, b)} ÷ ${rawFrac(c, d)} 의 값은?`,
        choices: buildChoices(correct, [
          A.mul(C).toMarkup(), // 나누지 않고 곱한 실수
          ans.inv().toMarkup(), // 거꾸로 뒤집은 실수
          ans.add(new Fraction(1, ans.d)).toMarkup(),
        ], randomFracMarkup),
        answer: correct,
        explanation: `나누는 분수의 분모와 분자를 바꾸어 곱해요.\n${rawFrac(a, b)} × ${rawFrac(d, c)}${simplified}`,
        hint: `÷ ${rawFrac(c, d)} 를 × ${rawFrac(d, c)} 로 바꿔 보세요.`,
      };
    },
  },
  {
    key: 'wordShare',
    difficulty: [3],
    make() {
      const scenes = [
        { thing: '리본', unit: 'm', obj: '를', each: '씩 자르면', ask: '몇 도막이 될까요?', suffix: '도막' },
        { thing: '우유', unit: 'L', obj: '를', each: '씩 컵에 따르면', ask: '몇 컵이 될까요?', suffix: '컵' },
        { thing: '밀가루', unit: 'kg', obj: '을', each: '씩 봉지에 담으면', ask: '몇 봉지가 될까요?', suffix: '봉지' },
        { thing: '물약', unit: 'L', obj: '를', each: '씩 병에 나누면', ask: '몇 병이 될까요?', suffix: '병' },
      ];
      const s = pick(scenes);
      const n = randInt(2, 6);
      const j = randInt(2, 4);
      const k = n * j;
      let m = randInt(1, n - 1);
      while (gcd(m, n) !== 1) m = randInt(1, n - 1);
      const ans = m * j;
      return {
        id: `fd-g-ws-${s.suffix}-${m}-${n}-${k}`,
        type: 'input',
        suffix: s.suffix,
        topic: '생활 속 분수의 나눗셈',
        question: `${s.thing} ${rawFrac(m, n)} ${s.unit}${s.obj} ${rawFrac(1, k)} ${s.unit}${s.each}\n${s.ask}`,
        answer: String(ans),
        explanation: `${rawFrac(m, n)} ÷ ${rawFrac(1, k)} = ${rawFrac(ans, k)} ÷ ${rawFrac(1, k)} = ${ans} (${s.suffix})`,
        hint: `분모를 ${k}로 같게 만들어 보세요.`,
      };
    },
  },
];

// ---------------------------------------------------
// 원의 둘레와 넓이 — 원주율 안내 문구를 반드시 포함
// ---------------------------------------------------
const piNote = (pi) => (pi === 3 ? '(원주율은 3으로 계산하세요.)' : '(원주율은 3.14로 계산하세요.)');

const circle = [
  {
    key: 'circumferenceFromDiameter',
    difficulty: [1],
    make({ piValue }) {
      const d = pick([4, 6, 8, 10, 12, 14, 16, 20]);
      const ans = fmtNum(d * piValue);
      return {
        id: `ci-g-cd-${d}-${piValue}`, type: 'input', suffix: 'cm', piValue,
        topic: '원주 구하기',
        question: `지름이 ${d} cm인 원의 원주는 몇 cm일까요?\n${piNote(piValue)}`,
        answer: ans,
        explanation: `(원주) = (지름) × (원주율)\n${d} × ${piValue} = ${ans} (cm)`,
        hint: '(원주) = (지름) × (원주율)',
      };
    },
  },
  {
    key: 'circumferenceFromRadius',
    difficulty: [2],
    make({ piValue }) {
      const r = randInt(2, 10);
      const ans = fmtNum(r * 2 * piValue);
      return {
        id: `ci-g-cr-${r}-${piValue}`, type: 'input', suffix: 'cm', piValue,
        topic: '원주 구하기',
        question: `반지름이 ${r} cm인 원의 원주는 몇 cm일까요?\n${piNote(piValue)}`,
        answer: ans,
        explanation: `지름 = ${r} × 2 = ${r * 2} (cm)\n${r * 2} × ${piValue} = ${ans} (cm)`,
        hint: '반지름을 2배 하면 지름이에요.',
      };
    },
  },
  {
    key: 'areaFromRadius',
    difficulty: [2],
    make({ piValue }) {
      const r = randInt(2, 10);
      const ans = fmtNum(r * r * piValue);
      return {
        id: `ci-g-ar-${r}-${piValue}`, type: 'input', suffix: 'cm²', piValue,
        topic: '원의 넓이',
        question: `반지름이 ${r} cm인 원의 넓이는 몇 cm²일까요?\n${piNote(piValue)}`,
        answer: ans,
        explanation: `(원의 넓이) = (반지름) × (반지름) × (원주율)\n${r} × ${r} × ${piValue} = ${ans} (cm²)`,
        hint: '(원의 넓이) = (반지름) × (반지름) × (원주율)',
      };
    },
  },
  {
    key: 'diameterFromCircumference',
    difficulty: [3],
    make({ piValue }) {
      const d = pick([5, 6, 8, 10, 12, 15, 20]);
      const c = fmtNum(d * piValue);
      return {
        id: `ci-g-dc-${d}-${piValue}`, type: 'input', suffix: 'cm', piValue,
        topic: '원주로 지름 구하기',
        question: `원주가 ${c} cm인 원 모양 접시가 있어요.\n이 접시의 지름은 몇 cm일까요?\n${piNote(piValue)}`,
        answer: String(d),
        explanation: `(지름) = (원주) ÷ (원주율)\n${c} ÷ ${piValue} = ${d} (cm)`,
        hint: '(원주) = (지름) × (원주율) 이므로 거꾸로 나누어요.',
      };
    },
  },
];

export const generators = {
  fractionDivision,
  spatial: unitGenerators.spatial,
  decimalDivision: unitGenerators.decimalDivision,
  proportion: unitGenerators.proportion,
  circle: [...circle, ...unitGenerators.circleMore],
  solids: unitGenerators.solids,
};
