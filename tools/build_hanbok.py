"""Ninja Adventure(CC0) 캐릭터의 옷 색만 바꿔 한복 느낌 주인공을 만들어요.

  python3 tools/build_hanbok.py <Ninja Adventure Actor/Characters 폴더>

  남: Boy → HanbokBoy   흰 저고리 · 빨간 고름 · 남색 바지 · 검은 머리
  여: Princess → HanbokGirl   노랑 저고리 · 다홍 치마 · 빨간 고름

결과: assets/na/chars/HanbokBoy, HanbokGirl (SpriteSheet.png · Faceset.png)
얼굴 그림(Faceset)은 입·볼 색이 옷 색과 같은 곳이 있어서, 옷은 아래쪽만 · 머리는 위에서 이어진 칸만 바꿔요.
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'na' / 'chars'

BOY = {
    'clothes': {
        (227, 241, 245): (240, 238, 226),   # 흰 셔츠 → 흰 저고리 (살짝 따뜻하게)
        (242, 234, 241): (240, 238, 226),
        (211, 162, 192): (206, 44, 62),     # 분홍 넥타이 → 빨간 고름
        (84, 135, 137): (58, 76, 140),      # 청록 바지 → 남색 바지
        (46, 57, 57): (34, 42, 84),
    },
    'hair': {
        (209, 75, 52): (52, 46, 58),        # 주황 머리 → 검은 머리
        (150, 83, 64): (34, 30, 40),
    },
}
GIRL = {
    'clothes': {
        (215, 139, 74): (214, 56, 78),      # 주황 → 다홍 치마
        (141, 151, 127): (176, 36, 62),     # 회녹색 → 진한 다홍 (치마 아래·고름)
        (171, 194, 188): (238, 116, 136),   # 밝은 회색 → 분홍 (치마 밝은 쪽)
    },
    'hair': {},
}
# 얼굴 그림에서는 저고리만 보여요: 목걸이(회녹색)만 빨간 고름으로
GIRL_FACE = {'clothes': {(141, 151, 127): (206, 44, 62)}, 'hair': {}}


def recolor(im, spec, clothes_from_y=0, hair_seed_rows=None):
    im = im.convert('RGBA').copy()
    px = im.load()
    w, h = im.size
    hair = spec['hair']
    # 머리: 위쪽 줄에서 같은 머리색으로 이어진 칸만 (입·볼은 안 바뀌게)
    hair_cells = set()
    if hair:
        rows = hair_seed_rows if hair_seed_rows is not None else range(h)
        stack = [(x, y) for y in rows for x in range(w) if px[x, y][3] and px[x, y][:3] in hair]
        while stack:
            x, y = stack.pop()
            if (x, y) in hair_cells:
                continue
            hair_cells.add((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in hair_cells and px[nx, ny][3] and px[nx, ny][:3] in hair:
                    stack.append((nx, ny))
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if not p[3]:
                continue
            if (x, y) in hair_cells:
                px[x, y] = hair[p[:3]] + (p[3],)
            elif y >= clothes_from_y and p[:3] in spec['clothes']:
                px[x, y] = spec['clothes'][p[:3]] + (p[3],)
    return im


def build(src, name, spec, face_spec, face_clothes_y, face_hair_rows):
    d = OUT / name
    d.mkdir(parents=True, exist_ok=True)
    recolor(Image.open(SRC / src / 'SpriteSheet.png'), spec).save(d / 'SpriteSheet.png')
    recolor(Image.open(SRC / src / 'Faceset.png'), face_spec, face_clothes_y, face_hair_rows).save(d / 'Faceset.png')


build('Boy', 'HanbokBoy', BOY, BOY, 29, range(0, 12))
build('Princess', 'HanbokGirl', GIRL, GIRL_FACE, 29, None)
print('ok')
