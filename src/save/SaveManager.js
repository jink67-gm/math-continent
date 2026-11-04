// 저장 담당 (기존 게임과 같은 Firebase 프로젝트·같은 보안 규칙을 써요)
//
// 흐름: 저장 요청 → 이 기기(LocalStorage)에 바로 저장 → 2.5초 모았다가 Firestore에 저장
// 로그인: Firebase 익명 로그인 (기기 = 학생). 인터넷이 없으면 이 기기에만 저장하고 나중에 다시 보내요.
//
// Firestore 위치: users/{uid}
//   uid, nickname, level, currentVillage, playTime, schemaVersion  ← 선생님이 콘솔에서 보기 쉬운 요약
//   saveVersion  ← 저장할 때마다 1씩 커지는 번호 (보안 규칙이 줄어드는 저장을 막아요)
//   save         ← 전체 기록
//   updatedAt
// 기존 게임 기록(schemaVersion 2)은 지우지 않고, 새 게임을 시작하면 그 위에 새 기록을 덮어써요.
//
// 저장 코드: saves/{code}  ← 캐릭터마다 하나. 다른 기기에서 코드를 넣으면 이어 해요.
//   saves/{code}/grants/{id}  ← 선생님이 보낸 선물(경험치·골드·회복약). 받으면 지워요.
// 학급 설정: config/class   ← 경험치 2배 시간 등 (선생님만 바꿀 수 있어요)
// 보안 규칙은 저장소의 firestore.rules 파일에 있어요. (선생님이 Firebase 콘솔에서 한 번 배포)

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
const LS_SAVE = 'mathContinent.v2.save';
export const SCHEMA_VERSION = 3;
const DEBOUNCE_MS = 2500;
const RETRY_MS = 20000;
export const USE_EMULATOR = new URLSearchParams(location.search).has('emu');

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('시간 초과')), ms))]);
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_SAVE)); } catch { return null; }
}

function writeLocal(data) {
  try { localStorage.setItem(LS_SAVE, JSON.stringify(data)); return true; } catch { return false; }
}

// Firestore는 undefined를, 보안 규칙은 null 칸을 받지 않아요
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(JSON.parse(JSON.stringify(obj)))) if (v !== null) out[k] = v;
  return out;
}

export class SaveManager {
  constructor(events) {
    this.events = events; // Phaser.Events.EventEmitter (game.events)
    this.uid = null;
    this.cloud = false;
    this.mods = null;
    this.knownMaxVersion = 0;
    this.pending = null;
    this.timer = null;
    this.retryTimer = null;
    this.syncing = false;
    this.again = false;
    this.legacy = null; // 기존 게임 기록 (별명 미리 채우기용)
    window.addEventListener('online', () => this.sync());
  }

  status(s) {
    this.state = s;
    this.events.emit('save:status', s);
  }

  // Firebase 연결 + 익명 로그인 (실패해도 게임은 이 기기 저장으로 계속돼요)
  async connect() {
    if (this.cloud) return true;
    if (!isFirebaseConfigured()) return false;
    try {
      if (!this.mods) {
        const [appM, authM, fsM] = await Promise.all([
          import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
        ]);
        const app = appM.initializeApp(firebaseConfig);
        this.mods = { app, authM, fsM, auth: authM.getAuth(app), db: fsM.getFirestore(app) };
        // 개발용: 주소 끝에 ?emu 를 붙이면 내 컴퓨터의 Firebase 에뮬레이터에 연결해요
        if (USE_EMULATOR) {
          authM.connectAuthEmulator(this.mods.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
          fsM.connectFirestoreEmulator(this.mods.db, '127.0.0.1', 8080);
        }
      }
      const { authM, auth } = this.mods;
      await authM.setPersistence(auth, authM.browserLocalPersistence);
      const existing = await new Promise((resolve) => {
        const stop = authM.onAuthStateChanged(auth, (u) => { stop(); resolve(u); });
      });
      const user = existing || (await authM.signInAnonymously(auth)).user;
      this.uid = user.uid;
      this.cloud = true;
      return true;
    } catch (e) {
      console.warn('[저장] 클라우드 연결 실패 — 이 기기에 저장해요.', e);
      return false;
    }
  }

  ref() {
    const { fsM, db } = this.mods;
    return fsM.doc(db, 'users', this.uid);
  }

  // 이 기기 기록과 클라우드 기록 중 최신 것을 돌려줘요
  async load() {
    const local = readLocal();
    let cloud = null;
    let cloudVersion = 0;
    if (await withTimeout(this.connect(), 9000).catch(() => false)) {
      try {
        const snap = await withTimeout(this.mods.fsM.getDoc(this.ref()), 7000);
        if (snap.exists()) {
          const d = snap.data();
          cloudVersion = d.saveVersion || 0;
          if ((d.schemaVersion || 0) >= SCHEMA_VERSION) cloud = d.save;
          else this.legacy = { nickname: d.nickname, level: d.level };
        }
      } catch (e) {
        console.warn('[저장] 클라우드 기록을 못 읽었어요.', e);
      }
    }
    const lv = local?.saveVersion || 0;
    this.knownMaxVersion = Math.max(lv, cloudVersion);
    const best = cloud && (!local || (cloud.saveVersion || 0) > lv) ? cloud : local;
    const newer = await this.newerByCode(best);
    if (newer) {
      this.knownMaxVersion = Math.max(this.knownMaxVersion, newer.saveVersion || 0);
      writeLocal(newer);
      return newer;
    }
    if (best === cloud && cloud) {
      writeLocal(cloud);
      return cloud;
    }
    if (local && this.cloud && lv > (cloud?.saveVersion || 0)) {
      // 인터넷이 없을 때 저장한 기록이 더 최신 → 클라우드에 올려 둬요
      this.pending = local;
      this.schedule(1500);
    }
    return local;
  }

  // 게임 어디서든 이 함수만 부르면 돼요
  save(data, { now = false } = {}) {
    data.schemaVersion = SCHEMA_VERSION;
    data.saveVersion = Math.max(data.saveVersion || 0, this.knownMaxVersion) + 1;
    this.knownMaxVersion = data.saveVersion;
    data.savedAt = Date.now();
    const ok = writeLocal(data);
    if (!isFirebaseConfigured()) { this.status(ok ? 'local' : 'error'); return; }
    this.pending = JSON.parse(JSON.stringify(data));
    this.status('saving');
    this.schedule(now ? 0 : DEBOUNCE_MS);
  }

  schedule(ms) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.sync(), ms);
  }

  async sync() {
    if (!this.pending) return;
    if (this.syncing) { this.again = true; return; }
    this.syncing = true;
    const data = this.pending;
    try {
      if (navigator.onLine === false) throw new Error('오프라인');
      if (!(await withTimeout(this.connect(), 9000))) throw new Error('클라우드 연결 안 됨');
      const { fsM, db } = this.mods;
      const ref = this.ref();
      const doc = clean({
        uid: this.uid,
        nickname: String(data.name).slice(0, 10),
        level: Math.max(1, Math.floor(data.lv)),
        currentVillage: data.village,
        playTime: Math.max(0, Math.floor(data.playTime || 0)),
        schemaVersion: SCHEMA_VERSION,
        saveVersion: data.saveVersion,
        save: data,
      });
      const res = await withTimeout(fsM.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const cv = snap.exists() ? (snap.data().saveVersion || 0) : 0;
        if (cv > data.saveVersion) return { skipped: true, cv };
        tx.set(ref, { ...doc, updatedAt: fsM.serverTimestamp() });
        return { skipped: false };
      }), 12000);
      if (res.skipped) {
        // 다른 기기에 더 최신 기록이 있어요 → 번호를 올려서 다음 저장 때 다시 보내요
        this.knownMaxVersion = Math.max(this.knownMaxVersion, res.cv);
      }
      await this.syncCode(data);
      if (this.pending === data) this.pending = null;
      this.status('saved');
    } catch (e) {
      console.warn('[저장] 클라우드 저장 실패 — 이 기기에는 저장되어 있어요.', e);
      this.status('offline');
      if (!this.retryTimer) {
        this.retryTimer = setTimeout(() => { this.retryTimer = null; this.sync(); }, RETRY_MS);
      }
    } finally {
      this.syncing = false;
      if (this.again) { this.again = false; this.sync(); }
    }
  }

  codeRef(code) {
    const { fsM, db } = this.mods;
    return fsM.doc(db, 'saves', code);
  }

  // 저장 코드 사본: 실패해도(예: 새 보안 규칙을 아직 배포 안 함) 원래 저장은 그대로예요
  async syncCode(data) {
    if (!data.saveCode) return;
    const { fsM, db } = this.mods;
    const ref = this.codeRef(data.saveCode);
    try {
      await withTimeout(fsM.runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const cv = snap.exists() ? (snap.data().saveVersion || 0) : 0;
        if (cv >= data.saveVersion) { this.knownMaxVersion = Math.max(this.knownMaxVersion, cv); return; }
        tx.set(ref, { ...clean({
          code: data.saveCode,
          lastUid: this.uid,
          nickname: String(data.name).slice(0, 10),
          level: Math.max(1, Math.floor(data.lv)),
          currentVillage: data.village,
          difficulty: data.difficulty,
          playTime: Math.max(0, Math.floor(data.playTime || 0)),
          saveVersion: data.saveVersion,
          save: data,
        }), updatedAt: fsM.serverTimestamp() });
      }), 12000);
      this.codeOk = true;
    } catch (e) {
      if (this.codeOk !== false) console.warn('[저장] 저장 코드 사본을 못 올렸어요 (보안 규칙 배포가 필요할 수 있어요).', e);
      this.codeOk = false;
    }
  }

  // 저장 코드로 캐릭터 불러오기 → { save } | { error: '메시지' }
  async loadByCode(code) {
    if (!(await withTimeout(this.connect(), 9000).catch(() => false))) return { error: '인터넷에 연결되어 있지 않아요' };
    try {
      const snap = await withTimeout(this.mods.fsM.getDoc(this.codeRef(code)), 8000);
      if (!snap.exists()) return { error: '그런 저장 코드가 없어요. 다시 확인해 주세요' };
      const save = snap.data().save;
      this.knownMaxVersion = Math.max(this.knownMaxVersion, save.saveVersion || 0);
      writeLocal(save);
      return { save };
    } catch (e) {
      console.warn('[저장] 코드로 불러오기 실패', e);
      return { error: '불러오지 못했어요. 잠시 뒤에 다시 해 주세요' };
    }
  }

  // 다른 기기에서 같은 코드로 더 많이 했으면 그 기록을 써요
  async newerByCode(save) {
    if (!save?.saveCode || !this.cloud) return null;
    try {
      const snap = await withTimeout(this.mods.fsM.getDoc(this.codeRef(save.saveCode)), 6000);
      const other = snap.exists() ? snap.data().save : null;
      return other && (other.saveVersion || 0) > (save.saveVersion || 0) ? other : null;
    } catch { return null; }
  }

  // 선생님이 보낸 선물 목록
  async fetchGrants(code) {
    if (!code || !this.cloud) return [];
    const { fsM, db } = this.mods;
    try {
      const snap = await withTimeout(fsM.getDocs(fsM.collection(db, 'saves', code, 'grants')), 8000);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  }

  async removeGrant(code, id) {
    const { fsM, db } = this.mods;
    try { await fsM.deleteDoc(fsM.doc(db, 'saves', code, 'grants', id)); } catch { /* 다음에 다시 지워요 */ }
  }

  // 학급 설정 (경험치 2배 시간 등)
  async fetchClassConfig() {
    if (!this.cloud) return null;
    const { fsM, db } = this.mods;
    try {
      const snap = await withTimeout(fsM.getDoc(fsM.doc(db, 'config', 'class')), 6000);
      return snap.exists() ? snap.data() : null;
    } catch { return null; }
  }

  // 창을 닫기 직전: 기다리지 않고 바로 보내기
  flush() {
    clearTimeout(this.timer);
    this.sync();
  }
}
