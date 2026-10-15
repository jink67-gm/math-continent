// 퀘스트 진행 관리
// 상태: locked(조건 부족) → available(받을 수 있음) → active(진행 중) → complete(보고하면 끝) → done(보상 받음)
// 몬스터 처치, 아이템 획득, 지역 도착, 룬 깨우기 같은 "소식(이벤트)"을 듣고 진행도를 올립니다.

import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { ITEMS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { BOSSES } from '../data/monsters.js';

const EVENT_TYPES = {
  'monster:killed': (p) => ['kill', p.type, 1],
  'item:gained': (p) => ['collect', p.id, p.qty],
  'area:enter': (p) => ['explore', p.id, 1],
  'rune:activated': (p) => ['rune', p.id, 1],
  'boss:defeated': (p) => ['boss', p.id, 1],
};

export class QuestManager {
  constructor(game) {
    this.game = game;
    for (const [ev, map] of Object.entries(EVENT_TYPES)) {
      game.bus.on(ev, (payload) => {
        if (!this.game.save) return;
        const [type, target, amount] = map(payload);
        this.progressEvent(type, target, amount);
      });
    }
  }

  get save() {
    return this.game.save;
  }

  get(id) {
    return QUESTS[id];
  }

  status(id) {
    const st = this.save.quests[id]?.state;
    if (st) return st;
    const q = QUESTS[id];
    if (!q) return 'locked';
    const r = q.requires || {};
    if (r.level && this.save.level < r.level) return 'locked';
    if (r.quests?.some((x) => this.status(x) !== 'done')) return 'locked';
    return 'available';
  }

  progress(id) {
    return this.save.quests[id]?.progress || 0;
  }

  giverName(id) {
    return NPCS[QUESTS[id]?.giver]?.name || '';
  }

  availableFor(npcId) {
    return QUEST_ORDER.filter((id) => QUESTS[id].giver === npcId && this.status(id) === 'available');
  }

  completeFor(npcId) {
    return QUEST_ORDER.filter((id) => QUESTS[id].giver === npcId && this.status(id) === 'complete');
  }

  activeFor(npcId) {
    return QUEST_ORDER.filter((id) => QUESTS[id].giver === npcId && this.status(id) === 'active');
  }

  // HUD에 보여줄 퀘스트 (진행 중 + 보고 대기)
  tracked() {
    return QUEST_ORDER.filter((id) => ['active', 'complete'].includes(this.status(id)));
  }

  accept(id) {
    if (this.status(id) !== 'available') return false;
    this.save.quests[id] = { state: 'active', progress: 0, acceptedAt: Date.now() };
    // 이미 해낸 목표(보스를 먼저 물리친 경우 등)는 바로 완료
    const qd = QUESTS[id];
    if (qd.type === 'boss' && this.save.bossesDefeated.includes(BOSSES[qd.target]?.village)) {
      this.save.quests[id].state = 'complete';
      this.save.quests[id].progress = 1;
    }
    if (qd.type === 'rune') {
      const ids = qd.targets || [qd.target];
      const have = ids.filter((x) => this.save.activatedRunes.includes(x)).length;
      if (have) this.save.quests[id].progress = have;
      if (have >= (qd.count || 1)) this.save.quests[id].state = 'complete';
    }
    this.game.ui.toast(`📜 퀘스트 시작: ${QUESTS[id].title}`, 'info');
    this.game.bus.emit('quest:updated', { id });
    this.game.markDirty('quest', { immediate: true });
    return true;
  }

  progressEvent(type, target, amount = 1) {
    for (const id of QUEST_ORDER) {
      const q = QUESTS[id];
      if (q.type !== type || !(q.target === target || q.targets?.includes(target))) continue;
      const rec = this.save.quests[id];
      if (!rec || rec.state !== 'active') continue;
      const need = q.count || 1;
      rec.progress = Math.min(need, (rec.progress || 0) + amount);
      if (rec.progress >= need) {
        rec.state = 'complete';
        this.game.audio.playSfx('questComplete');
        this.game.ui.toast(`✅ 「${q.title}」 완료! ${this.giverName(id)}에게 보고하세요.`, 'ok', 3600);
      }
      this.game.bus.emit('quest:updated', { id });
      this.game.markDirty('quest');
    }
  }

  // 대화형 퀘스트: 목표 NPC와 이야기하면 바로 완료 → 보상
  handleTalk(npcId) {
    const done = [];
    for (const id of QUEST_ORDER) {
      const q = QUESTS[id];
      if (q.type === 'talk' && q.target === npcId && this.status(id) === 'active') {
        this.save.quests[id].state = 'complete';
        this.save.quests[id].progress = 1;
        done.push(id);
      }
    }
    return done;
  }

  // 보상 받기
  claim(id) {
    if (this.status(id) !== 'complete') return null;
    const q = QUESTS[id];
    const r = q.reward || {};
    const s = this.save;
    s.quests[id].state = 'done';
    s.counters.questsDone = (s.counters.questsDone || 0) + 1;
    const lines = [];
    if (r.gold) {
      s.gold += r.gold;
      lines.push(`🪙 ${r.gold} 골드`);
    }
    for (const [itemId, qty] of r.items || []) {
      const added = this.game.inventory.add(itemId, qty);
      const def = ITEMS[itemId];
      if (added) lines.push(`${def.icon} ${def.name}${qty > 1 ? ` ×${qty}` : ''}`);
      else this.game.ui.toast(`가방이 가득 차서 ${def.name}을(를) 받지 못했어요.`, 'warn');
    }
    if (r.unlockSkill) lines.push(`✨ 스킬 「${SKILLS[r.unlockSkill].name}」 배우기 가능`);
    if (r.exp) lines.push(`⭐ 경험치 ${r.exp}`);
    this.game.audio.playSfx('questComplete');
    this.game.bus.emit('quest:done', { id });
    this.game.markDirty('quest-claim', { immediate: true });
    if (r.exp) this.game.gainExp(r.exp);
    return lines;
  }

  rewardText(id) {
    const r = QUESTS[id].reward || {};
    const parts = [];
    if (r.exp) parts.push(`⭐ 경험치 ${r.exp}`);
    if (r.gold) parts.push(`🪙 ${r.gold}`);
    for (const [itemId, qty] of r.items || []) parts.push(`${ITEMS[itemId].icon} ${ITEMS[itemId].name}${qty > 1 ? ` ×${qty}` : ''}`);
    if (r.unlockSkill) parts.push(`✨ 스킬 「${SKILLS[r.unlockSkill].name}」`);
    return parts.join(' · ');
  }

  progressText(id) {
    const q = QUESTS[id];
    const st = this.status(id);
    if (st === 'complete') return `✓ ${this.giverName(id)}에게 보고하기`;
    if (q.type === 'talk') return `${NPCS[q.target]?.name || ''}와(과) 이야기하기`;
    if (q.type === 'rune' && q.count) return `${q.unitWord || '룬'} ${this.progress(id)} / ${q.count}`;
    if (q.type === 'boss') return '보스 물리치기';
    if (q.type === 'explore' || q.type === 'rune') return '목표 장소 찾기';
    return `${this.progress(id)} / ${q.count || 1}`;
  }
}
