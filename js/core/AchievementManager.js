// 업적: 여러 소식(이벤트)이 올 때마다 조건을 확인하고, 처음 달성하면 알려 줌
import { ACHIEVEMENTS } from '../data/achievements.js';

const WATCH = [
  'monster:killed', 'level:up', 'skill:learned', 'math:attempt', 'quest:done',
  'item:gained', 'equip:enhanced', 'chest:opened', 'boss:defeated',
];

export class AchievementManager {
  constructor(game) {
    this.game = game;
    this.pending = false;
    for (const ev of WATCH) game.bus.on(ev, () => this.schedule());
  }

  schedule() {
    if (this.pending) return;
    this.pending = true;
    setTimeout(() => {
      this.pending = false;
      this.check();
    }, 50);
  }

  check({ silent = false } = {}) {
    const s = this.game.save;
    if (!s) return;
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (s.achievements.includes(a.id)) continue;
      let ok = false;
      try { ok = a.check(s); } catch (e) { ok = false; }
      if (!ok) continue;
      s.achievements.push(a.id);
      changed = true;
      if (!silent) {
        this.game.ui.toast(`🏆 업적 달성! ${a.icon} ${a.name}`, 'ok', 3200);
        this.game.audio.playSfx('item');
      }
    }
    if (changed) this.game.markDirty('achievement');
  }
}
