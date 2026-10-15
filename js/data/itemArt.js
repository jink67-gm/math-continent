// 아이템 아이콘 그림 연결표
// 아이템 ID·능력치는 그대로 두고, 보이는 그림만 바꿔요.
// key: assets/items 안의 그림 / f: 색 바꾸기 (같은 그림을 다른 재질처럼 보이게)
import { assets } from '../render/AssetManager.js';
import { ITEMS } from './items.js';

const W = 'items/weapons/';
const A = 'items/armor/';
const C = 'items/accessories/';
const P = 'items/consumables/';
const M = 'items/materials/';

export const ITEM_ART = {
  // 무기
  wood_sword: { key: `${W}dagger`, f: 'sepia(0.7) saturate(1.3)' },
  iron_sword: { key: `${W}sword_iron` },
  wind_sword: { key: `${W}sword_crystal`, f: 'hue-rotate(-50deg) saturate(1.2)' },
  cube_blade: { key: `${W}sword_crystal`, f: 'hue-rotate(40deg)' },
  coral_sword: { key: `${W}dagger`, f: 'sepia(0.5) hue-rotate(-30deg) saturate(2.2)' },
  knight_sword: { key: `${W}sword_iron`, f: 'brightness(1.08) saturate(1.3)' },
  ancient_blade: { key: `${W}staff_nature` },
  crystal_greatsword: { key: `${W}sword_crystal` },
  // 갑옷
  cloth_armor: { key: `${A}armor_plate`, f: 'grayscale(0.8) brightness(1.15)' },
  leather_armor: { key: `${A}armor_plate`, f: 'sepia(0.8) saturate(1.4)' },
  leaf_armor: { key: `${A}armor_plate`, f: 'hue-rotate(-100deg) saturate(1.6)' },
  block_armor: { key: `${A}armor_plate`, f: 'hue-rotate(50deg) saturate(1.4)' },
  sailor_coat: { key: `${A}armor_plate`, f: 'hue-rotate(-20deg) saturate(1.8)' },
  royal_armor: { key: `${A}armor_plate` },
  bark_armor: { key: `${A}armor_plate`, f: 'sepia(1) brightness(0.85) saturate(1.5)' },
  frost_armor: { key: `${A}armor_plate`, f: 'hue-rotate(-40deg) brightness(1.15)' },
  // 장갑
  cotton_gloves: { key: `${A}gloves_leather`, f: 'grayscale(0.9) brightness(1.4)' },
  leather_gloves: { key: `${A}gloves_leather` },
  crab_gloves: { key: `${A}gloves_leather`, f: 'hue-rotate(-30deg) saturate(2.4)' },
  ring_gloves: { key: `${A}gloves_leather`, f: 'hue-rotate(70deg) saturate(1.6)' },
  // 신발
  straw_shoes: { key: `${A}boots_leather`, f: 'sepia(0.6) brightness(1.25)' },
  leather_boots: { key: `${A}boots_leather` },
  spring_boots: { key: `${A}boots_leather`, f: 'hue-rotate(180deg) saturate(1.5)' },
  knight_boots: { key: `${A}boots_leather`, f: 'grayscale(0.5) brightness(1.1)' },
  snow_boots: { key: `${A}boots_leather`, f: 'hue-rotate(170deg) brightness(1.2)' },
  // 장신구
  clover_necklace: { key: `${C}clover` },
  fraction_ring: { key: `${C}ring_sapphire` },
  cube_brooch: { key: `${M}gem_purple` },
  decimal_pendant: { key: `${C}orb_blue` },
  balance_medal: { key: `${C}amulet_amethyst`, f: 'hue-rotate(140deg)' },
  pi_ring: { key: `${C}ring_sapphire`, f: 'hue-rotate(-60deg)' },
  solid_crown: { key: `${C}amulet_amethyst` },
  math_crown: { key: `${M}star` },
  // 소모품
  potion_s: { key: `${P}potion_red`, small: true },
  potion_m: { key: `${P}potion_red` },
  potion_l: { key: `${P}elixir_purple`, f: 'hue-rotate(110deg)' },
  bread: { key: `${P}bread` },
  roast_meat: { key: `${P}meat` },
  // 재료
  slime_jelly: { key: `${P}potion_green` },
  mushroom_spore: { key: `${M}mushroom` },
  bat_wing: { key: `${M}feather`, f: 'hue-rotate(50deg) saturate(1.4) brightness(0.8)' },
  boar_tusk: { key: `${M}fang` },
  leather_scrap: { key: `${M}leather` },
  bone_fragment: { key: 'dungeon3/bones' },
  enhance_stone: { key: `${M}crystal_blue` },
  cube_chip: { key: `${M}rune_stone`, f: 'hue-rotate(-40deg)' },
  gear_part: { key: `${M}ore_stone`, f: 'sepia(0.4)' },
  seashell: { key: `${M}fang` },
  coral: { key: `${M}gem_red`, f: 'hue-rotate(-20deg) saturate(0.8) brightness(1.2)' },
  scale_weight: { key: `${M}ore_stone` },
  knight_crest: { key: `${A}shield` },
  round_leaf: { key: `${M}herb` },
  ring_wood: { key: `${M}wood_log` },
  snow_crystal: { key: `${M}crystal_blue`, f: 'brightness(1.3) saturate(0.6)' },
  prism_shard: { key: `${M}crystal_amber`, f: 'hue-rotate(160deg)' },
};

// 아이템 아이콘 HTML (그림이 없으면 이모지)
export function itemIconHTML(id, { size = 40 } = {}) {
  const def = ITEMS[id];
  if (!def) return '';
  const art = ITEM_ART[id];
  const url = art && assets.url(art.key);
  if (!url) return `<span class="ii-emoji" style="font-size:${Math.round(size * 0.7)}px">${def.icon}</span>`;
  const sz = art.small ? Math.round(size * 0.82) : size;
  return `<img class="ii-img" src="${url}" alt="" draggable="false" style="width:${sz}px;height:${sz}px${art.f ? `;filter:${art.f}` : ''}">`;
}

// 등급 테두리가 있는 아이콘 칸
export function itemBadgeHTML(id, { size = 44, enhance = 0, qty = 0 } = {}) {
  const def = ITEMS[id];
  if (!def) return '';
  return `<span class="ii g-${def.grade}" style="--ii:${size}px">${itemIconHTML(id, { size: Math.round(size * 0.86) })}${enhance ? `<b class="ii-plus">+${enhance}</b>` : ''}${qty > 1 ? `<b class="ii-qty">${qty}</b>` : ''}${def.grade === 'epic' || def.grade === 'legendary' ? '<i class="ii-star">★</i>' : ''}</span>`;
}

// 캔버스(필드에 떨어진 아이템)용
export function drawItemArt(ctx, id, x, y, size) {
  const art = ITEM_ART[id];
  if (!art) return false;
  const a = assets.get(art.key);
  if (!a) return false;
  ctx.save();
  if (art.f && 'filter' in ctx) ctx.filter = art.f;
  const s = size / Math.max(a.m.w, a.m.h);
  ctx.drawImage(a.img, x - (a.m.w * s) / 2, y - (a.m.h * s) / 2, a.m.w * s, a.m.h * s);
  ctx.restore();
  return true;
}
