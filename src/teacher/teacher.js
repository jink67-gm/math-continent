// 선생님 화면: Google 로그인 → 학생 목록(saves 모음) → 선물 보내기 · 경험치 2배 시간
// 선생님인지는 Firestore 보안 규칙이 teachers/{이메일} 문서로 확인해요.

import { firebaseConfig } from '../save/firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
const USE_EMULATOR = new URLSearchParams(location.search).has('emu');

const VILLAGES = { fractionValley: '나눔의 계곡 프락시아' };
const DIFFS = { easy: '쉬움', normal: '보통', hard: '어려움' };

const $ = (id) => document.getElementById(id);
let fb;
let students = [];
let showCodes = false;

async function init() {
  const [appM, authM, fsM] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = appM.initializeApp(firebaseConfig);
  const auth = authM.getAuth(app);
  const db = fsM.getFirestore(app);
  if (USE_EMULATOR) {
    authM.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    fsM.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  fb = { authM, fsM, auth, db };
  window.teacherFb = fb; // 개발·점검용

  $('google').onclick = login;
  $('logout').onclick = () => authM.signOut(auth);
  $('refresh').onclick = loadStudents;
  $('send').onclick = sendGifts;
  $('saveCfg').onclick = saveCfg;
  $('all').onchange = (e) => document.querySelectorAll('.pick').forEach((c) => { c.checked = e.target.checked; });
  $('toggleCodes').onclick = () => { showCodes = !showCodes; $('toggleCodes').textContent = showCodes ? '저장 코드 숨기기' : '저장 코드 보기'; render(); };
  document.querySelectorAll('[data-boost]').forEach((b) => { b.onclick = () => setBoost(Number(b.dataset.boost)); });

  authM.onAuthStateChanged(auth, onUser);
}

async function login() {
  const { authM, auth } = fb;
  setStatus('loginStatus', '로그인 중...');
  try {
    await authM.signInWithPopup(auth, new authM.GoogleAuthProvider());
  } catch (e) {
    setStatus('loginStatus', `로그인하지 못했어요 (${e.code || e.message})`, true);
  }
}

async function onUser(user) {
  const signedIn = !!user && !user.isAnonymous;
  $('logout').hidden = !signedIn;
  $('who').textContent = signedIn ? user.email : '';
  $('app').hidden = true;
  $('login').hidden = signedIn;
  if (!signedIn) return;
  const { fsM, db } = fb;
  try {
    const snap = await fsM.getDoc(fsM.doc(db, 'teachers', user.email));
    if (!snap.exists()) throw new Error('not-teacher');
  } catch (e) {
    $('login').hidden = false;
    setStatus('loginStatus', `${user.email} 은(는) 아직 선생님으로 등록되지 않았어요. Firestore의 teachers 모음에 이 이메일로 문서를 만들어 주세요.`, true);
    return;
  }
  $('app').hidden = false;
  loadStudents();
  loadBoost();
}

async function loadStudents() {
  const { fsM, db } = fb;
  setStatus('listStatus', '불러오는 중...');
  try {
    const snap = await fsM.getDocs(fsM.collection(db, 'saves'));
    students = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.nickname).localeCompare(String(b.nickname), 'ko'));
    setStatus('listStatus', '');
    render();
  } catch (e) {
    setStatus('listStatus', `학생 목록을 불러오지 못했어요 (${e.code || e.message}). 보안 규칙을 배포했는지 확인해 주세요.`, true);
  }
}

// 학생이 쓴 글자(별명)는 textContent로만 넣어요
function cell(tr, text, cls) {
  const td = document.createElement('td');
  if (cls) td.className = cls;
  td.textContent = text;
  tr.appendChild(td);
  return td;
}

function render() {
  const body = $('rows');
  const checked = new Set([...document.querySelectorAll('.pick:checked')].map((c) => c.value));
  body.replaceChildren();
  for (const s of students) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'pick';
    cb.value = s.id;
    cb.checked = checked.has(s.id);
    cb.setAttribute('aria-label', `${s.nickname} 선택`);
    td.appendChild(cb);
    tr.appendChild(td);
    cell(tr, s.nickname || '(이름 없음)');
    cell(tr, String(s.level || 1), 'num');
    cell(tr, VILLAGES[s.currentVillage] || s.currentVillage || '-');
    cell(tr, DIFFS[s.difficulty] || '보통');
    const m = Object.values(s.save?.math || {});
    const c = m.reduce((a, u) => a + (u.c || 0), 0);
    const total = c + m.reduce((a, u) => a + (u.w || 0), 0);
    cell(tr, total ? `${Math.round((c / total) * 100)}% (${c}/${total})` : '-', 'num');
    cell(tr, `${Math.round((s.playTime || 0) / 60)}분`, 'num');
    cell(tr, s.updatedAt?.toDate ? ago(s.updatedAt.toDate()) : '-');
    const code = cell(tr, '');
    const c = document.createElement('code');
    c.textContent = showCodes ? `${s.id.slice(0, 4)}-${s.id.slice(4)}` : `${s.id.slice(0, 2)}··-····`;
    code.appendChild(c);
    body.appendChild(tr);
  }
  $('count').textContent = `${students.length}명`;
}

function ago(d) {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  if (m < 60 * 24) return `${Math.round(m / 60)}시간 전`;
  return d.toLocaleDateString('ko-KR');
}

const clampInt = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

async function sendGifts() {
  const codes = [...document.querySelectorAll('.pick:checked')].map((c) => c.value);
  const exp = clampInt($('gExp').value, 5000);
  const gold = clampInt($('gGold').value, 10000);
  const potions = clampInt($('gPot').value, 20);
  const note = $('gNote').value.trim().slice(0, 40);
  if (!codes.length) { setStatus('sendStatus', '학생을 먼저 골라 주세요', true); return; }
  if (!exp && !gold && !potions) { setStatus('sendStatus', '보낼 경험치·골드·회복약을 적어 주세요', true); return; }
  const { fsM, db, auth } = fb;
  $('send').disabled = true;
  setStatus('sendStatus', '보내는 중...');
  try {
    const batch = fsM.writeBatch(db);
    for (const code of codes) {
      batch.set(fsM.doc(fsM.collection(db, 'saves', code, 'grants')), {
        exp, gold, potions, note, by: auth.currentUser.email, createdAt: fsM.serverTimestamp(),
      });
    }
    await batch.commit();
    setStatus('sendStatus', `${codes.length}명에게 보냈어요. 학생 화면에는 최대 90초 안에 도착해요.`);
  } catch (e) {
    setStatus('sendStatus', `보내지 못했어요 (${e.code || e.message})`, true);
  } finally {
    $('send').disabled = false;
  }
}

async function loadBoost() {
  const { fsM, db } = fb;
  try {
    const snap = await fsM.getDoc(fsM.doc(db, 'config', 'class'));
    const d = snap.exists() ? snap.data() : {};
    showBoost(d.expBoostUntil || 0);
    $('pi').value = d.piValue === 3 ? '3' : '3.14';
    $('unlockAll').checked = !!d.unlockAll;
  } catch { showBoost(0); }
}

async function saveCfg() {
  const { fsM, db } = fb;
  try {
    await fsM.setDoc(fsM.doc(db, 'config', 'class'), {
      piValue: $('pi').value === '3' ? 3 : 3.14, unlockAll: $('unlockAll').checked, updatedAt: fsM.serverTimestamp(),
    }, { merge: true });
    setStatus('cfgState', '저장했어요');
  } catch (e) { setStatus('cfgState', `저장하지 못했어요 (${e.code || e.message})`, true); }
}

function showBoost(until) {
  const el = $('boostState');
  if (until > Date.now()) {
    el.className = 'status boost-on';
    el.textContent = `켜져 있어요 · ${new Date(until).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}까지`;
  } else {
    el.className = 'status';
    el.textContent = '꺼져 있어요';
  }
}

async function setBoost(minutes) {
  const { fsM, db } = fb;
  const until = minutes ? Date.now() + minutes * 60000 : 0;
  try {
    await fsM.setDoc(fsM.doc(db, 'config', 'class'), { expBoostUntil: until, updatedAt: fsM.serverTimestamp() }, { merge: true });
    showBoost(until);
  } catch (e) {
    const el = $('boostState');
    el.className = 'status err';
    el.textContent = `바꾸지 못했어요 (${e.code || e.message})`;
  }
}

function setStatus(id, text, err = false) {
  const el = $(id);
  el.textContent = text;
  el.classList.toggle('err', err);
}

init().catch((e) => setStatus('loginStatus', `Firebase에 연결하지 못했어요 (${e.message})`, true));
