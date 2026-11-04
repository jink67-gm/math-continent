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
