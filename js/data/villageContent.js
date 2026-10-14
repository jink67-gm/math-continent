// =====================================================
// 마을 2~6 + 혼돈의 첨탑 콘텐츠 (한 곳에 모아 둔 데이터)
// =====================================================
// 여기 적힌 내용으로 몬스터·보스·아이템·NPC·퀘스트·상점 목록이 자동으로 만들어져요.
// 이름이나 대사, 숫자를 바꾸고 싶으면 이 파일만 고치면 됩니다.
// (분수 계곡은 3단계에서 직접 만든 데이터를 그대로 써요)

// 몬스터 기본값 (행동 방식별)
const BASE = {
  hop: { hp: 40, attack: 8, defense: 1, speed: 55, radius: 17, aggro: 175, attackRange: 78, windup: 0.45, cooldown: 1.6, exp: 9, gold: [3, 5] },
  puff: { hp: 55, attack: 10, defense: 2, speed: 45, radius: 18, aggro: 160, attackRange: 62, windup: 0.55, cooldown: 2.0, puffRadius: 80, exp: 11, gold: [3, 6] },
  swoop: { hp: 42, attack: 9, defense: 1, speed: 90, radius: 15, aggro: 230, attackRange: 170, windup: 0.45, cooldown: 1.9, flying: true, exp: 10, gold: [3, 5] },
  shoot: { hp: 45, attack: 9, defense: 1, speed: 50, radius: 16, aggro: 260, attackRange: 280, windup: 0.6, cooldown: 2.3, keepDistance: 190, exp: 11, gold: [3, 6] },
};

// 마을 순서(티어)에 따른 강해지는 정도
const TIER = {
  2: { hp: 2.2, attack: 1.7, def: 2, exp: 2.4, gold: 2 },
  3: { hp: 3.5, attack: 2.5, def: 4, exp: 4.0, gold: 3 },
  4: { hp: 5.0, attack: 3.3, def: 6, exp: 5.8, gold: 4 },
  5: { hp: 6.8, attack: 4.2, def: 8, exp: 7.8, gold: 5 },
  6: { hp: 8.8, attack: 5.2, def: 10, exp: 10, gold: 6 },
  7: { hp: 11, attack: 6, def: 12, exp: 12.5, gold: 7 },
};

// 마을별 던전 장치 퀘스트 (장치 id는 js/world/dungeonGimmicks.js와 같아요)
const DUNGEON_TASK = {
  cube: {
    title: '큐브 미궁의 블록 벽', ids: ['blockA', 'blockB'], word: '장치',
    desc: '미궁 곳곳이 큐브 블록 벽으로 막혔어요. 쌓기나무 장치 2개의 개수를 맞혀 벽을 내려 주세요. 서쪽 장치를 먼저 풀어야 동쪽 장치가 있는 방에 갈 수 있어요!',
    report: '블록 벽이 모두 내려갔군요! 미궁 깊은 곳에 봉인된 문이 보였다고요?',
  },
  harbor: {
    title: '침수 동굴의 수문', ids: ['sluiceA', 'sluiceB'], word: '수문',
    desc: '바닷물이 동굴에 들어차 길이 끊겼어요. 수문 눈금(소수)을 계산해서 수문 2개를 열면 물이 빠져요. 배를 고칠 부품도 그 안에 있대요!',
    report: '물이 빠졌네요! 이제 봉인된 문까지 걸어갈 수 있어요.',
  },
  castle: {
    title: '요새의 창살문', ids: ['portA', 'portB'], word: '창살문',
    desc: '기사단 요새의 창살문이 모두 내려갔어요. 도르래 톱니의 비율을 맞혀 창살문 2개를 올려 주세요. 이번엔 동쪽 문부터예요!',
    report: '창살문이 올라갔군요! 요새 깊은 곳까지 길이 열렸어요.',
  },
  forest: {
    title: '원형 제단 깨우기', ids: ['ringAltar'], word: '제단',
    desc: '유적 서쪽 길은 무너져 걸어갈 수 없어요. 원형 제단의 원주·넓이 룬을 풀면 마법진이 깨어나 순간이동으로 건너갈 수 있어요.',
    report: '마법진이 빛나기 시작했어요! 무너진 길 너머로 갈 수 있겠어요.',
  },
  snow: {
    title: '얼음벽과 화로', ids: ['iceWall'], word: '화로',
    desc: '광장의 주민들이 마법 얼음에 얼어붙었어요! 얼음 동굴 안쪽도 두꺼운 얼음벽으로 막혔어요. 빙판에서는 미끄러지니 조심하며 화로까지 가서, 입체도형 룬을 풀어 불을 붙여 주세요!',
    report: '얼음벽이 녹았군요! 동굴에 갇혀 있던 길이 열렸어요.',
  },
};

export const VILLAGE_CONTENT = [
  {
    village: 'cubeCity', s: 'cc', tier: 2, style: 'cube', levels: '6~10',
    npc: {
      chief: ['큐브 시장 블로키', ['반짝이는 큐브 도시에 온 걸 환영해요!', '공간의 결정이 사라진 뒤로 건물들이 삐걱거려요.']],
      merchant: ['상인 큐비', ['네모반듯한 물건만 팔아요~', '큐브 조각은 대장간에서 인기가 많아요.']],
      smith: ['대장장이 볼트', ['톱니바퀴처럼 착착! 강화해 줄게!', '틀려도 재료는 그대로니 마음껏 도전해!']],
      sage: ['룬 현자 아이소', ['위에서, 앞에서, 옆에서… 보는 방향에 따라 모양이 달라지지.', '기술을 배우려면 수학의 룬을 깨워야 한다.']],
    },
    materials: [['cube_chip', '큐브 조각', '🧊'], ['gear_part', '톱니 부품', '⚙️']],
    gear: {
      weapon: ['cube_blade', '큐브 블레이드', '🔷', 'rare', { attack: 14 }, { attack: 3 }, 380],
      armor: ['block_armor', '블록 갑옷', '🟪', 'uncommon', { defense: 7, maxHp: 45 }, { defense: 2, maxHp: 5 }, 300],
      sub: ['spring_boots', '용수철 신발', '👟', 'uncommon', { moveSpeed: 0.35, defense: 2 }, { defense: 1 }, 220, 'boots'],
      accessory: ['cube_brooch', '큐브 브로치', '💜', 'epic', { attack: 8, defense: 5, maxHp: 50 }, { attack: 1, defense: 1 }, 1200],
    },
    mobs: [
      ['cubeGolem', '큐브 골렘', 'cube', '#a77bff', 'hop'],
      ['blockMimic', '블록 미믹', 'mimic', '#e0a83a', 'puff'],
      ['cubeRobot', '입체 로봇', 'robot', '#6fd6ff', 'shoot'],
    ],
    gate: { name: '멈춘 큐브 엘리베이터', idle: '동굴로 가는 큐브 엘리베이터가 멈춰 있어요.\n시장님께 여쭤 볼까요?', prompt: '엘리베이터 판에 쌓기나무 룬이 반짝여요.\n문제를 풀면 다시 움직일 거예요!', done: '엘리베이터가 다시 힘차게 움직여요.', banner: ['엘리베이터 작동!', '북쪽 큐브 미궁으로 가는 길이 열렸어요'] },
    dungeon: { name: '큐브 미궁', floor: ['#3b3a66', '#43427a'], wall: ['#5a4fa0', '#6d63b8'], decor: ['#a77bff', '#3ee6d0', '#ff9ec2'] },
    boss: {
      id: 'cubeKing', name: '큐브 킹', sprite: 'cubeKing', color: '#a77bff', hp: 1800, attack: 26, defense: 8, speed: 70, radius: 48,
      exp: 420, gold: [260, 300], seals: [0.66, 0.33], projectile: 'cube', minion: 'cubeGolem',
      patterns: { 1: ['smash', 'charge', 'rocks'], 2: ['smash', 'rocks', 'summon', 'charge'], 3: ['smash', 'rocks', 'ring', 'summon', 'charge'] },
    },
    story: {
      gate: '큐브 엘리베이터를 고쳐 주세요', gateDesc: '북쪽 미궁으로 가는 큐브 엘리베이터가 멈췄어요. 엘리베이터 판의 쌓기나무 룬을 맞춰 주세요!',
      explore: '큐브 미궁 탐사', seal: '미궁의 봉인 풀기', bossQ: '큐브 킹 물리치기',
      bossDesc: '공간의 결정을 훔친 큐브 킹을 물리쳐 주세요! 봉인이 나타나면 수학으로 깨뜨려요.',
      end: '건물들이 다시 반듯하게 섰어요! 당신은 입체 도시의 영웅이에요!',
    },
  },
  {
    village: 'decimalHarbor', s: 'dh', tier: 3, style: 'harbor', levels: '10~14',
    npc: {
      chief: ['항구 선장 도트', ['어이, 모험가! 소수 항구에 온 걸 환영하네.', '등대 불이 꺼져서 배들이 길을 잃고 있다네.']],
      merchant: ['상인 펄', ['바다 건너 온 귀한 물건들이에요~', '조개껍데기는 대장간에서 쓰여요.']],
      smith: ['대장장이 앵커', ['닻처럼 단단하게 강화해 주지!', '소수점 하나 차이로 칼날이 달라진다네.']],
      sage: ['룬 현자 마린', ['소수점의 자리를 잘 보는 자가 바다를 지배하지요.', '수학의 룬을 깨우면 새 기술을 알려 줄게요.']],
    },
    materials: [['seashell', '조개껍데기', '🐚'], ['coral', '산호 조각', '🪸']],
    gear: {
      weapon: ['coral_sword', '산호 검', '🗡️', 'rare', { attack: 19 }, { attack: 4 }, 620],
      armor: ['sailor_coat', '선원 코트', '🧥', 'uncommon', { defense: 10, maxHp: 65 }, { defense: 2, maxHp: 8 }, 520],
      sub: ['crab_gloves', '집게 장갑', '🦀', 'uncommon', { attack: 5, defense: 2 }, { attack: 1 }, 380, 'gloves'],
      accessory: ['decimal_pendant', '소수점 펜던트', '🔵', 'epic', { attack: 11, defense: 7, maxHp: 70 }, { attack: 2, defense: 1 }, 1800],
    },
    mobs: [
      ['dropSlime', '물방울 슬라임', 'slime', '#5ec8f2', 'hop'],
      ['pirateCrab', '해적 게', 'crab', '#ff7a5c', 'puff'],
      ['inkOctopus', '먹물 문어', 'octopus', '#ff8fc8', 'shoot'],
    ],
    gate: { name: '꺼진 등대', idle: '항구 끝 등대의 불이 꺼져 있어요.\n선장님이 고칠 방법을 아실지도 몰라요.', prompt: '등대 문에 소수 룬이 새겨져 있어요.\n룬을 맞추면 등대 불이 켜질 거예요!', done: '등대가 밝게 빛나며 바닷길을 비춰요.', banner: ['등대 점등!', '해저 동굴로 가는 길이 보여요'] },
    dungeon: { name: '해저 동굴', floor: ['#1f4a66', '#245676'], wall: ['#2f6f8f', '#3b86a8'], decor: ['#5ec8f2', '#ff8fc8', '#ffd84d'] },
    boss: {
      id: 'decimalKraken', name: '소수점 크라켄', sprite: 'kraken', color: '#ff7aa8', hp: 2600, attack: 36, defense: 12, speed: 60, radius: 52,
      exp: 640, gold: [380, 440], seals: [0.66, 0.33], projectile: 'ink', minion: 'dropSlime',
      patterns: { 1: ['smash', 'rocks', 'smash'], 2: ['smash', 'rocks', 'ring', 'summon'], 3: ['smash', 'rocks', 'ring', 'summon', 'charge'] },
    },
    story: {
      gate: '등대에 불 밝히기', gateDesc: '항구 끝 등대의 불이 꺼졌다네. 등대 문의 소수 룬을 맞춰 불을 밝혀 주게!',
      explore: '해저 동굴 탐사', seal: '해저 봉인 풀기', bossQ: '소수점 크라켄 물리치기',
      bossDesc: '소수의 결정을 삼킨 크라켄을 물리쳐 주게! 봉인이 나타나면 수학으로 깨뜨리게.',
      end: '배들이 다시 바다로 나가는군! 자네는 소수 항구의 영웅일세!',
    },
  },
  {
    village: 'ratioKingdom', s: 'rk', tier: 4, style: 'castle', levels: '14~18',
    npc: {
      chief: ['국왕 프로포', ['비례 왕국에 온 것을 환영하오, 용사여.', '균형이 무너진 왕국을 구해 주시오.']],
      merchant: ['상인 레이시오', ['값과 양은 언제나 비례하지요! 헤헤.', '저울추는 대장간에서 귀하게 쓰여요.']],
      smith: ['대장장이 해머', ['비율이 딱 맞아야 명검이 나오는 법!', '실패해도 재료는 그대로 돌려주마.']],
      sage: ['룬 현자 밸런스', ['외항의 곱과 내항의 곱… 그것이 균형의 비밀이지.', '룬을 깨우면 기술을 전수하겠네.']],
    },
    materials: [['scale_weight', '저울추', '⚖️'], ['knight_crest', '기사 문장', '🛡️']],
    gear: {
      weapon: ['knight_sword', '기사의 검', '⚔️', 'rare', { attack: 25 }, { attack: 5 }, 900],
      armor: ['royal_armor', '왕실 갑옷', '🛡️', 'rare', { defense: 13, maxHp: 85 }, { defense: 3, maxHp: 10 }, 780],
      sub: ['knight_boots', '기사 장화', '🥾', 'uncommon', { moveSpeed: 0.4, defense: 4 }, { defense: 1 }, 520, 'boots'],
      accessory: ['balance_medal', '천칭 훈장', '🏅', 'epic', { attack: 14, defense: 9, maxHp: 90 }, { attack: 2, defense: 2 }, 2400],
    },
    mobs: [
      ['ratioGoblin', '비율 고블린', 'goblin', '#7fc95a', 'hop'],
      ['scaleGolem', '저울 골렘', 'golem', '#c9b27a', 'puff'],
      ['knightMob', '기사 몬스터', 'knight', '#9fb0d0', 'swoop'],
      ['goblinArcher', '고블린 궁수', 'goblin', '#8fa36b', 'shoot'],
    ],
    gate: { name: '잠긴 성문', idle: '왕성 뒤 지하 감옥으로 가는 성문이 굳게 잠겨 있어요.', prompt: '성문 저울에 비례식 룬이 새겨져 있어요.\n균형을 맞추면 문이 열릴 거예요!', done: '성문 저울이 수평을 이루며 문이 열렸어요.', banner: ['성문 열림!', '지하 감옥으로 가는 길이 열렸어요'] },
    dungeon: { name: '왕성 지하 감옥', floor: ['#4a4038', '#544840'], wall: ['#6e6258', '#857668'], decor: ['#e8b931', '#ff5a5a', '#c9b27a'] },
    boss: {
      id: 'scaleKnightKing', name: '천칭 기사왕', sprite: 'scaleKing', color: '#ffcc33', hp: 3500, attack: 46, defense: 16, speed: 80, radius: 50,
      exp: 900, gold: [520, 600], seals: [0.7, 0.4], projectile: 'sword', minion: 'ratioGoblin',
      // 전용 보스: js/battle/ScaleKingBoss.js (2페이즈 · 검 베기/돌진 베기/심판의 천칭/광역 심판 참격)
      shieldName: '심판의 보호막', sealLine: '천칭 기사왕이 「심판의 보호막」을 펼쳤다! 문제를 풀어 천칭의 균형을 되찾자!',
      patterns: { 1: ['charge', 'smash', 'rocks'], 2: ['charge', 'smash', 'rocks', 'summon'], 3: ['charge', 'smash', 'rocks', 'ring', 'summon'] },
    },
    story: {
      gate: '성문의 균형 맞추기', gateDesc: '지하 감옥으로 가는 성문이 잠겼소. 성문 저울의 비례식 룬을 맞춰 주시오!',
      explore: '지하 감옥 탐사', seal: '감옥의 봉인 풀기', bossQ: '천칭 기사왕 물리치기',
      bossDesc: '비례의 결정을 빼앗은 천칭 기사왕을 물리쳐 주시오! 봉인이 나타나면 수학으로 깨뜨리시오.',
      end: '왕국의 균형이 돌아왔소! 그대는 비례 왕국의 영웅이오!',
    },
  },
  {
    village: 'circleForest', s: 'cf', tier: 5, style: 'forest', levels: '18~22',
    npc: {
      chief: ['숲의 장로 서클', ['동그란 호수의 숲에 온 걸 환영해요.', '원의 결정이 사라져 나무들이 시들고 있어요.']],
      merchant: ['상인 링고', ['둥글둥글 좋은 물건 있어요~', '둥근 잎은 대장간에서 쓰인대요.']],
      smith: ['대장장이 우드', ['나이테처럼 단단하게!', '재료 걱정은 말고 문제를 풀어 보게.']],
      sage: ['룬 현자 파이', ['원주율은 언제나 같단다. 원의 크기가 달라도 말이지.', '룬을 깨운 자에게 기술을 주마.']],
    },
    materials: [['round_leaf', '둥근 잎', '🍃'], ['ring_wood', '나이테 조각', '🪵']],
    gear: {
      weapon: ['ancient_blade', '고대 나무 검', '🌳', 'rare', { attack: 32 }, { attack: 6 }, 1250],
      armor: ['bark_armor', '나무껍질 갑옷', '🪵', 'rare', { defense: 16, maxHp: 105 }, { defense: 3, maxHp: 12 }, 1080],
      sub: ['ring_gloves', '고리 장갑', '🧤', 'rare', { attack: 8, defense: 3 }, { attack: 2 }, 760, 'gloves'],
      accessory: ['pi_ring', '원주 반지', '⭕', 'epic', { attack: 17, defense: 11, maxHp: 110 }, { attack: 2, defense: 2 }, 3000],
    },
    mobs: [
      ['ringSlime', '링 슬라임', 'slime', '#3fd1c8', 'hop'],
      ['wheelMob', '바퀴 몬스터', 'wheel', '#c48a52', 'swoop'],
      ['roundGolem', '원형 골렘', 'golem', '#6fbf6a', 'puff'],
      ['leafSprite', '나뭇잎 정령', 'sprite', '#7fd36b', 'shoot'],
    ],
    gate: { name: '잠든 원형 제단', idle: '숲 속 유적으로 가는 길을 원형 제단이 막고 있어요.', prompt: '제단에 원주율 룬이 새겨져 있어요.\n룬을 맞추면 제단이 깨어날 거예요!', done: '원형 제단이 푸른빛으로 빛나요.', banner: ['제단 활성화!', '고대 유적으로 가는 길이 열렸어요'] },
    dungeon: { name: '고대 원형 유적', floor: ['#2f4a35', '#36553c'], wall: ['#4f6b4a', '#5f7f58'], decor: ['#3fd1c8', '#a6f0dc', '#ffd84d'] },
    boss: {
      id: 'ancientTree', name: '원주 고대수', sprite: 'ancientTree', color: '#4f9e5a', hp: 4500, attack: 56, defense: 20, speed: 45, radius: 56,
      exp: 1200, gold: [700, 800], seals: [0.66, 0.33], projectile: 'seed', minion: 'ringSlime',
      patterns: { 1: ['ring', 'smash', 'rocks'], 2: ['ring', 'smash', 'rocks', 'summon'], 3: ['ring', 'smash', 'rocks', 'summon', 'ring'] },
    },
    story: {
      gate: '원형 제단 깨우기', gateDesc: '유적으로 가는 길을 원형 제단이 막고 있어요. 제단의 원주율 룬을 맞춰 깨워 주세요!',
      explore: '고대 원형 유적 탐사', seal: '유적의 봉인 풀기', bossQ: '원주 고대수 물리치기',
      bossDesc: '원의 결정을 품은 채 폭주하는 고대수를 잠재워 주세요! 봉인이 나타나면 수학으로 깨뜨려요.',
      end: '숲이 다시 푸르러졌어요! 당신은 원형 숲의 영웅이에요!',
    },
  },
  {
    village: 'solidPeaks', s: 'sp', tier: 6, style: 'snow', levels: '22~26',
    npc: {
      chief: ['산지기 콘', ['입체 산맥에 온 걸 환영하오. 춥지?', '탑 꼭대기의 수호자들이 결정을 지키고 있소.']],
      merchant: ['상인 스피어', ['따뜻한 물건 있어요~', '눈 결정은 대장간에서 쓰인답니다.']],
      smith: ['대장장이 실린더', ['얼음보다 단단하게 강화해 주지!', '틀려도 재료는 녹지 않으니 걱정 말게.']],
      sage: ['룬 현자 프리즘', ['원기둥, 원뿔, 구… 모양을 알면 길이 보인다.', '마지막 기술까지 전수하마.']],
    },
    materials: [['snow_crystal', '눈 결정', '❄️'], ['prism_shard', '수정 조각', '🔷']],
    gear: {
      weapon: ['crystal_greatsword', '수정 대검', '💎', 'rare', { attack: 40 }, { attack: 7 }, 1700],
      armor: ['frost_armor', '서리 갑옷', '🧊', 'rare', { defense: 20, maxHp: 130 }, { defense: 4, maxHp: 14 }, 1450],
      sub: ['snow_boots', '눈길 장화', '🥾', 'rare', { moveSpeed: 0.5, defense: 6 }, { defense: 2 }, 980, 'boots'],
      accessory: ['solid_crown', '입체 왕관', '👑', 'legendary', { attack: 22, defense: 14, maxHp: 140 }, { attack: 3, defense: 2 }, 4200],
    },
    mobs: [
      ['cylinderGolem', '원기둥 골렘', 'golem', '#9fb7d9', 'puff'],
      ['coneWizard', '원뿔 마법사', 'cone', '#b98cff', 'shoot'],
      ['sphereSpirit', '구체 정령', 'sphere', '#8fe3ff', 'swoop'],
    ],
    gate: { name: '얼어붙은 다리', idle: '탑으로 가는 다리가 꽁꽁 얼어붙었어요.', prompt: '얼음 속에 입체도형 룬이 보여요.\n룬을 맞추면 얼음이 녹을 거예요!', done: '얼음이 녹아 다리를 건널 수 있어요.', banner: ['얼음이 녹았다!', '수정 탑으로 가는 길이 열렸어요'] },
    dungeon: { name: '수정 탑', floor: ['#3b4a66', '#435478'], wall: ['#6b7fa8', '#7f95c0'], decor: ['#b98cff', '#8fe3ff', '#ffffff'] },
    boss: {
      id: 'triGuardian', name: '삼형제 수호자', sprite: 'triGuardian', color: '#b98cff', hp: 5600, attack: 66, defense: 24, speed: 75, radius: 54,
      exp: 1600, gold: [900, 1000], seals: [0.66, 0.33], projectile: 'crystal', minion: 'sphereSpirit',
      patterns: { 1: ['charge', 'rocks', 'smash'], 2: ['charge', 'rocks', 'ring', 'summon'], 3: ['charge', 'rocks', 'ring', 'summon', 'smash'] },
    },
    story: {
      gate: '얼어붙은 다리 녹이기', gateDesc: '수정 탑으로 가는 다리가 얼어붙었소. 얼음 속 입체도형 룬을 맞춰 녹여 주시오!',
      explore: '수정 탑 탐사', seal: '탑의 봉인 풀기', bossQ: '삼형제 수호자 물리치기',
      bossDesc: '원기둥·원뿔·구 삼형제 수호자를 물리치고 입체의 결정을 되찾아 주시오!',
      end: '산맥에 다시 햇살이 비치는군! 그대는 입체 산맥의 영웅이오!',
    },
  },
];

// 최종 지역
export const FINAL_CONTENT = {
  id: 'chaosSpire', name: '혼돈의 첨탑', tier: 7, levels: '26+',
  dungeon: { name: '혼돈의 첨탑', floor: ['#2a1f3d', '#32264a'], wall: ['#4a3a6a', '#5c4884'], decor: ['#ff6f8e', '#ffd84d', '#9ff3ff'] },
  boss: {
    id: 'chaosLord', name: '혼돈의 군주', sprite: 'chaosLord', color: '#7a4fd6', hp: 7000, attack: 76, defense: 28, speed: 80, radius: 56,
    exp: 2500, gold: [1500, 1800], seals: [0.75, 0.5, 0.25], projectile: 'chaos', minion: 'sphereSpirit', unit: 'mixed',
    patterns: { 1: ['charge', 'rocks', 'smash', 'ring'], 2: ['charge', 'rocks', 'ring', 'summon', 'flip'], 3: ['charge', 'rocks', 'ring', 'summon', 'flip', 'smash'] },
  },
  reward: ['math_crown', '수학 대륙의 왕관', '👑', 'legendary', { attack: 30, defense: 20, maxHp: 200 }, { attack: 3, defense: 3 }, 9999],
};

// ---------------- 아래는 자동 생성 ----------------
function scaleMob(id, name, sprite, color, behavior, tier, mats, extra = {}) {
  const b = BASE[behavior];
  const t = TIER[tier];
  return {
    name, sprite, color, tier: 'normal', behavior,
    hp: Math.round(b.hp * t.hp), attack: Math.round(b.attack * t.attack), defense: b.defense + t.def,
    speed: b.speed, radius: b.radius, aggro: b.aggro, attackRange: b.attackRange, windup: b.windup, cooldown: b.cooldown,
    puffRadius: b.puffRadius, flying: b.flying, keepDistance: b.keepDistance,
    exp: Math.round(b.exp * t.exp), gold: b.gold.map((g) => Math.round(g * t.gold)),
    drops: [
      { id: mats[0], chance: 0.55 },
      { id: mats[1], chance: 0.12 },
      { id: tier >= 3 ? 'potion_m' : 'potion_s', chance: 0.08 },
      { id: 'enhance_stone', chance: 0.07 },
    ],
    ...extra,
  };
}

export const CONTENT_MONSTERS = {};
export const CONTENT_BOSSES = {};
export const CONTENT_ITEMS = {};
export const CONTENT_PRICES = {};
export const CONTENT_NPCS = {};
export const CONTENT_QUESTS = {};
export const CONTENT_SHOPS = {};
export const VILLAGE_MATERIALS = { fractionValley: ['slime_jelly', 'mushroom_spore'] };

for (const v of VILLAGE_CONTENT) {
  const { s, tier } = v;
  const mats = v.materials.map((m) => m[0]);
  VILLAGE_MATERIALS[v.village] = mats;
  v.materials.forEach(([id, name, icon], i) => {
    CONTENT_ITEMS[id] = { name, type: 'material', grade: i === 0 ? 'common' : 'uncommon', icon, desc: i === 0 ? `${name}. 대장간에서 강화 재료로 써요.` : `귀한 ${name}. 높은 단계 강화에 써요.` };
    CONTENT_PRICES[id] = i === 0 ? 4 + tier * 3 : 10 + tier * 6;
  });
  for (const [slot, g] of Object.entries(v.gear)) {
    const [id, name, icon, grade, stats, enhance, price, subSlot] = g;
    CONTENT_ITEMS[id] = { name, type: 'equipment', slot: slot === 'sub' ? subSlot : slot, grade, icon, stats, enhance, desc: `${v.dungeon.name} 근처에서 쓰이는 장비.` };
    CONTENT_PRICES[id] = price;
  }
  CONTENT_ITEMS[v.gear.accessory[0]].desc = `${v.boss.name}이(가) 지니고 있던 보물.`;

  for (const [id, name, sprite, color, beh] of v.mobs) {
    CONTENT_MONSTERS[id] = scaleMob(id, name, sprite, color, beh, tier, mats);
    CONTENT_MONSTERS[id].drops.push({ id: v.gear.sub[0], chance: 0.02 });
  }
  const [eId, eName, eSprite, eColor, eBeh] = v.mobs[0];
  CONTENT_MONSTERS[`${s}_elite`] = {
    ...scaleMob(eId, `거대 ${eName}`, eSprite, eColor, eBeh, tier, mats),
    tier: 'elite', scale: 1.75, radius: 30,
    hp: Math.round(BASE[eBeh].hp * TIER[tier].hp * 4.5), attack: Math.round(BASE[eBeh].attack * TIER[tier].attack * 1.4),
    exp: Math.round(BASE[eBeh].exp * TIER[tier].exp * 4), gold: BASE[eBeh].gold.map((g) => Math.round(g * TIER[tier].gold * 4)),
    drops: [
      { id: mats[1], chance: 1, qty: [2, 3] },
      { id: 'enhance_stone', chance: 0.6 },
      { id: 'potion_m', chance: 0.5 },
      { id: v.gear.armor[0], chance: 0.15 },
      { id: v.gear.weapon[0], chance: 0.08 },
    ],
  };

  const B = v.boss;
  CONTENT_BOSSES[B.id] = {
    ...B, village: v.village,
    drops: [
      { id: v.gear.accessory[0], chance: 1 },
      { id: 'enhance_stone', chance: 1, qty: [3, 4] },
      { id: mats[1], chance: 1, qty: [3, 5] },
      { id: 'potion_l', chance: 1, qty: [1, 2] },
    ],
  };

  const roles = { chief: 'quest', merchant: 'shop', smith: 'forge', sage: 'skill' };
  for (const [key, [name, lines]] of Object.entries(v.npc)) {
    CONTENT_NPCS[`${s}_${key}`] = { name, role: roles[key], portrait: `${key}:${v.style}`, lines };
  }
  CONTENT_NPCS[`${s}_board`] = { name: '퀘스트 게시판', role: 'board', portrait: 'board', lines: ['새로운 의뢰가 붙어 있지 않아요. 나중에 다시 와 보세요.'] };

  const chief = `${s}_chief`;
  const st = v.story;
  const ex = 30 * tier;
  CONTENT_QUESTS[`${s}_q1`] = {
    title: st.gate, giver: chief, type: 'rune', target: `${s}_gate`, main: true,
    desc: st.gateDesc, reportText: `${v.gate.done} 고마워요! 이제 ${v.dungeon.name}(으)로 갈 수 있어요.`,
    reward: { exp: ex * 2, gold: 20 * tier, items: [[tier >= 3 ? 'potion_m' : 'potion_s', 2]] },
  };
  // 2번째 메인 퀘스트: 마을마다 다른 던전 장치를 수학으로 움직이기 (몬스터 잡기만 반복하지 않도록)
  const G2 = DUNGEON_TASK[v.style];
  CONTENT_QUESTS[`${s}_q2`] = G2 ? {
    title: G2.title, giver: chief, type: 'rune', targets: G2.ids.map((x) => `${s}_${x}`), count: G2.ids.length, unitWord: G2.word,
    main: true, requires: { quests: [`${s}_q1`] }, desc: G2.desc, reportText: G2.report,
    reward: { exp: ex * 2.5, gold: 25 * tier },
  } : {
    title: st.explore, giver: chief, type: 'explore', target: `${s}_deep`, main: true, requires: { quests: [`${s}_q1`] },
    desc: `${v.dungeon.name} 깊은 곳을 살펴보고 와 주세요. 몬스터가 강하니 조심하세요!`,
    reportText: '깊은 곳에 봉인된 문이 있다고요? 그 안에 결정을 훔친 녀석이 있을 거예요.',
    reward: { exp: ex * 2.5, gold: 25 * tier },
  };
  CONTENT_QUESTS[`${s}_q3`] = {
    title: st.seal, giver: chief, type: 'rune', targets: [`${s}_runeA`, `${s}_runeB`], count: 2, main: true, requires: { quests: [`${s}_q2`] },
    desc: `${v.dungeon.name}의 룬 기둥 2개를 수학으로 깨우면 봉인된 문이 열려요.`,
    reportText: '문이 열렸군요! 이제 마지막 싸움이에요.',
    reward: { exp: ex * 3, items: [['potion_m', 2]] },
  };
  CONTENT_QUESTS[`${s}_q4`] = {
    title: st.bossQ, giver: chief, type: 'boss', target: B.id, main: true, requires: { quests: [`${s}_q3`] },
    desc: st.bossDesc, reportText: st.end,
    reward: { exp: ex * 5, gold: 60 * tier, items: [['potion_l', 3]] },
  };
  CONTENT_QUESTS[`${s}_side`] = {
    title: '대장간의 재료', giver: `${s}_smith`, type: 'collect', target: mats[0], count: 6,
    desc: `강화에 쓸 ${v.materials[0][1]}이(가) 모자라. 6개만 모아 주면 강화석을 주지!`,
    reportText: '고맙네! 약속한 강화석일세.', reward: { exp: ex * 1.5, items: [['enhance_stone', 2]] },
  };
  CONTENT_QUESTS[`${s}_hunt`] = {
    title: `${v.mobs[1][1]} 소탕`, giver: `${s}_board`, type: 'kill', target: v.mobs[1][0], count: 6,
    desc: `${v.dungeon.name}의 ${v.mobs[1][1]}이(가) 너무 많아요. 6마리를 물리쳐 주세요.`,
    reportText: '의뢰 완료! 보상을 받으세요.', reward: { exp: ex * 2, gold: 30 * tier },
  };
  CONTENT_QUESTS[`${s}_eliteq`] = {
    title: `거대 ${v.mobs[0][1]} 퇴치`, giver: `${s}_board`, type: 'kill', target: `${s}_elite`, count: 1,
    desc: `${v.dungeon.name}에 거대 ${v.mobs[0][1]}이(가) 나타났어요!`,
    reportText: '대단해요! 보상을 받으세요.', reward: { exp: ex * 3, gold: 40 * tier, items: [['enhance_stone', 1]] },
  };

  CONTENT_SHOPS[v.village] = ['potion_s', 'potion_m', ...(tier >= 3 ? ['potion_l'] : []), 'bread', ...(tier >= 3 ? ['roast_meat'] : []), v.gear.weapon[0], v.gear.armor[0], v.gear.sub[0], 'enhance_stone'];
}

// 최종 지역 보스·보상
{
  const F = FINAL_CONTENT;
  const [id, name, icon, grade, stats, enhance, price] = F.reward;
  CONTENT_ITEMS[id] = { name, type: 'equipment', slot: 'accessory', grade, icon, stats, enhance, desc: '여섯 결정의 힘이 모인 전설의 왕관.' };
  CONTENT_PRICES[id] = price;
  CONTENT_BOSSES[F.boss.id] = {
    ...F.boss, village: F.id,
    drops: [{ id, chance: 1 }, { id: 'enhance_stone', chance: 1, qty: [5, 6] }, { id: 'potion_l', chance: 1, qty: [2, 3] }],
  };
}
CONTENT_ITEMS.potion_l = { name: '큰 회복약', type: 'consumable', grade: 'rare', icon: '🏺', heal: 260, desc: 'HP를 260 회복해요.' };
CONTENT_PRICES.potion_l = 120;

// 혼돈의 첨탑 전용 몬스터
CONTENT_MONSTERS.lavaDrake = scaleMob('lavaDrake', '용암 도마뱀', 'lizard', '#ff7a3c', 'shoot', 7, VILLAGE_MATERIALS.solidPeaks || ['enhance_stone', 'enhance_stone']);
