// ===============================================
// Firebase 설정값 (기존 게임에서 쓰던 값 그대로)
// ===============================================
// Firebase 콘솔 → 프로젝트 설정 → 내 앱 → "SDK 설정 및 구성"의 firebaseConfig 값이에요.
// 값이 비어 있으면 게임은 "이 기기에만 저장" 모드로 동작합니다.
// (이 값은 비밀번호가 아니라 웹에 공개되는 정보예요.
//  학생 기록 보호는 Firestore 보안 규칙이 맡아요.)

export const firebaseConfig = {
  apiKey: "AIzaSyDTpPAsTDtixREVzB65N0vtGj0Ky6G98Xs",
  authDomain: "math-continent.firebaseapp.com",
  databaseURL: "https://math-continent-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "math-continent",
  storageBucket: "math-continent.firebasestorage.app",
  messagingSenderId: "71439535639",
  appId: "1:71439535639:web:015a4be34945f74fce1652",
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
