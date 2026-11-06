// 퀘스트 진행
//   여러 지도가 이어진 지역(1번 프락시아 · 2번 큐베른, data/mapRegions.js):
//     메인 이야기 + 마을 사람들의 곁 퀘스트 여러 개 (data/rNquests.js)
//     저장: 1번은 stats.r1, 그 뒤 지역은 stats.rg[지역]
//       = { main: 단계 번호, runes: {룬id: true}, side: { 퀘스트id: { state: 'active'|'ready'|'done', n } } }
//   나머지 마을(예전 구조): 메인 이야기만 (data/quests.js regionQuests) — stats.vq[마을]
// 화면 쪽(장면·HUD)은 이 파일에 "무슨 일이 있었는지"만 알려 주면 돼요.
//
// 곁 퀘스트는 여러 단계로 이어지는 이야기예요 (rNquests.js의 steps):
//   talk(사람과 이야기) · solve(그 사람이 내는 수학 문제) · kill(물리치기) · collect(떨어뜨리는 물건 모으기)
//   find(숨은 물건 찾기) · enter(어떤 지도에 가 보기)
//   단계를 모두 마치면 처음 부탁한 사람에게 돌아가 보상을 받아요. 보상에 combo가 있으면 새 콤보를 배워요.

import { regionQuests } from '../data/quests.js';
import { MAP_REGIONS, ALL_MAPS } from '../data/mapRegions.js';
import { itemDef, giveItem } from '../data/items.js';
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
    return 'WASD(또는 방향키)로 걷고, J로 공격, Space로 구르기, E로 대화해요. 스킬은 U·I·O·L, 회복약은 Q, 지도는 M, 장비는 B, 능력은 C, 퀘스트 목록은 K예요.';
  }

  // ── 곁 퀘스트 (여러 지도 지역) ────────────────────
  get sides() { return this.rc?.side || {}; }
  sideState(id) { return this.state().side[id]; }
  // 예전 한 단계짜리 퀘스트도 steps 하나로 다뤄요
  stepsOf(d) { return d.steps || [d]; }
  sideStep(id) {
    const ss = this.sideState(id);
    if (ss?.state !== 'active') return null;
    return this.stepsOf(this.sides[id])[ss.step || 0] || null;
  }
  npcName(npcId) { return this.rc?.maps[this.rc.town]?.npcs.find((n) => n.id === npcId)?.name || '마을 사람'; }

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
      const cur = this.sideStep(id);
      if (cur && (cur.type === 'talk' || cur.type === 'solve') && cur.npc === npcId) return '?';
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
      // 1) 지금 단계가 이 사람과 이야기하기 · 문제 풀기인 퀘스트
      for (const [id, d] of Object.entries(this.sides)) {
        const cur = this.sideStep(id);
        if (!cur || cur.npc !== npcId) continue;
        if (cur.type === 'talk') return { lines: this.fill(cur.lines || [cur.desc]), after: () => this.advanceSide(id) };
        if (cur.type === 'solve') {
          return { lines: this.fill(cur.lines || [cur.desc]), after: async () => {
            const res = await this.game.runes.start({ context: 'quest', unit: this.rc.unit, title: d.title, line: cur.ask || '이 문제를 풀어 줄래?', allowLater: true });
            if (res.correct) this.advanceSide(id);
            else this.scene?.hud?.toast('천천히 생각해 보고 다시 말을 걸어요');
          } };
        }
      }
      // 2) 부탁한 사람: 보고 · 새 부탁 · 진행 알려 주기
      for (const [id, d] of Object.entries(this.sides)) {
        if (d.giver !== npcId) continue;
        const ss = this.sideState(id);
        if (ss?.state === 'ready') return { lines: this.fill(d.ready), after: () => { ss.state = 'done'; this.reward(d.reward, d.title); this.scene?.saveGame({ now: true }); } };
        if (this.sideAvailable(id)) {
          return { lines: this.fill(d.start), after: () => {
            this.state().side[id] = { state: 'active', step: 0, n: 0 };
            this.scene?.sound.play('sfx_unlock', { volume: 0.4 });
            this.scene?.hud?.showBanner('새 퀘스트!', `${d.title} — ${this.stepsOf(d)[0].desc}`);
            this.scene?.saveGame();
          } };
        }
        const cur = this.sideStep(id);
        if (cur) return { lines: [`「${d.title}」 ${cur.desc}`, ...(cur.need ? [`지금 ${ss.n || 0}/${cur.need}이에요. 힘내요!`] : [])] };
      }
    }
    // 룬 학자: 배울 수 있는 스킬 중에서 골라 배워요 (스킬 포인트 1 + 룬 문제)
    if (npcId === 'runeMaster') {
      const s = this.stats;
      const can = skillsFor(s).filter((k) => k.lv <= s.lv && !(s.learned || []).includes(k.id));
      if (can.length) return { lines: [`오오, 지금 배울 수 있는 기술이 ${can.length}가지 있구나.`, '어떤 기술을 익힐지 골라 보거라. 스킬 포인트 1이 들고, 룬을 깨워야 배울 수 있단다.'], after: () => this.scene?.openSkills?.('learn') };
      const next = skillsFor(s).find((k) => k.lv > s.lv);
      if (next) return { lines: [`다음 기술 「${next.name}」은(는) 레벨 ${next.lv}이 되면 가르쳐 주마.`, '배운 기술은 능력(C) 창에서 스킬 포인트로 더 강하게 만들 수 있단다.'] };
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

  // 몬스터를 물리쳤을 때: 물리치기·모으기 단계
  onPurify(placeKey, kind) {
    if (!this.rc) return;
    const map = String(placeKey).replace('Map:', '');
    for (const [id, d] of Object.entries(this.sides)) {
      const cur = this.sideStep(id);
      if (!cur || (cur.type !== 'kill' && cur.type !== 'collect') || cur.map !== map || cur.kind !== kind) continue;
      if (cur.type === 'collect' && Math.random() > (cur.chance ?? 0.6)) continue;
      const ss = this.sideState(id);
      ss.n = Math.min(cur.need, (ss.n || 0) + 1);
      this.scene?.hud?.toast(cur.type === 'collect' ? `${cur.item}을(를) 얻었어요 (${ss.n}/${cur.need})` : `${d.title} ${ss.n}/${cur.need}`);
      if (ss.n >= cur.need) this.advanceSide(id);
    }
  }

  // 숨은 물건 찾기 → 찾았으면 true
  onFind(spotId) {
    if (!this.rc) return false;
    for (const id of Object.keys(this.sides)) {
      const cur = this.sideStep(id);
      if (cur?.type !== 'find' || cur.target !== spotId) continue;
      this.scene?.sound.play('sfx_item', { volume: 0.5 });
      if (cur.lines) this.scene?.hud?.openDialog({ name: cur.item || '찾았다!', lines: this.fill(cur.lines) });
      this.advanceSide(id);
      return true;
    }
    return false;
  }

  // 지도에 들어왔을 때: 가 보기 단계
  onEnterMap(mapId) {
    if (!this.rc) return;
    for (const id of Object.keys(this.sides)) {
      const cur = this.sideStep(id);
      if (cur?.type === 'enter' && cur.map === mapId) {
        if (cur.lines) this.scene?.hud?.openDialog({ name: ALL_MAPS[mapId]?.name || '', lines: this.fill(cur.lines) });
        this.advanceSide(id);
      }
    }
  }

  // 곁 퀘스트 다음 단계로 (다 끝나면 부탁한 사람에게 돌아가요)
  advanceSide(id) {
    const d = this.sides[id];
    const ss = this.sideState(id);
    if (!ss || ss.state !== 'active') return;
    ss.step = (ss.step || 0) + 1;
    ss.n = 0;
    const next = this.stepsOf(d)[ss.step];
    if (!next) { this.sideReady(id, d); return; }
    this.scene?.sound.play('sfx_unlock', { volume: 0.35 });
    this.scene?.hud?.showBanner(d.title, `다음: ${next.desc}`);
    this.scene?.saveGame();
  }

  sideReady(id, d) {
    this.sideState(id).state = 'ready';
    this.scene?.hud?.showBanner(`${d.title} — 거의 다 했어요!`, `마을의 ${this.npcName(d.giver)}에게 알려 줘요`);
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
    // 보스를 물리치면 강화석도 받아요 (높은 지역일수록 빛나는 강화석도)
    const rw = { ...st.reward };
    if (st.type === 'boss') {
      const n = Object.keys(MAP_REGIONS).indexOf(this.vid) + 1 || 6;
      rw.stones = (rw.stones || 0) + 2 + Math.ceil(n / 2);
      if (n >= 3) rw.stones2 = (rw.stones2 || 0) + Math.floor(n / 3);
    }
    this.reward(rw, st.title, next);
    scene?.onQuestAdvance?.(st, next);
    scene?.saveGame({ now: true });
  }

  reward(r = {}, title, next) {
    const s = this.stats;
    const scene = this.scene;
    s.gold += r.gold || 0;
    s.potions = (s.potions || 0) + (r.potions || 0);
    const got = [r.exp && `경험치 ${r.exp}`, r.gold && `${r.gold} G`, r.potions && `회복약 ${r.potions}개`];
    for (const id of [r.weapon, r.armor, r.item].filter(Boolean)) if (giveItem(s, id)) got.push(itemDef(id).name);
    if (r.combo) {
      s.combos ??= [];
      if (!s.combos.includes(r.combo)) s.combos.push(r.combo);
      got.push(`새 콤보 「${{ launch: '띄워 베기', pierce: '모아 찌르기' }[r.combo] || r.combo}」`);
      scene?.time.delayedCall(2600, () => scene.hud?.showBanner('새 콤보를 배웠어요!', r.combo === 'launch' ? 'J J 쉬고 J → 적을 띄워 올려 공중 연타' : 'J를 꾹 눌렀다 떼기 → 앞으로 꿰뚫는 찌르기 (오래 모으면 세 번)'));
    }
    if (r.stones) { s.stones = (s.stones || 0) + r.stones; got.push(`강화석 ${r.stones}개`); }
    if (r.stones2) { s.stones2 = (s.stones2 || 0) + r.stones2; got.push(`빛나는 강화석 ${r.stones2}개`); }
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
      const cur = this.sideStep(id);
      if (cur) lines.push(`· ${d.title}: ${this.stepLabel(cur, ss)}`);
      if (ss?.state === 'ready') lines.push(`· ${d.title}: ${this.npcName(d.giver)}에게 알리기`);
    }
    return lines.join('\n');
  }

  // 단계를 짧게 (알림판·퀘스트 창)
  stepLabel(cur, ss) {
    if (cur.type === 'kill' || cur.type === 'collect') return `${cur.short || cur.desc} ${ss?.n || 0}/${cur.need}`;
    if (cur.type === 'talk' || cur.type === 'solve') return cur.short || `${this.npcName(cur.npc)}에게 가기`;
    return cur.short || cur.desc;
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
