// 퀘스트 (2~6번 마을과 혼돈의 첨탑). 1번 지역은 data/r1quests.js에 있어요.

// ── 2~6번 마을: 같은 이야기 뼈대에 마을마다 이름·대사만 바꿔요 ──
// 장소 이름(goals 키): 'Town' · 'Wild' · 'Dungeon' (+ 첨탑은 'Dungeon:chaosSpire')
import { REGIONS, SPIRE } from './regions.js';
import { makeTown, makeWild, TOWN } from '../world/gen.js';

const cache = {};

export function regionQuests(id) {
  if (cache[id]) return cache[id];
  const r = REGIONS[id];
  // 마을 하나에서 레벨이 4쯤 오르도록: 퀘스트 경험치 합 E (나머지는 몬스터·보스)
  const E = Math.round(60 * 1.22 ** (4 * r.n + 1));
  const X = (share) => Math.round(E * share);
  const t = makeTown(id).goals;
  const w = makeWild(id).goals;
  const toWild = { Town: t.north };
  const list = [
    { id: 'meet', title: `${r.chief.name}께 인사하기`, type: 'talk', target: 'chief', desc: '광장 왼쪽 위 큰 집 앞의 대장님을 찾아요.',
      goals: { Town: t.chief }, lines: [`어서 오게, {name}! 나눔의 계곡을 구한 영웅이로군.`, r.story], reward: { exp: X(0.05), gold: 40 } },
    { id: 'gate', title: `${r.gate} 풀기`, type: 'rune', target: ['gate'], desc: '마을 북쪽 길을 막은 봉인의 룬을 풀어요.',
      goals: { Town: t.gate }, done: ['봉인이 풀리고 길이 열렸어요!', `북쪽 「${r.wildName}」 끝에 「${r.dungeonName}」이 있대요.`], reward: { exp: X(0.15), gold: 50, potions: 1 } },
    { id: 'find', title: `${r.dungeonName} 찾기`, type: 'enter', target: `Dungeon:${id}`, desc: `${r.wildName}을 지나 북쪽 끝의 던전으로 들어가요.`,
      goals: { ...toWild, Wild: w.mouth }, done: ['던전 깊은 곳에 봉인된 문이 있어요.', '양옆의 룬 기둥 두 개를 깨워야 열려요.'], reward: { exp: X(0.15), gold: 60 } },
    { id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['dA', 'dB'], desc: '던전 속 룬 기둥 두 개를 모두 깨워요.',
      goals: { ...toWild, Wild: w.mouth, Dungeon: [20, 23] }, done: ['쿠르릉… 봉인된 문이 열렸어요!', '문 너머에서 커다란 기운이 느껴져요. 준비하고 들어가요.'], reward: { exp: X(0.2), potions: 2 } },
    { id: 'boss', title: r.boss.name, type: 'boss', target: r.boss.id, desc: '던전 안쪽 방의 보스를 물리치고 결정을 되찾아요.',
      goals: { ...toWild, Wild: w.mouth, Dungeon: [20, 12] }, done: [`${r.boss.name}을(를) 물리쳤어요!`, '결정을 되찾았어요. 마을 대장님께 가져다드려요.'], reward: { exp: X(0.25), gold: 150 * r.n, potions: 2 } },
    { id: 'report', title: '대장님께 결정 돌려드리기', type: 'talk', target: 'chief', desc: '되찾은 결정을 대장님께 가져다드려요.',
      goals: { Town: t.chief, Wild: w.south, Dungeon: [20, 49.5] },
      lines: ['오오, 결정이 다시 빛나는구먼!', `{name}, 자네 덕분에 ${r.name}이(가) 다시 평화로워졌네.`, id === 'solidPeaks' ? '이제 동쪽 「혼돈의 첨탑」만 남았네. 모든 결정의 힘을 모아 제로를 막아 주게!' : '동쪽 길로 가면 다음 마을이 있다네. 행운을 비네!'],
      reward: { exp: X(0.2), gold: 100 * r.n } },
  ];
  if (id === 'solidPeaks') {
    list.push(
      { id: 'spire', title: '혼돈의 첨탑으로', type: 'enter', target: 'Dungeon:chaosSpire', desc: '마을 동쪽 길 끝의 혼돈의 첨탑으로 들어가요.',
        goals: { Town: t.east }, done: ['여섯 단원의 문제가 모두 섞인 탑이에요.', '룬 기둥 두 개를 깨워 꼭대기로 가요!'], reward: { exp: 500 } },
      { id: 'spireSeal', title: '혼돈의 봉인 풀기', type: 'rune', target: ['sA', 'sB'], desc: '첨탑의 룬 기둥 두 개를 깨워요 (여섯 단원 섞어서).',
        goals: { Town: t.east, 'Dungeon:chaosSpire': [20, 23] }, done: ['혼돈의 문이 열렸어요!'], reward: { exp: 800, potions: 3 } },
      { id: 'zero', title: SPIRE.boss.name, type: 'boss', target: SPIRE.boss.id, desc: '탑 꼭대기의 혼돈의 군주 제로를 물리쳐요!',
        goals: { Town: t.east, 'Dungeon:chaosSpire': [20, 12] },
        done: ['혼돈의 군주 제로를 물리쳤어요!', '여섯 결정의 빛이 수학 대륙 전체로 퍼져 나가요.', '축하해요, {name}! 여섯 마을의 봉인을 모두 지켜 냈어요!'],
        reward: { exp: 2000, gold: 1000 } },
    );
  }
  cache[id] = list;
  return list;
}
export { TOWN };
