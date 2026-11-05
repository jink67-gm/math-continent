// 글꼴과 글자 모양을 한곳에 모아 둔 곳

export const FONT = 'Galmuri11';

// 게임 세상 확대 배율: 4면 화면에 가로 15칸·세로 8칸쯤 보여요 (3이면 20칸·11칸)
export const ZOOM = 4;

export function textStyle(size = 14, color = '#ffffff', extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    stroke: '#1b1208',
    strokeThickness: Math.max(2, Math.round(size / 5)),
    ...extra,
  };
}

// 글자를 또렷하게 (화면이 커져도 덜 번지게)
export function crisp(text) {
  return text.setResolution(2);
}
