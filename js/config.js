// ===============================================
// 게임 기본 설정 (선생님이 직접 바꿔도 되는 곳)
// ===============================================
// GitHub에서 이 파일의 연필(✏️) 버튼을 눌러 값을 바꾼 뒤
// "Commit changes"를 누르면 반 전체에 적용됩니다.

export const GAME_CONFIG = {
  title: '수학 대륙: 여섯 마을의 봉인',

  // 원주율 기본값: 3 또는 3.14
  piValue: 3.14,

  // true로 바꾸면 처음부터 모든 마을이 열립니다 (특정 단원 수업용)
  allVillagesOpen: false,

  // 게임 안 [설정 → 교사 설정]에 들어갈 때 쓰는 비밀번호 (꼭 바꿔 주세요)
  teacherPin: '0000',

  // 자동 저장 간격(초)
  autosaveIntervalSec: 45,

  // 클라우드 저장을 모아서 보내는 대기 시간(밀리초)
  cloudDebounceMs: 2500,

  // 최근에 낸 문제를 다시 내지 않는 개수
  recentQuestionLimit: 30,

  // 오답 후 다시 도전까지 기다리는 시간(초)
  wrongAnswerWaitSec: 5,

  // 1단계 테스트 버튼 표시 (실제 수업 때는 false)
  devTools: true,
};
