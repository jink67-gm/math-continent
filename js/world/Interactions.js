// NPC 대화, 룬 돌, 보물상자 같은 "말 걸기/살펴보기" 처리

import { artState } from '../render/envArt.js';
import { NPCS } from '../data/npcs.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { pick, randInt } from '../core/utils.js';
import { getVillage } from '../data/villages.js';

// 상자 보상표 (weight: 뽑힐 비율)
const CHEST_LOOT = {
  normal: { gold: [12, 18], items: [['potion_s', 1]], roll: [] },
  golden: {
    gold: [35, 50],
    items: [['potion_m', 1]],
    roll: [
      { id: 'clover_necklace', weight: 30 },
      { id: 'leather_armor', weight: 25 },
      { id: 'wind_sword', weight: 10 },
      { id: 'enhance_stone', weight: 35, qty: 2 },
    ],
  },
};

function weightedPick(list) {
  const total = list.reduce((n, x) => n + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) {
    r -= x.weight;
    if (r <= 0) return x;
  }
  return list[list.length - 1];
}

export class Interactions {
  constructor(game) {
    this.game = game;
    this.busy = false;
  }

  get dlg() {
    return this.game.ui.dialogue;
  }

  async run(obj) {
    if (this.busy) return;
    this.busy = true;
    this.game.input.reset();
    try {
      // 대화하는 동안 그 NPC는 말하는 동작 (새 NPC 애니메이션)
      if (obj.kind === 'npc') artState.talk = { x: obj.x, y: obj.y };
      if (obj.kind === 'npc') await this.talkTo(obj.npc);
      else if (obj.kind === 'rune') await this.rune(obj);
      else if (obj.kind === 'chest') await this.chest(obj);
      else if (obj.kind === 'heal') this.heal();
      else if (obj.kind === 'door') await this.door(obj);
      else if (obj.kind === 'warp') await this.warp(obj);
      else if (obj.kind === 'switch') await this.switchDevice(obj);
    } catch (e) {
      console.error('[Interactions]', e);
    } finally {
      artState.talk = null;
      this.busy = false;
      this.game.input.reset();
    }
  }

  async showRewards(npcId, lines) {
    if (!lines?.length) return;
    await this.dlg.show({
      npc: npcId,
      title: '받은 보상',
      text: lines.join('\n'),
      options: [{ label: '좋아요!', value: 'ok', primary: true }],
    });
  }

  async talkTo(npcId) {
    const g = this.game;
    const q = g.quests;
    const npc = NPCS[npcId];
    g.bus.emit('npc:talk', { id: npcId });

    // 이 NPC를 만나는 것이 목표인 퀘스트
    for (const id of q.handleTalk(npcId)) {
      await this.dlg.show({ npc: npcId, title: QUESTS[id].title, text: QUESTS[id].reportText, options: [{ label: '보상 받기', value: 'ok', primary: true }], dismissible: false });
      await this.showRewards(npcId, q.claim(id));
    }
    // 끝낸 퀘스트 보고
    for (const id of q.completeFor(npcId)) {
      await this.dlg.show({ npc: npcId, title: `✅ ${QUESTS[id].title}`, text: QUESTS[id].reportText || '고마워요!', options: [{ label: '보상 받기', value: 'ok', primary: true }], dismissible: false });
      await this.showRewards(npcId, q.claim(id));
    }

    for (;;) {
      const avail = q.availableFor(npcId);
      const active = q.activeFor(npcId);
      const opts = [];
      if (npc.role === 'skill') {
        opts.push({ label: '✨ 스킬 배우기', value: 'skills', primary: true });
        const nr = g.nextRank();
        if (nr && g.save.level >= nr.level) opts.push({ label: `🎖️ 승급 시험 (${nr.name})`, value: 'rank', primary: true });
      }
      if (npc.role === 'shop') opts.push({ label: '🛒 물건 사고팔기', value: 'shop', primary: true });
      if (npc.role === 'forge') opts.push({ label: '🔨 장비 강화하기', value: 'forge', primary: true });
      for (const id of avail) opts.push({ label: `📜 ${QUESTS[id].title}`, value: `q:${id}`, primary: true });
      opts.push({ label: '다음에', value: 'bye' });

      let text;
      if (npc.role === 'board') {
        if (avail.length) text = '새로운 의뢰가 붙어 있어요. 어떤 일을 맡아 볼까요?';
        else if (active.length) text = `진행 중인 의뢰: 「${QUESTS[active[0]].title}」 (${q.progressText(active[0])})`;
        else {
          const locked = QUEST_ORDER.filter((id) => QUESTS[id].giver === npcId && q.status(id) === 'locked');
          text = locked.length ? '지금은 맡을 수 있는 의뢰가 없어요.\n레벨이 오르면 새로운 의뢰가 붙을 거예요!' : npc.lines[0];
        }
      } else if (avail.length) {
        text = npcId === 'fairy' ? '모험가님, 부탁하고 싶은 일이 있어요!' : '자네에게 맡기고 싶은 일이 있다네.';
      } else if (active.length) {
        text = `「${QUESTS[active[0]].title}」 잘 부탁해요!\n(${q.progressText(active[0])})`;
      } else {
        text = pick(npc.lines);
      }

      const choice = await this.dlg.show({ npc: npcId, text, options: opts });
      if (!choice || choice === 'bye') break;
      if (choice === 'skills') {
        g.ui.openSkills('master');
        break;
      }
      if (choice === 'rank') {
        await g.rankUp();
        break;
      }
      if (choice === 'shop') {
        g.ui.openShop();
        break;
      }
      if (choice === 'forge') {
        g.ui.openForge();
        break;
      }
      if (choice.startsWith('q:')) {
        const id = choice.slice(2);
        const qd = QUESTS[id];
        const ans = await this.dlg.show({
          npc: npcId,
          title: `📜 ${qd.title}`,
          text: `${qd.desc}\n\n보상: ${q.rewardText(id)}`,
          options: [{ label: '수락하기', value: 'yes', primary: true }, { label: '다음에', value: 'no' }],
        });
        if (ans === 'yes') {
          q.accept(id);
          // 이미 해낸 목표라면 바로 보고
          if (q.status(id) === 'complete') {
            await this.dlg.show({ npc: npcId, title: `✅ ${qd.title}`, text: qd.reportText || '고마워요!', options: [{ label: '보상 받기', value: 'ok', primary: true }], dismissible: false });
            await this.showRewards(npcId, q.claim(id));
          }
        }
        if (!q.availableFor(npcId).length) break;
      }
    }
  }

  // 룬 돌·룬 기둥·부서진 다리처럼 "수학으로 깨우는" 물건
  async rune(obj) {
    const g = this.game;
    const s = g.save;
    const name = obj.name || '고대 룬 돌';
    const portrait = obj.portrait || 'rune';
    if (s.activatedRunes.includes(obj.id)) {
      await this.dlg.show({ npc: portrait, name, text: obj.doneText || '룬이 푸른빛으로 은은하게 빛나고 있어요.' });
      return;
    }
    const questActive = QUEST_ORDER.some((id) => {
      const qd = QUESTS[id];
      return qd.type === 'rune' && (qd.target === obj.id || qd.targets?.includes(obj.id)) && g.quests.status(id) === 'active';
    });
    if (!questActive) {
      await this.dlg.show({ npc: portrait, name, text: obj.idleText || '「÷」 무늬가 새겨진 신비한 돌이에요.\n아직은 아무 반응이 없어요. (룬 할아버지께 여쭤 볼까요?)' });
      return;
    }
    const ans = await this.dlg.show({
      npc: portrait, name,
      text: obj.promptText || '돌에 새겨진 수학의 룬이 희미하게 깜빡여요.\n문제를 풀어 룬을 깨워 볼까요?',
      options: [{ label: obj.actionLabel || '룬 깨우기', value: 'go', primary: true }, { label: '다음에', value: 'no' }],
    });
    if (ans !== 'go') return;
    const res = await g.math.start({
      context: 'quest', title: obj.mathTitle || '고대 룬 깨우기',
      npcLine: '룬에 새겨진 문제를 풀면 잠든 룬이 깨어나요.',
      successText: obj.actionLabel || '룬 깨우기', allowLater: true,
    });
    if (!res.correct) return;
    s.activatedRunes.push(obj.id);
    g.audio.playSfx('sealUnlock');
    const [b1, b2] = obj.doneBanner || ['룬 활성화!', '고대 룬이 깨어났어요'];
    g.ui.banner(b1, b2);
    g.bus.emit('rune:activated', { id: obj.id });
    // 이 룬으로 열리는 문이 있으면 알려 주기
    const door = g.scene?.interactables?.find((o) => o.kind === 'door' && o.runes?.includes(obj.id));
    if (door && door.runes.every((id) => s.activatedRunes.includes(id))) {
      setTimeout(() => {
        g.ui.banner('봉인된 문이 열렸다!', '동굴 깊은 곳으로 가 보세요');
        g.audio.playSfx('sealUnlock');
      }, 1500);
    }
    g.markDirty('rune', { immediate: true });
  }

  // 던전·마을 장치: 퀘스트와 상관없이 언제든 수학 문제로 작동 (그 마을 단원 문제)
  async switchDevice(obj) {
    const g = this.game;
    const s = g.save;
    if (s.activatedRunes.includes(obj.id)) {
      await this.dlg.show({ npc: 'rune', name: obj.name, text: obj.doneText });
      return;
    }
    const ans = await this.dlg.show({
      npc: 'rune', name: obj.name, text: `${obj.idleText}\n\n${obj.promptText}`,
      options: [{ label: obj.actionLabel || '작동하기', value: 'go', primary: true }, { label: '다음에', value: 'no' }],
    });
    if (ans !== 'go') return;
    const res = await g.math.start({
      context: 'quest', title: obj.mathTitle || obj.name, unit: obj.unit,
      npcLine: '문제를 풀면 장치가 움직여요.', successText: obj.actionLabel || '작동하기', allowLater: true,
    });
    if (!res.correct) return;
    s.activatedRunes.push(obj.id);
    g.audio.playSfx('sealUnlock');
    g.world.shake(5);
    const [b1, b2] = obj.doneBanner || ['장치 작동!', '길이 열렸어요'];
    g.ui.banner(b1, b2);
    g.bus.emit('rune:activated', { id: obj.id });
    g.markDirty('switch', { immediate: true });
  }

  // 워프포인트: 처음 만지면 활성화(빛 기둥 + 안내) → 월드맵에서 이 마을로 빠른 이동 가능
  async warp(obj) {
    const g = this.game;
    const s = g.save;
    const v = getVillage(obj.village);
    if (!Array.isArray(s.warpPoints)) s.warpPoints = ['fractionValley'];
    if (s.warpPoints.includes(obj.village)) {
      const ans = await this.dlg.show({
        npc: 'rune', name: `${v.name} 워프포인트`,
        text: '워프포인트가 푸른빛으로 빛나고 있어요.\n월드맵에서 활성화한 마을로 순간이동할 수 있어요.',
        options: [{ label: '🗺️ 월드맵 열기', value: 'map', primary: true }, { label: '닫기', value: 'no' }],
      });
      if (ans === 'map') g.ui.openWorldMap();
      return;
    }
    s.warpPoints.push(obj.village);
    if (g.scene) g.scene.warpBurstAt = g.time;
    g.audio.playSfx('sealUnlock');
    g.world.shake(4);
    g.ui.banner('워프포인트 활성화!', '새로운 워프포인트가 활성화되었습니다!');
    g.markDirty('warp', { immediate: true });
    await this.dlg.show({
      npc: 'rune', name: `${v.name} 워프포인트`,
      text: `새로운 워프포인트가 활성화되었습니다!\n이제 월드맵에서 「${v.name}」(으)로 빠르게 이동할 수 있어요.`,
      options: [{ label: '좋아요!', value: 'ok', primary: true }],
    });
  }

  heal() {
    const g = this.game;
    const max = g.equipment.totals().maxHp;
    if (g.save.stats.hp >= max) {
      g.ui.toast('💖 이미 건강해요! 샘물이 반짝반짝 빛나요.', 'info');
      return;
    }
    const healed = max - Math.floor(g.save.stats.hp);
    g.save.stats.hp = max;
    g.audio.playSfx('heal');
    g.renderer.addFloater(`+${healed} HP`, g.player.x, g.player.y - 50, '#7dff9a', 22);
    g.ui.toast('💖 치유의 샘에서 HP를 모두 회복했어요!', 'ok');
    g.markDirty('heal');
  }

  async door(obj) {
    const g = this.game;
    const s = g.save;
    const n = obj.runes.filter((id) => s.activatedRunes.includes(id)).length;
    if (n >= obj.runes.length) {
      g.ui.toast(s.bossesDefeated.includes(g.scene.bossKey || g.scene.village) ? '문 너머는 이제 조용해요.' : '문이 열려 있어요… 안쪽에서 무시무시한 기운이 느껴져요!', 'info');
      return;
    }
    await this.dlg.show({
      npc: 'door', name: '봉인된 문',
      text: `문에 강력한 수학의 봉인이 걸려 있어요.\n동굴 안의 룬 기둥 ${obj.runes.length}개를 모두 깨우면 열릴 것 같아요. (${n} / ${obj.runes.length})`,
    });
  }

  async chest(obj) {
    const g = this.game;
    const s = g.save;
    if (s.openedChests.includes(obj.id)) {
      g.ui.toast('이미 열어 본 상자예요.', 'info');
      return;
    }
    if (obj.golden) {
      const ans = await this.dlg.show({
        npc: 'goldenChest', name: '수학 보물상자',
        text: '수학의 봉인이 걸린 황금 상자예요!\n문제를 풀면 봉인이 풀리고 귀한 보물을 얻을 수 있어요.',
        options: [{ label: '봉인 풀기', value: 'go', primary: true }, { label: '다음에', value: 'no' }],
      });
      if (ans !== 'go') return;
      const res = await g.math.start({ context: 'chest', allowLater: true });
      if (!res.correct) return;
    }
    const table = CHEST_LOOT[obj.golden ? 'golden' : 'normal'];
    const lines = [];
    const gold = randInt(table.gold[0], table.gold[1]);
    s.gold += gold;
    lines.push(`🪙 ${gold} 골드`);
    const give = (id, qty) => {
      if (g.inventory.add(id, qty)) lines.push(`${ITEMS[id].icon} ${ITEMS[id].name}${qty > 1 ? ` ×${qty}` : ''}`);
      else g.ui.toast(`가방이 가득 차서 ${ITEMS[id].name}을(를) 받지 못했어요.`, 'warn');
    };
    for (const [id, qty] of table.items) give(id, qty);
    if (table.roll.length) {
      const r = weightedPick(table.roll);
      give(r.id, r.qty || 1);
    }
    s.openedChests.push(obj.id);
    s.counters.chestsOpened = (s.counters.chestsOpened || 0) + 1;
    if (obj.golden) s.counters.specialChests = (s.counters.specialChests || 0) + 1;
    g.audio.playSfx('chestOpen');
    g.bus.emit('chest:opened', { id: obj.id, golden: !!obj.golden });
    g.markDirty('chest', { immediate: true });
    await this.dlg.show({ npc: obj.golden ? 'goldenChest' : 'chest', name: obj.golden ? '수학 보물상자' : '나무 상자', title: '상자 안에서 나온 것', text: lines.join('\n'), options: [{ label: '좋아요!', value: 'ok', primary: true }] });
  }
}

function q(game, id) {
  return game.quests.status(id);
}
