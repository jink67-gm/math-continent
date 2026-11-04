# 수학 대륙 v2 (Phaser로 다시 만드는 중)

기존 게임(저장소 맨 위 폴더)은 그대로 두고, 이 `v2` 폴더에서 마을 하나씩 새로 만들고 있어요.
그림·소리는 기존 `assets` 폴더를 그대로 씁니다.

- 주소: `https://아이디.github.io/math-continent/v2/`
- 로컬에서 볼 때: VS Code Live Server로 **저장소 맨 위 폴더**를 연 뒤 `/v2/`로 들어가기 (`../assets`를 읽어야 해서)

## 지금 들어 있는 것 (1단계: 분수 계곡 마을)
- 타이틀 → 모험가 고르기(남·여, 별명) → 분수 계곡 마을
- 64px 타일로 그린 마을: 큰길, 광장과 치유의 샘, 북쪽 강과 부서진 다리, 연못, ½·¼·⅛ 분수 밭
- 마을 사람 8명 (촌장 모모, 룬 할아버지, 상인 루루, 대장장이 쿵쿵, 경비병, 여관 주인, 꼬마 콩이, 요정 피피)
- 액션 RPG 조작: 8방향 이동, 3단 콤보 공격(J), 스킬(K), 구르기(Space), 대화(E), 회복약(Q)
- 화면 UI: 상태(HP·SP·EXP), 미니맵, 행동 버튼, 빠른 칸, 대화창(초상화·타자 효과), 터치 조이스틱

## 파일
```
v2/
  index.html
  lib/phaser.min.js        Phaser 3.80.1
  fonts/                   갈무리11 (Galmuri11)
  src/main.js              게임 설정
  src/scenes/              Boot(불러오기) · Title · Village · Hud
  src/world/               terrain(타일 지도) · Player · Npc
  src/data/assets.js       쓰는 그림·소리 목록
  src/data/fractionValley.js   마을 지도·건물·소품·NPC 대사 (글자만 바꿔도 반영돼요)
```

## 쓴 재료와 라이선스
| 재료 | 라이선스 |
|---|---|
| Phaser 3.80.1 | MIT (`lib/LICENSE-phaser.md`) |
| 갈무리 (Galmuri) 2.40.3 · quiple | SIL OFL 1.1 (`fonts/OFL-Galmuri.md`) |
| 그림·효과음·배경음악 (`assets/`) | 기존 게임 자료 (출처는 선생님 기록 참고) |
