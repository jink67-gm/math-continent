// 게임 시작점
import { Game } from './core/Game.js';

const game = new Game();
window.mathContinent = game; // 개발자 도구에서 확인용

game.boot().catch((err) => {
  console.error(err);
  const layer = document.getElementById('screen-layer');
  layer.innerHTML = `
    <div class="screen loading-screen">
      <div class="loading-text">게임을 시작하지 못했어요 😢<br><small>새로고침해 보세요. 계속 안 되면 선생님께 알려 주세요.</small></div>
    </div>`;
});
