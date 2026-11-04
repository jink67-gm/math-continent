// 게임에서 쓰는 그림·소리 목록
// 이미지 키는 assets 폴더 안 경로에서 .webp를 뺀 이름이에요. (예: 'tiles3/grass_0')

export const ASSET_ROOT = '../assets/';

// 주인공: characters5(공격·회피·스킬) + characters4(좌우 걷기)
export const HERO_FRAMES = {
  characters5: {
    idle_down: 2, idle_up: 2, idle_left: 2, idle_right: 2,
    walk_down: 4, walk_up: 4,
    atk_down: 6, atk_up: 6, atk_left: 4, atk_right: 4,
    dodge_left: 3, dodge_right: 3,
    skill_left: 4, skill_right: 4,
    hit_down: 4, hit_up: 4, hit_left: 2, hit_right: 2,
  },
  characters4: { walk_left: 8, walk_right: 8 },
};

// 마을 사람: npc3 폴더 (idle 3장, talk 4장)
export const NPC_SPRITES = [
  'farmer', 'math_sage', 'traveling_merchant', 'blacksmith', 'town_guard',
  'village_child', 'healer', 'innkeeper', 'librarian', 'village_guide', 'adventurer',
];

const IMAGES = [
  ...['grass', 'dirt', 'water'].flatMap((t) => [0, 1, 2, 3].map((i) => `tiles3/${t}_${i}`)),
  ...['dirt', 'water'].flatMap((t) => [
    'inner_ne', 'inner_nw', 'inner_se', 'inner_sw', 'outer_ne', 'outer_nw', 'outer_se', 'outer_sw',
    'straight_e', 'straight_n', 'straight_s', 'straight_w',
  ].map((n) => `tiles3/${t}_${n}`)),
  ...['mayor_office', 'math_library', 'general_shop', 'blacksmith', 'inn', 'cottage_thatched',
    'house_blue_small', 'house_red', 'apothecary', 'warehouse_small'].map((n) => `buildings3/${n}`),
  ...['bush', 'bush_berry', 'bush_flower', 'bush_yellow', 'rock_big', 'rock_mid', 'rock_small', 'rock_tiny',
    'tree_big', 'tree_big_yellow', 'tree_pine', 'tree_small', 'tree_young'].map((n) => `nature/${n}`),
  ...['barrel_crates', 'barrel_flowers', 'barrel_flowers_pink', 'bench', 'flowerbed', 'lamp', 'planter_crate',
    'planter_stone', 'shrub_flowers', 'signpost', 'tuft_a', 'tuft_b', 'tuft_c', 'tuft_stones', 'pebbles_a',
    'rock_a', 'rock_b', 'fence'].map((n) => `plaza7/${n}`),
  ...['plaza_round', 'fence_long', 'fence_short', 'fence_post', 'fence_corner', 'lamp_post', 'sign', 'barrel',
    'planter', 'bench_back', 'gate', 'well'].map((n) => `village2/${n}`),
  ...['fountain_round', 'garden_plot_half', 'garden_plot_quarters', 'garden_plot_eighths', 'garden_plot_wheat',
    'flower_cart', 'flower_box_a', 'flower_box_b', 'flower_barrels', 'hedge_straight', 'hedge_arch',
    'pond_lilypads', 'pond_flowers', 'garden_bench_a', 'flower_arch'].map((n) => `pack4/fraction_garden/${n}`),
  ...['bridge_v_deck', 'bridge_post', 'fences_00', 'fences_04'].map((n) => `terrain3/${n}`),
  ...['action_attack', 'action_dodge', 'action_interact', 'action_skill', 'item_slot', 'dialogue_panel',
    'meter', 'meter_fill_hp', 'meter_fill_mp', 'meter_fill_exp', 'status_frame', 'parchment_panel',
    'button_primary', 'button_brown', 'button_green', 'notification'].map((n) => `ui2/${n}`),
  ...['slash_blue', 'slash_orange', 'heal_green', 'dust_cloud', 'burst_gold_big'].map((n) => `effects/${n}`),
  ...['potion_red', 'potion_blue', 'scroll'].map((n) => `items/consumables/${n}`),
  ...['idle_01', 'idle_02', 'idle_03', 'talk_01', 'talk_02', 'talk_03', 'talk_04', 'portrait'].map((n) => `pack4/pipi/${n}`),
  ...NPC_SPRITES.flatMap((n) => ['idle_01', 'idle_02', 'idle_03', 'talk_01', 'talk_02', 'talk_03', 'talk_04']
    .map((f) => `npc3/${n}/${f}`)),
  ...NPC_SPRITES.map((n) => `npc3/portraits/${n}`),
];

for (const g of ['male', 'female']) {
  for (const [set, anims] of Object.entries(HERO_FRAMES)) {
    for (const [name, count] of Object.entries(anims)) {
      for (let i = 1; i <= count; i++) IMAGES.push(`${set}/${g}/${name}_${i}`);
    }
  }
}

export const IMAGE_KEYS = IMAGES;

// 배경음악은 크기가 커서 그 장면에 들어갈 때 불러와요
export const BGM = {
  bgm_town: 'audio/bgm/town_theme.mp3',
};

export const AUDIO = {
  bgm_title: 'audio/bgm/title_theme.mp3',
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
