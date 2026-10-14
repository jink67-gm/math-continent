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
import { ROUTES } from '../data/routes.js';

export const SCENES = {
  meadow: () => new TestMeadow(),
  fvVillage: () => new FractionVillage(),
  fvCave: () => new FractionCave(),
  chaosSpire: () => new ChaosSpire(),
  // 새 에셋 테스트 맵 (출발의 초원 서쪽 끝에서 연결)
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

export function createScene(id) {
  return (SCENES[id] || SCENES.meadow)();
}
