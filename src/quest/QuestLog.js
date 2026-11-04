// 퀘스트 진행: 메인 이야기 한 단계씩 + 곁 퀘스트
// 저장 모양: stats.quest = { main: 단계 번호, runes: {룬id: true}, side: { hunt: { n, state } } }
// 화면 쪽(장면·HUD)은 이 파일에 "무슨 일이 있었는지"만 알려 주면 돼요.

import { MAIN, SIDE, regionQuests } from '../data/quests.js';
import { skillsFor } from '../data/skills.js';

export class QuestLog {
  constructor(game) {
    this.game = game;
  }

  get stats() { return this.game.registry.get('player'); }

  // 지금 있는 곳이 어느 마을 이야기인지 (첨탑은 6번 마을 이야기에 붙어 있어요)
  get vid() { return this.scene?.info?.village || this.scene?.info?.id || 'fractionValley'; }
  list(vid = this.vid) { return vid === 'fractionValley' ? MAIN : regionQuests(vid); }

  // 마을마다 진행 상태 (1번 마을은 예전 자리 stats.quest를 그대로 써요)
  state(vid = this.vid) {
    const s = this.stats;
    s.quest ??= {};
    s.quest.main ??= 0;
    s.quest.runes ??= {};
    s.quest.side ??= { hunt: { n: 0, state: 'active' } };
    if (vid === 'fractionValley') return s.quest;
    s.vq ??= {};
    s.vq[vid] ??= { main: 0, runes: {} };
    return s.vq[vid];
  }

  get q() { return this.state(); }
  get step() { return this.list()[this.q.main] || null; }
  get villageCleared() { return this.q.main >= this.list().length; }
  runeLit(id) { return !!this.q.runes[id]; }

  // 단계가 이미 지나갔는지 (예: 다리는 'bridge' 단계 뒤로는 계속 이어져 있어요)
  passed(stepId, vid = this.vid) {
    const i = this.list(vid).findIndex((m) => m.id === stepId);
    return i >= 0 && this.state(vid).main > i;
  }

  fill(lines) {
    const name = this.stats?.name || '모험가';
    return lines.map((l) => l.replaceAll('{name}', name));
  }

  // ── 대화 ──────────────────────────────────────
  // NPC와 말할 때 퀘스트 대사가 있으면 돌려줘요: { lines, after() }
  talk(npcId) {
    const st = this.step;
    if (st?.type === 'talk' && st.target === npcId) {
      return { lines: this.fill(st.lines), after: () => this.advance() };
    }
    const h = this.state('fractionValley').side.hunt;
    const side = SIDE.hunt;
    if (this.vid === 'fractionValley' && side.giver.includes(npcId)) {
      if (h.state === 'ready') {
        return { lines: side.ready, after: () => { h.state = 'done'; this.reward(side.reward, side.title); } };
      }
      if (h.state === 'active' && !h.told) {
        return { lines: side.start, after: () => { h.told = true; this.scene?.hud?.toast(`곁 퀘스트: ${side.title}`); } };
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
    if (npcId === 'chief' && st && st.type !== 'talk') {
      return { lines: [`지금 할 일은 「${st.title}」일세.`, st.desc] };
    }
    if (npcId === 'chief' && this.villageCleared) {
      return { lines: ['풍차 소리가 참 듣기 좋구먼. 고맙네, 영웅!'] };
    }
    if (npcId === 'guard' && this.passed('bridge')) {
      return { lines: ['다리가 고쳐졌으니 지나가도 좋소!', '북쪽 숲의 몬스터는 초원보다 강하니 조심하시오.'] };
    }
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
    else this.scene?.hud?.toast('룬 하나가 깨어났어요! 남은 룬을 찾아요');
  }

  onEnter(sceneKey, region) {
    const st = this.step;
    if (st?.type === 'enter' && (st.target === sceneKey || st.target === `${sceneKey}:${region}`)) this.advance();
  }

  onBoss(id) {
    const st = this.step;
    if (st?.type === 'boss' && st.target === id) this.advance();
  }

  onPurify(sceneKey) {
    const h = this.state('fractionValley').side.hunt;
    if (h.state !== 'active' || sceneKey !== 'Field') return;
    h.n = Math.min(SIDE.hunt.need, h.n + 1);
    if (h.n >= SIDE.hunt.need) {
      h.state = 'ready';
      this.scene?.hud?.toast('첫 정화 완료! 피피에게 알려 줘요');
    }
  }

  advance() {
    const st = this.step;
    if (!st) return;
    this.q.main++;
    const next = this.step;
    const scene = this.scene;
    if (st.done) scene?.hud?.openDialog({ name: st.title, lines: this.fill(st.done) });
    this.reward(st.reward, st.title, next);
    scene?.onQuestAdvance?.(st, next);
    scene?.saveGame({ now: true });
  }

  reward(r = {}, title, next) {
    const s = this.stats;
    const scene = this.scene;
    s.gold += r.gold || 0;
    s.potions = (s.potions || 0) + (r.potions || 0);
    scene?.sound.play('sfx_quest', { volume: 0.5 });
    const got = [r.exp && `경험치 ${r.exp}`, r.gold && `${r.gold} G`, r.potions && `회복약 ${r.potions}개`].filter(Boolean).join(' · ');
    scene?.hud?.showBanner(`「${title}」 완료!`, next ? `${got}  ▶ 다음: ${next.title}` : got);
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
      lines.push(`★ ${this.scene?.info?.townName || '이 마을'}을(를) 구했어요! 다음 마을로 가요`);
    }
    const h = this.state('fractionValley').side.hunt;
    if (this.vid !== 'fractionValley') return lines.join('\n');
    if (h.state === 'active') lines.push(`· ${SIDE.hunt.title} ${h.n}/${SIDE.hunt.need}`);
    if (h.state === 'ready') lines.push(`· ${SIDE.hunt.title} 완료 — 피피에게 알리기`);
    return lines.join('\n');
  }

  // 이 장면에서 화살표가 가리킬 곳 (픽셀)
  goal(placeKey) {
    const g = this.step?.goals?.[placeKey];
    return g ? { x: g[0] * 16, y: g[1] * 16 } : null;
  }
}
