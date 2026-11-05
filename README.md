# 수학 대륙: 여섯 마을의 봉인

6학년 2학기 수학 액션 RPG. Phaser 3로 마을 하나씩 새로 만들고 있어요.
그림·배경음악은 **Ninja Adventure**(CC0) 에셋을, 절벽은 **Zelda-like tilesets**(ArMM1998, CC0)를, 효과음은 기존 게임 자료를 씁니다.

- 주소: `https://jink67-gm.github.io/math-continent/`
- 내 컴퓨터에서 볼 때: VS Code Live Server로 이 폴더를 열기 (`index.html`을 더블클릭하면 실행되지 않아요)

## 저장 (Firebase)
- 기존 게임과 같은 Firebase 프로젝트(`math-continent`)·같은 보안 규칙을 써요. 설정값은 `src/save/firebase-config.js`.
- 익명 로그인(기기 = 학생) → 이 기기에 바로 저장 → 2.5초 뒤 Firestore `users/{uid}`에 저장. 3분마다, 창을 닫을 때도 저장해요.
- 인터넷이 끊기면 이 기기에 저장해 두고, 연결되면 다시 보내요.
- 문서 요약 칸: `nickname`, `level`, `currentVillage`, `playTime`, `schemaVersion`(새 게임은 3).
  기존 게임 기록(schemaVersion 2)은 이어서 쓰지 않고, 새로 시작하면 그 위에 새 기록이 저장돼요.

## 저장 코드 · 선생님 화면 (처음 한 번 설정 필요)
- 캐릭터마다 8글자 **저장 코드**가 있어요 (게임 안 「메뉴」에서 보기). 다른 기기의 타이틀에서 「저장 코드로 불러오기」에 넣으면 이어서 해요.
  기록은 Firestore `saves/{코드}`에도 함께 저장돼요.
- **선생님 화면**: `teacher.html` (예: `https://jink67-gm.github.io/math-continent/teacher.html`)
  - Google로 로그인 → 학생 목록(레벨·있는 곳·난이도·플레이 시간·저장 코드), 경험치·골드·회복약 선물, 학급 「경험치 2배 시간」
- 설정 순서 (Firebase 콘솔, 한 번만)
  1. Firestore Database → 규칙: 저장소의 `firestore.rules` 내용을 붙여 넣고 「게시」
     (배포 전에는 저장 코드·선생님 기능만 안 되고, 원래 저장은 그대로 돼요)
  2. Authentication → 로그인 방법: **Google** 사용 설정. 설정 → 승인된 도메인에 `jink67-gm.github.io`가 있는지 확인
  3. Firestore Database → 데이터: `teachers` 모음을 만들고, 문서 ID를 선생님 Google 이메일로 해서 문서 하나 추가 (필드는 아무거나, 예: `name: 담임`)
  4. (2인 협동) Realtime Database → 규칙: 저장소의 `database.rules.json` 내용을 붙여 넣고 「게시」
- 개발할 때: 주소 끝에 `?emu`를 붙이면 내 컴퓨터의 Firebase 에뮬레이터(auth 9099, firestore 8080)에 연결해요.

## 2인 협동
- 게임 안 「메뉴 → 친구와 함께」: 한 명이 「방 만들기」로 4자리 방 번호를 받고, 다른 한 명이 그 번호로 들어와요.
- 같은 곳(마을·필드)에 있으면 서로 보이고 함께 싸워요. 몬스터는 방장 기기가 움직이고, 친구의 공격은 방장 기기로 전해져요.
- 함께할 때: 몬스터 HP 1.5배, 경험치 각자 80%, 골드 각자 60%, 아이템은 각자 따로 나와요 (혼자보다 느리게 크지 않게).
- Firebase Realtime Database `rooms/{방번호}`를 써요. 창을 닫으면 저절로 방에서 나가요.

## 지금 들어 있는 것
- **마을 6곳 + 혼돈의 첨탑**: 나눔의 계곡 프락시아(분수의 나눗셈) → 큐베른(공간과 입체) → 데시마르(소수의 나눗셈) → 프로포르(비례식) → 키르쿠스(원의 넓이) → 볼테라(원기둥·원뿔·구) → 카오스피어(6단원 모두)
  - 마을마다: 대장 인사 → 길을 막은 룬 → 들판 → 던전의 룬 기둥 두 개 → 보스(수학의 봉인 2번) → 결정 돌려드리기 → 동쪽 길로 다음 마을
  - 1·2번 지역은 제노니아처럼 여러 지도가 이어진 구조예요: 마을에서 퀘스트를 받고 → 외곽 지도를 돌며 룬 돌 세 개를 깨우고 → 봉인이 풀린 길로 던전에 가요 (`src/data/r1maps.js` · `r2maps.js`, 지역 목록은 `src/data/mapRegions.js`)
  - 3~6번은 아직 예전 구조(마을 → 들판 → 던전)로 `src/data/regions.js` 설정으로 지도를 만들어요 (`src/world/gen.js`)
- **수학 룬 창**: 예전 게임의 문제 은행·생성기, 틀리면 5초 뒤 힌트와 다시 도전, 3번 틀리면 더 쉬운 문제, 최근 30문제는 안 나와요. 룬 창이 열려 있는 동안 세상은 멈춰요
- **전투**: 3단 콤보(누르고 있기), 구르기 무적, 스킬 4칸(룬 할아버지께 룬으로 배움), 빨간 경고, 레벨업 성장 시험(T), 황금 수학 상자
- **상점·가방·대장간**: 루루 상점, 가방(B)에서 장비 바꾸기, 쿵쿵 대장간 +1~+5 강화(룬을 맞히면 골드를 내요)
- **난이도**(쉬움·보통·어려움), **2인 협동**, **저장 코드**, **선생님 화면**, 소리 끄기
- 조작: WASD 이동 · J 공격 · 1~4 스킬 · Space 구르기 · E 대화 · Q 회복약 · B 가방 · T 성장 시험 · Esc 메뉴 / 태블릿은 화면 버튼과 조이스틱

## 파일
```
  index.html
  lib/phaser.min.js        Phaser 3.80.1
  fonts/                   갈무리11 (Galmuri11)
  src/main.js              게임 설정
  src/save/                Firebase 설정값 · 저장(SaveManager)
  src/scenes/              Boot · Title · Map(1·2번 지역의 모든 지도) · RegionScenes(3~6번 마을·들판·던전) · Cave · Hud
  src/combat/Combat.js     전투 (콤보·스킬·몬스터 공격·보상·협동)
  src/math/                문제 은행·생성기·룬 창 (Runes.js)
  src/quest/QuestLog.js    퀘스트 진행
  src/net/Party.js         2인 협동 (Realtime Database)
  src/ui/Panels.js         상점·가방·대장간
  src/teacher/ + teacher.html  선생님 화면
  src/world/               terrain(타일 지도) · Player · Npc
  src/data/assets.js       쓰는 그림·소리 목록
  src/data/fractionValley.js   마을 지도·건물·소품·NPC 대사 (글자만 바꿔도 반영돼요)
```

## 쓴 재료와 라이선스
| 재료 | 라이선스 |
|---|---|
| Phaser 3.80.1 | MIT (`lib/LICENSE-phaser.md`) |
| 갈무리 (Galmuri) 2.40.3 · quiple | SIL OFL 1.1 (`fonts/OFL-Galmuri.md`) |
| Ninja Adventure 에셋 · Pixel-Boy & AAA (`assets/na/`) | CC0 (`assets/na/LICENSE.txt`) · https://pixel-boy.itch.io/ninja-adventure-asset-pack |
| 흙절벽 타일 · ArMM1998 「Zelda-like tilesets and sprites」 (`assets/zl/`, 색만 맞춤) | CC0 · https://opengameart.org/content/zelda-like-tilesets-and-sprites |
| 흙/풀 연결 규칙 (`src/world/blobTiles.js`) | Ninja Adventure Godot 프로젝트 tileset.tres에서 옮김 (CC0) |
| 효과음·버튼 그림 (`assets/audio`, `assets/ui2` 등) | 기존 게임 자료 |
