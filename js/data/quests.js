import { CONTENT_QUESTS } from './villageContent.js';

// 퀘스트 목록
// type:
//   kill    — target 몬스터를 count마리 처치
//   collect — target 아이템을 count개 모으기 (퀘스트를 받은 뒤부터 셈)
//   talk    — target NPC와 대화하기 (그 자리에서 바로 완료)
//   explore — target 지역에 도착하기
//   rune    — target 룬 돌을 수학으로 깨우기
//   boss    — target 보스 쓰러뜨리기
// targets: [여러 목표] (예: 룬 2개 깨우기) — count와 함께 사용
// giver: 퀘스트를 주고, 완료를 보고받는 NPC
// requires: { level, quests: [먼저 끝내야 하는 퀘스트] }
// reward: { exp, gold, items: [[아이템, 개수]], unlockSkill }
// 모든 퀘스트가 수학 문제인 것은 아니에요. (rune 타입만 수학)

export const QUESTS = {
  q_first_hunt: {
    title: '첫 사냥', giver: 'fairy', type: 'kill', target: 'slime', count: 3,
    desc: '초원 서쪽에서 슬라임이 말썽이에요. 3마리만 혼내 주세요!',
    reportText: '와! 벌써 해냈어요? 진짜 모험가네요!',
    reward: { exp: 20, gold: 20, items: [['potion_s', 2]] },
  },
  q_meet_master: {
    title: '룬 할아버지를 찾아서', giver: 'fairy', type: 'talk', target: 'runeMaster',
    requires: { quests: ['q_first_hunt'] },
    desc: '강 건너 분수 계곡 마을에 계신 룬 할아버지께 인사드려 보세요. 새로운 기술을 가르쳐 주실 거예요.',
    reportText: '허허, 요정이 보냈구나. 반갑다, 젊은 모험가여.',
    reward: { exp: 15 },
  },
  q_spores: {
    title: '버섯 포자 모으기', giver: 'fairy', type: 'collect', target: 'mushroom_spore', count: 5,
    requires: { quests: ['q_first_hunt'] },
    desc: '버섯 몬스터가 떨어뜨리는 반짝이는 포자를 5개 모아 주세요. 마법 약을 만들 거예요!',
    reportText: '반짝반짝해요! 이걸로 멋진 약을 만들 수 있겠어요.',
    reward: { exp: 35, gold: 25, items: [['leather_gloves', 1]] },
  },
  q_explore: {
    title: '동쪽 꽃밭 탐험', giver: 'board', type: 'explore', target: 'eastGarden',
    desc: '초원 동쪽 끝에 커다란 꽃밭이 있다는 소문이 있어요. 직접 가 보세요.',
    reportText: '탐험 보고서 접수 완료!',
    reward: { exp: 25, gold: 30 },
  },
  q_rune: {
    title: '고대 룬 깨우기', giver: 'runeMaster', type: 'rune', target: 'meadowRune',
    requires: { quests: ['q_meet_master'] },
    desc: '초원 북쪽에 잠든 룬 돌이 있단다. 수학의 힘으로 깨워 오너라.',
    reportText: '오오, 룬이 깨어났구나! 이제 「강타」를 배울 자격이 있다.',
    reward: { exp: 40, unlockSkill: 'smash' },
  },
  q_bats: {
    title: '박쥐 소동', giver: 'board', type: 'kill', target: 'bat', count: 4,
    requires: { level: 3 },
    desc: '동쪽 숲의 분수 박쥐가 밤마다 시끄러워요. 4마리를 쫓아내 주세요.',
    reportText: '이제 조용히 잘 수 있겠어요!',
    reward: { exp: 40, gold: 35, items: [['enhance_stone', 1]] },
  },
  q_big_mushroom: {
    title: '큰 버섯 퇴치', giver: 'board', type: 'kill', target: 'bigMushroom', count: 1,
    requires: { level: 4 },
    desc: '남동쪽 숲에 거대한 버섯이 나타났어요! 조심해서 물리쳐 주세요.',
    reportText: '대단해요! 큰 버섯을 물리치다니!',
    reward: { exp: 60, gold: 50, items: [['iron_sword', 1]] },
  },

  // ---------- 분수 계곡 메인 이야기 ----------
  q_to_village: {
    title: '분수 계곡 마을로', giver: 'fairy', type: 'talk', target: 'chief',
    requires: { quests: ['q_first_hunt'] }, main: true,
    desc: '초원 북쪽 나무다리를 건너면 분수 계곡 마을이 있어요. 풍차 촌장님을 만나 보세요!',
    reportText: '오오, 자네가 요정이 말한 모험가로군! 우리 계곡에 큰일이 생겼다네.',
    reward: { exp: 20, gold: 20 },
  },
  q_bridge: {
    title: '부서진 다리 고치기', giver: 'chief', type: 'rune', target: 'brokenBridge',
    requires: { quests: ['q_to_village'] }, main: true,
    desc: '동굴로 가는 강의 나무다리가 부서졌다네. 다리 기둥의 수학 룬을 맞춰 다리를 고쳐 주게.',
    reportText: '다리가 다시 튼튼해졌군! 이제 계곡 동굴로 갈 수 있다네.',
    reward: { exp: 40, gold: 30, items: [['potion_s', 2]] },
  },
  q_cave: {
    title: '계곡 동굴 탐사', giver: 'chief', type: 'explore', target: 'caveDeep',
    requires: { quests: ['q_bridge'] }, main: true,
    desc: '다리 건너 북쪽 돌계단을 올라 「계곡 바위 숲」을 지나면 계곡 동굴이 있다네. 동굴 안쪽에 무엇이 있는지 살펴보고 오게. 동굴 몬스터는 초원보다 강하니 조심하게!',
    reportText: '동굴 깊은 곳에 봉인된 문이 있었다고? 역시 그 녀석이로군…',
    reward: { exp: 50, gold: 40 },
  },
  q_seal: {
    title: '봉인된 문 열기', giver: 'chief', type: 'rune', targets: ['caveRuneA', 'caveRuneB'], count: 2,
    requires: { quests: ['q_cave'] }, main: true,
    desc: '동굴 깊은 곳 봉인된 문 너머에 「분수의 결정」이 있다네. 동굴 안 룬 기둥 2개를 깨우면 문이 열릴 걸세. 그런데… 요즘 그 봉인에서 이상한 소리가 난다는구먼.',
    reportText: '문이 열렸다니! 그런데 큰일일세. 문 너머 봉인 제단에 금이 갔다는 소식이 들려왔네…',
    reward: { exp: 60, items: [['potion_m', 2]] },
  },
  q_boss: {
    title: '봉인 의식과 나눗셈 트롤', giver: 'chief', type: 'boss', target: 'reciprocalTroll',
    requires: { quests: ['q_seal'] }, main: true,
    desc: '문 너머 「봉인 제단」에 금이 가서, 오래전 가둬 둔 나눗셈 트롤이 깨어나려 하고 있네! 제단에서 봉인 의식(분수의 나눗셈 룬)을 올려 주게. 만약 트롤이 깨어나면… 물리치고 「분수의 결정」을 되찾아 주게! 싸우는 도중 「수학의 봉인」이 나타나면 문제를 풀어 보호막을 깨뜨리게.',
    reportText: '풍차가 다시 힘차게 도는군! 자네는 분수 계곡의 영웅일세!',
    reward: { exp: 100, gold: 100, items: [['potion_m', 3]] },
  },
  q_jelly: {
    title: '대장간의 재료', giver: 'smith', type: 'collect', target: 'slime_jelly', count: 5,
    requires: { quests: ['q_to_village'] },
    desc: '강화에 쓸 슬라임 젤리가 모자라네. 5개만 모아 주면 귀한 강화석을 주지!',
    reportText: '말랑말랑 좋구먼! 약속한 강화석일세.',
    reward: { exp: 30, items: [['enhance_stone', 2]] },
  },
};

Object.assign(QUESTS, CONTENT_QUESTS);

export const QUEST_ORDER = Object.keys(QUESTS);
