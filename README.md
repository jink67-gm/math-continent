# 수학 대륙: 여섯 마을의 봉인

6학년 2학기 수학 액션 RPG. Phaser 3로 마을 하나씩 새로 만들고 있어요.
그림·배경음악은 **Ninja Adventure**(CC0) 에셋을, 절벽은 **Zelda-like tilesets**(ArMM1998, CC0)를, 효과음은 기존 게임 자료를 씁니다. 글씨는 **나눔스퀘어라운드**예요.

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
  - 지역마다: 마을 대장 인사 → 외곽 지도 세 곳의 룬 돌 → 봉인이 풀린 길로 던전 → 룬 기둥 두 개 → 보스(수학의 봉인 2번) → 결정 돌려드리기 → 다음 지역 · 마을 사람들의 곁 퀘스트 4개
  - 던전도 지역마다 테마가 달라요: 1 흙 동굴 · 2 돌 미궁(횃불) · 3 바다 동굴 → 바깥 소용돌이 바위섬 · 4 대리석 궁궐(화로·융단) → 왕좌의 방 · 5 덩굴 유적(빛줄기) → 바깥 숲 깊은 곳 제단 · 6 용암굴(불티) → 바깥 구름 위 정상 (`src/world/DungeonStyle.js`, 용암 그림은 `tools/build_lava.py`)
  - 보스는 뒤로 갈수록 더 크고 강해 보여요: 너구리 트롤 → 초록 두꺼비 → 빨간 두꺼비 → 파란 갑옷 무사 → 파란 텐구(기운) → 빨간 갑옷 무사(기운) → 첨탑의 빨간 텐구 (Ninja Adventure 보스 그림, CC0). 보스 방도 지역마다 모양이 달라요
  - 여섯 지역 모두 제노니아처럼 여러 지도가 이어진 구조예요: 마을에서 퀘스트를 받고 → 외곽 지도를 돌며 룬 돌 세 개를 깨우고 → 봉인이 풀린 길로 던전에 가요 (`src/data/r1maps.js` · `r2maps.js` · `r3maps.js` · `r4maps.js` · `r5maps.js` · `r6maps.js`, 지역 목록은 `src/data/mapRegions.js`)
  - 마지막 혼돈의 첨탑만 예전 던전 장면을 써요. 예전 마을·들판 장면(Town·Wild)은 오래된 저장 기록을 위해 남겨 두었고, `src/data/regions.js` 설정으로 지도를 만들어요 (`src/world/gen.js`)
- **수학 룬 창**: 예전 게임의 문제 은행·생성기, 틀리면 5초 뒤 힌트와 다시 도전, 3번 틀리면 더 쉬운 문제, 최근 30문제는 안 나와요. 오른쪽 위 ✕(Esc)로 닫을 수 있고, 열려 있는 동안 세상이 멈추고 맞지 않아요
- **전투**: J 연타 1·2·3타, 2타 뒤 잠깐 쉬고 J = 강타, J 꾹 = 힘 모으기(1단계 모아 베기 · 2단계 회오리 베기), 연타 수 표시, 구르기(1초 대기), 빨간 경고, 황금 수학 상자
- **지역이 오를수록 어려워요** (`src/data/rules.js` monsterScale): 몬스터 HP·공격력·속도·공격 빈도가 오르고 두 번 덮치기 · 여러 갈래 구슬 · 둘레 내려찍기가 생겨요. 금빛 정예 몬스터(강화석을 꼭 떨어뜨려요), 보스도 단계마다 강해지고 이어 공격을 해요
- **다음 지역 레벨 제한**: 큐베른 Lv7 · 데시마르 Lv12 · 프로포르 Lv17 · 키르쿠스 Lv21 · 볼테라 Lv25 · 첨탑 Lv28 (선생님 화면의 「모두 열기」는 그대로 통과)
- **능력 창(C)**: 레벨업마다 능력치 포인트 3(힘·체력·솜씨·지혜)과 스킬 포인트 1, 성장 시험(T)을 맞히면 능력치 포인트 +2
- **스킬**: 주인공마다 8가지(남: 회전 베기·돌진·검기 날리기·방패 막기·기합·대지 가르기·연속 찌르기·하늘 내려찍기 / 여: 불꽃 화살·얼음 고리·번개 사슬·치유의 빛·마나 보호막·별똥별·순간 이동·거대 운석). 마을 룬 학자에게 골라서 배우고(스킬 포인트 1 + 룬), 1~5단계로 올리고, U·I·O·L 네 칸에 골라 끼워요 (`src/data/skills.js`)
- **장비 다섯 칸**(무기·머리·몸·발·장신구), 무기 14종·방어구 24종, 지역마다 상점 물건이 달라요 (`src/data/items.js`)
- **대장간 강화 +1~+10**: 골드 + 강화석(+6부터 빛나는 강화석). 단계마다 성공 확률이 낮아지고, 강화 전에 수학 문제를 풀면 한 문제에 +15%(두 문제까지). 실패해도 단계는 그대로, 다음 확률 +5%
- **체크포인트·빠른 이동**: 마을 샘물을 마시면 그 마을이 등록되고, 샘이나 지도(M)에서 등록한 마을로 바로 이동해요
- **난이도**(쉬움·보통·어려움), **2인 협동**(작은 지도에 친구 파란 점, 화면 밖이면 가장자리 화살표와 거리, 다른 지도에 있으면 그 지도 이름), **저장 코드**, **선생님 화면**, 소리 끄기
- 조작: WASD 이동 · J 공격(꾹 = 힘 모으기) · U·I·O·L 스킬 · Space 구르기 · E 대화 · Q 회복약 · C 능력 · B 가방 · M 지도 · T 성장 시험 · Esc 메뉴 / 태블릿은 화면 버튼과 조이스틱

## 파일
```
  index.html
  lib/phaser.min.js        Phaser 3.80.1
  fonts/                   갈무리11 (Galmuri11)
  src/main.js              게임 설정
  src/save/                Firebase 설정값 · 저장(SaveManager)
  src/scenes/              Boot · Title · Map(여섯 지역의 모든 지도) · RegionScenes(혼돈의 첨탑, 예전 마을·들판) · Cave · Hud
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
| 갈무리 (Galmuri) 2.40.3 · quiple — 교사 화면 | SIL OFL 1.1 (`fonts/OFL-Galmuri.md`) |
| Ninja Adventure 에셋 · Pixel-Boy & AAA (`assets/na/`) | CC0 (`assets/na/LICENSE.txt`) · https://pixel-boy.itch.io/ninja-adventure-asset-pack |
| 흙절벽 타일 · ArMM1998 「Zelda-like tilesets and sprites」 (`assets/zl/`, 색만 맞춤) | CC0 · https://opengameart.org/content/zelda-like-tilesets-and-sprites |
| 흙/풀 연결 규칙 (`src/world/blobTiles.js`) | Ninja Adventure Godot 프로젝트 tileset.tres에서 옮김 (CC0) |
| 효과음·버튼·대화창·아이템 아이콘 (`assets/audio`, `assets/ui`, `assets/ui2`, `assets/items`) | 선생님이 ChatGPT로 직접 만든 자료 (OpenAI 이용약관에 따라 생성물의 권리는 만든 사람에게 있어요) |
| 나눔스퀘어라운드(게임 글씨) · 주아(수학 그림) 글꼴 (`assets/fonts`) | 나눔글꼴 라이선스 · SIL OFL 1.1 (`assets/fonts/README.txt`) |
