# 수학 대륙: 여섯 마을의 봉인

6학년 2학기 수학 액션 RPG. Phaser 3로 마을 하나씩 새로 만들고 있어요.
그림·소리는 `assets` 폴더에 있는 기존 자료를 그대로 씁니다.

- 주소: `https://jink67-gm.github.io/math-continent/`
- 내 컴퓨터에서 볼 때: VS Code Live Server로 이 폴더를 열기 (`index.html`을 더블클릭하면 실행되지 않아요)

## 저장 (Firebase)
- 기존 게임과 같은 Firebase 프로젝트(`math-continent`)·같은 보안 규칙을 써요. 설정값은 `src/save/firebase-config.js`.
- 익명 로그인(기기 = 학생) → 이 기기에 바로 저장 → 2.5초 뒤 Firestore `users/{uid}`에 저장. 3분마다, 창을 닫을 때도 저장해요.
- 인터넷이 끊기면 이 기기에 저장해 두고, 연결되면 다시 보내요.
- 문서 요약 칸: `nickname`, `level`, `currentVillage`, `playTime`, `schemaVersion`(새 게임은 3).
  기존 게임 기록(schemaVersion 2)은 이어서 쓰지 않고, 새로 시작하면 그 위에 새 기록이 저장돼요.

## 지금 들어 있는 것 (1단계: 분수 계곡 마을)
- 타이틀 → 모험가 고르기(남·여, 별명) → 분수 계곡 마을
- 64px 타일로 그린 마을: 큰길, 광장과 치유의 샘, 북쪽 강과 부서진 다리, 연못, ½·¼·⅛ 분수 밭
- 마을 사람 8명 (촌장 모모, 룬 할아버지, 상인 루루, 대장장이 쿵쿵, 경비병, 여관 주인, 꼬마 콩이, 요정 피피)
- 액션 RPG 조작: 8방향 이동, 3단 콤보 공격(J), 스킬(K), 구르기(Space), 대화(E), 회복약(Q)
- 화면 UI: 상태(HP·SP·EXP), 미니맵, 행동 버튼, 빠른 칸, 대화창(초상화·타자 효과), 터치 조이스틱

## 파일
```
  index.html
  lib/phaser.min.js        Phaser 3.80.1
  fonts/                   갈무리11 (Galmuri11)
  src/main.js              게임 설정
  src/save/                Firebase 설정값 · 저장(SaveManager)
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
