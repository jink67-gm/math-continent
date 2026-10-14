// 스킬: 배우기(조건 확인), 슬롯 배치, 재사용 대기시간

import { SKILLS, SKILL_ORDER } from '../data/skills.js';
import { QUESTS } from '../data/quests.js';

export class SkillManager {
  constructor(game) {
    this.game = game;
    this.cd = {};
  }

  get save() {
    return this.game.save;
  }

  has(id) {
    return this.save.skills.includes(id);
  }

  // 배울 수 있는지 → { ok, reason }
  canLearn(id) {
    const def = SKILLS[id];
    if (!def) return { ok: false, reason: '없는 스킬이에요.' };
    if (this.has(id)) return { ok: false, reason: '이미 배웠어요.', learned: true };
    const req = def.require || {};
    if (req.level && this.save.level < req.level) return { ok: false, reason: `LEVEL ${req.level}부터 배울 수 있어요.` };
    if (req.quest && this.game.quests.status(req.quest) !== 'done') {
      return { ok: false, reason: `퀘스트 「${QUESTS[req.quest]?.title}」를 끝내야 해요.` };
    }
    return { ok: true };
  }

  learn(id) {
    if (this.has(id)) return;
    this.save.skills.push(id);
    const slots = this.save.skillSlots;
    const empty = slots.indexOf(null);
    if (empty >= 0) slots[empty] = id;
    this.game.bus.emit('skill:learned', { id });
  }

  learnable() {
    return SKILL_ORDER.filter((id) => this.canLearn(id).ok);
  }

  assign(slotIdx, id) {
    const slots = this.save.skillSlots;
    const other = slots.indexOf(id);
    if (other >= 0 && other !== slotIdx) slots[other] = slots[slotIdx];
    slots[slotIdx] = id;
  }

  update(dt) {
    for (const k of Object.keys(this.cd)) {
      this.cd[k] -= dt;
      if (this.cd[k] <= 0) delete this.cd[k];
    }
  }

  tryCast(slotIdx) {
    const id = this.save.skillSlots[slotIdx];
    if (!id) return { ok: false, reason: 'empty' };
    if (this.cd[id] > 0) return { ok: false, reason: 'cooldown' };
    const def = SKILLS[id];
    this.cd[id] = def.cooldown;
    return { ok: true, id, def };
  }

  cooldownRatio(id) {
    if (!id || !this.cd[id]) return 0;
    return this.cd[id] / SKILLS[id].cooldown;
  }

  reset() {
    this.cd = {};
  }
}
