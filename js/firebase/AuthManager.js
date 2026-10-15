// 로그인 담당
// 지금: Firebase 익명 로그인 (학생마다 기기가 따로 있으므로 기기 = 학생)
// 나중에 추가할 수 있는 방식 (아래 함수 자리만 채우면 됨):
//   - signInWithSaveCode(code): 저장 코드로 다른 기기에서 이어하기
//   - signInTeacher(email, password): 교사 대시보드용

import { storage, randomId } from '../core/utils.js';

const LOCAL_ID_KEY = 'mathContinent.localId';

export class AuthManager {
  constructor(firebase) {
    this.fb = firebase;
    this.uid = null;
    this.mode = 'none'; // 'anonymous' | 'local'
    this.error = null;
  }

  get isCloud() {
    return this.mode === 'anonymous';
  }

  async signIn() {
    if (!this.fb.ready) return this.useLocal();
    const { authM } = this.fb.mods;
    try {
      await authM.setPersistence(this.fb.auth, authM.browserLocalPersistence);
      const existing = await new Promise((resolve) => {
        const stop = authM.onAuthStateChanged(this.fb.auth, (user) => {
          stop();
          resolve(user);
        });
      });
      const user = existing || (await authM.signInAnonymously(this.fb.auth)).user;
      this.uid = user.uid;
      this.mode = 'anonymous';
      this.error = null;
      return this.uid;
    } catch (e) {
      console.warn('[Auth] 익명 로그인 실패 — 이 기기 저장으로 진행합니다.', e);
      this.error = e;
      return this.useLocal();
    }
  }

  // 인터넷이 없거나 Firebase 설정 전일 때 쓰는 기기 전용 ID
  useLocal() {
    let id = storage.get(LOCAL_ID_KEY);
    if (!id) {
      id = `local-${randomId(12)}`;
      storage.set(LOCAL_ID_KEY, id);
    }
    this.uid = id;
    this.mode = 'local';
    return id;
  }

  // ---- 확장 자리 (2단계 이후) ----
  async signInWithSaveCode(/* code */) {
    throw new Error('저장 코드 로그인은 아직 준비 중이에요.');
  }

  async signInTeacher(/* email, password */) {
    throw new Error('교사 로그인은 아직 준비 중이에요.');
  }
}
