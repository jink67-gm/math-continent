# 그림 파일 목록 (assets)

모든 그림은 `.webp`(투명 배경)이에요. 경로 = `assets/<이름>.webp`

캐릭터·몬스터·NPC는 **발 위치**가 기준점, 아이템·이펙트는 가운데가 기준점이에요(`manifest.json`의 ax, ay).

| 폴더 | 원본 시트 | 개수 |
|---|---|---|
| `characters/male` | 남성 모험가 시트 (14장) | 14 |
| `characters/female` | 여성 검사 시트 (14장) | 14 |
| `monsters/normal` | 귀여운 몬스터 시트 2장 | 40 |
| `monsters/elite` | 엘리트 몬스터 시트 | 20 |
| `monsters/bosses` | 보스 로스터 시트 | 12 |
| `npc` | NPC 시트 | 16 |
| `items/weapons` | 아이템 아이콘 시트·그리드 | 7 |
| `items/armor` | 아이템 아이콘 시트·그리드 | 5 |
| `items/accessories` | 아이템 아이콘 시트·그리드 | 4 |
| `items/consumables` | 아이템 아이콘 시트·그리드 | 15 |
| `items/materials` | 아이템 아이콘 시트·그리드 | 13 |
| `environment` | 환경 자산 시트 | 46 |
| `buildings` | 환경 자산 시트 | 7 |
| `effects` | 이펙트 시트 | 15 |
| `ui` | UI 시트 | 22 |

합계 250개

## characters/male
`idle_front`, `idle_side`, `idle_turn`, `walk_front_1`, `walk_front_2`, `walk_side_1`, `walk_side_2`, `walk_side_3`, `walk_side_4`, `attack_1`, `attack_2`, `attack_3`, `hit`, `skill`

## characters/female
`idle_front`, `idle_side`, `idle_turn`, `walk_front_1`, `walk_front_2`, `walk_side_1`, `walk_side_2`, `walk_side_3`, `walk_side_4`, `attack_1`, `attack_2`, `attack_3`, `hit`, `skill`

## monsters/normal
`slime_green_idle`, `slime_green_attack`, `bat_purple_idle`, `bat_purple_attack`, `mushroom_red_idle`, `mushroom_red_attack`, `goblin_club_idle`, `goblin_club_attack`, `goblin_shield_idle`, `goblin_shield_attack`, `stone_golem_idle`, `stone_golem_attack`, `crystal_fairy_idle`, `crystal_fairy_attack`, `slime_blue_idle`, `slime_blue_attack`, `leaf_slime_idle`, `leaf_slime_attack`, `helmet_slime_idle`, `helmet_slime_attack`, `mushroom_purple_idle`, `mushroom_purple_attack`, `bat_cat_idle`, `bat_cat_attack`, `boar_idle`, `boar_attack`, `wolf_idle`, `wolf_attack`, `goblin_dagger_idle`, `goblin_dagger_attack`, `goblin_archer_idle`, `goblin_archer_attack`, `lava_golem_idle`, `lava_golem_attack`, `slime_water_idle`, `slime_water_attack`, `leaf_sprite_idle`, `leaf_sprite_attack`, `mimic_idle`, `mimic_attack`

## monsters/elite
`crystal_beetle_idle`, `crystal_beetle_attack`, `shield_golem_idle`, `shield_golem_attack`, `ice_fox_idle`, `ice_fox_attack`, `lava_lizard_idle`, `lava_lizard_attack`, `void_eye_idle`, `void_eye_attack`, `moss_toad_idle`, `moss_toad_attack`, `sand_worm_idle`, `sand_worm_attack`, `thunder_griffin_idle`, `thunder_griffin_attack`, `cube_golem_idle`, `cube_golem_attack`, `pirate_crab_idle`, `pirate_crab_attack`

## monsters/bosses
`treant_idle`, `treant_attack`, `crystal_golem_idle`, `crystal_golem_attack`, `spider_queen_idle`, `spider_queen_attack`, `orc_warlord_idle`, `orc_warlord_attack`, `chaos_lord_idle`, `chaos_lord_attack`, `water_serpent_idle`, `water_serpent_attack`

## npc
`sage_idle`, `sage_talk`, `blacksmith_idle`, `blacksmith_talk`, `alchemist_idle`, `alchemist_talk`, `merchant_idle`, `merchant_talk`, `elf_archer_idle`, `elf_archer_talk`, `knight_idle`, `knight_talk`, `scholar_idle`, `scholar_talk`, `fairy_idle`, `fairy_talk`

## items/weapons
`sword_iron`, `sword_crystal`, `staff_nature`, `dagger`, `staff_ruby`, `bow`, `hammer`

## items/armor
`shield`, `armor_plate`, `gloves_leather`, `boots_leather`, `helmet`

## items/accessories
`ring_sapphire`, `amulet_amethyst`, `orb_blue`, `clover`

## items/consumables
`potion_red`, `potion_blue`, `gold_pouch`, `chest_blue`, `potion_green`, `bread`, `meat`, `potion_yellow`, `key_gold`, `scroll`, `map`, `lantern`, `bomb`, `elixir_purple`, `seed_bag`

## items/materials
`mushroom`, `wood_log`, `leather`, `ore_stone`, `crystal_blue`, `rune_stone`, `crystal_amber`, `herb`, `feather`, `gem_red`, `fang`, `gem_purple`, `star`

## environment
`tree_green`, `tree_orange`, `tree_pink`, `tree_pine`, `tree_small`, `bush_white_flower`, `bush_blueberry`, `plant_leafy`, `bush_redberry`, `bush_yellow`, `bush_pink_flower`, `bush_daisy`, `fern`, `stump`, `log`, `rock_big`, `rock_mossy`, `rock_small`, `rock_flat`, `rock_tiny`, `mushrooms`, `grass_tuft`, `flower_lavender`, `flower_daisy`, `flower_red`, `flower_yellow`, `pebbles`, `fence_wood`, `fence_picket`, `fence_rope`, `signpost`, `lamppost`, `barrel`, `barrel_2`, `barrel_open`, `crate`, `crates_stacked`, `logs`, `sack`, `cart`, `bucket`, `haystack`, `hay_bale`, `campfire`, `tent`, `treasure_pile`

## buildings
`house_blue`, `house_forge`, `house_shop`, `statue`, `portal`, `dungeon_gate`, `wooden_gate`

## effects
`slash_blue`, `slash_orange`, `slash_purple`, `burst_blue`, `burst_orange`, `dust_cloud`, `pillar_gold`, `pillar_purple`, `burst_gold_big`, `heal_green`, `aoe_red`, `pillar_blue`, `comet_blue`, `comet_purple`, `shield_bubble`

## ui
`hud_frame`, `boss_bar`, `inventory_panel`, `skill_fire`, `skill_ice`, `skill_wind`, `skill_void`, `skill_light`, `skill_lock`, `cooldown_ring`, `dialog_box`, `quest_panel`, `minimap`, `coin_bar`, `banner`, `corner_a`, `corner_b`, `ornament`, `slot_selected`, `slot`, `gear_button`, `bookmark`

## 캐릭터 동작 이름
- `idle_front` 정면 대기 · `idle_side` 옆 대기 · `idle_turn` 뒤돌아보기 · `idle_back` 뒷모습 대기
- `walk_back_1~3` 위쪽 걷기(뒷모습)
- `walk_front_1~2` 정면 걷기 · `walk_side_1~4` 옆 걷기
- `attack_1~3` 1·2·3타 · `hit` 맞음 · `skill` 스킬

## 몬스터·NPC 이름 규칙
- `<이름>_idle` 대기, `<이름>_attack` 공격 (NPC는 `<이름>_talk` 말하기)

## 천칭 기사왕 (monsters/bosses/scale_king)
- `idle_1~5` 대기 · `walk_1~5` 이동 · `slash1_windup`/`slash1` 기본 베기 · `slash2_windup`/`slash2` 강한 베기
- `dash_windup`/`dash` 돌진 베기 · `balance_cast` 천칭 시전 · `balance_emblem` 천칭 문양(이펙트)
- `judgement_charge`/`judgement` 광역 심판 참격 · `phase` 페이즈 전환 · `hit` 피격 · `defeat_1~4` 쓰러짐
