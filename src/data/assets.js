// 게임에서 쓰는 그림·소리 목록
// 그림: Ninja Adventure (pixel-boy & AAA, CC0) — assets/na
// 효과음: 기존 게임 자료 — assets/audio/sfx

export const ASSET_ROOT = 'assets/';

// 16px 칸으로 자른 시트 (프레임 번호 = 줄 × 가로칸 + 칸)
export const SHEETS = {
  'na/floor': 'na/tiles/TilesetFloor.png',
  'na/water': 'na/tiles/TilesetWater.png',
  'na/field': 'na/tiles/TilesetField.png',
  'na/slash': ['na/fx/slash.png', 32],
  'na/smoke': ['na/fx/smoke.png', 32],
  'na/sparkc': ['na/fx/spark_circle.png', 32],
  'na/spark': ['na/fx/particle_spark.png', 10, 8],
};

// 통째로 쓰는 그림 (아래 OBJECTS에서 부분을 잘라 써요)
export const IMAGES = {
  'na/house': 'na/tiles/TilesetHouse.png',
  'na/nature': 'na/tiles/TilesetNature.png',
  'na/element': 'na/tiles/TilesetElement.png',
  'na/sword': 'na/fx/sword.png',
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
  'KnightGold', 'SorcererBlack', 'OldMan', 'OldMan3', 'Villager4', 'Shaman', 'Knight',
  'OldWoman', 'Child', 'Spirit', 'Woman', 'Villager2', 'Monk',
];

export const HEROES = { male: 'KnightGold', female: 'SorcererBlack' };

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
};

// 배경음악: Ninja Adventure 음악(ogg) + 기존 mp3(ogg를 못 트는 기기용)
export const BGM = {
  bgm_title: ['na/music/title.ogg', 'audio/bgm/title_theme.mp3'],
  bgm_town: ['na/music/village.ogg', 'audio/bgm/town_theme.mp3'],
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
};
