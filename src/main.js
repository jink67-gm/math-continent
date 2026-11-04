// 수학 대륙 v2 — Phaser 3로 다시 만든 버전
// 화면 크기는 960×540 기준이고, 창 크기에 맞춰 늘어나요.

import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { VillageScene } from './scenes/VillageScene.js';
import { FieldScene } from './scenes/FieldScene.js';
import { HudScene } from './scenes/HudScene.js';
import { SaveManager } from './save/SaveManager.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#14201a',
  pixelArt: true,
  roundPixels: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, VillageScene, FieldScene, HudScene],
};

// 글꼴을 다 받은 뒤에 시작해야 글자가 기본 글꼴로 그려지지 않아요
Promise.all([
  document.fonts.load('16px Galmuri11'),
  document.fonts.load('bold 16px Galmuri11'),
]).catch(() => {}).finally(() => {
  const game = new Phaser.Game(config);
  game.saves = new SaveManager(game.events);
  // 소리 끄기 설정은 이 기기에 기억해요
  try { game.sound.mute = localStorage.getItem('mathContinent.mute') === '1'; } catch { /* 괜찮아요 */ }
  // 창을 닫거나 다른 앱으로 넘어갈 때 바로 저장
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') game.events.emit('save:now');
  });
  window.addEventListener('pagehide', () => game.events.emit('save:now'));
  window.game = game;
});
