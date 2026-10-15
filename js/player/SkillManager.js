// 스킬: 배우기(조건 확인), 슬롯 배치, 재사용 대기시간

import { SKILLS, SKILL_ORDER } from '../data/skills.js';
import { QUESTS } from '../data/quests.js';

// ⑥ 스킬 칸 잠금: 처음엔 1번 칸만 → 레벨이 오르면 2번(LEVEL 4)·3번(LEVEL 8) 칸이 차례로 열려요
// (예전 기록에서 이미 스킬을 넣어 둔 칸은 그대로 열려 있어요)
export const SLOT_UNLOCK = [1, 4, 8];
export const STARTER_SKILL = 'spin';
// 키보드: 숫자 1·2·3 또는 K·L·U (화면 표시와 실제 키가 같아요)
export const SLOT_KEYS = [['1', 'K'], ['2', 'L'], ['3', 'U']];

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

  // 이 칸이 열려 있는지
  slotOpen(i) {
    const lv = this.save.level || 1;
    if (lv >= SLOT_UNLOCK[i]) return true;
    const id = this.save.skillSlots[i];
    return !!id && this.has(id);
  }

  openSlotCount() {
    return [0, 1, 2].filter((i) => this.slotOpen(i)).length;
  }

  learn(id) {
    if (this.has(id)) return;
    this.save.skills.push(id);
    const slots = this.save.skillSlots;
    const empty = [0, 1, 2].find((i) => !slots[i] && this.slotOpen(i));
    if (empty !== undefined) slots[empty] = id;
    this.game.bus.emit('skill:learned', { id });
  }

  learnable() {
    return SKILL_ORDER.filter((id) => this.canLearn(id).ok);
  }

  assign(slotIdx, id) {
    if (!this.slotOpen(slotIdx) || !this.has(id)) return false;
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
    if (!this.slotOpen(slotIdx)) return { ok: false, reason: 'locked', level: SLOT_UNLOCK[slotIdx] };
    const id = this.save.skillSlots[slotIdx];
    // 배우지 않은 스킬은 칸에 있어도 쓸 수 없어요
    if (!id || !this.has(id)) return { ok: false, reason: 'empty' };
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
