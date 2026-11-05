"""Zelda-like tilesets (ArMM1998, CC0) Overworld.png 에서 흙절벽 타일만 골라
지금 게임의 풀색(Ninja Adventure)에 맞게 색을 바꿔 작은 시트로 만들어요.

  python3 tools/build_zl_cliffs.py <Overworld.png 경로>

결과: assets/zl/cliff_meadow.png, assets/zl/cliff_forest.png (16px 칸, 가로 4칸)
  줄 0 풀 가장자리(lip) · 1 절벽 윗줄 · 2 가운데 · 3 아랫줄(뿌리·그림자)
  칸 0 왼쪽 끝 · 1 가운데 · 2 오른쪽 끝 · 3 한 칸짜리
  줄 4: 0 왼쪽 옆 테두리 · 1 위쪽 테두리 · 2 오른쪽 옆 테두리 · 3 동굴 구멍
  props.png: 바위·자갈·큰 바위·나무 계단
해골·뼈 같은 그림은 가져오지 않아요.
"""
import sys
from pathlib import Path
from PIL import Image

T = 16
SRC = sys.argv[1]
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'zl'

GREENS = {  # 원래 초록 → (들판, 숲)
    (58, 190, 65): ((173, 188, 58), (116, 163, 52)),
    (106, 221, 75): ((198, 210, 88), (146, 188, 72)),
    (50, 142, 65): ((140, 152, 46), (86, 134, 60)),
    (38, 100, 51): ((96, 108, 36), (58, 98, 50)),
    (46, 202, 53): ((150, 170, 48), (100, 150, 52)),  # 바위 옆 풀포기
}

src = Image.open(SRC).convert('RGBA')


def tile(r, c):
    return src.crop((c * T, r * T, c * T + T, r * T + T))


def single(left, right):
    t = Image.new('RGBA', (T, T))
    t.paste(left.crop((0, 0, 8, T)), (0, 0))
    t.paste(right.crop((8, 0, T, T)), (8, 0))
    return t


def recolor(im, k):
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and p[:3] in GREENS:
                px[x, y] = GREENS[p[:3]][k] + (p[3],)
    return im


def build(k, name):
    sheet = Image.new('RGBA', (4 * T, 5 * T))
    for row, sr in enumerate([11, 12, 13, 14]):
        L, M, R = tile(sr, 4), tile(sr, 5), tile(sr, 6)
        for col, t in enumerate([L, M, R, single(L, R)]):
            sheet.paste(t, (col * T, row * T))
    left = tile(10, 4)
    right = tile(10, 6)
    top = left.rotate(-90)  # 왼쪽 테두리를 돌려 위쪽 테두리로
    for col, t in enumerate([left, top, right, tile(12, 7)]):
        sheet.paste(t, (col * T, 4 * T))
    recolor(sheet, k).save(OUT / name)


def build_props():
    # 4칸 × 3줄: (0,0) 작은 바위 · (1,0) 납작 바위 · (2,0) 자갈 · (3,0) 계단 윗칸
    #            (0,1)~(1,2) 큰 바위 2×2 · (3,1) 계단 아랫칸
    sheet = Image.new('RGBA', (4 * T, 3 * T))
    for col, (r, c) in enumerate([(5, 8), (5, 9), (5, 10), (20, 19)]):
        sheet.paste(tile(r, c), (col * T, 0))
    for dy in range(2):
        for dx in range(2):
            sheet.paste(tile(11 + dy, 9 + dx), (dx * T, (1 + dy) * T))
    sheet.paste(tile(21, 19), (3 * T, T))
    recolor(sheet, 0).save(OUT / 'props.png')


build(0, 'cliff_meadow.png')
build(1, 'cliff_forest.png')
build_props()
print('ok')
