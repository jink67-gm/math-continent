// 여러 지도가 이어진 지역(제노니아식) 목록
// 지역마다: 지도 묶음 · 마을 지도 · 첫 던전 지도 · 단원 · 메인/곁 퀘스트 · 보스 · 저장 자리
// 새 지역을 붙일 때는 rNmaps.js · rNquests.js 를 만들고 여기에 한 줄 더하면 돼요.

import { MAPS as M1 } from './r1maps.js';
import { MAPS as M2 } from './r2maps.js';
import { MAPS as M3 } from './r3maps.js';
import { MAPS as M4 } from './r4maps.js';
import { R1_MAIN, R1_SIDE } from './r1quests.js';
import { R2_MAIN, R2_SIDE } from './r2quests.js';
import { R3_MAIN, R3_SIDE } from './r3quests.js';
import { R4_MAIN, R4_SIDE } from './r4quests.js';
import { REGIONS } from './regions.js';
import { TROLL } from '../world/Boss.js';

export const MAP_REGIONS = {
  fractionValley: {
    name: '나눔의 계곡 프락시아', maps: M1, town: 'village', cave: 'cave1', unit: 'fractionDivision',
    main: R1_MAIN, side: R1_SIDE, save: 'r1', boss: TROLL, prefix: 'r1',
    chiefIdle: '풍차 소리가 참 듣기 좋구먼. 고맙네, 영웅!',
  },
  cubeCity: {
    name: REGIONS.cubeCity.name, maps: M2, town: 'cb_town', cave: 'cb_maze1', unit: 'spatial',
    main: R2_MAIN, side: R2_SIDE, save: 'cubeCity', boss: REGIONS.cubeCity.boss, prefix: 'cubeCity',
    chiefIdle: '성채가 이렇게 튼튼한 건 다 자네 덕분일세!',
  },
  decimalHarbor: {
    name: REGIONS.decimalHarbor.name, maps: M3, town: 'dh_town', cave: 'dh_cave1', unit: 'decimalDivision',
    main: R3_MAIN, side: R3_SIDE, save: 'decimalHarbor', boss: REGIONS.decimalHarbor.boss, prefix: 'decimalHarbor',
    chiefIdle: '등대 불빛이 오늘도 반짝이는구먼. 고맙네!',
  },
  ratioKingdom: {
    name: REGIONS.ratioKingdom.name, maps: M4, town: 'rk_town', cave: 'rk_vault1', unit: 'proportion',
    main: R4_MAIN, side: R4_SIDE, save: 'ratioKingdom', boss: REGIONS.ratioKingdom.boss, prefix: 'ratioKingdom',
    chiefIdle: '천칭이 반듯하니 마음이 편하오. 고맙소!',
  },
};

// 모든 지도를 한곳에 (지도 id는 지역끼리 겹치지 않아요). 지도마다 어느 지역인지 적어 둬요.
export const ALL_MAPS = {};
for (const [rid, r] of Object.entries(MAP_REGIONS)) {
  for (const [id, m] of Object.entries(r.maps)) {
    m.region = rid;
    ALL_MAPS[id] = m;
  }
}

export const isMapRegion = (vid) => !!MAP_REGIONS[vid];
export const regionOfMap = (mapId) => ALL_MAPS[mapId]?.region || 'fractionValley';
