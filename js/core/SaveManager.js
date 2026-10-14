// 저장 담당
// 흐름: 게임 상태 변경 → LocalStorage 즉시 저장 → (잠시 모았다가) Firestore 저장
//
// - saveVersion: 저장할 때마다 1씩 커지는 번호. 큰 쪽이 최신 기록.
// - 클라우드에 더 최신 기록이 있으면 덮어쓰지 않음.
// - 저장이 실패해도 게임은 계속되고, 인터넷이 돌아오면 다시 저장.
// - 수학 풀이 기록(mathLogs)은 모아 두었다가 저장할 때 함께 보냄.

import { storage, clone, withTimeout, randomId } from './utils.js';
import { migrateSave } from '../player/Player.js';

const LS_SAVE = 'mathContinent.save.v1';
const LS_LOGS = 'mathContinent.mathLogs.pending.v1';
const MAX_PENDING_LOGS = 300;
const RETRY_MS = 20000;

export const SAVE_STATUS = {
  SAVING: 'saving',
  SAVED: 'saved',
  LOCAL: 'local', // Firebase 설정 전: 이 기기에만 저장
  OFFLINE: 'offline', // 클라우드 실패: 이 기기에 저장 후 재시도 대기
  CONFLICT: 'conflict',
  ERROR: 'error',
};

function makeSummary(save) {
  // 나중에 교사 화면에서 문서 하나만 읽어도 볼 수 있도록 겉에 꺼내 두는 정보
  return {
    uid: save.uid,
    nickname: save.nickname,
    level: save.level,
    currentVillage: save.currentVillage,
    unlockedVillageCount: save.unlockedVillages.length,
    bossesDefeated: save.bossesDefeated,
    correctAnswers: save.correctAnswers,
    wrongAnswers: save.wrongAnswers,
    mathProgress: save.mathProgress,
    playTime: Math.floor(save.playTime),
    schemaVersion: save.schemaVersion,
  };
}

export class SaveManager {
  constructor({ firebase, auth, bus, config }) {
    this.fb = firebase;
    this.auth = auth;
    this.bus = bus;
    this.config = config;
    this.knownMaxVersion = 0;
    this.pendingData = null;
    this.cloudTimer = null;
    this.retryTimer = null;
    this.syncing = false;
    this.resyncWanted = false;
    this.status = null;

    window.addEventListener('online', () => this.syncCloud());
  }

  get cloudEnabled() {
    return this.fb.ready && this.auth.isCloud;
  }

  emitStatus(status) {
    this.status = status;
    this.bus.emit('save:status', { status });
  }

  readLocal() {
    const data = storage.get(LS_SAVE);
    return data && data.nickname ? data : null;
  }

  // 이 기기 기록과 클라우드 기록 중 더 최신 것을 불러옴
  async loadBest() {
    const local = this.readLocal();
    let cloud = null;
    if (this.cloudEnabled) {
      try {
        const doc = await withTimeout(this.fb.readUser(this.auth.uid), 7000, '불러오기');
        cloud = doc?.save || null;
      } catch (e) {
        console.warn('[Save] 클라우드 불러오기 실패, 이 기기 기록을 사용합니다.', e);
      }
    }
    const lv = local?.saveVersion || 0;
    const cv = cloud?.saveVersion || 0;
    this.knownMaxVersion = Math.max(lv, cv);

    let best = local;
    if (cloud && (!local || cv > lv)) {
      best = cloud;
      storage.set(LS_SAVE, cloud);
    } else if (local && this.cloudEnabled && lv > cv) {
      // 오프라인 때 저장한 기록이 더 최신 → 클라우드에 올려 둠
      this.pendingData = local;
      this.scheduleCloud(1500);
    }
    return best ? migrateSave(best) : null;
  }

  // 저장 요청 (게임 어디서든 이 함수만 부르면 됨)
  save(data, { immediate = false } = {}) {
    data.saveVersion = Math.max(data.saveVersion || 0, this.knownMaxVersion) + 1;
    this.knownMaxVersion = data.saveVersion;
    data.lastSavedAt = Date.now();
    if (this.auth.uid && !data.uid) data.uid = this.auth.uid;

    const ok = storage.set(LS_SAVE, data);
    if (!this.fb.configured) {
      this.emitStatus(ok ? SAVE_STATUS.LOCAL : SAVE_STATUS.ERROR);
      return;
    }
    this.pendingData = data;
    this.emitStatus(SAVE_STATUS.SAVING);
    this.scheduleCloud(immediate ? 0 : this.config.cloudDebounceMs);
  }

  scheduleCloud(delay) {
    clearTimeout(this.cloudTimer);
    this.cloudTimer = setTimeout(() => this.syncCloud(), delay);
  }

  scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.syncCloud();
    }, RETRY_MS);
  }

  // 처음에 인터넷이 없어 로그인 못 했으면 다시 시도
  async ensureCloud() {
    if (this.cloudEnabled) return true;
    if (!this.fb.configured) return false;
    if (!this.fb.ready) await this.fb.init();
    if (!this.fb.ready) return false;
    try {
      await withTimeout(this.auth.signIn(), 8000, '로그인');
    } catch (e) { /* 아래에서 판단 */ }
    if (this.cloudEnabled && this.pendingData) this.pendingData.uid = this.auth.uid;
    return this.cloudEnabled;
  }

  async syncCloud() {
    if (!this.fb.configured) return;
    if (this.syncing) {
      this.resyncWanted = true;
      return;
    }
    const hasLogs = (storage.get(LS_LOGS) || []).length > 0;
    if (!this.pendingData && !hasLogs) return;

    this.syncing = true;
    try {
      if (!(await this.ensureCloud())) throw new Error('클라우드 연결 안 됨');
      if (navigator.onLine === false) throw new Error('오프라인');

      if (this.pendingData) {
        const data = clone(this.pendingData);
        const res = await withTimeout(this.fb.writeSave(this.auth.uid, data, makeSummary(data)), 12000, '저장');
        if (this.pendingData && this.pendingData.saveVersion === data.saveVersion) this.pendingData = null;
        if (res.skipped) {
          this.pendingData = null;
          this.emitStatus(SAVE_STATUS.CONFLICT);
          this.bus.emit('save:conflict', res);
        }
      }
      await this.flushLogs();
      if (this.status !== SAVE_STATUS.CONFLICT) this.emitStatus(SAVE_STATUS.SAVED);
    } catch (e) {
      console.warn('[Save] 클라우드 저장 실패 — 이 기기에는 저장되어 있어요.', e);
      this.emitStatus(SAVE_STATUS.OFFLINE);
      this.scheduleRetry();
    } finally {
      this.syncing = false;
      if (this.resyncWanted) {
        this.resyncWanted = false;
        this.syncCloud();
      }
    }
  }

  // 수학 풀이 기록 1개 추가 (바로 보내지 않고 모아 둠)
  addMathLog(log) {
    const logs = storage.get(LS_LOGS) || [];
    logs.push({ ...log, localId: randomId(8) });
    while (logs.length > MAX_PENDING_LOGS) logs.shift();
    storage.set(LS_LOGS, logs);
  }

  async flushLogs() {
    const logs = storage.get(LS_LOGS) || [];
    if (!logs.length) return;
    const batch = logs.slice(0, 400);
    await withTimeout(this.fb.writeMathLogs(this.auth.uid, batch), 12000, '풀이 기록 저장');
    const sent = new Set(batch.map((l) => l.localId));
    const remain = (storage.get(LS_LOGS) || []).filter((l) => !sent.has(l.localId));
    storage.set(LS_LOGS, remain);
  }

  pendingLogCount() {
    return (storage.get(LS_LOGS) || []).length;
  }

  // 창을 닫기 직전 등: 기다릴 수 없으니 바로 보내기 시도
  flushNow() {
    clearTimeout(this.cloudTimer);
    this.syncCloud();
  }
}
