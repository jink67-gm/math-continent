// 상점(루루) · 가방(장비 바꾸기) · 대장간(강화) 창
// 룬 창처럼 게임 화면 위에 HTML로 띄워요. 열려 있는 동안 세상은 멈춰요.

import { WEAPONS, ARMORS, SHOP, MAX_PLUS, upgradeCost, weaponOf, armorOf } from '../data/items.js';
import { statsOf, refreshMax } from '../data/rules.js';
import { escapeHtml } from '../math/util.js';

const IMG = (path) => `assets/${path}`;

// 창 하나 열기 → 닫히면 끝나는 Promise
function openPanel(game, title, render) {
  return new Promise((resolve) => {
    game.panelOpen = true;
    const kb = game.input.keyboard;
    if (kb) kb.enabled = false;
    const root = document.createElement('div');
    root.className = 'rune-backdrop';
    document.body.appendChild(root);
    const close = () => {
      root.classList.add('closing');
      setTimeout(() => root.remove(), 160);
      game.panelOpen = false;
      if (kb) kb.enabled = true;
      for (const sc of game.scene.getScenes(true)) sc.input?.keyboard?.resetKeys();
      document.removeEventListener('keydown', onKey, true);
      resolve();
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    const paint = () => {
      root.innerHTML = `<div class="rune-card panel-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="panel-head"><div class="rune-title">${escapeHtml(title)}</div>
        <div class="panel-gold">💰 ${game.registry.get('player').gold} G</div></div>
        <div class="panel-body"></div>
        <div class="rune-foot"><button class="rune-btn ghost" type="button" data-close>닫기</button></div></div>`;
      root.querySelector('[data-close]').onclick = close;
      render(root.querySelector('.panel-body'), paint, close);
    };
    root.addEventListener('keydown', (e) => e.stopPropagation());
    paint();
  });
}

function sfx(game, key, volume = 0.45) {
  try { game.sound.play(key, { volume }); } catch { /* 괜찮아요 */ }
}

function statLine(def) {
  const parts = [];
  if (def.atk) parts.push(`공격 +${def.atk}`);
  if (def.sp) parts.push(`SP +${def.sp}`);
  if (def.def) parts.push(`방어 +${def.def}`);
  if (def.hp) parts.push(`HP +${def.hp}`);
  return parts.join(' · ') || '기본';
}

function row({ icon, name, info, button, disabled, data }) {
  return `<div class="panel-row">
    <img class="panel-icon" src="${IMG(icon)}" alt="">
    <div class="panel-text"><div class="panel-name">${escapeHtml(name)}</div><div class="panel-info">${escapeHtml(info)}</div></div>
    ${button ? `<button class="rune-btn" type="button" ${disabled ? 'disabled' : ''} ${data}>${escapeHtml(button)}</button>` : ''}
  </div>`;
}

// ── 상점 ────────────────────────────────────────
export function openShop(game, scene) {
  const s = game.registry.get('player');
  return openPanel(game, '루루 상점', (body, paint) => {
    body.innerHTML = SHOP.map((it, i) => {
      if (it.kind === 'potion') {
        return row({ icon: it.icon, name: `${it.name} (가진 것 ${s.potions}개)`, info: it.desc, button: `${it.price} G 사기`, disabled: s.gold < it.price, data: `data-buy="${i}"` });
      }
      const def = it.kind === 'weapon' ? WEAPONS[it.id] : ARMORS[it.id];
      const owned = (it.kind === 'weapon' ? s.bag.weapons : s.bag.armors).includes(it.id);
      return row({ icon: def.icon, name: def.name, info: `${statLine(def)} — ${def.desc}`, button: owned ? '가지고 있어요' : `${def.price} G 사기`, disabled: owned || s.gold < def.price, data: `data-buy="${i}"` });
    }).join('') + '<p class="panel-note">산 장비는 메뉴 → 가방에서 바꿔 낄 수 있어요.</p>';
    body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
      const it = SHOP[Number(b.dataset.buy)];
      if (it.kind === 'potion') {
        if (s.gold < it.price) return;
        s.gold -= it.price;
        s.potions++;
      } else {
        const def = it.kind === 'weapon' ? WEAPONS[it.id] : ARMORS[it.id];
        const list = it.kind === 'weapon' ? s.bag.weapons : s.bag.armors;
        if (s.gold < def.price || list.includes(it.id)) return;
        s.gold -= def.price;
        list.push(it.id);
        equip(game, scene, it.kind, it.id); // 사면 바로 끼워요
      }
      sfx(game, 'sfx_gold', 0.5);
      scene.saveGame();
      paint();
    }));
  });
}

// 장비 끼우기 (강화 단계는 장비마다 따로 기억해요)
export function equip(game, scene, kind, id) {
  const s = game.registry.get('player');
  const g = s.gear;
  g.plus ??= {};
  if (kind === 'weapon') { g.plus[g.weapon] = g.wPlus || 0; g.weapon = id; g.wPlus = g.plus[id] || 0; }
  else { g.plus[`a_${g.armor}`] = g.aPlus || 0; g.armor = id; g.aPlus = g.plus[`a_${id}`] || 0; }
  const before = s.maxHp;
  refreshMax(s);
  if (s.maxHp > before) s.hp += s.maxHp - before;
  s.hp = Math.min(s.hp, s.maxHp);
  s.sp = Math.min(s.sp, s.maxSp);
  scene.player?.setWeapon?.(weaponOf(s).hand);
  sfx(game, 'sfx_equip', 0.5);
}

// ── 가방 ────────────────────────────────────────
export function openBag(game, scene) {
  const s = game.registry.get('player');
  return openPanel(game, '가방', (body, paint) => {
    const st = statsOf(s);
    const head = `<div class="panel-stats">레벨 ${s.lv} · 공격 ${st.atk} · 방어 ${st.def} · HP ${s.maxHp} · SP ${s.maxSp} · 회복약 ${s.potions}개</div>`;
    const weapons = s.bag.weapons.map((id) => {
      const d = WEAPONS[id];
      const on = s.gear.weapon === id;
      const plus = on ? s.gear.wPlus : s.gear.plus?.[id] || 0;
      return row({ icon: d.icon, name: `${d.name}${plus ? ` +${plus}` : ''}`, info: statLine(d), button: on ? '끼고 있어요' : '끼우기', disabled: on, data: `data-w="${id}"` });
    }).join('');
    const armors = s.bag.armors.map((id) => {
      const d = ARMORS[id];
      const on = s.gear.armor === id;
      const plus = on ? s.gear.aPlus : s.gear.plus?.[`a_${id}`] || 0;
      return row({ icon: d.icon, name: `${d.name}${plus ? ` +${plus}` : ''}`, info: statLine(d), button: on ? '입고 있어요' : '입기', disabled: on, data: `data-a="${id}"` });
    }).join('');
    body.innerHTML = `${head}<div class="panel-sub">무기</div>${weapons}<div class="panel-sub">갑옷</div>${armors}`;
    body.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { equip(game, scene, 'weapon', b.dataset.w); scene.saveGame(); paint(); }));
    body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { equip(game, scene, 'armor', b.dataset.a); scene.saveGame(); paint(); }));
  });
}

// ── 대장간 (강화) ───────────────────────────────
// 골드를 내고 룬을 풀면 +1. 틀려도 골드는 잃지 않아요 (맞혔을 때만 내요).
export function openForge(game, scene) {
  const s = game.registry.get('player');
  return openPanel(game, '쿵쿵 대장간', (body, paint, close) => {
    const w = weaponOf(s);
    const a = armorOf(s);
    const item = (kind, d, plus) => {
      const max = plus >= MAX_PLUS;
      const cost = upgradeCost(plus);
      const effect = kind === 'w' ? '공격력 +15%' : '방어 +1 · HP +6';
      return row({ icon: d.icon, name: `${d.name} +${plus}`, info: max ? '최고 단계예요!' : `다음 강화: ${effect} · ${cost} G`, button: max ? '' : '강화하기', disabled: s.gold < cost, data: `data-up="${kind}"` });
    };
    body.innerHTML = `${item('w', w, s.gear.wPlus || 0)}${item('a', a, s.gear.aPlus || 0)}
      <p class="panel-note">룬 문제를 맞히면 강화돼요. 틀려도 골드는 잃지 않아요.</p>`;
    body.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', async () => {
      const kind = b.dataset.up;
      const key = kind === 'w' ? 'wPlus' : 'aPlus';
      const plus = s.gear[key] || 0;
      const cost = upgradeCost(plus);
      if (plus >= MAX_PLUS || s.gold < cost) return;
      close();
      const res = await game.runes.start({ context: 'forge', unit: scene.info.unit || 'fractionDivision', allowLater: true });
      if (!res.correct) { scene.hud?.toast('다음에 다시 도전해요. 골드는 그대로예요'); return; }
      s.gold -= cost;
      s.gear[key] = plus + 1;
      refreshMax(s);
      sfx(game, 'sfx_upgrade', 0.55);
      scene.hud?.showBanner('강화 성공!', `${kind === 'w' ? weaponOf(s).name : armorOf(s).name} +${plus + 1}`);
      scene.saveGame({ now: true });
    }));
  });
}
