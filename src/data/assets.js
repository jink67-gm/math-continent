// 게임에서 쓰는 그림·소리 목록
// 그림: Ninja Adventure (pixel-boy & AAA, CC0) — assets/na
//       흙절벽: Zelda-like tilesets and sprites (ArMM1998, CC0) — assets/zl (tools/build_zl_cliffs.py로 색을 맞춤)
// 효과음: 기존 게임 자료 — assets/audio/sfx

export const ASSET_ROOT = 'assets/';

// 16px 칸으로 자른 시트 (프레임 번호 = 줄 × 가로칸 + 칸)
export const SHEETS = {
  'na/floor': 'na/tiles/TilesetFloor.png',
  'na/water': 'na/tiles/TilesetWater.png',
  'na/field': 'na/tiles/TilesetField.png',
  'na/relief': 'na/tiles/TilesetRelief.png',        // 절벽 면 (20칸 너비)
  'na/reliefd': 'na/tiles/TilesetReliefDetail.png', // 계단·판자·동굴 입구 (12칸 너비)
  'zl/cliff_meadow': 'zl/cliff_meadow.png',          // 흙절벽 (가로 4칸) — 들판 풀색
  'zl/cliff_forest': 'zl/cliff_forest.png',          // 흙절벽 — 숲 풀색
  'zl/cliff_pink': 'zl/cliff_pink.png',              // 흙절벽 — 분홍 꽃잎 땅
  'zl/props': 'zl/props.png',                        // 바위·자갈·큰 바위·나무 계단 (가로 4칸)
  'zl/town': 'zl/town.png',                          // 시장 천막·의자·상자·화분 (가로 8칸)
  'zl/fountain': ['zl/fountain.png', 48],            // 광장 분수 3장면
  'na/slash': ['na/fx/slash.png', 32],
  'na/slashc': ['na/fx/slash_curved.png', 32],          // 초승달 베기 (1·2타)
  'na/slashdc': ['na/fx/slash_double_curved.png', 32],  // 겹 초승달 베기 (3타)
  'na/slashcirc': ['na/fx/slash_circular.png', 32],     // 둥근 베기 (회전 베기)
  'na/smoke': ['na/fx/smoke.png', 32],
  'na/sparkc': ['na/fx/spark_circle.png', 32],
  'na/spark': ['na/fx/particle_spark.png', 10, 8],
  'na/flam': ['na/fx/flam.png', 32],
  'na/ice': ['na/fx/ice.png', 32],
  'na/shield': ['na/fx/shield.png', 24, 26],
  'na/star': ['na/fx/spark.png', 32],
  'na/ring': ['na/fx/circle_white.png', 32],
  'na/chest': ['na/fx/chest.png', 16, 14],
};

// 필드 몬스터 (SpriteSheet 16px, 가로 4칸 = 아래·위·왼·오, 세로 4줄 = 움직임)
// 보스 (60px 칸)
export const BOSS_SHEETS = {
  'boss/troll_idle': ['na/boss/troll/idle.png', 60],
  'boss/troll_attack': ['na/boss/troll/attack.png', 60],
  'boss/troll_jump': ['na/boss/troll/jump.png', 60],
  'boss/troll_charge': ['na/boss/troll/charge.png', 60],
  'boss/spirit_idle': ['na/boss/spirit/idle.png', 50],
  'boss/spirit_hit': ['na/boss/spirit/hit.png', 50],
};

export { MONSTER_KEYS as MONSTER_SHEETS } from './monsters.js';

// 통째로 쓰는 그림 (아래 OBJECTS에서 부분을 잘라 써요)
export const IMAGES = {
  'na/house': 'na/tiles/TilesetHouse.png',
  'na/nature': 'na/tiles/TilesetNature.png',
  'na/element': 'na/tiles/TilesetElement.png',
  'na/sword': 'na/fx/sword.png',
  'na/coin': 'na/fx/coin.png',
  'hand/Hwando': 'na/items/Hwando_hand.png',
  'hand/BigSword': 'na/items/BigSword_hand.png',
  'hand/Katana': 'na/items/Katana_hand.png',
  'hand/MagicWand': 'na/items/MagicWand_hand.png',
  'na/facebox': 'na/ui/FacesetBox.png',
  'ui2/action_attack': 'ui2/action_attack.webp',
  'ui2/action_dodge': 'ui2/action_dodge.webp',
  'ui2/action_interact': 'ui2/action_interact.webp',
  'ui2/action_skill': 'ui2/action_skill.webp',
  'ui2/item_slot': 'ui2/item_slot.webp',
  'ui2/button_primary': 'ui2/button_primary.webp',
  'ui2/button_brown': 'ui2/button_brown.webp',
  'ui2/button_green': 'ui2/button_green.webp',
  'items/consumables/potion_red': 'items/consumables/potion_red.webp',
  'items/consumables/scroll': 'items/consumables/scroll.webp',
};

// 캐릭터: SpriteSheet.png (16px, 가로 4칸 = 아래·위·왼·오, 세로 0~3줄 걷기, 4줄 공격) + Faceset.png
export const CHARACTERS = [
  'HanbokBoy', 'HanbokGirl', 'KnightGold', 'OldMan', 'OldMan3', 'Villager4', 'Shaman', 'Knight',
  'OldWoman', 'Child', 'Spirit', 'Woman', 'Villager2', 'Monk',
];

// 주인공: 한복 (Ninja Adventure의 Boy·Princess 옷 색을 바꿈 — tools/build_hanbok.py). KnightGold는 프로포르 재상이 써요.
//   남: 검은 도포 · 흰 깃 · 금빛 띠 · 검은 바지 · 검은 머리   여: 흰 저고리 · 분홍 치마 · 분홍 고름 (둘 다 밝은 피부)
export const HEROES = { male: 'HanbokBoy', female: 'HanbokGirl' };

// 그림 일부를 잘라 쓰는 물건: [그림, 칸x, 칸y, 가로칸, 세로칸]
export const OBJECTS = {
  // 집 (TilesetHouse)
  house_red: ['na/house', 12, 0, 4, 3],
  house_shop: ['na/house', 16, 0, 3, 3],
  house_tavern: ['na/house', 19, 0, 4, 3],
  house_round: ['na/house', 23, 0, 3, 3],
  house_timber: ['na/house', 26, 0, 3, 3],
  house_orange: ['na/house', 0, 0, 4, 3],
  house_beige: ['na/house', 4, 0, 4, 3],
  house_big: ['na/house', 25, 7, 4, 7],
  kiln: ['na/house', 29, 4, 3, 4],
  // 나무·덤불·꽃 (TilesetNature)
  tree_green: ['na/nature', 0, 0, 2, 2],
  tree_pine: ['na/nature', 2, 0, 2, 2],
  tree_round: ['na/nature', 16, 0, 2, 2],
  tree_lime: ['na/nature', 18, 0, 2, 2],
  tree_pink: ['na/nature', 12, 0, 2, 2],
  tree_big: ['na/nature', 3, 18, 3, 3],
  tree_big_pink: ['na/nature', 0, 18, 3, 3],
  tree_big_orange: ['na/nature', 9, 18, 3, 3],
  bush_a: ['na/nature', 0, 10, 1, 1],
  bush_b: ['na/nature', 1, 10, 1, 1],
  bush_c: ['na/nature', 2, 10, 1, 1],
  grass_a: ['na/nature', 3, 10, 1, 1],
  grass_b: ['na/nature', 4, 10, 1, 1],
  flower_a: ['na/nature', 0, 11, 1, 1],
  flower_b: ['na/nature', 1, 11, 1, 1],
  crop: ['na/nature', 5, 10, 1, 1],
  // 소품 (TilesetElement)
  barrel: ['na/element', 0, 0, 1, 1],
  jar: ['na/element', 1, 0, 1, 1],
  cart: ['na/element', 0, 3, 2, 2],
  scarecrow: ['na/element', 6, 3, 1, 2],
  table: ['na/element', 11, 1, 3, 1],
  laundry: ['na/element', 14, 3, 2, 1],
  fence: ['na/element', 11, 3, 3, 1],
  sign: ['na/element', 0, 2, 1, 1],
  // 바위·수정 (TilesetNature)
  rock_grey: ['na/nature', 15, 14, 2, 2],
  rock_grey_big: ['na/nature', 17, 14, 4, 3],
  rock_grey_tall: ['na/nature', 21, 14, 2, 3],
  rock_grey_stack: ['na/nature', 16, 5, 3, 3],
  rock_grey_s: ['na/nature', 17, 17, 1, 1],
  rock_brown: ['na/nature', 15, 10, 2, 2],
  rock_brown_big: ['na/nature', 17, 10, 4, 3],
  rock_brown_tall: ['na/nature', 21, 10, 2, 3],
  rock_brown_s: ['na/nature', 15, 12, 1, 1],
  crystal_a: ['na/nature', 0, 15, 1, 1],
  crystal_b: ['na/nature', 1, 15, 1, 1],
  crystal_c: ['na/nature', 2, 15, 1, 1],
  crystal_d: ['na/nature', 3, 15, 1, 1],
  ore_a: ['na/nature', 4, 15, 1, 1],
  ore_b: ['na/nature', 5, 15, 1, 1],
  stump: ['na/nature', 0, 8, 2, 2],
  cave_mouth: ['na/reliefd', 3, 7, 3, 3],
  // Zelda-like (ArMM1998, CC0) 바위
  zl_rock: ['zl/props', 0, 0, 1, 1],
  zl_rock_flat: ['zl/props', 1, 0, 1, 1],
  zl_pebbles: ['zl/props', 2, 0, 1, 1],
  zl_boulder: ['zl/props', 0, 1, 2, 2],
  // Zelda-like 마을 소품
  zl_stall: ['zl/town', 0, 0, 5, 4],
  zl_bench: ['zl/town', 5, 0, 3, 2],
  zl_crates: ['zl/town', 5, 2, 2, 2],
  zl_fruit_y: ['zl/town', 0, 4, 1, 2],
  zl_fruit_g: ['zl/town', 1, 4, 1, 2],
  zl_fruit_r: ['zl/town', 2, 4, 1, 2],
  zl_fruit_o: ['zl/town', 3, 4, 1, 2],
  zl_plant_big: ['zl/town', 4, 4, 1, 2],
  zl_pot_blue: ['zl/town', 5, 4, 1, 1],
  zl_pot_white: ['zl/town', 6, 4, 1, 1],
  zl_pot_bush: ['zl/town', 7, 4, 1, 1],
  zl_stump: ['zl/town', 0, 6, 2, 2],
  tree_snowpine: ['na/nature', 8, 0, 2, 2],
  tree_whitepine: ['na/nature', 10, 0, 2, 2],
  tree_white: ['na/nature', 12, 0, 2, 2],
  tree_blossom: ['na/nature', 14, 0, 2, 2],
  trio_green: ['na/nature', 4, 2, 3, 3],
  trio_white: ['na/nature', 8, 2, 3, 3],
  trio_pink: ['na/nature', 12, 2, 3, 3],
  pines_snow: ['na/nature', 4, 5, 3, 3],
  notice: ['na/element', 6, 3, 1, 2],
};

// 배경음악: Ninja Adventure 음악(ogg) + 기존 mp3(ogg를 못 트는 기기용)
export const BGM = {
  bgm_title: ['na/music/title.ogg', 'audio/bgm/title_theme.mp3'],
  bgm_town: ['na/music/village.ogg', 'audio/bgm/town_theme.mp3'],
  bgm_field: ['audio/bgm/field_theme.mp3'],
  bgm_dungeon: ['audio/bgm/dungeon_theme.mp3'],
  bgm_boss: ['audio/bgm/boss_theme.mp3'],
};

export const AUDIO = {
  sfx_click: 'audio/sfx/ui_click.mp3',
  sfx_open: 'audio/sfx/ui_open.mp3',
  sfx_close: 'audio/sfx/ui_close.mp3',
  sfx_confirm: 'audio/sfx/ui_confirm.mp3',
  sfx_swing1: 'audio/sfx/attack_combo_1.mp3',
  sfx_swing2: 'audio/sfx/attack_combo_2.mp3',
  sfx_swing3: 'audio/sfx/attack_combo_3.mp3',
  sfx_dodge: 'audio/sfx/dodge.mp3',
  sfx_skill: 'audio/sfx/skill_cast.mp3',
  sfx_heal: 'audio/sfx/heal.mp3',
  sfx_quest: 'audio/sfx/quest_complete.mp3',
  sfx_hit: 'audio/sfx/hit_light.mp3',
  sfx_hit_heavy: 'audio/sfx/hit_heavy.mp3',
  sfx_crit: 'audio/sfx/critical_hit.mp3',
  sfx_hurt: 'audio/sfx/player_hit.mp3',
  sfx_purify: 'audio/sfx/monster_death.mp3',
  sfx_windup: 'audio/sfx/monster_windup.mp3',
  sfx_lunge: 'audio/sfx/monster_lunge.mp3',
  sfx_orb: 'audio/sfx/monster_projectile.mp3',
  sfx_impact: 'audio/sfx/monster_aoe_impact.mp3',
  sfx_levelup: 'audio/sfx/level_up.mp3',
  sfx_gold: 'audio/sfx/gold_pickup.mp3',
  sfx_shield: 'audio/sfx/shield_on.mp3',
  sfx_unlock: 'audio/sfx/skill_unlock.mp3',
  sfx_potion: 'audio/sfx/potion_drink.mp3',
  sfx_miss: 'audio/sfx/attack_miss.mp3',
  sfx_math_open: 'audio/sfx/math_open.mp3',
  sfx_math_correct: 'audio/sfx/math_correct.mp3',
  sfx_math_wrong: 'audio/sfx/math_wrong.mp3',
  sfx_math_retry: 'audio/sfx/math_retry_ready.mp3',
  sfx_seal: 'audio/sfx/seal_unlock.mp3',
  sfx_chest: 'audio/sfx/chest_open.mp3',
  sfx_boss: 'audio/sfx/boss_appear.mp3',
  sfx_boss_dash: 'audio/sfx/boss_dash.mp3',
  sfx_boss_slash: 'audio/sfx/boss_slash.mp3',
  sfx_boss_charge: 'audio/sfx/boss_judgement_charge.mp3',
  sfx_boss_blast: 'audio/sfx/boss_judgement_blast.mp3',
  sfx_shield_break: 'audio/sfx/boss_shield_break.mp3',
  sfx_equip: 'audio/sfx/equip.mp3',
  sfx_upgrade: 'audio/sfx/upgrade_success.mp3',
  sfx_item: 'audio/sfx/item_rare.mp3',
};
