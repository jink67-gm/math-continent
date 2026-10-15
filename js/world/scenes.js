// 장면 목록 — 새 장면(마을·필드·던전)을 만들면 여기에 추가합니다.
import { TestMeadow } from './TestMeadow.js';
import { FractionVillage } from './FractionVillage.js';
import { FractionCave } from './FractionCave.js';
import { TemplateVillage } from './TemplateVillage.js';
import { TemplateDungeon } from './TemplateDungeon.js';
import { ChaosSpire } from './ChaosSpire.js';
import { TestVillage, TestForest } from './testMaps.js';
import { VILLAGE_CONTENT } from '../data/villageContent.js';
import { getVillage } from '../data/villages.js';
import { RouteField } from './RouteField.js';
import { ROUTES, TRAILS } from '../data/routes.js';
import { ExploreField } from './ExploreField.js';

export const SCENES = {
  meadow: () => new TestMeadow(),
  fvVillage: () => new FractionVillage(),
  fvCave: () => new FractionCave(),
  chaosSpire: () => new ChaosSpire(),
  // 개발 점검용 맵 (정식 지도에는 연결 안 됨 — 주소 ?test=village 로만)
  testVillage: TestVillage,
  testForest: TestForest,
};

// 마을 2~6: 데이터로 마을·던전 장면을 만들어요
for (const c of VILLAGE_CONTENT) {
  const withName = { ...c, villageName: getVillage(c.village).name };
  SCENES[`${c.s}_village`] = () => new TemplateVillage(withName);
  SCENES[`${c.s}_dungeon`] = () => new TemplateDungeon(withName);
}

// 마을과 마을을 잇는 연결 필드 5개
for (const r of ROUTES) SCENES[r.id] = () => new RouteField(r.id);

// ⑭ 마을 → 탐험 필드(1~3개) → 던전 입구
for (const [village, T] of Object.entries(TRAILS)) {
  T.fields.forEach((f, i) => { SCENES[`${T.prefix}_trail${i + 1}`] = () => new ExploreField(village, i); });
}

export function createScene(id) {
  return (SCENES[id] || SCENES.meadow)();
}
