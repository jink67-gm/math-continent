// 대화창 얼굴 그림
import { drawRuneMaster, drawFairy, drawBoard, drawRuneStone, drawChest } from './sprites.js';
import { drawChief, drawMerchantStall, drawSmithy, drawFountain, drawRunePillar, drawVillager } from './valleySprites.js';
import { drawTroll } from './bossSprites.js';
import { assets } from './AssetManager.js';
import { npcArtKey, NPC3 } from './envArt.js';

// 대화창 얼굴: NPC 그림이 있으면 윗부분(얼굴·상반신)을 크게
// 새 NPC 초상화(assets/npc3/portraits)·새 사물 그림
const NEW_PORTRAIT = {
  fairy: 'pack4/pipi/portrait', board: 'pack4/boards/quest_board_wood', bridge: 'pack4/bridges/bridge_ns_wood',
  runeMaster: 'npc3/portraits/mysterious_mage', chief: 'npc3/portraits/math_sage', merchant: 'npc3/portraits/traveling_merchant',
  smith: 'npc3/portraits/blacksmith', fountain: 'village2/well', rune: 'dungeon3/ruined_stone_post', pillar: 'dungeon3/tall_ancient_pillar',
  door: 'dungeon3/boss_iron_gate', chest: 'pack4/chests/chest_wood_closed', goldenChest: 'pack4/chests/chest_gold_closed',
};
function newPortraitKey(kind) {
  if (!kind) return null;
  if (kind.includes(':')) {
    const [role, style] = kind.split(':');
    const id = role === 'merchant' ? 'traveling_merchant' : role === 'smith' ? 'blacksmith' : role === 'sage' ? 'mysterious_mage' : NPC3[npcArtKey(role, style)];
    return id ? `npc3/portraits/${id}` : null;
  }
  return NEW_PORTRAIT[kind] || null;
}

function artPortraitKey(kind) {
  if (!kind) return null;
  if (kind.includes(':')) {
    const [role, style] = kind.split(':');
    return `npc/${npcArtKey(role === 'sage' ? 'sage' : role, style) || 'sage'}_talk`;
  }
  const map = {
    runeMaster: 'npc/sage_talk', fairy: 'npc/fairy_talk', chief: 'npc/merchant_talk', merchant: 'npc/alchemist_talk',
    smith: 'npc/blacksmith_talk', fountain: 'buildings/statue', troll: 'monsters/bosses/orc_warlord_idle',
  };
  return map[kind] || null;
}

function drawArtPortrait(c, key, size, canvas, kind, t) {
  const a = assets.get(key);
  if (!a) {
    if (assets.has(key)) assets.load(key).then((img) => { if (img) drawNpcPortrait(canvas, kind, t); });
    return false;
  }
  const { img, m } = a;
  const head = key.startsWith('npc/') ? 0.62 : 1; // 사람은 위쪽 62%만
  const sh = m.h * head;
  const s = Math.max(size / m.w, size / sh) * (key.startsWith('npc/') ? 1.0 : 0.9);
  const dw = m.w * s;
  c.drawImage(img, (size - dw) / 2, key.startsWith('npc/') ? 2 : (size - m.h * s) / 2, dw, m.h * s);
  return true;
}

export function drawNpcPortrait(canvas, kind, t = 0) {
  const c = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = 72;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, size, size);
  // 1) 새 초상화 / 새 사물 그림 (가운데 맞춤)
  const nk = newPortraitKey(kind);
  if (nk) {
    const a = assets.get(nk);
    if (a) {
      const port = nk.includes('/portraits/');
      const s = port ? Math.max(size / a.m.w, size / a.m.h) : Math.min(size / a.m.w, size / a.m.h) * 0.92;
      c.drawImage(a.img, (size - a.m.w * s) / 2, port ? 0 : (size - a.m.h * s) / 2, a.m.w * s, a.m.h * s);
      return;
    }
    if (assets.has(nk)) assets.load(nk).then((img) => { if (img) drawNpcPortrait(canvas, kind, t); });
  }
  const ak = artPortraitKey(kind);
  if (ak && drawArtPortrait(c, ak, size, canvas, kind, t)) return;
  c.save();
  if (kind && kind.includes(':')) {
    const [role, style] = kind.split(':');
    if (role === 'chief') { c.translate(36, 26); c.scale(1.25, 1.25); drawVillager(c, 0, 44, t, { style, robe: '#6f9fe0' }); }
    else if (role === 'merchant') { c.translate(36, 30); c.scale(1.15, 1.15); drawMerchantStall(c, 0, 66, t); }
    else if (role === 'smith') { c.translate(48, 30); c.scale(1.1, 1.1); drawSmithy(c, 0, 46, t); }
    else { c.translate(36, 0); c.scale(0.85, 0.85); drawRuneMaster(c, -6, 104, t); }
    c.restore();
    return;
  }
  switch (kind) {
    case 'runeMaster': c.translate(36, 0); c.scale(0.85, 0.85); drawRuneMaster(c, -6, 104, t); break;
    case 'fairy': c.translate(36, 36); c.scale(1.6, 1.6); drawFairy(c, 0, 34, t); break;
    case 'board': c.translate(36, 62); c.scale(0.75, 0.75); drawBoard(c, 0, 0); break;
    case 'rune': c.translate(36, 70); c.scale(0.8, 0.8); drawRuneStone(c, 0, 0, true, t); break;
    case 'pillar': c.translate(36, 70); c.scale(0.55, 0.55); drawRunePillar(c, 0, 10, false, t); break;
    case 'chief': c.translate(36, 26); c.scale(1.25, 1.25); drawChief(c, 0, 44, t); break;
    case 'merchant': c.translate(36, 30); c.scale(1.15, 1.15); drawMerchantStall(c, 0, 66, t); break;
    case 'smith': c.translate(48, 30); c.scale(1.1, 1.1); drawSmithy(c, 0, 46, t); break;
    case 'fountain': c.translate(36, 52); c.scale(0.6, 0.6); drawFountain(c, 0, 20, t); break;
    case 'troll': c.translate(36, 60); c.scale(0.42, 0.42); drawTroll(c, 0, 60, { t }); break;
    case 'bridge': c.font = '40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🌉', 36, 38); break;
    case 'door': c.font = '40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚪', 36, 38); break;
    default: c.translate(36, 62); drawChest(c, 0, 0, { golden: kind === 'goldenChest' });
  }
  c.restore();
}
