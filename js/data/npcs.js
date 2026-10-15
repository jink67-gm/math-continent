import { CONTENT_NPCS } from './villageContent.js';

// NPC 이름과 평소 대사
// role: 'quest' 퀘스트 주기 / 'skill' 스킬 마스터 / 'board' 퀘스트 게시판
// (상점 'shop', 대장장이 'forge', 회복 'heal'은 3단계 마을에서 추가)

export const NPCS = {
  fairy: {
    name: '안내 요정 피피', role: 'quest', portrait: 'fairy',
    lines: [
      '오늘도 힘내요, 모험가님!',
      '레벨이 오르면 성장 시험이 열려요. 맞히면 보너스 능력을 골라요!',
      '몬스터가 떨어뜨린 물건은 가까이 가면 저절로 주워져요.',
      'Q 키(또는 🧪 버튼)를 누르면 회복약을 바로 먹을 수 있어요.',
    ],
  },
  runeMaster: {
    name: '룬 할아버지', role: 'skill', portrait: 'runeMaster',
    lines: [
      '기술은 힘만으로 배우는 게 아니란다. 수학의 룬을 깨워야 하지.',
      '레벨이 오르면 새로운 기술을 가르쳐 주마.',
      '허허, 서두르지 말거라. 틀려도 다시 도전하면 된단다.',
    ],
  },
  chief: {
    name: '풍차 촌장 모모', role: 'quest', portrait: 'chief',
    lines: [
      '분수 계곡에 온 걸 환영하네. 바람이 참 좋지?',
      '풍차가 다시 힘차게 돌려면 분수의 결정이 필요하다네.',
      '계곡 동굴은 위험하니 회복약을 꼭 챙기게.',
    ],
  },
  merchant: {
    name: '상인 루루', role: 'shop', portrait: 'merchant',
    lines: ['어서 오세요! 좋은 물건 많아요~', '쓰지 않는 재료는 팔아서 골드로 바꿀 수 있어요!'],
  },
  smith: {
    name: '대장장이 쿵쿵', role: 'forge', portrait: 'smith',
    lines: [
      '쾅! 쾅! 장비를 강화하려면 재료와 수학 실력이 필요하지!',
      '문제를 틀려도 재료는 사라지지 않으니 걱정 말게.',
    ],
  },
  board: {
    name: '퀘스트 게시판', role: 'board', portrait: 'board',
    lines: ['새로운 의뢰가 붙어 있지 않아요. 나중에 다시 와 보세요.'],
  },
};

Object.assign(NPCS, CONTENT_NPCS);
