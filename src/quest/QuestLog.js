// 퀘스트 진행
//   여러 지도가 이어진 지역(1번 프락시아 · 2번 큐베른, data/mapRegions.js):
//     메인 이야기 + 마을 사람들의 곁 퀘스트 여러 개 (data/rNquests.js)
//     저장: 1번은 stats.r1, 그 뒤 지역은 stats.rg[지역]
//       = { main: 단계 번호, runes: {룬id: true}, side: { 퀘스트id: { state: 'active'|'ready'|'done', n } } }
//   나머지 마을(예전 구조): 메인 이야기만 (data/quests.js regionQuests) — stats.vq[마을]
// 화면 쪽(장면·HUD)은 이 파일에 "무슨 일이 있었는지"만 알려 주면 돼요.

import { regionQuests } from '../data/quests.js';
import { MAP_REGIONS, ALL_MAPS } from '../data/mapRegions.js';
import { WEAPONS, ARMORS } from '../data/items.js';
import { skillsFor } from '../data/skills.js';

const R1 = 'fractionValley';

// 지도 연결 (출구 → 다음 지도) — 화살표가 다른 지도로 길을 안내할 때 써요
function nextHop(from, to) {
  if (from === to) return null;
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const e of ALL_MAPS[cur]?.exits || []) {
      if (!e.map || e.map in prev) continue;
      prev[e.map] = { from: cur, exit: e };
      if (e.map === to) {
        let step = prev[to];
        while (step.from !== from) step = prev[step.from];
        return step.exit;
      }
      queue.push(e.map);
    }
  }
  return null;
}

export class QuestLog {
  constructor(game) {
    this.game = game;
  }

  get stats() { return this.game.registry.get('player'); }

  // 지금 있는 곳이 어느 마을 이야기인지 (첨탑은 6번 마을 이야기에 붙어 있어요)
  get vid() { return this.scene?.info?.village || this.scene?.info?.id || R1; }
  // 여러 지도가 이어진 지역이면 그 설정 (아니면 null)
  get rc() { return MAP_REGIONS[this.vid] || null; }
  list(vid = this.vid) { return MAP_REGIONS[vid]?.main || regionQuests(vid); }

  state(vid = this.vid) {
    const s = this.stats;
    const rc = MAP_REGIONS[vid];
    if (rc) {
      let st;
      if (rc.save === 'r1') {
        st = (s.r1 ??= {});
        // 맨 앞에 「피피와 이야기하기」가 생기기 전 기록은 한 칸씩 밀어요
        if (st.v !== 2) { if (st.main > 0) st.main++; st.v = 2; }
      }
      else {
        s.rg ??= {};
        if (!s.rg[rc.save]) {
          // 예전 구조에서 이 마을을 이미 구했으면 그대로 구한 걸로 옮겨요
          // (볼테라는 그 뒤 첨탑 단계가 같은 차례로 이어져서, 첨탑 진행과 룬도 그대로 옮겨요)
          const old = s.vq?.[vid];
          s.rg[rc.save] = old && old.main >= 6 ? { main: Math.min(old.main, rc.main.length), runes: { ...(old.runes || {}) } } : { main: 0 };
        }
        st = s.rg[rc.save];
      }
      st.main ??= 0;
      st.runes ??= {};
      st.side ??= {};
      return st;
    }
    s.vq ??= {};
    s.vq[vid] ??= { main: 0, runes: {} };
    return s.vq[vid];
  }

  get q() { return this.state(); }
  get step() { return this.list()[this.q.main] || null; }
  get villageCleared() { return this.q.main >= this.list().length; }
  runeLit(id) { return !!this.q.runes[id]; }

  // 단계가 이미 지나갔는지 (예: 고개의 봉인은 'runes' 단계 뒤로는 풀려 있어요)
  passed(stepId, vid = this.vid) {
    const i = this.list(vid).findIndex((m) => m.id === stepId);
    return i >= 0 && this.state(vid).main > i;
  }

  fill(lines) {
    const name = this.stats?.name || '모험가';
    return lines.map((l) => l.replaceAll('{name}', name).replaceAll('{controls}', this.controlsLine()));
  }

  // 조작법 안내 (터치 기기와 키보드가 달라요)
  controlsLine() {
    if (this.game.device?.input?.touch) return '왼쪽 아래를 누른 채 끌면 걸어요. 오른쪽 큰 단추는 공격, 둘레의 작은 단추는 스킬, 왼쪽 아래 단추는 구르기예요. 사람 곁에서는 말풍선 단추로 대화해요.';
    return 'WASD(또는 방향키)로 걷고, J로 공격, Space로 구르기, E로 대화해요. 스킬은 U·I·O·L, 회복약은 Q, 지도는 M, 가방은 B예요.';
  }

  // ── 곁 퀘스트 (여러 지도 지역) ────────────────────
  get sides() { return this.rc?.side || {}; }
  sideState(id) { return this.state().side[id]; }

  sideAvailable(id) {
    const d = this.sides[id];
    return !this.sideState(id) && this.state().main >= (d.after || 0);
  }

  // NPC 머리 위 표시: '?' 보고할 것 있음 · '!' 새 부탁 있음
  marker(npcId) {
    if (!this.rc) return null;
    const st = this.step;
    if (st?.type === 'talk' && st.target === npcId) return '?';
    let mark = null;
    for (const [id, d] of Object.entries(this.sides)) {
      if (d.giver !== npcId) continue;
      if (this.sideState(id)?.state === 'ready') return '?';
      if (this.sideAvailable(id)) mark = '!';
    }
    return mark;
  }

  // ── 대화 ──────────────────────────────────────
  // NPC와 말할 때 퀘스트 대사가 있으면 돌려줘요: { lines, after() }
  talk(npcId) {
    const st = this.step;
    if (st?.type === 'talk' && st.target === npcId) {
      return { lines: this.fill(st.lines), after: () => this.advance() };
    }
    if (this.rc) {
      for (const [id, d] of Object.entries(this.sides)) {
        if (d.giver !== npcId) continue;
        const ss = this.sideState(id);
        if (ss?.state === 'ready') return { lines: d.ready, after: () => { ss.state = 'done'; this.reward(d.reward, d.title); this.scene?.saveGame({ now: true }); } };
        if (this.sideAvailable(id)) {
          return { lines: d.start, after: () => {
            this.state().side[id] = { state: 'active', n: 0 };
            this.scene?.sound.play('sfx_unlock', { volume: 0.4 });
            this.scene?.hud?.showBanner('새 퀘스트!', `${d.title} — ${d.desc}`);
            this.scene?.saveGame();
          } };
        }
        if (ss?.state === 'active') return { lines: [`${d.desc}`, `지금 ${ss.n}/${d.need}이에요. 힘내요!`] };
      }
    }
    // 룬 할아버지: 레벨이 되면 스킬의 룬을 내 줘요
    if (npcId === 'runeMaster') {
      const s = this.stats;
      const sk = skillsFor(s).find((k) => k.lv <= s.lv && !(s.learned || []).includes(k.id));
      if (sk) return { lines: [`오오, 「${sk.name}」을(를) 배울 때가 되었구나.`, '이 룬을 깨우면 가르쳐 주마. 천천히 생각해 보거라.'], after: () => this.scene?.learnSkill(sk) };
      const next = skillsFor(s).find((k) => k.lv > s.lv);
      if (next) return { lines: [`다음 기술 「${next.name}」은(는) 레벨 ${next.lv}이 되면 가르쳐 주마.`] };
    }
    // 촌장님은 지금 할 일을 다시 알려 줘요
    if (npcId === 'chief' && st && st.type !== 'talk') return { lines: [`지금 할 일은 「${st.title}」일세.`, st.desc] };
    if (npcId === 'chief' && this.villageCleared) return { lines: [this.rc?.chiefIdle || '고맙네, 영웅!'] };
    return null;
  }

  // ── 일어난 일 ─────────────────────────────────
  canRune(id) {
    const st = this.step;
    return st?.type === 'rune' && st.target.includes(id) && !this.runeLit(id);
  }

  onRune(id) {
    this.q.runes[id] = true;
    const st = this.step;
    if (st?.type === 'rune' && st.target.every((r) => this.runeLit(r))) this.advance();
    else {
      const left = st ? st.target.filter((r) => !this.runeLit(r)).length : 0;
      this.scene?.hud?.toast(`룬이 깨어났어요! 남은 룬 ${left}개`);
      this.scene?.saveGame({ now: true });
    }
  }

  onEnter(sceneKey, region, placeKey) {
    const st = this.step;
    if (st?.type !== 'enter') return;
    if (st.target === sceneKey || st.target === `${sceneKey}:${region}` || st.target === placeKey) this.advance();
  }

  onBoss(id) {
    const st = this.step;
    if (st?.type === 'boss' && st.target === id) this.advance();
  }

  // 몬스터를 물리쳤을 때: 물리치기·모으기 퀘스트
  onPurify(placeKey, kind) {
    if (!this.rc) return;
    const map = String(placeKey).replace('Map:', '');
    for (const [id, d] of Object.entries(this.sides)) {
      const ss = this.sideState(id);
      if (ss?.state !== 'active' || d.map !== map || d.kind !== kind) continue;
      if (d.type === 'collect' && Math.random() > d.chance) continue;
      ss.n = Math.min(d.need, ss.n + 1);
      this.scene?.hud?.toast(d.type === 'collect' ? `${d.item}를 주웠어요 (${ss.n}/${d.need})` : `${d.title} ${ss.n}/${d.need}`);
      if (ss.n >= d.need) this.sideReady(id, d);
    }
  }

  // 숨은 물건 찾기 → 찾았으면 true
  onFind(spotId) {
    if (!this.rc) return false;
    for (const [id, d] of Object.entries(this.sides)) {
      const ss = this.sideState(id);
      if (d.type !== 'find' || d.target !== spotId || ss?.state !== 'active') continue;
      ss.n = d.need;
      this.scene?.sound.play('sfx_item', { volume: 0.5 });
      this.sideReady(id, d);
      return true;
    }
    return false;
  }

  sideReady(id, d) {
    this.sideState(id).state = 'ready';
    const giver = this.rc.maps[this.rc.town].npcs.find((n) => n.id === d.giver)?.name || '부탁한 사람';
    this.scene?.hud?.showBanner(`${d.title} 완료!`, `마을의 ${giver}에게 알려 줘요`);
    this.scene?.saveGame();
  }

  advance() {
    const st = this.step;
    if (!st) return;
    this.q.main++;
    const next = this.step;
    const scene = this.scene;
    if (st.done) scene?.hud?.openDialog({ name: st.title, lines: this.fill(st.done) });
    if (!next && this.vid === 'solidPeaks') scene?.time.delayedCall(2500, () => scene.hud?.showBanner('수학 대륙을 구했어요!', '여섯 마을의 봉인을 모두 지켜 냈어요. 정말 멋져요!'));
    this.reward(st.reward, st.title, next);
    scene?.onQuestAdvance?.(st, next);
    scene?.saveGame({ now: true });
  }

  reward(r = {}, title, next) {
    const s = this.stats;
    const scene = this.scene;
    s.gold += r.gold || 0;
    s.potions = (s.potions || 0) + (r.potions || 0);
    const got = [r.exp && `경험치 ${r.exp}`, r.gold && `${r.gold} G`, r.potions && `회복약 ${r.potions}개`];
    if (r.weapon && !s.bag.weapons.includes(r.weapon)) { s.bag.weapons.push(r.weapon); got.push(WEAPONS[r.weapon].name); }
    if (r.armor && !s.bag.armors.includes(r.armor)) { s.bag.armors.push(r.armor); got.push(ARMORS[r.armor].name); }
    scene?.sound.play('sfx_quest', { volume: 0.5 });
    const text = got.filter(Boolean).join(' · ');
    scene?.hud?.showBanner(`「${title}」 완료!`, next ? `${text}  ▶ 다음: ${next.title}` : text);
    if (r.exp) scene?.time.delayedCall(900, () => scene.combat?.gainExp(r.exp));
  }

  // ── 화면에 보여 줄 것 ─────────────────────────
  tracker() {
    const st = this.step;
    const lines = [];
    if (st) {
      let t = `★ ${st.title}`;
      if (st.type === 'rune' && st.target.length > 1) t += ` (${st.target.filter((r) => this.runeLit(r)).length}/${st.target.length})`;
      lines.push(t, `   ${st.desc}`);
    } else {
      lines.push(this.vid === 'solidPeaks' ? '★ 수학 대륙을 모두 구했어요! 축하해요!' : `★ ${this.scene?.info?.townName || '이 마을'}을(를) 구했어요! 다음 마을로 가요`);
    }
    if (!this.rc) return lines.join('\n');
    for (const [id, d] of Object.entries(this.sides)) {
      const ss = this.sideState(id);
      if (ss?.state === 'active') lines.push(`· ${d.title} ${ss.n}/${d.need} (${ALL_MAPS[d.map].name})`);
      if (ss?.state === 'ready') lines.push(`· ${d.title} 완료 — 마을에 알리기`);
    }
    return lines.join('\n');
  }

  // 여러 지도 지역: 지금 메인 단계가 향하는 곳 { map, x, y }
  mapTarget(curMap) {
    const st = this.step;
    if (!st?.at) return null;
    if (st.type !== 'rune') return st.at;
    const left = st.target.filter((r) => !this.runeLit(r)).map((r) => st.at[r]);
    if (!left.length) return null;
    // 지금 지도에 있으면 그것, 아니면 가장 적게 건너가는 곳
    const here = left.find((t) => t.map === curMap);
    if (here) return here;
    const hops = (m) => { let n = 0; let cur = curMap; while (cur !== m && n < 10) { const e = nextHop(cur, m); if (!e) return 99; cur = e.map; n++; } return n; };
    return left.sort((a, b) => hops(a.map) - hops(b.map))[0];
  }

  // 이 장면에서 화살표가 가리킬 곳 (픽셀)
  goal(placeKey) {
    if (this.rc && String(placeKey).startsWith('Map:')) {
      const cur = placeKey.slice(4);
      const t = this.mapTarget(cur);
      if (!t) return null;
      if (t.map === cur) return { x: t.x * 16, y: t.y * 16 };
      const e = nextHop(cur, t.map);
      if (!e) return null;
      return this.exitCenter(cur, e);
    }
    const g = this.step?.goals?.[placeKey];
    return g ? { x: g[0] * 16, y: g[1] * 16 } : null;
  }

  exitCenter(mapId, e) {
    const m = ALL_MAPS[mapId];
    const mid = ((e.from + e.to + 1) / 2) * 16;
    if (e.side === 'north') return { x: mid, y: 4 };
    if (e.side === 'south') return { x: mid, y: m.rows * 16 - 4 };
    if (e.side === 'west') return { x: 4, y: mid };
    if (e.side === 'east') return { x: m.cols * 16 - 4, y: mid };
    return { x: (e.x + e.w / 2) * 16, y: (e.y + e.h / 2) * 16 };
  }
}
