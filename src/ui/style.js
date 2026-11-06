// 글꼴과 글자 모양을 한곳에 모아 둔 곳

// 나눔스퀘어라운드(assets/fonts): 둥글고 또렷해서 작은 글씨도 잘 읽혀요. 굵게(bold)가 기본이에요.
export const FONT = 'NanumSquareRound';

// 게임 세상 확대 배율: 4면 화면에 가로 15칸·세로 8칸쯤 보여요 (3이면 20칸·11칸)
export const ZOOM = 4;

export function textStyle(size = 14, color = '#ffffff', extra = {}) {
  return {
    fontFamily: FONT,
    fontStyle: 'bold',
    fontSize: `${size}px`,
    color,
    stroke: '#1b1208',
    strokeThickness: Math.max(2, Math.round(size / 5)),
    ...extra,
  };
}

// 글자를 또렷하게: 2배로 그리고, 도트 그림용 '뭉툭하게 늘리기' 대신 부드럽게 줄여요
export function crisp(text) {
  text.setResolution(2);
  text.texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return text;
}
