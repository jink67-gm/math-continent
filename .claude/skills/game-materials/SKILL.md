---
name: game-materials
description: 게임·웹앱을 만들 때 쓸 수 있는 재료(그림·3D·소리·폰트·아이콘·게임 엔진·스타터·AI/공공 API) 목록과 라이선스 판정. 새 에셋·라이브러리·폰트·외부 API를 프로젝트에 넣거나 내려받기 전, 출처 표기(크레딧)를 쓸 때, "어떤 재료를 써도 되나"를 정할 때 반드시 먼저 읽어요. 수학 대륙(초등 6학년 교육용 게임)처럼 어린이가 쓰는 앱이면 특히 꼭 읽어요.
---

# 게임 재료 목록과 라이선스 규칙

사용자가 고른 재료만 쓰고, 재료마다 라이선스 판정을 따른다. 전체 목록과 근거는 [materials.md](materials.md)에 있다.

## 꼭 지킬 것

1. **판정이 「사용 가능」인 재료만 바로 쓴다.** 「조건부」는 적힌 조건을 만족할 때만, 「보류」와 「제외」는 쓰지 않는다. 목록에 없는 재료를 넣고 싶으면 먼저 사용자에게 묻는다.
2. **쓰기 전에 그 재료의 라이선스를 다시 확인한다.** 팩마다 라이선스가 다를 수 있다(특히 Quaternius, Poly Haven Vaults). 내려받은 압축 파일 안의 License 파일을 함께 보관한다.
3. **출처 표기를 남긴다.** 재료를 넣으면 저장소 README의 「쓴 재료와 라이선스」 표에 한 줄 추가하고, 라이선스 파일(OFL, MIT, Apache 고지 등)을 재료 폴더에 같이 둔다. CC0는 의무는 아니지만 표에 적는다.
4. **API 키는 절대 코드나 저장소에 넣지 않는다.** 환경 변수(`.env`는 `.gitignore`에 등록)나 클라우드 환경 설정의 비밀값을 쓴다. 브라우저에서 바로 부르는 API라면 키가 노출되므로 서버(함수)를 거친다.
5. **어린이용 앱 규칙.** 무섭거나 잔인한 그림(해골·피·외눈·징그러운 벌레 등)은 넣지 않는다. 학생 개인정보를 외부 서비스(Supabase, Liveblocks 등)에 보낼 때는 사용자와 먼저 상의한다.
6. **판정을 바꿔야 할 일이 생기면**(약관 변경, 유료 플랜 가입 등) materials.md를 고치고 근거 링크와 날짜를 남긴다.

## 빠른 판정표

| 판정 | 재료 |
|---|---|
| 사용 가능 | Blender(도구), Kenney 8종, Quaternius, Poly Haven HDRI, ambientCG Ground 037, 갈무리, Neo둥근모, Fluent Emoji Flat, Three.js, react-three-fiber, drei, Rapier, gltfjsx, Phaser, Tiled(도구), KAPLAY, Socket.io, template-vite-ts, Supabase Starter, Liveblocks Starter Kit |
| 조건부 | Tripo API — **유료 플랜일 때만** (무료 플랜 결과물은 Tripo가 권리를 가짐) |
| 보류 | 표준국어대사전 오픈 API — 약관 원문 미확인. 확인 전에는 쓰지 않음 |
| 제외 | Google Gemini API — 18세 미만이 쓰는 앱에서 사용 금지(약관) |

## 내려받기 전 네트워크

클라우드 세션은 네트워크 정책 때문에 재료 사이트가 막혀 있을 수 있다. 막히면 사용자에게 환경 설정 → Network access → Allowed domains에 아래 도메인을 추가해 달라고 안내한다(https://code.claude.com/docs/en/cloud-environments#network-access).

`kenney.nl`, `quaternius.com`, `polyhaven.com`, `dl.polyhaven.org`, `ambientcg.com`, `www.blender.org`, `neodgm.dalgona.dev`, `galmuri.quiple.dev`, `platform.tripo3d.ai`, `api.tripo3d.ai`, `stdict.korean.go.kr`

npm(`registry.npmjs.org`)과 GitHub은 기본으로 열려 있다.
