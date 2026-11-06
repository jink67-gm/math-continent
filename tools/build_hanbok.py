"""Ninja Adventure(CC0) 캐릭터의 옷·피부·머리 색을 바꿔 한복 주인공을 만들어요.

  python3 tools/build_hanbok.py <Ninja Adventure Actor/Characters 폴더>

  남: Boy → HanbokBoy     검은 도포 · 흰 깃 · 금빛 띠 · 검은 바지 · 검은 머리 · 밝은 피부
  여: Princess → HanbokGirl   흰 저고리 · 분홍 치마 · 분홍 고름 · 밝은 피부

결과: assets/na/chars/HanbokBoy, HanbokGirl (SpriteSheet.png · Faceset.png)
얼굴 그림(Faceset)은 입·볼 색이 옷 색과 같은 곳이 있어서, 옷은 아래쪽만 · 머리는 위에서 이어진 칸만 바꿔요.
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'na' / 'chars'

ROBE = (56, 54, 70)       # 검은 도포 (외곽선보다 살짝 밝게)
ROBE_DARK = (40, 38, 52)
COLLAR = (236, 234, 244)  # 흰 깃
BELT = (214, 170, 72)     # 금빛 띠
PANTS = (34, 33, 44)
PANTS_DARK = (24, 23, 30)

BOY = {
    'skin': {(239, 145, 79): (250, 204, 170)},
    'hair': {(209, 75, 52): (46, 42, 54), (150, 83, 64): (30, 28, 38)},
    'clothes': {
        (227, 241, 245): ROBE,          # 흰 셔츠 → 검은 도포
        (242, 234, 241): ROBE,
        (209, 75, 52): ROBE_DARK,       # 빨간 웃옷(몸 아래쪽) → 도포 그늘
        (211, 162, 192): COLLAR,        # 분홍 넥타이·셔츠 주름 → 흰 깃
        (84, 135, 137): PANTS,
        (46, 57, 57): PANTS_DARK,
    },
    'belt_above': {(84, 135, 137), (46, 57, 57)},  # 바지 바로 위 옷 칸은 금빛 띠
}
GIRL = {
    'skin': {(163, 117, 78): (247, 208, 180), (150, 83, 64): (232, 172, 142)},
    'hair': {},
    'clothes': {
        (241, 196, 113): (246, 243, 250),   # 노랑 → 흰 저고리
        (215, 139, 74): (243, 168, 192),    # 주황 → 분홍 치마
        (141, 151, 127): (226, 128, 162),   # 회녹색 → 진분홍 (고름·치마 아래)
        (171, 194, 188): (252, 212, 226),   # 밝은 회색 → 연분홍
    },
}
GIRL_FACE = {
    'skin': GIRL['skin'], 'hair': {},
    'clothes': {
        (241, 196, 113): (246, 243, 250),   # 저고리
        (215, 139, 74): (222, 214, 230),    # 저고리 그늘
        (141, 151, 127): (236, 140, 172),   # 목걸이 → 분홍 고름
    },
}


def recolor(im, spec, clothes_from_y=0, seed_rows=8, frame=16):
    """seed_rows: 칸(frame) 안에서 위쪽 몇 줄의 머리색을 머리로 보고, 거기서 이어진 머리색 칸만 머리로 바꿔요.
    머리와 같은 색이지만 떨어져 있는 칸(옷)은 옷 색으로 바꿔요."""
    im = im.convert('RGBA').copy()
    src = im.copy().load()
    px = im.load()
    w, h = im.size
    hair = spec.get('hair', {})
    skin = spec.get('skin', {})
    clothes = spec['clothes']
    cell = lambda x, y: (x // frame, y // frame)
    hair_cells = set()
    if hair:
        stack = [(x, y) for y in range(h) for x in range(w) if (y % frame) < seed_rows and src[x, y][3] and src[x, y][:3] in hair]
        while stack:
            x, y = stack.pop()
            if (x, y) in hair_cells:
                continue
            hair_cells.add((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and cell(nx, ny) == cell(x, y) and (nx, ny) not in hair_cells \
                        and src[nx, ny][3] and src[nx, ny][:3] in hair:
                    stack.append((nx, ny))
    belt_above = spec.get('belt_above', set())
    raw_skin = set(skin)

    def is_eye(x, y):
        # 흰 눈동자는 셔츠와 같은 흰색이라, 바로 위나 아래가 피부면 눈으로 보고 그대로 둬요
        if src[x, y][:3] not in ((227, 241, 245), (242, 234, 241)) or (frame == 16 and y % frame > 11):
            return False
        return any(0 <= y + dy < h and src[x, y + dy][3] and src[x, y + dy][:3] in raw_skin for dy in (-1, 1))

    for y in range(h):
        for x in range(w):
            p = src[x, y]
            if not p[3]:
                continue
            c = p[:3]
            if (x, y) in hair_cells:
                px[x, y] = hair[c] + (p[3],)
            elif c in skin:
                px[x, y] = skin[c] + (p[3],)
            elif y >= clothes_from_y and c in clothes and not is_eye(x, y):
                new = clothes[c]
                above = src[x, y - 1] if y else (0, 0, 0, 0)
                # 얼굴 바로 아래 가슴 칸(머리색과 같은 빨간 스카프)은 흰 깃으로
                if c in hair and above[3] and above[:3] in raw_skin:
                    px[x, y] = COLLAR + (p[3],)
                    continue
                # 띠: 바지 바로 위의 옷 칸 (외곽선에 붙은 소매 끝은 빼고)
                if belt_above and c not in belt_above and new != COLLAR and (y + 1) % frame and y + 1 < h and src[x, y + 1][:3] in belt_above:
                    l = src[x - 1, y] if x else (0, 0, 0, 0)
                    r = src[x + 1, y] if x + 1 < w else (0, 0, 0, 0)
                    if l[3] and r[3] and l[:3] != (20, 27, 27) and r[:3] != (20, 27, 27):
                        new = BELT
                px[x, y] = new + (p[3],)
    return im


def build(src, name, spec, face_spec):
    d = OUT / name
    d.mkdir(parents=True, exist_ok=True)
    recolor(Image.open(SRC / src / 'SpriteSheet.png'), spec).save(d / 'SpriteSheet.png')
    recolor(Image.open(SRC / src / 'Faceset.png'), face_spec, clothes_from_y=29, seed_rows=12, frame=10 ** 6).save(d / 'Faceset.png')


build('Boy', 'HanbokBoy', BOY, {**BOY, 'belt_above': set()})
build('Princess', 'HanbokGirl', GIRL, GIRL_FACE)
print('ok')
