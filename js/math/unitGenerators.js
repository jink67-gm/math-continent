// =====================================================
// 2~6단원 자동 생성 문제 (숫자·그림을 바꿔 만들어요)
// =====================================================
// 초등학교 6학년 2학기 교육과정 범위 안에서만 냅니다.
// (원기둥·원뿔의 부피·겉넓이 같은 중학교 내용은 내지 않아요)

import { randInt, pick, shuffle, gcd, fmtNum } from '../core/utils.js';
import { isoStackSvg, topGridSvg, viewSvg, frontView, rightView, cylinderSvg, coneSvg, sphereSvg, shapeSvg } from './figures.js';

const piNote = (pi) => (pi === 3 ? '(원주율은 3으로 계산하세요.)' : '(원주율은 3.14로 계산하세요.)');

function choices4(correct, wrongs, filler) {
  const set = new Set([correct]);
  for (const w of wrongs) if (set.size < 4 && w && w !== correct) set.add(w);
  let guard = 0;
  while (set.size < 4 && guard++ < 60) {
    const f = filler();
    if (f && f !== correct) set.add(f);
  }
  return shuffle([...set]);
}

// ---------------------------------------------------
// 공간과 입체 (쌓기나무)
// ---------------------------------------------------
function randomGrid(rows, cols, maxH) {
  for (let tries = 0; tries < 80; tries++) {
    const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() < 0.82 ? randInt(1, maxH) : 0)));
    const colsOk = g[0].every((_, c) => g.some((row) => row[c] > 0));
    const rowsOk = g.every((row) => row.some((v) => v > 0));
    if (colsOk && rowsOk) return g;
  }
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));
}
const gridKey = (g) => g.map((r) => r.join('')).join('-');
const sum = (g) => g.flat().reduce((a, b) => a + b, 0);

const spatial = [
  {
    key: 'countTop',
    difficulty: [1],
    make() {
      const g = randomGrid(2, randInt(2, 3), 3);
      const n = sum(g);
      return {
        id: `sp-g-ct-${gridKey(g)}`, type: 'input', suffix: '개', topic: '쌓기나무 개수',
        image: `<div class="fig-row">${isoStackSvg(g)}${topGridSvg(g)}</div>`,
        question: '쌓기나무로 쌓은 모양과 위에서 본 모양에 수를 쓴 것이에요.\n쌓기나무는 모두 몇 개일까요?',
        answer: String(n),
        explanation: `위에서 본 모양의 수를 모두 더해요.\n${g.flat().filter((v) => v).join(' + ')} = ${n} (개)`,
        hint: '각 칸의 수는 그 자리에 쌓인 쌓기나무 개수예요.',
      };
    },
  },
  {
    key: 'layer',
    difficulty: [2],
    make() {
      let g = randomGrid(3, 3, 3);
      while (Math.max(...g.flat()) < 2) g = randomGrid(3, 3, 3);
      const layer = pick([2, 3].filter((L) => g.flat().some((v) => v >= L)));
      const n = g.flat().filter((v) => v >= layer).length;
      return {
        id: `sp-g-ly-${layer}-${gridKey(g)}`, type: 'input', suffix: '개', topic: '층별로 나타내기',
        image: topGridSvg(g),
        question: `위에서 본 모양에 쌓은 개수를 썼어요.\n${layer}층에 있는 쌓기나무는 몇 개일까요?`,
        answer: String(n),
        explanation: `${layer} 이상인 칸마다 ${layer}층에 쌓기나무가 1개씩 있어요.\n${layer} 이상인 칸: ${n}개`,
        hint: `수가 ${layer} 이상인 칸을 세어 보세요.`,
      };
    },
  },
  {
    key: 'total3',
    difficulty: [2],
    make() {
      const g = randomGrid(3, 3, 3);
      const n = sum(g);
      return {
        id: `sp-g-t3-${gridKey(g)}`, type: 'input', suffix: '개', topic: '쌓기나무 개수',
        image: topGridSvg(g),
        question: '위에서 본 모양에 쌓은 개수를 썼어요.\n쌓기나무는 모두 몇 개일까요?',
        answer: String(n),
        explanation: `${g.flat().filter((v) => v).join(' + ')} = ${n} (개)`,
        hint: '칸에 쓰인 수를 모두 더해요.',
      };
    },
  },
  {
    key: 'frontView',
    difficulty: [3],
    make() {
      const g = randomGrid(3, 3, 3);
      const side = Math.random() < 0.5 ? 'front' : 'right';
      const correct = side === 'front' ? frontView(g) : rightView(g);
      const other = side === 'front' ? rightView(g) : frontView(g);
      const key = (h) => h.join('');
      const cands = [other, [...correct].reverse()];
      for (let i = 0; i < 6; i++) {
        const v = [...correct];
        const k = randInt(0, v.length - 1);
        v[k] = Math.max(1, Math.min(3, v[k] + (Math.random() < 0.5 ? 1 : -1)));
        cands.push(v);
      }
      const opts = [correct];
      for (const c of cands) if (opts.length < 4 && !opts.some((o) => key(o) === key(c))) opts.push(c);
      while (opts.length < 4) opts.push(correct.map(() => randInt(1, 3)));
      const labels = ['A', 'B', 'C', 'D'];
      const images = {};
      opts.forEach((o, i) => { images[labels[i]] = viewSvg(o); });
      return {
        id: `sp-g-fv-${side}-${gridKey(g)}`, type: 'choice', topic: side === 'front' ? '앞에서 본 모양' : '옆에서 본 모양',
        image: topGridSvg(g),
        question: side === 'front'
          ? '위에서 본 모양에 쌓은 개수를 썼어요.\n앞에서 본 모양으로 알맞은 것은?'
          : '위에서 본 모양에 쌓은 개수를 썼어요.\n오른쪽 옆에서 본 모양으로 알맞은 것은?',
        choices: labels.slice(0, opts.length),
        choiceImages: images,
        answer: 'A',
        explanation: side === 'front'
          ? `앞에서 보면 줄(세로)마다 가장 높은 층이 보여요.\n왼쪽부터 ${correct.join(', ')}층`
          : `오른쪽에서 보면 앞줄부터 뒷줄까지 가로줄마다 가장 높은 층이 보여요.\n앞쪽부터 ${correct.join(', ')}층`,
        hint: side === 'front' ? '앞에서 보면 같은 세로줄에서 가장 높은 것만 보여요.' : '옆에서 보면 같은 가로줄에서 가장 높은 것만 보여요.',
      };
    },
  },
];

// ---------------------------------------------------
// 소수의 나눗셈
// ---------------------------------------------------
const decimalDivision = [
  {
    key: 'decByNat',
    difficulty: [1],
    make() {
      const n = randInt(2, 9);
      const Q = randInt(11, 49);
      if (Q % 10 === 0) return this.make();
      const a = fmtNum((Q * n) / 10);
      const q = fmtNum(Q / 10);
      return {
        id: `dd-g-dn-${a}-${n}`, type: 'input', topic: '(소수) ÷ (자연수)',
        question: `${a} ÷ ${n} = □`, answer: q,
        explanation: `${Q * n} ÷ ${n} = ${Q} 이므로\n${a} ÷ ${n} = ${q}`,
        hint: '자연수의 나눗셈처럼 계산하고, 소수점을 그대로 올려 찍어요.',
      };
    },
  },
  {
    key: 'decByDec',
    difficulty: [1, 2],
    make() {
      const c = randInt(2, 9);
      const k = randInt(3, 15);
      const a = fmtNum((c * k) / 10);
      const b = fmtNum(c / 10);
      return {
        id: `dd-g-dd-${a}-${b}`, type: 'input', topic: '(소수) ÷ (소수)',
        question: `${a} ÷ ${b} = □`, answer: String(k),
        explanation: `나누어지는 수와 나누는 수에 똑같이 10을 곱해요.\n${a} ÷ ${b} = ${c * k} ÷ ${c} = ${k}`,
        hint: '두 수에 10을 곱해도 몫은 같아요.',
      };
    },
  },
  {
    key: 'natByDec',
    difficulty: [2],
    make() {
      const d = pick([2, 4, 5, 8]);
      let q = randInt(3, 30);
      while ((q * d) % 10 !== 0) q += 1;
      const n = (q * d) / 10;
      const b = fmtNum(d / 10);
      return {
        id: `dd-g-nd-${n}-${b}`, type: 'input', topic: '(자연수) ÷ (소수)',
        question: `${n} ÷ ${b} = □`, answer: String(q),
        explanation: `두 수에 10을 곱해요.\n${n} ÷ ${b} = ${n * 10} ÷ ${d} = ${q}`,
        hint: '두 수에 똑같이 10을 곱해 보세요.',
      };
    },
  },
  {
    key: 'twoPlace',
    difficulty: [2, 3],
    make() {
      const B = randInt(11, 39);
      const Q = randInt(11, 59);
      if (B % 10 === 0 || Q % 10 === 0) return this.make();
      const a = fmtNum((B * Q) / 100);
      const b = fmtNum(B / 10);
      const q = fmtNum(Q / 10);
      return {
        id: `dd-g-tp-${a}-${b}`, type: 'input', topic: '(소수) ÷ (소수)',
        question: `${a} ÷ ${b} = □`, answer: q,
        explanation: `나누는 수가 자연수가 되도록 두 수에 10을 곱해요.\n${a} ÷ ${b} = ${fmtNum((B * Q) / 10)} ÷ ${B} = ${q}`,
        hint: `${b}에 10을 곱하면 ${B}가 돼요. 나누어지는 수에도 10을 곱해요.`,
      };
    },
  },
  {
    key: 'round',
    difficulty: [3],
    make() {
      const b = pick([3, 6, 7, 9]);
      let a = randInt(2, 25);
      while (a % b === 0) a += 1;
      const ans = fmtNum(Math.round((a / b) * 10) / 10);
      const longQ = (a / b).toFixed(3);
      return {
        id: `dd-g-rd-${a}-${b}`, type: 'input', topic: '몫을 반올림하여 나타내기',
        question: `${a} ÷ ${b}의 몫을 반올림하여\n소수 첫째 자리까지 나타내면?`, answer: ans,
        explanation: `${a} ÷ ${b} = ${longQ}…\n소수 둘째 자리에서 반올림하면 ${ans}`,
        hint: '소수 둘째 자리까지 구한 다음, 둘째 자리 숫자를 보고 반올림해요.',
      };
    },
  },
  {
    key: 'remainder',
    difficulty: [3],
    make() {
      const d = randInt(2, 4);
      const k = randInt(2, 6);
      const R = randInt(1, d * 10 - 1);
      if (R % 10 === 0) return this.make();
      const total = fmtNum(d * k + R / 10);
      const r = fmtNum(R / 10);
      const askCount = Math.random() < 0.5;
      const thing = pick([['주스', 'L', '병', '를'], ['리본', 'm', '도막', '를'], ['쌀', 'kg', '봉지', '을']]);
      return {
        id: `dd-g-rm-${total}-${d}-${askCount ? 'n' : 'r'}`, type: 'input',
        suffix: askCount ? thing[2] : thing[1], topic: '몫과 남는 양',
        question: `${thing[0]} ${total} ${thing[1]}${thing[3]} 한 ${thing[2]}에 ${d} ${thing[1]}씩 나누어 담아요.\n${askCount ? `${d} ${thing[1]}씩 가득 담은 ${thing[2]}는 몇 ${thing[2]}일까요?` : `담고 남는 ${thing[0]}는 몇 ${thing[1]}일까요?`}`,
        answer: askCount ? String(k) : r,
        explanation: `${total} ÷ ${d}의 몫을 자연수까지 구하면 ${k}이고\n남는 양은 ${total} − ${d} × ${k} = ${r} (${thing[1]})`,
        hint: '몫을 자연수 부분까지만 구해요.',
      };
    },
  },
  {
    key: 'word',
    difficulty: [3],
    make() {
      const c = randInt(2, 8);
      const k = randInt(4, 16);
      const a = fmtNum((c * k) / 10);
      const b = fmtNum(c / 10);
      const s = pick([
        { t: `끈 ${a} m를 ${b} m씩 자르면 몇 도막이 될까요?`, u: '도막' },
        { t: `물 ${a} L를 ${b} L씩 컵에 따르면 몇 컵이 될까요?`, u: '컵' },
        { t: `밀가루 ${a} kg을 ${b} kg씩 봉지에 담으면 몇 봉지가 될까요?`, u: '봉지' },
      ]);
      return {
        id: `dd-g-wd-${a}-${b}-${s.u}`, type: 'input', suffix: s.u, topic: '생활 속 소수의 나눗셈',
        question: s.t, answer: String(k),
        explanation: `${a} ÷ ${b} = ${c * k} ÷ ${c} = ${k} (${s.u})`,
        hint: '(전체 양) ÷ (한 번에 쓰는 양)',
      };
    },
  },
];

// ---------------------------------------------------
// 비례식과 비례배분
// ---------------------------------------------------
function coprime(lo, hi) {
  for (let i = 0; i < 50; i++) {
    const a = randInt(lo, hi);
    const b = randInt(lo, hi);
    if (a !== b && gcd(a, b) === 1) return [a, b];
  }
  return [2, 3];
}

const proportion = [
  {
    key: 'blank',
    difficulty: [1, 2],
    make() {
      const [a, b] = coprime(1, 9);
      const k = randInt(2, 6);
      const terms = [a, b, a * k, b * k];
      const hide = randInt(0, 3);
      const shown = terms.map((v, i) => (i === hide ? '□' : v));
      return {
        id: `pr-g-bl-${terms.join('-')}-${hide}`, type: 'input', topic: '비례식',
        question: `${shown[0]} : ${shown[1]} = ${shown[2]} : ${shown[3]}\n□ 안에 알맞은 수는?`,
        answer: String(terms[hide]),
        explanation: `외항의 곱과 내항의 곱은 같아요.\n${a} × ${b * k} = ${b} × ${a * k} = ${a * b * k}\n그래서 □ = ${terms[hide]}`,
        hint: '외항끼리 곱한 값과 내항끼리 곱한 값이 같아요.',
      };
    },
  },
  {
    key: 'simplest',
    difficulty: [1],
    make() {
      const [a, b] = coprime(1, 9);
      const g = randInt(2, 7);
      const correct = `${a} : ${b}`;
      return {
        id: `pr-g-sm-${a * g}-${b * g}`, type: 'choice', topic: '간단한 자연수의 비',
        question: `${a * g} : ${b * g} 를 가장 간단한 자연수의 비로 나타내면?`,
        choices: choices4(correct, [`${b} : ${a}`, `${a * 2} : ${b * 2}`, `${a + 1} : ${b + 1}`], () => `${randInt(1, 9)} : ${randInt(1, 9)}`),
        answer: correct,
        explanation: `전항과 후항을 ${g}(으)로 나누어요.\n${a * g} : ${b * g} = ${a} : ${b}`,
        hint: '두 수의 최대공약수로 나누어 보세요.',
      };
    },
  },
  {
    key: 'simplestDec',
    difficulty: [2],
    make() {
      const useFrac = Math.random() < 0.5;
      const [a, b] = coprime(useFrac ? 2 : 1, 9);
      const correct = `${a} : ${b}`;
      if (useFrac) {
        // 1/b' : 1/a' 형태 → a : b  (예: 1/2 : 1/3 = 3 : 2)
        const [p, q] = [b, a];
        return {
          id: `pr-g-sf-${p}-${q}`, type: 'choice', topic: '간단한 자연수의 비',
          question: `{1/${p}} : {1/${q}} 를 가장 간단한 자연수의 비로 나타내면?`,
          choices: choices4(correct, [`${b} : ${a}`, `1 : ${a * b}`, `${a + b} : ${b}`], () => `${randInt(1, 9)} : ${randInt(1, 9)}`),
          answer: correct,
          explanation: `전항과 후항에 ${p * q}을(를) 곱해요.\n{1/${p}} × ${p * q} = ${q}, {1/${q}} × ${p * q} = ${p}\n그래서 ${q} : ${p} = ${a} : ${b}`,
          hint: '두 분모의 공배수를 곱해 보세요.',
        };
      }
      const k = randInt(1, 3);
      const A = fmtNum((a * k) / 10);
      const B = fmtNum((b * k) / 10);
      return {
        id: `pr-g-sd-${A}-${B}`, type: 'choice', topic: '간단한 자연수의 비',
        question: `${A} : ${B} 를 가장 간단한 자연수의 비로 나타내면?`,
        choices: choices4(correct, [`${b} : ${a}`, `${a * k} : ${b * k * 10}`, `${a + 1} : ${b}`], () => `${randInt(1, 9)} : ${randInt(1, 9)}`),
        answer: correct,
        explanation: `전항과 후항에 10을 곱하면 ${a * k} : ${b * k}\n${k > 1 ? `다시 ${k}(으)로 나누면 ` : ''}${a} : ${b}`,
        hint: '먼저 10을 곱해 자연수로 만들어 보세요.',
      };
    },
  },
  {
    key: 'word',
    difficulty: [3],
    make() {
      const s = pick([
        { a: '분', b: 'L', t: (x, y, z) => `수도에서 ${x}분 동안 물이 ${y} L 나와요.\n같은 빠르기로 물 ${z} L를 받으려면 몇 분이 걸릴까요?`, u: '분' },
        { a: '개', b: '원', t: (x, y, z) => `사탕 ${x}개의 값이 ${y}원이에요.\n${z}원으로는 사탕을 몇 개 살 수 있을까요?`, u: '개', money: true },
        { a: 'cm', b: 'km', t: (x, y, z) => `지도에서 ${x} cm가 실제로 ${y} km예요.\n실제 거리 ${z} km는 지도에서 몇 cm일까요?`, u: 'cm' },
      ]);
      const x = randInt(2, 5);
      let y = randInt(3, 9);
      if (s.money) y = randInt(2, 9) * 100;
      const k = randInt(2, 6);
      const z = y * k;
      const ans = x * k;
      return {
        id: `pr-g-wd-${s.u}-${x}-${y}-${k}`, type: 'input', suffix: s.u, topic: '비례식의 활용',
        question: s.t(x, y, z), answer: String(ans),
        explanation: `비례식을 세워요. ${x} : ${y} = □ : ${z}\n${y} × □ = ${x} × ${z} → □ = ${ans}`,
        hint: '알고 있는 두 양의 비와 구하는 양의 비가 같도록 비례식을 세워요.',
      };
    },
  },
  {
    key: 'distribute',
    difficulty: [2, 3],
    make() {
      const [a, b] = coprime(1, 7);
      const k = randInt(2, 10);
      const total = (a + b) * k;
      const names = pick([['민준', '서연'], ['하준', '지아'], ['도윤', '하은']]);
      const askFirst = Math.random() < 0.5;
      const ans = askFirst ? a * k : b * k;
      const thing = pick([['구슬', '개'], ['색종이', '장'], ['사탕', '개']]);
      return {
        id: `pr-g-ds-${total}-${a}-${b}-${askFirst ? 1 : 2}`, type: 'input', suffix: thing[1], topic: '비례배분',
        question: `${thing[0]} ${total}${thing[1]}를 ${names[0]}와 ${names[1]}가 ${a} : ${b}로 나누어 가지려고 해요.\n${askFirst ? names[0] : names[1]}는 몇 ${thing[1]}를 가질까요?`,
        answer: String(ans),
        explanation: `${total} × {${askFirst ? a : b}/${a + b}} = ${ans} (${thing[1]})`,
        hint: `전체를 (${a} + ${b})로 나누어 생각해요.`,
      };
    },
  },
];

// ---------------------------------------------------
// 원의 둘레와 넓이 (추가)
// ---------------------------------------------------
const circleMore = [
  {
    key: 'areaFromDiameter',
    difficulty: [2],
    make({ piValue }) {
      const d = pick([4, 6, 8, 10, 12, 14, 16, 20]);
      const r = d / 2;
      const ans = fmtNum(r * r * piValue);
      return {
        id: `ci-g-ad-${d}-${piValue}`, type: 'input', suffix: 'cm²', piValue, topic: '원의 넓이',
        question: `지름이 ${d} cm인 원의 넓이는 몇 cm²일까요?\n${piNote(piValue)}`, answer: ans,
        explanation: `반지름 = ${d} ÷ 2 = ${r} (cm)\n${r} × ${r} × ${piValue} = ${ans} (cm²)`,
        hint: '먼저 반지름을 구해요.',
      };
    },
  },
  {
    key: 'halfCircle',
    difficulty: [3],
    make({ piValue }) {
      const r = pick([2, 4, 6, 8, 10]);
      const ans = fmtNum((r * r * piValue) / 2);
      return {
        id: `ci-g-hc-${r}-${piValue}`, type: 'input', suffix: 'cm²', piValue, topic: '원의 넓이 활용',
        question: `반지름이 ${r} cm인 반원의 넓이는 몇 cm²일까요?\n${piNote(piValue)}`, answer: ans,
        explanation: `반원은 원의 반이에요.\n${r} × ${r} × ${piValue} ÷ 2 = ${ans} (cm²)`,
        hint: '원의 넓이를 구한 뒤 2로 나누어요.',
      };
    },
  },
  {
    key: 'radiusFromC',
    difficulty: [3],
    make({ piValue }) {
      const r = randInt(2, 12);
      const c = fmtNum(2 * r * piValue);
      return {
        id: `ci-g-rc-${r}-${piValue}`, type: 'input', suffix: 'cm', piValue, topic: '원주로 반지름 구하기',
        question: `원주가 ${c} cm인 원의 반지름은 몇 cm일까요?\n${piNote(piValue)}`, answer: String(r),
        explanation: `지름 = ${c} ÷ ${piValue} = ${2 * r} (cm)\n반지름 = ${2 * r} ÷ 2 = ${r} (cm)`,
        hint: '원주 ÷ 원주율 = 지름이에요.',
      };
    },
  },
  {
    key: 'wheel',
    difficulty: [3],
    make({ piValue }) {
      const d = pick([30, 40, 50, 60]);
      const n = randInt(2, 5);
      const ans = fmtNum(d * piValue * n);
      return {
        id: `ci-g-wh-${d}-${n}-${piValue}`, type: 'input', suffix: 'cm', piValue, topic: '생활 속 원주',
        question: `지름이 ${d} cm인 바퀴가 ${n}바퀴 굴러갔어요.\n바퀴가 굴러간 거리는 몇 cm일까요?\n${piNote(piValue)}`, answer: ans,
        explanation: `한 바퀴 = 원주 = ${d} × ${piValue} = ${fmtNum(d * piValue)} (cm)\n${n}바퀴 = ${fmtNum(d * piValue)} × ${n} = ${ans} (cm)`,
        hint: '바퀴가 한 바퀴 구르면 원주만큼 가요.',
      };
    },
  },
];

// ---------------------------------------------------
// 원기둥, 원뿔, 구
// ---------------------------------------------------
const PARTS = [
  { shape: 'cone', hl: 'slant', name: '모선', svg: coneSvg },
  { shape: 'cone', hl: 'height', name: '높이', svg: coneSvg },
  { shape: 'cone', hl: 'apex', name: '원뿔의 꼭짓점', svg: coneSvg },
  { shape: 'cone', hl: 'radius', name: '밑면의 반지름', svg: coneSvg },
  { shape: 'cylinder', hl: 'base', name: '밑면', svg: cylinderSvg },
  { shape: 'cylinder', hl: 'side', name: '옆면', svg: cylinderSvg },
  { shape: 'cylinder', hl: 'height', name: '높이', svg: cylinderSvg },
  { shape: 'sphere', hl: 'center', name: '구의 중심', svg: sphereSvg },
  { shape: 'sphere', hl: 'radius', name: '구의 반지름', svg: sphereSvg },
];
const PART_NAMES = { cone: ['모선', '높이', '원뿔의 꼭짓점', '밑면의 반지름', '밑면'], cylinder: ['밑면', '옆면', '높이', '모선'], sphere: ['구의 중심', '구의 반지름', '구의 지름', '꼭짓점'] };
const SHAPE_KO = { cone: '원뿔', cylinder: '원기둥', sphere: '구' };

const solids = [
  {
    key: 'partName',
    difficulty: [1, 2],
    make() {
      const p = pick(PARTS);
      return {
        id: `so-g-pn-${p.shape}-${p.hl}`, type: 'choice', topic: `${SHAPE_KO[p.shape]}의 구성 요소`,
        image: p.svg(p.hl),
        question: `${SHAPE_KO[p.shape]}에서 빨간색으로 나타낸 부분의 이름은?`,
        choices: choices4(p.name, shuffle(PART_NAMES[p.shape]), () => pick(['지름', '꼭짓점', '모서리', '밑면'])),
        answer: p.name,
        explanation: {
          모선: '원뿔의 꼭짓점과 밑면인 원의 둘레의 한 점을 이은 선분을 모선이라고 해요.',
          높이: p.shape === 'cone' ? '원뿔의 꼭짓점에서 밑면에 수직인 선분의 길이를 높이라고 해요.' : '두 밑면에 수직인 선분의 길이를 높이라고 해요.',
          '원뿔의 꼭짓점': '원뿔에서 뾰족한 부분의 점을 원뿔의 꼭짓점이라고 해요.',
          '밑면의 반지름': '밑면인 원의 중심에서 원 위의 한 점까지의 길이예요.',
          밑면: '원기둥에서 서로 평행하고 합동인 두 원을 밑면이라고 해요.',
          옆면: '두 밑면과 만나는 굽은 면을 옆면이라고 해요.',
          '구의 중심': '구에서 가장 안쪽에 있는 점을 구의 중심이라고 해요.',
          '구의 반지름': '구의 중심에서 구의 겉면의 한 점을 이은 선분이에요.',
        }[p.name],
        hint: `${SHAPE_KO[p.shape]}의 각 부분 이름을 떠올려 보세요.`,
      };
    },
  },
  {
    key: 'netWidth',
    difficulty: [2],
    make({ piValue }) {
      const r = randInt(2, 10);
      const ans = fmtNum(2 * r * piValue);
      return {
        id: `so-g-nw-${r}-${piValue}`, type: 'input', suffix: 'cm', piValue, topic: '원기둥의 전개도',
        image: cylinderSvg('base'),
        question: `밑면의 반지름이 ${r} cm인 원기둥의 전개도에서\n옆면(직사각형)의 가로는 몇 cm일까요?\n${piNote(piValue)}`, answer: ans,
        explanation: `옆면의 가로 = 밑면의 둘레(원주)\n${r} × 2 × ${piValue} = ${ans} (cm)`,
        hint: '옆면을 펼치면 가로의 길이는 밑면의 둘레와 같아요.',
      };
    },
  },
  {
    key: 'netHeight',
    difficulty: [1],
    make() {
      const h = randInt(4, 20);
      const r = randInt(2, 9);
      return {
        id: `so-g-nh-${r}-${h}`, type: 'input', suffix: 'cm', topic: '원기둥의 전개도',
        image: cylinderSvg('height'),
        question: `밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원기둥이 있어요.\n전개도에서 옆면의 세로는 몇 cm일까요?`, answer: String(h),
        explanation: `옆면의 세로 = 원기둥의 높이 = ${h} cm`,
        hint: '옆면의 세로는 원기둥의 높이와 같아요.',
      };
    },
  },
  {
    key: 'rotate',
    difficulty: [3],
    make() {
      const k = pick([['rect', '원기둥'], ['triangle', '원뿔'], ['half', '구']]);
      return {
        id: `so-g-rt-${k[0]}`, type: 'choice', topic: '돌려서 만든 입체도형',
        image: shapeSvg(k[0]),
        question: '평면도형을 빨간 점선(축)을 기준으로\n한 바퀴 돌렸을 때 만들어지는 입체도형은?',
        choices: shuffle(['원기둥', '원뿔', '구', '삼각기둥']),
        answer: k[1],
        explanation: `${{ rect: '직사각형', triangle: '직각삼각형', half: '반원' }[k[0]]}을 한 바퀴 돌리면 ${k[1]}이 돼요.`,
        hint: '도형이 돌아가면서 지나간 자리를 상상해 보세요.',
      };
    },
  },
  {
    key: 'rotateSize',
    difficulty: [3],
    make() {
      const a = randInt(2, 8);
      const b = randInt(3, 12);
      return {
        id: `so-g-rs-${a}-${b}`, type: 'input', suffix: 'cm', topic: '돌려서 만든 입체도형',
        image: shapeSvg('rect'),
        question: `가로 ${a} cm, 세로 ${b} cm인 직사각형을 세로를 기준으로\n한 바퀴 돌려 원기둥을 만들었어요.\n원기둥 밑면의 지름은 몇 cm일까요?`, answer: String(2 * a),
        explanation: `돌린 직사각형의 가로가 밑면의 반지름이 돼요.\n지름 = ${a} × 2 = ${2 * a} (cm)`,
        hint: '축에서 가장 먼 곳까지의 거리가 반지름이에요.',
      };
    },
  },
];

export const unitGenerators = { spatial, decimalDivision, proportion, circleMore, solids };
