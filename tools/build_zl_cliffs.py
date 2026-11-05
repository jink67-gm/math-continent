"""Zelda-like tilesets (ArMM1998, CC0) Overworld.png 에서 흙절벽 타일만 골라
지금 게임의 풀색(Ninja Adventure)에 맞게 색을 바꿔 작은 시트로 만들어요.

  python3 tools/build_zl_cliffs.py <Overworld.png 경로>

결과: assets/zl/cliff_meadow.png, cliff_forest.png, cliff_pink.png, cliff_sand.png, cliff_snow.png (16px 칸, 가로 4칸)
  줄 0 풀 가장자리(lip) · 1 절벽 윗줄 · 2 가운데 · 3 아랫줄(뿌리·그림자)
  칸 0 왼쪽 끝 · 1 가운데 · 2 오른쪽 끝 · 3 한 칸짜리
  줄 4: 0 왼쪽 옆 테두리 · 1 위쪽 테두리 · 2 오른쪽 옆 테두리 · 3 동굴 구멍
  props.png: 바위·자갈·큰 바위·나무 계단
  town.png: 시장 천막·의자·상자·화분 / fountain.png: 분수 3장면
해골·뼈 같은 그림은 가져오지 않아요.
"""
import sys
from pathlib import Path
from PIL import Image

T = 16
SRC = sys.argv[1]
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'zl'

GREENS = {  # 원래 초록 → (들판, 숲, 분홍 꽃잎 땅, 모래, 눈)
    (58, 190, 65): ((173, 188, 58), (116, 163, 52), (255, 203, 169), (255, 173, 93), (242, 234, 241)),
    (106, 221, 75): ((198, 210, 88), (146, 188, 72), (255, 224, 198), (255, 203, 141), (255, 255, 255)),
    (50, 142, 65): ((140, 152, 46), (86, 134, 60), (239, 149, 151), (239, 145, 79), (210, 201, 201)),
    (38, 100, 51): ((96, 108, 36), (58, 98, 50), (196, 108, 118), (214, 108, 56), (168, 160, 172)),
    (46, 202, 53): ((150, 170, 48), (100, 150, 52), (232, 165, 150), (246, 160, 86), (226, 220, 230)),  # 바위 옆 풀포기
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


def block(r, c, w, h):
    return src.crop((c * T, r * T, (c + w) * T, (r + h) * T))


def build_town():
    # 마을 소품 (8칸 × 8줄). 위치는 src/data/assets.js 의 OBJECTS 와 맞춰요.
    sheet = Image.new('RGBA', (8 * T, 8 * T))
    parts = [
        ((22, 18, 5, 4), (0, 0)),   # 시장 천막
        ((4, 28, 3, 2), (5, 0)),    # 긴 의자
        ((0, 30, 2, 2), (5, 2)),    # 나무 상자 2개
        ((20, 26, 4, 2), (0, 4)),   # 과일 상자 4개
        ((1, 32, 1, 2), (4, 4)),    # 큰 화분
        ((2, 33, 1, 1), (5, 4)),    # 꽃 화분
        ((0, 35, 1, 1), (6, 4)),    # 꽃 화분 2
        ((1, 35, 1, 1), (7, 4)),    # 덤불 화분
        ((3, 31, 2, 2), (0, 6)),    # 그루터기
        ((2, 34, 3, 1), (2, 6)),    # 나무 판 (안내판)
    ]
    for (r, c, w, h), (dx, dy) in parts:
        sheet.paste(block(r, c, w, h), (dx * T, dy * T))
    recolor(sheet, 0).save(OUT / 'town.png')
    # 분수 3장면 (48×48 ×3)
    f = Image.new('RGBA', (9 * T, 3 * T))
    for i in range(3):
        f.paste(block(9, 22 + i * 3, 3, 3), (i * 3 * T, 0))
    recolor(f, 0).save(OUT / 'fountain.png')


build(0, 'cliff_meadow.png')
build(1, 'cliff_forest.png')
build(2, 'cliff_pink.png')
build(3, 'cliff_sand.png')
build(4, 'cliff_snow.png')
build_props()
build_town()
print('ok')
