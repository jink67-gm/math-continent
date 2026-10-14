// 그림 파일(에셋) 관리
// - assets/manifest.json 에 적힌 그림을 백그라운드에서 불러옵니다.
// - 아직 안 불러왔거나 파일이 없으면 draw()가 false를 돌려주고, 그리는 쪽은 기존 캔버스 그림으로 대신 그립니다.
//   → 그림 파일이 없어도 게임은 절대 멈추지 않아요.
// - 그림을 바꾸고 싶으면 같은 이름의 파일만 바꿔 넣으면 됩니다. (예: assets/monsters/normal/slime_green_idle.webp)

const BASE = 'assets/';

class AssetManager {
  constructor() {
    this.meta = {};      // key → { w, h, ax, ay }
    this.images = new Map(); // key → HTMLImageElement (불러오기 완료된 것만)
    this.failed = new Set();
    this.pending = new Map();
    this.ready = false;
    this.ext = '.webp';
  }

  async init() {
    try {
      const res = await fetch(`${BASE}manifest.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      this.meta = await res.json();
    } catch (e) {
      console.warn('[Asset] manifest.json을 불러오지 못했어요. 기본 그림으로 진행합니다.', e);
      this.meta = {};
      return;
    }
    this.ready = true;
    // 자주 쓰는 그림 먼저, 나머지는 천천히
    const keys = Object.keys(this.meta);
    const first = keys.filter((k) => k.startsWith('characters/') || k.startsWith('characters2/') || k.startsWith('characters3/') || k.startsWith('items/') || k.startsWith('effects/') || k.startsWith('ui/'));
    const rest = keys.filter((k) => !first.includes(k));
    await this.loadMany(first, 8);
    this.loadMany(rest, 6);
  }

  has(key) {
    return !!this.meta[key];
  }

  url(key) {
    return this.meta[key] ? `${BASE}${key}${this.ext}` : null;
  }

  load(key) {
    if (this.images.has(key)) return Promise.resolve(this.images.get(key));
    if (this.failed.has(key) || !this.meta[key]) return Promise.resolve(null);
    if (this.pending.has(key)) return this.pending.get(key);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.images.set(key, img);
        this.pending.delete(key);
        resolve(img);
      };
      img.onerror = () => {
        this.failed.add(key);
        this.pending.delete(key);
        resolve(null);
      };
      img.src = this.url(key);
    });
    this.pending.set(key, p);
    return p;
  }

  async loadMany(keys, parallel = 6) {
    let i = 0;
    const worker = async () => {
      while (i < keys.length) {
        const k = keys[i++];
        await this.load(k);
      }
    };
    await Promise.all(Array.from({ length: parallel }, worker));
  }

  get(key) {
    const img = this.images.get(key);
    if (!img) {
      if (this.meta[key] && !this.failed.has(key) && !this.pending.has(key)) this.load(key);
      return null;
    }
    return { img, m: this.meta[key] };
  }

  // 그림 그리기 (x, y = 기준점: 캐릭터·몬스터는 발 위치, 아이템은 가운데)
  // o.scale: 원본 대비 크기 / o.height: 그릴 높이(px)로 맞추기
  draw(ctx, key, x, y, o = {}) {
    const a = this.get(key);
    if (!a) return false;
    const { img, m } = a;
    const s = o.height ? o.height / m.h : (o.scale ?? 1);
    const w = m.w * s;
    const h = m.h * s;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flipX) ctx.scale(-1, 1);
    if (o.sx || o.sy) ctx.scale(o.sx ?? 1, o.sy ?? 1);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.blend) ctx.globalCompositeOperation = o.blend;
    const ax = o.center ? w / 2 : m.ax * s;
    const ay = o.center ? h / 2 : m.ay * s;
    ctx.drawImage(img, -ax, -ay, w, h);
    // 색 덧칠 (몬스터 피격: 흰색 / 치명타: 붉은색)
    if (o.tint && o.tintA > 0) {
      const tc = this.tinted(key, img, o.tint);
      if (tc) {
        ctx.globalAlpha *= Math.min(1, o.tintA);
        ctx.drawImage(tc, -ax, -ay, w, h);
      }
    }
    // 맞았을 때 하얗게 번쩍
    if (o.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, o.flash) * 0.75;
      ctx.drawImage(img, -ax, -ay, w, h);
    }
    ctx.restore();
    return true;
  }

  // 그림 모양 그대로 한 가지 색으로 칠한 사본 (한 번 만들면 재사용)
  tinted(key, img, color) {
    if (!this.tintCache) this.tintCache = new Map();
    const ck = `${key}|${color}`;
    let c = this.tintCache.get(ck);
    if (c) return c;
    try {
      c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = color;
      g.fillRect(0, 0, c.width, c.height);
    } catch (e) {
      c = null;
    }
    this.tintCache.set(ck, c);
    return c;
  }

  // HTML용 <img> 태그 (아이템 아이콘 등)
  imgTag(key, alt = '', cls = '') {
    const u = this.url(key);
    if (!u) return '';
    return `<img class="${cls}" src="${u}" alt="${alt}" draggable="false" loading="lazy">`;
  }
}

export const assets = new AssetManager();
