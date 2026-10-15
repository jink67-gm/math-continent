// 몬스터 외형(그림 파일)과 전투 방식(AI) 연결표
// art: assets 폴더 안 그림 이름 (뒤에 _idle / _attack 이 붙은 2장)
// art3: 새 몬스터 v2 그림(1장) — 있으면 이 그림을 먼저 쓰고, 이동·공격·피격은 공통 애니메이션으로 / face3: 새 그림이 보는 방향
// size: 화면에 그릴 크기(px, 가로·세로 중 긴 쪽)  ·  face: 그림이 보는 방향(1 오른쪽, -1 왼쪽)
// ai: 전투 방식
//   melee   근접형  — 다가가서 공격 준비 → 근접 타격 → 짧은 빈틈
//   charge  돌진형  — 예고선 표시 → 직선 돌진 → 빗나가면 잠깐 어지러움
//   ranged  원거리형 — 거리 유지, 가까워지면 뒤로 물러나며 투사체 1발
//   burst   연속탄형 — 2~3발 연속 발사
//   fan     부채꼴형 — 3방향 또는 5방향으로 퍼지는 공격
//   aoe     범위형  — 바닥에 위험 표시 → 폭발 (target: self 자기 주변 / player 플레이어 위치)
//   jump    점프형  — 플레이어 위치로 뛰어올라 착지 공격
//   guard   방어형  — 정면 공격은 피해 75% 감소, 옆·뒤는 그대로
//   dodge   회피형  — 플레이어가 공격하면 일정 확률로 짧게 피함
//   summon  소환형  — 작은 몬스터 소환 (동시에 최대 2마리)
// special: 엘리트가 2~3번에 한 번 쓰는 특수 패턴
// move: 이동 느낌 (bounce 통통 / hover 공중 흔들 / heavy 무거운 걸음 / sway 좌우 기울임) — 없으면 자동
// shot: 투사체 모양 (comet_blue, comet_purple, arrow, bubble, fire, spore, leaf, crystal)

export const MONSTER_LOOKS = {
  // ---------- 분수 계곡 (초원·동굴) ----------
  slime: { art: 'monsters/normal/slime_green', art3: 'monsters3/slime_green', face3: 1, size: 54, face: -1, ai: 'jump' },
  mushroom: { art: 'monsters/normal/mushroom_red', art3: 'monsters3/mushroom', face3: 1, size: 56, face: 1, ai: 'aoe', target: 'self' },
  bat: { art: 'monsters/normal/bat_purple', art3: 'monsters3/bat', face3: 1, size: 66, face: 1, ai: 'charge', flyH: 26 },
  bigMushroom: { art: 'monsters/normal/mushroom_red', art3: 'monsters3/mushroom', face3: 1, size: 56, face: 1, ai: 'aoe', target: 'self', special: 'fan', shot: 'spore' },
  wildBoar: { art: 'monsters/normal/boar', art3: 'monsters3/boar', face3: -1, size: 70, face: 1, ai: 'charge' },
  rockSlime: { art: 'monsters/normal/lava_golem', art3: 'monsters3/slime_red', face3: 1, size: 58, face: 1, ai: 'jump', move: 'heavy' },
  shadowBat: { art: 'monsters/normal/bat_cat', size: 66, face: 1, ai: 'charge', dodge: 0.3, flyH: 26 },
  caveMushroom: { art: 'monsters/normal/mushroom_purple', art3: 'monsters3/spider', face3: 1, size: 58, face: 1, ai: 'aoe', target: 'player' },

  // ---------- 입체 도시 ----------
  cubeGolem: { art: 'monsters/normal/stone_golem', art3: 'monsters3/stone_golem', face3: 1, size: 64, face: 1, ai: 'guard' },
  blockMimic: { art: 'monsters/normal/mimic', size: 60, face: 1, ai: 'melee', dodge: 0.25 },
  cubeRobot: { art: 'monsters/normal/crystal_fairy', size: 58, face: 1, ai: 'burst', shot: 'crystal', flyH: 14 },
  cc_elite: { art: 'monsters/elite/cube_golem', size: 70, face: 1, ai: 'jump', special: 'ring', shot: 'comet_blue' },

  // ---------- 소수 항구 ----------
  dropSlime: { art: 'monsters/normal/slime_blue', art3: 'monsters3/slime_blue', face3: 1, size: 54, face: -1, ai: 'jump' },
  pirateCrab: { art: 'monsters/elite/pirate_crab', size: 66, face: 1, ai: 'fan', count: 3, shot: 'bubble' },
  inkOctopus: { art: 'monsters/elite/void_eye', size: 60, face: 1, ai: 'burst', shot: 'comet_purple', flyH: 18 },
  dh_elite: { art: 'monsters/normal/helmet_slime', size: 60, face: -1, ai: 'jump', special: 'aoe', guardFront: true },

  // ---------- 비례 왕국 ----------
  ratioGoblin: { art: 'monsters/normal/goblin_club', art3: 'monsters3/goblin_warrior', face3: 1, size: 62, face: 1, ai: 'melee' },
  scaleGolem: { art: 'monsters/normal/goblin_shield', art3: 'monsters3/orc', face3: 1, size: 64, face: 1, ai: 'guard', move: 'sway' },
  knightMob: { art: 'monsters/normal/goblin_dagger', art3: 'monsters3/skeleton', face3: -1, size: 60, face: 1, ai: 'melee', dodge: 0.45, move: 'sway' },
  goblinArcher: { art: 'monsters/normal/goblin_archer', size: 62, face: 1, ai: 'fan', count: 3, shot: 'arrow' },
  rk_elite: { art: 'monsters/normal/goblin_club', art3: 'monsters3/goblin_warrior', face3: 1, size: 62, face: 1, ai: 'melee', special: 'charge' },

  // ---------- 원형 숲 ----------
  ringSlime: { art: 'monsters/normal/leaf_slime', art3: 'monsters3/slime_green', face3: 1, size: 56, face: -1, ai: 'jump' },
  wheelMob: { art: 'monsters/normal/wolf', art3: 'monsters3/wolf', face3: -1, size: 68, face: 1, ai: 'charge', dodge: 0.3, move: 'sway' },
  roundGolem: { art: 'monsters/elite/moss_toad', art3: 'monsters3/treant', face3: 1, size: 68, face: 1, ai: 'aoe', target: 'player' },
  leafSprite: { art: 'monsters/normal/leaf_sprite', art3: 'monsters3/flower', face3: 1, size: 58, face: 1, ai: 'burst', shot: 'leaf', flyH: 16 },
  cf_elite: { art: 'monsters/normal/leaf_slime', size: 56, face: -1, ai: 'jump', special: 'summon' },

  // ---------- 입체 산맥 ----------
  cylinderGolem: { art: 'monsters/elite/crystal_beetle', art3: 'monsters3/stone_golem', face3: 1, size: 70, face: 1, ai: 'guard', special2: 'charge' },
  coneWizard: { art: 'monsters/elite/ice_fox', art3: 'monsters3/ice_spirit', face3: 1, size: 66, face: 1, ai: 'fan', count: 5, shot: 'crystal' },
  sphereSpirit: { art: 'monsters/elite/thunder_griffin', size: 70, face: 1, ai: 'jump', flyH: 20 },
  sp_elite: { art: 'monsters/elite/sand_worm', size: 76, face: 1, ai: 'aoe', target: 'player', special: 'summon' },

  // ---------- 혼돈의 첨탑 ----------
  lavaDrake: { art: 'monsters/elite/lava_lizard', art3: 'monsters3/fire_spirit', face3: 1, size: 76, face: 1, ai: 'fan', count: 5, shot: 'fire' },
};

// 보스 외형: size = 화면 크기(px), face = 그림이 보는 방향
export const BOSS_LOOKS = {
  reciprocalTroll: { art: 'monsters/bosses/orc_warlord', size: 230, face: 1 },
  cubeKing: { art: 'monsters/bosses/crystal_golem', size: 230, face: 1 },
  decimalKraken: { art: 'monsters/bosses/water_serpent', size: 240, face: 1 },
  scaleKnightKing: { art: 'monsters/elite/shield_golem', size: 210, face: 1 },
  ancientTree: { art: 'monsters/bosses/treant', size: 250, face: 1 },
  triGuardian: { art: 'monsters/bosses/spider_queen', size: 240, face: 1 },
  chaosLord: { art: 'monsters/bosses/chaos_lord', size: 260, face: 1, flyH: 20 },
};

// behavior(예전 방식) → ai 기본값
export const AI_FROM_BEHAVIOR = { hop: 'jump', puff: 'aoe', swoop: 'charge', shoot: 'ranged' };

export function lookFor(type, def) {
  const l = MONSTER_LOOKS[type];
  if (l) return l;
  return { art: null, size: 56, face: 1, ai: AI_FROM_BEHAVIOR[def?.behavior] || 'melee', target: 'self' };
}
