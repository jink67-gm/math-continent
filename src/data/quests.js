// 퀘스트 (1번 마을: 나눔의 계곡 프락시아)
//
// 메인 이야기는 한 단계씩 차례로 진행돼요. 단계마다:
//   type   talk(사람과 이야기) · rune(룬 풀기) · enter(장소 도착) · boss(보스 정화)
//   target 대상 (talk = NPC id, rune = 룬 id 목록, enter = 장면, boss = 보스 id)
//   goals  장면마다 화살표가 가리킬 곳 [x칸, y칸] (그 장면에 없으면 가까운 출구)
//   start  단계가 시작될 때 말해 주는 사람과 대사 (talk 단계는 그 대화로 끝나요)
//   reward 경험치·골드·회복약
// 대사 속 {name}은 주인공 이름으로 바뀌어요.

export const MAIN = [
  {
    id: 'meet', title: '풍차 촌장 모모 만나기', type: 'talk', target: 'chief',
    desc: '광장 왼쪽 위 큰 집 앞의 촌장님께 인사드려요.',
    goals: { Village: [18.2, 17.4], Field: [23, 0.5] },
    lines: [
      '오오, {name}! 자네가 정령 피피가 말한 모험가로군.',
      '우리 계곡의 풍차는 「분수의 결정」의 힘으로 돈다네. 그런데 뒤집기 트롤 인버트롤이 결정을 가져가 동굴 깊이 숨어 버렸어.',
      '동굴로 가려면 북쪽 강을 건너야 하는데… 다리가 부서졌지 뭔가. 다리 기둥의 수학 룬을 맞추면 다시 이어질 걸세!',
    ],
    reward: { exp: 15, gold: 20 },
  },
  {
    id: 'bridge', title: '부서진 다리 고치기', type: 'rune', target: ['bridge'],
    desc: '북쪽 강의 부서진 다리에서 룬을 풀어요.',
    goals: { Village: [23, 8.6], Field: [23, 0.5] },
    done: ['다리가 다시 이어졌어요!', '이제 북쪽 「계곡 바위 숲」으로 갈 수 있어요. 숲 끝에 「뒤집힌 동굴」이 있대요.'],
    reward: { exp: 30, gold: 30, potions: 1 },
  },
  {
    id: 'cave', title: '뒤집힌 동굴 찾기', type: 'enter', target: 'Cave',
    desc: '계곡 바위 숲을 지나 북쪽 끝의 동굴로 들어가요.',
    goals: { Village: [23, 0.5], RockForest: [24, 1], Field: [23, 0.5] },
    done: ['서늘한 바람이 불어와요…', '동굴 깊은 곳에 봉인된 문이 있어요. 문 양옆의 룬 기둥 두 개를 깨워야 열려요.'],
    reward: { exp: 40, gold: 30 },
  },
  {
    id: 'seal', title: '봉인된 문 열기', type: 'rune', target: ['caveA', 'caveB'],
    desc: '동굴 속 룬 기둥 두 개를 모두 깨워요.',
    goals: { Village: [23, 0.5], RockForest: [24, 1], Field: [23, 0.5] },
    done: ['쿠르릉… 봉인된 문이 열렸어요!', '문 너머에서 커다란 숨소리가 들려요. 회복약을 챙기고 들어가요.'],
    reward: { exp: 50, potions: 2 },
  },
  {
    id: 'troll', title: '뒤집기 트롤 인버트롤', type: 'boss', target: 'troll',
    desc: '동굴 안쪽 방의 인버트롤을 정화하고 「분수의 결정」을 되찾아요.',
    goals: { Village: [23, 0.5], RockForest: [24, 1], Field: [23, 0.5] },
    done: ['인버트롤이 정화됐어요!', '「분수의 결정」을 되찾았어요. 촌장님께 가져다드려요.'],
    reward: { exp: 120, gold: 100, potions: 2 },
  },
  {
    id: 'report', title: '촌장님께 결정 돌려드리기', type: 'talk', target: 'chief',
    desc: '분수의 결정을 촌장님께 가져다드려요.',
    goals: { Village: [18.2, 17.4], RockForest: [24, 41], Cave: [20, 40], Field: [23, 0.5] },
    lines: [
      '오오! 분수의 결정이 다시 반짝이는구먼!',
      '보게, 풍차가 힘차게 돌기 시작했어. {name}, 자네는 나눔의 계곡의 영웅일세!',
      '나누기는 「뒤집어서 곱하기」라는 걸 잊지 말게. 다음 마을에서도 그 힘이 도움이 될 걸세.',
    ],
    reward: { exp: 60, gold: 80 },
  },
];

// 곁 퀘스트: 안내 정령 피피의 「첫 정화」
export const SIDE = {
  hunt: {
    title: '첫 정화', giver: ['pipi', 'pipiField'], need: 5,
    desc: '출발의 초원에서 몬스터 5마리를 정화해요.',
    start: ['모험가님, 초원의 몬스터들이 나쁜 기운 때문에 심술이 났어요.', '5마리만 정화해 주실래요? 다 하면 저한테 다시 말 걸어 주세요!'],
    ready: ['우와, 벌써 5마리나! 초원이 한결 맑아졌어요.', '고마워요! 이건 제 선물이에요.'],
    reward: { exp: 30, potions: 2 },
  },
};

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
    { id: 'boss', title: r.boss.name, type: 'boss', target: r.boss.id, desc: '던전 안쪽 방의 보스를 정화하고 결정을 되찾아요.',
      goals: { ...toWild, Wild: w.mouth, Dungeon: [20, 12] }, done: [`${r.boss.name}이(가) 정화됐어요!`, '결정을 되찾았어요. 마을 대장님께 가져다드려요.'], reward: { exp: X(0.25), gold: 150 * r.n, potions: 2 } },
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
      { id: 'zero', title: SPIRE.boss.name, type: 'boss', target: SPIRE.boss.id, desc: '탑 꼭대기의 혼돈의 군주 제로를 정화해요!',
        goals: { Town: t.east, 'Dungeon:chaosSpire': [20, 12] },
        done: ['혼돈의 군주 제로가 정화됐어요!', '여섯 결정의 빛이 수학 대륙 전체로 퍼져 나가요.', '축하해요, {name}! 여섯 마을의 봉인을 모두 지켜 냈어요!'],
        reward: { exp: 2000, gold: 1000 } },
    );
  }
  cache[id] = list;
  return list;
}
export { TOWN };
