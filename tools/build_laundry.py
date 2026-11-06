# 빨래 줄: Ninja Adventure TilesetElement(CC0)의 기둥 두 개 사이에 옷 두 벌 칸을 끼워 넣어 4칸짜리 한 장으로 만들어요.
# 왼쪽 기둥(11) + 옷 칸(14, 15) + 오른쪽 기둥(13), 2~3번째 줄
# 실행: python3 tools/build_laundry.py
from PIL import Image

src = Image.open('assets/na/tiles/TilesetElement.png').convert('RGBA')
out = Image.new('RGBA', (64, 32))
for i, tx in enumerate([11, 14, 15, 13]):
    out.alpha_composite(src.crop((tx * 16, 32, tx * 16 + 16, 64)), (i * 16, 0))
out.save('assets/na/tiles/laundry.png')
print('saved assets/na/tiles/laundry.png')
