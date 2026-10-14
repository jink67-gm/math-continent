// Firebase 연결과 Firestore 읽기/쓰기를 담당
// 게임의 다른 부분은 Firebase를 직접 부르지 않고 이 파일만 거칩니다.
// (나중에 다른 저장 방식으로 바꾸기 쉽도록)
//
// 저장 위치
//   users/{uid}                ← 학생 1명당 문서 1개 (요약 + 전체 기록)
//   users/{uid}/mathLogs/{id}  ← 문제 풀이 기록

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const SDK_VERSION = '10.12.2';
const SDK_BASE = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

// Firestore는 undefined 값을 받지 않고, 보안 규칙은 null 칸을 막아요 → 미리 지워 둠
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(JSON.parse(JSON.stringify(obj)))) {
    if (v !== null) out[k] = v;
  }
  return out;
}

export class FirebaseManager {
  constructor() {
    this.ready = false;
    this.error = null;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.mods = {};
  }

  get configured() {
    return isFirebaseConfigured();
  }

  async init() {
    if (!this.configured) return false;
    try {
      const [appM, authM, fsM] = await Promise.all([
        import(`${SDK_BASE}/firebase-app.js`),
        import(`${SDK_BASE}/firebase-auth.js`),
        import(`${SDK_BASE}/firebase-firestore.js`),
      ]);
      this.mods = { appM, authM, fsM };
      this.app = appM.initializeApp(firebaseConfig);
      this.auth = authM.getAuth(this.app);
      this.db = fsM.getFirestore(this.app);
      this.ready = true;
      return true;
    } catch (e) {
      console.warn('[Firebase] 초기화 실패 — 이 기기 저장으로 진행합니다.', e);
      this.error = e;
      return false;
    }
  }

  userRef(uid) {
    const { fsM } = this.mods;
    return fsM.doc(this.db, 'users', uid);
  }

  // users/{uid} 문서 읽기
  async readUser(uid) {
    const { fsM } = this.mods;
    const snap = await fsM.getDoc(this.userRef(uid));
    return snap.exists() ? snap.data() : null;
  }

  // 저장: 클라우드에 더 최신 기록(saveVersion이 더 큼)이 있으면 덮어쓰지 않음
  async writeSave(uid, save, summary) {
    const { fsM } = this.mods;
    const ref = this.userRef(uid);
    const data = clean({ ...summary, saveVersion: save.saveVersion, save: JSON.parse(JSON.stringify(save)) });
    return fsM.runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      const cloudVersion = snap.exists() ? (snap.data().saveVersion || 0) : 0;
      if (cloudVersion > save.saveVersion) {
        return { skipped: true, cloudVersion };
      }
      tx.set(ref, { ...data, updatedAt: fsM.serverTimestamp() });
      return { skipped: false };
    });
  }

  // 수학 풀이 기록: users/{uid}/mathLogs/{자동ID}
  async writeMathLogs(uid, logs) {
    if (!logs.length) return;
    const { fsM } = this.mods;
    const col = fsM.collection(this.db, 'users', uid, 'mathLogs');
    const batch = fsM.writeBatch(this.db);
    for (const log of logs) {
      const { localId, ...rest } = log;
      batch.set(fsM.doc(col), { ...clean(rest), createdAt: fsM.serverTimestamp() });
    }
    await batch.commit();
  }
}
