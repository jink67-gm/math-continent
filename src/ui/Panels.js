// 상점 · 가방(장비 다섯 칸) · 대장간(강화) · 능력 창(능력치·스킬) · 빠른 이동 · 지도
// 룬 창처럼 게임 화면 위에 HTML로 띄워요. 열려 있는 동안 세상은 멈춰요.

import {
  WEAPONS, ARMORS, SLOTS, SLOT_NAMES, MAX_PLUS, ENHANCE_RATE, MATH_BONUS, MATH_MAX, STONE, STONE2, POTION,
  itemDef, slotOf, shopList, enhanceCost, plusBonus, giveItem, weaponOf,
} from '../data/items.js';
import { statsOf, refreshMax, STATS, REGION_MIN_LV } from '../data/rules.js';
import { skillsFor, skillAt, skillCap, SKILL_KEYS, SKILL_MAX_LV } from '../data/skills.js';
import { escapeHtml } from '../math/util.js';

const IMG = (path) => `assets/${path}`;

// 창 하나 열기 → 닫히면 끝나는 Promise
function openPanel(game, title, render, { wide = false } = {}) {
  return new Promise((resolve) => {
    game.panelOpen = true;
    const kb = game.input.keyboard;
    if (kb) kb.enabled = false;
    const root = document.createElement('div');
    root.className = 'rune-backdrop';
    document.body.appendChild(root);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
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
      const s = game.registry.get('player');
      root.innerHTML = `<div class="rune-card panel-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="panel-head"><div class="rune-title">${escapeHtml(title)}</div>
        <div class="panel-gold">💰 ${s.gold} G · <img class="inline-icon" src="${IMG(STONE.icon)}" alt="">${s.stones || 0} · <img class="inline-icon" src="${IMG(STONE2.icon)}" alt="">${s.stones2 || 0}</div>
        <button class="rune-x" type="button" data-close aria-label="닫기">✕</button></div>
        <div class="panel-body"></div>
        <div class="rune-foot"><button class="rune-btn ghost" type="button" data-close>닫기</button></div></div>`;
      root.querySelectorAll('[data-close]').forEach((b) => { b.onclick = close; });
      render(root.querySelector('.panel-body'), paint, close);
    };
    root.addEventListener('keydown', (e) => e.stopPropagation());
    paint();
  });
}

function sfx(game, key, volume = 0.45) {
  try { game.sound.play(key, { volume }); } catch { /* 괜찮아요 */ }
}

// 누른 줄이 통통 튀고, 단추 위로 「+1」 같은 글자가 떠올라요 (다시 그린 뒤에 불러요)
function bump(body, selector, text) {
  const btn = body.querySelector(selector);
  const rowEl = btn?.closest('.panel-row');
  if (!rowEl) return;
  rowEl.classList.add('bump');
  if (!text) return;
  rowEl.style.position = 'relative';
  const pop = document.createElement('span');
  pop.className = 'plus-pop';
  pop.textContent = text;
  pop.style.right = `${Math.max(8, rowEl.getBoundingClientRect().right - btn.getBoundingClientRect().right + btn.offsetWidth / 2 - 12)}px`;
  pop.style.top = '-6px';
  rowEl.appendChild(pop);
  setTimeout(() => pop.remove(), 750);
}

function statLine(d, plus = 0) {
  if (!d) return '';
  const pb = plusBonus(d, plus);
  const parts = [];
  if (d.atk || pb.atkPct) parts.push(`공격 +${d.atk || 0}${pb.atkPct ? ` (+${Math.round(pb.atkPct * 100)}%)` : ''}`);
  if (d.def || pb.def) parts.push(`방어 +${(d.def || 0) + (pb.def || 0)}`);
  if (d.hp || pb.hp) parts.push(`HP +${(d.hp || 0) + (pb.hp || 0)}`);
  if (d.sp) parts.push(`SP +${d.sp}`);
  if (d.crit || pb.crit) parts.push(`치명타 +${(d.crit || 0) + (pb.crit || 0)}%`);
  if (d.mag) parts.push(`스킬 피해 +${d.mag}%`);
  if (d.speed) parts.push(`이동 +${d.speed}%`);
  return parts.join(' · ') || '기본';
}

function icon(d) {
  const hue = d?.hue ? ` style="filter:hue-rotate(${d.hue}deg) saturate(1.2)"` : '';
  return `<img class="panel-icon" src="${IMG(d.icon)}" alt=""${hue}>`;
}

function row({ d, iconHtml, name, info, button, disabled, data, extra = '' }) {
  return `<div class="panel-row">
    ${iconHtml || (d ? icon(d) : '')}
    <div class="panel-text"><div class="panel-name">${escapeHtml(name)}</div><div class="panel-info">${escapeHtml(info)}</div></div>
    ${extra}${button ? `<button class="rune-btn" type="button" ${disabled ? 'disabled' : ''} ${data}>${escapeHtml(button)}</button>` : ''}
  </div>`;
}

// 지금 지역의 단계 (1~6): 상점 물건
function regionTier(scene) {
  const order = ['fractionValley', 'cubeCity', 'decimalHarbor', 'ratioKingdom', 'circleForest', 'solidPeaks'];
  const i = order.indexOf(scene.info?.village);
  return i < 0 ? 6 : i + 1;
}

// ── 상점 ────────────────────────────────────────
export function openShop(game, scene) {
  const s = game.registry.get('player');
  const list = shopList(regionTier(scene));
  return openPanel(game, '상점', (body, paint) => {
    body.innerHTML = list.map((it, i) => {
      if (it.kind === 'potion') return row({ d: POTION, name: `${POTION.name} (가진 것 ${s.potions}개)`, info: POTION.desc, button: `${POTION.price} G 사기`, disabled: s.gold < POTION.price, data: `data-buy="${i}"` });
      if (it.kind === 'stone') return row({ d: STONE, name: `${STONE.name} (가진 것 ${s.stones || 0}개)`, info: STONE.desc, button: `${STONE.price} G 사기`, disabled: s.gold < STONE.price, data: `data-buy="${i}"` });
      if (it.kind === 'stone2') return row({ d: STONE2, name: `${STONE2.name} (가진 것 ${s.stones2 || 0}개)`, info: STONE2.desc, button: `${STONE2.price} G 사기`, disabled: s.gold < STONE2.price, data: `data-buy="${i}"` });
      const d = itemDef(it.id);
      const sl = slotOf(it.id);
      const owned = s.bag[sl].includes(it.id);
      // 지금 낀 장비와 비교
      const now = statsOf(s);
      const aft = statsOf({ ...s, gear: { ...s.gear, [sl]: it.id } });
      const diff = [['atk', '공격'], ['def', '방어'], ['maxHp', 'HP']].map(([k, l]) => { const v = Math.round(aft[k] - now[k]); return v ? `${l} ${v > 0 ? '▲' : '▼'}${Math.abs(v)}` : ''; }).filter(Boolean).join(' ');
      return `<div class="panel-row">${icon(d)}<div class="panel-text"><div class="panel-name">[${SLOT_NAMES[sl]}] ${nameHtml(d)}</div>
        <div class="panel-info">${escapeHtml(statLine(d))} — ${escapeHtml(d.desc)}${diff ? ` <b class="${diff.includes('▲') ? 'up' : 'down'}">(지금보다 ${escapeHtml(diff)})</b>` : ''}</div></div>
        <button class="rune-btn" type="button" ${owned || s.gold < d.price ? 'disabled' : ''} data-buy="${i}">${owned ? '가지고 있어요' : `${d.price} G 사기`}</button></div>`;
    }).join('') + '<p class="panel-note">지역마다 파는 장비가 달라요. 산 장비는 바로 껴요 (장비 B에서 바꿀 수 있어요).</p>';
    body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
      const it = list[Number(b.dataset.buy)];
      const price = it.kind === 'potion' ? POTION.price : it.kind === 'stone' ? STONE.price : it.kind === 'stone2' ? STONE2.price : itemDef(it.id).price;
      if (s.gold < price) return;
      if (it.kind === 'potion') s.potions++;
      else if (it.kind === 'stone') s.stones = (s.stones || 0) + 1;
      else if (it.kind === 'stone2') s.stones2 = (s.stones2 || 0) + 1;
      else { if (!giveItem(s, it.id)) return; equip(game, scene, it.id); }
      s.gold -= price;
      sfx(game, 'sfx_gold', 0.5);
      scene.saveGame();
      paint();
      bump(document.querySelector('.panel-card .panel-body'), `[data-buy="${b.dataset.buy}"]`, `-${price} G`);
    }));
  });
}

// 장비 끼우기 (강화 단계는 장비마다 기억해요)
export function equip(game, scene, id) {
  const s = game.registry.get('player');
  const slot = slotOf(id);
  if (!slot || !s.bag[slot].includes(id)) return;
  s.gear[slot] = id;
  const before = s.maxHp;
  refreshMax(s);
  if (s.maxHp > before) s.hp += s.maxHp - before;
  s.hp = Math.min(s.hp, s.maxHp);
  s.sp = Math.min(s.sp, s.maxSp);
  scene.player?.setWeapon?.(weaponOf(s).hand);
  if (scene.player) scene.player.speedMul = 1 + statsOf(s).speed;
  sfx(game, 'sfx_equip', 0.5);
}

function statsHead(s) {
  const st = statsOf(s);
  return `<div class="panel-stats">레벨 ${s.lv} · 공격 ${st.atk} · 방어 ${st.def} · HP ${s.maxHp} · SP ${s.maxSp} · 치명타 ${st.crit.toFixed(1)}% · 스킬 피해 +${Math.round(st.mag * 100)}% · 이동 +${Math.round(st.speed * 100)}%</div>`;
}

// ── 장비 등급 (단계별 이름 색) ─────────────────────
export const RARITY = [
  null,
  { name: '일반', color: '#e8e2d0' }, { name: '고급', color: '#7ee07e' }, { name: '희귀', color: '#6fb6ff' },
  { name: '영웅', color: '#c38bff' }, { name: '전설', color: '#ffb347' }, { name: '신화', color: '#ff6a6a' },
];
function rarityOf(d) { return RARITY[Math.max(1, Math.min(6, d?.tier || 1))]; }
function nameHtml(d, plus = 0) {
  const r = rarityOf(d);
  return `<span style="color:${r.color}">${escapeHtml(d.name)}${plus ? ` +${plus}` : ''}</span> <small class="rar" style="border-color:${r.color};color:${r.color}">${r.name}</small>`;
}

// 능력치 비교 줄: 지금 → 바꾸면 (오르면 초록 ▲, 내리면 빨강 ▼)
const STAT_ROWS = [['atk', '공격'], ['def', '방어'], ['maxHp', 'HP'], ['maxSp', 'SP'], ['crit', '치명타', '%'], ['mag', '스킬 피해', '%', 100], ['speed', '이동', '%', 100]];
function statCompare(now, after) {
  return STAT_ROWS.map(([k, label, unit = '', mul = 1]) => {
    const a = Math.round(now[k] * mul * 10) / 10;
    const b = after ? Math.round(after[k] * mul * 10) / 10 : a;
    const d = Math.round((b - a) * 10) / 10;
    const delta = !after || !d ? '' : `<b class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}${unit}</b>`;
    return `<div class="cmp-row"><span>${label}</span><i>${a}${unit}</i>${after && d ? `<em>→ ${b}${unit}</em>` : ''}${delta}</div>`;
  }).join('');
}

// ── 장비 창 (B) ────────────────────────────────────
// 왼쪽: 주인공과 장비 다섯 칸 · 가운데: 고른 칸의 장비 목록 · 오른쪽: 능력치 (고른 장비로 바꾸면 어떻게 변하는지)
export function openBag(game, scene, startSlot = 'weapon') {
  const s = game.registry.get('player');
  let slot = startSlot;
  let pick = null; // 미리 보기로 고른 장비
  return openPanel(game, '장비', (body, paint) => {
    const hero = s.gender === 'female' ? 'HanbokGirl' : 'HanbokBoy';
    const cell = (sl) => {
      const id = s.gear[sl];
      const d = itemDef(id);
      const hue = d?.hue ? ` style="filter:hue-rotate(${d.hue}deg)"` : '';
      const r = d ? rarityOf(d) : null;
      return `<button type="button" class="eq-slot ${sl} ${slot === sl ? 'on' : ''}" data-slot="${sl}" ${r ? `style="border-color:${r.color}"` : ''}>
        ${d ? `<img src="${IMG(d.icon)}" alt=""${hue}>` : '<span class="eq-empty">＋</span>'}
        <span class="eq-label">${SLOT_NAMES[sl]}${d && s.plus?.[id] ? ` +${s.plus[id]}` : ''}</span></button>`;
    };
    const doll = `<div class="eq-doll">
      ${cell('head')}${cell('weapon')}
      <div class="eq-hero"><img src="assets/na/chars/${hero}/Faceset.png" alt=""><div>${escapeHtml(s.name)}<br><small>Lv ${s.lv}</small></div></div>
      ${cell('acc')}${cell('body')}${cell('feet')}</div>`;
    const ids = s.bag[slot] || [];
    const list = ids.length ? ids.map((id) => {
      const d = itemDef(id);
      const on = s.gear[slot] === id;
      const plus = s.plus?.[id] || 0;
      const hue = d.hue ? ` style="filter:hue-rotate(${d.hue}deg)"` : '';
      return `<div class="panel-row eq-item ${pick === id ? 'picked' : ''} ${on ? 'worn' : ''}" data-pick="${id}">
        <img class="panel-icon" src="${IMG(d.icon)}" alt=""${hue}>
        <div class="panel-text"><div class="panel-name">${nameHtml(d, plus)}</div><div class="panel-info">${escapeHtml(statLine(d, plus))}</div></div>
        ${on ? '<span class="eq-worn">착용 중</span>' : `<button class="rune-btn" type="button" data-eq="${id}">착용</button>`}</div>`;
    }).join('') : '<p class="panel-note">이 칸에 낄 장비가 아직 없어요. 상점에서 사거나 상자·퀘스트에서 얻어요.</p>';
    const now = statsOf(s);
    const after = pick && s.gear[slot] !== pick ? statsOf({ ...s, gear: { ...s.gear, [slot]: pick } }) : null;
    body.innerHTML = `<div class="eq-wrap">
      <div class="eq-left">${doll}</div>
      <div class="eq-mid"><div class="panel-sub">${SLOT_NAMES[slot]} (${ids.length})</div>${list}</div>
      <div class="eq-right"><div class="panel-sub">능력치${after ? ' <small>(바꾸면)</small>' : ''}</div>${statCompare(now, after)}
        <p class="panel-note">장비를 한 번 누르면 바꿨을 때 능력치가 어떻게 변하는지 보여요.</p>
        <p class="panel-note">강화석 ${s.stones || 0} · 빛나는 강화석 ${s.stones2 || 0} · 회복약 ${s.potions}</p></div></div>`;
    body.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => { slot = b.dataset.slot; pick = null; sfx(game, 'sfx_click', 0.35); paint(); }));
    body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', (e) => {
      if (e.target.closest('[data-eq]')) return;
      pick = b.dataset.pick;
      sfx(game, 'sfx_click', 0.3);
      paint();
    }));
    body.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.eq;
      equip(game, scene, id);
      pick = null;
      scene.saveGame();
      paint();
      bump(document.querySelector('.panel-card .panel-body'), `[data-pick="${id}"] .eq-worn`, '착용!');
    }));
  }, { wide: true });
}

// ── 퀘스트 목록 (K) ─────────────────────────────────
export function openQuests(game, scene) {
  const q = game.quests;
  return openPanel(game, '퀘스트', (body) => {
    const st = q.step;
    let html = '<div class="panel-sub">메인 이야기</div>';
    html += st ? `<div class="panel-row quest-main"><div class="panel-emoji">★</div><div class="panel-text"><div class="panel-name">${escapeHtml(st.title)}</div><div class="panel-info">${escapeHtml(st.desc)}</div></div></div>`
      : '<p class="panel-note">이 마을의 이야기를 모두 마쳤어요! 다음 마을로 가요.</p>';
    const sides = Object.entries(q.sides);
    const rows = { active: [], ready: [], open: [], done: [] };
    for (const [id, d] of sides) {
      const ss = q.sideState(id);
      const steps = q.stepsOf(d);
      if (ss?.state === 'done') { rows.done.push(`<div class="panel-row done"><div class="panel-emoji">✔</div><div class="panel-text"><div class="panel-name">${escapeHtml(d.title)}</div><div class="panel-info">${escapeHtml(q.npcName(d.giver))}의 부탁 · 완료</div></div></div>`); continue; }
      if (ss?.state === 'ready') { rows.ready.push(`<div class="panel-row"><div class="panel-emoji">?</div><div class="panel-text"><div class="panel-name">${escapeHtml(d.title)}</div><div class="panel-info">다 했어요! ${escapeHtml(q.npcName(d.giver))}에게 알려 줘요</div></div></div>`); continue; }
      if (ss?.state === 'active') {
        const i = ss.step || 0;
        const cur = steps[i];
        const dots = steps.map((_, k) => `<i class="${k < i ? 'ok' : k === i ? 'now' : ''}"></i>`).join('');
        const where = cur.map ? ` · ${ALL_MAPS_NAME(cur.map)}` : '';
        rows.active.push(`<div class="panel-row"><div class="panel-emoji">!</div><div class="panel-text"><div class="panel-name">${escapeHtml(d.title)} <span class="q-steps">${dots}</span></div>
          <div class="panel-info">${escapeHtml(cur.desc)}${cur.need ? ` (${ss.n || 0}/${cur.need})` : ''}${escapeHtml(where)}</div></div></div>`);
        continue;
      }
      if (q.sideAvailable(id)) rows.open.push(`<div class="panel-row"><div class="panel-emoji">💬</div><div class="panel-text"><div class="panel-name">${escapeHtml(d.title)}</div><div class="panel-info">${escapeHtml(q.npcName(d.giver))}이(가) 부탁할 일이 있대요 (머리 위 「!」)</div></div></div>`);
    }
    html += `<div class="panel-sub">마을 사람들의 부탁</div>${[...rows.ready, ...rows.active].join('') || '<p class="panel-note">지금 하고 있는 부탁이 없어요.</p>'}`;
    if (rows.open.length) html += `<div class="panel-sub">새 부탁</div>${rows.open.join('')}`;
    if (rows.done.length) html += `<div class="panel-sub">끝낸 부탁</div>${rows.done.join('')}`;
    const combos = (game.registry.get('player').combos || []);
    html += `<div class="panel-sub">배운 콤보</div><p class="panel-note">기본: J J J 3연타${combos.includes('launch') ? '<br>띄워 베기: J J 쉬고 J — 적을 띄워 공중 연타' : '<br>🔒 띄워 베기 — 큐베른의 검술 사범에게 배워요'}${combos.includes('pierce') ? '<br>모아 찌르기: J 꾹 눌렀다 떼기 — 앞으로 꿰뚫기 (오래 모으면 세 번)' : '<br>🔒 모아 찌르기 — 데시마르의 등대 무사에게 배워요'}</p>`;
    body.innerHTML = html;
  });
  function ALL_MAPS_NAME(id) { return q.rc?.maps[id]?.name || ''; }
}

// ── 대장간 (강화) ───────────────────────────────
// 고른 장비에 골드 + 강화석을 내고 망치를 내리쳐요. 성공 확률은 단계마다 달라요.
// 「문제 풀기」로 확률을 올릴 수 있어요 (한 문제 +15%, 두 문제까지). 실패하면 재료만 쓰고, 다음 확률이 +5% 올라요.
const forge = { id: null, math: 0 };

export function forgeRate(s, id) {
  const plus = s.plus?.[id] || 0;
  if (plus >= MAX_PLUS) return 0;
  const pity = s.pity?.[id] || 0;
  return Math.min(100, ENHANCE_RATE[plus] + pity + (forge.id === id ? forge.math : 0) * MATH_BONUS);
}

export function openForge(game, scene) {
  const s = game.registry.get('player');
  if (!forge.id || !SLOTS.some((slot) => s.gear[slot] === forge.id)) { forge.id = s.gear.weapon; forge.math = 0; }
  return openPanel(game, '대장간', (body, paint, close) => {
    const items = SLOTS.map((slot) => s.gear[slot]).filter(Boolean).filter((id) => itemDef(id));
    let html = '<div class="panel-sub">강화할 장비를 골라요</div><div class="forge-pick">';
    html += items.map((id) => {
      const d = itemDef(id);
      const plus = s.plus?.[id] || 0;
      const hue = d.hue ? ` style="filter:hue-rotate(${d.hue}deg)"` : '';
      return `<button class="forge-item ${forge.id === id ? 'on' : ''}" type="button" data-pick="${id}"><img src="${IMG(d.icon)}" alt=""${hue}><span>${escapeHtml(d.name)}<b>+${plus}</b></span></button>`;
    }).join('');
    html += '</div>';
    const id = forge.id;
    const d = itemDef(id);
    const plus = s.plus?.[id] || 0;
    if (plus >= MAX_PLUS) {
      html += row({ d, name: `${d.name} +${plus}`, info: '최고 단계예요! 더 강해질 수 없어요.' });
    } else {
      const cost = enhanceCost(d, plus);
      const rate = forgeRate(s, id);
      const enough = s.gold >= cost.gold && (s.stones || 0) >= cost.stones && (s.stones2 || 0) >= cost.stones2;
      const need = [`${cost.gold} G`, cost.stones && `강화석 ${cost.stones}개`, cost.stones2 && `빛나는 강화석 ${cost.stones2}개`].filter(Boolean).join(' + ');
      html += row({ d, name: `${d.name} +${plus} → +${plus + 1}`, info: `지금: ${statLine(d, plus)}  ▶  다음: ${statLine(d, plus + 1)}` });
      html += `<div class="forge-rate"><div class="forge-bar"><i style="width:${rate}%"></i></div>
        <div class="forge-num">성공 확률 <b>${rate}%</b>${forge.math ? ` <span>(문제 보너스 +${forge.math * MATH_BONUS}%)</span>` : ''}${s.pity?.[id] ? ` <span>(지난 실패 +${s.pity[id]}%)</span>` : ''}</div></div>`;
      html += `<p class="panel-note">필요한 재료: ${need}${enough ? '' : ' — <b class="bad">재료가 모자라요</b>'}</p>`;
      html += `<div class="forge-btns">
        <button class="rune-btn ghost" type="button" data-math ${forge.math >= MATH_MAX || rate >= 100 ? 'disabled' : ''}>📜 문제 풀어 확률 올리기 (+${MATH_BONUS}%) ${forge.math}/${MATH_MAX}</button>
        <button class="rune-btn" type="button" data-hit ${enough ? '' : 'disabled'}>🔨 강화하기</button></div>`;
      html += '<p class="panel-note">실패해도 장비 단계는 그대로예요. 재료만 쓰고, 다음 도전 확률이 5% 올라가요.<br>강화석은 몬스터(특히 금빛 정예 몬스터)·상자·보스·상점에서 얻어요.</p>';
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      if (forge.id !== b.dataset.pick) { forge.id = b.dataset.pick; forge.math = 0; }
      paint();
    }));
    body.querySelector('[data-math]')?.addEventListener('click', async () => {
      close();
      const res = await game.runes.start({ context: 'forge', unit: scene.info.unit || 'fractionDivision', allowLater: true, line: '문제를 풀면 망치에 힘이 실려 성공 확률이 올라간다네!' });
      if (res.correct) { forge.math = Math.min(MATH_MAX, forge.math + 1); sfx(game, 'sfx_unlock', 0.4); }
      if (scene.sys.isActive()) openForge(game, scene);
    });
    body.querySelector('[data-hit]')?.addEventListener('click', () => {
      const cost = enhanceCost(d, plus);
      if (s.gold < cost.gold || (s.stones || 0) < cost.stones || (s.stones2 || 0) < cost.stones2) return;
      const rate = forgeRate(s, id);
      s.gold -= cost.gold;
      s.stones -= cost.stones;
      s.stones2 -= cost.stones2;
      forge.math = 0;
      s.pity ??= {};
      close();
      if (Math.random() * 100 < rate) {
        s.plus[id] = plus + 1;
        delete s.pity[id];
        refreshMax(s);
        sfx(game, 'sfx_upgrade', 0.55);
        scene.hud?.showBanner('강화 성공!', `${d.name} +${plus + 1} · ${statLine(d, plus + 1)}`);
      } else {
        s.pity[id] = (s.pity[id] || 0) + 5;
        sfx(game, 'sfx_math_wrong', 0.5);
        scene.hud?.showBanner('강화 실패…', `${d.name}은(는) +${plus} 그대로예요. 다음 확률 +5%`);
      }
      scene.saveGame({ now: true });
      scene.time.delayedCall(900, () => scene.sys.isActive() && openForge(game, scene));
    });
  });
}

// ── 능력 창 (C): 능력치 · 스킬 ─────────────────────────
// tab: 'stats' | 'skills' | 'learn'(룬 학자 앞에서: 배우기 단추가 보여요)
export function openCharacter(game, scene, tab = 'stats') {
  const s = game.registry.get('player');
  let cur = tab === 'learn' ? 'skills' : tab;
  const learnHere = tab === 'learn';
  let pickSlotFor = null;
  return openPanel(game, '능력', (body, paint, close) => {
    const tabs = `<div class="panel-tabs">
      <button type="button" class="${cur === 'stats' ? 'on' : ''}" data-tab="stats">능력치 ${s.statPts ? `<b>${s.statPts}</b>` : ''}</button>
      <button type="button" class="${cur === 'skills' ? 'on' : ''}" data-tab="skills">스킬 ${s.skillPts ? `<b>${s.skillPts}</b>` : ''}</button></div>`;
    let html = tabs;
    if (cur === 'stats') {
      html += statsHead(s);
      html += `<div class="panel-sub">능력치 포인트: <b class="pts">${s.statPts || 0}</b> (레벨업 +3 · 성장 시험 맞히면 +2)</div>`;
      for (const [k, d] of Object.entries(STATS)) {
        const v = s.stat?.[k] || 0;
        html += row({ iconHtml: `<div class="panel-emoji">${d.icon}</div>`, name: `${d.name} ${v}`, info: d.desc, button: '+1', disabled: !s.statPts, data: `data-up="${k}"`,
          extra: s.statPts >= 5 ? `<button class="rune-btn ghost" type="button" data-up5="${k}">+5</button>` : '' });
      }
    } else {
      const pool = skillsFor(s);
      const mag = statsOf(s).mag;
      html += `<div class="panel-sub">스킬 포인트: <b class="pts">${s.skillPts || 0}</b> (레벨업마다 +1 · 배우기 1 · 단계 올리기 1)</div>`;
      html += '<div class="slot-row">' + SKILL_KEYS.map((key, i) => {
        const sk = pool.find((k) => k.id === s.slots[i]);
        return `<div class="slot-box"><span class="slot-key">${game.device?.input?.touch ? i + 1 : key}</span>${sk ? escapeHtml(sk.name) : '<i>비어 있음</i>'}</div>`;
      }).join('') + '</div>';
      if (pickSlotFor) html += `<p class="panel-note pick">「${escapeHtml(pool.find((k) => k.id === pickSlotFor)?.name || '')}」을(를) 끼울 칸을 고르세요 ↓ 각 스킬 오른쪽의 칸 단추</p>`;
      for (const k of pool) {
        const learned = s.learned.includes(k.id);
        const lv = s.skillLv?.[k.id] || 1;
        const at = skillAt(k, lv, mag);
        const info = `${k.desc} · SP ${at.sp} · 대기 ${(at.cd / 1000).toFixed(1)}초${at.mult ? ` · 위력 ×${at.mult.toFixed(2)}` : ''}`;
        const iconHtml = `<div class="panel-emoji skill">${learned ? '✨' : s.lv >= k.lv ? '📖' : '🔒'}</div>`;
        if (!learned) {
          const can = s.lv >= k.lv;
          const btn = !can ? `Lv ${k.lv}` : learnHere ? '배우기' : '룬 학자에게';
          html += row({ iconHtml, name: `${k.name} (Lv ${k.lv}부터)`, info: k.desc, button: btn, disabled: !can || !learnHere || !s.skillPts, data: `data-learn="${k.id}"` });
          continue;
        }
        const cap = skillCap(k, s.lv);
        const slotBtns = SKILL_KEYS.map((key, i) => `<button type="button" class="slot-btn ${s.slots[i] === k.id ? 'on' : ''}" data-slot="${k.id}:${i}">${game.device?.input?.touch ? i + 1 : key}</button>`).join('');
        html += row({ iconHtml, name: `${k.name}  ${lv}/${SKILL_MAX_LV}단계`, info: `${info}${lv < SKILL_MAX_LV && lv >= cap ? ` · 다음 단계는 Lv ${k.lv + lv * 3}부터` : ''}`,
          button: lv >= SKILL_MAX_LV ? '최고 단계' : '단계 +1', disabled: lv >= SKILL_MAX_LV || lv >= cap || !s.skillPts, data: `data-lvup="${k.id}"`, extra: `<div class="slot-btns">${slotBtns}</div>` });
      }
      html += `<p class="panel-note">새 스킬은 마을의 룬 학자에게 골라서 배워요. 배운 스킬은 오른쪽 ${SKILL_KEYS.join('·')} 단추로 원하는 칸에 끼워요.</p>`;
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.tab; paint(); }));
    const upStat = (k, n) => {
      n = Math.min(n, s.statPts || 0);
      if (!n) return;
      s.stat[k] = (s.stat[k] || 0) + n;
      s.statPts -= n;
      const before = s.maxHp;
      refreshMax(s);
      if (s.maxHp > before) s.hp += s.maxHp - before;
      sfx(game, 'sfx_confirm', 0.45);
      scene.saveGame();
      paint();
      bump(root(), `[data-up="${k}"]`, `+${n}`);
    };
    const root = () => document.querySelector('.panel-card .panel-body');
    body.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => upStat(b.dataset.up, 1)));
    body.querySelectorAll('[data-up5]').forEach((b) => b.addEventListener('click', () => upStat(b.dataset.up5, 5)));
    body.querySelectorAll('[data-lvup]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.lvup;
      if (!s.skillPts) return;
      s.skillLv[id] = (s.skillLv[id] || 1) + 1;
      s.skillPts--;
      sfx(game, 'sfx_unlock', 0.45);
      scene.saveGame();
      paint();
      bump(root(), `[data-lvup="${id}"]`, `${s.skillLv[id]}단계!`);
    }));
    body.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => {
      const [id, i] = b.dataset.slot.split(':');
      const n = Number(i);
      const old = s.slots.indexOf(id);
      if (old >= 0) s.slots[old] = s.slots[n] === id ? null : s.slots[n];
      s.slots[n] = id;
      sfx(game, 'sfx_equip', 0.4);
      scene.hud?.refreshSkills?.();
      scene.saveGame();
      paint();
      bump(document.querySelector('.panel-card .panel-body'), `[data-slot="${id}:${n}"]`);
    }));
    body.querySelectorAll('[data-learn]').forEach((b) => b.addEventListener('click', () => {
      const sk = skillsFor(s).find((k) => k.id === b.dataset.learn);
      close();
      scene.learnSkill(sk);
    }));
  }, { wide: true });
}

// ── 빠른 이동 (마을 샘에서) ───────────────────────────
// 샘을 한 번 쓰면 그 마을이 체크포인트로 등록돼요. 등록한 마을끼리는 바로 이동할 수 있어요.
export async function openTravel(game, scene) {
  const { MAP_REGIONS, ALL_MAPS } = await import('../data/mapRegions.js');
  const s = game.registry.get('player');
  const towns = Object.values(MAP_REGIONS).map((r) => ({ id: r.town, name: r.name, town: ALL_MAPS[r.town]?.name }));
  return openPanel(game, '빠른 이동', (body, paint, close) => {
    body.innerHTML = towns.map((t, i) => {
      const on = s.waypoints.includes(t.id);
      const here = scene.mapId === t.id;
      return row({ iconHtml: `<div class="panel-emoji">${on ? '⛲' : '❔'}</div>`, name: on ? t.name : '???', info: on ? (here ? '지금 있는 마을이에요' : `${t.town}의 샘으로 바로 가요`) : '아직 이 마을의 샘을 만나지 못했어요',
        button: here ? '여기예요' : '이동', disabled: !on || here, data: `data-go="${i}"` });
    }).join('') + '<p class="panel-note">마을의 샘물을 마시면 그 마을이 체크포인트로 등록돼요. 보스와 싸우는 중에는 이동할 수 없어요.</p>';
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const t = towns[Number(b.dataset.go)];
      if (scene.boss?.engaged && scene.boss.alive) { scene.hud?.toast('보스와 싸우는 중에는 이동할 수 없어요'); return; }
      close();
      sfx(game, 'sfx_unlock', 0.4);
      scene.goTo('Map', 'spring', null, t.id);
    }));
  });
}

// ── 지도 (M) ─────────────────────────────────────
// 양피지 지도: 지금 지역의 지도들을 길로 이어 그리고, 가 본 곳 · 지금 있는 곳 · 퀘스트 목표를 보여 줘요.
// 지도마다 자리(node)는 data/r1maps.js · r2maps.js 에 적혀 있어요.
// 아래에는 수학 대륙의 여섯 마을과 혼돈의 첨탑이 이어진 길과 구한 마을을 보여 줘요.
const CONTINENT = [
  ['fractionValley', '프락시아'], ['cubeCity', '큐베른'], ['decimalHarbor', '데시마르'], ['ratioKingdom', '프로포르'],
  ['circleForest', '키르쿠스'], ['solidPeaks', '볼테라'], ['chaosSpire', '카오스피어'],
];

export async function openWorldMap(game, scene) {
  const { MAP_REGIONS } = await import('../data/mapRegions.js');
  const s = game.registry.get('player');
  const q = game.quests;
  const here = scene.mapId;
  const rid = scene.def?.region || 'fractionValley';
  const rc = MAP_REGIONS[rid];
  const MAPS = rc.maps;
  const N = (id) => MAPS[id]?.node;
  const visited = new Set([...(s.visited || []), here].filter(Boolean));
  const target = here && q.rc ? q.mapTarget(here)?.map : null;
  // 친구가 있는 지도 (협동)
  const party = game.party;
  const peerMap = party?.active && party.peer && party.peerState?.s?.startsWith('Map:') ? party.peerState.s.split(':')[1] : null;
  return openPanel(game, '지도', (body, paint, close) => {
    const edges = new Set();
    let lines = '';
    for (const [id, d] of Object.entries(MAPS)) {
      for (const e of d.exits || []) {
        if (!e.map || !N(e.map)) continue;
        const k = [id, e.map].sort().join('-');
        if (edges.has(k)) continue;
        edges.add(k);
        const [x1, y1] = N(id);
        const [x2, y2] = N(e.map);
        const seen = visited.has(id) || visited.has(e.map);
        lines += `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + 12} ${(y1 + y2) / 2 - 10} ${x2} ${y2}" stroke="${seen ? '#7a4a1e' : '#b89a62'}" stroke-width="3" stroke-dasharray="${seen ? '0' : '6 6'}" fill="none"/>`;
      }
    }
    let nodes = '';
    for (const [id, d] of Object.entries(MAPS)) {
      const [x, y] = d.node;
      const town = id === rc.town;
      const v = visited.has(id);
      const cave = d.cave;
      const fill = !v ? '#c9ab6c' : town ? '#c0392b' : cave ? '#5a4a6a' : '#8a5a2a';
      nodes += `<circle cx="${x}" cy="${y}" r="${town ? 13 : 10}" fill="${fill}" stroke="#3b2410" stroke-width="2"/>`;
      nodes += `<text x="${x}" y="${y + 26}" text-anchor="middle" font-size="13" fill="${v ? '#2b1a0a' : '#8a7448'}">${v ? escapeHtml(d.name) : '???'}</text>`;
      if (v && d.subtitle?.startsWith('권장')) nodes += `<text x="${x}" y="${y + 40}" text-anchor="middle" font-size="10" fill="#6b4a22">${escapeHtml(d.subtitle.replace('권장 ', ''))}</text>`;
      if (id === target) nodes += `<text x="${x + 15}" y="${y + 7}" font-size="20" fill="#e0a000" stroke="#3b2410" stroke-width="1">!</text>`;
      if (id === peerMap) nodes += `<g><circle cx="${x}" cy="${y}" r="16" fill="none" stroke="#2fa8e0" stroke-width="3" stroke-dasharray="4 3"/><text x="${x}" y="${y + 54}" text-anchor="middle" font-size="12" fill="#1a6fa0">▲ ${escapeHtml(party.peer.name)}</text></g>`;
      if (id === here) nodes += `<g><circle cx="${x}" cy="${y}" r="18" fill="none" stroke="#ffef7a" stroke-width="3"><animate attributeName="r" values="14;20;14" dur="1.2s" repeatCount="indefinite"/></circle><text x="${x}" y="${y - 16}" text-anchor="middle" font-size="12" fill="#c0392b">▼ 나</text></g>`;
    }
    // 수학 대륙: 마을을 구했는지
    const cleared = (vid) => q.list(vid).length && q.state(vid).main >= q.list(vid).length;
    let chain = '';
    CONTINENT.forEach(([vid, name], i) => {
      const x = 40 + i * 76;
      const done = vid === 'chaosSpire' ? q.passed('zero', 'solidPeaks') : cleared(vid);
      const cur = scene.info.village === vid;
      if (i) chain += `<line x1="${x - 76 + 12}" y1="20" x2="${x - 12}" y2="20" stroke="#7a4a1e" stroke-width="3"/>`;
      chain += `<circle cx="${x}" cy="20" r="11" fill="${done ? '#e0b030' : '#c9ab6c'}" stroke="${cur ? '#c0392b' : '#3b2410'}" stroke-width="${cur ? 4 : 2}"/>`;
      chain += `<text x="${x}" y="46" text-anchor="middle" font-size="11" fill="#2b1a0a">${name}</text>`;
      if (REGION_MIN_LV[vid]) chain += `<text x="${x}" y="58" text-anchor="middle" font-size="9" fill="${s.lv >= REGION_MIN_LV[vid] ? '#3a7a2a' : '#a0402a'}">Lv ${REGION_MIN_LV[vid]}+</text>`;
      if (done) chain += `<text x="${x}" y="25" text-anchor="middle" font-size="12" fill="#3b2410">★</text>`;
    });
    body.innerHTML = `
      <div class="map-parchment">
        <div class="map-title">${escapeHtml(rc.name)}</div>
        <svg viewBox="0 0 540 330" class="map-svg r1" role="img" aria-label="${escapeHtml(rc.name)} 지도">${lines}${nodes}</svg>
        <div class="map-title small">수학 대륙</div>
        <svg viewBox="0 0 540 64" class="map-svg chain" role="img" aria-label="수학 대륙 마을들">${chain}</svg>
        <div class="map-legend">● 가 본 곳 · ??? 아직 안 가 본 곳 · <b>!</b> 지금 퀘스트 목표 · ★ 구한 마을${peerMap ? ' · <span style="color:#1a6fa0">파란 원: 친구</span>' : peerMapOther(party, MAPS)}</div>
      </div>
      ${s.waypoints?.length > 1 ? '<div class="rune-foot"><button class="rune-btn" type="button" data-travel>⛲ 빠른 이동</button></div>' : ''}`;
    body.querySelector('[data-travel]')?.addEventListener('click', () => { close(); setTimeout(() => openTravel(game, scene), 200); });
  });
}

// 친구가 다른 지역에 있으면 어디인지 글로 알려 줘요
function peerMapOther(party, MAPS) {
  if (!party?.active || !party.peer || !party.peerState?.s) return '';
  const [kind, id] = party.peerState.s.split(':');
  if (kind === 'Map' && MAPS[id]) return '';
  return ` · 친구 ${escapeHtml(party.peer.name)}: 다른 지역에 있어요`;
}
