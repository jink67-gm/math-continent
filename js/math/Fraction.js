// 분수 계산 도우미 (항상 기약분수로 유지)
import { gcd } from '../core/utils.js';

export class Fraction {
  constructor(n, d = 1) {
    if (d === 0) throw new Error('분모는 0이 될 수 없어요');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  mul(o) { return new Fraction(this.n * o.n, this.d * o.d); }
  div(o) { return new Fraction(this.n * o.d, this.d * o.n); }
  add(o) { return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d); }
  inv() { return new Fraction(this.d, this.n); }
  equals(o) { return this.n === o.n && this.d === o.d; }
  get value() { return this.n / this.d; }

  // 문제 표기법: 자연수 "3", 진분수 "{3/4}", 대분수 "{1 1/2}"
  toMarkup() {
    if (this.d === 1) return `${this.n}`;
    if (this.n > this.d) {
      const w = Math.floor(this.n / this.d);
      return `{${w} ${this.n % this.d}/${this.d}}`;
    }
    return `{${this.n}/${this.d}}`;
  }

  // 가분수 그대로 표기
  toImproper() {
    return this.d === 1 ? `${this.n}` : `{${this.n}/${this.d}}`;
  }
}

// 약분하지 않은 분수 표기
export const rawFrac = (n, d) => `{${n}/${d}}`;
