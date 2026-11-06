"""Ninja Adventure(CC0)의 Sword2(곧은 검) 색을 바꿔 한복에 어울리는 환도(조선의 칼)를 만들어요.

  python3 tools/build_hwando.py <Ninja Adventure Items/Weapons/Sword2 폴더>

결과: assets/na/items/Hwando.png (가방·상점 그림) · Hwando_hand.png (손에 든 그림)
  코등이(손잡이 앞 막이) 금빛 · 손잡이 짙은 밤색 · 칼날 밝은 강철색
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'na' / 'items'

GOLD, GOLD_DARK = (222, 178, 76), (158, 112, 44)
GRIP = (76, 50, 42)
STEEL, STEEL_SHADE, STEEL_EDGE = (238, 242, 248), (178, 192, 208), (132, 146, 164)

HAND = {(143, 62, 86): GOLD_DARK, (209, 75, 52): GOLD, (141, 151, 127): GRIP, (242, 234, 241): STEEL, (171, 194, 188): STEEL_SHADE}
ICON = {(242, 234, 241): STEEL, (171, 194, 188): STEEL_SHADE, (141, 151, 127): STEEL_EDGE, (209, 75, 52): GOLD,
        (143, 62, 86): GOLD_DARK, (78, 72, 74): GRIP, (95, 113, 96): GOLD}


def recolor(path, table, out):
    im = Image.open(path).convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and p[:3] in table:
                px[x, y] = table[p[:3]] + (p[3],)
    im.save(out)


recolor(SRC / 'SpriteInHand.png', HAND, OUT / 'Hwando_hand.png')
recolor(SRC / 'Sprite.png', ICON, OUT / 'Hwando.png')
print('ok')
