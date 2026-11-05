// 여러 지도가 이어진 지역(1번 프락시아 · 2번 큐베른 …)의 지도 장면 — 지도 하나 = 같은 장면에 다른 map id
// 땅·절벽·계단·다리·물건·사람·몬스터·룬 돌·봉인된 문·보스를 data/rNmaps.js 설정대로 놓아요.
// 지역 설정(마을 지도·단원·보스)은 data/mapRegions.js 에 있어요.

import { seeded, T } from '../world/terrain.js';
import { Npc } from '../world/Npc.js';
import { Boss } from '../world/Boss.js';
import { drawRelief } from '../world/MapBuilder.js';
import { START_MAP } from '../data/r1maps.js';
import { ALL_MAPS as MAPS, MAP_REGIONS } from '../data/mapRegions.js';
import { ASSET_ROOT, BGM } from '../data/assets.js';
import { textStyle, crisp } from '../ui/style.js';
import { WorldScene, ZOOM } from './WorldScene.js';

export class MapScene extends WorldScene {
  constructor() { super('Map'); }

  init(data) {
    super.init(data);
    this.region = null; // 지역은 지도에서 알아내요 (def.region)
    if (data?.map) this.mapId = data.map;
    if (!MAPS[this.mapId]) this.mapId = START_MAP;
  }

  get def() { return MAPS[this.mapId] || MAPS[START_MAP]; }
  get rid() { return this.def.region || 'fractionValley'; }
  get rc() { return MAP_REGIONS[this.rid]; }
  get info() {
    const d = this.def;
    const rc = this.rc;
    return { id: `${rc.prefix}_${this.mapId}`, village: this.rid, townName: rc.name, name: d.name, subtitle: d.subtitle, bgm: d.bgm, unit: rc.unit, mapV: 2 };
  }
  get placeKey() { return `Map:${this.mapId}`; }
  get syncKey() { return `Map:${this.mapId}`; }

  preload() {
    super.preload();
    if (this.def.boss && !this.cache.audio.exists('bgm_boss')) this.load.audio('bgm_boss', BGM.bgm_boss.map((p) => ASSET_ROOT + p));
  }

  buildWorld() {
    const d = this.def;
    const q = this.game.quests;
    // 가 본 곳 기억 (지도에 표시)
    // 장면을 다시 쓰기 때문에 지난 지도의 봉인 바위·문 기억을 지워요
    this.dark = this.barrier = this.barrierSolid = this.door = this.doorSolid = null;
    const st = this.registry.get('player');
    st.visited ??= [];
    if (!st.visited.includes(this.mapId)) st.visited.push(this.mapId);
    const b = (this.builder = d.build());
    this.mapW = b.cols * T;
    this.mapH = b.rows * T;
    this.grid = b.grid;
    const ground = this.grid.bake(this, seeded(b.cols * 7 + b.rows), { theme: d.theme }).setDepth(-1000);
    if (d.tint) ground.setTint(d.tint);
    drawRelief(this, b, { cave: !!d.cave, theme: d.theme });
    if (!d.cave) this.blockTops(b, d);
    for (const r of b.solidRects()) this.addSolid(r.x, r.y, r.w, r.h);
    for (const o of b.objects) {
      const img = this.placeObject(o);
      if (o.tint) img.setTint(o.tint);
      if (o.label) crisp(this.add.text(o.x, o.y - img.height - 2, o.label, textStyle(11, '#fff3c4'))).setOrigin(0.5, 1).setScale(1 / ZOOM).setDepth(o.y + 1);
    }
    this.mapBuildings = b.objects.filter((o) => o.solid === 'building');

    this.spots = [...(d.spots || [])].map((s) => ({ ...s, x: s.x * T, y: s.y * T }));
    if (d.plots) this.placePlots(d.plots);
    if (this.spots.some((p) => p.kind === 'heal')) this.springSparkles();
    for (const s of this.spots) {
      if (s.stone) this.placeRuneStone(s, q.runeLit(s.id) || q.passed('runes'));
      if (s.pillar) this.placePillar(s, q.runeLit(s.id) || q.passed('seal'));
    }
    if (d.barrier && !q.passed(d.barrier.step)) this.placeBarrier(d.barrier);
    if (d.door) this.placeDoor(d.door, q.passed(d.door.step));
    if (d.stairsDown) this.placeStairsDown(d.stairsDown);
    this.placeChests((d.chests || []).map((c) => ({ ...c, x: c.x * T, y: c.y * T })));
    this.npcs = (d.npcs || []).map((n) => new Npc(this, { ...n, x: n.x * T, y: n.y * T }));
    this.exits = (d.exits || []).map((e) => this.exitZone(e));
    for (const s of d.spawns || []) this.combat.spawnMonster(s.kind, s.x, s.y, d.power || 1);
    if (d.boss && !q.passed(d.boss.step)) {
      this.bossRoomY = d.boss.roomY * T;
      this.boss = new Boss(this, this.combat, d.boss.x * T, d.boss.y * T, this.rc.boss);
      this.combat.monsters.push(this.boss);
    } else if (d.boss) {
      this.glow(d.boss.x * T, d.boss.y * T - 20, 0xffe066);
    }
    if (d.cave) { this.caveDeco(b, d); this.makeCaveLight(); }
  }

  // 출구: 가장자리 칸 범위 → 픽셀 상자
  exitZone(e) {
    const W = this.mapW;
    const H = this.mapH;
    const base = { to: e.to_name || MAPS[e.map]?.name || '', scene: e.scene || 'Map', map: e.map, region: e.region, entry: e.entry, requires: e.requires, lockedMsg: e.lockedMsg };
    const len = (e.to - e.from + 1) * T;
    if (e.side === 'north') return { ...base, x: e.from * T, y: 0, w: len, h: 10 };
    if (e.side === 'south') return { ...base, x: e.from * T, y: H - 10, w: len, h: 10 };
    if (e.side === 'west') return { ...base, x: 0, y: e.from * T, w: 14, h: len };
    if (e.side === 'east') return { ...base, x: W - 14, y: e.from * T, w: 14, h: len };
    return { ...base, x: e.x * T, y: e.y * T, w: e.w * T, h: e.h * T };
  }

  // 들어온 자리: 이름 있는 자리 → 같은 방향 출구 앞 → 마을 광장
  spawnPoint(entry) {
    const d = this.def;
    if (d.entries?.[entry]) { const [x, y] = d.entries[entry]; return { x: x * T, y: y * T }; }
    const e = (d.exits || []).find((x) => x.side === entry);
    if (e) {
      const mid = ((e.from + e.to + 1) / 2) * T;
      if (entry === 'north') return { x: mid, y: 2.6 * T };
      if (entry === 'south') return { x: mid, y: this.mapH - 2.4 * T };
      if (entry === 'west') return { x: 2 * T, y: mid };
      if (entry === 'east') return { x: this.mapW - 2 * T, y: mid };
    }
    const p = MAPS[this.rc.town].entries.plaza;
    return { x: p[0] * T, y: p[1] * T };
  }

  respawnAt() {
    return this.def.cave ? ['Map', 'south', null, this.rc.cave] : ['Map', 'plaza', null, this.rc.town];
  }

  // 절벽 덩어리 위: 풀밭 언덕. 나무·바위·덤불을 몇 무더기로 모아 불규칙하게 둬요.
  blockTops(b, d) {
    const rnd = seeded(b.cols * 31 + b.rows);
    const forest = d.theme === 'forest';
    const trees = forest ? ['tree_big', 'trio_green', 'tree_pine', 'tree_pine', 'tree_green'] : ['tree_big', 'tree_green', 'tree_round', 'tree_pine', 'tree_lime', 'tree_big_orange', 'trio_green'];
    const rocks = ['zl_boulder', 'zl_rock', 'zl_rock_flat', 'zl_boulder', 'zl_rock'];
    const small = ['bush_a', 'bush_b', 'bush_c', 'grass_a', 'grass_b', 'flower_a', 'flower_b', 'zl_pebbles', 'zl_rock'];
    const cells = [];
    for (let y = 0; y < b.rows; y++) for (let x = 0; x < b.cols; x++) if (b.isBlock(x, y) && b.innerFace(x, y) < 0) cells.push([x, y]);
    if (!cells.length) return;
    // 언덕 위 풀밭은 살짝 어둡게 (걸어 다니는 땅과 구분)
    const shade = this.add.graphics().setDepth(-5).fillStyle(0x1d3a12, 0.12);
    for (const [x, y] of cells) shade.fillRect(x * T, y * T, T, T);
    const top = (x, y) => b.isBlock(x, y) && b.innerFace(x, y) < 0;
    const inBlock = (fx, fy) => top(Math.floor(fx), Math.floor(fy - 0.5)) && top(Math.floor(fx), Math.floor(fy - 0.2));
    // 무더기 자리: 서로 4~6칸 떨어진 곳을 무작위로
    const centers = [];
    for (let tries = 0; tries < cells.length * 2; tries++) {
      const [x, y] = cells[Math.floor(rnd() * cells.length)];
      const cx = x + rnd();
      const cy = y + rnd();
      const gap = (forest ? 3.6 : 4.6) + rnd() * 2;
      if (centers.some(([ax, ay]) => (ax - cx) ** 2 + (ay - cy) ** 2 < gap * gap)) continue;
      centers.push([cx, cy]);
    }
    const put = [];
    const free = (fx, fy, r) => put.every(([px, py, pr]) => (px - fx) ** 2 + (py - fy) ** 2 >= (r + pr) ** 2 * 0.8);
    for (const [cx, cy] of centers) {
      const roll = rnd();
      // 무더기 종류: 나무 숲 · 바위 더미 · 섞임 · 덤불만
      const kind = roll < (forest ? 0.55 : 0.4) ? 'trees' : roll < 0.62 ? 'rocks' : roll < 0.85 ? 'mixed' : 'bush';
      const n = kind === 'bush' ? 2 + Math.floor(rnd() * 3) : 2 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const dist = i === 0 ? 0 : 0.7 + rnd() * 1.6;
        const fx = cx + Math.cos(a) * dist;
        const fy = cy + Math.sin(a) * dist * 0.8;
        let k;
        if (kind === 'trees') k = rnd() < 0.85 ? trees[Math.floor(rnd() * trees.length)] : small[Math.floor(rnd() * 3)];
        else if (kind === 'rocks') k = rnd() < 0.7 ? rocks[Math.floor(rnd() * rocks.length)] : small[Math.floor(rnd() * small.length)];
        else if (kind === 'mixed') k = [trees, rocks, small][Math.floor(rnd() * 3)][0 | (rnd() * 5)] || 'bush_a';
        else k = small[Math.floor(rnd() * 4)];
        const r = /tree|trio/.test(k) ? 0.9 : /big|tall/.test(k) ? 0.8 : 0.45;
        if (!inBlock(fx, fy + 0.5) || !free(fx, fy, r)) continue;
        put.push([fx, fy, r]);
        this.placeObject({ k, x: fx * T, y: (fy + 0.5) * T });
      }
    }
    // 빈 풀밭에 풀·꽃 몇 포기
    for (let i = 0; i < cells.length * 0.06; i++) {
      const [x, y] = cells[Math.floor(rnd() * cells.length)];
      const fx = x + rnd();
      const fy = y + rnd();
      if (!free(fx, fy, 0.5)) continue;
      put.push([fx, fy, 0.3]);
      this.placeObject({ k: ['grass_a', 'grass_b', 'flower_a', 'flower_b'][Math.floor(rnd() * 4)], x: fx * T, y: (fy + 0.5) * T });
    }
  }

  // 동굴 바닥의 빛나는 수정·작은 돌 (길·몬스터·룬 근처는 비워요)
  caveDeco(b, d) {
    const rnd = seeded(b.cols * 13 + b.rows);
    const kinds = ['crystal_a', 'crystal_b', 'crystal_c', 'crystal_d', 'ore_a', 'ore_b', 'rock_grey_s', 'rock_brown_s'];
    const avoid = [...(d.spawns || []).map((s) => [s.x / T, s.y / T]), ...this.spots.map((s) => [s.x / T, s.y / T]), ...(d.chests || []).map((c) => [c.x, c.y])];
    for (let i = 0; i < 70; i++) {
      const x = 1 + Math.floor(rnd() * (b.cols - 2));
      const y = 2 + Math.floor(rnd() * (b.rows - 3));
      if (b.grid.get(x, y) !== 'g' || !b.walkable(x, y) || !b.walkable(x, y - 1) || !b.walkable(x, y + 1)) continue;
      if (avoid.some(([ax, ay]) => (ax - x) ** 2 + (ay - y) ** 2 < 6)) continue;
      const k = kinds[Math.floor(rnd() * kinds.length)];
      this.placeObject({ k, x: (x + 0.5) * T, y: (y + 1) * T, solid: [10, 5] });
      if (k.startsWith('crystal')) this.glow((x + 0.5) * T, (y + 0.4) * T, 0xbfe6ff);
    }
  }

  // ── 그림 조각 ─────────────────────────────────
  glow(x, y, tint = 0xbfe6ff) {
    const sp = this.add.sprite(x, y, 'na/spark', 0).setBlendMode('ADD').setDepth(90001).setTint(tint).setScale(1.4);
    sp.play({ key: 'fx_spark', startFrame: Math.floor(Math.random() * 5) });
    this.tweens.add({ targets: sp, alpha: 0.35, duration: 900 + Math.random() * 600, yoyo: true, repeat: -1 });
    return sp;
  }

  runeMark(s, lit, key) {
    const g = this.add.graphics().setDepth(s.y + 1);
    const paint = (on) => g.clear().lineStyle(2, on ? 0xffe066 : 0x8a74c8, on ? 1 : 0.8).strokeCircle(s.x, s.y - 24, 6)
      .fillStyle(on ? 0xffe066 : 0x8a74c8, on ? 1 : 0.7).fillCircle(s.x, s.y - 24, 2);
    paint(lit);
    this.runeMarks ||= {};
    this.runeMarks[key] = { paint, s };
    if (lit) this.glow(s.x, s.y - 24, 0xffe066);
  }

  placeRuneStone(s, lit) {
    this.add.image(s.x, s.y - 2, 'na/nature', 'rock_grey_tall').setOrigin(0.5, 1).setDepth(s.y - 2);
    this.addSolid(s.x - 11, s.y - 12, 22, 10);
    this.runeMark(s, lit, s.id);
  }

  placePillar(s, lit) {
    this.add.image(s.x, s.y - 2, 'na/nature', 'rock_brown_tall').setOrigin(0.5, 1).setDepth(s.y - 2);
    this.addSolid(s.x - 12, s.y - 12, 24, 10);
    this.runeMark(s, lit, s.id);
  }

  sealRock(x, y, w) {
    const c = this.add.container(x, y).setDepth(y);
    const rock = this.add.image(0, 0, 'na/nature', 'rock_grey_stack').setOrigin(0.5, 1).setScale(w / 3, 1.05);
    const seal = this.add.graphics().lineStyle(2, 0xb48cff, 0.9).strokeCircle(0, -26, 11).lineBetween(-7, -26, 7, -26);
    seal.fillStyle(0xb48cff, 1).fillCircle(0, -31, 1.8).fillCircle(0, -21, 1.8);
    this.tweens.add({ targets: seal, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });
    c.add([rock, seal]);
    return c;
  }

  placeBarrier(bar) {
    const x = bar.x * T;
    const y = bar.y * T;
    this.barrier = this.sealRock(x, y + T, bar.w);
    this.barrierSolid = this.addSolid(x - (bar.w * T) / 2, y - 2, bar.w * T, T + 2);
    this.spots.push({ id: 'barrier', kind: 'read', name: '봉인 바위', x, y: y + T + 6, r: 26, label: '살펴보기',
      lines: bar.lines || [['커다란 바위에 보라색 봉인이 걸려 있어요.', '들판·시냇가·숲의 룬 돌 세 개를 모두 깨우면 풀린대요.']] });
  }

  removeBarrier() {
    if (!this.barrier) return;
    this.barrierSolid.destroy();
    this.cameras.main.shake(400, 0.005);
    this.tweens.add({ targets: this.barrier, y: this.barrier.y - 16, alpha: 0, duration: 1000, onComplete: () => this.barrier?.destroy() });
    this.spots = this.spots.filter((s) => s.id !== 'barrier');
  }

  placeDoor(door, open) {
    if (open) return;
    const x = door.x * T;
    const y = door.y * T;
    this.door = this.sealRock(x, y, door.w * 0.75);
    this.doorSolid = this.addSolid(x - (door.w * T) / 2, y - T, door.w * T, T);
    this.spots.push({ id: 'door', kind: 'read', name: '봉인된 문', x, y: y + 8, r: 26, label: '문 살펴보기',
      lines: [['커다란 바위 문에 봉인이 걸려 있어요.', '양옆의 룬 기둥 두 개를 깨우면 열릴 것 같아요.']] });
  }

  openDoor() {
    if (!this.door) return;
    this.doorSolid.destroy();
    this.cameras.main.shake(500, 0.006);
    this.sound.play('sfx_seal', { volume: 0.6 });
    this.tweens.add({ targets: this.door, y: this.door.y - 18, alpha: 0, duration: 1200, onComplete: () => this.door?.destroy() });
    this.spots = this.spots.filter((s) => s.id !== 'door');
  }

  placeStairsDown(st) {
    const x = st.x * T;
    const y = st.y * T;
    const g = this.add.graphics().setDepth(-850);
    g.fillStyle(0x0b0710, 1).fillRect(x - 16, y - 16, 32, 32);
    for (let i = 0; i < 4; i++) g.fillStyle(0x6b5a48, 1).fillRect(x - 14 + i * 2, y - 14 + i * 7, 28 - i * 4, 4);
    crisp(this.add.text(x, y - 20, '▼ 아래층', textStyle(11, '#ffe9a8'))).setOrigin(0.5).setScale(1 / ZOOM).setDepth(y);
  }

  // 분수 밭: 8칸 중 심은 칸 수로 ½·¼·⅛을 보여 줘요
  placePlots(plots) {
    for (const p of plots) {
      const x0 = p.x * T;
      const y0 = p.y * T;
      for (let cy = 0; cy < 2; cy++) {
        for (let cx = 0; cx < 4; cx++) {
          const col = cx === 0 ? 0 : cx === 3 ? 2 : 1;
          const row = cy === 0 ? 0 : 2;
          this.add.image(x0 + cx * T, y0 + cy * T, 'na/field', row * 5 + col).setOrigin(0, 0).setDepth(-900);
        }
      }
      const lines = this.add.graphics().setDepth(-899).lineStyle(1, 0x8a4a1e, 0.55);
      for (let i = 1; i < 4; i++) lines.lineBetween(x0 + i * T + 0.5, y0 + 3, x0 + i * T + 0.5, y0 + 2 * T - 3);
      lines.lineBetween(x0 + 3, y0 + T + 0.5, x0 + 4 * T - 3, y0 + T + 0.5);
      for (let i = 0; i < p.planted; i++) {
        this.add.image(x0 + (i % 4) * T + 8, y0 + Math.floor(i / 4) * T + 14, 'na/nature', 'crop').setOrigin(0.5, 1).setDepth(y0 + Math.floor(i / 4) * T + 14);
      }
      crisp(this.add.text(x0 + 2 * T, y0 - 2, p.label, textStyle(12, '#fff7d6'))).setOrigin(0.5, 1).setScale(1 / ZOOM).setDepth(y0 + 1);
      this.addSolid(x0, y0 + 4, 4 * T, 2 * T - 6);
      const n = 8 / p.planted;
      this.spots.push({ id: `plot${p.label}`, kind: 'read', name: p.label, x: x0 + 2 * T, y: y0 + 2.6 * T, r: 28, label: '밭 살펴보기',
        lines: [[`밭 8칸 중에 ${p.planted}칸에 씨앗을 심었어요.`, `${p.planted}/8 = 1/${n} 이에요. ${n === 8 ? '1/8 두 개를 합치면 1/4이 돼요!' : n === 4 ? '1/4 두 개를 합치면 1/2이 돼요!' : '1/2 두 개면 밭 전체예요!'}`]] });
    }
  }

  springSparkles() {
    const s = this.spots.find((p) => p.kind === 'heal');
    if (s.fountain) {
      // 광장 분수 (Zelda-like, 물이 퐁퐁 솟아요). 아래쪽 둥근 돌만 막아요.
      const fy = s.y - 12;
      this.add.sprite(s.x, fy, 'zl/fountain', 0).setOrigin(0.5, 1).setDepth(fy).play('fx_fountain');
      this.addSolid(s.x - 22, fy - 28, 44, 26);
    }
    for (let i = 0; i < 5; i++) {
      const sp = this.add.sprite(s.x + (Math.random() - 0.5) * 30, s.y - 30 - Math.random() * 10, 'na/spark', 0).setBlendMode('ADD').setAlpha(0.85).setDepth(s.y + 40);
      sp.play({ key: 'fx_spark', startFrame: i % 7 });
      this.tweens.add({ targets: sp, y: sp.y - 10, alpha: 0.2, duration: 1400 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  // ── 퀘스트에서 오는 일 ─────────────────────────
  onRuneSolved(id) {
    const m = this.runeMarks?.[id];
    if (m) { m.paint(true); this.glow(m.s.x, m.s.y - 24, 0xffe066); }
  }

  onQuestAdvance(step) {
    if (step.id === 'runes') this.time.delayedCall(800, () => this.removeBarrier());
    if (step.id === 'seal') this.time.delayedCall(600, () => this.openDoor());
  }

  // ── 보스 (지역마다: 인버트롤 · 큐블록스 …) ─────────
  onBossWake(boss) {
    this.bgm?.stop();
    this.bgm = this.sound.add('bgm_boss', { loop: true, volume: 0.4 });
    this.bgm.play();
    this.sound.play('sfx_boss', { volume: 0.55 });
    this.cameras.main.shake(500, 0.006);
    this.hud?.showBanner(boss.def.name, `${boss.def.line || ''} — 빨간 경고를 보면 구르기!`);
  }

  onBossSeal(on) {
    this.spots = this.spots.filter((s) => s.kind !== 'bossSeal');
    this.sealMark?.destroy();
    if (!on) return;
    const s = { id: 'bossSeal', kind: 'bossSeal', name: '수학의 봉인', x: this.def.boss.x * T, y: this.bossRoomY - 6, r: 30, label: '봉인 풀기' };
    this.spots.push(s);
    const g = this.add.graphics().setDepth(-400).lineStyle(2, 0xc8a0ff, 1).strokeCircle(s.x, s.y - 4, 14).strokeCircle(s.x, s.y - 4, 9);
    this.tweens.add({ targets: g, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
    this.sealMark = g;
    this.hud?.toast('보호막! 아래쪽 봉인 룬에서 문제를 풀어 깨뜨려요');
  }

  async useBossSeal() {
    if (!this.boss?.sealed) return;
    const res = await this.game.runes.start({ context: 'boss', unit: this.info.unit });
    if (!this.sys.isActive() || !res.correct || !this.boss?.sealed) return;
    if (this.combat.isGuest) this.game.party.send({ t: 'unseal' });
    this.boss.unseal();
  }

  onBossDefeated() {
    this.bgm?.stop();
    this.bgm = this.sound.add(this.info.bgm, { loop: true, volume: 0.4 });
    this.bgm.play();
    this.time.delayedCall(1200, () => this.game.quests.onBoss(this.rc.boss.id));
  }

  update(time, delta) {
    super.update(time, delta);
    // NPC 머리 위 퀘스트 표시: ! 받을 부탁 · ? 다 했어요
    for (const n of this.npcs) n.setMark?.(this.game.quests.marker(n.id));
    if (this.dark) this.dark.setPosition(this.player.x, this.player.y - 6);
  }

  // 동굴 조명: 주인공 둘레만 밝고 바깥은 어두워요 (화면보다 넉넉히 큰 그림을 주인공에 붙여 둬요)
  makeCaveLight() {
    const key = 'cave_light';
    if (!this.textures.exists(key)) {
      const w = 640;
      const h = 400;
      const tex = this.textures.createCanvas(key, w, h);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(w / 2, h / 2, 28, w / 2, h / 2, 125);
      g.addColorStop(0, 'rgba(8,5,18,0)');
      g.addColorStop(0.45, 'rgba(8,5,18,0.38)');
      g.addColorStop(1, 'rgba(8,5,18,0.78)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      tex.refresh();
    }
    this.dark = this.add.image(this.player.x, this.player.y, key).setDepth(90000);
  }
}
