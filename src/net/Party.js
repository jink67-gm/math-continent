// 2인 협동: Firebase Realtime Database로 위치·몬스터·공격을 주고받아요.
//
// rooms/{방번호 4자리}
//   meta              { host: uid, created }
//   members/{uid}     { name, gender, lv }        ← 창을 닫으면 저절로 지워져요
//   state/{uid}       { s: 장면, x, y, d: 방향, st: 상태, hp, mhp, lv }   ← 1초에 10번
//   mon/{장면}         [[x, y, hp, maxHp, 상태, 방향, 목표x, 목표y], ...]   ← 방장만 써요
//   ev/{uid}/{id}     받는 사람에게 보내는 일 (맞힘·맞음·정화). 읽으면 지워요
//
// 몬스터는 방장 기기가 움직이고, 친구 기기는 그 모습을 받아서 보여 줘요.
// 친구가 때리면 「맞힘」을 방장에게 보내고, 방장이 HP를 깎아요.

import { USE_EMULATOR } from '../save/SaveManager.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
const SEND_MS = 100;

export class Party {
  constructor(game) {
    this.game = game;
    this.room = null;
    this.uid = null;
    this.isHost = false;
    this.members = {};
    this.peerState = null;
    this.peerPrev = null;
    this.mon = {};
    this.events = [];
    this.lastSend = 0;
    this.unsubs = [];
  }

  get active() { return !!this.room; }
  get peerId() { return Object.keys(this.members).find((id) => id !== this.uid) || null; }
  get peer() { const id = this.peerId; return id ? this.members[id] : null; }

  // 같은 장면에 친구가 있고, 최근 3초 안에 소식이 왔으면 협동 중
  together(sceneKey) {
    const p = this.peerState;
    return !!(this.peer && p && p.s === sceneKey && Date.now() - p.at < 3000);
  }

  async connect() {
    if (this.db) return true;
    const saves = this.game.saves;
    if (!(await saves.connect())) return false;
    const dbM = await import(`${SDK}/firebase-database.js`);
    const db = dbM.getDatabase(saves.mods.app);
    if (USE_EMULATOR) dbM.connectDatabaseEmulator(db, '127.0.0.1', 9000);
    this.dbM = dbM;
    this.db = db;
    this.uid = saves.uid;
    return true;
  }

  ref(path) { return this.dbM.ref(this.db, `rooms/${this.room}${path ? `/${path}` : ''}`); }

  // 방 만들기 → 방 번호
  async create(me) {
    if (!(await this.connect())) return { error: '인터넷에 연결되어 있지 않아요' };
    const { runTransaction, ref } = this.dbM;
    for (let tries = 0; tries < 6; tries++) {
      const room = String(1000 + Math.floor(Math.random() * 9000));
      const res = await runTransaction(ref(this.db, `rooms/${room}/meta`), (cur) => (cur ? undefined : { host: this.uid, created: Date.now() }));
      if (!res.committed) continue;
      this.room = room;
      this.isHost = true;
      await this.enter(me);
      return { room };
    }
    return { error: '방을 만들지 못했어요. 다시 해 주세요' };
  }

  async join(room, me) {
    if (!/^\d{4}$/.test(room)) return { error: '방 번호 4자리를 넣어 주세요' };
    if (!(await this.connect())) return { error: '인터넷에 연결되어 있지 않아요' };
    const { get, ref } = this.dbM;
    const snap = await get(ref(this.db, `rooms/${room}`));
    if (!snap.exists()) return { error: '그런 방이 없어요. 번호를 확인해 주세요' };
    const members = snap.val().members || {};
    if (Object.keys(members).filter((id) => id !== this.uid).length >= 2) return { error: '방이 가득 찼어요 (2명까지)' };
    if (!Object.keys(members).length) return { error: '방을 만든 친구가 나갔어요' };
    this.room = room;
    this.isHost = snap.val().meta?.host === this.uid;
    await this.enter(me);
    return { room };
  }

  async enter(me) {
    const { set, onDisconnect, onValue, onChildAdded, remove } = this.dbM;
    const mine = this.ref(`members/${this.uid}`);
    await set(mine, { name: me.name, gender: me.gender, lv: me.lv });
    onDisconnect(mine).remove();
    onDisconnect(this.ref(`state/${this.uid}`)).remove();
    onDisconnect(this.ref(`ev/${this.uid}`)).remove();
    if (this.isHost) onDisconnect(this.ref()).remove(); // 방장이 나가면 방이 없어져요

    this.unsubs.push(onValue(this.ref('members'), (s) => {
      const before = this.peerId;
      this.members = s.val() || {};
      if (!this.members[this.uid] && this.room) { this.left('방이 닫혔어요'); return; }
      const after = this.peerId;
      if (after && after !== before) this.notify(`${this.members[after].name} 님이 들어왔어요!`);
      if (!after && before) { this.peerState = null; this.notify('친구가 파티에서 나갔어요'); }
    }));
    this.unsubs.push(onValue(this.ref('state'), (s) => {
      const all = s.val() || {};
      const p = this.peerId && all[this.peerId];
      if (!p) { this.peerState = null; return; }
      this.peerPrev = this.peerState;
      this.peerState = { ...p, at: Date.now() };
    }));
    this.unsubs.push(onValue(this.ref('mon'), (s) => { this.mon = s.val() || {}; this.monAt = Date.now(); }));
    const evRef = this.ref(`ev/${this.uid}`);
    this.unsubs.push(onChildAdded(evRef, (s) => {
      this.events.push(s.val());
      remove(s.ref);
    }));
  }

  // 내 모습 보내기 (1초에 10번까지)
  sendState(st) {
    if (!this.active) return;
    const now = Date.now();
    if (now - this.lastSend < SEND_MS) return;
    this.lastSend = now;
    // 가만히 서 있어도 값이 바뀌어야 친구 쪽에 소식이 가요 (안 그러면 3초 뒤 「떠남」으로 보여요)
    this.dbM.set(this.ref(`state/${this.uid}`), { ...st, t: now }).catch((e) => console.warn('[협동] 보내기 실패', e));
  }

  sendMon(sceneKey, arr) {
    if (!this.active || !this.isHost) return;
    try {
      this.dbM.set(this.ref(`mon/${sceneKey}`), arr).catch((e) => console.warn('[협동] 몬스터 보내기 실패', e));
    } catch (e) { console.warn('[협동] 몬스터 정보가 이상해요', e); }
  }

  send(ev) {
    const to = this.peerId;
    if (!to) return;
    try { this.dbM.push(this.ref(`ev/${to}`), ev).catch(() => {}); } catch (e) { console.warn('[협동] 알림 실패', e); }
  }

  takeEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  notify(msg) { this.game.events.emit('party:msg', msg); }

  async leave() {
    if (!this.room) return;
    const { remove } = this.dbM;
    const room = this.room;
    const wasHost = this.isHost;
    this.cleanup();
    try {
      if (wasHost) await remove(this.dbM.ref(this.db, `rooms/${room}`));
      else {
        await remove(this.dbM.ref(this.db, `rooms/${room}/members/${this.uid}`));
        await remove(this.dbM.ref(this.db, `rooms/${room}/state/${this.uid}`));
      }
    } catch { /* 괜찮아요 */ }
    this.notify('파티에서 나왔어요');
  }

  left(msg) {
    this.cleanup();
    this.notify(msg);
  }

  cleanup() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.room = null;
    this.isHost = false;
    this.members = {};
    this.peerState = null;
    this.mon = {};
    this.events = [];
  }
}
