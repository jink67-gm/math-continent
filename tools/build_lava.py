"""Ninja Adventure(CC0) TilesetWater.png의 물 색을 용암 색으로 바꿔 TilesetLava.png를 만들어요.

  python3 tools/build_lava.py

  파란 물 → 주황·빨강 용암 (밝기에 따라), 흰 물거품 → 노란 불빛, 물가의 풀·흙 → 검붉은 바위
결과: assets/na/tiles/TilesetLava.png
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'na' / 'tiles'
im = Image.open(ROOT / 'TilesetWater.png').convert('RGBA')
px = im.load()
LAVA = [(122, 24, 20), (186, 48, 24), (232, 92, 30), (255, 150, 48), (255, 206, 96)]
ROCK = [(28, 18, 22), (46, 30, 32), (70, 44, 40), (96, 62, 52)]


def ramp(colors, t):
    t = max(0.0, min(0.999, t))
    i = int(t * (len(colors) - 1))
    f = t * (len(colors) - 1) - i
    a, b = colors[i], colors[min(i + 1, len(colors) - 1)]
    return tuple(round(a[k] + (b[k] - a[k]) * f) for k in range(3))


for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if not a:
            continue
        lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255
        if r > 225 and g > 225 and b > 225:          # 물거품
            c = (255, 222, 128)
        elif b > r + 25 and b >= g - 10:             # 물
            c = ramp(LAVA, lum * 1.15)
        elif (r, g, b) == (20, 27, 27):              # 외곽선은 그대로
            c = (20, 14, 16)
        else:                                        # 물가의 땅
            c = ramp(ROCK, lum)
        px[x, y] = c + (a,)
im.save(ROOT / 'TilesetLava.png')
print('ok')
