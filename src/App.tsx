import { useEffect, useMemo, useState } from 'react';
import { Backpack, Building2, CalendarDays, ClipboardList, Coins, Crown, Heart, Landmark, Map as MapIcon, Search, Settings as SettingsIcon, Shield, Store, Swords, UserCog, Users, Wheat, Wrench } from 'lucide-react';
import { SCENARIOS_DATA, HISTORIC_OFFICERS_DATA, buildDebutingGenerals, buildScenarioCities, buildScenarioGenerals, getOfficerPlacement, HISTORICAL_DATA_SUMMARY, isPlayableHistoricOfficer, normalizeScenarioCityId } from './historicalData';
import { SPECIALTY_GRADES, SPECIALTY_KEYS, TRAIT_OPTIONS, TENDENCY_OPTIONS, bestTroopSpecialty, createDefaultSpecialties, ensureOfficerProfile, specialtyGradeValue, specialtyMultiplier, traitContextBonus, traitEffectLabel, tendencyContextBonus, tendencyEffectLabel, type SpecialtyKey, type SpecialtyMap } from './officerSystem';
import { APPOINTMENT_OPTIONS, OFFICER_RANKS, appointmentDefinition, availableAppointments, availableOfficerRanks, defaultOfficerRank, normalizeAppointment, normalizeOfficerRank, officerCommandCap, rankDefinition, type ForceRankName, type OfficerAppointment, type OfficerRank } from './personnelSystem';
import { DAYS_PER_MONTH, MONTHLY_ACTION_POINTS, OFFICER_TASKS, TROOP_TYPES, ageAtYear, councilKey, preferredTroopType, recommendOfficerTask, taskAdvice, travelDaysBetween, troopMatchupMultiplier, type OfficerTask, type TroopType } from './dayStrategySystem';
import { applyParentingSession, beginPregnancy, buildMarriageCandidates, childAgeAtDate, childBirthYear, childDevelopmentDescription, childDevelopmentStage, childEducationStatus, childTalentSummary, completeMarriage, DEFAULT_CHILD_PLAN_RULES, DEFAULT_MARRIAGE_RULES, DEFAULT_PARENTING_RULES, designateFamilyHeir, dominantParentingFocus, emptyFamilyState, markChildComingOfAge, markChildSuccession, normalizeFamilyState, PARENTING_FOCUSES, parentingAllowedFocuses, parentingFocusDescription, pregnancyDaysRemaining, relationshipFavor, renameFamilyChild, resolveBirthIfDue, resolveChildDevelopmentMilestones, selectFamilySuccessor, spouseOf, validateChildPlan, validateMarriage, validateParenting, type FamilyChild, type FamilyOfficer, type FamilyParentProfile, type FamilyState, type ParentingFocus } from './familySystem';
import { WORLD_MAP_LABEL_SIDES, WORLD_MAP_POSITIONS, WORLD_REGION_LABELS } from './worldMap';

type Tab =
  | '천하'
  | '도시'
  | '내정'
  | '군사'
  | '인재'
  | '장수'
  | '임무'
  | '생애'
  | '가족'
  | '인사'
  | '무장'
  | '장비'
  | '상점'
  | '에디터'
  | '시스템';
type ItemType = '무기' | '갑옷' | '장신구' | '말' | '소모품' | '장식품' | '책';
type ShopSection = '교역' | '장비' | '장신구' | '아이템';
type CoreStatKey = 'leadership' | 'martial' | 'intelligence' | 'militaryStrategy' | 'politics' | 'diplomacy' | 'personnel' | 'charisma';
type Money = { gold: number; silver: number; copper: number };
type PlayerStatus = '군주' | '소속장수' | '재야' | '독립부대';
type PlayerAuthority = PlayerStatus | '태수';
type TradeJourneyRecord = { id: string; leaderId: string; escortId?: string; originCityId: string; targetCityId: string; goodName: string; quantity: number; lostQuantity: number; days: number; risk: number; attacked: boolean; arrivalDate: string };
type MissionCategory = '세력 명령' | '도시 의뢰' | '공적 임무';
type MissionKind = '행정 지원' | '치안 순찰' | '도적 토벌' | '인재 조사' | '상단 호위';
type OfficerMission = { id: string; category: MissionCategory; kind: MissionKind; title: string; description: string; issuer: string; cityId: string; difficulty: number; apCost: number; days: number; rewardMerit: number; rewardFame: number; rewardCopper: number; acceptedDate?: string };
type MissionResultRecord = { missionId: string; title: string; category: MissionCategory; success: boolean; chance: number; roll: number; merit: number; fame: number; rewardCopper: number; completedDate: string };
type PersonalGoalId = 'merit' | 'fame' | 'wealth' | 'caravan';
type PersonalGoalState = { id: PersonalGoalId; startedAt: string; startValue: number };
type City = {
  id: string;
  name: string;
  region: string;
  tier: number;
  owner: string;
  commerce: number;
  agriculture: number;
  security: number;
  population: number;
  troops: number;
  defense: number;
  training: number;
  neighbors: string[];
};
type General = {
  id: string;
  name: string;
  force: string;
  city: string;
  birthYear: number | null;
  birthYearEstimated?: boolean;
  gender?: '남' | '여';
  deathYear?: number | null;
  leadership: number;
  martial: number;
  intelligence: number;
  militaryStrategy: number;
  politics: number;
  diplomacy: number;
  personnel: number;
  charisma: number;
  specialties: SpecialtyMap;
  traits: string[];
  tendencies: string[];
  relations: string[];
  loyalty: number;
  equipment: Partial<Record<ItemType, string>>;
  rank: OfficerRank;
  appointment: OfficerAppointment;
  appointmentCityId?: string;
};
type Item = {
  id: string;
  name: string;
  type: ItemType;
  bonus: string;
  bonuses: Partial<Record<CoreStatKey, number>>;
  priceCopper: number;
  unique?: boolean;
  ownerId?: string;
  shop?: boolean;
  custom?: boolean;
};
type ArmyUnit = { generalId: string; troops: number; troopType: TroopType };
type ArmyFormation = { id: string; name: string; originCityId: string; targetCityId?: string; battlePlan: 'clash' | 'duel'; units: ArmyUnit[] };
type PrisonerRecord = { generalId: string; capturedAtCityId: string; originalForce: string };
type BattleOfficerOutcome = 'captured' | 'dead' | 'escaped';
type FreeOfficerRelation = { favor: number; conversations: number; gifts: number };
type OfficerBond = { favor: number; talks: number; gifts: number; trainingXp: Partial<Record<CoreStatKey, number>> };
type BattleReport = {
  title: string;
  mode: string;
  victory: boolean;
  result: string;
  lines: string[];
};
type GameState = {
  year: number;
  month: number;
  day: number;
  force: string;
  ruler: string;
  playerGeneralId: string;
  playerStatus: PlayerStatus;
  playerMerit: number;
  playerFame: number;
  family: FamilyState;
  careerHistory?: string[];
  activeMission?: OfficerMission;
  missionHistory?: MissionResultRecord[];
  personalGoal?: PersonalGoalState;
  claimedPersonalGoals?: PersonalGoalId[];
  personalTreasury: Money;
  forceColors: Record<string, string>;
  actionPoints: number;
  treasury: Money;
  cities: City[];
  generals: General[];
  ownedItems: string[];
  itemQuantities?: Record<string, number>;
  shopPurchases?: Record<string, number>;
  bookStudyXp?: Record<string, Partial<Record<CoreStatKey, number>>>;
  lastConsumableUseDate?: string;
  tradeGoods?: Record<string, number>;
  tradeJourneys?: TradeJourneyRecord[];
  discoveredOfficerIds: string[];
  freeOfficerRelations: Record<string, FreeOfficerRelation>;
  officerBonds: Record<string, OfficerBond>;
  armies: ArmyFormation[];
  prisoners: PrisonerRecord[];
  lastCouncilKey: string;
  officerTasks: Record<string, OfficerTask>;
  log: string[];
};

type AppScreen =
  | 'title'
  | 'era'
  | 'officer'
  | 'map'
  | 'custom-list'
  | 'custom-edit'
  | 'item-editor'
  | 'settings'
  | 'game';

type ScenarioEra = {
  id: string;
  year: number;
  title: string;
  subtitle: string;
  description: string;
};

type HistoricOfficer = {
  id: string;
  name: string;
  courtesyName: string;
  birthYear: number | null;
  birthYearEstimated?: boolean;
  deathYear: number | null;
  gender: '남' | '여';
  force: string;
  city: string;
  activeFrom: number;
  activeTo: number;
  leadership: number;
  martial: number;
  intelligence: number;
  militaryStrategy: number;
  politics: number;
  diplomacy: number;
  personnel: number;
  charisma: number;
  specialties: SpecialtyMap;
  traits: string[];
  tendencies: string[];
  relations: string[];
  portraitKey: string;
  fullBodyKey: string;
};

type CustomOfficer = {
  id: string;
  name: string;
  courtesyName: string;
  gender: '남' | '여';
  birthYear: number;
  force: string;
  city: string;
  leadership: number;
  martial: number;
  intelligence: number;
  militaryStrategy: number;
  politics: number;
  diplomacy: number;
  personnel: number;
  charisma: number;
  specialties: SpecialtyMap;
  traits: string[];
  tendencies: string[];
  relations: string[];
  createdAt: number;
  updatedAt: number;
};

const FUTURE_IMAGE_PATH = 'public/resources/image.png';
const FUTURE_OFFICER_PORTRAIT_PATH = 'public/resources/officer-portrait.png';
const FUTURE_OFFICER_FULLBODY_PATH = 'public/resources/officer-fullbody.png';
const SAVE_KEY = 'three-kingdoms-webgame-save-v1';
const CUSTOM_OFFICER_KEY = 'three-kingdoms-custom-officers-v1';
const CUSTOM_ITEM_KEY = 'three-kingdoms-custom-items-v1';
const FUTURE_WORLD_MAP_RESOURCE_PATH = 'public/resources/world-map.png';
const FUTURE_WORLD_MAP_PATH = `${import.meta.env.BASE_URL}resources/world-map.png?v=56`;
type CityScale = 'small' | 'medium' | 'large';
const CITY_ASSET_VERSION = '58';
const CITY_ICON_PATHS: Record<CityScale, string> = {
  small: `${import.meta.env.BASE_URL}resources/city-icon-small.png?v=${CITY_ASSET_VERSION}`,
  medium: `${import.meta.env.BASE_URL}resources/city-icon-medium.png?v=${CITY_ASSET_VERSION}`,
  large: `${import.meta.env.BASE_URL}resources/city-icon-large.png?v=${CITY_ASSET_VERSION}`,
};
const CITY_DETAIL_PATHS: Record<CityScale, string> = {
  small: `${import.meta.env.BASE_URL}resources/city-detail-small.png?v=${CITY_ASSET_VERSION}`,
  medium: `${import.meta.env.BASE_URL}resources/city-detail-medium.png?v=${CITY_ASSET_VERSION}`,
  large: `${import.meta.env.BASE_URL}resources/city-detail-large.png?v=${CITY_ASSET_VERSION}`,
};
function cityScaleFromTier(tier: number): CityScale { return tier >= 5 ? 'large' : tier >= 3 ? 'medium' : 'small'; }
function cityScaleLabel(tier: number) { return cityScaleFromTier(tier) === 'large' ? '대도시' : cityScaleFromTier(tier) === 'medium' ? '중도시' : '소도시'; }
function cityIconPath(city: Pick<City, 'tier'>) { return CITY_ICON_PATHS[cityScaleFromTier(city.tier)]; }
function cityDetailPath(city: Pick<City, 'tier'>) { return CITY_DETAIL_PATHS[cityScaleFromTier(city.tier)]; }

const SCENARIO_IMAGE_FILES: Record<string, string> = {
  'yellow-turban': 'yellow-turban.png',
  'anti-dongzhuo': 'anti-dongzhuo.png',
  warlords: 'warlords.png',
  guandu: 'guandu.png',
  'red-cliffs': 'red-cliffs.png',
  yizhou: 'yizhou.png',
  hanzhong: 'hanzhong.png',
  yiling: 'yiling.png',
  'northern-expedition': 'northern-expedition.png',
  wuzhang: 'wuzhang.png',
};
function scenarioImagePath(id: string) { return `${import.meta.env.BASE_URL}resources/scenarios/${SCENARIO_IMAGE_FILES[id] ?? `${id}.png`}`; }
function historicOfficerImageNumber(id: string) {
  const index = HISTORIC_OFFICERS_DATA.findIndex(officer => officer.id === id);
  return index >= 0 ? String(index + 1).padStart(4, '0') : '';
}
function officerPortraitPath(id: string) {
  const number = historicOfficerImageNumber(id);
  return number ? `${import.meta.env.BASE_URL}resources/officers/portraits/${number}.png` : '';
}
function officerFullbodyPath(id: string) {
  const number = historicOfficerImageNumber(id);
  return number ? `${import.meta.env.BASE_URL}resources/officers/fullbody/${number}.png` : '';
}
function cityArtworkPath(city: Pick<City, 'id' | 'tier'>) {
  return `${import.meta.env.BASE_URL}resources/cities/${city.id}.png`;
}

type DomesticKind = 'commerce' | 'agriculture' | 'security' | 'walls' | 'training' | 'recruit';
function cityDevelopmentCap(tier: number) { return tier >= 5 ? 100 : tier >= 3 ? 85 : 70; }
function cityFacilitySlots(tier: number) { return tier >= 5 ? 6 : tier >= 3 ? 5 : 4; }
function cityFacilityLevel(value: number, cap: number) { return Math.max(1, Math.min(5, Math.ceil((Math.max(0, Math.min(value, cap)) / Math.max(1, cap)) * 5))); }
type CityFacilityKey = 'market' | 'farm' | 'barracks' | 'walls' | 'tavern' | 'office';
function cityFacilityLevels(city: City): Record<CityFacilityKey, number> {
  const cap = cityDevelopmentCap(city.tier);
  const slots = cityFacilitySlots(city.tier);
  const activeLevel = (index: number, value: number) => index < slots ? cityFacilityLevel(value, cap) : 0;
  return {
    market: activeLevel(0, city.commerce),
    farm: activeLevel(1, city.agriculture),
    barracks: activeLevel(2, city.training),
    walls: activeLevel(3, city.defense),
    tavern: activeLevel(4, Math.round((city.commerce + city.security) / 2)),
    office: activeLevel(5, Math.round((city.commerce + city.agriculture + city.security) / 3)),
  };
}
function cityFacilityEffectLabel(city: City, key: CityFacilityKey) {
  const level = cityFacilityLevels(city)[key];
  if (level === 0) return '도시 규모 확장 시 활성';
  if (key === 'market') return `월 상업 세입 +${level * 4}%`;
  if (key === 'farm') return `월 농업 세입 +${level * 3}% · 인구 성장 +${level * 5}%`;
  if (key === 'barracks') return `징병 +${level * 5}% · 훈련 개발 +${Math.floor(level / 2)}`;
  if (key === 'walls') return `수성 전투력 +${level * 3}%`;
  if (key === 'tavern') return `인재 탐색력 +${level * 4}`;
  return `내정 AP 비용 -${Math.ceil(level / 2)}`;
}
function cityFacilityRows(city: City): Array<{ key: CityFacilityKey; name: string; description: string; value: number; command: DomesticKind | null; tab: Tab | null; actionLabel: string }> {
  return [
    { key: 'market', name: '시장', description: '상업과 월 세입을 담당', value: city.commerce, command: 'commerce', tab: null, actionLabel: '상업 개발' },
    { key: 'farm', name: '농지', description: '농업과 인구 성장을 담당', value: city.agriculture, command: 'agriculture', tab: null, actionLabel: '농업 개발' },
    { key: 'barracks', name: '병영', description: '주둔군 훈련과 전투 준비', value: city.training, command: 'training', tab: null, actionLabel: '병사 훈련' },
    { key: 'walls', name: '성벽', description: '도시 방어력과 공성 저항', value: city.defense, command: 'walls', tab: null, actionLabel: '방벽 보수' },
    { key: 'tavern', name: '주점', description: '인재 탐색과 지역 교류', value: Math.round((city.commerce + city.security) / 2), command: null, tab: '인재', actionLabel: '인재 탐색' },
    { key: 'office', name: '관청', description: '도시 행정과 인사 운영', value: Math.round((city.commerce + city.agriculture + city.security) / 3), command: null, tab: '인사', actionLabel: '인사 관리' },
  ];
}
type CityPromotionPlan = { targetTier: number; targetLabel: '중도시' | '대도시'; costCopper: number; costLabel: string; apCost: number; days: number; population: number; commerce: number; agriculture: number; security: number; defense: number };
function cityPromotionPlan(city: Pick<City, 'tier'>): CityPromotionPlan | null {
  const scale = cityScaleFromTier(city.tier);
  if (scale === 'small') return { targetTier: 3, targetLabel: '중도시', costCopper: 10000, costLabel: '100은', apCost: 20, days: 7, population: 100000, commerce: 55, agriculture: 55, security: 60, defense: 45 };
  if (scale === 'medium') return { targetTier: 5, targetLabel: '대도시', costCopper: 30000, costLabel: '300은', apCost: 30, days: 12, population: 180000, commerce: 75, agriculture: 75, security: 75, defense: 65 };
  return null;
}
function cityPromotionRequirements(city: City, plan: CityPromotionPlan) {
  return [
    { label: '인구', current: city.population, required: plan.population, met: city.population >= plan.population },
    { label: '상업', current: city.commerce, required: plan.commerce, met: city.commerce >= plan.commerce },
    { label: '농업', current: city.agriculture, required: plan.agriculture, met: city.agriculture >= plan.agriculture },
    { label: '치안', current: city.security, required: plan.security, met: city.security >= plan.security },
    { label: '방벽', current: city.defense, required: plan.defense, met: city.defense >= plan.defense },
  ];
}
type CityIdentity = { trait: string; product: string; description: string; commerceIncome: number; agricultureIncome: number; populationGrowth: number; recruit: number; training: number; defense: number; search: number; domesticAp: number; cavalryAttack: number };
const CITY_IDENTITY_OVERRIDES: Record<string, Partial<CityIdentity> & Pick<CityIdentity, 'trait' | 'product' | 'description'>> = {
  luoyang: { trait: '천하의 중심', product: '비단', description: '제국의 중심지로 상업과 인재가 모인다.', commerceIncome: 0.12, search: 8, domesticAp: 1 },
  chang_an: { trait: '관중 수도', product: '비단', description: '관중 평야와 견고한 관문을 함께 지닌 서부 중심지다.', agricultureIncome: 0.08, defense: 0.06, domesticAp: 1 },
  xuchang: { trait: '행정 중심', product: '비단', description: '중원 행정과 물류가 집중되어 내정 효율이 높다.', commerceIncome: 0.08, search: 4, domesticAp: 2 },
  ye: { trait: '북방 대도시', product: '철', description: '하북의 인구와 병력이 모이는 군사·행정 거점이다.', recruit: 0.08, training: 1, commerceIncome: 0.05 },
  chengdu: { trait: '천부지국', product: '촉금', description: '비옥한 촉 평야를 바탕으로 농업과 인구 성장이 뛰어나다.', agricultureIncome: 0.15, populationGrowth: 0.15, commerceIncome: 0.05 },
  jianye: { trait: '강동 상항', product: '비단', description: '장강 수운과 강남 상업이 집중되는 동남의 중심지다.', commerceIncome: 0.15, recruit: 0.03 },
  wu: { trait: '강남 상업', product: '비단', description: '수운과 수공업이 발달한 강남의 부유한 도시다.', commerceIncome: 0.12, populationGrowth: 0.05 },
  kuaiji: { trait: '회계 물산', product: '도자기', description: '강남의 풍부한 물산과 해상 교역을 활용한다.', commerceIncome: 0.12, agricultureIncome: 0.05 },
  xiangyang: { trait: '장강 요충', product: '목재', description: '중원과 형주를 잇는 관문으로 방어와 교역에 강하다.', defense: 0.1, commerceIncome: 0.06, search: 4 },
  jiangling: { trait: '장강 수운', product: '목재', description: '장강 중류 수운을 장악하는 교통 중심지다.', commerceIncome: 0.1, defense: 0.06 },
  hanzhong: { trait: '관문 곡창', product: '약재', description: '산악 관문과 분지를 함께 지녀 농업과 수성에 유리하다.', agricultureIncome: 0.1, defense: 0.1 },
  shouchun: { trait: '회남 곡창', product: '쌀', description: '회수 유역의 풍부한 농업 생산력을 가진다.', agricultureIncome: 0.12, recruit: 0.05 },
  hefei: { trait: '회남 요새', product: '철', description: '북방과 강동 사이를 지키는 군사 요충지다.', defense: 0.12, training: 1 },
  wuwei: { trait: '서량 기마', product: '서량마', description: '양질의 군마와 기병 전통으로 기병 운용에 강하다.', cavalryAttack: 0.1, recruit: 0.08, training: 1 },
  tianshui: { trait: '서량 기마', product: '서량마', description: '서방 교통로와 군마 산지를 바탕으로 기병이 강하다.', cavalryAttack: 0.1, recruit: 0.08, training: 1 },
  anding: { trait: '서량 기마', product: '서량마', description: '변경의 군마와 전투적인 풍토가 기병을 강화한다.', cavalryAttack: 0.1, recruit: 0.08, training: 1 },
  beihai: { trait: '염철 교역', product: '소금', description: '해안 물산과 염업을 바탕으로 상업 수입이 높다.', commerceIncome: 0.12 },
  yunnan: { trait: '남중 산지', product: '약재', description: '산악 지형과 희귀 물산으로 수성과 탐색에 이점이 있다.', defense: 0.05, search: 4 },
  jianning: { trait: '남중 교역', product: '약재', description: '남중의 물산이 모여 농업과 교역에 보탬이 된다.', agricultureIncome: 0.06, commerceIncome: 0.06 },
};
function regionalCityIdentity(region: string): CityIdentity {
  const base: CityIdentity = { trait: '지역 거점', product: '지역 물산', description: '지역의 생산과 교통을 지탱하는 거점 도시다.', commerceIncome: 0.04, agricultureIncome: 0.04, populationGrowth: 0, recruit: 0, training: 0, defense: 0, search: 0, domesticAp: 0, cavalryAttack: 0 };
  if (region.includes('량주')) return { ...base, trait: '변경 기마', product: '군마', description: '서북 변경의 군마와 기병 전통을 활용한다.', recruit: 0.05, training: 1, cavalryAttack: 0.06 };
  if (region.includes('익주')) return { ...base, trait: '옥야 천리', product: '곡물', description: '비옥한 분지와 풍부한 농업 생산력을 가진다.', agricultureIncome: 0.08, populationGrowth: 0.08 };
  if (region.includes('양주')) return { ...base, trait: '강남 수운', product: '비단', description: '강과 수로를 이용한 교역과 수공업이 발달했다.', commerceIncome: 0.08, populationGrowth: 0.03 };
  if (region.includes('형주')) return { ...base, trait: '수륙 교통', product: '목재', description: '남북 교통과 장강 수운을 함께 활용한다.', commerceIncome: 0.06, defense: 0.04 };
  if (region.includes('교주')) return { ...base, trait: '남해 교역', product: '향료', description: '남방의 희귀 물산과 교역로를 통해 이익을 얻는다.', commerceIncome: 0.08, search: 2 };
  if (region.includes('병주') || region.includes('유주') || region.includes('요동')) return { ...base, trait: '북방 요충', product: '말', description: '북방의 군사적 환경이 병력 양성과 수성에 유리하다.', recruit: 0.05, defense: 0.05, cavalryAttack: 0.04 };
  if (region.includes('기주') || region.includes('청주') || region.includes('서주')) return { ...base, trait: '북중국 곡창', product: '곡물', description: '넓은 평야를 바탕으로 농업과 병력 동원이 안정적이다.', agricultureIncome: 0.07, recruit: 0.04 };
  if (region.includes('연주') || region.includes('예주') || region.includes('사예')) return { ...base, trait: '중원 교역', product: '철', description: '중원의 인구와 교통망을 활용해 행정과 상업이 발달했다.', commerceIncome: 0.06, domesticAp: 1 };
  return base;
}
function cityIdentity(city: Pick<City, 'id' | 'region'>): CityIdentity {
  const regional = regionalCityIdentity(city.region);
  return { ...regional, ...(CITY_IDENTITY_OVERRIDES[city.id] ?? {}) };
}
function cityIdentityEffectLabels(identity: CityIdentity) {
  const effects: string[] = [];
  if (identity.commerceIncome > 0) effects.push(`상업 세입 +${Math.round(identity.commerceIncome * 100)}%`);
  if (identity.agricultureIncome > 0) effects.push(`농업 세입 +${Math.round(identity.agricultureIncome * 100)}%`);
  if (identity.populationGrowth > 0) effects.push(`인구 성장 +${Math.round(identity.populationGrowth * 100)}%`);
  if (identity.recruit > 0) effects.push(`징병 +${Math.round(identity.recruit * 100)}%`);
  if (identity.training > 0) effects.push(`훈련 개발 +${identity.training}`);
  if (identity.defense > 0) effects.push(`수성 +${Math.round(identity.defense * 100)}%`);
  if (identity.search > 0) effects.push(`인재 탐색 +${identity.search}`);
  if (identity.domesticAp > 0) effects.push(`내정 AP -${identity.domesticAp}`);
  if (identity.cavalryAttack > 0) effects.push(`기병 공격 +${Math.round(identity.cavalryAttack * 100)}%`);
  return effects;
}
type TradeGoodDefinition = { name: string; basePriceCopper: number; description: string };
const TRADE_GOODS: TradeGoodDefinition[] = [
  { name: '지역 물산', basePriceCopper: 600, description: '각지에서 거래되는 일반 특산품' },
  { name: '곡물', basePriceCopper: 550, description: '도시와 군대의 기본 식량 자원' },
  { name: '쌀', basePriceCopper: 500, description: '남부와 회남에서 많이 생산되는 양곡' },
  { name: '목재', basePriceCopper: 700, description: '건축과 선박 제작에 쓰이는 자재' },
  { name: '철', basePriceCopper: 900, description: '무기와 농기구 제작에 필요한 금속' },
  { name: '소금', basePriceCopper: 800, description: '생활과 군량 보존에 필요한 필수품' },
  { name: '약재', basePriceCopper: 1000, description: '산지와 남중에서 나는 귀한 약재' },
  { name: '비단', basePriceCopper: 1200, description: '중원과 강남의 대표 고급 직물' },
  { name: '도자기', basePriceCopper: 1100, description: '강남에서 거래되는 고급 수공품' },
  { name: '향료', basePriceCopper: 1500, description: '남방 교역로에서 들어오는 희귀 상품' },
  { name: '말', basePriceCopper: 1300, description: '북방에서 공급되는 운송·군사용 말' },
  { name: '군마', basePriceCopper: 1400, description: '기병 운용에 적합한 질 좋은 말' },
  { name: '서량마', basePriceCopper: 1800, description: '서량에서 나는 최상급 군마' },
  { name: '촉금', basePriceCopper: 1600, description: '촉 지방의 명품 비단 직물' },
];
function tradeGoodDefinition(name: string) { return TRADE_GOODS.find(good => good.name === name) ?? TRADE_GOODS[0]; }
function tradeGoodCount(state: Pick<GameState, 'tradeGoods'>, name: string) { return Math.max(0, state.tradeGoods?.[name] ?? 0); }
function cityTradePrice(city: Pick<City, 'id' | 'region'>, goodName: string, mode: 'buy' | 'sell') {
  const good = tradeGoodDefinition(goodName);
  const localProduct = cityIdentity(city).product === goodName;
  const demandSwing = ((stableRoll(`${city.id}:${goodName}:trade`) - 50) / 100) * 0.5;
  const marketFactor = 1 + demandSwing;
  const factor = mode === 'buy' ? (localProduct ? 0.72 : marketFactor * 1.08) : (localProduct ? 0.58 : marketFactor * 0.96);
  return Math.max(10, Math.round((good.basePriceCopper * factor) / 10) * 10);
}
const FORCE_RULER_HINTS: Record<string, string> = { '유비군': '유비', '촉': '유비', '조조군': '조조', '위': '조비', '원소군': '원소', '손견군': '손견', '손책군': '손책', '손권군': '손권', '오': '손권', '동탁군': '동탁', '여포군': '여포', '공손찬군': '공손찬', '유표군': '유표', '유장군': '유장', '장로군': '장로', '원술군': '원술', '장수군': '장수', '공손도군': '공손도' };
function inferForceRulerName(force: string, generals: General[]) {
  const candidates = generals.filter(general => general.force === force);
  const hinted = FORCE_RULER_HINTS[force];
  const hintedGeneral = hinted ? candidates.find(general => general.name === hinted) : undefined;
  if (hintedGeneral) return hintedGeneral.name;
  const eponym = candidates.find(general => force.startsWith(general.name));
  if (eponym) return eponym.name;
  return candidates.slice().sort((a, b) => (b.charisma + b.leadership + b.politics) - (a.charisma + a.leadership + a.politics))[0]?.name ?? '';
}
function caravanRiskPercent(days: number, leader: General, escort: General | undefined, status: PlayerStatus, destinationOwner: string) {
  const foreignPenalty = leader.force !== '재야' && destinationOwner !== leader.force ? 8 : 0;
  const statusPenalty = status === '독립부대' ? 6 : status === '재야' ? 2 : 0;
  const leaderGuard = Math.floor((leader.leadership + leader.martial + leader.intelligence) / 45);
  const escortGuard = escort ? Math.floor((escort.leadership + escort.martial) / 18) : 0;
  return Math.max(5, Math.min(65, 12 + Math.floor(days * 1.3) + foreignPenalty + statusPenalty - leaderGuard - escortGuard));
}
const FORCE_COLOR_PALETTE = ['#2563EB', '#22C55E', '#F59E0B', '#374151', '#8B5CF6', '#B91C1C', '#0F766E', '#DB2777', '#0891B2', '#92400E', '#65A30D', '#7C3AED', '#E11D48', '#CA8A04', '#0284C7', '#059669', '#EA580C', '#7F1D1D', '#A16207', '#1D4ED8', '#16A34A', '#C2410C', '#64748B', '#9333EA', '#0D9488', '#BE123C', '#4D7C0F', '#0369A1', '#C026D3', '#A855F7', '#EAB308', '#475569'];
const PREFERRED_FORCE_COLORS: Record<string, string> = {
  '조조군': '#2563EB', '유비군': '#22C55E', '손책군': '#F59E0B', '여포군': '#374151',
  '원소군': '#8B5CF6', '동탁군': '#B91C1C', '유표군': '#0F766E', '유장군': '#DB2777',
  '공손찬군': '#0891B2', '마등군': '#92400E', '장로군': '#65A30D', '도겸군': '#7C3AED',
  '장수군': '#E11D48', '황건 잔당': '#CA8A04', '공손도군': '#0284C7', '사섭군': '#059669',
  '손견군': '#EA580C', '고구려': '#7F1D1D', '부여': '#A16207', '위': '#1D4ED8', '촉': '#16A34A', '오': '#C2410C',
};
const UNRULED_CITY_OWNERS = new Set(['재야', '무주', '후한 조정', '후한 지방세력', '후한 동방군현', '후한 교주', '지방세력']);
function isUnruledCityOwner(owner: string) { return UNRULED_CITY_OWNERS.has(owner); }
function buildForceColorMap(cities: Pick<City, 'owner'>[], previous: Record<string, string> = {}, reservedForce?: string, reservedColor?: string) {
  const forces = Array.from(new Set(cities.map(city => city.owner).filter(Boolean)));
  if (reservedForce && !forces.includes(reservedForce)) forces.push(reservedForce);
  const result: Record<string, string> = {};
  const used = new Set<string>();
  if (reservedForce && reservedColor) { result[reservedForce] = reservedColor; used.add(reservedColor); }
  forces.forEach((force, index) => {
    if (result[force]) return;
    if (isUnruledCityOwner(force)) { result[force] = '#F4F4EE'; return; }
    let color = previous[force];
    if (!color || used.has(color)) color = PREFERRED_FORCE_COLORS[force];
    if (!color || used.has(color)) color = FORCE_COLOR_PALETTE.find(candidate => !used.has(candidate));
    if (!color) color = `hsl(${(index * 47 + 17) % 360} 62% 52%)`;
    result[force] = color;
    used.add(color);
  });
  return result;
}
function forceColor(colors: Record<string, string>, force: string) { return colors[force] ?? PREFERRED_FORCE_COLORS[force] ?? '#E5E7EB'; }
const TABS: Tab[] = [
  '천하',
  '도시',
  '내정',
  '군사',
  '인재',
  '장수',
  '임무',
  '생애',
  '가족',
  '인사',
  '무장',
  '장비',
  '상점',
  '에디터',
  '시스템',
];
const SIDEBAR_TABS: Tab[] = ['도시', '군사', '장수', '임무', '생애', '가족', '무장', '인사', '내정', '인재', '상점', '장비', '에디터', '시스템'];
const MINOR_SUCCESSOR_TABS: Tab[] = ['천하', '장수', '생애', '가족', '시스템'];
const TAB_ICONS: Record<Tab, typeof MapIcon> = {
  천하: MapIcon,
  도시: Building2,
  내정: Wheat,
  군사: Swords,
  인재: Search,
  장수: Users,
  임무: ClipboardList,
  생애: Crown,
  가족: Heart,
  인사: UserCog,
  무장: Shield,
  장비: Backpack,
  상점: Store,
  에디터: Wrench,
  시스템: SettingsIcon,
};
const EQUIPPABLE_TYPES: ItemType[] = ['무기', '갑옷', '장신구', '말', '장식품'];
const SHOP_CATEGORIES: Array<'전체' | ItemType> = ['전체', '무기', '갑옷', '장신구', '말', '소모품', '장식품', '책'];
const SHOP_SECTIONS: ShopSection[] = ['교역', '장비', '장신구', '아이템'];
const SHOP_SECTION_TYPES: Record<Exclude<ShopSection, '교역'>, ItemType[]> = {
  장비: ['무기', '갑옷', '말'],
  장신구: ['장신구', '장식품'],
  아이템: ['소모품', '책'],
};

const LEGACY_SCENARIOS: ScenarioEra[] = [
  {
    id: 'yellow-turban',
    year: 184,
    title: '황건의 난',
    subtitle: '한실의 균열',
    description: '각지에서 황건적이 봉기하고 새로운 영웅들이 이름을 드러내기 시작한 시대.',
  },
  {
    id: 'anti-dongzhuo',
    year: 190,
    title: '반동탁 연합',
    subtitle: '군웅의 집결',
    description: '동탁의 전횡에 맞서 제후들이 연합군을 일으킨 시대.',
  },
  {
    id: 'warlords',
    year: 194,
    title: '군웅할거',
    subtitle: '천하의 분열',
    description: '각지의 군웅이 독자적인 세력을 구축하며 본격적인 쟁패가 시작된 시대.',
  },
  {
    id: 'guandu',
    year: 200,
    title: '관도대전',
    subtitle: '조조와 원소',
    description: '중원의 패권을 두고 조조와 원소가 충돌하는 거대한 분기점.',
  },
];

const LEGACY_HISTORIC_OFFICERS = [
  {
    id: 'liubei', name: '유비', courtesyName: '현덕', birthYear: 161, deathYear: 223,
    gender: '남', force: '유비군', city: 'pingyuan', activeFrom: 184, activeTo: 223,
    leadership: 78, martial: 74, intelligence: 76, politics: 82, charisma: 96,
    traits: ['인덕', '의형제'], relations: ['관우', '장비'], portraitKey: 'liubei', fullBodyKey: 'liubei-full',
  },
  {
    id: 'guanyu', name: '관우', courtesyName: '운장', birthYear: null, deathYear: 220,
    gender: '남', force: '유비군', city: 'pingyuan', activeFrom: 184, activeTo: 220,
    leadership: 91, martial: 97, intelligence: 78, politics: 62, charisma: 88,
    traits: ['신의', '맹장'], relations: ['유비', '장비'], portraitKey: 'guanyu', fullBodyKey: 'guanyu-full',
  },
  {
    id: 'zhangfei', name: '장비', courtesyName: '익덕', birthYear: null, deathYear: 221,
    gender: '남', force: '유비군', city: 'pingyuan', activeFrom: 184, activeTo: 221,
    leadership: 85, martial: 98, intelligence: 34, politics: 28, charisma: 61,
    traits: ['호걸', '돌격'], relations: ['유비', '관우'], portraitKey: 'zhangfei', fullBodyKey: 'zhangfei-full',
  },
  {
    id: 'caocao', name: '조조', courtesyName: '맹덕', birthYear: 155, deathYear: 220,
    gender: '남', force: '조조군', city: 'xuchang', activeFrom: 184, activeTo: 220,
    leadership: 96, martial: 72, intelligence: 92, politics: 94, charisma: 91,
    traits: ['간웅', '용병'], relations: ['하후돈', '순욱'], portraitKey: 'caocao', fullBodyKey: 'caocao-full',
  },
  {
    id: 'yuanshao', name: '원소', courtesyName: '본초', birthYear: null, deathYear: 202,
    gender: '남', force: '원소군', city: 'ye', activeFrom: 184, activeTo: 202,
    leadership: 82, martial: 69, intelligence: 72, politics: 77, charisma: 90,
    traits: ['명문', '대군'], relations: ['원술'], portraitKey: 'yuanshao', fullBodyKey: 'yuanshao-full',
  },
  {
    id: 'dongzhuo', name: '동탁', courtesyName: '중영', birthYear: null, deathYear: 192,
    gender: '남', force: '동탁군', city: 'luoyang', activeFrom: 184, activeTo: 192,
    leadership: 86, martial: 87, intelligence: 68, politics: 61, charisma: 42,
    traits: ['폭정', '서량군'], relations: ['여포'], portraitKey: 'dongzhuo', fullBodyKey: 'dongzhuo-full',
  },
  {
    id: 'sunJian', name: '손견', courtesyName: '문대', birthYear: 155, deathYear: 191,
    gender: '남', force: '손견군', city: 'jianye', activeFrom: 184, activeTo: 191,
    leadership: 93, martial: 94, intelligence: 77, politics: 68, charisma: 89,
    traits: ['강동의 호랑이', '맹공'], relations: ['손책', '손권'], portraitKey: 'sunjian', fullBodyKey: 'sunjian-full',
  },
  {
    id: 'sunce', name: '손책', courtesyName: '백부', birthYear: 175, deathYear: 200,
    gender: '남', force: '손견군', city: 'jianye', activeFrom: 194, activeTo: 200,
    leadership: 92, martial: 95, intelligence: 74, politics: 69, charisma: 92,
    traits: ['소패왕', '급습'], relations: ['주유', '손권'], portraitKey: 'sunce', fullBodyKey: 'sunce-full',
  },
  {
    id: 'sunquan', name: '손권', courtesyName: '중모', birthYear: 182, deathYear: 252,
    gender: '남', force: '손견군', city: 'jianye', activeFrom: 200, activeTo: 252,
    leadership: 82, martial: 67, intelligence: 85, politics: 89, charisma: 91,
    traits: ['수성', '인재등용'], relations: ['손책', '주유'], portraitKey: 'sunquan', fullBodyKey: 'sunquan-full',
  },
  {
    id: 'lvbu', name: '여포', courtesyName: '봉선', birthYear: null, deathYear: 199,
    gender: '남', force: '동탁군', city: 'luoyang', activeFrom: 184, activeTo: 199,
    leadership: 86, martial: 100, intelligence: 28, politics: 21, charisma: 72,
    traits: ['비장', '일기당천'], relations: ['동탁'], portraitKey: 'lvbu', fullBodyKey: 'lvbu-full',
  },
];

void [LEGACY_SCENARIOS, LEGACY_HISTORIC_OFFICERS];
const SCENARIOS: ScenarioEra[] = SCENARIOS_DATA;
const HISTORIC_OFFICERS: HistoricOfficer[] = HISTORIC_OFFICERS_DATA;

const ITEMS: Item[] = [
  { id: 'bronze-sword', name: '청동검', type: '무기', bonus: '무력 +1', bonuses: { martial: 1 }, priceCopper: 1200 },
  { id: 'iron-spear', name: '철창', type: '무기', bonus: '무력 +1', bonuses: { martial: 1 }, priceCopper: 1800 },
  { id: 'iron-sword', name: '철검', type: '무기', bonus: '무력 +1', bonuses: { martial: 1 }, priceCopper: 1600 },
  { id: 'long-spear', name: '장창', type: '무기', bonus: '무력 +1', bonuses: { martial: 1 }, priceCopper: 2000 },
  { id: 'leather-armor', name: '가죽찰갑', type: '갑옷', bonus: '무력 +1', bonuses: { martial: 1 }, priceCopper: 1800 },
  { id: 'hide-lamellar', name: '피혁 소찰갑', type: '갑옷', bonus: '무력 +1', bonuses: { martial: 1 }, priceCopper: 2400 },
  { id: 'war-armor', name: '철제 찰갑', type: '갑옷', bonus: '무력 +1 · 통솔 +1', bonuses: { martial: 1, leadership: 1 }, priceCopper: 4200 },
  { id: 'iron-lamellar', name: '철제 소찰갑', type: '갑옷', bonus: '무력 +1 · 통솔 +1', bonuses: { martial: 1, leadership: 1 }, priceCopper: 5200 },
  { id: 'reinforced-lamellar', name: '중찰갑', type: '갑옷', bonus: '무력 +1 · 통솔 +1', bonuses: { martial: 1, leadership: 1 }, priceCopper: 7200 },
  { id: 'jade', name: '옥패', type: '장신구', bonus: '매력 +1', bonuses: { charisma: 1 }, priceCopper: 2400 },
  { id: 'tiger-tally', name: '호부', type: '장신구', bonus: '통솔 +1 · 인사 +1', bonuses: { leadership: 1, personnel: 1 }, priceCopper: 5400 },
  { id: 'gold-seal', name: '금인', type: '장신구', bonus: '정치 +1 · 외교 +1', bonuses: { politics: 1, diplomacy: 1 }, priceCopper: 6800 },
  { id: 'horse', name: '군마', type: '말', bonus: '군략 +1 · 기동 보정', bonuses: { militaryStrategy: 1 }, priceCopper: 4200 },
  { id: 'green-dragon', name: '청룡언월도', type: '무기', bonus: '무력 +5 · 통솔 +1', bonuses: { martial: 5, leadership: 1 }, priceCopper: 0, unique: true, ownerId: 'guanyu', shop: false },
  { id: 'serpent-spear', name: '장팔사모', type: '무기', bonus: '무력 +5', bonuses: { martial: 5 }, priceCopper: 0, unique: true, ownerId: 'zhangfei', shop: false },
  { id: 'sky-halberd', name: '방천화극', type: '무기', bonus: '무력 +6 · 군략 +1', bonuses: { martial: 6, militaryStrategy: 1 }, priceCopper: 0, unique: true, ownerId: 'lvbu', shop: false },
  { id: 'yitian-sword', name: '의천검', type: '무기', bonus: '무력 +4 · 지략 +1', bonuses: { martial: 4, intelligence: 1 }, priceCopper: 0, unique: true, ownerId: 'caocao', shop: false },
  { id: 'qinggang-sword', name: '청강검', type: '무기', bonus: '무력 +4', bonuses: { martial: 4 }, priceCopper: 0, unique: true, ownerId: 'caocao', shop: false },
  { id: 'imperial-seal', name: '전국옥새', type: '장신구', bonus: '매력 +5 · 정치 +3', bonuses: { charisma: 5, politics: 3 }, priceCopper: 0, unique: true, ownerId: 'sunjian', shop: false },
  { id: 'red-hare', name: '적토마', type: '말', bonus: '군략 +4 · 무력 +1', bonuses: { militaryStrategy: 4, martial: 1 }, priceCopper: 0, unique: true, ownerId: 'lvbu', shop: false },
  { id: 'dilu', name: '적로', type: '말', bonus: '군략 +3 · 통솔 +1', bonuses: { militaryStrategy: 3, leadership: 1 }, priceCopper: 0, unique: true, ownerId: 'liubei', shop: false },
  { id: 'jueying', name: '절영', type: '말', bonus: '군략 +3 · 통솔 +1', bonuses: { militaryStrategy: 3, leadership: 1 }, priceCopper: 0, unique: true, ownerId: 'caocao', shop: false },
  { id: 'zhaohuangfeidian', name: '조황비전', type: '말', bonus: '군략 +3 · 매력 +1', bonuses: { militaryStrategy: 3, charisma: 1 }, priceCopper: 0, unique: true, ownerId: 'caocao', shop: false },
  { id: 'herb', name: '약초', type: '소모품', bonus: '사용: 행동력 +3 · 하루 1회', bonuses: {}, priceCopper: 180 },
  { id: 'wound-medicine', name: '금창약', type: '소모품', bonus: '사용: 행동력 +5 · 하루 1회', bonuses: {}, priceCopper: 480 },
  { id: 'antidote', name: '해독산', type: '소모품', bonus: '사용: 행동력 +4 · 하루 1회', bonuses: {}, priceCopper: 420 },
  { id: 'wine', name: '명주', type: '소모품', bonus: '사용: 행동력 +2 · 명성 +2 · 하루 1회', bonuses: {}, priceCopper: 650 },
  { id: 'silk-ornament', name: '비단 장식', type: '장식품', bonus: '매력 +1 · 장착 가능', bonuses: { charisma: 1 }, priceCopper: 900 },
  { id: 'fragrant-pouch', name: '향낭', type: '장식품', bonus: '외교 +1 · 매력 +1 · 장착 가능', bonuses: { diplomacy: 1, charisma: 1 }, priceCopper: 1200 },
  { id: 'gold-crown-ornament', name: '금제 관식', type: '장식품', bonus: '정치 +2 · 매력 +2 · 장착 가능', bonuses: { politics: 2, charisma: 2 }, priceCopper: 9200 },
  { id: 'art-of-war', name: '손자병법', type: '책', bonus: '연구: 군략 EXP +35', bonuses: {}, priceCopper: 5200 },
  { id: 'six-secret-teachings', name: '육도', type: '책', bonus: '연구: 통솔 EXP +35', bonuses: {}, priceCopper: 4800 },
  { id: 'three-strategies', name: '삼략', type: '책', bonus: '연구: 군략 EXP +20 · 정치 EXP +20', bonuses: {}, priceCopper: 4700 },
  { id: 'wuzi', name: '오자병법', type: '책', bonus: '연구: 통솔 EXP +20 · 군략 EXP +20', bonuses: {}, priceCopper: 4600 },
  { id: 'mengde-new-book', name: '맹덕신서', type: '책', bonus: '연구: 지략 EXP +40 · 군략 EXP +30', bonuses: {}, priceCopper: 0, unique: true, ownerId: 'caocao', shop: false },
];
let RUNTIME_CUSTOM_ITEMS: Item[] = [];
function catalogItem(itemId: string) { return ITEMS.find(item => item.id === itemId) ?? RUNTIME_CUSTOM_ITEMS.find(item => item.id === itemId); }

function compactMapLog(entry: string) {
  const trimmed = entry.trim();
  if (!trimmed) return '';
  const tagMatch = trimmed.match(/^\[([^\]]+)\]\s*/);
  const tag = tagMatch ? `[${tagMatch[1]}] ` : '';
  const body = tagMatch ? trimmed.slice(tagMatch[0].length) : trimmed;
  const parts = body.split(' · ').map(part => part.trim()).filter(Boolean);
  const meaningful = parts.filter(part => !/^\d+년(?:\s+\d+월(?:\s+\d+일)?)?/.test(part));
  const summary = (meaningful.length ? meaningful : parts).slice(0, 2).join(' · ') || body;
  const normalized = summary.replace(/\s+/g, ' ').replace(/\.$/, '');
  const clipped = normalized.length > 72 ? `${normalized.slice(0, 69)}…` : normalized;
  return `${tag}${clipped}`;
}
function famousItemsForForce(generals: General[], force: string) { const ids = new Set(generals.filter(general => general.force === force).map(general => general.id)); return ITEMS.filter(item => item.ownerId && ids.has(item.ownerId)).map(item => item.id); }
function seedFamousEquipment(generals: General[]) { return generals.map(general => { const equipment = { ...general.equipment }; ITEMS.filter(item => item.ownerId === general.id && EQUIPPABLE_TYPES.includes(item.type)).forEach(item => { if (!equipment[item.type]) equipment[item.type] = item.id; }); return { ...general, equipment }; }); }

const LEGACY_INITIAL_CITIES: City[] = [
  {
    id: 'pingyuan',
    name: '평원',
    region: '기주',
    owner: '유비군',
    commerce: 38,
    agriculture: 44,
    security: 70,
    population: 86000,
    troops: 12000,
    defense: 38,
    neighbors: ['beihai', 'ye'],
  },
  {
    id: 'beihai',
    name: '북해',
    region: '청주',
    owner: '황건 잔당',
    commerce: 29,
    agriculture: 37,
    security: 42,
    population: 72000,
    troops: 5200,
    defense: 31,
    neighbors: ['pingyuan', 'xiapi'],
  },
  {
    id: 'ye',
    name: '업',
    region: '기주',
    owner: '원소군',
    commerce: 62,
    agriculture: 68,
    security: 74,
    population: 168000,
    troops: 18500,
    defense: 62,
    neighbors: ['pingyuan', 'luoyang', 'xuchang'],
  },
  {
    id: 'luoyang',
    name: '낙양',
    region: '사예',
    owner: '동탁군',
    commerce: 70,
    agriculture: 55,
    security: 48,
    population: 210000,
    troops: 23000,
    defense: 76,
    neighbors: ['ye', 'xuchang', 'wan'],
  },
  {
    id: 'xuchang',
    name: '허창',
    region: '예주',
    owner: '조조군',
    commerce: 58,
    agriculture: 61,
    security: 82,
    population: 142000,
    troops: 17000,
    defense: 58,
    neighbors: ['ye', 'luoyang', 'xiapi', 'wan'],
  },
  {
    id: 'xiapi',
    name: '하비',
    region: '서주',
    owner: '도겸군',
    commerce: 46,
    agriculture: 64,
    security: 66,
    population: 128000,
    troops: 10800,
    defense: 48,
    neighbors: ['beihai', 'xuchang', 'jianye'],
  },
  {
    id: 'wan',
    name: '완',
    region: '형주',
    owner: '장수군',
    commerce: 41,
    agriculture: 53,
    security: 63,
    population: 99000,
    troops: 9100,
    defense: 45,
    neighbors: ['luoyang', 'xuchang', 'chengdu', 'jianye'],
  },
  {
    id: 'chengdu',
    name: '성도',
    region: '익주',
    owner: '유장군',
    commerce: 66,
    agriculture: 82,
    security: 86,
    population: 196000,
    troops: 16000,
    defense: 72,
    neighbors: ['wan'],
  },
  {
    id: 'jianye',
    name: '건업',
    region: '양주',
    owner: '손견군',
    commerce: 63,
    agriculture: 57,
    security: 78,
    population: 154000,
    troops: 15200,
    defense: 64,
    neighbors: ['xiapi', 'wan'],
  },
];

const LEGACY_INITIAL_GENERALS = [
  {
    id: 'liubei',
    name: '유비',
    force: '유비군',
    city: 'pingyuan',
    leadership: 78,
    martial: 74,
    intelligence: 76,
    politics: 82,
    charisma: 96,
    loyalty: 100,
    equipment: { 무기: 'bronze-sword' },
  },
  {
    id: 'guanyu',
    name: '관우',
    force: '유비군',
    city: 'pingyuan',
    leadership: 91,
    martial: 97,
    intelligence: 78,
    politics: 62,
    charisma: 88,
    loyalty: 100,
    equipment: {},
  },
  {
    id: 'zhangfei',
    name: '장비',
    force: '유비군',
    city: 'pingyuan',
    leadership: 85,
    martial: 98,
    intelligence: 34,
    politics: 28,
    charisma: 61,
    loyalty: 100,
    equipment: {},
  },
  {
    id: 'caocao',
    name: '조조',
    force: '조조군',
    city: 'xuchang',
    leadership: 96,
    martial: 72,
    intelligence: 92,
    politics: 94,
    charisma: 91,
    loyalty: 100,
    equipment: {},
  },
  {
    id: 'yuanShao',
    name: '원소',
    force: '원소군',
    city: 'ye',
    leadership: 82,
    martial: 69,
    intelligence: 72,
    politics: 77,
    charisma: 90,
    loyalty: 100,
    equipment: {},
  },
  {
    id: 'sunJian',
    name: '손견',
    force: '손견군',
    city: 'jianye',
    leadership: 93,
    martial: 94,
    intelligence: 77,
    politics: 68,
    charisma: 89,
    loyalty: 100,
    equipment: {},
  },
  {
    id: 'dongzhuo',
    name: '동탁',
    force: '동탁군',
    city: 'luoyang',
    leadership: 86,
    martial: 87,
    intelligence: 68,
    politics: 61,
    charisma: 42,
    loyalty: 100,
    equipment: {},
  },
];

void [LEGACY_INITIAL_CITIES, LEGACY_INITIAL_GENERALS];

function initialState(year = 190): GameState {
  const cities = buildScenarioCities(year).map(city => ({ ...city, training: clampStat(35 + Math.floor(city.security * 0.35)), neighbors: [...city.neighbors] }));
  const forceCityCounts = cities.reduce<Record<string, number>>((counts, city) => ({ ...counts, [city.owner]: (counts[city.owner] ?? 0) + 1 }), {});
  const generals = seedFamousEquipment(buildScenarioGenerals(year).map(general => {
    const localForceRank = getForceRank(forceCityCounts[general.force] ?? 1);
    return {
      ...general,
      equipment: { ...general.equipment },
      rank: defaultOfficerRank(general.leadership, general.militaryStrategy, localForceRank.name),
      appointment: '없음' as OfficerAppointment,
    };
  }));
  const ownedItems = Array.from(new Set(['bronze-sword', ...famousItemsForForce(generals, '유비군')]));
  return {
    year,
    month: 1,
    day: 1,
    force: '유비군',
    ruler: '유비',
    playerGeneralId: 'liubei',
    playerStatus: '군주',
    playerMerit: 1200,
    playerFame: 450,
    family: emptyFamilyState(),
    careerHistory: [`${year}년 1월 1일 · 군주로 천하에 이름을 올렸다.`],
    activeMission: undefined,
    missionHistory: [],
    personalGoal: undefined,
    claimedPersonalGoals: [],
    personalTreasury: { gold: 5, silver: 0, copper: 0 },
    forceColors: buildForceColorMap(cities),
    actionPoints: MONTHLY_ACTION_POINTS,
    treasury: { gold: 100, silver: 0, copper: 0 },
    cities,
    generals,
    ownedItems,
    itemQuantities: Object.fromEntries(ownedItems.map(id => [id, 1])),
    shopPurchases: {},
    bookStudyXp: {},
    lastConsumableUseDate: undefined,
    tradeGoods: {},
    tradeJourneys: [],
    discoveredOfficerIds: [],
    freeOfficerRelations: {},
    officerBonds: {},
    armies: [],
    prisoners: [],
    lastCouncilKey: councilKey(year, 1, 1),
    officerTasks: {},
    log: [`${year}년 1월 1일, 천하를 향한 첫 걸음을 시작했다.`],
  };
}

function moneyToCopper(money: Money) {
  return money.gold * 10000 + money.silver * 100 + money.copper;
}

function copperToMoney(total: number): Money {
  const safe = Math.max(0, Math.floor(total));
  const gold = Math.floor(safe / 10000);
  const silver = Math.floor((safe % 10000) / 100);
  const copper = safe % 100;
  return { gold, silver, copper };
}

function formatMoney(money: Money) {
  return `${money.gold}금 ${money.silver}은 ${money.copper}동`;
}

function clampStat(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const CORE_STAT_LABELS: Record<CoreStatKey, string> = {
  leadership: '통솔', martial: '무력', intelligence: '지략', militaryStrategy: '군략',
  politics: '정치', diplomacy: '외교', personnel: '인사', charisma: '매력',
};

function equipmentBonusForStat(general: General, stat: CoreStatKey) {
  return (Object.values(general.equipment).filter(Boolean) as string[]).reduce((sum, itemId) => {
    const item = catalogItem(itemId);
    return sum + (item?.bonuses[stat] ?? 0);
  }, 0);
}

function effectiveStat(general: General | undefined, stat: CoreStatKey, fallback = 60) {
  if (!general) return fallback;
  return clampStat(general[stat] + equipmentBonusForStat(general, stat));
}

function officerAgeText(birthYear: number | null | undefined, estimated: boolean | undefined, year: number) {
  const age = ageAtYear(birthYear, year);
  if (!age) return '나이 미상';
  return estimated ? `추정 ${age}세` : `${age}세`;
}

function familyOfficerProfile(general: General, customOfficers: CustomOfficer[]): FamilyOfficer {
  const historic = HISTORIC_OFFICERS.find(officer => officer.id === general.id);
  const custom = customOfficers.find(officer => officer.id === general.id);
  return {
    id: general.id,
    name: general.name,
    city: general.city,
    birthYear: general.birthYear,
    birthYearEstimated: general.birthYearEstimated,
    gender: general.gender ?? historic?.gender ?? custom?.gender ?? '남',
    relations: [...(general.relations ?? [])],
  };
}

function familyParentProfile(general: General): FamilyParentProfile {
  return {
    id: general.id,
    name: general.name,
    stats: {
      leadership: general.leadership,
      martial: general.martial,
      intelligence: general.intelligence,
      militaryStrategy: general.militaryStrategy,
      politics: general.politics,
      diplomacy: general.diplomacy,
      personnel: general.personnel,
      charisma: general.charisma,
    },
    traits: [...(general.traits ?? [])],
    tendencies: [...(general.tendencies ?? [])],
  };
}

function itemCount(state: Pick<GameState, 'ownedItems' | 'itemQuantities'>, itemId: string) {
  const explicit = state.itemQuantities?.[itemId];
  if (typeof explicit === 'number') return Math.max(0, explicit);
  return state.ownedItems.includes(itemId) ? 1 : 0;
}

function addInventoryCopy(state: Pick<GameState, 'ownedItems' | 'itemQuantities'>, itemId: string) {
  const nextCount = itemCount(state, itemId) + 1;
  return {
    ownedItems: state.ownedItems.includes(itemId) ? state.ownedItems : [...state.ownedItems, itemId],
    itemQuantities: { ...(state.itemQuantities ?? {}), [itemId]: nextCount },
  };
}

function removeInventoryCopy(state: Pick<GameState, 'ownedItems' | 'itemQuantities'>, itemId: string) {
  const nextCount = Math.max(0, itemCount(state, itemId) - 1);
  const itemQuantities = { ...(state.itemQuantities ?? {}), [itemId]: nextCount };
  return {
    ownedItems: nextCount > 0 ? state.ownedItems : state.ownedItems.filter(id => id !== itemId),
    itemQuantities,
  };
}

function removeOneEquippedCopy(generals: General[], itemId: string) {
  let removed = false;
  return generals.map(general => {
    if (removed) return general;
    const equipment = { ...general.equipment };
    const slot = EQUIPPABLE_TYPES.find(type => equipment[type] === itemId);
    if (!slot) return general;
    delete equipment[slot];
    removed = true;
    return { ...general, equipment };
  });
}

function normalizeUniqueEquipment(generals: General[], ownedItems: string[], itemQuantities: Record<string, number> = {}) {
  const claimed: Record<string, number> = {};
  return generals.map(general => {
    const equipment: Partial<Record<ItemType, string>> = {};
    EQUIPPABLE_TYPES.forEach(type => {
      const itemId = general.equipment?.[type];
      if (!itemId) return;
      const item = catalogItem(itemId);
      const fixedOwnerCopy = item?.ownerId === general.id ? 1 : 0;
      const available = Math.max(fixedOwnerCopy, itemQuantities[itemId] ?? (ownedItems.includes(itemId) ? 1 : 0));
      const used = claimed[itemId] ?? 0;
      if (available > used || fixedOwnerCopy) { equipment[type] = itemId; claimed[itemId] = used + 1; }
    });
    return { ...general, equipment };
  });
}

const UNLIMITED_FORCE_TROOPS = Number.MAX_SAFE_INTEGER;

function getForceRank(cityCount: number): { name: ForceRankName; maxTroops: number } {
  if (cityCount >= 25) return { name: '황제', maxTroops: UNLIMITED_FORCE_TROOPS };
  if (cityCount >= 12) return { name: '왕', maxTroops: UNLIMITED_FORCE_TROOPS };
  if (cityCount >= 8) return { name: '대장군', maxTroops: 80000 };
  if (cityCount >= 5) return { name: '중랑장', maxTroops: 65000 };
  if (cityCount >= 2) return { name: '주목', maxTroops: 50000 };
  return { name: '현령', maxTroops: 35000 };
}

function forceTroopLimitLabel(forceRank: { maxTroops: number }) {
  return forceRank.maxTroops === UNLIMITED_FORCE_TROOPS ? '제한 없음' : `${forceRank.maxTroops.toLocaleString()}명`;
}

function stableRoll(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) value = Math.imul(value ^ seed.charCodeAt(index), 16777619);
  return (Math.abs(value) % 100) + 1;
}

function battleOfficerOutcome(general: General, seed: string): BattleOfficerOutcome {
  const roll = stableRoll(`${seed}:${general.id}`);
  const prowess = Math.max(0, Math.min(200, general.martial + general.leadership));
  const deathCutoff = Math.max(3, Math.min(8, 8 - Math.floor((prowess - 100) / 40)));
  const captureCutoff = Math.max(45, Math.min(68, 62 - Math.floor((prowess - 120) / 6)));
  if (roll <= deathCutoff) return 'dead';
  if (roll <= captureCutoff) return 'captured';
  return 'escaped';
}

function dateLabel(state: Pick<GameState, 'year' | 'month' | 'day'>) {
  return `${state.year}년 ${state.month}월 ${state.day}일`;
}


type ConsumableEffect = { ap: number; fame?: number; label: string };
const CONSUMABLE_EFFECTS: Record<string, ConsumableEffect> = {
  herb: { ap: 3, label: '기력 회복' },
  'wound-medicine': { ap: 5, label: '상처 회복' },
  antidote: { ap: 4, label: '몸 상태 정비' },
  wine: { ap: 2, fame: 2, label: '사기 진작' },
};

const BOOK_STUDY_EFFECTS: Record<string, Partial<Record<CoreStatKey, number>>> = {
  'art-of-war': { militaryStrategy: 35 },
  'six-secret-teachings': { leadership: 35 },
  'three-strategies': { militaryStrategy: 20, politics: 20 },
  wuzi: { leadership: 20, militaryStrategy: 20 },
  'mengde-new-book': { intelligence: 40, militaryStrategy: 30 },
};

function monthlyShopKey(state: Pick<GameState, 'year' | 'month'>, cityId: string, itemId: string) {
  return `${state.year}-${state.month}:${cityId}:${itemId}`;
}

function cityShopBaseStock(city: City, item: Item, year: number, month: number) {
  const categoryBase: Record<ItemType, number> = { 무기: 4, 갑옷: 3, 장신구: 2, 말: 2, 소모품: 8, 장식품: 3, 책: 2 };
  const roll = stableRoll(`${city.id}:${item.id}:${year}:${month}:stock`);
  const tierBoost = Math.max(0, Math.floor((city.tier - 1) / 2));
  const commerceBoost = Math.max(0, Math.floor(city.commerce / 80));
  const rarityPenalty = item.type === '책' || item.type === '말' ? 1 : item.type === '장신구' || item.type === '장식품' ? 0 : 0;
  let stock = categoryBase[item.type] + tierBoost + commerceBoost + (roll % 4) - 1 - rarityPenalty;
  if ((item.type === '책' || item.type === '말') && roll < 12) stock = 0;
  if (item.unique) stock = stock > 0 ? 1 : 0;
  return Math.max(0, stock);
}

function cityShopPrice(city: City, item: Item, year: number, month: number) {
  if (item.priceCopper <= 0) return 0;
  const roll = stableRoll(`${city.id}:${item.id}:${year}:${month}:price`);
  const marketSwing = (roll - 50) / 500; // -10% ~ +10%
  const commerceDiscount = Math.min(0.08, Math.max(0, city.commerce) / 2500);
  const tierDiscount = Math.min(0.04, Math.max(0, city.tier - 1) * 0.01);
  const scarcity = cityShopBaseStock(city, item, year, month) <= 1 ? 0.06 : 0;
  const factor = Math.max(0.78, Math.min(1.22, 1 + marketSwing - commerceDiscount - tierDiscount + scarcity));
  return Math.max(10, Math.round((item.priceCopper * factor) / 10) * 10);
}

function cityShopOffer(state: Pick<GameState, 'year' | 'month' | 'shopPurchases'>, city: City | undefined, item: Item) {
  if (!city) return { priceCopper: item.priceCopper, stock: 0, baseStock: 0, purchased: 0, marketLabel: '도시 없음' };
  const key = monthlyShopKey(state, city.id, item.id);
  const baseStock = cityShopBaseStock(city, item, state.year, state.month);
  const purchased = Math.max(0, state.shopPurchases?.[key] ?? 0);
  const stock = Math.max(0, baseStock - purchased);
  const priceCopper = cityShopPrice(city, item, state.year, state.month);
  const ratio = item.priceCopper > 0 ? priceCopper / item.priceCopper : 1;
  const marketLabel = ratio <= 0.92 ? '저가' : ratio >= 1.08 ? '고가' : '보통';
  return { priceCopper, stock, baseStock, purchased, marketLabel };
}

function bookStudySummary(itemId: string) {
  const effects = BOOK_STUDY_EFFECTS[itemId] ?? {};
  return Object.entries(effects).map(([key, value]) => `${CORE_STAT_LABELS[key as CoreStatKey]} EXP +${value}`).join(' · ') || '연구 효과 없음';
}

function childSpecialties(child: FamilyChild): SpecialtyMap {
  const specialties = createDefaultSpecialties('C');
  const focus = dominantParentingFocus(child);
  const focusKeys: Record<ParentingFocus, SpecialtyKey[]> = {
    무예: ['보병', '기병', '궁병', '야전'],
    학문: ['계략', '첩보', '인재탐색', '설전'],
    통솔: ['훈련', '보급', '야전', '방어전'],
    정치: ['농업', '상업', '치안', '축성'],
    사교: ['등용', '설전', '인재탐색', '호위'],
    균형: ['보급', '훈련', '치안', '인재탐색'],
  };
  focusKeys[focus].forEach((key, index) => { specialties[key] = index < 2 ? 'B' : 'C'; });
  if (child.educationMonths >= 36) specialties[focusKeys[focus][0]] = 'A';
  return specialties;
}

function childGeneralRecord(child: FamilyChild, state: GameState, previousPlayer: General): General {
  const birthYear = childBirthYear(child);
  const age = childAgeAtDate(child, state.year, state.month, state.day);
  const minor = age < 15;
  const parentNames = [child.fatherId, child.motherId]
    .map(id => state.generals.find(general => general.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return {
    id: child.officerId ?? child.id,
    name: child.name,
    birthYear,
    deathYear: birthYear + 70,
    gender: child.gender,
    force: previousPlayer.force,
    city: previousPlayer.city,
    leadership: child.stats.leadership,
    martial: child.stats.martial,
    intelligence: child.stats.intelligence,
    militaryStrategy: child.stats.militaryStrategy,
    politics: child.stats.politics,
    diplomacy: child.stats.diplomacy,
    personnel: child.stats.personnel,
    charisma: child.stats.charisma,
    specialties: childSpecialties(child),
    traits: [...new Set([...child.traits, ...(minor ? ['유소년 후계자'] : [])])].slice(0, 10),
    tendencies: [...child.tendencies],
    relations: parentNames.map(name => `${name}(부모)`),
    loyalty: 100,
    equipment: {},
    rank: '일반',
    appointment: '없음',
  };
}

function resolvePlayerSuccessionIfDue(state: GameState): GameState {
  const player = state.generals.find(general => general.id === state.playerGeneralId);
  if (!player?.deathYear || state.year <= player.deathYear) return state;
  const successorChild = selectFamilySuccessor(state.family, player.id);
  if (!successorChild) return state;
  const date = dateLabel(state);
  const succession = markChildSuccession(state.family, successorChild.id, date);
  const updatedChild = succession.child ?? successorChild;
  const successorId = updatedChild.officerId ?? updatedChild.id;
  const existingSuccessor = state.generals.find(general => general.id === successorId);
  const successorGeneral = existingSuccessor ?? childGeneralRecord(updatedChild, state, player);
  const successorAge = childAgeAtDate(updatedChild, state.year, state.month, state.day);
  const remainingGenerals = state.generals.filter(general => general.id !== player.id && general.id !== successorId);
  const generals = [successorGeneral, ...remainingGenerals];
  const armies = state.armies
    .map(army => ({ ...army, units: army.units.filter(unit => unit.generalId !== player.id) }))
    .filter(army => army.units.length > 0);
  const officerTasks = { ...state.officerTasks };
  delete officerTasks[player.id];
  const status = state.playerStatus;
  const nextRuler = status === '군주' ? successorGeneral.name : state.ruler;
  const logLine = successorAge < 15
    ? `[가문·승계] ${player.name} 사후 ${successorGeneral.name}(${successorAge}세)이(가) 후계자가 되었다. 15세까지 섭정 기간으로 주요 명령이 제한됩니다.`
    : `[가문·승계] ${player.name} 사후 ${successorGeneral.name}이(가) 가문을 이어 플레이 장수가 되었다.`;
  return {
    ...state,
    family: succession.family,
    playerGeneralId: successorId,
    ruler: nextRuler,
    generals,
    armies,
    prisoners: state.prisoners.filter(prisoner => prisoner.generalId !== player.id),
    officerTasks,
    activeMission: undefined,
    personalGoal: undefined,
    careerHistory: [`${date} · ${player.name} 사망 · ${successorGeneral.name}에게 가문 승계`, ...(state.careerHistory ?? [])].slice(0, 40),
    log: [logLine, ...state.log].slice(0, 200),
  };
}

function resolveMinorSuccessorComingOfAge(state: GameState): GameState {
  const player = state.generals.find(general => general.id === state.playerGeneralId);
  if (!player) return state;
  const child = state.family.children.find(entry => entry.officerId === player.id && Boolean(entry.successionDate) && !entry.comingOfAgeDate);
  if (!child) return state;
  const age = childAgeAtDate(child, state.year, state.month, state.day);
  if (age < 15) return state;
  const marked = markChildComingOfAge(state.family, child.id, dateLabel(state));
  const updatedChild = marked.child ?? child;
  const localForceRank = getForceRank(state.cities.filter(city => city.owner === player.force).length).name;
  const updatedPlayer: General = {
    ...player,
    name: updatedChild.name,
    leadership: updatedChild.stats.leadership,
    martial: updatedChild.stats.martial,
    intelligence: updatedChild.stats.intelligence,
    militaryStrategy: updatedChild.stats.militaryStrategy,
    politics: updatedChild.stats.politics,
    diplomacy: updatedChild.stats.diplomacy,
    personnel: updatedChild.stats.personnel,
    charisma: updatedChild.stats.charisma,
    specialties: childSpecialties(updatedChild),
    traits: updatedChild.traits.filter(trait => trait !== '유소년 후계자'),
    tendencies: [...updatedChild.tendencies],
    rank: player.rank === '일반' ? defaultOfficerRank(updatedChild.stats.leadership, updatedChild.stats.militaryStrategy, localForceRank) : player.rank,
  };
  return {
    ...state,
    family: marked.family,
    generals: state.generals.map(general => general.id === player.id ? updatedPlayer : general),
    careerHistory: [`${dateLabel(state)} · ${updatedChild.name} 15세 성인식 · 섭정 종료`, ...(state.careerHistory ?? [])].slice(0, 40),
    log: [`[가족·성인식] ${updatedChild.name}이(가) 15세 성인식을 마쳐 섭정이 종료되고 모든 장수 명령이 해금되었습니다.`, ...state.log].slice(0, 200),
  };
}

function resolvePlayerAuthority(state: Pick<GameState, 'playerStatus'>, player: General | undefined): PlayerAuthority {
  if (state.playerStatus === '소속장수' && player?.appointment === '태수' && player.appointmentCityId) return '태수';
  return state.playerStatus;
}

function monthlyPersonalStipendCopper(state: Pick<GameState, 'playerStatus'>, player: General | undefined) {
  if (!player || state.playerStatus === '재야' || state.playerStatus === '독립부대') return 0;
  if (state.playerStatus === '군주') return 1500;
  const rankIndex = Math.max(0, OFFICER_RANKS.findIndex(entry => entry.name === player.rank));
  const appointmentBonus = player.appointment === '태수' ? 500 : player.appointment !== '없음' ? 250 : 0;
  return 400 + rankIndex * 150 + appointmentBonus;
}

type CareerRankRequirement = { rank: OfficerRank; merit: number; fame: number };
const CAREER_RANK_REQUIREMENTS: CareerRankRequirement[] = [
  { rank: '일반', merit: 0, fame: 0 },
  { rank: '부장', merit: 80, fame: 30 },
  { rank: '도위', merit: 180, fame: 60 },
  { rank: '교위', merit: 320, fame: 100 },
  { rank: '중랑장', merit: 500, fame: 160 },
  { rank: '편장군', merit: 750, fame: 230 },
  { rank: '장군', merit: 1050, fame: 320 },
  { rank: '상장군', merit: 1400, fame: 430 },
  { rank: '대장군', merit: 1800, fame: 560 },
];
function careerRankRequirement(rank: OfficerRank) { return CAREER_RANK_REQUIREMENTS.find(entry => entry.rank === rank) ?? CAREER_RANK_REQUIREMENTS[0]; }
function fameTitle(fame: number) {
  if (fame >= 900) return '영웅';
  if (fame >= 700) return '천하 명사';
  if (fame >= 450) return '명장';
  if (fame >= 250) return '지방 명사';
  if (fame >= 100) return '알려진 장수';
  return '무명';
}
function careerHistoryEntry(state: Pick<GameState, 'year' | 'month' | 'day'>, text: string) { return `${dateLabel(state)} · ${text}`; }
function migratedCareerMerit(status: PlayerStatus, player: General | undefined) {
  if (status === '군주') return 1200;
  const index = Math.max(0, OFFICER_RANKS.findIndex(entry => entry.name === player?.rank));
  return index * 140;
}
function migratedCareerFame(status: PlayerStatus) { return status === '군주' ? 450 : status === '독립부대' ? 160 : status === '재야' ? 40 : 120; }

type MissionTemplate = Omit<OfficerMission, 'id' | 'issuer' | 'cityId'>;
const FORCE_MISSION_TEMPLATES: MissionTemplate[] = [
  { category: '세력 명령', kind: '행정 지원', title: '군량 장부 정비', description: '군주의 명으로 현지 장부와 군량 조달 상황을 정리합니다.', difficulty: 58, apCost: 5, days: 2, rewardMerit: 42, rewardFame: 6, rewardCopper: 900 },
  { category: '세력 명령', kind: '치안 순찰', title: '관할 지역 순찰', description: '군주의 명으로 치안이 흔들리는 지역을 순찰하고 민심을 안정시킵니다.', difficulty: 61, apCost: 6, days: 3, rewardMerit: 48, rewardFame: 8, rewardCopper: 1100 },
  { category: '세력 명령', kind: '인재 조사', title: '지역 인재 조사', description: '세력에 도움이 될 인물을 찾아 보고서를 올립니다.', difficulty: 64, apCost: 6, days: 3, rewardMerit: 55, rewardFame: 10, rewardCopper: 1200 },
];
const CITY_MISSION_TEMPLATES: MissionTemplate[] = [
  { category: '도시 의뢰', kind: '행정 지원', title: '상인 분쟁 중재', description: '시장 상인들의 분쟁을 조정해 거래 질서를 회복합니다.', difficulty: 54, apCost: 4, days: 2, rewardMerit: 22, rewardFame: 4, rewardCopper: 700 },
  { category: '도시 의뢰', kind: '치안 순찰', title: '야간 순찰 의뢰', description: '주민들의 요청을 받아 야간 순찰을 돕습니다.', difficulty: 57, apCost: 4, days: 2, rewardMerit: 26, rewardFame: 5, rewardCopper: 800 },
  { category: '도시 의뢰', kind: '상단 호위', title: '상단 호위', description: '지역 상단이 무사히 길을 떠날 수 있도록 호위합니다.', difficulty: 60, apCost: 5, days: 3, rewardMerit: 30, rewardFame: 7, rewardCopper: 1300 },
];
const PUBLIC_MISSION_TEMPLATES: MissionTemplate[] = [
  { category: '공적 임무', kind: '도적 토벌', title: '도적 두목 토벌', description: '인근을 위협하는 도적 무리를 추격해 두목을 제압합니다.', difficulty: 69, apCost: 7, days: 4, rewardMerit: 70, rewardFame: 18, rewardCopper: 1800 },
  { category: '공적 임무', kind: '인재 조사', title: '은거 명사 탐문', description: '소문난 은거 인물의 행방을 조사해 이름을 알립니다.', difficulty: 67, apCost: 6, days: 3, rewardMerit: 55, rewardFame: 20, rewardCopper: 1000 },
  { category: '공적 임무', kind: '상단 호위', title: '위험 지역 호송', description: '위험한 길을 지나는 민간 행렬을 호송해 평판을 쌓습니다.', difficulty: 66, apCost: 6, days: 4, rewardMerit: 50, rewardFame: 16, rewardCopper: 1600 },
];
function missionAbilityScore(general: General, kind: MissionKind) {
  if (kind === '행정 지원') return (effectiveStat(general, 'politics') + effectiveStat(general, 'personnel')) / 2;
  if (kind === '치안 순찰') return effectiveStat(general, 'leadership') * 0.45 + effectiveStat(general, 'martial') * 0.35 + effectiveStat(general, 'charisma') * 0.2;
  if (kind === '도적 토벌') return effectiveStat(general, 'martial') * 0.5 + effectiveStat(general, 'leadership') * 0.35 + effectiveStat(general, 'intelligence') * 0.15;
  if (kind === '인재 조사') return effectiveStat(general, 'intelligence') * 0.4 + effectiveStat(general, 'personnel') * 0.35 + effectiveStat(general, 'charisma') * 0.25;
  return effectiveStat(general, 'leadership') * 0.35 + effectiveStat(general, 'martial') * 0.3 + effectiveStat(general, 'diplomacy') * 0.35;
}
function missionSuccessChance(mission: OfficerMission, general: General, fame: number) { return Math.max(25, Math.min(95, Math.round(55 + (missionAbilityScore(general, mission.kind) - mission.difficulty) * 0.9 + Math.min(8, fame / 100)))); }
function buildMissionOffers(state: GameState, general: General, city: City, authority: PlayerAuthority) {
  const key = `${state.year}-${state.month}-${city.id}-${general.id}`;
  const pick = (templates: MissionTemplate[], salt: string) => templates[(stableRoll(`${key}-${salt}`) - 1) % templates.length];
  const templates = [pick(CITY_MISSION_TEMPLATES, 'city'), pick(PUBLIC_MISSION_TEMPLATES, 'public')];
  if (state.playerStatus === '소속장수') templates.unshift(pick(FORCE_MISSION_TEMPLATES, 'force'));
  return templates.map((template, index): OfficerMission => ({ ...template, id: `${key}-${template.category}-${template.kind}-${index}`, issuer: template.category === '세력 명령' ? `${state.ruler || general.force}${authority === '태수' ? ' · 태수 직무' : ''}` : template.category === '도시 의뢰' ? `${city.name} 관청` : '지역 민중', cityId: city.id, difficulty: template.difficulty + (city.tier >= 5 ? 3 : city.tier >= 3 ? 1 : 0) }));
}
type PersonalGoalDefinition = { id: PersonalGoalId; title: string; description: string; target: number; unit: string; rewardMerit: number; rewardFame: number };
const PERSONAL_GOALS: PersonalGoalDefinition[] = [
  { id: 'merit', title: '공적의 길', description: '현재보다 공적을 200 더 쌓습니다.', target: 200, unit: '공적', rewardMerit: 60, rewardFame: 10 },
  { id: 'fame', title: '명성 떨치기', description: '현재보다 명성을 120 더 높입니다.', target: 120, unit: '명성', rewardMerit: 40, rewardFame: 35 },
  { id: 'wealth', title: '재산 모으기', description: '개인 자금을 현재보다 50은 더 모읍니다.', target: 5000, unit: '동', rewardMerit: 35, rewardFame: 12 },
  { id: 'caravan', title: '교역로 개척', description: '상단을 3회 더 완주합니다.', target: 3, unit: '회', rewardMerit: 50, rewardFame: 20 },
];
function personalGoalMetric(state: Pick<GameState, 'playerMerit' | 'playerFame' | 'personalTreasury' | 'tradeJourneys'>, id: PersonalGoalId) { if (id === 'merit') return state.playerMerit; if (id === 'fame') return state.playerFame; if (id === 'wealth') return moneyToCopper(state.personalTreasury); return state.tradeJourneys?.length ?? 0; }

function advanceGameClock(state: GameState, days: number): GameState {
  let next: GameState = { ...state, cities: state.cities.map(city => ({ ...city })), log: [...state.log] };
  let remaining = Math.max(0, Math.floor(days));
  while (remaining > 0) {
    const daysToMonthEnd = DAYS_PER_MONTH - next.day;
    if (remaining <= daysToMonthEnd) {
      next.day += remaining;
      remaining = 0;
      break;
    }
    remaining -= daysToMonthEnd + 1;
    const income = next.cities.filter(city => city.owner === next.force).reduce((sum, city) => { const facilities = cityFacilityLevels(city); const identity = cityIdentity(city); const commerceIncome = Math.round(city.commerce * 38 * (1 + facilities.market * 0.04 + identity.commerceIncome)); const agricultureIncome = Math.round(city.agriculture * 22 * (1 + facilities.farm * 0.03 + identity.agricultureIncome)); return sum + commerceIncome + agricultureIncome; }, 0);
    const playerAtMonthStart = next.generals.find(general => general.id === next.playerGeneralId);
    const personalStipend = monthlyPersonalStipendCopper(next, playerAtMonthStart);
    const nextMonth = next.month === 12 ? 1 : next.month + 1;
    const nextYear = next.month === 12 ? next.year + 1 : next.year;
    const crossedYear = nextYear > next.year;
    const existingIds = new Set(next.generals.map(general => general.id));
    const forceCityCounts = next.cities.reduce<Record<string, number>>((counts, city) => ({ ...counts, [city.owner]: (counts[city.owner] ?? 0) + 1 }), {});
    const debuting = crossedYear
      ? buildDebutingGenerals(nextYear).filter(general => !existingIds.has(general.id)).map(general => {
          const localForceRank = getForceRank(forceCityCounts[general.force] ?? 1);
          return { ...general, equipment: { ...general.equipment }, rank: defaultOfficerRank(general.leadership, general.militaryStrategy, localForceRank.name), appointment: '없음' as OfficerAppointment };
        })
      : [];
    const generals = debuting.length ? seedFamousEquipment([...next.generals, ...debuting]) : next.generals;
    const debutLog = debuting.length ? `[인재 등장] ${nextYear}년 · ${debuting.length}명 등장 · ${debuting.slice(0, 12).map(general => general.name).join(', ')}${debuting.length > 12 ? ` 외 ${debuting.length - 12}명` : ''}.` : '';
    const monthLog = next.playerStatus === '군주'
      ? `[월초] ${nextYear}년 ${nextMonth}월 1일 · 행동력 ${MONTHLY_ACTION_POINTS} 회복 · 세력 세입 ${formatMoney(copperToMoney(income))} · 개인 봉록 ${formatMoney(copperToMoney(personalStipend))}.`
      : personalStipend > 0
        ? `[월초] ${nextYear}년 ${nextMonth}월 1일 · 행동력 ${MONTHLY_ACTION_POINTS} 회복 · 개인 봉록 ${formatMoney(copperToMoney(personalStipend))}.`
        : `[월초] ${nextYear}년 ${nextMonth}월 1일 · 행동력 ${MONTHLY_ACTION_POINTS} 회복 · 정기 봉록 없음.`;
    next = {
      ...next,
      year: nextYear,
      month: nextMonth,
      day: 1,
      actionPoints: MONTHLY_ACTION_POINTS,
      treasury: copperToMoney(moneyToCopper(next.treasury) + income),
      personalTreasury: copperToMoney(moneyToCopper(next.personalTreasury) + personalStipend),
      tradeGoods: { ...(next.tradeGoods ?? {}) },
      cities: next.cities.map(city => { if (city.owner !== next.force) return city; const farmLevel = cityFacilityLevels(city).farm; const identity = cityIdentity(city); const baseGrowth = Math.max(120, Math.floor(city.agriculture * 9)); return { ...city, population: city.population + Math.round(baseGrowth * (1 + farmLevel * 0.05 + identity.populationGrowth)) }; }),
      generals,
      log: [...(debutLog ? [debutLog] : []), monthLog, ...next.log].slice(0, 200),
    };
  }
  const birthResolution = resolveBirthIfDue({
    family: next.family,
    year: next.year,
    month: next.month,
    day: next.day,
    parentsById: Object.fromEntries(next.generals.map(general => [general.id, familyParentProfile(general)])),
  });
  next = {
    ...next,
    family: birthResolution.family,
    log: birthResolution.child && birthResolution.chronicleText
      ? [`[가족·출산] ${birthResolution.chronicleText} · 부모의 능력치를 바탕으로 기초 재능이 결정되었습니다.`, ...next.log].slice(0, 200)
      : next.log,
  };
  const growthResolution = resolveChildDevelopmentMilestones({
    family: next.family,
    year: next.year,
    month: next.month,
    day: next.day,
  });
  next = {
    ...next,
    family: growthResolution.family,
    log: growthResolution.eventTexts.length
      ? [...growthResolution.eventTexts, ...next.log].slice(0, 200)
      : next.log,
  };
  next = resolveMinorSuccessorComingOfAge(next);
  return resolvePlayerSuccessionIfDue(next);
}

function emptyCustomItem(): Item { return { id: '', name: '', type: '무기', bonus: '', bonuses: { martial: 1 }, priceCopper: 1000, unique: false, shop: true, custom: true }; }

function emptyCustomOfficer(): CustomOfficer {
  const now = Date.now();
  return {
    id: '',
    name: '',
    courtesyName: '',
    gender: '남',
    birthYear: 180,
    force: '재야',
    city: 'pingyuan',
    leadership: 70,
    martial: 70,
    intelligence: 70,
    militaryStrategy: 70,
    politics: 70,
    diplomacy: 70,
    personnel: 70,
    charisma: 70,
    specialties: createDefaultSpecialties('C'),
    traits: [],
    tendencies: [],
    relations: [],
    createdAt: now,
    updatedAt: now,
  };
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('title');
  const [selectedEraId, setSelectedEraId] = useState(SCENARIOS[0].id);
  const [newGameOfficerId, setNewGameOfficerId] = useState('');
  const [selectedStartCityId, setSelectedStartCityId] = useState('');
  const [selectedNewForceColor, setSelectedNewForceColor] = useState('');
  const [selectedStartingCustomIds, setSelectedStartingCustomIds] = useState<string[]>([]);
  const [officerQuery, setOfficerQuery] = useState('');
  const [officerDetailModal, setOfficerDetailModal] = useState<{ kind: 'trait' | 'tendency'; option: typeof TRAIT_OPTIONS[number] } | null>(null);
  const [cityListQuery, setCityListQuery] = useState('');
  const [cityRegionFilter, setCityRegionFilter] = useState('전체 지역');
  const [cityPreviewCityId, setCityPreviewCityId] = useState('');
  const [customOfficers, setCustomOfficers] = useState<CustomOfficer[]>(() => {
    const raw = localStorage.getItem(CUSTOM_OFFICER_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as CustomOfficer[];
      return parsed.map(officer => ensureOfficerProfile({
        ...officer,
        traits: (officer.traits ?? []).filter(trait => trait !== '신무장').slice(0, 10),
        tendencies: (officer.tendencies ?? []).slice(0, 5),
        relations: officer.relations ?? [],
      }) as CustomOfficer);
    } catch {
      return [];
    }
  });
  const [customItems, setCustomItems] = useState<Item[]>(() => { const raw = localStorage.getItem(CUSTOM_ITEM_KEY); if (!raw) return []; try { return (JSON.parse(raw) as Item[]).map(item => ({ ...item, custom: true })); } catch { return []; } });
  const [editingCustomItemId, setEditingCustomItemId] = useState<string | null>(null);
  const [customItemDraft, setCustomItemDraft] = useState<Item>(() => emptyCustomItem());
  const [customItemStat, setCustomItemStat] = useState<CoreStatKey>('martial');
  const [customItemStatValue, setCustomItemStatValue] = useState(1);
  const [customItemError, setCustomItemError] = useState('');
  const itemCatalog = [...ITEMS, ...customItems];
  RUNTIME_CUSTOM_ITEMS = customItems;
  const [checkedCustomIds, setCheckedCustomIds] = useState<string[]>([]);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState<CustomOfficer>(() => emptyCustomOfficer());
  const [customError, setCustomError] = useState('');
  const [tab, setTab] = useState<Tab>('천하');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (screen !== 'game' || tab === '천하') return;
    const handleModalKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTab('천하');
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [screen, tab]);
  const [officerBrowserFilter, setOfficerBrowserFilter] = useState<'전체' | '내 세력' | '타 세력' | '재야' | '포로'>('전체');
  const [officerBrowserQuery, setOfficerBrowserQuery] = useState('');
  const [game, setGame] = useState<GameState>(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialState();
    try {
      const parsed = JSON.parse(raw) as GameState;
      const originalOwnedItems = parsed.ownedItems ?? [];
      const originalItemQuantities = parsed.itemQuantities ?? Object.fromEntries(originalOwnedItems.map(id => [id, 1]));
      const scenarioCities = buildScenarioCities(parsed.year ?? 190);
      const savedCitiesById = new Map((parsed.cities ?? []).map(city => [city.id, city]));
      const cities = scenarioCities.map(city => {
        const saved = savedCitiesById.get(city.id);
        return saved ? { ...city, ...saved, name: city.name, region: city.region, neighbors: [...city.neighbors], training: typeof saved.training === 'number' ? saved.training : clampStat(35 + Math.floor(saved.security * 0.35)) } : { ...city, training: clampStat(35 + Math.floor(city.security * 0.35)) };
      });
      const activeCityIds = new Set(cities.map(city => city.id));
      const forceCityCounts = cities.reduce<Record<string, number>>((counts, city) => ({ ...counts, [city.owner]: (counts[city.owner] ?? 0) + 1 }), {});
      const migratedExisting = (parsed.generals ?? []).map(general => {
        const profile = ensureOfficerProfile(general) as General;
        const localForceRank = getForceRank(forceCityCounts[profile.force] ?? 1);
        const rank = normalizeOfficerRank(profile.rank, localForceRank.name, profile.leadership, profile.militaryStrategy);
        const appointment = normalizeAppointment(profile.appointment, localForceRank.name);
        const historic = HISTORIC_OFFICERS.find(officer => officer.id === profile.id);
        const normalizedCity = normalizeScenarioCityId(profile.city);
        const normalizedAppointmentCity = profile.appointmentCityId ? normalizeScenarioCityId(profile.appointmentCityId) : undefined;
        return { ...profile, city: activeCityIds.has(normalizedCity) ? normalizedCity : cities[0]?.id ?? 'luoyang', name: historic?.name ?? profile.name, birthYear: historic ? historic.birthYear : profile.birthYear ?? null, birthYearEstimated: historic ? historic.birthYearEstimated : profile.birthYearEstimated, gender: historic?.gender ?? profile.gender, deathYear: historic?.deathYear ?? profile.deathYear, rank, appointment, appointmentCityId: appointment === '태수' && normalizedAppointmentCity && activeCityIds.has(normalizedAppointmentCity) ? normalizedAppointmentCity : undefined };
      });
      const existingIds = new Set(migratedExisting.map(general => general.id));
      const supplementalGenerals = buildScenarioGenerals(parsed.year ?? 190)
        .filter(general => !existingIds.has(general.id))
        .map(general => {
          const localForceRank = getForceRank(forceCityCounts[general.force] ?? 1);
          return { ...general, equipment: { ...general.equipment }, rank: defaultOfficerRank(general.leadership, general.militaryStrategy, localForceRank.name), appointment: '없음' as OfficerAppointment };
        });
      const migratedGenerals = seedFamousEquipment([...migratedExisting, ...supplementalGenerals]);
      const famousIds = new Set(ITEMS.filter(item => item.ownerId).map(item => item.id));
      const force = parsed.force ?? '유비군';
      const forceColors = buildForceColorMap(cities, parsed.forceColors ?? {});
      const forceFamous = famousItemsForForce(migratedGenerals, force);
      const ownedItems = Array.from(new Set([...originalOwnedItems.filter(id => !famousIds.has(id)), ...forceFamous]));
      const itemQuantities = { ...originalItemQuantities };
      famousIds.forEach(id => { itemQuantities[id] = forceFamous.includes(id) ? 1 : 0; });
      const normalizedGenerals = normalizeUniqueEquipment(migratedGenerals, ownedItems, itemQuantities);
      const fallbackPlayer = normalizedGenerals.find(general => general.id === parsed.playerGeneralId) ?? normalizedGenerals.find(general => general.name === parsed.ruler) ?? normalizedGenerals.find(general => general.force === force) ?? normalizedGenerals[0];
      const migratedPlayerStatus: PlayerStatus = parsed.playerStatus ?? (fallbackPlayer?.force === '재야' ? '재야' : fallbackPlayer?.name === parsed.ruler ? '군주' : '소속장수');
      const migratedMerit = typeof parsed.playerMerit === 'number' ? parsed.playerMerit : migratedCareerMerit(migratedPlayerStatus, fallbackPlayer);
      const migratedFame = typeof parsed.playerFame === 'number' ? parsed.playerFame : migratedCareerFame(migratedPlayerStatus);
      return {
        ...parsed,
        day: parsed.day ?? 1,
        actionPoints: typeof parsed.actionPoints === 'number' && parsed.actionPoints > 3 ? Math.min(MONTHLY_ACTION_POINTS, parsed.actionPoints) : MONTHLY_ACTION_POINTS,
        ownedItems,
        itemQuantities,
        shopPurchases: parsed.shopPurchases ?? {},
        bookStudyXp: parsed.bookStudyXp ?? {},
        lastConsumableUseDate: parsed.lastConsumableUseDate,
        tradeGoods: parsed.tradeGoods ?? {},
        tradeJourneys: parsed.tradeJourneys ?? [],
        playerGeneralId: fallbackPlayer?.id ?? parsed.playerGeneralId ?? '',
        playerStatus: migratedPlayerStatus,
        playerMerit: migratedMerit,
        playerFame: migratedFame,
        family: normalizeFamilyState(parsed.family),
        careerHistory: parsed.careerHistory ?? [],
        activeMission: parsed.activeMission,
        missionHistory: parsed.missionHistory ?? [],
        personalGoal: parsed.personalGoal,
        claimedPersonalGoals: parsed.claimedPersonalGoals ?? [],
        personalTreasury: parsed.personalTreasury ?? { gold: 5, silver: 0, copper: 0 },
        cities,
        forceColors,
        generals: normalizedGenerals,
        discoveredOfficerIds: parsed.discoveredOfficerIds ?? [],
        freeOfficerRelations: parsed.freeOfficerRelations ?? {},
        officerBonds: parsed.officerBonds ?? {},
        armies: (parsed.armies ?? []).map(army => ({ ...army, originCityId: normalizeScenarioCityId(army.originCityId), targetCityId: army.targetCityId ? normalizeScenarioCityId(army.targetCityId) : undefined })).filter(army => activeCityIds.has(army.originCityId) && (!army.targetCityId || activeCityIds.has(army.targetCityId))),
        prisoners: (parsed.prisoners ?? []).map(prisoner => ({ ...prisoner, capturedAtCityId: normalizeScenarioCityId(prisoner.capturedAtCityId) })),
        lastCouncilKey: parsed.lastCouncilKey ?? councilKey(parsed.year ?? 190, parsed.month ?? 1, parsed.day ?? 1),
        officerTasks: parsed.officerTasks ?? {},
      };
    } catch {
      return initialState();
    }
  });
  const [selectedCityId, setSelectedCityId] = useState('pingyuan');
  const [selectedGeneralId, setSelectedGeneralId] = useState('liubei');
  const [notice, setNotice] = useState('');
  const [editorName, setEditorName] = useState('');
  const [editorError, setEditorError] = useState('');
  const [officerInfoTab, setOfficerInfoTab] = useState<'기본능력' | '전문능력' | '특성·관계' | '장비'>('기본능력');
  const [profilePicker, setProfilePicker] = useState<'traits' | 'tendencies' | null>(null);
  const [profilePickerQuery, setProfilePickerQuery] = useState('');
  const [gameProfilePicker, setGameProfilePicker] = useState<'traits' | 'tendencies' | null>(null);
  const [gameProfilePickerQuery, setGameProfilePickerQuery] = useState('');
  const [talentGiftSelections, setTalentGiftSelections] = useState<Record<string, string>>({});
  const [militaryView, setMilitaryView] = useState<'부대 편성' | '도시 선택' | '출정'>('부대 편성');
  const [selectedArmyId, setSelectedArmyId] = useState('');
  const [formationTroops, setFormationTroops] = useState<Record<string, number>>({});
  const [formationTroopTypes, setFormationTroopTypes] = useState<Record<string, TroopType>>({});
  const [battlePlan, setBattlePlan] = useState<'clash' | 'duel'>('clash');
  const [battleReport, setBattleReport] = useState<BattleReport | null>(null);
  const [personnelRankDraft, setPersonnelRankDraft] = useState<OfficerRank>('일반');
  const [personnelAppointmentDraft, setPersonnelAppointmentDraft] = useState<OfficerAppointment>('없음');
  const [personnelCityDraft, setPersonnelCityDraft] = useState('');
  const [councilDraft, setCouncilDraft] = useState<Record<string, OfficerTask>>({});
  const [councilDraftKey, setCouncilDraftKey] = useState('');
  const [officerGiftItemId, setOfficerGiftItemId] = useState('');
  const [officerTrainingStat, setOfficerTrainingStat] = useState<CoreStatKey>('leadership');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [shopSection, setShopSection] = useState<ShopSection>('교역');
  const [shopItemFilter, setShopItemFilter] = useState<'전체' | ItemType>('전체');
  const [selectedShopItemId, setSelectedShopItemId] = useState('');
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeDestinationId, setTradeDestinationId] = useState('');
  const [tradeGoodSelection, setTradeGoodSelection] = useState('');
  const [caravanAmount, setCaravanAmount] = useState(1);
  const [tradeEscortId, setTradeEscortId] = useState('');
  const [equipmentGiftOpen, setEquipmentGiftOpen] = useState(false);
  const [equipmentGiftTargetId, setEquipmentGiftTargetId] = useState('');
  const [officerEquipmentSlot, setOfficerEquipmentSlot] = useState<ItemType | null>(null);

  useEffect(() => {
    const selectedExists = game.cities.some(city => city.id === selectedCityId);
    if (!selectedExists) {
      const player = game.generals.find(general => general.id === game.playerGeneralId);
      setSelectedCityId(player?.city ?? game.cities[0]?.id ?? '');
    }
  }, [game.cities, game.generals, game.playerGeneralId, selectedCityId]);

  useEffect(() => {
    const player = game.generals.find(general => general.id === game.playerGeneralId);
    const controllable = game.playerStatus === '군주' || game.playerStatus === '독립부대'
      ? game.generals.filter(general => general.force === (player?.force ?? game.force))
      : player ? [player] : [];
    const controlledGeneralRequired = tab === '인사' || tab === '무장' || tab === '장비';
    if (controlledGeneralRequired && controllable.length > 0 && !controllable.some(general => general.id === selectedGeneralId)) {
      setSelectedGeneralId(controllable[0].id);
      return;
    }
    if (!game.generals.some(general => general.id === selectedGeneralId)) {
      setSelectedGeneralId((controlledGeneralRequired ? controllable[0] : game.generals[0])?.id ?? '');
    }
  }, [game.force, game.generals, game.playerGeneralId, game.playerStatus, selectedGeneralId, tab]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_OFFICER_KEY, JSON.stringify(customOfficers));
  }, [customOfficers]);

  useEffect(() => { localStorage.setItem(CUSTOM_ITEM_KEY, JSON.stringify(customItems)); }, [customItems]);

  useEffect(() => {
    if (itemCount(game, selectedInventoryItemId) <= 0) {
      setSelectedInventoryItemId(itemCatalog.find(item => itemCount(game, item.id) > 0)?.id ?? '');
      setEquipmentGiftOpen(false);
      setEquipmentGiftTargetId('');
    }
  }, [game.ownedItems, game.itemQuantities, selectedInventoryItemId, customItems]);

  useEffect(() => {
    setSelectedStartCityId('');
    setSelectedNewForceColor('');
    setSelectedStartingCustomIds(current => current.filter(id => id !== newGameOfficerId));
  }, [newGameOfficerId, selectedEraId]);

  const selectedCity =
    game.cities.find(city => city.id === selectedCityId) ?? game.cities[0];
  const selectedGeneral =
    game.generals.find(general => general.id === selectedGeneralId) ??
    game.generals[0];
  const playerGeneral = game.generals.find(general => general.id === game.playerGeneralId) ?? game.generals.find(general => general.name === game.ruler) ?? game.generals[0];
  const playerFamilyChild = playerGeneral ? game.family.children.find(child => child.officerId === playerGeneral.id && Boolean(child.successionDate)) : undefined;
  const playerFamilyChildAge = playerFamilyChild ? childAgeAtDate(playerFamilyChild, game.year, game.month, game.day) : null;
  const isMinorSuccessor = Boolean(playerFamilyChild && playerFamilyChildAge != null && playerFamilyChildAge < 15);
  const currentPlayerChildren = playerGeneral ? game.family.children.filter(child => child.fatherId === playerGeneral.id || child.motherId === playerGeneral.id) : [];
  const playerAuthority = resolvePlayerAuthority(game, playerGeneral);
  const affiliatedForce = playerGeneral?.force ?? game.force;
  const playerCities = game.cities.filter(city => city.owner === affiliatedForce);
  const affiliatedGenerals = game.generals.filter(general => general.force === affiliatedForce);
  const tradeCity = playerGeneral ? game.cities.find(city => city.id === playerGeneral.city) : undefined;
  const forceRank = getForceRank(playerCities.length);
  const canManageForce = playerAuthority === '군주' && !isMinorSuccessor;
  const governedCityId = playerAuthority === '태수' ? playerGeneral?.appointmentCityId : undefined;
  const managedCities = canManageForce ? playerCities : governedCityId ? playerCities.filter(city => city.id === governedCityId) : [];
  const canManageSelectedCity = Boolean(selectedCity && managedCities.some(city => city.id === selectedCity.id));
  const playerGenerals = canManageForce
    ? affiliatedGenerals
    : playerAuthority === '독립부대'
      ? affiliatedGenerals
      : playerAuthority === '태수'
        ? affiliatedGenerals.filter(general => general.id === playerGeneral?.id || general.city === governedCityId)
        : playerGeneral ? [playerGeneral] : [];
  const managementTroopCap = canManageForce ? forceRank.maxTroops : playerGeneral ? Math.min(forceRank.maxTroops, officerCommandCap(playerGeneral.rank, forceRank.maxTroops, effectiveStat(playerGeneral, 'leadership'), effectiveStat(playerGeneral, 'militaryStrategy'), playerGeneral.appointment, false)) : 0;
  const caravanDestinations = tradeCity ? game.cities.filter(city => city.id !== tradeCity.id && Number.isFinite(travelDaysBetween(game.cities, tradeCity.id, city.id))) : [];
  const caravanDestination = caravanDestinations.find(city => city.id === tradeDestinationId) ?? caravanDestinations[0];
  const caravanGoodName = tradeGoodSelection && tradeGoodCount(game, tradeGoodSelection) > 0 ? tradeGoodSelection : TRADE_GOODS.find(good => tradeGoodCount(game, good.name) > 0)?.name ?? TRADE_GOODS[0].name;
  const caravanEscortCandidates = tradeCity && playerGeneral ? playerGenerals.filter(general => general.id !== playerGeneral.id && general.city === tradeCity.id) : [];
  const caravanEscort = caravanEscortCandidates.find(general => general.id === tradeEscortId);
  const caravanDays = tradeCity && caravanDestination ? travelDaysBetween(game.cities, tradeCity.id, caravanDestination.id) : Infinity;
  const caravanRisk = playerGeneral && caravanDestination && Number.isFinite(caravanDays) ? caravanRiskPercent(caravanDays, playerGeneral, caravanEscort, game.playerStatus, caravanDestination.owner) : 0;
  const caravanExpectedSellPrice = caravanDestination ? cityTradePrice(caravanDestination, caravanGoodName, 'sell') : 0;
  const caravanOriginBuyPrice = tradeCity ? cityTradePrice(tradeCity, caravanGoodName, 'buy') : 0;
  const caravanExpectedMargin = caravanExpectedSellPrice - caravanOriginBuyPrice;
  const activeForceColorEntries = Object.entries(game.forceColors).filter(([force]) => game.cities.some(city => city.owner === force)).sort(([a], [b]) => a === affiliatedForce ? -1 : b === affiliatedForce ? 1 : a.localeCompare(b, 'ko'));
  const personnelGeneral = playerGenerals.find(general => general.id === selectedGeneralId) ?? playerGenerals[0] ?? playerGeneral;
  const officerSelectedGeneral = playerGenerals.find(general => general.id === selectedGeneralId) ?? playerGenerals[0] ?? playerGeneral;
  const ownedEquipment = itemCatalog.filter(item => itemCount(game, item.id) > 0);
  const selectedInventoryItem = ownedEquipment.find(item => item.id === selectedInventoryItemId) ?? ownedEquipment[0];
  const selectedInventoryWearers = selectedInventoryItem ? game.generals.filter(general => Object.values(general.equipment).includes(selectedInventoryItem.id)) : [];
  const selectedInventoryWearer = selectedInventoryWearers[0];
  const activeShopTypes: ItemType[] = shopSection === '장비'
    ? SHOP_SECTION_TYPES.장비
    : shopSection === '장신구'
      ? SHOP_SECTION_TYPES.장신구
      : shopSection === '아이템'
        ? SHOP_SECTION_TYPES.아이템
        : [];
  const shopItems = itemCatalog.filter(item => item.shop !== false && !item.ownerId && activeShopTypes.includes(item.type) && (shopItemFilter === '전체' || item.type === shopItemFilter));
  const selectedShopItem = shopItems.find(item => item.id === selectedShopItemId) ?? shopItems[0];
  const selectedShopItemCount = selectedShopItem ? itemCount(game, selectedShopItem.id) : 0;
  const selectedShopWearers = selectedShopItem ? game.generals.filter(general => Object.values(general.equipment).includes(selectedShopItem.id)) : [];
  const selectedShopOffer = selectedShopItem ? cityShopOffer(game, tradeCity, selectedShopItem) : undefined;
  const selectedBookStudyXp = selectedInventoryItem && selectedInventoryItem.type === '책' && officerSelectedGeneral
    ? (game.bookStudyXp?.[officerSelectedGeneral.id] ?? {})
    : {};
  const consumableUsedToday = game.lastConsumableUseDate === dateLabel(game);
  const shopFilters: Array<'전체' | ItemType> = shopSection === '장비'
    ? ['전체', '무기', '갑옷', '말']
    : shopSection === '아이템'
      ? ['전체', '소모품', '책']
      : shopSection === '장신구'
        ? ['전체', '장신구', '장식품']
        : [];

  const equipmentGiftTargets = game.generals.filter(general => general.city === playerGeneral?.city && general.id !== playerGeneral?.id);
  const personnelFallbackCityId = managedCities[0]?.id ?? tradeCity?.id ?? '';
  const allowedOfficerRanks = availableOfficerRanks(forceRank.name);
  const allowedAppointments = availableAppointments(forceRank.name);
  const currentRankIndex = Math.max(0, OFFICER_RANKS.findIndex(entry => entry.name === playerGeneral?.rank));
  const nextCareerRank = allowedOfficerRanks.find(rank => OFFICER_RANKS.findIndex(entry => entry.name === rank.name) > currentRankIndex);
  const nextCareerRequirement = nextCareerRank ? careerRankRequirement(nextCareerRank.name) : undefined;
  const currentFameTitle = fameTitle(game.playerFame);
  const currentCityJoinForce = tradeCity && tradeCity.owner !== '무주' && tradeCity.owner !== '재야' ? tradeCity.owner : '';
  const canJoinCurrentForce = Boolean(currentCityJoinForce && currentCityJoinForce !== affiliatedForce);
  const missionOffers = playerGeneral && tradeCity ? buildMissionOffers(game, playerGeneral, tradeCity, playerAuthority) : [];
  const completedMissionIds = new Set((game.missionHistory ?? []).map(record => record.missionId));
  const activeGoalDefinition = game.personalGoal ? PERSONAL_GOALS.find(goal => goal.id === game.personalGoal?.id) : undefined;
  const activeGoalProgress = game.personalGoal && activeGoalDefinition ? Math.max(0, personalGoalMetric(game, game.personalGoal.id) - game.personalGoal.startValue) : 0;
  const formationGenerals = canManageSelectedCity ? affiliatedGenerals.filter(general => general.city === selectedCityId) : [];
  const formationTotal = Object.values(formationTroops).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
  const reservedGeneralIds = new Set(game.armies.flatMap(army => army.units.map(unit => unit.generalId)));
  const manageableArmies = game.armies.filter(army => managedCities.some(city => city.id === army.originCityId));
  const selectedArmy = manageableArmies.find(army => army.id === selectedArmyId) ?? manageableArmies[0];
  const canMoveSelectedGeneral = Boolean(selectedGeneral && (selectedGeneral.id === playerGeneral?.id || (playerAuthority === '독립부대' && selectedGeneral.force === affiliatedForce) || (canManageForce && selectedGeneral.force === affiliatedForce)));
  const pendingPrisoner = game.prisoners.find(prisoner => game.generals.some(general => general.id === prisoner.generalId));
  const pendingPrisonerGeneral = pendingPrisoner ? game.generals.find(general => general.id === pendingPrisoner.generalId) : undefined;
  const prisonerIds = new Set(game.prisoners.map(prisoner => prisoner.generalId));
  const familyOfficers = game.generals.map(general => familyOfficerProfile(general, customOfficers));
  const playerFamilyOfficer = playerGeneral ? familyOfficerProfile(playerGeneral, customOfficers) : undefined;
  const spouse = playerFamilyOfficer ? spouseOf(game.family, familyOfficers, playerFamilyOfficer.id) : undefined;
  const marriageCandidates = playerFamilyOfficer
    ? buildMarriageCandidates({
        player: playerFamilyOfficer,
        officers: familyOfficers,
        year: game.year,
        family: game.family,
        officerBonds: game.officerBonds,
        freeOfficerRelations: game.freeOfficerRelations,
      }).filter(candidate => !prisonerIds.has(candidate.officer.id))
    : [];

  const officerBrowserList = game.generals.filter(general => {
    const matchesFilter = officerBrowserFilter === '전체'
      || (officerBrowserFilter === '내 세력' && (game.playerStatus === '재야' ? general.id === game.playerGeneralId : general.force === game.force))
      || (officerBrowserFilter === '타 세력' && general.force !== game.force && general.force !== '재야' && !prisonerIds.has(general.id))
      || (officerBrowserFilter === '재야' && general.force === '재야')
      || (officerBrowserFilter === '포로' && prisonerIds.has(general.id));
    const query = officerBrowserQuery.trim().toLowerCase();
    const cityName = game.cities.find(city => city.id === general.city)?.name ?? '';
    return matchesFilter && (!query || [general.name, general.force, cityName].some(value => value.toLowerCase().includes(query)));
  }).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const browserSelectedGeneral = officerBrowserList.find(general => general.id === selectedGeneralId) ?? officerBrowserList[0];
  const currentCouncilKey = councilKey(game.year, game.month, game.day);
  const councilDue = screen === 'game' && canManageForce && !battleReport && !pendingPrisoner && !equipmentGiftOpen && !gameProfilePicker && game.lastCouncilKey !== currentCouncilKey;
  const selectedGeneralCurrentCity = selectedGeneral ? game.cities.find(city => city.id === selectedGeneral.city) : undefined;
  const travelDaysPreview = selectedGeneralCurrentCity && selectedCity ? travelDaysBetween(game.cities, selectedGeneralCurrentCity.id, selectedCity.id) : 0;
  const selectedEra = SCENARIOS.find(era => era.id === selectedEraId) ?? SCENARIOS[0];
  const availableHistoricOfficers = HISTORIC_OFFICERS.filter(officer => {
    if (!isPlayableHistoricOfficer(officer.id)) return false;
    if (selectedEra.year < officer.activeFrom || selectedEra.year > officer.activeTo) return false;
    const query = officerQuery.trim().toLowerCase();
    if (!query) return true;
    const placement = getOfficerPlacement(officer.id, selectedEra.year);
    return [officer.name, officer.courtesyName, placement.force].some(value => value.toLowerCase().includes(query));
  });
  const selectedNewHistoricOfficer = HISTORIC_OFFICERS.find(officer => officer.id === newGameOfficerId && isPlayableHistoricOfficer(officer.id));
  const selectedNewCustomOfficer = customOfficers.find(officer => officer.id === newGameOfficerId);
  const openOfficerDetailModal = (kind: 'trait' | 'tendency', name: string) => {
    const option = (kind === 'trait' ? TRAIT_OPTIONS : TENDENCY_OPTIONS).find(entry => entry.name === name);
    if (option) setOfficerDetailModal({ kind, option });
  };
  const selectedHistoricPlacement = selectedNewHistoricOfficer
    ? getOfficerPlacement(selectedNewHistoricOfficer.id, selectedEra.year)
    : null;
  const canChooseStartCity = Boolean(selectedNewCustomOfficer) || selectedHistoricPlacement?.force === '재야';
  const freeStartSetup = selectedHistoricPlacement?.force === '재야' || selectedNewCustomOfficer?.force === '재야';
  const createsNewForce = Boolean(freeStartSetup && selectedStartingCustomIds.length > 0);
  const freeOfficersHere = game.generals.filter(general => general.force === '재야' && general.id !== game.playerGeneralId && general.city === playerGeneral?.city);

  useEffect(() => {
    if (isMinorSuccessor && !MINOR_SUCCESSOR_TABS.includes(tab)) setTab('가족');
  }, [isMinorSuccessor, tab]);
  const discoveredFreeOfficersHere = freeOfficersHere.filter(general => game.discoveredOfficerIds.includes(general.id));
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));

  useEffect(() => {
    if (!personnelGeneral) return;
    setPersonnelRankDraft(personnelGeneral.rank);
    setPersonnelAppointmentDraft(personnelGeneral.appointment);
    setPersonnelCityDraft(personnelGeneral.appointmentCityId ?? personnelGeneral.city ?? personnelFallbackCityId);
  }, [personnelGeneral?.id, personnelGeneral?.rank, personnelGeneral?.appointment, personnelGeneral?.appointmentCityId, personnelGeneral?.city, personnelFallbackCityId]);

  useEffect(() => {
    if (!councilDue || councilDraftKey === currentCouncilKey) return;
    const draft = Object.fromEntries(affiliatedGenerals.map(general => [general.id, recommendOfficerTask(general)])) as Record<string, OfficerTask>;
    setCouncilDraft(draft);
    setCouncilDraftKey(currentCouncilKey);
  }, [affiliatedGenerals, councilDue, councilDraftKey, currentCouncilKey]);

  useEffect(() => {
    if ((tab !== '군사' && tab !== '내정') || managedCities.length === 0 || managedCities.some(city => city.id === selectedCityId)) return;
    setSelectedCityId(managedCities[0].id);
  }, [managedCities, selectedCityId, tab]);

  useEffect(() => {
    setGame(current => ({
      ...current,
      generals: current.generals.map(general => {
        if (general.force !== current.force || general.name === current.ruler) return general;
        const rank = normalizeOfficerRank(general.rank, forceRank.name, general.leadership, general.militaryStrategy);
        const appointment = normalizeAppointment(general.appointment, forceRank.name);
        const appointmentCityId = appointment === '태수' && current.cities.some(city => city.id === general.appointmentCityId && city.owner === current.force) ? general.appointmentCityId : undefined;
        return { ...general, rank, appointment: appointmentCityId || appointment !== '태수' ? appointment : '없음', appointmentCityId };
      }),
    }));
  }, [forceRank.name, game.force, game.ruler]);

  const totalPopulation = useMemo(
    () => playerCities.reduce((sum, city) => sum + city.population, 0),
    [playerCities]
  );
  const totalTroops = useMemo(
    () => playerCities.reduce((sum, city) => sum + city.troops, 0),
    [playerCities]
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }

  function addLog(message: string) {
    setGame(current => ({
      ...current,
      log: [message, ...current.log].slice(0, 200),
    }));
  }

  function domestic(kind: DomesticKind) {
    if (!selectedCity || !canManageSelectedCity) {
      flash('군주는 소속 세력 도시, 태수는 담당 도시에서만 행정 명령을 실행할 수 있습니다.');
      return;
    }
    const costs = { commerce: 1000, agriculture: 1000, security: 500, walls: 1500, training: 1000, recruit: 2000 };
    const apCosts = { commerce: 8, agriculture: 8, security: 6, walls: 10, training: 8, recruit: 10 };
    const dayCosts = { commerce: 3, agriculture: 3, security: 2, walls: 4, training: 3, recruit: 3 };
    const developmentCap = cityDevelopmentCap(selectedCity.tier);
    const facilityLevels = cityFacilityLevels(selectedCity);
    const identity = cityIdentity(selectedCity);
    const officeApDiscount = facilityLevels.office > 0 ? Math.ceil(facilityLevels.office / 2) : 0;
    const effectiveApCost = Math.max(1, apCosts[kind] - officeApDiscount - identity.domesticAp);
    const currentDevelopment = kind === 'commerce' ? selectedCity.commerce : kind === 'agriculture' ? selectedCity.agriculture : kind === 'security' ? selectedCity.security : kind === 'walls' ? selectedCity.defense : kind === 'training' ? selectedCity.training : 0;
    if (kind !== 'recruit' && currentDevelopment >= developmentCap) { flash(`${selectedCity.name}은 ${cityScaleLabel(selectedCity.tier)} 개발 상한 ${developmentCap}에 도달했습니다.`); return; }
    if (game.actionPoints < effectiveApCost) {
      flash(`행동력이 부족합니다. 필요 ${effectiveApCost} / 현재 ${game.actionPoints}${officeApDiscount > 0 ? ` · 관청 -${officeApDiscount}` : ''}`);
      return;
    }
    if (moneyToCopper(game.treasury) < costs[kind]) {
      flash('군자금이 부족합니다.');
      return;
    }
    const labels = { commerce: '상업 개발', agriculture: '농업 개발', security: '치안 강화', walls: '방벽 보수', training: '병사 훈련', recruit: '징병' };
    const specialtyKey: SpecialtyKey = kind === 'commerce' ? '상업' : kind === 'agriculture' ? '농업' : kind === 'security' ? '치안' : kind === 'walls' ? '축성' : '훈련';
    const administrators = canManageForce ? affiliatedGenerals.filter(general => general.city === selectedCity.id) : playerGeneral ? [playerGeneral] : [];
    const governor = administrators.find(general => general.appointment === '태수' && general.appointmentCityId === selectedCity.id);
    const administrator = governor ?? administrators.slice().sort((a, b) =>
      (b.politics + b.personnel + specialtyGradeValue(b.specialties[specialtyKey])) -
      (a.politics + a.personnel + specialtyGradeValue(a.specialties[specialtyKey]))
    )[0] ?? playerGeneral;
    const grade = administrator?.specialties[specialtyKey] ?? 'C';
    const statPower = administrator ? (kind === 'training' || kind === 'recruit' ? (administrator.politics + administrator.personnel) / 2 : administrator.politics) : 60;
    const profileBoost = administrator ? traitContextBonus(administrator.traits, 'domestic') + tendencyContextBonus(administrator.tendencies, 'domestic') + (administrator.appointment === '태수' && administrator.appointmentCityId === selectedCity.id ? 5 : 0) : 0;
    const statStep = Math.max(0, Math.floor((statPower - 55) / 18));
    const specialtyStep = Math.max(0, Math.floor((specialtyGradeValue(grade) - 50) / 18));
    const traitStep = Math.floor(profileBoost / 5);
    const gain = Math.max(1, 2 + statStep + specialtyStep + traitStep);
    const trainingGain = gain + Math.floor(facilityLevels.barracks / 2) + identity.training;
    const baseRecruitGain = Math.max(300, 800 + Math.round((administrator?.personnel ?? 60) * 4) + specialtyGradeValue(grade) * 4 + profileBoost * 10);
    const recruitGain = Math.round(baseRecruitGain * (1 + facilityLevels.barracks * 0.05 + identity.recruit));
    setGame(current => {
      const before = current.cities.find(city => city.id === selectedCity.id)!;
      let resultText = '';
      const cities = current.cities.map(city => {
        if (city.id !== selectedCity.id) return city;
        if (kind === 'commerce') { const value = Math.min(developmentCap, clampStat(city.commerce + gain)); resultText = `상업 ${city.commerce}→${value}`; return { ...city, commerce: value }; }
        if (kind === 'agriculture') { const value = Math.min(developmentCap, clampStat(city.agriculture + gain)); resultText = `농업 ${city.agriculture}→${value}`; return { ...city, agriculture: value }; }
        if (kind === 'security') { const value = Math.min(developmentCap, clampStat(city.security + gain + 1)); resultText = `치안 ${city.security}→${value}`; return { ...city, security: value }; }
        if (kind === 'walls') { const value = Math.min(developmentCap, clampStat(city.defense + gain)); resultText = `방벽 ${city.defense}→${value}`; return { ...city, defense: value }; }
        if (kind === 'training') { const value = Math.min(developmentCap, clampStat(city.training + trainingGain)); resultText = `훈련 ${city.training}→${value} · 병영 Lv.${facilityLevels.barracks}`; return { ...city, training: value }; }
        resultText = `병력 ${city.troops.toLocaleString()}→${(city.troops + recruitGain).toLocaleString()}`;
        return { ...city, troops: city.troops + recruitGain, population: Math.max(1000, city.population - Math.round(recruitGain / 2)) };
      });
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - effectiveApCost,
        treasury: copperToMoney(moneyToCopper(current.treasury) - costs[kind]),
        cities,
        log: [`[내정] ${dateLabel(current)} · ${administrator?.name ?? '관리관'} / ${selectedCity.name} / ${labels[kind]} · ${resultText || `도시 ${before.name}`} · ${specialtyKey} ${grade} · 행동력 ${current.actionPoints}→${current.actionPoints - effectiveApCost}${officeApDiscount > 0 ? ` · 관청 AP -${officeApDiscount}` : ''}${identity.domesticAp > 0 ? ` · 도시 특성 AP -${identity.domesticAp}` : ''} · ${dayCosts[kind]}일 소요.`, ...current.log].slice(0, 200),
      };
      return advanceGameClock(base, dayCosts[kind]);
    });
    flash(`${labels[kind]} 완료 · 행동력 -${effectiveApCost}${officeApDiscount > 0 ? ` · 관청 -${officeApDiscount}` : ''} · ${dayCosts[kind]}일`);
  }

  function promoteSelectedCity() {
    if (!selectedCity || !canManageSelectedCity) { flash('군주 또는 해당 도시의 태수만 도시 승격을 추진할 수 있습니다.'); return; }
    const plan = cityPromotionPlan(selectedCity);
    if (!plan) { flash(`${selectedCity.name}은(는) 이미 대도시입니다.`); return; }
    const requirements = cityPromotionRequirements(selectedCity, plan);
    const unmet = requirements.filter(requirement => !requirement.met);
    if (unmet.length > 0) { flash(`승격 조건 부족 · ${unmet.map(requirement => requirement.label).join(', ')}`); return; }
    if (game.actionPoints < plan.apCost) { flash(`행동력이 부족합니다. 승격에는 ${plan.apCost}가 필요합니다.`); return; }
    if (moneyToCopper(game.treasury) < plan.costCopper) { flash(`군자금이 부족합니다. 승격 비용 ${plan.costLabel}이 필요합니다.`); return; }
    const beforeLabel = cityScaleLabel(selectedCity.tier);
    setGame(current => {
      const city = current.cities.find(entry => entry.id === selectedCity.id);
      if (!city || city.owner !== current.force) return current;
      const currentPlan = cityPromotionPlan(city);
      if (!currentPlan || cityPromotionRequirements(city, currentPlan).some(requirement => !requirement.met) || current.actionPoints < currentPlan.apCost || moneyToCopper(current.treasury) < currentPlan.costCopper) return current;
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - currentPlan.apCost,
        treasury: copperToMoney(moneyToCopper(current.treasury) - currentPlan.costCopper),
        cities: current.cities.map(entry => entry.id === city.id ? { ...entry, tier: currentPlan.targetTier } : entry),
        log: [`[도시 승격] ${dateLabel(current)} · ${city.name} ${cityScaleLabel(city.tier)}→${currentPlan.targetLabel} · 비용 ${currentPlan.costLabel} · 행동력 ${current.actionPoints}→${current.actionPoints - currentPlan.apCost} · ${currentPlan.days}일 소요.`, ...current.log].slice(0, 200),
      };
      return advanceGameClock(base, currentPlan.days);
    });
    flash(`${selectedCity.name} ${beforeLabel} → ${plan.targetLabel} 승격 · ${plan.days}일`);
  }

  function advanceOneDay() {
    setGame(current => {
      const advanced = advanceGameClock(current, 1);
      return { ...advanced, log: [`[시간] ${dateLabel(current)} → ${dateLabel(advanced)} · 하루를 보냈다.`, ...advanced.log].slice(0, 200) };
    });
  }

  function performPersonalDomesticAction(kind: 'commerce' | 'agriculture' | 'security') {
    if (!playerGeneral || !tradeCity) { flash('플레이 장수의 현재 위치를 확인할 수 없습니다.'); return; }
    if (game.actionPoints < 3) { flash('개인 내정 의뢰에는 AP 3이 필요합니다.'); return; }
    const labels = { commerce: '시장 일손 돕기', agriculture: '농지 개간 돕기', security: '치안 협력' };
    const currentValue = kind === 'commerce' ? tradeCity.commerce : kind === 'agriculture' ? tradeCity.agriculture : tradeCity.security;
    const cap = cityDevelopmentCap(tradeCity.tier);
    if (currentValue >= cap) { flash(`${tradeCity.name}의 해당 분야는 현재 도시 규모 상한에 도달했습니다.`); return; }
    const ability = (effectiveStat(playerGeneral, 'politics') + effectiveStat(playerGeneral, 'personnel')) / 2;
    const gain = Math.max(1, Math.min(3, 1 + Math.floor((ability - 50) / 25)));
    const reward = 150 + effectiveStat(playerGeneral, 'politics') * 3;
    setGame(current => {
      const city = current.cities.find(entry => entry.id === tradeCity.id);
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!city || !actor || current.actionPoints < 3) return current;
      const cities = current.cities.map(entry => {
        if (entry.id !== city.id) return entry;
        if (kind === 'commerce') return { ...entry, commerce: Math.min(cityDevelopmentCap(entry.tier), entry.commerce + gain) };
        if (kind === 'agriculture') return { ...entry, agriculture: Math.min(cityDevelopmentCap(entry.tier), entry.agriculture + gain) };
        return { ...entry, security: Math.min(cityDevelopmentCap(entry.tier), entry.security + gain) };
      });
      const base: GameState = { ...current, actionPoints: current.actionPoints - 3, playerMerit: current.playerMerit + 8, playerFame: Math.min(1000, current.playerFame + 1), personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) + reward), cities };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[개인 내정] ${actor.name} · ${city.name} · ${labels[kind]} · 개발 +${gain} · 사례금 ${formatMoney(copperToMoney(reward))} · AP 3 · 1일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${labels[kind]} 완료 · 사례금 ${formatMoney(copperToMoney(reward))}`);
  }

  function performPersonalMilitaryAction(kind: 'patrol' | 'bandits') {
    if (!playerGeneral || !tradeCity) { flash('플레이 장수의 현재 위치를 확인할 수 없습니다.'); return; }
    const apCost = kind === 'patrol' ? 4 : 6;
    const days = kind === 'patrol' ? 2 : 3;
    if (game.actionPoints < apCost) { flash(`이 행동에는 AP ${apCost}가 필요합니다.`); return; }
    const chance = Math.max(35, Math.min(92, Math.round(35 + effectiveStat(playerGeneral, 'leadership') * 0.22 + effectiveStat(playerGeneral, 'martial') * 0.32 + effectiveStat(playerGeneral, 'intelligence') * 0.08)));
    const roll = stableRoll(`${playerGeneral.id}:${tradeCity.id}:${kind}:${game.year}:${game.month}:${game.day}`);
    const success = roll <= chance;
    const reward = success ? (kind === 'patrol' ? 350 : 800) : (kind === 'patrol' ? 80 : 150);
    const securityGain = success ? (kind === 'patrol' ? 1 : 2) : 0;
    const label = kind === 'patrol' ? '도시 순찰' : '도적 토벌';
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      const city = current.cities.find(entry => entry.id === tradeCity.id);
      if (!actor || !city || current.actionPoints < apCost) return current;
      const meritGain = success ? (kind === 'patrol' ? 14 : 28) : 4;
      const fameGain = success ? (kind === 'patrol' ? 3 : 9) : 1;
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - apCost,
        playerMerit: current.playerMerit + meritGain,
        playerFame: Math.min(1000, current.playerFame + fameGain),
        personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) + reward),
        cities: current.cities.map(entry => entry.id === city.id && securityGain > 0 ? { ...entry, security: Math.min(cityDevelopmentCap(entry.tier), entry.security + securityGain) } : entry),
      };
      const advanced = advanceGameClock(base, days);
      return { ...advanced, log: [`[개인 군사] ${actor.name} · ${city.name} · ${label} · 성공률 ${chance}% / 판정 ${roll} · ${success ? '성공' : '실패'} · 보수 ${formatMoney(copperToMoney(reward))}${securityGain ? ` · 치안 +${securityGain}` : ''} · AP ${apCost} · ${days}일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${label} ${success ? '성공' : '실패'} · 보수 ${formatMoney(copperToMoney(reward))}`);
  }

  function requestCareerPromotion() {
    if (!playerGeneral || game.playerStatus !== '소속장수' || !nextCareerRank || !nextCareerRequirement) { flash('현재 신분에서는 승진을 요청할 수 없습니다.'); return; }
    if (game.playerMerit < nextCareerRequirement.merit || game.playerFame < nextCareerRequirement.fame) { flash(`승진 조건이 부족합니다. 공적 ${nextCareerRequirement.merit}, 명성 ${nextCareerRequirement.fame}이 필요합니다.`); return; }
    if (game.actionPoints < 4) { flash('승진 요청에는 AP 4가 필요합니다.'); return; }
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor || current.playerStatus !== '소속장수' || current.actionPoints < 4) return current;
      const oldRank = actor.rank;
      const base: GameState = { ...current, actionPoints: current.actionPoints - 4, generals: current.generals.map(general => general.id === actor.id ? { ...general, rank: nextCareerRank.name, loyalty: Math.min(100, general.loyalty + 3) } : general), careerHistory: [careerHistoryEntry(current, `${oldRank}에서 ${nextCareerRank.name}(으)로 승진`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 2);
      return { ...advanced, log: [`[생애·승진] ${actor.name} · ${oldRank}→${nextCareerRank.name} · 공적 ${current.playerMerit} / 명성 ${current.playerFame} · AP 4 · 2일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${nextCareerRank.name} 승진 완료`);
  }

  function leaveAffiliatedForce() {
    if (!playerGeneral || game.playerStatus !== '소속장수') { flash('소속장수일 때만 하야할 수 있습니다.'); return; }
    if (game.actionPoints < 4) { flash('하야에는 AP 4가 필요합니다.'); return; }
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor || current.playerStatus !== '소속장수') return current;
      const oldForce = actor.force;
      const base: GameState = { ...current, force: '재야', ruler: '', playerStatus: '재야', actionPoints: current.actionPoints - 4, playerFame: Math.min(1000, current.playerFame + 5), generals: current.generals.map(general => general.id === actor.id ? { ...general, force: '재야', loyalty: 0, rank: '일반', appointment: '없음', appointmentCityId: undefined } : general), armies: current.armies.filter(army => !army.units.some(unit => unit.generalId === actor.id)), careerHistory: [careerHistoryEntry(current, `${oldForce}에서 하야하여 재야가 됨`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 2);
      return { ...advanced, log: [`[생애·하야] ${actor.name} · ${oldForce}을(를) 떠나 재야가 됨 · AP 4 · 2일.`, ...advanced.log].slice(0, 200) };
    });
    flash('하야 완료 · 재야 신분');
  }

  function joinCurrentForce() {
    if (!playerGeneral || !tradeCity || (game.playerStatus !== '재야' && game.playerStatus !== '독립부대') || !currentCityJoinForce || currentCityJoinForce === affiliatedForce) { flash('현재 도시에서 사관할 세력을 찾을 수 없습니다.'); return; }
    if (game.playerFame < 40) { flash('사관하려면 명성 40 이상이 필요합니다.'); return; }
    if (game.actionPoints < 6) { flash('사관에는 AP 6이 필요합니다.'); return; }
    const targetForce = currentCityJoinForce;
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor) return current;
      const oldForce = actor.force;
      const joiningIds = new Set(current.playerStatus === '독립부대' ? current.generals.filter(general => general.force === oldForce).map(general => general.id) : [actor.id]);
      const targetRank = getForceRank(current.cities.filter(city => city.owner === targetForce).length);
      const targetRuler = inferForceRulerName(targetForce, current.generals);
      const base: GameState = { ...current, force: targetForce, ruler: targetRuler, playerStatus: '소속장수', actionPoints: current.actionPoints - 6, playerMerit: Math.round(current.playerMerit * 0.75), generals: current.generals.map(general => joiningIds.has(general.id) ? { ...general, force: targetForce, loyalty: general.id === actor.id ? 75 : 70, rank: general.id === actor.id ? defaultOfficerRank(general.leadership, general.militaryStrategy, targetRank.name) : '일반', appointment: '없음', appointmentCityId: undefined } : general), armies: [], careerHistory: [careerHistoryEntry(current, `${targetForce}에 사관`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 3);
      return { ...advanced, log: [`[생애·사관] ${actor.name} · ${tradeCity.name}에서 ${targetForce}에 사관 · 동행 ${joiningIds.size}명 · AP 6 · 3일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${targetForce} 사관 완료`);
  }

  function defectToCurrentForce() {
    if (!playerGeneral || game.playerStatus !== '소속장수' || !tradeCity || !canJoinCurrentForce) { flash('타 세력 도시에 머무는 소속장수만 귀순할 수 있습니다.'); return; }
    if (game.playerFame < 120) { flash('귀순하려면 명성 120 이상이 필요합니다.'); return; }
    if (game.actionPoints < 8) { flash('귀순에는 AP 8이 필요합니다.'); return; }
    const targetForce = currentCityJoinForce;
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor) return current;
      const oldForce = actor.force;
      const targetRank = getForceRank(current.cities.filter(city => city.owner === targetForce).length);
      const targetRuler = inferForceRulerName(targetForce, current.generals);
      const base: GameState = { ...current, force: targetForce, ruler: targetRuler, actionPoints: current.actionPoints - 8, playerMerit: Math.round(current.playerMerit * 0.5), playerFame: Math.max(0, current.playerFame - 20), generals: current.generals.map(general => general.id === actor.id ? { ...general, force: targetForce, loyalty: 65, rank: defaultOfficerRank(general.leadership, general.militaryStrategy, targetRank.name), appointment: '없음', appointmentCityId: undefined } : general), armies: current.armies.filter(army => !army.units.some(unit => unit.generalId === actor.id)), careerHistory: [careerHistoryEntry(current, `${oldForce}을(를) 떠나 ${targetForce}로 귀순`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 4);
      return { ...advanced, log: [`[생애·귀순] ${actor.name} · ${oldForce}→${targetForce} · 공적 절반 / 명성 -20 · AP 8 · 4일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${targetForce} 귀순 완료`);
  }

  function formWanderingBand() {
    if (!playerGeneral || game.playerStatus !== '재야') { flash('재야 장수만 방랑군을 결성할 수 있습니다.'); return; }
    if (game.playerFame < 100) { flash('방랑군 결성에는 명성 100이 필요합니다.'); return; }
    if (moneyToCopper(game.personalTreasury) < 2000) { flash('방랑군 결성 자금 20은이 필요합니다.'); return; }
    if (game.actionPoints < 4) { flash('방랑군 결성에는 AP 4가 필요합니다.'); return; }
    const bandName = `${playerGeneral.name} 방랑군`;
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor) return current;
      const base: GameState = { ...current, force: bandName, ruler: '', playerStatus: '독립부대', actionPoints: current.actionPoints - 4, personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) - 2000), playerFame: Math.min(1000, current.playerFame + 15), generals: current.generals.map(general => general.id === actor.id ? { ...general, force: bandName, loyalty: 100, rank: '일반', appointment: '없음', appointmentCityId: undefined } : general), careerHistory: [careerHistoryEntry(current, `${bandName} 결성`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 2);
      return { ...advanced, log: [`[생애·방랑군] ${actor.name} · ${bandName} 결성 · 비용 20은 · 명성 +15 · AP 4 · 2일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${bandName} 결성`);
  }

  function dissolveWanderingBand() {
    if (!playerGeneral || game.playerStatus !== '독립부대') { flash('독립부대 상태에서만 방랑군을 해산할 수 있습니다.'); return; }
    if (game.actionPoints < 2) { flash('방랑군 해산에는 AP 2가 필요합니다.'); return; }
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor) return current;
      const oldForce = actor.force;
      const base: GameState = { ...current, force: '재야', ruler: '', playerStatus: '재야', actionPoints: current.actionPoints - 2, generals: current.generals.map(general => general.force === oldForce ? { ...general, force: '재야', loyalty: 0, rank: '일반', appointment: '없음', appointmentCityId: undefined } : general), armies: [], careerHistory: [careerHistoryEntry(current, `${oldForce}을(를) 해산하고 재야로 돌아감`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[생애·해산] ${actor.name} · ${oldForce} 해산 · 재야 복귀 · AP 2 · 1일.`, ...advanced.log].slice(0, 200) };
    });
    flash('방랑군 해산 · 재야 복귀');
  }

  function declareIndependence() {
    if (!playerGeneral || game.playerStatus !== '소속장수') { flash('소속장수만 독립할 수 있습니다.'); return; }
    if (game.playerMerit < 500 || game.playerFame < 300) { flash('독립에는 공적 500 · 명성 300이 필요합니다.'); return; }
    if (moneyToCopper(game.personalTreasury) < 5000) { flash('독립 준비금 50은이 필요합니다.'); return; }
    if (game.actionPoints < 10) { flash('독립에는 AP 10이 필요합니다.'); return; }
    const bandName = `${playerGeneral.name} 방랑군`;
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor) return current;
      const oldForce = actor.force;
      const followerIds = new Set(current.generals.filter(general => general.id !== actor.id && general.force === oldForce && general.city === actor.city && general.name !== current.ruler && (current.officerBonds[general.id]?.favor ?? 0) >= 70).map(general => general.id));
      const base: GameState = { ...current, force: bandName, ruler: '', playerStatus: '독립부대', actionPoints: current.actionPoints - 10, personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) - 5000), playerFame: Math.min(1000, current.playerFame + 40), generals: current.generals.map(general => general.id === actor.id || followerIds.has(general.id) ? { ...general, force: bandName, loyalty: 100, rank: '일반', appointment: '없음', appointmentCityId: undefined } : general), armies: current.armies.filter(army => !army.units.some(unit => unit.generalId === actor.id || followerIds.has(unit.generalId))), careerHistory: [careerHistoryEntry(current, `${oldForce}에서 독립해 ${bandName} 결성 · 동료 ${followerIds.size}명 합류`), ...(current.careerHistory ?? [])].slice(0, 40) };
      const advanced = advanceGameClock(base, 5);
      return { ...advanced, log: [`[생애·독립] ${actor.name} · ${oldForce}에서 독립 · ${bandName} 결성 · 동료 ${followerIds.size}명 · 비용 50은 · 명성 +40 · AP 10 · 5일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${bandName} 독립 결성`);
  }

  function acceptMission(mission: OfficerMission) {
    if (game.activeMission) { flash('이미 수행 중인 임무가 있습니다.'); return; }
    if (completedMissionIds.has(mission.id)) { flash('이번 달에 이미 완료한 임무입니다.'); return; }
    setGame(current => ({ ...current, activeMission: { ...mission, acceptedDate: dateLabel(current) }, log: [`[임무·수주] ${mission.category} · ${mission.title} · 의뢰인 ${mission.issuer}.`, ...current.log].slice(0, 200) }));
    flash(`${mission.title} 수주`);
  }

  function abandonMission() {
    const mission = game.activeMission;
    if (!mission || !playerGeneral) return;
    setGame(current => ({ ...current, activeMission: undefined, generals: current.generals.map(general => general.id === current.playerGeneralId && mission.category === '세력 명령' ? { ...general, loyalty: Math.max(0, general.loyalty - 2) } : general), log: [`[임무·포기] ${mission.title}${mission.category === '세력 명령' ? ' · 충성 -2' : ''}.`, ...current.log].slice(0, 200) }));
    flash(`${mission.title} 포기`);
  }

  function executeActiveMission() {
    const mission = game.activeMission;
    if (!mission || !playerGeneral) { flash('수행 중인 임무가 없습니다.'); return; }
    if (playerGeneral.city !== mission.cityId) { flash('임무를 받은 도시로 돌아가야 수행할 수 있습니다.'); return; }
    if (game.actionPoints < mission.apCost) { flash(`임무 수행에는 AP ${mission.apCost}가 필요합니다.`); return; }
    const chance = missionSuccessChance(mission, playerGeneral, game.playerFame);
    const roll = stableRoll(`${mission.id}:${game.year}:${game.month}:${game.day}:${game.playerGeneralId}`);
    const success = roll <= chance;
    setGame(current => {
      const actor = current.generals.find(general => general.id === current.playerGeneralId);
      if (!actor || !current.activeMission || current.activeMission.id !== mission.id || current.actionPoints < mission.apCost) return current;
      const meritGain = success ? mission.rewardMerit : Math.max(3, Math.round(mission.rewardMerit * 0.15));
      const fameGain = success ? mission.rewardFame : Math.max(0, Math.round(mission.rewardFame * 0.1));
      const rewardCopper = success ? mission.rewardCopper : Math.round(mission.rewardCopper * 0.12);
      const loyaltyDelta = mission.category === '세력 명령' && current.playerStatus === '소속장수' ? (success ? 4 : -2) : 0;
      const discovered = success && mission.kind === '인재 조사' ? current.generals.find(general => general.force === '재야' && general.city === mission.cityId && general.id !== current.playerGeneralId && !current.discoveredOfficerIds.includes(general.id)) : undefined;
      const securityGain = success ? mission.kind === '도적 토벌' ? 2 : mission.kind === '치안 순찰' ? 1 : 0 : 0;
      const commerceGain = success && mission.kind === '행정 지원' ? 1 : 0;
      const base: GameState = { ...current, actionPoints: current.actionPoints - mission.apCost, playerMerit: current.playerMerit + meritGain, playerFame: Math.min(1000, current.playerFame + fameGain), personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) + rewardCopper), activeMission: undefined, missionHistory: [{ missionId: mission.id, title: mission.title, category: mission.category, success, chance, roll, merit: meritGain, fame: fameGain, rewardCopper, completedDate: dateLabel(current) }, ...(current.missionHistory ?? [])].slice(0, 30), discoveredOfficerIds: discovered ? [...new Set([...current.discoveredOfficerIds, discovered.id])] : current.discoveredOfficerIds, generals: current.generals.map(general => general.id === actor.id && loyaltyDelta !== 0 ? { ...general, loyalty: Math.max(0, Math.min(100, general.loyalty + loyaltyDelta)) } : general), cities: current.cities.map(city => city.id === mission.cityId ? { ...city, security: Math.min(cityDevelopmentCap(city.tier), city.security + securityGain), commerce: Math.min(cityDevelopmentCap(city.tier), city.commerce + commerceGain) } : city), careerHistory: success && mission.category === '공적 임무' ? [careerHistoryEntry(current, `공적 임무 '${mission.title}' 성공`), ...(current.careerHistory ?? [])].slice(0, 40) : current.careerHistory };
      const advanced = advanceGameClock(base, mission.days);
      return { ...advanced, log: [`[임무·${success ? '성공' : '실패'}] ${mission.title} · 성공률 ${chance}% / 판정 ${roll} · 공적 +${meritGain} · 명성 +${fameGain} · 보수 ${formatMoney(copperToMoney(rewardCopper))}${loyaltyDelta ? ` · 충성 ${loyaltyDelta > 0 ? '+' : ''}${loyaltyDelta}` : ''}${discovered ? ` · ${discovered.name} 발견` : ''} · AP ${mission.apCost} · ${mission.days}일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${mission.title} · ${success ? '성공' : '실패'}`);
  }

  function startPersonalGoal(id: PersonalGoalId) {
    if (game.personalGoal) { flash('이미 진행 중인 개인 목표가 있습니다.'); return; }
    if ((game.claimedPersonalGoals ?? []).includes(id)) { flash('이미 달성한 개인 목표입니다.'); return; }
    const goal = PERSONAL_GOALS.find(entry => entry.id === id);
    if (!goal) return;
    setGame(current => ({ ...current, personalGoal: { id, startedAt: dateLabel(current), startValue: personalGoalMetric(current, id) }, log: [`[개인 목표] ${goal.title} 시작.`, ...current.log].slice(0, 200) }));
    flash(`${goal.title} 시작`);
  }

  function abandonPersonalGoal() {
    const goal = activeGoalDefinition;
    if (!goal) return;
    setGame(current => ({ ...current, personalGoal: undefined, log: [`[개인 목표] ${goal.title} 포기.`, ...current.log].slice(0, 200) }));
    flash(`${goal.title} 포기`);
  }

  function claimPersonalGoal() {
    const goalState = game.personalGoal;
    const goal = activeGoalDefinition;
    if (!goalState || !goal || activeGoalProgress < goal.target) { flash('아직 개인 목표를 달성하지 못했습니다.'); return; }
    setGame(current => ({ ...current, playerMerit: current.playerMerit + goal.rewardMerit, playerFame: Math.min(1000, current.playerFame + goal.rewardFame), personalGoal: undefined, claimedPersonalGoals: [...new Set([...(current.claimedPersonalGoals ?? []), goal.id])], careerHistory: [careerHistoryEntry(current, `개인 목표 '${goal.title}' 달성`), ...(current.careerHistory ?? [])].slice(0, 40), log: [`[개인 목표·달성] ${goal.title} · 공적 +${goal.rewardMerit} · 명성 +${goal.rewardFame}.`, ...current.log].slice(0, 200) }));
    flash(`${goal.title} 달성 보상 획득`);
  }

  function moveSelectedGeneralToSelectedCity() {
    const movingPlayer = selectedGeneral?.id === game.playerGeneralId;
    const movingIndependentCompanion = Boolean(selectedGeneral && playerAuthority === '독립부대' && selectedGeneral.force === affiliatedForce);
    const movingByRulerOrder = Boolean(selectedGeneral && canManageForce && selectedGeneral.force === affiliatedForce && selectedCity?.owner === affiliatedForce);
    if (!selectedGeneral || !selectedCity || (!movingPlayer && !movingIndependentCompanion && !movingByRulerOrder)) {
      flash('플레이 장수는 자유 이동, 독립부대 동료는 동행 이동, 군주는 소속 장수의 세력 내 이동만 지시할 수 있습니다.');
      return;
    }
    if (selectedGeneral.city === selectedCity.id) {
      flash(`${selectedGeneral.name}은(는) 이미 ${selectedCity.name}에 있습니다.`);
      return;
    }
    const days = travelDaysBetween(game.cities, selectedGeneral.city, selectedCity.id);
    if (!Number.isFinite(days)) {
      flash('현재 도시에서 이동할 수 있는 연결 경로가 없습니다.');
      return;
    }
    const fromName = game.cities.find(city => city.id === selectedGeneral.city)?.name ?? '현재 도시';
    setGame(current => {
      const groupOrigin = selectedGeneral.city;
      const moveIndependentGroup = movingPlayer && current.playerStatus === '독립부대';
      const moved: GameState = { ...current, generals: current.generals.map(general => general.id === selectedGeneral.id || (moveIndependentGroup && general.force === selectedGeneral.force && general.city === groupOrigin) ? { ...general, city: selectedCity.id } : general) };
      const advanced = advanceGameClock(moved, days);
      return { ...advanced, log: [`[이동] ${selectedGeneral.name} · ${fromName}→${selectedCity.name} · 행동력 0 · 최단 경로 ${Math.max(1, days / 2)}구간 · ${days}일 소요 · 도착 ${dateLabel(advanced)}.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${selectedGeneral.name} 이동 · 행동력 0 · ${days}일`);
  }

  function confirmCouncil() {
    setGame(current => {
      const cities = current.cities.map(city => ({ ...city }));
      const discovered = new Set(current.discoveredOfficerIds);
      const taskLogs: string[] = [];
      const members = current.generals.filter(general => general.force === current.force);
      members.forEach(general => {
        const task = councilDraft[general.id] ?? recommendOfficerTask(general);
        const city = cities.find(entry => entry.id === general.city);
        if (!city || task === '휴식') {
          taskLogs.push(`[장수 임무] ${general.name} · ${task}${city ? '' : ' · 거점 없음'}.`);
          return;
        }
        const key: SpecialtyKey = task === '방벽' ? '축성' : task === '인재탐색' ? '인재탐색' : task === '훈련' ? '훈련' : task;
        const primary = task === '인재탐색' ? effectiveStat(general, 'intelligence') : task === '훈련' ? effectiveStat(general, 'personnel') : effectiveStat(general, 'politics');
        const gain = Math.max(1, Math.min(3, 1 + Math.floor((primary + specialtyGradeValue(general.specialties[key]) - 115) / 55)));
        if (task === '상업') city.commerce = clampStat(city.commerce + gain);
        if (task === '농업') city.agriculture = clampStat(city.agriculture + gain);
        if (task === '치안') city.security = clampStat(city.security + gain);
        if (task === '방벽') city.defense = clampStat(city.defense + gain);
        if (task === '훈련') city.training = clampStat(city.training + gain);
        if (task === '인재탐색') {
          const found = current.generals.find(candidate => candidate.force === '재야' && candidate.city === general.city && !discovered.has(candidate.id));
          if (found) discovered.add(found.id);
          taskLogs.push(`[장수 임무] ${general.name} · ${city.name} 인재탐색 · 지략 ${effectiveStat(general, 'intelligence')} / 인재탐색 ${general.specialties['인재탐색']} · ${found ? `${found.name} 발견` : '새 인재 없음'}.`);
          return;
        }
        taskLogs.push(`[장수 임무] ${general.name} · ${city.name} ${task} +${gain} · ${key} ${general.specialties[key]}.`);
      });
      return {
        ...current,
        cities,
        discoveredOfficerIds: [...discovered],
        lastCouncilKey: currentCouncilKey,
        officerTasks: { ...councilDraft },
        log: [`[군의] ${dateLabel(current)} · ${members.length}명 참석 · 이번 순 임무를 확정했다.`, ...taskLogs, ...current.log].slice(0, 200),
      };
    });
    setCouncilDraftKey('');
    flash('군의 완료 · 장수별 임무가 실행되었습니다.');
  }

  function personnelLabel(general: General) {
    if (general.name === game.ruler) return `군주 · ${forceRank.name}`;
    return `${general.rank}${general.appointment !== '없음' ? ` · ${general.appointment}` : ''}`;
  }

  function unitCommandCap(general: General) {
    return officerCommandCap(
      general.rank,
      forceRank.maxTroops,
      effectiveStat(general, 'leadership'),
      effectiveStat(general, 'militaryStrategy'),
      general.appointment,
      general.name === game.ruler
    );
  }

  function assignPersonnel(generalId: string, rank: OfficerRank, appointment: OfficerAppointment, appointmentCityId?: string, source = '인사') {
    const editorMode = source.startsWith('에디터');
    const target = game.generals.find(general => general.id === generalId && (editorMode || general.force === affiliatedForce));
    if (!target) return;
    if (!editorMode && !canManageForce) {
      flash('직급·보직 임명은 군주 권한입니다. 현재 장수의 신분과 보직은 인사 화면에서 확인할 수 있습니다.');
      return;
    }
    const apCost = editorMode ? 0 : 2;
    const days = editorMode ? 0 : 1;
    if (game.actionPoints < apCost) {
      flash(`행동력이 부족합니다. 필요 ${apCost} / 현재 ${game.actionPoints}`);
      return;
    }
    if (target.name === game.ruler) {
      flash('군주의 지위는 세력 규모에 따라 자동 결정됩니다.');
      return;
    }
    if (!allowedOfficerRanks.some(entry => entry.name === rank)) {
      flash(`${forceRank.name}에서는 ${rank} 직급을 수여할 수 없습니다.`);
      return;
    }
    if (!allowedAppointments.some(entry => entry.name === appointment)) {
      flash(`${forceRank.name}에서는 ${appointment} 보직을 임명할 수 없습니다.`);
      return;
    }
    if (appointment === '태수' && !playerCities.some(city => city.id === appointmentCityId)) {
      flash('태수로 임명할 자세력 도시를 선택하세요.');
      return;
    }
    const oldRank = target.rank;
    const oldAppointment = target.appointment;
    const oldCap = unitCommandCap(target);
    const nextTarget: General = { ...target, rank, appointment, appointmentCityId: appointment === '태수' ? appointmentCityId : undefined };
    const newCap = officerCommandCap(rank, forceRank.maxTroops, effectiveStat(nextTarget, 'leadership'), effectiveStat(nextTarget, 'militaryStrategy'), appointment, false);
    const displaced = game.generals.filter(general => general.id !== generalId && general.force === game.force && (
      (appointment !== '없음' && appointment !== '태수' && general.appointment === appointment) ||
      (appointment === '태수' && general.appointment === '태수' && general.appointmentCityId === appointmentCityId)
    ));
    setGame(current => {
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - apCost,
        generals: current.generals.map(general => {
          if (general.id === generalId) return nextTarget;
          if (displaced.some(entry => entry.id === general.id)) return { ...general, appointment: '없음', appointmentCityId: undefined };
          return general;
        }),
        log: current.log,
      };
      const advanced = advanceGameClock(base, days);
      return { ...advanced, log: [`[${source}] ${target.name} · 직급 ${oldRank}→${rank} · 보직 ${oldAppointment}→${appointment}${appointment === '태수' ? `(${current.cities.find(city => city.id === appointmentCityId)?.name ?? '도시'})` : ''} · 개인 편성상한 ${oldCap.toLocaleString()}→${newCap.toLocaleString()}명 · 행동력 ${current.actionPoints}→${advanced.actionPoints}${days ? ` · ${days}일 소요` : ''}${displaced.length ? ` · 기존 ${appointment} ${displaced.map(entry => entry.name).join(', ')} 해임` : ''}.`, ...advanced.log].slice(0, 200) };
    });
    setPersonnelRankDraft(rank);
    setPersonnelAppointmentDraft(appointment);
    flash(`${target.name} 인사 발령 완료 · ${rank}${appointment !== '없음' ? ` / ${appointment}` : ''}`);
  }

  function applyPersonnel() {
    if (!personnelGeneral) return;
    assignPersonnel(personnelGeneral.id, personnelRankDraft, personnelAppointmentDraft, personnelCityDraft, '인사');
  }

  function saveArmyFormation() {
    if (!selectedCity || !canManageSelectedCity) { flash('군주는 소속 세력 도시, 태수는 담당 도시에서만 부대를 편성할 수 있습니다.'); return; }
    const units = formationGenerals.map(general => ({ generalId: general.id, troops: Math.max(0, Math.floor(formationTroops[general.id] ?? 0)), troopType: formationTroopTypes[general.id] ?? preferredTroopType(general) })).filter(unit => unit.troops > 0);
    const totalTroops = units.reduce((sum, unit) => sum + unit.troops, 0);
    if (!units.length || totalTroops < 1000) { flash('최소 1개 부대, 총 1,000명 이상을 편성하세요.'); return; }
    if (totalTroops > selectedCity.troops) { flash(`도시 보유 병력 ${selectedCity.troops.toLocaleString()}명을 초과했습니다.`); return; }
    if (totalTroops > managementTroopCap) { flash(`현재 장수 권한의 편성 상한 ${managementTroopCap.toLocaleString()}명을 초과했습니다.`); return; }
    const duplicate = units.find(unit => reservedGeneralIds.has(unit.generalId));
    if (duplicate) { flash(`${game.generals.find(general => general.id === duplicate.generalId)?.name ?? '장수'}은(는) 이미 다른 편성에 들어가 있습니다.`); return; }
    const overCap = units.find(unit => { const general = game.generals.find(entry => entry.id === unit.generalId); return general ? unit.troops > unitCommandCap(general) : true; });
    if (overCap) { flash(`${game.generals.find(entry => entry.id === overCap.generalId)?.name ?? '장수'}의 지휘 한도를 초과했습니다.`); return; }
    const army: ArmyFormation = { id: `army-${Date.now()}`, name: `${selectedCity.name} 제${game.armies.filter(entry => entry.originCityId === selectedCity.id).length + 1}군`, originCityId: selectedCity.id, battlePlan, units };
    setGame(current => ({ ...current, armies: [...current.armies, army], log: [`[군사·편성] ${army.name} · ${units.length}개 부대 · ${totalTroops.toLocaleString()}명 편성.`, ...current.log].slice(0, 200) }));
    setFormationTroops({}); setFormationTroopTypes({}); setBattlePlan('clash'); setSelectedArmyId(army.id); setMilitaryView('도시 선택'); flash(`${army.name} 편성 완료`);
  }

  function assignArmyTarget(armyId: string, targetId: string) {
    const army = game.armies.find(entry => entry.id === armyId); const origin = army ? game.cities.find(city => city.id === army.originCityId) : undefined; const target = game.cities.find(city => city.id === targetId);
    const canCommandOrigin = Boolean(origin && managedCities.some(city => city.id === origin.id));
    if (!army || !origin || !target || !canCommandOrigin || !origin.neighbors.includes(target.id) || target.owner === affiliatedForce) { flash('현재 지휘 권한으로 공격 가능한 인접 적 도시만 선택할 수 있습니다.'); return; }
    setGame(current => ({ ...current, armies: current.armies.map(entry => entry.id === armyId ? { ...entry, targetCityId: targetId } : entry), log: [`[군사·목표] ${army.name} · ${origin.name}→${target.name} 출정 목표 지정.`, ...current.log].slice(0, 200) })); setSelectedArmyId(armyId);
  }

  function disbandArmy(armyId: string) { const army = game.armies.find(entry => entry.id === armyId); if (!army || !managedCities.some(city => city.id === army.originCityId)) { flash('이 부대를 해산할 지휘 권한이 없습니다.'); return; } setGame(current => ({ ...current, armies: current.armies.filter(entry => entry.id !== armyId), log: [`[군사·해산] ${army.name} 편성 해제.`, ...current.log].slice(0, 200) })); if (selectedArmyId === armyId) setSelectedArmyId(''); }

  function executeArmySortie(armyId: string) {
    const army = game.armies.find(entry => entry.id === armyId); const origin = army ? game.cities.find(city => city.id === army.originCityId) : undefined; const target = army?.targetCityId ? game.cities.find(city => city.id === army.targetCityId) : undefined;
    if (!army || !origin || !target) { flash('출정 부대와 목표 도시를 먼저 지정하세요.'); return; }
    if (!managedCities.some(city => city.id === origin.id) || origin.owner !== affiliatedForce || !origin.neighbors.includes(target.id) || target.owner === affiliatedForce) { flash('현재 장수의 지휘 권한으로는 해당 목표에 출정할 수 없습니다.'); return; }
    const units = army.units.map(unit => ({ ...unit, general: game.generals.find(general => general.id === unit.generalId) })).filter((unit): unit is ArmyUnit & { general: General } => Boolean(unit.general && unit.general.city === origin.id));
    const totalTroops = units.reduce((sum, unit) => sum + unit.troops, 0);
    if (!units.length || totalTroops < 1000) {
      flash('최소 1개 부대, 총 1,000명 이상을 편성하세요.');
      return;
    }
    if (totalTroops > origin.troops) {
      flash(`도시 보유 병력 ${origin.troops.toLocaleString()}명을 초과했습니다.`);
      return;
    }
    if (totalTroops > managementTroopCap) {
      flash(`현재 장수 권한의 편성 상한 ${managementTroopCap.toLocaleString()}명을 초과했습니다.`);
      return;
    }
    const overCap = units.find(unit => unit.troops > unitCommandCap(unit.general));
    if (overCap) {
      flash(`${overCap.general.name}의 지휘 한도 ${unitCommandCap(overCap.general).toLocaleString()}명을 초과했습니다.`);
      return;
    }
    if (game.actionPoints < 12) {
      flash(`행동력이 부족합니다. 출정에는 12가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const commander = units.slice().sort((a, b) => (effectiveStat(b.general, 'leadership') + effectiveStat(b.general, 'militaryStrategy')) - (effectiveStat(a.general, 'leadership') + effectiveStat(a.general, 'militaryStrategy')))[0].general;
    const defendingGenerals = game.generals.filter(general => general.force === target.owner && general.city === target.id);
    const defender = defendingGenerals
      .slice()
      .sort((a, b) => (effectiveStat(b, 'leadership') + effectiveStat(b, 'militaryStrategy')) - (effectiveStat(a, 'leadership') + effectiveStat(a, 'militaryStrategy')))[0];
    const militaryAdvisor = playerGenerals.find(general => general.appointment === '군사');
    const quartermaster = playerGenerals.find(general => general.appointment === '군량관');
    const advisorBonus = militaryAdvisor ? Math.min(0.06, effectiveStat(militaryAdvisor, 'intelligence') / 1800) : 0;
    const defenderType: TroopType = defender ? preferredTroopType(defender) : '보병';
    const originIdentity = cityIdentity(origin);
    const targetIdentity = cityIdentity(target);
    let attackPower = units.reduce((sum, unit) => {
      const grade = unit.general.specialties[unit.troopType];
      const profileBonus = traitContextBonus(unit.general.traits, 'combat') + tendencyContextBonus(unit.general.tendencies, 'combat');
      const appointmentBonus = unit.general.appointment === '도독' ? 0.08 : unit.general.appointment === '선봉장' ? 0.05 : 0;
      return sum + unit.troops
        * (0.82 + effectiveStat(unit.general, 'leadership') / 205)
        * (0.84 + effectiveStat(unit.general, 'militaryStrategy') / 260)
        * specialtyMultiplier(grade)
        * troopMatchupMultiplier(unit.troopType, defenderType)
        * (0.9 + origin.training / 500)
        * (0.96 + effectiveStat(unit.general, 'martial') / 1000)
        * (1 + profileBonus / 100 + appointmentBonus)
        * (1 + (unit.troopType === '기병' ? originIdentity.cavalryAttack : 0));
    }, 0) * (1 + advisorBonus);
    const defenseGrade = defender?.specialties['방어전'] ?? 'C';
    const wallFacilityBonus = cityFacilityLevels(target).walls * 0.03;
    let defensePower = target.troops
      * (0.84 + effectiveStat(defender, 'leadership') / 220)
      * (0.84 + effectiveStat(defender, 'militaryStrategy') / 285)
      * specialtyMultiplier(defenseGrade)
      * specialtyMultiplier(defender?.specialties[defenderType] ?? 'C')
      * (0.9 + target.training / 500)
      * (1 + target.defense / 200)
      * (1 + wallFacilityBonus + targetIdentity.defense)
      * (1 + (traitContextBonus(defender?.traits ?? [], 'defense') + tendencyContextBonus(defender?.tendencies ?? [], 'defense')) / 100);
    const lines = [
      `출정: ${origin.name} → ${target.name} · ${army.name} · ${units.length}개 부대 · 총 ${totalTroops.toLocaleString()}명`,
      ...units.map(unit => `${unit.general.name} · ${personnelLabel(unit.general)} · ${unit.troopType} ${unit.general.specialties[unit.troopType]} · 부대 ${unit.troops.toLocaleString()}명 · 지휘한도 ${unitCommandCap(unit.general).toLocaleString()}명`),
    ];
    if (militaryAdvisor) lines.push(`군사 지원: ${militaryAdvisor.name} · 지략 ${effectiveStat(militaryAdvisor, 'intelligence')} · 공격 전투력 +${Math.round(advisorBonus * 100)}%`);
    if (quartermaster) lines.push(`군량관 지원: ${quartermaster.name} · 전투 손실 8% 감소`);
    if (wallFacilityBonus > 0) lines.push(`성벽 시설: Lv.${cityFacilityLevels(target).walls} · 수성 전투력 +${Math.round(wallFacilityBonus * 100)}%`);
    if (originIdentity.cavalryAttack > 0 && units.some(unit => unit.troopType === '기병')) lines.push(`도시 특성: ${origin.name} ${originIdentity.trait} · 기병 공격 +${Math.round(originIdentity.cavalryAttack * 100)}%`);
    if (targetIdentity.defense > 0) lines.push(`도시 특성: ${target.name} ${targetIdentity.trait} · 수성 +${Math.round(targetIdentity.defense * 100)}%`);
    let mode = '부대 교전';
    if (army.battlePlan === 'duel' && defender) {
      mode = '일기토 도전';
      const attackerDuel = (effectiveStat(commander, 'martial') * 1.15 + effectiveStat(commander, 'leadership') * 0.25) * (commander.appointment === '친위대장' ? 1.12 : 1);
      const defenderDuel = effectiveStat(defender, 'martial') * 1.15 + effectiveStat(defender, 'leadership') * 0.25;
      const duelWin = attackerDuel >= defenderDuel;
      attackPower *= duelWin ? 1.24 : 0.88;
      defensePower *= duelWin ? 0.82 : 1.12;
      lines.push(`일기토: ${commander.name} ${Math.round(attackerDuel)} vs ${defender.name} ${Math.round(defenderDuel)} · ${duelWin ? `${commander.name}이 적장을 격퇴해 적 사기 저하` : `${commander.name}이 밀려 아군 사기 저하`}`);
    } else {
      lines.push(`부대 교전: 아군 전투력 ${Math.round(attackPower).toLocaleString()} vs 적 전투력 ${Math.round(defensePower).toLocaleString()}`);
    }
    const victory = attackPower >= defensePower;
    const powerRatio = Math.max(0.55, Math.min(1.8, defensePower / Math.max(1, attackPower)));
    const rawAttackerLoss = Math.min(totalTroops - 200, Math.max(300, Math.floor(totalTroops * (victory ? 0.16 + powerRatio * 0.08 : 0.28 + powerRatio * 0.1))));
    const attackerLoss = Math.max(200, Math.floor(rawAttackerLoss * (quartermaster ? 0.92 : 1)));
    const defenderLoss = Math.min(target.troops, Math.max(500, Math.floor(target.troops * (victory ? 0.55 : 0.25))));
    const survivors = Math.max(200, totalTroops - attackerLoss);
    const deployedIds = new Set(units.map(unit => unit.general.id));
    const rolledOfficerOutcomes = victory ? defendingGenerals.map(general => ({ general, outcome: battleOfficerOutcome(general, `${target.id}:${game.year}:${game.month}:${game.day}:${totalTroops}`) })) : [];
    const officerOutcomes = victory && rolledOfficerOutcomes.length > 0 && !rolledOfficerOutcomes.some(entry => entry.outcome === 'captured')
      ? rolledOfficerOutcomes.map((entry, index) => index === 0 ? { ...entry, outcome: 'captured' as BattleOfficerOutcome } : entry)
      : rolledOfficerOutcomes;
    const capturedOutcomes = officerOutcomes.filter(entry => entry.outcome === 'captured');
    const deadOutcomes = officerOutcomes.filter(entry => entry.outcome === 'dead');
    const escapedOutcomes = officerOutcomes.filter(entry => entry.outcome === 'escaped');
    const capturedIds = new Set(capturedOutcomes.map(entry => entry.general.id));
    const deadIds = new Set(deadOutcomes.map(entry => entry.general.id));
    const escapeDestinations = new Map<string, { cityId: string; force: string }>();
    escapedOutcomes.forEach(({ general }) => {
      const sameForceCity = game.cities.find(city => city.id !== target.id && city.owner === general.force);
      escapeDestinations.set(general.id, sameForceCity ? { cityId: sameForceCity.id, force: general.force } : { cityId: target.id, force: '재야' });
    });
    lines.push(`손실: 아군 -${attackerLoss.toLocaleString()}명 / 적군 -${defenderLoss.toLocaleString()}명`);
    lines.push(victory ? `${target.name} 함락 · 생존 병력 ${survivors.toLocaleString()}명과 출정 장수 ${units.length}명이 주둔` : `공략 실패 · 생존 병력 ${(totalTroops - attackerLoss).toLocaleString()}명이 ${origin.name}으로 복귀`);
    if (victory && defendingGenerals.length > 0) {
      lines.push(`적 장수 결과 · 포로: ${capturedOutcomes.map(entry => entry.general.name).join(', ') || '없음'} / 전사: ${deadOutcomes.map(entry => entry.general.name).join(', ') || '없음'} / 도주: ${escapedOutcomes.map(entry => entry.general.name).join(', ') || '없음'}`);
    }
    const apBefore = game.actionPoints;
    setGame(current => {
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - 12,
        cities: current.cities.map(city => {
          if (city.id === origin.id) return { ...city, troops: victory ? Math.max(0, city.troops - totalTroops) : Math.max(0, city.troops - attackerLoss) };
          if (city.id === target.id) return victory
            ? { ...city, owner: current.force, troops: survivors, security: Math.max(25, city.security - 12) }
            : { ...city, troops: Math.max(0, city.troops - defenderLoss) };
          return city;
        }),
        generals: victory ? current.generals
          .filter(general => !deadIds.has(general.id))
          .map(general => {
            if (deployedIds.has(general.id)) return { ...general, city: target.id };
            const escape = escapeDestinations.get(general.id);
            if (escape) return { ...general, city: escape.cityId, force: escape.force, loyalty: escape.force === '재야' ? 0 : general.loyalty, appointment: escape.force === '재야' ? '없음' as OfficerAppointment : general.appointment, appointmentCityId: escape.force === '재야' ? undefined : general.appointmentCityId };
            if (capturedIds.has(general.id)) return { ...general, city: target.id };
            return general;
          }) : current.generals,
        armies: current.armies.filter(entry => entry.id !== army.id).map(entry => entry.targetCityId === target.id ? { ...entry, targetCityId: undefined } : entry),
        prisoners: victory ? [...current.prisoners, ...capturedOutcomes.map(entry => ({ generalId: entry.general.id, capturedAtCityId: target.id, originalForce: entry.general.force }))] : current.prisoners,
        log: current.log,
      };
      const advanced = advanceGameClock(base, 5);
      const aftermathLog = victory && defendingGenerals.length > 0 ? `[전후] ${target.name} · 포로 ${capturedOutcomes.map(entry => entry.general.name).join(', ') || '없음'} / 전사 ${deadOutcomes.map(entry => entry.general.name).join(', ') || '없음'} / 도주 ${escapedOutcomes.map(entry => entry.general.name).join(', ') || '없음'}.` : '';
      return { ...advanced, log: [`[군사] ${origin.name}→${target.name} · ${army.name} · ${mode} · 출전 ${totalTroops.toLocaleString()}명 / 세력 상한 ${forceTroopLimitLabel(forceRank)}(${forceRank.name}) · 훈련 ${origin.training} · 아군전투력 ${Math.round(attackPower).toLocaleString()} / 적전투력 ${Math.round(defensePower).toLocaleString()} · 손실 ${attackerLoss.toLocaleString()}:${defenderLoss.toLocaleString()} · ${victory ? '함락' : '공략 실패'} · 행동력 ${apBefore}→${advanced.actionPoints} · 5일 소요.`, ...(aftermathLog ? [aftermathLog] : []), ...advanced.log].slice(0, 200) };
    });
    setBattleReport({
      title: `${origin.name} → ${target.name}`,
      mode,
      victory,
      result: victory ? `${target.name} 함락` : `${target.name} 공략 실패`,
      lines: [`전투력: 아군 ${Math.round(attackPower).toLocaleString()} / 적군 ${Math.round(defensePower).toLocaleString()}`, ...lines],
    });
    if (victory) setSelectedCityId(target.id);
    setSelectedArmyId('');
  }

  function resolvePrisoner(action: 'recruit' | 'release' | 'execute') {
    if (!pendingPrisoner || !pendingPrisonerGeneral) return;
    const prisonerId = pendingPrisoner.generalId;
    const prisonerName = pendingPrisonerGeneral.name;
    setGame(current => {
      const prisoner = current.prisoners.find(entry => entry.generalId === prisonerId);
      const general = current.generals.find(entry => entry.id === prisonerId);
      if (!prisoner || !general) return { ...current, prisoners: current.prisoners.filter(entry => entry.generalId !== prisonerId) };
      let generals = current.generals;
      let ownedItems = current.ownedItems;
      let itemQuantities = { ...(current.itemQuantities ?? {}) };
      let resultText = '';
      if (action === 'recruit') {
        const rulerGeneral = current.generals.find(entry => entry.force === current.force && entry.name === current.ruler);
        const loyalty = Math.min(80, 45 + Math.floor(((rulerGeneral?.charisma ?? 60) + (rulerGeneral?.diplomacy ?? 60)) / 12));
        const carriedItems = (Object.values(general.equipment).filter(Boolean) as string[]);
        ownedItems = Array.from(new Set([...ownedItems, ...carriedItems]));
        carriedItems.forEach(itemId => { itemQuantities[itemId] = Math.max(1, itemQuantities[itemId] ?? 0); });
        generals = generals.map(entry => entry.id === prisonerId ? { ...entry, force: current.force, city: prisoner.capturedAtCityId, loyalty, rank: '일반' as OfficerRank, appointment: '없음' as OfficerAppointment, appointmentCityId: undefined } : entry);
        resultText = `${general.name}을(를) 휘하 장수로 등용했다 · 충성 ${loyalty}`;
      } else if (action === 'release') {
        const refuge = current.cities.find(city => city.owner === prisoner.originalForce);
        generals = generals.map(entry => entry.id === prisonerId ? { ...entry, force: refuge ? prisoner.originalForce : '재야', city: refuge?.id ?? prisoner.capturedAtCityId, loyalty: refuge ? entry.loyalty : 0, appointment: '없음' as OfficerAppointment, appointmentCityId: undefined } : entry);
        resultText = refuge ? `${general.name}을(를) 석방했다 · ${refuge.name}으로 돌아감` : `${general.name}을(를) 석방했다 · 세력 멸망으로 재야 전환`;
      } else {
        generals = generals.filter(entry => entry.id !== prisonerId);
        resultText = `${general.name}을(를) 참수했다`;
      }
      return { ...current, generals, ownedItems, itemQuantities, prisoners: current.prisoners.filter(entry => entry.generalId !== prisonerId), log: [`[포로 처분] ${resultText}.`, ...current.log].slice(0, 200) };
    });
    flash(action === 'recruit' ? `${prisonerName} 등용` : action === 'release' ? `${prisonerName} 석방` : `${prisonerName} 참수`);
  }

  function searchTalent() {
    if (!playerGeneral || !tradeCity) {
      flash('플레이 장수의 현재 위치를 확인할 수 없습니다.');
      return;
    }
    if (game.actionPoints < 6) {
      flash(`행동력이 부족합니다. 탐색에는 6이 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const searcher = playerGeneral;
    const searchGrade = searcher.specialties['인재탐색'] ?? 'C';
    const tavernLevel = cityFacilityLevels(tradeCity).tavern;
    const tavernSearchBonus = tavernLevel * 4;
    const identity = cityIdentity(tradeCity);
    const baseSearchPower = searcher
      ? searcher.intelligence * 0.4 + searcher.personnel * 0.35 + searcher.charisma * 0.1 + specialtyGradeValue(searchGrade) * 0.15 + traitContextBonus(searcher.traits, 'search') + tendencyContextBonus(searcher.tendencies, 'search')
      : 60;
    const searchPower = baseSearchPower + tavernSearchBonus + identity.search;
    const candidates = game.generals
      .filter(general => general.id !== game.playerGeneralId && general.force === '재야' && general.city === tradeCity.id && !game.discoveredOfficerIds.includes(general.id))
      .slice()
      .sort((a, b) => (b.intelligence + b.personnel + b.charisma) - (a.intelligence + a.personnel + a.charisma));
    const found = candidates.slice(0, searchPower >= 95 ? 2 : 1);
    const message = found.length > 0
      ? `[인재·탐색] ${tradeCity.name} · ${searcher.name} · 지략 ${effectiveStat(searcher, 'intelligence')} / 인사 ${effectiveStat(searcher, 'personnel')} / 매력 ${effectiveStat(searcher, 'charisma')} / 탐색 ${searchGrade} · 탐색력 ${Math.round(searchPower)}${tavernSearchBonus > 0 ? ` · 주점 Lv.${tavernLevel} +${tavernSearchBonus}` : ''}${identity.search > 0 ? ` · ${identity.trait} +${identity.search}` : ''} · 발견 ${found.length}명(${found.map(general => general.name).join(', ')}) · 행동력 ${game.actionPoints}→${game.actionPoints - 1}.`
      : `[인재·탐색] ${tradeCity.name} · ${searcher.name} · 탐색력 ${Math.round(searchPower)}${tavernSearchBonus > 0 ? ` · 주점 Lv.${tavernLevel} +${tavernSearchBonus}` : ''}${identity.search > 0 ? ` · ${identity.trait} +${identity.search}` : ''} · 발견 0명 · 행동력 ${game.actionPoints}→${game.actionPoints - 1}.`; 
    setGame(current => {
      const base: GameState = { ...current, actionPoints: current.actionPoints - 6, playerMerit: current.playerMerit + (found.length ? 6 : 2), playerFame: Math.min(1000, current.playerFame + found.length * 3), discoveredOfficerIds: [...new Set([...current.discoveredOfficerIds, ...found.map(general => general.id)])], log: current.log };
      const advanced = advanceGameClock(base, 2);
      return { ...advanced, log: [message.replace(`행동력 ${game.actionPoints}→${game.actionPoints - 1}`, `행동력 ${current.actionPoints}→${advanced.actionPoints} · 2일 소요`), ...advanced.log].slice(0, 200) };
    });
    flash(found.length > 0 ? `${found.map(general => general.name).join(', ')} 발견!` : '새로운 인재를 찾지 못했습니다.');
  }

  function talkToTalent(id: string) {
    const target = game.generals.find(general => general.id === id);
    if (!playerGeneral || !target || target.force !== '재야' || !game.discoveredOfficerIds.includes(id) || target.city !== playerGeneral.city) return;
    if (game.actionPoints < 3) {
      flash(`행동력이 부족합니다. 대화에는 3이 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const actor = playerGeneral;
    const relation = game.freeOfficerRelations[id] ?? { favor: 0, conversations: 0, gifts: 0 };
    const gain = Math.max(3, Math.min(12, 3 + Math.floor((effectiveStat(actor, 'diplomacy') + effectiveStat(actor, 'charisma')) / 35) + Math.floor(traitContextBonus(actor?.traits ?? [], 'recruit') / 8)));
    const nextFavor = Math.min(100, relation.favor + gain);
    setGame(current => {
      const base: GameState = { ...current, actionPoints: current.actionPoints - 3, freeOfficerRelations: { ...current.freeOfficerRelations, [id]: { ...relation, favor: nextFavor, conversations: relation.conversations + 1 } }, log: current.log };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[인재·대화] ${actor.name}→${target.name} · 외교 ${effectiveStat(actor, 'diplomacy')} / 매력 ${effectiveStat(actor, 'charisma')} · 교분 ${relation.favor}→${nextFavor}(+${gain}) · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 1일 소요.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${target.name}과 대화 · 교분 +${gain}`);
  }

  function giftTalent(id: string) {
    const target = game.generals.find(general => general.id === id);
    const itemId = talentGiftSelections[id];
    const item = ITEMS.find(entry => entry.id === itemId);
    if (!target || !item || !game.ownedItems.includes(item.id)) {
      flash('선물할 보유 아이템을 선택하세요.');
      return;
    }
    if (game.actionPoints < 2) {
      flash(`행동력이 부족합니다. 선물에는 2가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const relation = game.freeOfficerRelations[id] ?? { favor: 0, conversations: 0, gifts: 0 };
    const gain = Math.min(30, 8 + Math.floor(item.priceCopper / 500));
    const nextFavor = Math.min(100, relation.favor + gain);
    setGame(current => {
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - 2,
        ownedItems: current.ownedItems.filter(entry => entry !== item.id),
        generals: current.generals.map(general => {
          const equipment = { ...general.equipment };
          (Object.keys(equipment) as ItemType[]).forEach(type => { if (equipment[type] === item.id) delete equipment[type]; });
          return general.id === id ? general : { ...general, equipment };
        }),
        freeOfficerRelations: { ...current.freeOfficerRelations, [id]: { ...relation, favor: nextFavor, gifts: relation.gifts + 1 } },
        log: current.log,
      };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[인재·선물] ${target.name}에게 ${item.name}(${formatMoney(copperToMoney(item.priceCopper))}) 선물 · 교분 ${relation.favor}→${nextFavor}(+${gain}) · 보유 장비 1개 감소 · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 1일 소요.`, ...advanced.log].slice(0, 200) };
    });
    setTalentGiftSelections(current => ({ ...current, [id]: '' }));
    flash(`${target.name}에게 ${item.name} 선물 · 교분 +${gain}`);
  }

  function talkToOfficer(id: string) {
    const target = game.generals.find(general => general.id === id);
    if (!playerGeneral || !target || target.id === playerGeneral.id || target.city !== playerGeneral.city) {
      flash('플레이 장수와 같은 도시에 있는 다른 장수에게만 대화할 수 있습니다.');
      return;
    }
    if (game.actionPoints < 2) {
      flash(`행동력이 부족합니다. 대화에는 2가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const bond = game.officerBonds[id] ?? { favor: 0, talks: 0, gifts: 0, trainingXp: {} };
    const gain = Math.max(3, Math.min(10, 3 + Math.floor((effectiveStat(playerGeneral, 'diplomacy') + effectiveStat(playerGeneral, 'charisma')) / 45)));
    const nextFavor = Math.min(100, bond.favor + gain);
    setGame(current => {
      const base: GameState = { ...current, actionPoints: current.actionPoints - 2, officerBonds: { ...current.officerBonds, [id]: { ...bond, favor: nextFavor, talks: bond.talks + 1 } }, log: current.log };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[장수·대화] ${playerGeneral.name}→${target.name} · 친밀 ${bond.favor}→${nextFavor}(+${gain}) · 대화 ${bond.talks + 1}회 · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 1일 소요.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${target.name}과 대화 · 친밀 +${gain}`);
  }

  function giftToOfficer(id: string) {
    const target = game.generals.find(general => general.id === id);
    const item = catalogItem(officerGiftItemId);
    if (!playerGeneral || !target || target.id === playerGeneral.id || target.city !== playerGeneral.city) {
      flash('플레이 장수와 같은 도시에 있는 다른 장수에게만 선물할 수 있습니다.');
      return;
    }
    if (!item || !game.ownedItems.includes(item.id)) {
      flash('선물할 보유 아이템을 선택하세요.');
      return;
    }
    if (game.actionPoints < 2) {
      flash(`행동력이 부족합니다. 선물에는 2가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const bond = game.officerBonds[id] ?? { favor: 0, talks: 0, gifts: 0, trainingXp: {} };
    const gain = Math.min(25, 8 + Math.floor(item.priceCopper / 700));
    const nextFavor = Math.min(100, bond.favor + gain);
    setGame(current => {
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - 2,
        ownedItems: current.ownedItems.filter(entry => entry !== item.id),
        generals: current.generals.map(general => {
          const equipment = { ...general.equipment };
          (Object.keys(equipment) as ItemType[]).forEach(type => { if (equipment[type] === item.id) delete equipment[type]; });
          return { ...general, equipment };
        }),
        officerBonds: { ...current.officerBonds, [id]: { ...bond, favor: nextFavor, gifts: bond.gifts + 1 } },
        log: current.log,
      };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[장수·선물] ${playerGeneral.name}→${target.name} · ${item.name} 선물 · 친밀 ${bond.favor}→${nextFavor}(+${gain}) · 선물 ${bond.gifts + 1}회 · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 1일 소요.`, ...advanced.log].slice(0, 200) };
    });
    setOfficerGiftItemId('');
    flash(`${target.name}에게 ${item.name} 선물 · 친밀 +${gain}`);
  }

  function trainOfficer(id: string) {
    const target = game.generals.find(general => general.id === id);
    if (!playerGeneral || !target || target.id === playerGeneral.id || target.city !== playerGeneral.city || target.force !== playerGeneral.force) {
      flash('같은 도시에 있는 같은 소속 장수에게만 전수할 수 있습니다.');
      return;
    }
    if (game.actionPoints < 5) {
      flash(`행동력이 부족합니다. 전수에는 5가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const bond = game.officerBonds[id] ?? { favor: 0, talks: 0, gifts: 0, trainingXp: {} };
    const beforeXp = bond.trainingXp[officerTrainingStat] ?? 0;
    const instructorStat = effectiveStat(playerGeneral, officerTrainingStat);
    const gain = 16 + Math.floor(instructorStat / 8) + (instructorStat > target[officerTrainingStat] ? 5 : 0);
    const totalXp = beforeXp + gain;
    const statGain = Math.min(100 - target[officerTrainingStat], Math.floor(totalXp / 100));
    const nextXp = statGain > 0 ? totalXp % 100 : Math.min(99, totalXp);
    const nextFavor = Math.min(100, bond.favor + 2);
    setGame(current => {
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - 5,
        generals: current.generals.map(general => general.id === id ? { ...general, [officerTrainingStat]: clampStat(general[officerTrainingStat] + statGain) } : general),
        officerBonds: { ...current.officerBonds, [id]: { ...bond, favor: nextFavor, trainingXp: { ...bond.trainingXp, [officerTrainingStat]: nextXp } } },
        log: current.log,
      };
      const advanced = advanceGameClock(base, 2);
      return { ...advanced, log: [`[장수·전수] ${playerGeneral.name}→${target.name} · ${CORE_STAT_LABELS[officerTrainingStat]} 경험치 ${beforeXp}→${nextXp} (+${gain})${statGain > 0 ? ` · ${CORE_STAT_LABELS[officerTrainingStat]} ${target[officerTrainingStat]}→${target[officerTrainingStat] + statGain}` : ''} · 친밀 +2 · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 2일 소요.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${target.name}에게 ${CORE_STAT_LABELS[officerTrainingStat]} 전수 · 경험치 +${gain}${statGain > 0 ? ` · 능력 +${statGain}` : ''}`);
  }

  function recruitTalent(id: string) {
    const target = game.generals.find(general => general.id === id);
    if (!playerGeneral || !target || target.force !== '재야' || !game.discoveredOfficerIds.includes(id)) {
      flash('등용할 수 있는 재야 장수가 아닙니다.');
      return;
    }
    if (target.city !== playerGeneral.city) {
      flash('플레이 장수가 발견한 인재와 같은 도시에 있어야 등용할 수 있습니다.');
      return;
    }
    if (game.actionPoints < 5) {
      flash(`행동력이 부족합니다. 등용에는 5가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const recruiter = playerGeneral;
    const grade = recruiter?.specialties['등용'] ?? 'C';
    const relation = game.freeOfficerRelations[id] ?? { favor: 0, conversations: 0, gifts: 0 };
    const profileBoost = traitContextBonus(recruiter?.traits ?? [], 'recruit') + tendencyContextBonus(recruiter?.tendencies ?? [], 'recruit');
    const chance = Math.max(15, Math.min(95, Math.round(
      18 + effectiveStat(recruiter, 'personnel') * 0.18 + effectiveStat(recruiter, 'diplomacy') * 0.16 + effectiveStat(recruiter, 'charisma') * 0.12 +
      (specialtyGradeValue(grade) - 50) * 0.2 + profileBoost + relation.favor * 0.45 - effectiveStat(target, 'charisma') * 0.08
    )));
    const roll = stableRoll(`${target.id}-${game.year}-${game.month}-${game.day}-${relation.conversations}-${relation.gifts}-${game.actionPoints}`);
    const success = roll <= chance;
    const loyalty = Math.min(95, Math.max(55, Math.round(55 + relation.favor * 0.25 + effectiveStat(recruiter, 'personnel') * 0.15)));
    setGame(current => {
      const currentPlayer = current.generals.find(general => general.id === current.playerGeneralId);
      if (!currentPlayer) return current;
      const becomingIndependent = success && current.playerStatus === '재야';
      const joinForce = becomingIndependent ? `${currentPlayer.name} 독립대` : current.force;
      const base: GameState = {
        ...current,
        force: becomingIndependent ? joinForce : current.force,
        ruler: becomingIndependent ? '' : current.ruler,
        playerStatus: becomingIndependent ? '독립부대' : current.playerStatus,
        playerMerit: current.playerMerit + (success ? 20 : 3),
        playerFame: Math.min(1000, current.playerFame + (success ? (becomingIndependent ? 25 : 15) : 1)),
        careerHistory: becomingIndependent ? [careerHistoryEntry(current, `${currentPlayer.name} 독립대 결성 · ${target.name} 합류`), ...(current.careerHistory ?? [])].slice(0, 40) : current.careerHistory,
        actionPoints: current.actionPoints - 5,
        generals: current.generals.map(general => {
          if (becomingIndependent && general.id === current.playerGeneralId) return { ...general, force: joinForce, loyalty: 100 };
          if (general.id === id && success) return { ...general, force: joinForce, loyalty, rank: '일반', appointment: '없음', appointmentCityId: undefined };
          return general;
        }),
        freeOfficerRelations: success ? current.freeOfficerRelations : { ...current.freeOfficerRelations, [id]: { ...relation, favor: Math.min(100, relation.favor + 2) } },
        log: current.log,
      };
      const advanced = advanceGameClock(base, 1);
      return { ...advanced, log: [`[인재·등용] ${recruiter.name}→${target.name} · 인사 ${effectiveStat(recruiter, 'personnel')} / 외교 ${effectiveStat(recruiter, 'diplomacy')} / 매력 ${effectiveStat(recruiter, 'charisma')} / 등용 ${grade} / 교분 ${relation.favor} · 성공률 ${chance}% / 판정 ${roll} · ${success ? `성공(충성 ${loyalty})${becomingIndependent ? ' · 독립부대 결성' : ''}` : '실패(교분 +2)'} · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 1일 소요.`, ...advanced.log].slice(0, 200) };
    });
    if (success) setSelectedGeneralId(id);
    flash(success ? `${target.name} 등용 성공 · 충성 ${loyalty}` : `${target.name} 등용 실패 · 성공률 ${chance}%`);
  }

  function tradeSpecialtyGood(goodName: string, mode: 'buy' | 'sell') {
    const city = tradeCity;
    const quantity = Math.max(1, Math.floor(tradeAmount));
    const actionCost = Math.max(1, Math.ceil(quantity / 5));
    if (!city || !playerGeneral) { flash('플레이 장수의 현재 위치를 확인할 수 없습니다.'); return; }
    if (game.actionPoints < actionCost) { flash(`행동력이 부족합니다. 교역에는 AP ${actionCost}가 필요합니다.`); return; }
    const unitPrice = cityTradePrice(city, goodName, mode);
    const totalPrice = unitPrice * quantity;
    const owned = tradeGoodCount(game, goodName);
    if (mode === 'buy' && moneyToCopper(game.personalTreasury) < totalPrice) { flash('개인 자금이 부족합니다.'); return; }
    if (mode === 'sell' && owned < quantity) { flash(`${goodName} 보유량이 부족합니다.`); return; }
    setGame(current => {
      const currentPlayer = current.generals.find(general => general.id === current.playerGeneralId);
      const currentCity = currentPlayer ? current.cities.find(entry => entry.id === currentPlayer.city) : undefined;
      if (!currentCity || current.actionPoints < actionCost || currentCity.id !== city.id) return current;
      const price = cityTradePrice(currentCity, goodName, mode);
      const total = price * quantity;
      const currentOwned = tradeGoodCount(current, goodName);
      if (mode === 'buy' && moneyToCopper(current.personalTreasury) < total) return current;
      if (mode === 'sell' && currentOwned < quantity) return current;
      const tradeGoods = { ...(current.tradeGoods ?? {}), [goodName]: mode === 'buy' ? currentOwned + quantity : currentOwned - quantity };
      const personalCopper = moneyToCopper(current.personalTreasury) + (mode === 'buy' ? -total : total);
      const base: GameState = { ...current, actionPoints: current.actionPoints - actionCost, personalTreasury: copperToMoney(personalCopper), tradeGoods, log: [`[개인 교역·${mode === 'buy' ? '매입' : '판매'}] ${currentCity.name} · ${goodName} ${quantity}묶음 · 단가 ${formatMoney(copperToMoney(price))} · 총 ${formatMoney(copperToMoney(total))} · AP ${actionCost} · ${actionCost}일.`, ...current.log].slice(0, 200) };
      return advanceGameClock(base, actionCost);
    });
    flash(`${playerGeneral.name} · ${city.name}에서 ${goodName} ${quantity}묶음 ${mode === 'buy' ? '매입' : '판매'} 완료`);
  }

  function dispatchTradeCaravan() {
    if (!playerGeneral || !tradeCity || !caravanDestination || !Number.isFinite(caravanDays)) { flash('상단 경로를 선택하세요.'); return; }
    const quantity = Math.max(1, Math.floor(caravanAmount));
    const owned = tradeGoodCount(game, caravanGoodName);
    const actionCost = 4;
    if (owned < quantity) { flash(`${caravanGoodName} 화물이 부족합니다.`); return; }
    if (game.actionPoints < actionCost) { flash(`행동력이 부족합니다. 상단 출발에는 AP ${actionCost}가 필요합니다.`); return; }
    const risk = caravanRiskPercent(caravanDays, playerGeneral, caravanEscort, game.playerStatus, caravanDestination.owner);
    const seed = `${playerGeneral.id}:${tradeCity.id}:${caravanDestination.id}:${caravanGoodName}:${game.year}:${game.month}:${game.day}`;
    const attacked = stableRoll(seed) <= risk;
    const lossRoll = stableRoll(`${seed}:loss`);
    const lostQuantity = attacked ? Math.min(quantity, Math.max(1, Math.floor(quantity * (0.12 + lossRoll / 250)))) : 0;
    const destinationId = caravanDestination.id;
    const destinationName = caravanDestination.name;
    setGame(current => {
      const leader = current.generals.find(general => general.id === current.playerGeneralId);
      if (!leader || leader.city !== tradeCity.id || current.actionPoints < actionCost || tradeGoodCount(current, caravanGoodName) < quantity) return current;
      const escort = caravanEscort ? current.generals.find(general => general.id === caravanEscort.id && general.city === tradeCity.id) : undefined;
      const movedIds = new Set([leader.id, ...(escort ? [escort.id] : [])]);
      const tradeGoods = { ...(current.tradeGoods ?? {}), [caravanGoodName]: Math.max(0, tradeGoodCount(current, caravanGoodName) - lostQuantity) };
      const base: GameState = { ...current, actionPoints: current.actionPoints - actionCost, tradeGoods, generals: current.generals.map(general => movedIds.has(general.id) ? { ...general, city: destinationId } : general) };
      const advanced = advanceGameClock(base, caravanDays);
      const record: TradeJourneyRecord = { id: `trade-${Date.now()}`, leaderId: leader.id, escortId: escort?.id, originCityId: tradeCity.id, targetCityId: destinationId, goodName: caravanGoodName, quantity, lostQuantity, days: caravanDays, risk, attacked, arrivalDate: dateLabel(advanced) };
      const outcome = attacked ? `도적 습격 · ${lostQuantity}묶음 손실` : '무사 도착';
      return { ...advanced, tradeJourneys: [record, ...(advanced.tradeJourneys ?? [])].slice(0, 20), log: [`[상단] ${leader.name} · ${tradeCity.name}→${destinationName} · ${caravanGoodName} ${quantity}묶음 · ${caravanDays}일 · 위험도 ${risk}% · ${escort ? `호위 ${escort.name} · ` : ''}${outcome}.`, ...advanced.log].slice(0, 200) };
    });
    setSelectedCityId(destinationId);
    setTradeDestinationId('');
    flash(attacked ? `${destinationName} 도착 · 도적 습격으로 화물 ${lostQuantity}묶음 손실` : `${destinationName} 상단 도착 · 화물 이상 없음`);
  }

  function buyShopItem(item: Item) {
    if (!tradeCity) {
      flash('현재 장수가 머무는 도시가 없어 상점을 이용할 수 없습니다.');
      return;
    }
    const owned = itemCount(game, item.id);
    const offer = cityShopOffer(game, tradeCity, item);
    if (offer.stock <= 0) {
      flash(`${tradeCity.name}에서는 이번 달 ${item.name} 재고가 모두 소진되었습니다.`);
      return;
    }
    if (item.unique && owned > 0) {
      flash(`${item.name}은 유니크 아이템이라 1개만 보유할 수 있습니다.`);
      return;
    }
    if (moneyToCopper(game.personalTreasury) < offer.priceCopper) {
      flash('개인 자금이 부족합니다.');
      return;
    }
    setGame(current => {
      const currentCity = current.generals.find(general => general.id === current.playerGeneralId)?.city;
      const city = current.cities.find(entry => entry.id === currentCity) ?? tradeCity;
      const currentOffer = cityShopOffer(current, city, item);
      if (currentOffer.stock <= 0 || moneyToCopper(current.personalTreasury) < currentOffer.priceCopper) return current;
      const inventory = addInventoryCopy(current, item.id);
      const key = monthlyShopKey(current, city.id, item.id);
      return {
        ...current,
        ...inventory,
        shopPurchases: { ...(current.shopPurchases ?? {}), [key]: (current.shopPurchases?.[key] ?? 0) + 1 },
        personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) - currentOffer.priceCopper),
        log: [`[개인 상점·구매] ${city.name} · ${item.name} · ${item.type} · ${formatMoney(copperToMoney(currentOffer.priceCopper))} · 남은 재고 ${Math.max(0, currentOffer.stock - 1)} · 보유 ${itemCount(current, item.id)}→${itemCount(current, item.id) + 1}개.`, ...current.log].slice(0, 200),
      };
    });
    flash(`${tradeCity.name} · ${item.name} 구매 완료`);
  }

  function useConsumable(itemId: string) {
    const item = itemCatalog.find(entry => entry.id === itemId);
    const effect = CONSUMABLE_EFFECTS[itemId];
    if (!item || item.type !== '소모품' || !effect || itemCount(game, itemId) <= 0) {
      flash('사용 가능한 소모품이 아닙니다.');
      return;
    }
    if (game.lastConsumableUseDate === dateLabel(game)) {
      flash('소모품 회복은 하루에 한 번만 사용할 수 있습니다.');
      return;
    }
    setGame(current => {
      const beforeAp = current.actionPoints;
      const afterAp = Math.min(MONTHLY_ACTION_POINTS, beforeAp + effect.ap);
      const fameGain = effect.fame ?? 0;
      return {
        ...current,
        ...removeInventoryCopy(current, itemId),
        actionPoints: afterAp,
        playerFame: Math.min(1000, current.playerFame + fameGain),
        lastConsumableUseDate: dateLabel(current),
        log: [`[아이템·사용] ${item.name} · ${effect.label} · 행동력 ${beforeAp}→${afterAp}${fameGain ? ` · 명성 +${fameGain}` : ''} · 오늘의 회복 사용 완료.`, ...current.log].slice(0, 200),
      };
    });
    flash(`${item.name} 사용 · ${effect.label}`);
  }

  function studyBook(itemId: string, targetGeneralId?: string) {
    const item = itemCatalog.find(entry => entry.id === itemId);
    const effects = BOOK_STUDY_EFFECTS[itemId];
    const target = playerGenerals.find(general => general.id === (targetGeneralId ?? officerSelectedGeneral?.id));
    if (!item || item.type !== '책' || !effects || itemCount(game, itemId) <= 0 || !target) {
      flash('연구 가능한 책과 장수를 선택하세요.');
      return;
    }
    if (game.actionPoints < 5) {
      flash(`행동력이 부족합니다. 독서 연구에는 5가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    setGame(current => {
      const currentTarget = current.generals.find(general => general.id === target.id);
      if (!currentTarget || itemCount(current, itemId) <= 0 || current.actionPoints < 5) return current;
      const previousXp = { ...(current.bookStudyXp?.[target.id] ?? {}) };
      const nextXp = { ...previousXp };
      const statGains: Partial<Record<CoreStatKey, number>> = {};
      for (const [key, rawGain] of Object.entries(effects) as Array<[CoreStatKey, number]>) {
        const gain = Number(rawGain) || 0;
        const before = nextXp[key] ?? 0;
        const combined = before + gain;
        const room = Math.max(0, 100 - currentTarget[key]);
        const levelGain = Math.min(room, Math.floor(combined / 100));
        statGains[key] = levelGain;
        nextXp[key] = room <= 0 ? 0 : combined - levelGain * 100;
      }
      const updatedTarget: General = { ...currentTarget };
      (Object.keys(statGains) as CoreStatKey[]).forEach(key => {
        const gain = statGains[key] ?? 0;
        if (gain > 0) updatedTarget[key] = clampStat(updatedTarget[key] + gain);
      });
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - 5,
        bookStudyXp: { ...(current.bookStudyXp ?? {}), [target.id]: nextXp },
        generals: current.generals.map(general => general.id === target.id ? updatedTarget : general),
      };
      const advanced = advanceGameClock(base, 2);
      const gainText = (Object.entries(effects) as Array<[CoreStatKey, number]>).map(([key, gain]) => `${CORE_STAT_LABELS[key]} EXP +${gain}`).join(' · ');
      const levelText = (Object.entries(statGains) as Array<[CoreStatKey, number]>).filter(([, gain]) => gain > 0).map(([key, gain]) => `${CORE_STAT_LABELS[key]} +${gain}`).join(' · ');
      return { ...advanced, log: [`[책·연구] ${target.name} · ${item.name} · ${gainText}${levelText ? ` · 능력 상승 ${levelText}` : ''} · AP 5 · 2일.`, ...advanced.log].slice(0, 200) };
    });
    flash(`${target.name} · ${item.name} 연구 완료`);
  }

  function equipItem(itemId: string, targetGeneralId?: string) {
    const target = playerGenerals.find(general => general.id === (targetGeneralId ?? selectedGeneral?.id));
    const item = ITEMS.find(entry => entry.id === itemId);
    if (!target || !item || itemCount(game, item.id) <= 0 || !EQUIPPABLE_TYPES.includes(item.type)) {
      flash('장착 가능한 보유 장비와 내 세력 무장을 선택하세요.');
      return;
    }
    const wearers = game.generals.filter(general => Object.values(general.equipment).includes(item.id));
    const targetAlready = target.equipment[item.type] === item.id;
    const transferWearer = !targetAlready && wearers.filter(general => general.id !== target.id).length >= itemCount(game, item.id)
      ? wearers.find(general => general.id !== target.id)
      : undefined;
    const replacedItemId = target.equipment[item.type];
    setGame(current => ({
      ...current,
      generals: current.generals.map(general => {
        const equipment = { ...general.equipment };
        if (general.id === transferWearer?.id) {
          const slot = EQUIPPABLE_TYPES.find(type => equipment[type] === item.id);
          if (slot) delete equipment[slot];
        }
        if (general.id === target.id) equipment[item.type] = item.id;
        return { ...general, equipment };
      }),
      log: [`[장비·장착] ${target.name} ← ${item.name}(${item.bonus})${transferWearer ? ` · ${transferWearer.name}에게서 1개 이동` : ''}${replacedItemId && replacedItemId !== item.id ? ` · 기존 ${catalogItem(replacedItemId)?.name ?? '장비'} 해제` : ''}.`, ...current.log].slice(0, 200),
    }));
    flash(`${target.name} · ${item.name} 장착 완료`);
  }

  function unequipItem(itemId: string, wearerId?: string) {
    const item = ITEMS.find(entry => entry.id === itemId);
    const wearer = wearerId
      ? game.generals.find(general => general.id === wearerId && Object.values(general.equipment).includes(itemId))
      : game.generals.find(general => Object.values(general.equipment).includes(itemId));
    if (!item || !wearer) {
      flash('현재 장착 중인 장비가 아닙니다.');
      return;
    }
    setGame(current => ({
      ...current,
      generals: current.generals.map(general => {
        if (general.id !== wearer.id) return general;
        const equipment = { ...general.equipment };
        EQUIPPABLE_TYPES.forEach(type => {
          if (equipment[type] === itemId) delete equipment[type];
        });
        return { ...general, equipment };
      }),
      log: [`[장비·해제] ${wearer.name} → ${item.name} 장착 해제 · 장비는 인벤토리에 유지.`, ...current.log].slice(0, 200),
    }));
    flash(`${wearer.name} · ${item.name} 장착 해제`);
  }

  function giftInventoryItem(itemId: string, targetId: string) {
    const item = ITEMS.find(entry => entry.id === itemId);
    const target = game.generals.find(general => general.id === targetId && general.city === playerGeneral?.city);
    if (!item || !game.ownedItems.includes(itemId) || !target || target.id === playerGeneral?.id) {
      flash('플레이 장수와 같은 도시에서 선물할 대상 장수를 선택하세요.');
      return;
    }
    if (game.actionPoints < 2) {
      flash(`행동력이 부족합니다. 선물에는 2가 필요합니다. 현재 ${game.actionPoints}`);
      return;
    }
    const wearer = game.generals.find(general => Object.values(general.equipment).includes(itemId));
    const giftGain = Math.min(25, 8 + Math.floor(item.priceCopper / 700));
    setGame(current => {
      const currentBond = current.officerBonds[target.id] ?? { favor: 0, talks: 0, gifts: 0, trainingXp: {} };
      const currentFree = current.freeOfficerRelations[target.id] ?? { favor: 0, conversations: 0, gifts: 0 };
      const isFree = target.force === '재야';
      const nextBond = { ...currentBond, favor: Math.min(100, currentBond.favor + giftGain), gifts: currentBond.gifts + 1 };
      const nextFree = { ...currentFree, favor: Math.min(100, currentFree.favor + giftGain), gifts: currentFree.gifts + 1 };
      const base: GameState = {
        ...current,
        actionPoints: current.actionPoints - 2,
        ...removeInventoryCopy(current, itemId),
        generals: removeOneEquippedCopy(current.generals, itemId),
        officerBonds: isFree ? current.officerBonds : { ...current.officerBonds, [target.id]: nextBond },
        freeOfficerRelations: isFree ? { ...current.freeOfficerRelations, [target.id]: nextFree } : current.freeOfficerRelations,
        log: current.log,
      };
      const advanced = advanceGameClock(base, 1);
      return {
        ...advanced,
        log: [`[장비·선물] ${playerGeneral?.name ?? '플레이 장수'}→${target.name}(${target.force}) · ${item.name} 선물${wearer ? ` · ${wearer.name}에게서 자동 해제` : ''} · 친밀/교분 +${giftGain} · 행동력 ${current.actionPoints}→${advanced.actionPoints} · 1일 소요.`, ...advanced.log].slice(0, 200),
      };
    });
    setEquipmentGiftOpen(false);
    setEquipmentGiftTargetId('');
    flash(`${target.name}에게 ${item.name} 선물 완료`);
  }

  function marryCandidate(candidateId: string) {
    if (!playerGeneral) return;
    const candidateGeneral = game.generals.find(general => general.id === candidateId);
    if (!candidateGeneral) { flash('결혼 후보를 찾을 수 없습니다.'); return; }
    const playerProfile = familyOfficerProfile(playerGeneral, customOfficers);
    const candidateProfile = familyOfficerProfile(candidateGeneral, customOfficers);
    const favor = relationshipFavor(candidateId, game.officerBonds, game.freeOfficerRelations);
    const validation = validateMarriage({
      player: playerProfile,
      candidate: candidateProfile,
      year: game.year,
      family: game.family,
      favor,
      actionPoints: game.actionPoints,
      personalMoneyCopper: moneyToCopper(game.personalTreasury),
    });
    if (!validation.ok) { flash(validation.message); return; }

    setGame(current => {
      const currentPlayer = current.generals.find(general => general.id === current.playerGeneralId);
      const currentCandidate = current.generals.find(general => general.id === candidateId);
      if (!currentPlayer || !currentCandidate) return current;
      const currentPlayerProfile = familyOfficerProfile(currentPlayer, customOfficers);
      const currentCandidateProfile = familyOfficerProfile(currentCandidate, customOfficers);
      const currentFavor = relationshipFavor(candidateId, current.officerBonds, current.freeOfficerRelations);
      const currentValidation = validateMarriage({
        player: currentPlayerProfile,
        candidate: currentCandidateProfile,
        year: current.year,
        family: current.family,
        favor: currentFavor,
        actionPoints: current.actionPoints,
        personalMoneyCopper: moneyToCopper(current.personalTreasury),
      });
      if (!currentValidation.ok) return current;

      const marriage = completeMarriage({
        family: current.family,
        player: currentPlayerProfile,
        spouse: currentCandidateProfile,
        date: dateLabel(current),
      });
      const rules = currentValidation.rules;
      const base: GameState = {
        ...current,
        family: marriage.family,
        actionPoints: current.actionPoints - rules.actionPointCost,
        personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) - rules.moneyCostCopper),
        generals: current.generals.map(general => {
          if (general.id === currentPlayer.id) return { ...general, relations: marriage.player.relations ?? general.relations };
          if (general.id === currentCandidate.id) return { ...general, relations: marriage.spouse.relations ?? general.relations };
          return general;
        }),
        careerHistory: [careerHistoryEntry(current, `${currentCandidate.name}과(와) 혼인`), ...(current.careerHistory ?? [])].slice(0, 40),
      };
      const advanced = advanceGameClock(base, rules.dayCost);
      return {
        ...advanced,
        log: [`[가족·혼인] ${marriage.chronicleText} · 친밀/교분 ${currentFavor} · 비용 ${formatMoney(copperToMoney(rules.moneyCostCopper))} · AP ${rules.actionPointCost} · ${rules.dayCost}일.`, ...advanced.log].slice(0, 200),
      };
    });
    flash(`${candidateGeneral.name}과(와) 혼인했습니다.`);
  }

  function planForChild() {
    if (!playerGeneral || !spouse) { flash('먼저 배우자가 필요합니다.'); return; }
    setGame(current => {
      const currentPlayer = current.generals.find(general => general.id === current.playerGeneralId);
      const spouseId = current.family.spousesByOfficerId[current.playerGeneralId] ?? current.family.spouseId;
      const currentSpouse = spouseId ? current.generals.find(general => general.id === spouseId) : undefined;
      if (!currentPlayer || !currentSpouse) return current;
      const playerProfile = familyOfficerProfile(currentPlayer, customOfficers);
      const spouseProfile = familyOfficerProfile(currentSpouse, customOfficers);
      const validation = validateChildPlan({
        family: current.family,
        player: playerProfile,
        spouse: spouseProfile,
        year: current.year,
        actionPoints: current.actionPoints,
        personalMoneyCopper: moneyToCopper(current.personalTreasury),
      });
      if (!validation.ok) { flash(validation.message); return current; }
      const started = beginPregnancy({
        family: current.family,
        mother: validation.mother,
        father: validation.father,
        year: current.year,
        month: current.month,
        day: current.day,
        rules: validation.rules,
      });
      const base: GameState = {
        ...current,
        family: started.family,
        actionPoints: current.actionPoints - validation.rules.actionPointCost,
        personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) - validation.rules.moneyCostCopper),
      };
      const advanced = advanceGameClock(base, validation.rules.dayCost);
      return {
        ...advanced,
        log: [`[가족·자녀계획] ${started.chronicleText} · 비용 ${formatMoney(copperToMoney(validation.rules.moneyCostCopper))} · AP ${validation.rules.actionPointCost} · ${validation.rules.dayCost}일.`, ...advanced.log].slice(0, 200),
      };
    });
    flash('자녀 계획을 시작했습니다. 가족 화면에서 출산 예정일을 확인할 수 있습니다.');
  }

  function raiseChild(childId: string, focus: ParentingFocus) {
    setGame(current => {
      const validation = validateParenting({
        family: current.family,
        childId,
        year: current.year,
        month: current.month,
        day: current.day,
        actionPoints: current.actionPoints,
        personalMoneyCopper: moneyToCopper(current.personalTreasury),
        focus,
      });
      if (!validation.ok) { flash(validation.message); return current; }
      const raised = applyParentingSession({ family: current.family, childId, focus, date: dateLabel(current) });
      const base: GameState = {
        ...current,
        family: raised.family,
        actionPoints: current.actionPoints - validation.rules.actionPointCost,
        personalTreasury: copperToMoney(moneyToCopper(current.personalTreasury) - validation.rules.moneyCostCopper),
      };
      const advanced = advanceGameClock(base, validation.rules.dayCost);
      const statText = Object.entries(raised.statChanges).filter(([, gain]) => Number(gain) > 0).map(([key, gain]) => `${CORE_STAT_LABELS[key as CoreStatKey]} +${gain}`).join(' · ');
      return {
        ...advanced,
        log: [`[가족·육아] ${raised.chronicleText}${statText ? ` · ${statText}` : ''} · AP ${validation.rules.actionPointCost} · ${validation.rules.dayCost}일.`, ...advanced.log].slice(0, 200),
      };
    });
    flash(`${focus} 중심으로 한 달간 육아·교육을 진행했습니다.`);
  }

  function renameChild(childId: string) {
    const child = game.family.children.find(entry => entry.id === childId);
    if (!child) return;
    const nextName = window.prompt('자녀의 새 이름을 입력하세요.', child.name)?.trim();
    if (!nextName || nextName === child.name) return;
    setGame(current => ({
      ...current,
      family: renameFamilyChild(current.family, childId, nextName),
      log: [`[가족] ${child.name}의 이름을 ${nextName.slice(0, 12)}(으)로 정했습니다.`, ...current.log].slice(0, 200),
    }));
    flash(`자녀 이름을 ${nextName.slice(0, 12)}(으)로 변경했습니다.`);
  }

  function designateHeir(childId: string) {
    if (!playerGeneral) return;
    const child = game.family.children.find(entry => entry.id === childId && (entry.fatherId === playerGeneral.id || entry.motherId === playerGeneral.id));
    if (!child) { flash('현재 플레이 장수의 자녀만 후계자로 지정할 수 있습니다.'); return; }
    setGame(current => ({
      ...current,
      family: designateFamilyHeir(current.family, childId, dateLabel(current)),
      log: [`[가족·후계] ${child.name}을(를) 후계자로 지정했습니다.`, ...current.log].slice(0, 200),
    }));
    flash(`${child.name}을(를) 후계자로 지정했습니다.`);
  }

  function holdComingOfAge(childId: string) {
    if (!playerGeneral) return;
    const child = game.family.children.find(entry => entry.id === childId);
    if (!child) return;
    const age = childAgeAtDate(child, game.year, game.month, game.day);
    if (age < 15) { flash('15세가 되어야 성인식을 치를 수 있습니다.'); return; }
    if (child.comingOfAgeDate) { flash('이미 성인식을 마쳤습니다.'); return; }
    setGame(current => {
      const currentPlayer = current.generals.find(general => general.id === current.playerGeneralId);
      const currentChild = current.family.children.find(entry => entry.id === childId);
      if (!currentPlayer || !currentChild) return current;
      const currentAge = childAgeAtDate(currentChild, current.year, current.month, current.day);
      if (currentAge < 15) return current;
      const marked = markChildComingOfAge(current.family, childId, dateLabel(current));
      const updatedChild = marked.child ?? currentChild;
      const officerId = updatedChild.officerId ?? updatedChild.id;
      const existing = current.generals.find(general => general.id === officerId);
      const baseGeneral = childGeneralRecord(updatedChild, current, currentPlayer);
      const localForceRank = getForceRank(current.cities.filter(city => city.owner === currentPlayer.force).length).name;
      const adultGeneral: General = {
        ...(existing ?? baseGeneral),
        name: updatedChild.name,
        birthYear: childBirthYear(updatedChild),
        gender: updatedChild.gender,
        leadership: updatedChild.stats.leadership,
        martial: updatedChild.stats.martial,
        intelligence: updatedChild.stats.intelligence,
        militaryStrategy: updatedChild.stats.militaryStrategy,
        politics: updatedChild.stats.politics,
        diplomacy: updatedChild.stats.diplomacy,
        personnel: updatedChild.stats.personnel,
        charisma: updatedChild.stats.charisma,
        specialties: childSpecialties(updatedChild),
        traits: updatedChild.traits.filter(trait => trait !== '유소년 후계자'),
        tendencies: [...updatedChild.tendencies],
        rank: existing?.rank ?? defaultOfficerRank(updatedChild.stats.leadership, updatedChild.stats.militaryStrategy, localForceRank),
      };
      const generals = existing
        ? current.generals.map(general => general.id === officerId ? adultGeneral : general)
        : [...current.generals, adultGeneral];
      const base: GameState = {
        ...current,
        family: marked.family,
        generals,
        log: [`[가족·성인식] ${marked.chronicleText} · ${dominantParentingFocus(updatedChild)} 중심 교육 · 장수 등록 완료.`, ...current.log].slice(0, 200),
      };
      return advanceGameClock(base, 3);
    });
    flash(`${child.name}의 성인식을 치렀습니다.`);
  }

  function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    flash('현재 진행을 저장했습니다.');
  }

  function resetGame() {
    if (!window.confirm('현재 진행을 초기화할까요? 저장 데이터도 삭제됩니다.'))
      return;
    const fresh = initialState();
    localStorage.removeItem(SAVE_KEY);
    setGame(fresh);
    setSelectedCityId('pingyuan');
    setSelectedGeneralId('liubei');
    setTab('천하');
    flash('새 게임 상태로 초기화했습니다.');
  }

  function openNewCustomOfficer() {
    setEditingCustomId(null);
    setCustomDraft(emptyCustomOfficer());
    setCustomError('');
    setScreen('custom-edit');
  }

  function openCustomOfficer(officer: CustomOfficer) {
    setEditingCustomId(officer.id);
    setCustomDraft({ ...officer });
    setCustomError('');
    setScreen('custom-edit');
  }

  function saveCustomOfficer() {
    const name = customDraft.name.trim();
    if (!name) {
      setCustomError('신무장 이름을 입력해야 합니다.');
      return;
    }
    if (customDraft.traits.length > 10) {
      setCustomError('특성은 최대 10개까지 선택할 수 있습니다.');
      return;
    }
    if (customDraft.tendencies.length > 5) {
      setCustomError('성향은 최대 5개까지 선택할 수 있습니다.');
      return;
    }
    const now = Date.now();
    if (editingCustomId) {
      setCustomOfficers(current =>
        current.map(officer =>
          officer.id === editingCustomId
            ? { ...customDraft, id: editingCustomId, name, updatedAt: now }
            : officer
        )
      );
      flash(`${name} 수정 완료`);
    } else {
      const id = `custom-${now}`;
      setCustomOfficers(current => [
        ...current,
        { ...customDraft, id, name, createdAt: now, updatedAt: now },
      ]);
      flash(`${name} 등록 완료`);
    }
    setScreen('custom-list');
  }

  function openProfilePicker(kind: 'traits' | 'tendencies') {
    setProfilePicker(kind);
    setProfilePickerQuery('');
    setCustomError('');
  }

  function toggleProfileSelection(kind: 'traits' | 'tendencies', value: string) {
    const selected = kind === 'traits' ? customDraft.traits : customDraft.tendencies;
    const limit = kind === 'traits' ? 10 : 5;
    if (selected.includes(value)) {
      setCustomDraft(current => kind === 'traits'
        ? { ...current, traits: current.traits.filter(entry => entry !== value) }
        : { ...current, tendencies: current.tendencies.filter(entry => entry !== value) });
      setCustomError('');
      return;
    }
    if (selected.length >= limit) {
      setCustomError(`${kind === 'traits' ? '특성' : '성향'}은 최대 ${limit}개까지 선택할 수 있습니다.`);
      return;
    }
    setCustomDraft(current => kind === 'traits'
      ? { ...current, traits: [...current.traits, value] }
      : { ...current, tendencies: [...current.tendencies, value] });
    setCustomError('');
  }

  function deleteCustomOfficer(id: string) {
    const officer = customOfficers.find(entry => entry.id === id);
    if (!officer) return;
    if (!window.confirm(`${officer.name}을(를) 삭제할까요?`)) return;
    setCustomOfficers(current => current.filter(entry => entry.id !== id));
    setCheckedCustomIds(current => current.filter(entry => entry !== id));
    setScreen('custom-list');
    flash(`${officer.name} 삭제 완료`);
  }

  function deleteCheckedCustomOfficers() {
    if (checkedCustomIds.length === 0) {
      flash('삭제할 신무장을 체크하세요.');
      return;
    }
    if (!window.confirm(`선택한 신무장 ${checkedCustomIds.length}명을 삭제할까요?`)) return;
    setCustomOfficers(current =>
      current.filter(officer => !checkedCustomIds.includes(officer.id))
    );
    setCheckedCustomIds([]);
    flash('선택한 신무장을 삭제했습니다.');
  }

  function openItemEditor(item?: Item) {
    if (item?.custom) { setEditingCustomItemId(item.id); setCustomItemDraft({ ...item, bonuses: { ...item.bonuses } }); const firstStat = (Object.keys(item.bonuses)[0] as CoreStatKey | undefined) ?? 'martial'; setCustomItemStat(firstStat); setCustomItemStatValue(item.bonuses[firstStat] ?? 0); }
    else { setEditingCustomItemId(null); setCustomItemDraft(emptyCustomItem()); setCustomItemStat('martial'); setCustomItemStatValue(1); }
    setCustomItemError(''); setScreen('item-editor');
  }

  function saveCustomItem() {
    const name = customItemDraft.name.trim(); if (!name) { setCustomItemError('아이템 이름을 입력하세요.'); return; }
    const id = editingCustomItemId ?? `custom-item-${Date.now()}`; const statValue = Math.max(0, Math.min(10, Math.floor(customItemStatValue)));
    const item: Item = { ...customItemDraft, id, name, custom: true, bonuses: statValue > 0 ? { [customItemStat]: statValue } : {}, priceCopper: Math.max(0, Math.floor(customItemDraft.priceCopper)) };
    setCustomItems(current => editingCustomItemId ? current.map(entry => entry.id === editingCustomItemId ? item : entry) : [...current, item]); setEditingCustomItemId(id); setCustomItemDraft(item); flash(`${name} 아이템 저장 완료`);
  }

  function deleteCustomItem() { if (!editingCustomItemId) return; const item = customItems.find(entry => entry.id === editingCustomItemId); if (!item || !window.confirm(`${item.name}을(를) 삭제할까요?`)) return; setCustomItems(current => current.filter(entry => entry.id !== editingCustomItemId)); setEditingCustomItemId(null); setCustomItemDraft(emptyCustomItem()); flash(`${item.name} 삭제 완료`); }

  function startNewGame() {
    const historic = selectedNewHistoricOfficer;
    const custom = selectedNewCustomOfficer;
    if (!historic && !custom) {
      flash('주인공/장수를 선택하세요.');
      return;
    }
    if (canChooseStartCity && !selectedStartCityId) {
      flash('전국 지도에서 시작 도시를 선택하세요.');
      return;
    }
    const name = historic?.name ?? custom!.name;
    const stats = historic ?? custom!;
    const historicPlacement = historic ? getOfficerPlacement(historic.id, selectedEra.year) : null;
    const startingAllies = customOfficers.filter(officer => selectedStartingCustomIds.includes(officer.id) && officer.id !== stats.id);
    const freeStart = historicPlacement ? historicPlacement.force === '재야' : custom!.force === '재야';
    const independentStart = freeStart && startingAllies.length > 0;
    const force = freeStart ? (independentStart ? `${name} 독립대` : '재야') : (historicPlacement?.force ?? custom!.force);
    const cityId = canChooseStartCity
      ? selectedStartCityId
      : (historicPlacement?.city ?? custom!.city);
    const fresh = initialState(selectedEra.year);
    const safeCityId = fresh.cities.some(city => city.id === cityId) ? cityId : 'pingyuan';
    const cities = fresh.cities.map(city => ({ ...city }));
    const baseForceColors = buildForceColorMap(fresh.cities);
    const usedBaseColors = new Set(Object.values(baseForceColors));
    const chosenNewForceColor = selectedNewForceColor && !usedBaseColors.has(selectedNewForceColor) ? selectedNewForceColor : FORCE_COLOR_PALETTE.find(color => !usedBaseColors.has(color)) ?? '#475569';
    const forceColors = buildForceColorMap(cities, baseForceColors, independentStart ? force : undefined, independentStart ? chosenNewForceColor : undefined);
    const existingGeneral = fresh.generals.find(general => general.id === stats.id);
    const generalRecord: General = {
      id: stats.id,
      name,
      birthYear: stats.birthYear,
      birthYearEstimated: historic?.birthYearEstimated,
      gender: historic?.gender ?? custom!.gender,
      deathYear: historic?.deathYear ?? ((custom?.birthYear ?? selectedEra.year - 25) + 70),
      force,
      city: safeCityId,
      leadership: stats.leadership,
      martial: stats.martial,
      intelligence: stats.intelligence,
      militaryStrategy: stats.militaryStrategy,
      politics: stats.politics,
      diplomacy: stats.diplomacy,
      personnel: stats.personnel,
      charisma: stats.charisma,
      specialties: { ...stats.specialties },
      traits: [...stats.traits],
      tendencies: [...stats.tendencies],
      relations: [...stats.relations],
      loyalty: freeStart ? 0 : 100,
      equipment: existingGeneral?.equipment ?? {},
      rank: freeStart ? '일반' : defaultOfficerRank(stats.leadership, stats.militaryStrategy, getForceRank(cities.filter(city => city.owner === force).length).name),
      appointment: '없음',
    };
    const mainGenerals = existingGeneral
      ? fresh.generals.map(general => (general.id === stats.id ? generalRecord : general))
      : [...fresh.generals, generalRecord];
    const allyRecords: General[] = startingAllies.map(officer => ({
      id: officer.id,
      name: officer.name,
      birthYear: officer.birthYear,
      gender: officer.gender,
      deathYear: officer.birthYear + 70,
      force,
      city: safeCityId,
      leadership: officer.leadership,
      martial: officer.martial,
      intelligence: officer.intelligence,
      militaryStrategy: officer.militaryStrategy,
      politics: officer.politics,
      diplomacy: officer.diplomacy,
      personnel: officer.personnel,
      charisma: officer.charisma,
      specialties: { ...officer.specialties },
      traits: [...officer.traits],
      tendencies: [...officer.tendencies],
      relations: [...officer.relations],
      loyalty: 100,
      equipment: {},
      rank: independentStart ? '일반' : defaultOfficerRank(officer.leadership, officer.militaryStrategy, getForceRank(cities.filter(city => city.owner === force).length).name),
      appointment: '없음',
    }));
    const generals = seedFamousEquipment([
      ...mainGenerals.filter(general => !startingAllies.some(ally => ally.id === general.id)),
      ...allyRecords,
    ]);
    const scenarioRuler = freeStart ? '' : inferForceRulerName(force, generals);
    const playerStatus: PlayerStatus = freeStart ? (independentStart ? '독립부대' : '재야') : scenarioRuler === name ? '군주' : '소속장수';
    const ownedItems = Array.from(new Set(['bronze-sword', ...famousItemsForForce(generals, force)]));
    const startingRankIndex = Math.max(0, OFFICER_RANKS.findIndex(entry => entry.name === generalRecord.rank));
    const startingMerit = playerStatus === '군주' ? 1200 : playerStatus === '소속장수' ? startingRankIndex * 140 : 0;
    const startingFame = playerStatus === '군주' ? 450 : playerStatus === '독립부대' ? 160 : playerStatus === '재야' ? 40 : 120;
    setGame({
      ...fresh,
      ownedItems,
      itemQuantities: Object.fromEntries(ownedItems.map(id => [id, 1])),
      armies: [],
      year: selectedEra.year,
      force,
      ruler: playerStatus === '군주' ? name : scenarioRuler,
      playerGeneralId: stats.id,
      playerStatus,
      playerMerit: startingMerit,
      playerFame: startingFame,
      careerHistory: [`${selectedEra.year}년 1월 1일 · ${name} · ${playerStatus} 신분으로 생애 시작`],
      activeMission: undefined,
      missionHistory: [],
      personalGoal: undefined,
      claimedPersonalGoals: [],
      personalTreasury: { gold: 5, silver: 0, copper: 0 },
      tradeJourneys: [],
      forceColors,
      cities,
      generals,
      discoveredOfficerIds: [],
      log: [
        `${selectedEra.year}년 ${selectedEra.title}, ${name}이(가) ${fresh.cities.find(city => city.id === safeCityId)?.name ?? '선택 도시'}에서 ${playerStatus} 신분으로 이야기를 시작했다.`,
        ...(startingAllies.length > 0 ? [`[편성] 신무장 ${startingAllies.map(officer => officer.name).join(', ')}이(가) 시작 세력에 합류했다.`] : []),
      ],
    });
    setSelectedCityId(safeCityId);
    setSelectedGeneralId(stats.id);
    setTab('천하');
    setScreen('game');
  }

  function addGeneral() {
    const clean = editorName.trim();
    if (!clean) {
      setEditorError('무장 이름을 입력해야 합니다.');
      return;
    }
    const id = `custom-${Date.now()}`;
    const cityId = playerCities[0]?.id ?? game.cities[0]?.id ?? '';
    setGame(current => ({
      ...current,
      generals: [
        ...current.generals,
        {
          id,
          name: clean,
          birthYear: current.year - 25,
          force: current.force,
          city: cityId,
          leadership: 70,
          martial: 70,
          intelligence: 70,
          militaryStrategy: 70,
          politics: 70,
          diplomacy: 70,
          personnel: 70,
          charisma: 70,
          specialties: createDefaultSpecialties('C'),
          traits: ['신무장'],
          tendencies: ['신중'],
          relations: [],
          loyalty: 100,
          equipment: {},
          rank: '일반',
          appointment: '없음',
        },
      ],
      log: [`에디터로 신규 무장 ${clean}을 추가했다.`, ...current.log].slice(
        0,
        200
      ),
    }));
    setEditorName('');
    setEditorError('');
    setSelectedGeneralId(id);
    flash(`${clean} 추가 완료`);
  }

  function editGameGeneralStat(field: CoreStatKey | 'loyalty', value: number) {
    if (!selectedGeneral) return;
    setGame(current => ({ ...current, generals: current.generals.map(general => general.id === selectedGeneral.id ? { ...general, [field]: clampStat(value) } : general) }));
  }

  function editGameGeneralSpecialty(key: SpecialtyKey, value: (typeof SPECIALTY_GRADES)[number]) {
    if (!selectedGeneral) return;
    setGame(current => ({ ...current, generals: current.generals.map(general => general.id === selectedGeneral.id ? { ...general, specialties: { ...general.specialties, [key]: value } } : general) }));
  }

  function editGameGeneralCity(cityId: string) {
    if (!selectedGeneral) return;
    setGame(current => ({ ...current, generals: current.generals.map(general => general.id === selectedGeneral.id ? { ...general, city: cityId } : general) }));
  }

  function editGameGeneralRank(rank: OfficerRank) {
    if (!selectedGeneral || selectedGeneral.name === game.ruler) return;
    assignPersonnel(selectedGeneral.id, rank, selectedGeneral.appointment, selectedGeneral.appointmentCityId, '에디터·인사');
  }

  function editGameGeneralAppointment(appointment: OfficerAppointment, cityId?: string) {
    if (!selectedGeneral || selectedGeneral.name === game.ruler) return;
    assignPersonnel(selectedGeneral.id, selectedGeneral.rank, appointment, cityId ?? selectedGeneral.appointmentCityId ?? selectedGeneral.city, '에디터·인사');
  }

  function toggleGameProfileSelection(kind: 'traits' | 'tendencies', value: string) {
    if (!selectedGeneral) return;
    const selected = kind === 'traits' ? selectedGeneral.traits : selectedGeneral.tendencies;
    const limit = kind === 'traits' ? 10 : 5;
    if (!selected.includes(value) && selected.length >= limit) {
      flash(`${kind === 'traits' ? '특성' : '성향'}은 최대 ${limit}개까지 편집할 수 있습니다.`);
      return;
    }
    setGame(current => ({
      ...current,
      generals: current.generals.map(general => {
        if (general.id !== selectedGeneral.id) return general;
        const currentValues = kind === 'traits' ? general.traits : general.tendencies;
        const next = currentValues.includes(value) ? currentValues.filter(entry => entry !== value) : [...currentValues, value];
        return kind === 'traits' ? { ...general, traits: next } : { ...general, tendencies: next };
      }),
    }));
  }

  function toggleEditorItem(itemId: string) {
    const owned = game.ownedItems.includes(itemId);
    setGame(current => ({
      ...current,
      ownedItems: owned ? current.ownedItems.filter(id => id !== itemId) : [...current.ownedItems, itemId],
      generals: owned ? current.generals.map(general => {
        const equipment = { ...general.equipment };
        (Object.keys(equipment) as ItemType[]).forEach(type => { if (equipment[type] === itemId) delete equipment[type]; });
        return { ...general, equipment };
      }) : current.generals,
    }));
  }

  function editSelectedCity(
    field: 'commerce' | 'agriculture' | 'security' | 'defense' | 'training' | 'troops',
    value: number
  ) {
    if (!selectedCity) return;
    setGame(current => ({
      ...current,
      cities: current.cities.map(city =>
        city.id === selectedCity.id
          ? {
              ...city,
              [field]:
                field === 'troops'
                  ? Math.max(0, Math.round(value))
                  : clampStat(value),
            }
          : city
      ),
    }));
  }

  function renderCitySelector(ownCitiesOnly = false) {
    const selectableCities = ownCitiesOnly ? managedCities : game.cities;
    if (ownCitiesOnly && selectableCities.length === 0) return <span className="role-chip">개인 행동 모드 · 관리 도시 없음</span>;
    const selectorValue = selectableCities.some(city => city.id === selectedCityId) ? selectedCityId : selectableCities[0]?.id ?? '';
    return (
      <div className="selector-row">
        <span className="muted">도시 선택</span>
        <select
          value={selectorValue}
          onChange={event => setSelectedCityId(event.target.value)}
        >
          {selectableCities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name} · {city.owner}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (screen === 'title') {
    return (
      <div className="title-screen">
        {notice && <div className="toast">{notice}</div>}
        <div className="title-crest">漢</div>
        <div className="title-copy">
          <span className="eyebrow">THREE KINGDOMS STRATEGY</span>
          <h1>삼국지</h1>
          <p>천하의 흐름 속에서 한 명의 장수로 살아가는 전략 시뮬레이션</p>
        </div>
        <div className="title-menu">
          <button className="title-menu-primary" onClick={() => setScreen('era')}>새 게임</button>
          <button disabled={!hasSave} onClick={() => setScreen('game')}>
            이어서하기 {!hasSave && <small>저장 데이터 없음</small>}
          </button>
          <button onClick={() => setScreen('custom-list')}>신무장</button>
          <button onClick={() => openItemEditor()}>아이템 에디터</button>
          <button onClick={() => setScreen('settings')}>설정</button>
        </div>
        <div className="title-version">Prototype 0.2</div>
      </div>
    );
  }

  if (screen === 'item-editor') {
    return <div className="manager-screen">{notice && <div className="toast">{notice}</div>}<header className="setup-header"><div><span className="eyebrow">ITEM EDITOR</span><h1>아이템 에디터</h1></div><button onClick={() => setScreen('title')}>타이틀로</button></header><main className="item-editor-grid"><section className="panel item-editor-form"><div className="big-title"><h3>{editingCustomItemId ? '아이템 수정' : '새 아이템 추가'}</h3><span>기본 아이템은 보호되며 직접 만든 아이템만 수정·삭제합니다.</span></div><div className="custom-form-grid"><label>이름<input value={customItemDraft.name} onChange={event => setCustomItemDraft(current => ({ ...current, name: event.target.value }))} /></label><label>분류<select value={customItemDraft.type} onChange={event => setCustomItemDraft(current => ({ ...current, type: event.target.value as ItemType }))}>{SHOP_CATEGORIES.filter(category => category !== '전체').map(category => <option key={category}>{category}</option>)}</select></label><label>가격(동)<input type="number" min="0" value={customItemDraft.priceCopper} onChange={event => setCustomItemDraft(current => ({ ...current, priceCopper: Number(event.target.value) }))} /></label><label>효과 설명<input value={customItemDraft.bonus} onChange={event => setCustomItemDraft(current => ({ ...current, bonus: event.target.value }))} /></label><label>능력<select value={customItemStat} onChange={event => setCustomItemStat(event.target.value as CoreStatKey)}>{(Object.keys(CORE_STAT_LABELS) as CoreStatKey[]).map(key => <option key={key} value={key}>{CORE_STAT_LABELS[key]}</option>)}</select></label><label>증가치<input type="number" min="0" max="10" value={customItemStatValue} onChange={event => setCustomItemStatValue(Number(event.target.value))} /></label></div><div className="item-editor-checks"><label><input type="checkbox" checked={customItemDraft.unique ?? false} onChange={event => setCustomItemDraft(current => ({ ...current, unique: event.target.checked }))} /> 유니크 1개 제한</label><label><input type="checkbox" checked={customItemDraft.shop !== false} onChange={event => setCustomItemDraft(current => ({ ...current, shop: event.target.checked }))} /> 상점 판매</label></div>{customItemError && <div className="form-error">{customItemError}</div>}<div className="custom-editor-actions"><button onClick={() => openItemEditor()}>새 항목</button>{editingCustomItemId && <button className="danger" onClick={deleteCustomItem}>삭제</button>}<button className="gold" onClick={saveCustomItem}>저장</button></div></section><aside className="panel item-editor-list"><div className="equipment-inventory-head"><div><span className="eyebrow">CUSTOM ITEMS</span><h3>추가 아이템</h3></div><strong>{customItems.length}</strong></div>{customItems.length === 0 ? <div className="empty">추가한 아이템이 없습니다.</div> : customItems.map(item => <button key={item.id} className={editingCustomItemId === item.id ? 'selected' : ''} onClick={() => openItemEditor(item)}><strong>{item.name}</strong><span>{item.type} · {item.bonus || '효과 없음'}</span><small>{formatMoney(copperToMoney(item.priceCopper))} · {item.unique ? '유니크' : '복수 보유'}</small></button>)}</aside></main></div>;
  }

  if (screen === 'era') {
    return (
      <div className="setup-screen selection-screen">
        <header className="setup-header">
          <div><span className="eyebrow">NEW GAME 01</span><h1>시대 선택</h1></div>
          <button onClick={() => setScreen('title')}>타이틀로</button>
        </header>
        <main className="setup-content selection-viewport">
          <div className="step-line"><strong>01 시대 선택</strong><span>02 장수 선택</span><span>03 도시 선택</span></div>
          <div className="era-selection-shell">
            <section className="selection-hero era-preview" data-era-image-key={selectedEra.id}>
              <div className="selection-image-placeholder era-image-placeholder">
                <img src={scenarioImagePath(selectedEra.id)} alt={`${selectedEra.title} 시나리오 이미지`} onError={event => { event.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="selection-copy">
                <span>{selectedEra.year}년</span>
                <h2>{selectedEra.title}</h2>
                <strong>{selectedEra.subtitle}</strong>
                <p>{selectedEra.description}</p>
              </div>
            </section>
            <aside className="selection-list-panel era-list-panel">
              <div className="selection-list-head"><strong>시대 목록</strong><span>{SCENARIOS.length}개 시나리오</span></div>
              <div className="selection-scroll era-list-scroll">
                {SCENARIOS.map(era => (
                  <button
                    key={era.id}
                    className={`era-list-row ${selectedEraId === era.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEraId(era.id)}
                  >
                    <span>{era.year}</span>
                    <div><strong>{era.title}</strong><small>{era.subtitle}</small></div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
          <div className="setup-actions selection-actions">
            <button onClick={() => setScreen('title')}>뒤로</button>
            <button className="gold" onClick={() => { setNewGameOfficerId(''); setScreen('officer'); }}>다음 · 장수 선택</button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === 'officer') {
    const previewOfficer = selectedNewHistoricOfficer ?? selectedNewCustomOfficer;
    const previewPlacement = selectedNewHistoricOfficer ? getOfficerPlacement(selectedNewHistoricOfficer.id, selectedEra.year) : null;
    const previewForce = previewPlacement?.force ?? selectedNewCustomOfficer?.force ?? '미선택';
    const previewCityId = previewPlacement?.city ?? selectedNewCustomOfficer?.city ?? '';
    const previewCity = buildScenarioCities(selectedEra.year).find(city => city.id === previewCityId);
    const previewTraits = selectedNewHistoricOfficer?.traits ?? (selectedNewCustomOfficer?.traits ?? (selectedNewCustomOfficer ? ['신무장'] : []));
    const previewTendencies = selectedNewHistoricOfficer?.tendencies ?? (selectedNewCustomOfficer?.tendencies ?? []);
    const previewEliteSpecialties = previewOfficer ? SPECIALTY_KEYS.filter(key => ['A', 'S'].includes(previewOfficer.specialties[key])).slice(0, 8) : [];
    return (
      <div className="setup-screen selection-screen">
        <header className="setup-header">
          <div><span className="eyebrow">NEW GAME 02</span><h1>장수 선택</h1></div>
          <button onClick={() => setScreen('title')}>타이틀로</button>
        </header>
        <main className="setup-content selection-viewport">
          <div className="step-line"><span>01 시대 선택</span><strong>02 장수 선택</strong><span>03 도시 선택</span></div>
          <div className="officer-selection-shell">
            <section className="officer-preview-panel" data-officer-image-key={selectedNewHistoricOfficer?.portraitKey ?? selectedNewCustomOfficer?.id ?? ''}>
              <div className="officer-preview-image">
                {selectedNewHistoricOfficer && <img src={officerFullbodyPath(selectedNewHistoricOfficer.id)} alt={`${selectedNewHistoricOfficer.name} 전신`} onError={event => { const portrait = officerPortraitPath(selectedNewHistoricOfficer.id); if (portrait && event.currentTarget.src !== new URL(portrait, window.location.href).href) event.currentTarget.src = portrait; else event.currentTarget.style.display = 'none'; }} />}
                <div className="image-fallback-copy"><span>{previewOfficer ? previewOfficer.name.slice(0, 1) : '?'}</span><small>{selectedNewHistoricOfficer ? `${historicOfficerImageNumber(selectedNewHistoricOfficer.id)}번 장수 이미지` : '장수 이미지'}</small></div>
              </div>
              <div className="officer-preview-copy">
                <span>{selectedEra.year}년 · {selectedEra.title}</span>
                <h2>{previewOfficer?.name ?? '장수를 선택하세요'}</h2>
                {previewOfficer && <strong>{previewOfficer.courtesyName ? `자 ${previewOfficer.courtesyName}` : '자 없음'} · {officerAgeText(previewOfficer.birthYear, 'birthYearEstimated' in previewOfficer ? previewOfficer.birthYearEstimated : false, selectedEra.year)} · {previewForce} · {previewCity?.name ?? '거점 미정'}</strong>}
                {previewOfficer && (
                  <>
                    <section className="preview-section">
                      <div className="preview-section-title">장수 능력</div>
                      <div className="preview-stat-grid">
                        <div><span>통솔</span><strong>{previewOfficer.leadership}</strong></div>
                        <div><span>무력</span><strong>{previewOfficer.martial}</strong></div>
                        <div><span>지략</span><strong>{previewOfficer.intelligence}</strong></div>
                        <div><span>군략</span><strong>{previewOfficer.militaryStrategy}</strong></div>
                        <div><span>정치</span><strong>{previewOfficer.politics}</strong></div>
                        <div><span>외교</span><strong>{previewOfficer.diplomacy}</strong></div>
                        <div><span>인사</span><strong>{previewOfficer.personnel}</strong></div>
                        <div><span>매력</span><strong>{previewOfficer.charisma}</strong></div>
                      </div>
                      <div className="preview-specialties">
                        <strong>전문 능력</strong>
                        <div className="preview-specialty-tags">
                          {previewEliteSpecialties.length
                            ? previewEliteSpecialties.map(key => <span key={key}>{key} {previewOfficer.specialties[key]}</span>)
                            : <em>눈에 띄는 전문 능력이 없습니다.</em>}
                        </div>
                      </div>
                    </section>
                    <section className="preview-section">
                      <div className="preview-section-title">특성</div>
                      <div className="preview-meta-list">
                        {previewTraits.length
                          ? previewTraits.map(trait => {
                              const option = TRAIT_OPTIONS.find(entry => entry.name === trait);
                              return <button type="button" className="preview-meta-chip" key={trait} title={option?.effect ?? trait} onClick={() => openOfficerDetailModal('trait', trait)}>{trait}</button>;
                            })
                          : <em>등록된 특성이 없습니다.</em>}
                      </div>
                    </section>
                    <section className="preview-section">
                      <div className="preview-section-title">성향</div>
                      <div className="preview-meta-list">
                        {previewTendencies.length
                          ? previewTendencies.map(tendency => {
                              const option = TENDENCY_OPTIONS.find(entry => entry.name === tendency);
                              return <button type="button" className="preview-meta-chip" key={tendency} title={option?.effect ?? tendency} onClick={() => openOfficerDetailModal('tendency', tendency)}>{tendency}</button>;
                            })
                          : <em>등록된 성향이 없습니다.</em>}
                      </div>
                    </section>
                  </>
                )}
                {!previewOfficer && <p className="preview-empty-copy">오른쪽 목록에서 역사 인물 또는 등록한 신무장을 선택하세요.</p>}
              </div>
            </section>
            <aside className="selection-list-panel officer-list-panel">
              <div className="officer-list-search">
                <div><strong>장수 목록</strong><span>{availableHistoricOfficers.length + customOfficers.length}명 표시</span></div>
                <input aria-label="장수 검색" placeholder="이름 · 자 · 세력 검색" value={officerQuery} onChange={event => setOfficerQuery(event.target.value)} />
              </div>
              <div className="officer-list-columns"><span>장수</span><span>소속</span><span>나이</span><span>성별</span></div>
              <div className="selection-scroll officer-list-scroll">
                {availableHistoricOfficers.map(officer => {
                  const placement = getOfficerPlacement(officer.id, selectedEra.year);
                  return (
                    <button key={officer.id} className={`officer-list-row ${newGameOfficerId === officer.id ? 'selected' : ''}`} onClick={() => setNewGameOfficerId(officer.id)}>
                      <span className="officer-list-initial"><img src={officerPortraitPath(officer.id)} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /><b>{officer.name.slice(0, 1)}</b></span>
                      <div className="officer-list-name"><strong>{officer.name}</strong><small>{officer.courtesyName ? `자 ${officer.courtesyName}` : historicOfficerImageNumber(officer.id)}</small></div>
                      <span className="officer-list-force">{placement.force}</span>
                      <span className="officer-list-age">{officerAgeText(officer.birthYear, officer.birthYearEstimated, selectedEra.year)}</span>
                      <em>{officer.gender}</em>
                    </button>
                  );
                })}
                {customOfficers.map(officer => (
                  <button key={officer.id} className={`officer-list-row custom ${newGameOfficerId === officer.id ? 'selected' : ''}`} onClick={() => setNewGameOfficerId(officer.id)}>
                    <span className="officer-list-initial"><b>新</b></span>
                    <div className="officer-list-name"><strong>{officer.name}</strong><small>{officer.courtesyName ? `자 ${officer.courtesyName}` : '신무장'}</small></div>
                    <span className="officer-list-force">{officer.force}</span>
                    <span className="officer-list-age">{ageAtYear(officer.birthYear, selectedEra.year) ? `${ageAtYear(officer.birthYear, selectedEra.year)}세` : '-'}</span>
                    <em>{officer.gender}</em>
                  </button>
                ))}
              </div>
              <div className="selection-list-foot">역사 DB {HISTORICAL_DATA_SUMMARY.officers}명 · 참조 풀 184년 {HISTORICAL_DATA_SUMMARY.reference184Pool}명 / 221년 {HISTORICAL_DATA_SUMMARY.reference221Pool}명 · 목록은 마우스 휠/스크롤바로 이동</div>
            </aside>
          </div>
          <div className="setup-actions selection-actions">
            <button onClick={() => setScreen('era')}>뒤로</button>
            <button className="gold" disabled={!newGameOfficerId} onClick={() => setScreen('map')}>다음 · 도시 선택</button>
          </div>
        </main>
        {officerDetailModal && <div className="preview-profile-modal-backdrop" onMouseDown={() => setOfficerDetailModal(null)}><div className="preview-profile-modal" role="dialog" aria-modal="true" aria-label={`${officerDetailModal.kind === 'trait' ? '특성' : '성향'} 상세`} onMouseDown={event => event.stopPropagation()}><button type="button" className="preview-profile-modal-close" onClick={() => setOfficerDetailModal(null)} aria-label="모달 닫기">×</button><div className="preview-profile-modal-head"><span className="eyebrow">{officerDetailModal.kind === 'trait' ? 'TRAIT DETAIL' : 'TENDENCY DETAIL'}</span><h2>{officerDetailModal.option.name}</h2><strong>{officerDetailModal.kind === 'trait' ? '특성' : '성향'} · {officerDetailModal.option.category}</strong></div><div className="preview-profile-modal-body"><div className="preview-profile-modal-row"><span>분류</span><strong>{officerDetailModal.option.category}</strong></div><div className="preview-profile-modal-row"><span>효과</span><strong>{officerDetailModal.option.effect}</strong></div><div className="preview-profile-modal-copy"><h3>설명</h3><p>{officerDetailModal.option.description}</p></div></div><div className="preview-profile-modal-actions"><button className="gold" onClick={() => setOfficerDetailModal(null)}>닫기</button></div></div></div>}
      </div>
    );
  }

  if (screen === 'map') {
    const scenarioCities = buildScenarioCities(selectedEra.year);
    const fixedStartCityId = selectedHistoricPlacement?.city ?? selectedNewCustomOfficer?.city ?? '';
    const activeStartCityId = canChooseStartCity ? selectedStartCityId : fixedStartCityId;
    const scenarioForceColors = buildForceColorMap(scenarioCities);
    const usedScenarioColors = new Set(Object.values(scenarioForceColors));
    const availableStartColors = FORCE_COLOR_PALETTE.filter(color => !usedScenarioColors.has(color));
    const activeNewForceColor = selectedNewForceColor && availableStartColors.includes(selectedNewForceColor) ? selectedNewForceColor : availableStartColors[0] ?? '#475569';
    const cityRegions = ['전체 지역', ...Array.from(new Set(scenarioCities.map(city => city.region)))];
    const cityQuery = cityListQuery.trim().toLowerCase();
    const filteredScenarioCities = scenarioCities.filter(city => {
      if (cityRegionFilter !== '전체 지역' && city.region !== cityRegionFilter) return false;
      if (!cityQuery) return true;
      return [city.name, city.region, city.owner].some(value => value.toLowerCase().includes(cityQuery));
    });
    const highlightedCityId = cityPreviewCityId || activeStartCityId || fixedStartCityId || scenarioCities[0]?.id || '';
    const listPreviewCity = scenarioCities.find(city => city.id === highlightedCityId) ?? scenarioCities[0] ?? null;
    const formatCityOwner = (city: typeof scenarioCities[number]) => city.owner === '재야' ? '없음' : city.owner.endsWith('군') ? city.owner.slice(0, -1) : city.owner;
    const focusCity = (cityId: string) => {
      setCityPreviewCityId(cityId);
      if (canChooseStartCity) setSelectedStartCityId(cityId);
    };
    return (
      <div className="setup-screen" data-map-resource={FUTURE_WORLD_MAP_RESOURCE_PATH}>
        <header className="setup-header">
          <div><span className="eyebrow">NEW GAME 03</span><h1>도시 선택</h1></div>
          <button onClick={() => setScreen('title')}>타이틀로</button>
        </header>
        <main className="setup-content city-select-rework">
          <div className="step-line"><span>01 시대 선택</span><span>02 장수 선택</span><strong>03 도시 선택</strong></div>
          <aside className="city-selection-sidebar">
            <div className="city-selection-sidebar-head"><strong>도시 목록</strong></div>
            <div className="city-selection-sidebar-body">
              <div className="city-selection-filters">
                <input aria-label="도시명 검색" placeholder="도시명으로 검색..." value={cityListQuery} onChange={event => setCityListQuery(event.target.value)} />
                <select aria-label="지역 필터" value={cityRegionFilter} onChange={event => setCityRegionFilter(event.target.value)}>
                  {cityRegions.map(region => <option key={region} value={region}>{region}</option>)}
                </select>
              </div>
              {listPreviewCity ? <div className="city-selection-preview-card">
                <div className="city-selection-preview-art"><img src={cityArtworkPath(listPreviewCity)} alt={`${listPreviewCity.name} 전경`} onError={event => { event.currentTarget.src = cityDetailPath(listPreviewCity); }} /></div>
                <div className="city-selection-preview-meta">
                  <div className="city-selection-preview-title"><strong>{listPreviewCity.name}</strong><span>{listPreviewCity.region}</span></div>
                  <div className="city-selection-preview-stats">
                    <div><span>군주</span><strong>{formatCityOwner(listPreviewCity)}</strong></div>
                    <div><span>인구</span><strong>{listPreviewCity.population.toLocaleString()}</strong></div>
                    <div><span>치안</span><strong>{listPreviewCity.security}</strong></div>
                    <div><span>상업</span><strong>{listPreviewCity.commerce}</strong></div>
                    <div><span>농업</span><strong>{listPreviewCity.agriculture}</strong></div>
                    <div><span>방어도</span><strong>{listPreviewCity.defense.toLocaleString()}</strong></div>
                  </div>
                </div>
                {(() => { const identity = cityIdentity(listPreviewCity); return <p className="city-selection-preview-copy">{identity.description}</p>; })()}
              </div> : <div className="start-city-empty">표시할 도시가 없습니다.</div>}
              <div className="city-selection-list-wrap">
                <div className="city-selection-list-head"><span>도시명</span><span>지역</span><span>군주</span></div>
                <div className="city-selection-list-scroll">
                  {filteredScenarioCities.map(city => {
                    const highlighted = highlightedCityId === city.id;
                    const markerColor = forceColor(scenarioForceColors, city.owner);
                    return (
                      <button type="button" key={city.id} className={`city-selection-list-row ${highlighted ? 'selected' : ''}`} onClick={() => focusCity(city.id)}>
                        <span className="city-selection-list-city"><i style={{ backgroundColor: markerColor }} /> <b>{city.name}</b></span>
                        <span>{city.region}</span>
                        <span>{formatCityOwner(city)}</span>
                      </button>
                    );
                  })}
                  {filteredScenarioCities.length === 0 && <div className="city-selection-list-empty">조건에 맞는 도시가 없습니다.</div>}
                </div>
              </div>
              {createsNewForce && <div className="force-color-picker"><div><strong>독립부대 색상</strong><span>동료와 함께 시작하면 도시를 소유하지 않은 독립부대로 출발합니다.</span></div><div className="force-color-options">{FORCE_COLOR_PALETTE.map(color => { const used = usedScenarioColors.has(color); const selected = activeNewForceColor === color; return <button key={color} type="button" aria-label={`세력색 ${color}`} className={selected ? 'selected' : ''} disabled={used} style={{ backgroundColor: color }} onClick={() => setSelectedNewForceColor(color)} title={used ? '이미 사용 중인 색상' : selected ? '선택한 세력색' : '세력색 선택'} />; })}</div><small>현재 선택: <i style={{ backgroundColor: activeNewForceColor }} /> {activeNewForceColor}</small></div>}
              {customOfficers.some(officer => officer.id !== newGameOfficerId) && (
                <div className="starting-roster-panel">
                  <div><strong>동료 장수 편성</strong><span>{freeStartSetup ? '재야 시작에서 동료를 선택하면 도시 없는 독립부대로 출발합니다.' : '체크한 신무장은 주인공과 같은 소속으로 시작합니다.'}</span></div>
                  <div className="starting-roster-list">
                    {customOfficers.filter(officer => officer.id !== newGameOfficerId).map(officer => (
                      <label key={officer.id}>
                        <input
                          type="checkbox"
                          checked={selectedStartingCustomIds.includes(officer.id)}
                          onChange={event => setSelectedStartingCustomIds(current =>
                            event.target.checked ? [...current, officer.id] : current.filter(id => id !== officer.id)
                          )}
                        />
                        <strong>{officer.name}</strong>
                        <span>{officer.courtesyName ? `자 ${officer.courtesyName}` : '자 없음'} · 통 {officer.leadership} / 무 {officer.martial} / 지 {officer.intelligence} / 군 {officer.militaryStrategy}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
          <section className="city-selection-map-panel">
            <div className="city-selection-map-head"><strong>전략 지도</strong></div>
            <div className="city-selection-map-body">
              <div className="strategy-map setup-strategy-map">
                <img className="strategy-map-image" src={FUTURE_WORLD_MAP_PATH} alt="도시 선택 지도" onLoad={event => event.currentTarget.parentElement?.classList.remove('map-image-error')} onError={event => event.currentTarget.parentElement?.classList.add('map-image-error')} />
                {WORLD_REGION_LABELS.map(region => <span key={region.id} className="map-region-label" style={{ left: `${region.x}%`, top: `${region.y}%` }}>{region.name}</span>)}
                {scenarioCities.map(city => {
                  const selected = highlightedCityId === city.id;
                  const position = WORLD_MAP_POSITIONS[city.id] ?? { x: 50, y: 50 };
                  const markerColor = forceColor(scenarioForceColors, city.owner);
                  return <button type="button" className={`map-city-marker city-${cityScaleFromTier(city.tier)} label-${WORLD_MAP_LABEL_SIDES[city.id] ?? 'below'} ${canChooseStartCity ? 'selectable' : 'fixed'} ${selected ? 'selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} key={city.id} onClick={() => focusCity(city.id)} aria-pressed={selected} aria-disabled={!canChooseStartCity} title={`${city.name} · ${cityScaleLabel(city.tier)} · ${city.owner}`}><img className="city-map-icon" src={cityIconPath(city)} alt="" /><i className="city-anchor" style={{ backgroundColor: markerColor }} /><span className="city-name">{city.name}</span></button>;
                })}
              </div>
            </div>
          </section>
          <div className="setup-actions">
            <button onClick={() => setScreen('officer')}>뒤로</button>
            <button className="gold" disabled={canChooseStartCity && !selectedStartCityId} onClick={startNewGame}>시작</button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === 'custom-list') {
    const allChecked = customOfficers.length > 0 && checkedCustomIds.length === customOfficers.length;
    return (
      <div className="manager-screen">
        {notice && <div className="toast">{notice}</div>}
        <header className="setup-header">
          <div><span className="eyebrow">CUSTOM OFFICERS</span><h1>신무장 목록</h1></div>
          <button onClick={() => setScreen('title')}>타이틀로</button>
        </header>
        <main className="manager-content">
          <div className="manager-toolbar">
            <div><strong>등록 신무장 {customOfficers.length}명</strong><span>이름을 클릭하면 수정 화면으로 이동합니다.</span></div>
            <div><button className="gold" onClick={openNewCustomOfficer}>등록</button><button className="danger" onClick={deleteCheckedCustomOfficers}>삭제</button></div>
          </div>
          <div className="custom-table">
            <div className="custom-table-head">
              <input
                aria-label="신무장 전체 선택"
                type="checkbox"
                checked={allChecked}
                onChange={event => setCheckedCustomIds(event.target.checked ? customOfficers.map(officer => officer.id) : [])}
              />
              <span>이름</span><span>자</span><span>성별</span><span>소속</span><span>능력 평균</span><span>관리</span>
            </div>
            {customOfficers.length === 0 && <div className="custom-empty">등록된 신무장이 없습니다. <button onClick={openNewCustomOfficer}>첫 신무장 등록</button></div>}
            {customOfficers.map(officer => {
              const avg = Math.round((officer.leadership + officer.martial + officer.intelligence + officer.militaryStrategy + officer.politics + officer.diplomacy + officer.personnel + officer.charisma) / 8);
              return (
                <div className="custom-row" key={officer.id} onClick={() => openCustomOfficer(officer)}>
                  <input
                    aria-label={`${officer.name} 선택`}
                    type="checkbox"
                    checked={checkedCustomIds.includes(officer.id)}
                    onClick={event => event.stopPropagation()}
                    onChange={event => setCheckedCustomIds(current => event.target.checked ? [...current, officer.id] : current.filter(id => id !== officer.id))}
                  />
                  <strong>{officer.name}</strong><span>{officer.courtesyName || '-'}</span><span>{officer.gender}</span><span>{officer.force}</span><span>{avg}</span>
                  <button onClick={event => { event.stopPropagation(); openCustomOfficer(officer); }}>수정</button>
                </div>
              );
            })}
          </div>
          <div className="manager-bottom-actions"><button className="gold" onClick={openNewCustomOfficer}>등록</button><button className="danger" onClick={deleteCheckedCustomOfficers}>선택 삭제</button></div>
        </main>
      </div>
    );
  }

  if (screen === 'custom-edit') {
    const updateStat = (field: 'leadership' | 'martial' | 'intelligence' | 'militaryStrategy' | 'politics' | 'diplomacy' | 'personnel' | 'charisma', value: number) =>
      setCustomDraft(current => ({ ...current, [field]: clampStat(value) }));
    const pickerOptions = profilePicker === 'traits' ? TRAIT_OPTIONS : TENDENCY_OPTIONS;
    const pickerQuery = profilePickerQuery.trim().toLowerCase();
    const filteredPickerOptions = pickerOptions.filter(option => !pickerQuery || [option.name, option.category, option.description, option.effect].some(value => value.toLowerCase().includes(pickerQuery)));
    return (
      <div className="manager-screen">
        <header className="setup-header">
          <div><span className="eyebrow">CUSTOM OFFICER EDITOR</span><h1>{editingCustomId ? '신무장 수정' : '신무장 등록'}</h1></div>
          <button onClick={() => setScreen('custom-list')}>목록으로</button>
        </header>
        <main className="custom-editor">
          <div className="custom-editor-portrait"><strong>{customDraft.name || '新'}</strong><span>초상화 영역 · 추후 이미지 연결</span></div>
          <div className="panel custom-form">
            <div className="custom-form-grid">
              <label>이름<input aria-label="신무장 이름" value={customDraft.name} onChange={event => { setCustomDraft(current => ({ ...current, name: event.target.value })); setCustomError(''); }} /></label>
              <label>자<input aria-label="신무장 자" value={customDraft.courtesyName} onChange={event => setCustomDraft(current => ({ ...current, courtesyName: event.target.value }))} /></label>
              <label>성별<select value={customDraft.gender} onChange={event => setCustomDraft(current => ({ ...current, gender: event.target.value as '남' | '여' }))}><option>남</option><option>여</option></select></label>
              <label>생년<input type="number" min="120" max="260" value={customDraft.birthYear} onChange={event => setCustomDraft(current => ({ ...current, birthYear: Number(event.target.value) }))} /></label>
              <label>소속<select value={customDraft.force} onChange={event => setCustomDraft(current => ({ ...current, force: event.target.value }))}><option>재야</option><option>유비군</option><option>조조군</option><option>원소군</option><option>손견군</option><option>동탁군</option></select></label>
              <label>거점<select value={customDraft.city} onChange={event => setCustomDraft(current => ({ ...current, city: event.target.value }))}>{buildScenarioCities(selectedEra.year).map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label>
            </div>
            <h3>8대 기본능력</h3>
            <div className="custom-stat-grid">
              {([
                ['통솔', 'leadership'], ['무력', 'martial'], ['지략', 'intelligence'], ['군략', 'militaryStrategy'],
                ['정치', 'politics'], ['외교', 'diplomacy'], ['인사', 'personnel'], ['매력', 'charisma'],
              ] as const).map(([label, field]) => (
                <label key={field}>{label}<input type="number" min="0" max="100" value={customDraft[field]} onChange={event => updateStat(field, Number(event.target.value))} /></label>
              ))}
            </div>
            <h3>전문능력 · E → S</h3>
            <div className="custom-specialty-grid">
              {SPECIALTY_KEYS.map(key => (
                <label key={key}>{key}<select value={customDraft.specialties[key]} onChange={event => setCustomDraft(current => ({ ...current, specialties: { ...current.specialties, [key]: event.target.value as (typeof SPECIALTY_GRADES)[number] } }))}>{SPECIALTY_GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)}</select></label>
              ))}
            </div>
            <h3>특성 · 성향 · 관계</h3>
            <div className="custom-meta-grid">
              <div className="meta-picker-card">
                <div className="meta-picker-head"><strong>특성</strong><span>{customDraft.traits.length}/10</span></div>
                <p>전투·내정·인재 행동에 직접 영향을 줍니다. 최대 10개까지 선택할 수 있습니다.</p>
                <div className="selected-profile-chips">
                  {customDraft.traits.length ? customDraft.traits.map(trait => <button type="button" key={trait} title={traitEffectLabel(trait)} onClick={() => toggleProfileSelection('traits', trait)}>{trait}<span>×</span></button>) : <em>선택된 특성 없음</em>}
                </div>
                <button type="button" onClick={() => openProfilePicker('traits')}>특성 선택</button>
              </div>
              <div className="meta-picker-card">
                <div className="meta-picker-head"><strong>성향</strong><span>{customDraft.tendencies.length}/5</span></div>
                <p>장수의 판단 방식에 따라 공격·방어·내정·탐색·등용 보정이 달라집니다. 최대 5개까지 선택합니다.</p>
                <div className="selected-profile-chips">
                  {customDraft.tendencies.length ? customDraft.tendencies.map(tendency => <button type="button" key={tendency} title={tendencyEffectLabel(tendency)} onClick={() => toggleProfileSelection('tendencies', tendency)}>{tendency}<span>×</span></button>) : <em>선택된 성향 없음</em>}
                </div>
                <button type="button" onClick={() => openProfilePicker('tendencies')}>성향 선택</button>
              </div>
              <label>관계<input value={customDraft.relations.join(', ')} onChange={event => setCustomDraft(current => ({ ...current, relations: event.target.value.split(',').map(value => value.trim()).filter(Boolean) }))} placeholder="예: 관우, 장비" /></label>
            </div>
            {customError && <div className="form-error">{customError}</div>}
            <div className="custom-editor-actions">
              <button onClick={() => setScreen('custom-list')}>취소</button>
              {editingCustomId && <button className="danger" onClick={() => deleteCustomOfficer(editingCustomId)}>삭제</button>}
              <button className="gold" onClick={saveCustomOfficer}>{editingCustomId ? '수정 저장' : '등록'}</button>
            </div>
          </div>
        </main>
        {profilePicker && (
          <div className="profile-picker-backdrop" onMouseDown={() => setProfilePicker(null)}>
            <div className="profile-picker-modal" role="dialog" aria-modal="true" aria-label={`${profilePicker === 'traits' ? '특성' : '성향'} 선택`} onMouseDown={event => event.stopPropagation()}>
              <div className="profile-picker-header">
                <div><span className="eyebrow">OFFICER PROFILE</span><h2>{profilePicker === 'traits' ? '특성 선택' : '성향 선택'}</h2><p>{profilePicker === 'traits' ? `${customDraft.traits.length}/10 선택됨` : `${customDraft.tendencies.length}/5 선택됨`}</p></div>
                <button type="button" onClick={() => setProfilePicker(null)}>닫기</button>
              </div>
              <input className="profile-picker-search" aria-label="특성 성향 검색" placeholder="이름 · 분류 · 효과 검색" value={profilePickerQuery} onChange={event => setProfilePickerQuery(event.target.value)} />
              <div className="profile-picker-list">
                {filteredPickerOptions.map(option => {
                  const selected = profilePicker === 'traits' ? customDraft.traits.includes(option.name) : customDraft.tendencies.includes(option.name);
                  return (
                    <button type="button" key={option.name} className={`profile-option ${selected ? 'selected' : ''}`} onClick={() => toggleProfileSelection(profilePicker, option.name)}>
                      <div className="profile-option-title"><strong>{option.name}</strong><span>{option.category}</span>{selected && <em>선택됨</em>}</div>
                      <p>{option.description}</p>
                      <small>{option.effect}</small>
                    </button>
                  );
                })}
              </div>
              <div className="profile-picker-footer"><span>항목을 다시 클릭하면 선택이 해제됩니다.</span><button type="button" className="gold" onClick={() => setProfilePicker(null)}>선택 완료</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className="manager-screen">
        <header className="setup-header"><div><span className="eyebrow">SETTINGS</span><h1>설정</h1></div><button onClick={() => setScreen('title')}>타이틀로</button></header>
        <main className="settings-content">
          <div className="panel"><h3>게임 설정</h3><p>전투 연출, 메시지 속도, 자동 저장 등 세부 설정은 다음 단계에서 연결할 수 있도록 메뉴 자리를 먼저 구성했습니다.</p></div>
          <div className="panel"><h3>이미지 데이터</h3><p>전국 지도, 무장 초상화, 전신 이미지는 데이터 키를 기준으로 추후 연결됩니다.</p></div>
          <button onClick={() => setScreen('title')}>확인</button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell" data-future-image={FUTURE_IMAGE_PATH} data-world-map-resource={FUTURE_WORLD_MAP_RESOURCE_PATH}>
      <header className="topbar grand-topbar">
        <div className="lord-plaque"><strong>{playerGeneral?.name ?? game.ruler}</strong></div>
        <div className="era-plaque"><span>장수 일대기 · {game.year}년</span><strong>{game.year}년 {game.month}월 {game.day}일</strong><small>{tradeCity?.name ?? '거점 없음'} · AP {game.actionPoints}/{MONTHLY_ACTION_POINTS}{managedCities.length ? ` · 관리 도시 ${managedCities.length}` : ''}</small></div>
        <div className="speed-strip" aria-label="게임 진행 속도"><button className="active">1×</button><button disabled>2×</button><button disabled>4×</button></div>
        <div className="resource-strip"><div><Coins size={13} /><span>개인자금</span><strong>{formatMoney(game.personalTreasury)}</strong></div><div><Landmark size={13} /><span>세력자금</span><strong>{canManageForce || playerAuthority === '태수' ? formatMoney(game.treasury) : '열람 불가'}</strong></div><div><CalendarDays size={13} /><span>행동력</span><strong>{game.actionPoints}</strong></div><div><Backpack size={13} /><span>화물</span><strong>{Object.values(game.tradeGoods ?? {}).reduce((sum, count) => sum + count, 0)}묶음</strong></div></div>
        <div className="top-current-tab" aria-label="현재 화면"><span>현재 창</span><strong>{tab === '천하' ? '지도' : tab}</strong><small>{selectedCity ? `${selectedCity.name} · ${selectedCity.region}` : tradeCity?.name ?? '천하'}</small></div>
        <div className="top-quick-actions"><button onClick={saveGame}>저장</button><button className="gold" onClick={advanceOneDay}>하루</button></div>
      </header>

      <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={sidebarCollapsed ? '왼쪽 메뉴 열기' : '왼쪽 메뉴 숨기기'}
          aria-expanded={!sidebarCollapsed}
          onClick={() => setSidebarCollapsed(current => !current)}
          title={sidebarCollapsed ? '메뉴 열기' : '메뉴 숨기기'}
        >
          <span>{sidebarCollapsed ? '›' : '‹'}</span>
          <strong>{sidebarCollapsed ? '메뉴' : ''}</strong>
        </button>
        <aside className="sidebar grand-sidebar">
          <div className="seal"><span>{playerGeneral?.name.slice(0, 1) ?? '將'}</span><small>{playerAuthority}</small></div>
          <nav>{SIDEBAR_TABS.map(entry => { const Icon = TAB_ICONS[entry]; const locked = isMinorSuccessor && !MINOR_SUCCESSOR_TABS.includes(entry); return <button key={entry} data-tab={entry} className={tab === entry ? 'active' : ''} disabled={locked} title={locked ? '15세까지 섭정 중이라 사용할 수 없습니다.' : undefined} onClick={() => setTab(current => current === entry && entry !== '천하' ? '천하' : entry)}><span className="menu-icon"><Icon size={21} strokeWidth={2} /></span><strong>{entry}</strong></button>; })}</nav>
          <div className="side-actions"><button onClick={() => setScreen('title')}>타이틀</button></div>
        </aside>

        <main className="content map-focus modal-map-stage"> 
          {notice && <div className="toast">{notice}</div>}
          <div className="content-scroll">

          {isMinorSuccessor && <div className="panel minor-regency-banner"><strong>섭정 기간 · {playerFamilyChildAge}세</strong><span>15세 성인식 전까지 군사·내정·인사·상점 등 주요 명령은 잠겨 있습니다. 상단의 ‘하루’로 시간을 진행하거나 가족·생애·장수 화면을 확인할 수 있습니다.</span></div>}

          {(
            <section className="world-map-section">
              <div className="section-head">
                <div>
                  <span className="eyebrow">장수 현황</span>
                  <h2>천하 대세</h2>
                </div>
                <div className="summary-chips">{canManageForce ? <><span>도시 {playerCities.length}</span><span>인구 {totalPopulation.toLocaleString()}</span><span>병력 {totalTroops.toLocaleString()}</span><span>무장 {affiliatedGenerals.length}</span></> : <><span>신분 {playerAuthority}</span><span>소속 {affiliatedForce}</span><span>현재 {tradeCity?.name ?? '거점 없음'}</span><span>개인자금 {formatMoney(game.personalTreasury)}</span></>}</div>
              </div>
              <div className="strategy-map-shell">
                <div className="strategy-map">
                  <img className="strategy-map-image" src={FUTURE_WORLD_MAP_PATH} alt="천하도" onLoad={event => event.currentTarget.parentElement?.classList.remove('map-image-error')} onError={event => event.currentTarget.parentElement?.classList.add('map-image-error')} />
                  {WORLD_REGION_LABELS.map(region => <span key={region.id} className="map-region-label" style={{ left: `${region.x}%`, top: `${region.y}%` }}>{region.name}</span>)}
                  {game.cities.map(city => {
                    const position = WORLD_MAP_POSITIONS[city.id] ?? { x: 50, y: 50 };
                    const markerColor = forceColor(game.forceColors, city.owner);
                    return <button key={city.id} aria-pressed={selectedCity?.id === city.id} className={`map-city-marker city-${cityScaleFromTier(city.tier)} label-${WORLD_MAP_LABEL_SIDES[city.id] ?? 'below'} ${city.owner === affiliatedForce ? 'ours' : 'enemy'} ${selectedCity?.id === city.id ? 'selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => setSelectedCityId(city.id)} title={`${city.name} · ${cityScaleLabel(city.tier)} · ${city.owner} · 병력 ${city.troops.toLocaleString()}`}><img className="city-map-icon" src={cityIconPath(city)} alt="" /><i className="city-anchor" style={{ backgroundColor: markerColor }} /><span className="city-name">{city.name}</span></button>;
                  })}
                </div>
                <div className="map-log-overlay" aria-label="최근 행동 요약">
                  <div className="map-log-overlay-head"><strong>최근 동향</strong><span>최근 {Math.min(5, game.log.length)}건</span></div>
                  <div className="map-log-overlay-list">
                    {game.log.slice(0, 5).map((entry, index) => <p key={`map-log-${index}-${entry}`}>{compactMapLog(entry)}</p>)}
                  </div>
                </div>
                {selectedCity && <div className="map-city-inspector"><div><span>{selectedCity.region}</span><strong>{selectedCity.name}</strong><small>{selectedCity.owner}</small></div><div><span>병력 <strong>{selectedCity.troops.toLocaleString()}</strong></span><span>방벽 <strong>{selectedCity.defense}</strong></span><span>치안 <strong>{selectedCity.security}</strong></span></div><button className="gold" onClick={() => setTab('도시')}>도시 상세 보기</button></div>}
              </div>

            </section>
          )}

          {tab !== '천하' && (
            <>
              <button type="button" className="map-menu-modal-backdrop" aria-label="메뉴 창 닫기" onClick={() => setTab('천하')} />
              <img className="map-menu-modal-frame" src={`${import.meta.env.BASE_URL}resources/ui/modal-frame.png`} alt="" aria-hidden="true" />
              <div className="map-menu-modal" role="dialog" aria-modal="true" aria-label={`${tab} 메뉴`}>
                <button type="button" className="map-menu-modal-close" onClick={() => setTab('천하')} aria-label={`${tab} 창 닫기`} title="닫기 (ESC)">×</button>

          {tab === '도시' && selectedCity && (
            <section>
              <div className="section-head">
                <div>
                  <span className="eyebrow">CITY</span>
                  <h2>도시 정보</h2>
                </div>
                {renderCitySelector()}
              </div>
              <div className="detail-grid">
                <div className={`city-detail-art city-detail-${cityScaleFromTier(selectedCity.tier)}`}>
                  <img src={cityArtworkPath(selectedCity)} alt={`${selectedCity.name} 전경`} onError={event => { event.currentTarget.src = cityDetailPath(selectedCity); }} />
                  <div className="city-detail-caption"><span>{selectedCity.region}</span><strong>{selectedCity.name}</strong><small>{cityScaleLabel(selectedCity.tier)} · {selectedCity.owner}</small></div>
                </div>
                <div className="panel city-detail">
                  <div className="big-title">
                    <h3>{selectedCity.name}</h3>
                    <span>
                      {selectedCity.region} · {selectedCity.owner}
                    </span>
                  </div>
                  <div className="stats-grid">
                    <div>
                      <span>상업</span>
                      <strong>{selectedCity.commerce}</strong>
                    </div>
                    <div>
                      <span>농업</span>
                      <strong>{selectedCity.agriculture}</strong>
                    </div>
                    <div>
                      <span>치안</span>
                      <strong>{selectedCity.security}</strong>
                    </div>
                    <div>
                      <span>방벽</span>
                      <strong>{selectedCity.defense}</strong>
                    </div>
                    <div>
                      <span>훈련</span>
                      <strong>{selectedCity.training}</strong>
                    </div>
                    <div>
                      <span>인구</span>
                      <strong>
                        {selectedCity.population.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span>병력</span>
                      <strong>{selectedCity.troops.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="neighbors">
                    <span>인접 도시</span>
                    {selectedCity.neighbors
                      .map(id => game.cities.find(city => city.id === id))
                      .filter(Boolean)
                      .map(city => (
                        <button
                          key={city!.id}
                          onClick={() => setSelectedCityId(city!.id)}
                        >
                          {city!.name}
                        </button>
                      ))}
                  </div>
                  {selectedGeneral && canMoveSelectedGeneral && (
                    <div className="travel-panel">
                      <div><strong>장수 이동</strong><span>{selectedGeneral.name} · {selectedGeneralCurrentCity?.name ?? '거점 없음'} → {selectedCity.name}</span><small>플레이 장수는 자유 이동 · 독립부대는 동료 동행 · {Number.isFinite(travelDaysPreview) ? `${travelDaysPreview}일` : '이동 불가'}</small></div>
                      <button disabled={(!canManageForce && playerAuthority !== '독립부대' && selectedGeneral.id !== game.playerGeneralId) || (canManageForce && selectedGeneral.id !== game.playerGeneralId && selectedCity.owner !== affiliatedForce) || selectedGeneral.city === selectedCity.id || !Number.isFinite(travelDaysPreview)} onClick={moveSelectedGeneralToSelectedCity}>이 도시로 이동</button>
                    </div>
                  )}
                </div>
              </div>
              {(() => { const identity = cityIdentity(selectedCity); const effects = cityIdentityEffectLabels(identity); return <div className="panel city-identity"><div className="city-identity-head"><div><span className="eyebrow">CITY IDENTITY</span><h3>도시 특성</h3></div><span className="city-product">특산물 · <strong>{identity.product}</strong></span></div><div className="city-identity-main"><div><strong>{identity.trait}</strong><p>{identity.description}</p></div><div className="city-identity-effects">{effects.map(effect => <span key={effect}>{effect}</span>)}</div></div></div>; })()}
              <div className="panel city-facilities">
                <div className="city-facilities-head"><div><span className="eyebrow">FACILITIES</span><h3>도시 시설</h3></div><small>{cityScaleLabel(selectedCity.tier)} · 활성 {cityFacilitySlots(selectedCity.tier)}/6 · 개발 상한 {cityDevelopmentCap(selectedCity.tier)}</small></div>
                <div className="city-facility-grid">{cityFacilityRows(selectedCity).map((facility, index) => { const active = index < cityFacilitySlots(selectedCity.tier); const cap = cityDevelopmentCap(selectedCity.tier); const value = Math.min(facility.value, cap); const own = canManageSelectedCity; const lockedLabel = index === 4 ? '중도시 필요' : '대도시 필요'; return <article key={facility.name} className={`city-facility-card ${active ? 'active' : 'locked'}`}><div className="city-facility-title"><strong>{facility.name}</strong><span>Lv.{active ? cityFacilityLevel(facility.value, cap) : 0}</span></div><p>{facility.description}</p><small className="city-facility-effect">{cityFacilityEffectLabel(selectedCity, facility.key)}</small><div className="city-facility-progress"><progress max={cap} value={value} /><small>{facility.value}/{cap}</small></div>{active ? <button disabled={!own || (facility.command !== null && facility.value >= cap)} onClick={() => facility.command ? domestic(facility.command) : facility.tab && setTab(facility.tab)}>{facility.command !== null && facility.value >= cap ? '개발 완료' : facility.actionLabel}</button> : <button disabled>{lockedLabel}</button>}</article>; })}</div>
              </div>
              {(() => { const plan = cityPromotionPlan(selectedCity); if (!plan) return <div className="panel city-promotion complete"><div><span className="eyebrow">CITY GROWTH</span><h3>도시 규모</h3><p>{selectedCity.name}은 이미 최고 단계인 대도시입니다.</p></div><strong>시설 6개 · 개발 상한 100</strong></div>; const requirements = cityPromotionRequirements(selectedCity, plan); const conditionsMet = requirements.every(requirement => requirement.met); const own = canManageSelectedCity; const affordable = moneyToCopper(game.treasury) >= plan.costCopper; const enoughAp = game.actionPoints >= plan.apCost; return <div className="panel city-promotion"><div className="city-promotion-head"><div><span className="eyebrow">CITY GROWTH</span><h3>{cityScaleLabel(selectedCity.tier)} → {plan.targetLabel}</h3><p>도시를 성장시키면 지도 아이콘·전경·시설 슬롯·개발 상한이 즉시 확장됩니다.</p></div><div className="city-promotion-cost"><strong>{plan.costLabel}</strong><span>AP {plan.apCost} · {plan.days}일</span></div></div><div className="city-promotion-requirements">{requirements.map(requirement => <div key={requirement.label} className={requirement.met ? 'met' : 'missing'}><span>{requirement.label}</span><strong>{requirement.current.toLocaleString()}</strong><small>필요 {requirement.required.toLocaleString()}</small></div>)}</div><div className="city-promotion-actions"><span>{!own ? '군주 또는 담당 태수 권한 필요' : !conditionsMet ? '도시 성장 조건을 먼저 달성하세요.' : !affordable ? `군자금 ${plan.costLabel} 필요` : !enoughAp ? `행동력 ${plan.apCost} 필요` : `${plan.targetLabel} 승격 준비 완료`}</span><button className="gold" disabled={!own || !conditionsMet || !affordable || !enoughAp} onClick={promoteSelectedCity}>{conditionsMet ? `${plan.targetLabel}로 승격` : '조건 미달'}</button></div></div>; })()}
            </section>
          )}

          {tab === '내정' && selectedCity && (
            <section>
              <div className="section-head"><div><span className="eyebrow">DOMESTIC</span><h2>내정 · 장수 행동</h2></div>{renderCitySelector(true)}</div>
              <div className="panel officer-action-panel"><div><span className="eyebrow">PERSONAL REQUEST</span><h3>{tradeCity?.name ?? '현재 도시'} 개인 내정 의뢰</h3><p>도시 소유권과 무관하게 플레이 장수가 직접 일하며 개인 자금을 얻습니다.</p></div><div className="officer-action-buttons"><button onClick={() => performPersonalDomesticAction('commerce')} disabled={!tradeCity || game.actionPoints < 3}>시장 일손 · AP 3</button><button onClick={() => performPersonalDomesticAction('agriculture')} disabled={!tradeCity || game.actionPoints < 3}>농지 지원 · AP 3</button><button onClick={() => performPersonalDomesticAction('security')} disabled={!tradeCity || game.actionPoints < 3}>치안 협력 · AP 3</button></div></div>
              {managedCities.length > 0 ? <><div className="role-permission"><strong>{playerAuthority} 행정 권한</strong><span>{canManageForce ? '소속 세력의 모든 도시를 관리합니다.' : `${managedCities[0]?.name ?? '-'} 태수 권한으로 담당 도시만 관리합니다.`}</span></div><div className="action-grid"><button onClick={() => domestic('commerce')}><strong>상업 개발</strong><span>정치 + 상업</span><small>10은 · AP 8 · 3일</small></button><button onClick={() => domestic('agriculture')}><strong>농업 개발</strong><span>정치 + 농업</span><small>10은 · AP 8 · 3일</small></button><button onClick={() => domestic('security')}><strong>치안 강화</strong><span>정치 + 치안</span><small>5은 · AP 6 · 2일</small></button><button onClick={() => domestic('walls')}><strong>방벽 보수</strong><span>정치 + 축성</span><small>15은 · AP 10 · 4일</small></button><button onClick={() => domestic('training')}><strong>병사 훈련</strong><span>인사 + 훈련</span><small>10은 · AP 8 · 3일</small></button><button onClick={() => domestic('recruit')}><strong>징병</strong><span>인사 + 훈련</span><small>20은 · AP 10 · 3일</small></button></div><div className="panel"><h3>{selectedCity.name} 현재 수치</h3><div className="bars"><label>상업 <progress max="100" value={selectedCity.commerce} /> {selectedCity.commerce}</label><label>농업 <progress max="100" value={selectedCity.agriculture} /> {selectedCity.agriculture}</label><label>치안 <progress max="100" value={selectedCity.security} /> {selectedCity.security}</label><label>방벽 <progress max="100" value={selectedCity.defense} /> {selectedCity.defense}</label><label>훈련 <progress max="100" value={selectedCity.training} /> {selectedCity.training}</label></div></div></> : <div className="panel role-permission locked"><strong>도시 행정 권한 없음</strong><span>{playerAuthority} 신분에서는 세력 전체 내정 명령을 내리지 않습니다. 현재 도시의 개인 의뢰는 위에서 계속 수행할 수 있습니다.</span></div>}
            </section>
          )}

          {tab === '군사' && selectedCity && (
            <section><div className="section-head"><div><span className="eyebrow">MILITARY</span><h2>군사 · 장수 행동</h2></div>{renderCitySelector(true)}</div><div className="panel officer-action-panel"><div><span className="eyebrow">PERSONAL MILITARY</span><h3>{tradeCity?.name ?? '현재 도시'} 개인 군사 행동</h3><p>세력 지휘권이 없어도 순찰과 도적 토벌을 수행해 개인 보수를 얻습니다.</p></div><div className="officer-action-buttons"><button onClick={() => performPersonalMilitaryAction('patrol')} disabled={!tradeCity || game.actionPoints < 4}>도시 순찰 · AP 4</button><button className="danger" onClick={() => performPersonalMilitaryAction('bandits')} disabled={!tradeCity || game.actionPoints < 6}>도적 토벌 · AP 6</button></div></div>{managedCities.length === 0 ? <div className="panel role-permission locked"><strong>세력 부대 지휘 권한 없음</strong><span>{playerAuthority} 신분에서는 도시 주둔군을 직접 편성·출정시키지 않습니다.</span></div> : <><div className="role-permission"><strong>{playerAuthority} 지휘 권한</strong><span>{canManageForce ? '소속 세력 전 도시의 부대를 지휘할 수 있습니다.' : `${managedCities[0]?.name ?? '-'} 태수 권한으로 담당 도시 부대만 지휘합니다.`}</span></div><div className="military-subtabs">{(['부대 편성', '도시 선택', '출정'] as const).map(view => <button key={view} className={militaryView === view ? 'active' : ''} onClick={() => setMilitaryView(view)}>{view}<small>{view === '부대 편성' ? '장수·병종·병력' : view === '도시 선택' ? '공격 목표 지정' : '편성 부대 출격'}</small></button>)}</div><div className="military-subtabs">{(['부대 편성', '도시 선택', '출정'] as const).map(view => <button key={view} className={militaryView === view ? 'active' : ''} onClick={() => setMilitaryView(view)}>{view}<small>{view === '부대 편성' ? '장수·병종·병력' : view === '도시 선택' ? '공격 목표 지정' : '편성 부대 출격'}</small></button>)}</div>{militaryView === '부대 편성' && <div className="military-workspace"><div className="panel warning"><strong>편성 거점: {selectedCity.name} · 지휘 권한 {playerAuthority}</strong><span>도시 병력 {selectedCity.troops.toLocaleString()} · 현재 권한 편성 상한 {managementTroopCap.toLocaleString()}명 · 관리 편성 {manageableArmies.length}개</span></div><div className="battle-plan-row"><button className={battlePlan === 'clash' ? 'active' : ''} onClick={() => setBattlePlan('clash')}><strong>부대 교전</strong><span>편성 병력 전체로 정면 전투</span></button><button className={battlePlan === 'duel' ? 'active' : ''} onClick={() => setBattlePlan('duel')}><strong>일기토 도전</strong><span>주장의 무력으로 선제 사기전을 노림</span></button></div><div className="formation-summary"><span>현재 편성</span><strong>{formationTotal.toLocaleString()} / {Math.min(managementTroopCap, selectedCity.troops).toLocaleString()}명</strong></div><div className="formation-list inline-formation-list">{formationGenerals.map(general => { const cap = unitCommandCap(general); const troops = formationTroops[general.id] ?? 0; const troopType = formationTroopTypes[general.id] ?? preferredTroopType(general); const reserved = reservedGeneralIds.has(general.id); return <div className={`formation-row ${troops > 0 ? 'selected' : ''} ${reserved ? 'reserved' : ''}`} key={general.id}><label><input type="checkbox" disabled={reserved} checked={troops > 0} onChange={() => { setFormationTroops(current => ({ ...current, [general.id]: troops > 0 ? 0 : Math.min(3000, cap, selectedCity.troops) })); setFormationTroopTypes(current => ({ ...current, [general.id]: current[general.id] ?? preferredTroopType(general) })); }} /><strong>{general.name}</strong></label><span>{reserved ? '다른 편성에 배속 중' : `${personnelLabel(general)} · 지휘한도 ${cap.toLocaleString()}`}</span><select disabled={reserved} value={troopType} onChange={event => setFormationTroopTypes(current => ({ ...current, [general.id]: event.target.value as TroopType }))}>{TROOP_TYPES.map(type => <option key={type} value={type}>{type} · {general.specialties[type]}</option>)}</select><input disabled={reserved} type="number" min="0" max={cap} step="500" value={troops} onChange={event => setFormationTroops(current => ({ ...current, [general.id]: Math.max(0, Math.min(cap, Number(event.target.value))) }))} /></div>; })}</div><div className="military-page-foot"><span>편성 저장은 AP를 소모하지 않습니다. 실제 출정 시 AP 12 · 5일이 소요됩니다.</span><button className="gold" disabled={!canManageSelectedCity || formationTotal < 1000 || formationTotal > selectedCity.troops || formationTotal > managementTroopCap} onClick={saveArmyFormation}>편성 완료 · 부대 추가</button></div></div>}{militaryView === '도시 선택' && <div className="army-card-list">{manageableArmies.length === 0 ? <div className="empty">현재 지휘할 수 있는 편성 부대가 없습니다.</div> : manageableArmies.map(army => { const origin = game.cities.find(city => city.id === army.originCityId); const targets = origin?.neighbors.map(id => game.cities.find(city => city.id === id)).filter((city): city is City => Boolean(city && city.owner !== affiliatedForce)) ?? []; return <div className={`panel army-card ${selectedArmy?.id === army.id ? 'selected' : ''}`} key={army.id} onClick={() => setSelectedArmyId(army.id)}><div className="army-card-head"><div><span className="eyebrow">{army.battlePlan === 'duel' ? 'DUEL PLAN' : 'BATTLE PLAN'}</span><h3>{army.name}</h3><p>{origin?.name ?? '거점 없음'} · {army.units.reduce((sum, unit) => sum + unit.troops, 0).toLocaleString()}명 · {army.units.length}개 부대</p></div><button className="danger" onClick={event => { event.stopPropagation(); disbandArmy(army.id); }}>해산</button></div><label>출정 목표<select value={army.targetCityId ?? ''} onChange={event => assignArmyTarget(army.id, event.target.value)}><option value="">공격 가능한 도시 선택</option>{targets.map(city => <option key={city.id} value={city.id}>{city.name} · {city.owner} · 병력 {city.troops.toLocaleString()}</option>)}</select></label>{targets.length === 0 && <div className="empty">현재 거점에서 공격 가능한 인접 적 도시가 없습니다.</div>}</div>; })}<div className="military-page-foot"><span>목표를 정한 부대는 ‘출정’에서 실제 전투를 시작합니다.</span><button className="gold" onClick={() => setMilitaryView('출정')}>출정 화면으로</button></div></div>}{militaryView === '출정' && <div className="army-card-list">{manageableArmies.length === 0 ? <div className="empty">현재 지휘할 수 있는 편성 부대가 없습니다.</div> : manageableArmies.map(army => { const origin = game.cities.find(city => city.id === army.originCityId); const target = army.targetCityId ? game.cities.find(city => city.id === army.targetCityId) : undefined; const total = army.units.reduce((sum, unit) => sum + unit.troops, 0); return <div className="panel army-card sortie-card" key={army.id}><div className="army-card-head"><div><span className="eyebrow">READY FORCE</span><h3>{army.name}</h3><p>{origin?.name ?? '-'} → {target?.name ?? '목표 미지정'} · {total.toLocaleString()}명</p></div><span className="tag">{army.battlePlan === 'duel' ? '일기토' : '부대 교전'}</span></div><div className="army-unit-summary">{army.units.map(unit => { const general = game.generals.find(entry => entry.id === unit.generalId); return <span key={unit.generalId}>{general?.name ?? '장수'} · {unit.troopType} {unit.troops.toLocaleString()}명</span>; })}</div><div className="sortie-actions"><button onClick={() => { setSelectedArmyId(army.id); setMilitaryView('도시 선택'); }}>목표 변경</button><button className="danger" disabled={!target || game.actionPoints < 12} onClick={() => executeArmySortie(army.id)}>출정 · AP 12 · 5일</button></div></div>; })}</div>}</>}
            </section>
          )}

          {tab === '인재' && selectedCity && (
            <section>
              <div className="section-head">
                <div>
                  <span className="eyebrow">TALENT</span>
                  <h2>인재 탐색 · 등용</h2>
                </div>
                <span className="role-chip">현재 위치 · {tradeCity?.name ?? '거점 없음'} · {playerAuthority}</span>
              </div>
              <div className="talent-search-grid">
                <div className="panel talent-search-card">
                  <div>
                    <span className="tag">플레이 장수 현재 도시</span>
                    <h3>{tradeCity?.name ?? '거점 없음'}</h3>
                    <p>도시 소유권과 관계없이 현재 위치에서 재야 인재를 직접 탐색합니다.</p>
                  </div>
                  <button className="gold" disabled={!tradeCity || game.actionPoints < 6} onClick={searchTalent}>재야 탐색 · AP 6 · 2일</button>
                </div>
                <div className="panel talent-help">
                  <h3>인재 등용</h3>
                  <p>발견한 재야 장수에게 직접 찾아가 대화하거나 보유 아이템을 선물해 교분을 올린 뒤 등용할 수 있습니다. 각 행동은 월 행동력과 일수를 사용하며 등용에는 성공률 판정이 적용됩니다.</p>
                  <span>현재 도시 발견 인재 {discoveredFreeOfficersHere.length}명</span>
                </div>
              </div>
              <div className="talent-list">
                {discoveredFreeOfficersHere.length === 0 && <div className="empty">현재 위치에서 아직 발견한 재야 인재가 없습니다. 탐색을 실행하거나 다른 도시로 이동하세요.</div>}
                {discoveredFreeOfficersHere.map(general => {
                  const relation = game.freeOfficerRelations[general.id] ?? { favor: 0, conversations: 0, gifts: 0 };
                  const giftableItems = itemCatalog.filter(item => itemCount(game, item.id) > 0);
                  return (
                    <div className="talent-card talent-card-expanded" key={general.id}>
                      <div className="officer-face-placeholder">{general.name.slice(0, 1)}</div>
                      <div>
                        <span>재야 · {selectedCity.name} · 교분 {relation.favor}/100</span>
                        <h3>{general.name}</h3>
                        <p>통 {general.leadership} · 무 {general.martial} · 지 {general.intelligence} · 군 {general.militaryStrategy}</p>
                        <p>정 {general.politics} · 외 {general.diplomacy} · 인 {general.personnel} · 매 {general.charisma}</p>
                        <small>대화 {relation.conversations}회 · 선물 {relation.gifts}회</small>
                      </div>
                      <div className="talent-actions">
                        <button disabled={game.actionPoints < 3} onClick={() => talkToTalent(general.id)}>대화 · AP 3 · 1일</button>
                        <div className="talent-gift-row">
                          <select aria-label={`${general.name} 선물 선택`} value={talentGiftSelections[general.id] ?? ''} onChange={event => setTalentGiftSelections(current => ({ ...current, [general.id]: event.target.value }))}>
                            <option value="">선물할 아이템</option>
                            {giftableItems.map(item => <option key={item.id} value={item.id}>{item.name} · {item.bonus}</option>)}
                          </select>
                          <button disabled={game.actionPoints < 2 || !talentGiftSelections[general.id]} onClick={() => giftTalent(general.id)}>선물 · AP 2</button>
                        </div>
                        <button className="gold" disabled={game.actionPoints < 5} onClick={() => recruitTalent(general.id)}>등용 시도 · AP 5 · 1일</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tab === '장수' && (
            <section className="officer-browser-screen">
              <div className="section-head"><div><span className="eyebrow">ALL OFFICERS</span><h2>장수</h2></div><div className="summary-chips"><span>현재 장수 {game.generals.length}명</span><span>포로 {game.prisoners.length}명</span></div></div>
              <div className="officer-browser-tools"><div>{(['전체', '내 세력', '타 세력', '재야', '포로'] as const).map(filter => <button key={filter} className={officerBrowserFilter === filter ? 'active' : ''} onClick={() => setOfficerBrowserFilter(filter)}>{filter}</button>)}</div><input value={officerBrowserQuery} onChange={event => setOfficerBrowserQuery(event.target.value)} placeholder="장수·세력·도시 검색" /></div>
              {browserSelectedGeneral ? (
                <div className="officer-browser-layout">
                  <div className="panel officer-browser-detail">
                    <div className="officer-browser-hero"><div className="officer-portrait-slot"><span>{browserSelectedGeneral.name.slice(0, 1)}</span><small>초상화 예정</small></div><div><span className="eyebrow">{prisonerIds.has(browserSelectedGeneral.id) ? 'PRISONER' : browserSelectedGeneral.force === '재야' ? 'FREE OFFICER' : 'OFFICER'}</span><h3>{browserSelectedGeneral.name}</h3><p>{browserSelectedGeneral.force} · {game.cities.find(city => city.id === browserSelectedGeneral.city)?.name ?? '거점 없음'} · {officerAgeText(browserSelectedGeneral.birthYear, browserSelectedGeneral.birthYearEstimated, game.year)}</p><small>{prisonerIds.has(browserSelectedGeneral.id) ? '포로 처분 대기' : personnelLabel(browserSelectedGeneral)} · 충성 {browserSelectedGeneral.loyalty}</small></div></div>
                    <div className="ability-grid browser-ability-grid">{([['leadership', '통솔'], ['martial', '무력'], ['intelligence', '지략'], ['militaryStrategy', '군략'], ['politics', '정치'], ['diplomacy', '외교'], ['personnel', '인사'], ['charisma', '매력']] as const).map(([key, label]) => <div key={key}><span>{label}</span><strong>{effectiveStat(browserSelectedGeneral, key)}</strong></div>)}</div>
                    <div className="officer-browser-sections"><div><h4>전문능력</h4><div className="specialty-grid compact">{SPECIALTY_KEYS.map(key => <div key={key} className={`specialty-grade grade-${browserSelectedGeneral.specialties[key]}`}><span>{key}</span><strong>{browserSelectedGeneral.specialties[key]}</strong></div>)}</div></div><div><h4>특성·성향</h4><div className="trait-chip-list">{[...browserSelectedGeneral.traits, ...browserSelectedGeneral.tendencies].map(value => <span key={value}>{value}</span>)}</div><h4>관계</h4><div className="trait-chip-list">{browserSelectedGeneral.relations.length ? browserSelectedGeneral.relations.map(value => <span key={value}>{value}</span>) : <em>없음</em>}</div></div><div><h4>장비</h4><div className="browser-equipment-list">{EQUIPPABLE_TYPES.map(type => <span key={type}><b>{type}</b>{catalogItem(browserSelectedGeneral.equipment[type] ?? '')?.name ?? '없음'}</span>)}</div></div></div>
                    {playerGeneral && browserSelectedGeneral.id !== playerGeneral.id && browserSelectedGeneral.city === playerGeneral.city && !prisonerIds.has(browserSelectedGeneral.id) && browserSelectedGeneral.force !== '재야' && <div className="officer-browser-actions"><button onClick={() => talkToOfficer(browserSelectedGeneral.id)} disabled={game.actionPoints < 2}>대화 · AP 2</button><select value={officerGiftItemId} onChange={event => setOfficerGiftItemId(event.target.value)}><option value="">선물할 장비</option>{itemCatalog.filter(item => itemCount(game, item.id) > 0).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => giftToOfficer(browserSelectedGeneral.id)} disabled={!officerGiftItemId || game.actionPoints < 2}>선물</button><button onClick={() => trainOfficer(browserSelectedGeneral.id)} disabled={browserSelectedGeneral.force !== playerGeneral.force || game.actionPoints < 5}>전수</button></div>}
                  </div>
                  <aside className="panel all-officer-list"><div className="officer-roster-head"><div><span className="eyebrow">ROSTER</span><h3>전체 장수 목록</h3></div><strong>{officerBrowserList.length}</strong></div><div className="officer-roster-list">{officerBrowserList.map(general => <button key={general.id} className={general.id === browserSelectedGeneral.id ? 'selected' : ''} onClick={() => setSelectedGeneralId(general.id)}><span className="officer-roster-face">{general.name.slice(0, 1)}</span><div><strong>{general.name}</strong><small>{general.force} · {game.cities.find(city => city.id === general.city)?.name ?? '거점 없음'}</small><em>{prisonerIds.has(general.id) ? '포로' : general.force === '재야' ? '재야' : personnelLabel(general)}</em></div></button>)}</div></aside>
                </div>
              ) : (
                <div className="panel empty officer-browser-empty">
                  <strong>검색 조건에 맞는 장수가 없습니다.</strong>
                  <span>검색어 또는 분류를 바꾸면 장수 목록이 다시 표시됩니다.</span>
                  <button onClick={() => { setOfficerBrowserQuery(''); setOfficerBrowserFilter('전체'); }}>검색 초기화</button>
                </div>
              )}
            </section>
          )}

          {tab === '임무' && playerGeneral && tradeCity && (
            <section className="mission-screen">
              <div className="section-head"><div><span className="eyebrow">OFFICER MISSIONS</span><h2>장수 임무</h2></div><div className="summary-chips"><span>{playerAuthority}</span><span>{tradeCity.name}</span><span>공적 {game.playerMerit}</span><span>명성 {game.playerFame}</span></div></div>
              {game.activeMission ? (() => { const mission = game.activeMission; const chance = missionSuccessChance(mission, playerGeneral, game.playerFame); return <div className="panel active-mission"><div className="mission-card-head"><div><span className="tag">{mission.category}</span><h3>{mission.title}</h3><p>{mission.description}</p></div><strong>{chance}%</strong></div><div className="mission-meta"><span>의뢰인 <b>{mission.issuer}</b></span><span>수행지 <b>{game.cities.find(city => city.id === mission.cityId)?.name ?? '-'}</b></span><span>AP <b>{mission.apCost}</b></span><span>소요 <b>{mission.days}일</b></span></div><div className="mission-reward"><span>공적 +{mission.rewardMerit}</span><span>명성 +{mission.rewardFame}</span><span>보수 {formatMoney(copperToMoney(mission.rewardCopper))}</span></div><div className="mission-actions"><button onClick={abandonMission}>임무 포기</button><button className="gold" disabled={playerGeneral.city !== mission.cityId || game.actionPoints < mission.apCost} onClick={executeActiveMission}>임무 수행 · 성공률 {chance}%</button></div></div>; })() : <><div className="mission-offer-grid">{missionOffers.map(mission => { const done = completedMissionIds.has(mission.id); const chance = missionSuccessChance(mission, playerGeneral, game.playerFame); return <article className={`panel mission-offer-card ${mission.category === '공적 임무' ? 'featured' : ''}`} key={mission.id}><div className="mission-card-head"><div><span className="tag">{mission.category}</span><h3>{mission.title}</h3></div><strong>{chance}%</strong></div><p>{mission.description}</p><small>의뢰인 · {mission.issuer}</small><div className="mission-meta"><span>AP {mission.apCost}</span><span>{mission.days}일</span><span>난도 {mission.difficulty}</span></div><div className="mission-reward"><span>공적 +{mission.rewardMerit}</span><span>명성 +{mission.rewardFame}</span><span>{formatMoney(copperToMoney(mission.rewardCopper))}</span></div><button className="gold" disabled={done} onClick={() => acceptMission(mission)}>{done ? '이번 달 완료' : '임무 수주'}</button></article>; })}</div>{game.playerStatus !== '소속장수' && <div className="panel role-permission"><strong>세력 명령 없음</strong><span>{game.playerStatus === '군주' ? '군주는 명령을 받는 대신 세력을 직접 운영합니다.' : '재야·독립부대는 도시 의뢰와 공적 임무를 중심으로 활동합니다.'}</span></div>}</>}
              <div className="panel personal-goal-panel"><div className="career-card-head"><div><span className="eyebrow">PERSONAL GOAL</span><h3>개인 목표</h3></div>{activeGoalDefinition && <strong>{activeGoalDefinition.title}</strong>}</div>{game.personalGoal && activeGoalDefinition ? <><p>{activeGoalDefinition.description}</p><div className="goal-progress"><progress max={activeGoalDefinition.target} value={Math.min(activeGoalProgress, activeGoalDefinition.target)} /><strong>{Math.min(activeGoalProgress, activeGoalDefinition.target).toLocaleString()} / {activeGoalDefinition.target.toLocaleString()} {activeGoalDefinition.unit}</strong></div><div className="mission-reward"><span>완료 보상 공적 +{activeGoalDefinition.rewardMerit}</span><span>명성 +{activeGoalDefinition.rewardFame}</span></div><div className="mission-actions"><button onClick={abandonPersonalGoal}>목표 포기</button><button className="gold" disabled={activeGoalProgress < activeGoalDefinition.target} onClick={claimPersonalGoal}>목표 달성 보상</button></div></> : <div className="goal-option-grid">{PERSONAL_GOALS.map(goal => { const claimed = (game.claimedPersonalGoals ?? []).includes(goal.id); return <button key={goal.id} disabled={claimed} onClick={() => startPersonalGoal(goal.id)}><strong>{goal.title}</strong><span>{goal.description}</span><small>{claimed ? '달성 완료' : `보상 · 공적 +${goal.rewardMerit} / 명성 +${goal.rewardFame}`}</small></button>; })}</div>}</div>
              <div className="panel mission-history"><div className="career-card-head"><div><span className="eyebrow">MISSION LOG</span><h3>최근 임무 기록</h3></div><strong>{(game.missionHistory ?? []).length}건</strong></div><div>{(game.missionHistory ?? []).length ? (game.missionHistory ?? []).slice(0, 8).map(record => <span key={`${record.missionId}-${record.completedDate}`} className={record.success ? 'success' : 'failed'}><b>{record.success ? '성공' : '실패'}</b> · {record.title} · 공적 +{record.merit} / 명성 +{record.fame} · {record.completedDate}</span>) : <span>아직 완료한 임무가 없습니다.</span>}</div></div>
            </section>
          )}

          {tab === '생애' && playerGeneral && (
            <section className="career-screen">
              <div className="section-head"><div><span className="eyebrow">OFFICER LIFE</span><h2>장수 생애</h2></div><div className="summary-chips"><span>{playerAuthority}</span><span>{currentFameTitle}</span><span>{tradeCity?.name ?? '거점 없음'}</span></div></div>
              <div className="career-stat-grid"><div className="panel career-stat"><span>공적</span><strong>{game.playerMerit.toLocaleString()}</strong><small>승진과 독립의 핵심 조건</small></div><div className="panel career-stat"><span>명성</span><strong>{game.playerFame.toLocaleString()} · {currentFameTitle}</strong><small>사관·귀순·방랑군 결성 조건</small></div><div className="panel career-stat"><span>현재 직급</span><strong>{playerGeneral.rank}</strong><small>{personnelLabel(playerGeneral)}</small></div><div className="panel career-stat"><span>현재 소속</span><strong>{affiliatedForce}</strong><small>{game.ruler ? `군주 ${game.ruler}` : '독립/재야'}</small></div></div>
              <div className="panel career-promotion"><div className="career-card-head"><div><span className="eyebrow">PROMOTION</span><h3>공적 승진</h3></div>{nextCareerRank ? <strong>{playerGeneral.rank} → {nextCareerRank.name}</strong> : <strong>현재 세력에서 승진 한계</strong>}</div>{nextCareerRequirement ? <><div className="career-requirements"><label><span>공적</span><progress max={nextCareerRequirement.merit} value={Math.min(game.playerMerit, nextCareerRequirement.merit)} /><b>{game.playerMerit}/{nextCareerRequirement.merit}</b></label><label><span>명성</span><progress max={nextCareerRequirement.fame} value={Math.min(game.playerFame, nextCareerRequirement.fame)} /><b>{game.playerFame}/{nextCareerRequirement.fame}</b></label></div><button className="gold" disabled={game.playerStatus !== '소속장수' || game.playerMerit < nextCareerRequirement.merit || game.playerFame < nextCareerRequirement.fame || game.actionPoints < 4} onClick={requestCareerPromotion}>승진 요청 · AP 4 · 2일</button></> : <p>{game.playerStatus === '소속장수' ? '더 높은 직급은 세력의 지위가 상승해야 해금됩니다.' : '승진은 세력에 소속된 장수일 때만 요청할 수 있습니다.'}</p>}</div>
              <div className="career-path-grid">
                {game.playerStatus === '소속장수' && <><article className="panel career-action-card"><strong>하야</strong><p>현재 세력을 떠나 재야가 됩니다. 관직과 보직은 내려놓지만 공적·명성 기록은 남습니다.</p><button disabled={game.actionPoints < 4} onClick={leaveAffiliatedForce}>하야 · AP 4 · 2일</button></article><article className="panel career-action-card"><strong>귀순</strong><p>{canJoinCurrentForce ? `${tradeCity?.name}의 ${currentCityJoinForce}으로 전향합니다. 공적은 절반, 명성은 20 감소합니다.` : '다른 세력의 도시에 직접 이동하면 그 세력으로 귀순할 수 있습니다.'}</p><button disabled={!canJoinCurrentForce || game.playerFame < 120 || game.actionPoints < 8} onClick={defectToCurrentForce}>귀순 · 명성 120 · AP 8</button></article><article className="panel career-action-card featured"><strong>독립</strong><p>공적과 명성을 바탕으로 방랑군을 결성합니다. 친밀 70 이상의 같은 도시 동료가 따라올 수 있습니다.</p><button className="gold" disabled={game.playerMerit < 500 || game.playerFame < 300 || moneyToCopper(game.personalTreasury) < 5000 || game.actionPoints < 10} onClick={declareIndependence}>독립 · 공적 500 · 명성 300 · 50은</button></article></>}
                {(game.playerStatus === '재야' || game.playerStatus === '독립부대') && <article className="panel career-action-card"><strong>사관</strong><p>{canJoinCurrentForce ? `${tradeCity?.name}을(를) 지배하는 ${currentCityJoinForce}에 사관합니다.${game.playerStatus === '독립부대' ? ' 현재 방랑군 동료도 함께 합류합니다.' : ''}` : '세력이 지배하는 도시로 이동하면 사관할 수 있습니다.'}</p><button className="gold" disabled={!canJoinCurrentForce || game.playerFame < 40 || game.actionPoints < 6} onClick={joinCurrentForce}>사관 · 명성 40 · AP 6</button></article>}
                {game.playerStatus === '재야' && <article className="panel career-action-card featured"><strong>방랑군 결성</strong><p>도시를 소유하지 않는 독립부대를 꾸립니다. 이후 동료를 모으고 상단·의뢰·토벌로 기반을 마련할 수 있습니다.</p><button className="gold" disabled={game.playerFame < 100 || moneyToCopper(game.personalTreasury) < 2000 || game.actionPoints < 4} onClick={formWanderingBand}>결성 · 명성 100 · 20은 · AP 4</button></article>}
                {game.playerStatus === '독립부대' && <article className="panel career-action-card"><strong>방랑군 해산</strong><p>동료들과 세력을 해산하고 다시 재야로 돌아갑니다. 도시 소유권에는 영향을 주지 않습니다.</p><button disabled={game.actionPoints < 2} onClick={dissolveWanderingBand}>해산 · AP 2 · 1일</button></article>}
                {game.playerStatus === '군주' && <article className="panel career-action-card featured"><strong>군주의 길</strong><p>군주는 하야·사관 대신 세력 전체의 내정·군사·인사와 천하 통일을 책임집니다. 공적과 명성은 장수 생애 기록으로 계속 축적됩니다.</p><button disabled>군주 전용 경로</button></article>}
              </div>
              <div className="panel career-history"><div className="career-card-head"><div><span className="eyebrow">CHRONICLE</span><h3>생애 기록</h3></div><strong>{(game.careerHistory ?? []).length}건</strong></div><div>{(game.careerHistory ?? []).length ? (game.careerHistory ?? []).slice(0, 10).map((entry, index) => <span key={`${entry}-${index}`}>{entry}</span>) : <span>아직 기록된 중대한 생애 사건이 없습니다.</span>}</div></div>
            </section>
          )}

          {tab === '가족' && playerGeneral && (
            <section className="family-screen">
              <div className="section-head">
                <div><span className="eyebrow">FAMILY</span><h2>가족 · 혼인 · 육아</h2></div>
                <div className="summary-chips"><span>{playerGeneral.name}</span><span>{spouse ? `배우자 ${spouse.name}` : '미혼'}</span><span>직계 자녀 {currentPlayerChildren.length}명</span>{isMinorSuccessor && <span>섭정 {playerFamilyChildAge}세</span>}</div>
              </div>
              <div className="family-summary-grid">
                <article className="panel family-summary-card"><span>플레이 장수</span><strong>{playerGeneral.name}</strong><small>{officerAgeText(playerGeneral.birthYear, playerGeneral.birthYearEstimated, game.year)} · {playerAuthority}</small></article>
                <article className="panel family-summary-card"><span>배우자</span><strong>{spouse?.name ?? '없음'}</strong><small>{game.family.marriageDate ? `혼인일 ${game.family.marriageDate}` : '결혼 후보와 친밀도를 쌓아 혼인할 수 있습니다.'}</small></article>
                <article className="panel family-summary-card"><span>직계 자녀</span><strong>{currentPlayerChildren.length}명</strong><small>{game.family.pregnancy ? `출산 예정 ${game.family.pregnancy.dueDate}` : '부모 능력치 기반으로 기초 재능을 물려받습니다.'}</small></article>
                <article className="panel family-summary-card"><span>후계자</span><strong>{game.family.designatedHeirId ? currentPlayerChildren.find(child => child.id === game.family.designatedHeirId)?.name ?? '다른 세대 후계자' : '미지정'}</strong><small>미지정 시 사망 시점에 직계 자녀 중 맏이가 자동 승계합니다.</small></article>
              </div>

              {isMinorSuccessor && <div className="panel family-regency-card"><strong>유소년 후계자 섭정 중</strong><p>현재 {playerGeneral.name}은(는) {playerFamilyChildAge}세입니다. 개인 자금·가문 재산·소유 아이템은 그대로 상속되며, 15세 성인식을 마치면 주요 명령 제한이 해제됩니다.</p></div>}

              {spouse ? (() => {
                const spouseGeneral = game.generals.find(general => general.id === spouse.id);
                const favor = relationshipFavor(spouse.id, game.officerBonds, game.freeOfficerRelations);
                const childPlanAffordable = moneyToCopper(game.personalTreasury) >= DEFAULT_CHILD_PLAN_RULES.moneyCostCopper;
                const childPlanReady = !game.family.pregnancy && game.actionPoints >= DEFAULT_CHILD_PLAN_RULES.actionPointCost && childPlanAffordable && spouse.city === playerGeneral.city;
                return <div className="panel family-spouse-card family-spouse-expanded">
                  <div className="family-spouse-portrait">{spouse.name.slice(0, 1)}</div>
                  <div className="family-spouse-info"><span className="eyebrow">SPOUSE</span><h3>{spouse.name}</h3><p>{spouseGeneral?.force ?? '재야'} · {game.cities.find(city => city.id === spouse.city)?.name ?? '거점 없음'} · {officerAgeText(spouse.birthYear, spouse.birthYearEstimated, game.year)}</p><small>친밀/교분 {favor}/100 · 혼인일 {game.family.marriageDate ?? '-'}</small></div>
                  <div className="family-spouse-actions"><button className="gold" disabled={!childPlanReady} onClick={planForChild}>자녀 계획</button><small>AP {DEFAULT_CHILD_PLAN_RULES.actionPointCost} · {DEFAULT_CHILD_PLAN_RULES.dayCost}일 · {formatMoney(copperToMoney(DEFAULT_CHILD_PLAN_RULES.moneyCostCopper))}</small></div>
                </div>;
              })() : <div className="panel marriage-candidates"><div className="family-card-head"><div><span className="eyebrow">MARRIAGE CANDIDATES</span><h3>결혼 후보</h3><p>같은 도시 · 이성 · 양쪽 16세 이상 · 친밀/교분 {DEFAULT_MARRIAGE_RULES.minimumFavor} 이상</p></div><strong>AP {DEFAULT_MARRIAGE_RULES.actionPointCost} · {DEFAULT_MARRIAGE_RULES.dayCost}일 · {formatMoney(copperToMoney(DEFAULT_MARRIAGE_RULES.moneyCostCopper))}</strong></div><div className="marriage-candidate-list">{marriageCandidates.length === 0 ? <div className="empty">현재 도시에는 결혼 후보가 없습니다. 다른 장수와 대화·선물을 통해 친밀도를 높이거나 도시를 이동해보세요.</div> : marriageCandidates.map(candidate => { const general = game.generals.find(entry => entry.id === candidate.officer.id); const affordable = moneyToCopper(game.personalTreasury) >= DEFAULT_MARRIAGE_RULES.moneyCostCopper; const enoughAp = game.actionPoints >= DEFAULT_MARRIAGE_RULES.actionPointCost; return <article key={candidate.officer.id} className={`marriage-candidate ${candidate.eligible ? 'eligible' : 'locked'}`}><div className="marriage-candidate-face">{candidate.officer.name.slice(0, 1)}</div><div><strong>{candidate.officer.name}</strong><span>{general?.force ?? '재야'} · {candidate.age ? `${candidate.age}세` : '나이 미상'} · 친밀/교분 {candidate.favor}/100</span><small>{candidate.eligible ? '혼인 조건 충족' : candidate.reason}</small></div><button className="gold" disabled={!candidate.eligible || !affordable || !enoughAp} onClick={() => marryCandidate(candidate.officer.id)}>{candidate.eligible ? '혼인' : '조건 미달'}</button></article>; })}</div></div>}

              {game.family.pregnancy && (() => {
                const remaining = pregnancyDaysRemaining(game.family, game.year, game.month, game.day);
                const elapsed = Math.max(0, DEFAULT_CHILD_PLAN_RULES.pregnancyDays - remaining);
                return <div className="panel pregnancy-card"><div className="family-card-head"><div><span className="eyebrow">PREGNANCY</span><h3>새 생명을 기다리는 중</h3><p>{game.family.pregnancy.fatherName} · {game.family.pregnancy.motherName}</p></div><strong>D-{remaining}</strong></div><progress max={DEFAULT_CHILD_PLAN_RULES.pregnancyDays} value={elapsed} /><div className="pregnancy-meta"><span>시작 {game.family.pregnancy.conceivedDate}</span><span>출산 예정 {game.family.pregnancy.dueDate}</span><span>게임 시간이 지나면 자동으로 출산합니다.</span></div></div>;
              })()}

              <div className="panel family-children-panel">
                <div className="family-card-head"><div><span className="eyebrow">CHILDREN</span><h3>직계 자녀 · 육아 · 후계</h3><p>15세 이전에는 육아로 성장하고, 15세 이후 성인식을 치르면 실제 장수로 등록됩니다. 후계자는 미성년이라도 가문을 이어 플레이할 수 있습니다.</p></div><strong>{currentPlayerChildren.length}명</strong></div>
                {currentPlayerChildren.length === 0 ? <div className="empty">아직 직계 자녀가 없습니다. 혼인 후 자녀 계획을 세우면 약 {DEFAULT_CHILD_PLAN_RULES.pregnancyDays}일 뒤 출산합니다.</div> : <div className="family-child-list">{currentPlayerChildren.map(child => {
                  const age = childAgeAtDate(child, game.year, game.month, game.day);
                  const stage = childDevelopmentStage(age);
                  const education = childEducationStatus(child, game.year, game.month, game.day);
                  const dominantFocus = dominantParentingFocus(child);
                  const allowedFocuses = parentingAllowedFocuses(age);
                  const canRaise = age <= DEFAULT_PARENTING_RULES.maximumChildAge && game.actionPoints >= DEFAULT_PARENTING_RULES.actionPointCost && moneyToCopper(game.personalTreasury) >= DEFAULT_PARENTING_RULES.moneyCostCopper;
                  return <article key={child.id} className="family-child-card">
                    <div className="family-child-head"><div className="family-child-avatar">{child.gender}</div><div><span className="eyebrow">{child.gender === '남' ? 'SON' : 'DAUGHTER'} · {stage}</span><h3>{child.name}</h3><p>{age}세 · 출생 {child.birthDate} · 교육 {child.educationMonths}개월{child.comingOfAgeDate ? ` · 성인식 ${child.comingOfAgeDate}` : ''}</p></div><div className="family-child-actions"><button onClick={() => renameChild(child.id)}>이름 변경</button><button className={game.family.designatedHeirId === child.id ? 'gold' : ''} onClick={() => designateHeir(child.id)}>{game.family.designatedHeirId === child.id ? '후계자 지정됨' : '후계자 지정'}</button>{age >= 15 && !child.comingOfAgeDate && <button className="gold" onClick={() => holdComingOfAge(child.id)}>성인식 · 3일</button>}</div></div>
                    <div className="child-growth-strip"><span><b>성장 단계</b>{stage}</span><span><b>성격</b>{child.personality}</span><span><b>부모 유대</b>{child.parentBond}/100</span><span><b>교육 상태</b>{education.label}</span><span><b>주 교육</b>{dominantFocus}</span><span><b>재능</b>{childTalentSummary(child)}</span></div>
                    <p className="child-stage-description">{childDevelopmentDescription(age)}</p>
                    <div className="child-stat-grid">{Object.entries(child.stats).map(([key, value]) => <div key={key}><span>{CORE_STAT_LABELS[key as CoreStatKey]}</span><strong>{value}</strong></div>)}</div>
                    <div className="child-profile-row"><span>성향 <strong>{child.tendencies.length ? child.tendencies.join(' · ') : '형성 중'}</strong></span><span>특성 <strong>{child.traits.length ? child.traits.join(' · ') : '형성 중'}</strong></span><span>성장 이정표 <strong>{child.completedMilestones.length ? child.completedMilestones.map((value: number) => `${value}세`).join(' · ') : '아직 없음'}</strong></span></div>
                    <div className="parenting-focus-grid">{PARENTING_FOCUSES.map(focus => { const allowed = allowedFocuses.includes(focus); return <button key={focus} className={!allowed ? 'stage-locked' : ''} disabled={!canRaise || !allowed} onClick={() => raiseChild(child.id, focus)} title={allowed ? parentingFocusDescription(focus) : `${stage}에는 아직 선택할 수 없는 교육입니다.`}><strong>{focus}</strong><span>{child.upbringing[focus] ?? 0}회</span><small>{allowed ? parentingFocusDescription(focus) : `${stage} 잠금`}</small></button>; })}</div>
                    <div className="parenting-cost">한 달 육아 · AP {DEFAULT_PARENTING_RULES.actionPointCost} · {DEFAULT_PARENTING_RULES.dayCost}일 · {formatMoney(copperToMoney(DEFAULT_PARENTING_RULES.moneyCostCopper))}{age > DEFAULT_PARENTING_RULES.maximumChildAge ? (child.comingOfAgeDate ? ` · 성인식 완료 · 장수 ${child.officerId ? '등록' : '미등록'}` : ' · 성인식 대기') : ` · 현재 ${stage}`}</div>
                  </article>;
                })}</div>}
              </div>

              <div className="panel family-chronicle"><div className="family-card-head"><div><span className="eyebrow">FAMILY CHRONICLE</span><h3>가족 연대기</h3></div><strong>{game.family.chronicle.length}건</strong></div><div className="family-chronicle-list">{game.family.chronicle.length ? game.family.chronicle.map(entry => <span key={entry.id}><b>{entry.date}</b> · {entry.text}</span>) : <span>아직 기록된 가족 사건이 없습니다.</span>}</div></div>
            </section>
          )}

          {tab === '인사' && playerGeneral && (
            <section>
              <div className="section-head"><div><span className="eyebrow">PERSONNEL</span><h2>인사 · 신분 / 보직</h2></div><span className="role-chip">{playerAuthority} · {affiliatedForce}</span></div>
              {!canManageForce ? <><div className="personnel-summary-grid"><div className="panel"><span>플레이 장수</span><strong>{playerGeneral.name}</strong><small>{personnelLabel(playerGeneral)}</small></div><div className="panel"><span>현재 보직</span><strong>{playerGeneral.appointment}</strong><small>{playerGeneral.appointment === '태수' ? `${game.cities.find(city => city.id === playerGeneral.appointmentCityId)?.name ?? '-'} 담당` : appointmentDefinition(playerGeneral.appointment).effect}</small></div><div className="panel"><span>세력 군주</span><strong>{game.ruler || '없음'}</strong><small>{affiliatedForce}</small></div></div><div className="panel role-permission locked"><strong>인사 발령 권한 없음</strong><span>{playerAuthority} 신분에서는 다른 장수의 직급·보직을 임명하지 않습니다. 태수라면 담당 도시의 내정·군사 권한만 행사합니다.</span></div></> : personnelGeneral ? <>
              <div className="personnel-summary-grid">
                <div className="panel"><span>군주</span><strong>{game.ruler}</strong><small>군주 · {forceRank.name}</small></div>
                <div className="panel"><span>세력 최대 출정</span><strong>{forceTroopLimitLabel(forceRank)}</strong><small>보유 도시 {playerCities.length}개 · 군주 작위 {forceRank.name}</small></div>
                <div className="panel"><span>임명 가능 최고 직급</span><strong>{allowedOfficerRanks[allowedOfficerRanks.length - 1]?.name}</strong><small>세력 지위 상승 시 상위 직급 해금</small></div>
              </div>
              <div className="personnel-layout">
                <div className="panel personnel-roster">
                  <h3>휘하 장수</h3>
                  <div className="personnel-list">{playerGenerals.map(general => <button key={general.id} className={personnelGeneral.id === general.id ? 'selected' : ''} onClick={() => setSelectedGeneralId(general.id)}><strong>{general.name}</strong><span>{personnelLabel(general)}</span><small>개인 편성 {unitCommandCap(general).toLocaleString()}명 · 충성 {general.loyalty}</small></button>)}</div>
                </div>
                <div className="panel personnel-detail">
                  <div className="big-title"><h3>{personnelGeneral.name}</h3><span>{personnelLabel(personnelGeneral)} · {game.cities.find(city => city.id === personnelGeneral.city)?.name ?? '거점 없음'}</span></div>
                  {personnelGeneral.name === game.ruler ? (
                    <div className="personnel-ruler-note"><strong>군주 작위는 보유 도시 수로 자동 결정</strong><p>현재 {forceRank.name} · 세력 최대 출정 {forceTroopLimitLabel(forceRank)}. 왕과 황제는 세력 전체 편성 상한이 없지만 실제 출정은 도시 보유 병력과 각 장수의 개인 지휘 한도를 따릅니다. 군주에게 별도 장수 직급이나 보직은 부여하지 않습니다.</p></div>
                  ) : (
                    <>
                      <div className="personnel-form-grid">
                        <label>직급<select value={personnelRankDraft} onChange={event => setPersonnelRankDraft(event.target.value as OfficerRank)}>{allowedOfficerRanks.map(rank => <option key={rank.name} value={rank.name}>{rank.name} · 상한 {rank.maxTroops.toLocaleString()}명</option>)}</select></label>
                        <label>보직<select value={personnelAppointmentDraft} onChange={event => setPersonnelAppointmentDraft(event.target.value as OfficerAppointment)}>{allowedAppointments.map(appointment => <option key={appointment.name} value={appointment.name}>{appointment.name}</option>)}</select></label>
                        {personnelAppointmentDraft === '태수' && <label>담당 도시<select value={personnelCityDraft} onChange={event => setPersonnelCityDraft(event.target.value)}>{playerCities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label>}
                      </div>
                      <div className="personnel-effect-box"><strong>{personnelRankDraft}</strong><p>{rankDefinition(personnelRankDraft).description}</p><strong>{personnelAppointmentDraft}</strong><p>{appointmentDefinition(personnelAppointmentDraft).effect}</p><span>현재 개인 편성 {unitCommandCap(personnelGeneral).toLocaleString()}명 → 발령 후 약 {officerCommandCap(personnelRankDraft, forceRank.maxTroops, effectiveStat(personnelGeneral, 'leadership'), effectiveStat(personnelGeneral, 'militaryStrategy'), personnelAppointmentDraft, false).toLocaleString()}명</span></div>
                      <button className="gold" disabled={game.actionPoints < 2} onClick={applyPersonnel}>이 내용으로 인사 발령 · AP 2 · 1일</button>
                    </>
                  )}
                </div>
              </div>
              <div className="appointment-overview">{APPOINTMENT_OPTIONS.filter(option => option.name !== '없음').map(option => { const holders = affiliatedGenerals.filter(general => general.appointment === option.name); return <div className="panel" key={option.name}><strong>{option.name}</strong><p>{option.effect}</p><span>{holders.length ? holders.map(general => `${general.name}${option.name === '태수' ? `(${game.cities.find(city => city.id === general.appointmentCityId)?.name ?? '-'})` : ''}`).join(', ') : '미임명'}</span></div>; })}</div></> : null}
            </section>
          )}

          {tab === '무장' && officerSelectedGeneral && (
            <section className="officer-screen">
              <div className="section-head"><div><span className="eyebrow">MY PARTY</span><h2>플레이 장수 · 관리 동료</h2></div><div className="summary-chips"><span>관리 가능 {playerGenerals.length}명</span><span>선택 {officerSelectedGeneral.name}</span></div></div>
              <div className="officer-screen-grid">
                <div className="panel officer-main-frame" data-portrait-resource={FUTURE_OFFICER_PORTRAIT_PATH} data-fullbody-resource={FUTURE_OFFICER_FULLBODY_PATH}>
                  <div className="officer-fullbody-slot" aria-label="전신 이미지 예정 영역"><span>{officerSelectedGeneral.name}</span><strong>전신 이미지 예정</strong><small>추후 제작된 전신 이미지를 이 프레임 안에서만 배경처럼 표시</small></div>
                  <div className="officer-main-content">
                    <div className="officer-identity-row"><div className="officer-portrait-slot" aria-label="초상화 예정 영역"><span>{officerSelectedGeneral.name.slice(0, 1)}</span><small>초상화 예정</small></div><div className="big-title officer-title"><h3>{officerSelectedGeneral.name}</h3><span>{officerSelectedGeneral.force} · {game.cities.find(city => city.id === officerSelectedGeneral.city)?.name ?? '재야'} · {officerAgeText(officerSelectedGeneral.birthYear, officerSelectedGeneral.birthYearEstimated, game.year)} · 충성 {officerSelectedGeneral.loyalty}</span><span>{personnelLabel(officerSelectedGeneral)} · 편성한도 {unitCommandCap(officerSelectedGeneral).toLocaleString()}명</span></div></div>
                    <div className="officer-info-surface">
                      <div className="officer-detail-tabs">{(['기본능력', '전문능력', '특성·관계', '장비'] as const).map(entry => <button key={entry} className={officerInfoTab === entry ? 'active' : ''} onClick={() => setOfficerInfoTab(entry)}>{entry}</button>)}</div>
                      {officerInfoTab === '기본능력' && <div className="ability-grid">{([['leadership', '통솔'], ['martial', '무력'], ['intelligence', '지략'], ['militaryStrategy', '군략'], ['politics', '정치'], ['diplomacy', '외교'], ['personnel', '인사'], ['charisma', '매력']] as const).map(([key, label]) => { const bonus = equipmentBonusForStat(officerSelectedGeneral, key); const base = officerSelectedGeneral[key]; const bond = game.officerBonds[officerSelectedGeneral.id]; const xp = bond?.trainingXp[key] ?? 0; return <div key={key}><span>{label}</span><strong>{effectiveStat(officerSelectedGeneral, key)}</strong>{bonus !== 0 && <small>({base} + {bonus})</small>}<small className="training-xp">전수 EXP {xp}/100</small></div>; })}</div>}
                      {officerInfoTab === '전문능력' && <div className="specialty-grid">{SPECIALTY_KEYS.map(key => <div key={key} className={`specialty-grade grade-${officerSelectedGeneral.specialties[key]}`}><span>{key}</span><strong>{officerSelectedGeneral.specialties[key]}</strong></div>)}</div>}
                      {officerInfoTab === '특성·관계' && <><div className="trait-profile"><div><h4>특성</h4><div className="trait-chip-list">{officerSelectedGeneral.traits.length ? officerSelectedGeneral.traits.map(trait => <span key={trait} title={traitEffectLabel(trait)}>{trait}{traitEffectLabel(trait) ? ` · ${traitEffectLabel(trait)}` : ''}</span>) : <em>없음</em>}</div></div><div><h4>성향</h4><div className="trait-chip-list">{officerSelectedGeneral.tendencies.length ? officerSelectedGeneral.tendencies.map(value => <span key={value} title={tendencyEffectLabel(value)}>{value}{tendencyEffectLabel(value) ? ` · ${tendencyEffectLabel(value)}` : ''}</span>) : <em>없음</em>}</div></div><div><h4>관계</h4><div className="trait-chip-list">{officerSelectedGeneral.relations.length ? officerSelectedGeneral.relations.map(value => <span key={value}>{value}</span>) : <em>없음</em>}</div></div></div>
                      {(() => { const bond = game.officerBonds[officerSelectedGeneral.id] ?? { favor: 0, talks: 0, gifts: 0, trainingXp: {} }; const self = officerSelectedGeneral.id === playerGeneral?.id; const sameCity = officerSelectedGeneral.city === playerGeneral?.city; return <div className="officer-relation-panel"><div className="officer-relation-head"><div><span>플레이 장수와의 관계</span><strong>{self ? '본인' : `친밀 ${bond.favor}/100`}</strong></div><small>{self ? playerAuthority : `대화 ${bond.talks}회 · 선물 ${bond.gifts}회`}</small></div>{self ? <div className="officer-self-note">플레이 장수 본인입니다. 관계 행동 대신 개인 행동·장비·교역을 사용하세요.</div> : <><div className="officer-interaction-row"><button onClick={() => talkToOfficer(officerSelectedGeneral.id)} disabled={!sameCity || game.actionPoints < 2}>대화 · AP 2 · 1일</button><select aria-label="무장 선물 선택" value={officerGiftItemId} onChange={event => setOfficerGiftItemId(event.target.value)}><option value="">선물할 보유 장비</option>{itemCatalog.filter(item => itemCount(game, item.id) > 0).map(item => <option key={item.id} value={item.id}>{item.name} · {item.bonus}</option>)}</select><button onClick={() => giftToOfficer(officerSelectedGeneral.id)} disabled={!sameCity || !officerGiftItemId || game.actionPoints < 2}>선물 · AP 2</button></div><div className="officer-training-row"><select aria-label="전수 능력 선택" value={officerTrainingStat} onChange={event => setOfficerTrainingStat(event.target.value as CoreStatKey)}>{(Object.keys(CORE_STAT_LABELS) as CoreStatKey[]).map(key => <option key={key} value={key}>{CORE_STAT_LABELS[key]} · EXP {bond.trainingXp[key] ?? 0}/100</option>)}</select><button className="gold" onClick={() => trainOfficer(officerSelectedGeneral.id)} disabled={!sameCity || officerSelectedGeneral.force !== playerGeneral?.force || game.actionPoints < 5}>전수 훈련 · AP 5 · 2일</button></div></>}</div>; })()}</>}
                      {officerInfoTab === '장비' && <><div className="equipment-slots officer-equipment-slots">{EQUIPPABLE_TYPES.map(type => { const item = catalogItem(officerSelectedGeneral.equipment[type] ?? ''); return <button type="button" key={type} className={officerEquipmentSlot === type ? 'active' : ''} onClick={() => setOfficerEquipmentSlot(current => current === type ? null : type)}><span>{type}</span><strong>{item?.name ?? '없음'}</strong><small>클릭하여 변경</small></button>; })}</div>{officerEquipmentSlot && <div className="officer-equipment-picker"><div className="officer-equipment-picker-head"><strong>{officerEquipmentSlot} 장착 가능 장비</strong>{officerSelectedGeneral.equipment[officerEquipmentSlot] && <button type="button" onClick={() => unequipItem(officerSelectedGeneral.equipment[officerEquipmentSlot]!, officerSelectedGeneral.id)}>현재 장비 해제</button>}</div><div className="officer-equipment-options">{ownedEquipment.filter(item => item.type === officerEquipmentSlot).length === 0 ? <div className="empty">보유 중인 {officerEquipmentSlot} 장비가 없습니다.</div> : ownedEquipment.filter(item => item.type === officerEquipmentSlot).map(item => { const wearers = game.generals.filter(general => Object.values(general.equipment).includes(item.id)); return <button type="button" key={item.id} className={officerSelectedGeneral.equipment[officerEquipmentSlot] === item.id ? 'selected' : ''} onClick={() => { equipItem(item.id, officerSelectedGeneral.id); setOfficerEquipmentSlot(null); }}><strong>{item.name} ×{itemCount(game, item.id)}</strong><span>{item.bonus}</span><small>{wearers.length ? `착용 ${wearers.map(general => general.name).join(', ')}` : '미장착'}</small></button>; })}</div></div>}</>}
                    </div>
                  </div>
                </div>
                <aside className="panel officer-roster-panel"><div className="officer-roster-head"><div><span className="eyebrow">CONTROLLED</span><h3>관리 장수</h3></div><strong>{playerGenerals.length}</strong></div><div className="officer-roster-list">{playerGenerals.map(general => { const bond = game.officerBonds[general.id] ?? { favor: 0, talks: 0, gifts: 0, trainingXp: {} }; return <button key={general.id} className={general.id === officerSelectedGeneral.id ? 'selected' : ''} onClick={() => { setSelectedGeneralId(general.id); setOfficerGiftItemId(''); setOfficerEquipmentSlot(null); }}><span className="officer-roster-face">{general.name.slice(0, 1)}</span><div><strong>{general.name}</strong><small>{personnelLabel(general)} · {game.cities.find(city => city.id === general.city)?.name ?? '거점 없음'}</small><em>{general.id === playerGeneral?.id ? playerAuthority : general.name === game.ruler ? '군주' : `친밀 ${bond.favor}/100`}</em></div></button>; })}</div></aside>
              </div>
            </section>
          )}

          {tab === '상점' && (
            <section>
              <div className="section-head"><div><span className="eyebrow">MARKET</span><h2>상점 · 개인 시장</h2></div><div className="market-head-tools"><span className="trade-location">현재 위치 · <strong>{tradeCity?.name ?? '거점 없음'}</strong> · {game.playerStatus}</span><div className="summary-chips"><span>개인 자금 {formatMoney(game.personalTreasury)}</span><span>휴대 화물 {Object.values(game.tradeGoods ?? {}).reduce((sum, count) => sum + count, 0)}묶음</span></div></div></div>
              <div className="store-section-tabs" role="tablist" aria-label="상점 분류">
                {SHOP_SECTIONS.map(section => <button key={section} className={shopSection === section ? 'active' : ''} onClick={() => { setShopSection(section); setShopItemFilter(section === '장신구' ? '장신구' : '전체'); setSelectedShopItemId(''); }}>{section}</button>)}
              </div>

              {shopSection === '교역' && (
                <>
                  {tradeCity ? <div className="panel trade-market"><div className="trade-market-head"><div><span className="eyebrow">SPECIALTY TRADE</span><h3>{tradeCity.name} 교역 시장</h3><p>도시 소유 여부와 관계없이 플레이 장수가 실제로 머무는 도시에서 개인 자금으로 거래합니다. 재야·소속장수·독립부대도 이용할 수 있습니다.</p></div><div className="trade-market-control"><span>특산물 <strong>{cityIdentity(tradeCity).product}</strong></span><label>거래량<select value={tradeAmount} onChange={event => setTradeAmount(Number(event.target.value))}><option value={1}>1묶음</option><option value={5}>5묶음</option><option value={10}>10묶음</option></select></label><small>AP {Math.max(1, Math.ceil(tradeAmount / 5))} · {Math.max(1, Math.ceil(tradeAmount / 5))}일</small></div></div><div className="caravan-planner"><div className="caravan-planner-head"><div><span className="eyebrow">CARAVAN ROUTE</span><h3>상단 · 교역로</h3><p>화물을 싣고 목적지까지 직접 이동합니다. 거리·타 세력 지역·도적 위험과 호위 장수 능력에 따라 손실 위험이 달라집니다.</p></div><strong>{playerGeneral?.name}</strong></div><div className="caravan-form-grid"><label>목적지<select value={caravanDestination?.id ?? ''} onChange={event => setTradeDestinationId(event.target.value)}>{caravanDestinations.map(city => <option key={city.id} value={city.id}>{city.name} · {city.owner}</option>)}</select></label><label>화물<select value={caravanGoodName} onChange={event => setTradeGoodSelection(event.target.value)}>{TRADE_GOODS.map(good => <option key={good.name} value={good.name}>{good.name} · 보유 {tradeGoodCount(game, good.name)}</option>)}</select></label><label>수량<select value={caravanAmount} onChange={event => setCaravanAmount(Number(event.target.value))}><option value={1}>1묶음</option><option value={5}>5묶음</option><option value={10}>10묶음</option></select></label><label>호위<select value={caravanEscort?.id ?? ''} onChange={event => setTradeEscortId(event.target.value)}><option value="">호위 없음</option>{caravanEscortCandidates.map(general => <option key={general.id} value={general.id}>{general.name} · 통솔 {general.leadership} / 무력 {general.martial}</option>)}</select></label></div>{caravanDestination && <div className="caravan-stats"><span>이동 <strong>{Number.isFinite(caravanDays) ? `${caravanDays}일` : '-'}</strong></span><span>위험도 <strong>{caravanRisk}%</strong></span><span>도착 판매가 <strong>{formatMoney(copperToMoney(caravanExpectedSellPrice))}</strong></span><span>현지 매입 대비 <strong className={caravanExpectedMargin >= 0 ? 'profit' : 'loss'}>{caravanExpectedMargin >= 0 ? '+' : ''}{formatMoney(copperToMoney(Math.abs(caravanExpectedMargin)))}</strong></span></div>}<button className="gold caravan-dispatch" disabled={!caravanDestination || !Number.isFinite(caravanDays) || tradeGoodCount(game, caravanGoodName) < caravanAmount || game.actionPoints < 4} onClick={dispatchTradeCaravan}>상단 출발 · AP 4 · {Number.isFinite(caravanDays) ? `${caravanDays}일` : '-'}</button>{(game.tradeJourneys ?? []).length > 0 && <div className="caravan-history"><strong>최근 상단</strong>{(game.tradeJourneys ?? []).slice(0, 3).map(record => <span key={record.id}>{game.cities.find(city => city.id === record.originCityId)?.name ?? '-'}→{game.cities.find(city => city.id === record.targetCityId)?.name ?? '-'} · {record.goodName} {record.quantity}묶음 · {record.attacked ? `습격/손실 ${record.lostQuantity}` : '무사 도착'} · {record.arrivalDate}</span>)}</div>}</div><div className="trade-good-grid">{TRADE_GOODS.map(good => { const owned = tradeGoodCount(game, good.name); const buyPrice = cityTradePrice(tradeCity, good.name, 'buy'); const sellPrice = cityTradePrice(tradeCity, good.name, 'sell'); const local = cityIdentity(tradeCity).product === good.name; const actionCost = Math.max(1, Math.ceil(tradeAmount / 5)); return <article key={good.name} className={`trade-good-card ${local ? 'local' : ''}`}><div className="trade-good-title"><strong>{good.name}</strong><span>{local ? '생산지' : '시장'}</span></div><p>{good.description}</p><div className="trade-good-prices"><span>매입 <strong>{formatMoney(copperToMoney(buyPrice))}</strong></span><span>판매 <strong>{formatMoney(copperToMoney(sellPrice))}</strong></span></div><small>휴대 {owned}묶음</small><div className="trade-good-actions"><button disabled={game.actionPoints < actionCost || moneyToCopper(game.personalTreasury) < buyPrice * tradeAmount} onClick={() => tradeSpecialtyGood(good.name, 'buy')}>매입 ×{tradeAmount}</button><button className="gold" disabled={game.actionPoints < actionCost || owned < tradeAmount} onClick={() => tradeSpecialtyGood(good.name, 'sell')}>판매 ×{tradeAmount}</button></div></article>; })}</div><div className="trade-market-foot">특산품은 개인 화물로 자동 지급되지 않습니다. 누구든 현재 도시 시장에서 직접 매입하고 상단으로 운송해 시세 차익을 얻습니다.</div></div> : <div className="panel empty store-empty">현재 장수가 머무는 도시가 없어 교역할 수 없습니다.</div>}
                </>
              )}

              {shopSection !== '교역' && (
                <div className="store-catalog-shell">
                  <aside className="panel store-catalog-sidebar">
                    <div className="store-catalog-heading"><div><span className="eyebrow">CATALOG</span><h3>{shopSection}</h3></div><strong>{shopItems.length}</strong></div>
                    {shopFilters.length > 1 && <div className="store-filter-row">{shopFilters.map(filter => <button key={filter} className={shopItemFilter === filter ? 'active' : ''} onClick={() => { setShopItemFilter(filter); setSelectedShopItemId(''); }}>{filter}</button>)}</div>}
                    <div className="store-catalog-list">
                      {shopItems.length === 0 ? <div className="empty">판매 중인 물품이 없습니다.</div> : shopItems.map(item => { const count = itemCount(game, item.id); const offer = cityShopOffer(game, tradeCity, item); const affordable = moneyToCopper(game.personalTreasury) >= offer.priceCopper; return <button key={item.id} className={`${selectedShopItem?.id === item.id ? 'selected' : ''} ${offer.stock <= 0 ? 'sold-out' : ''}`} onClick={() => setSelectedShopItemId(item.id)}><div><strong>{item.name}</strong><span>{item.type} · {item.bonus || '효과 없음'}</span></div><div className="store-catalog-price"><strong>{formatMoney(copperToMoney(offer.priceCopper))}</strong><small className={offer.stock <= 0 ? 'insufficient' : affordable ? '' : 'insufficient'}>{offer.stock <= 0 ? '품절' : `재고 ${offer.stock}`} · 보유 {count}</small></div></button>; })}
                    </div>
                  </aside>
                  <div className="panel store-item-detail">
                    {selectedShopItem ? (() => { const offer = selectedShopOffer ?? cityShopOffer(game, tradeCity, selectedShopItem); const blocked = Boolean((selectedShopItem.unique && selectedShopItemCount > 0) || offer.stock <= 0 || !tradeCity); const affordable = moneyToCopper(game.personalTreasury) >= offer.priceCopper; const statEntries = Object.entries(selectedShopItem.bonuses).filter(([, value]) => Number(value) !== 0) as Array<[CoreStatKey, number]>; return <>
                      <div className="store-item-detail-head"><div><span className="tag">{selectedShopItem.type}</span><h3>{selectedShopItem.name}</h3><p>{selectedShopItem.bonus || '별도의 능력치 효과가 없습니다.'}</p></div><span className={`store-stock-badge ${selectedShopItem.unique ? 'unique' : ''}`}>재고 {offer.stock} · {selectedShopItem.unique ? '유니크' : offer.marketLabel}</span></div>
                      <div className="store-detail-grid">
                        <div><span>현재 도시 가격</span><strong>{formatMoney(copperToMoney(offer.priceCopper))}</strong><small>{tradeCity?.name ?? '도시 없음'} · {offer.marketLabel}</small></div>
                        <div><span>시장 재고</span><strong>{offer.stock}개</strong><small>월초 재입고 · 기준 {offer.baseStock}</small></div><div><span>현재 보유</span><strong>{selectedShopItemCount}개</strong></div>
                        <div><span>개인 자금</span><strong>{formatMoney(game.personalTreasury)}</strong></div>
                        <div><span>착용 중</span><strong>{selectedShopWearers.length ? selectedShopWearers.map(general => general.name).join(', ') : '없음'}</strong></div>
                      </div>
                      <div className="store-effect-panel"><span className="eyebrow">EFFECT</span>{statEntries.length > 0 ? <div className="store-effect-list">{statEntries.map(([key, value]) => <span key={key}>{CORE_STAT_LABELS[key]} <strong>+{value}</strong></span>)}</div> : <p>{selectedShopItem.bonus || '효과 없음'}</p>}</div>
                      <div className="store-detail-note">{selectedShopItem.type === '소모품' ? '구매 후 보유 장비 화면에서 사용할 수 있습니다. 회복 계열 소모품은 하루 1회만 사용됩니다.' : selectedShopItem.type === '책' ? `구매 후 장수에게 연구시킬 수 있습니다. ${bookStudySummary(selectedShopItem.id)}` : EQUIPPABLE_TYPES.includes(selectedShopItem.type) ? '구매 후 장비 메뉴에서 원하는 장수에게 장착해 실제 능력치 보정을 받을 수 있습니다.' : '구매한 물품은 개인 보유품에 추가됩니다.'}</div>
                      <button className="gold store-buy-selected" disabled={blocked || !affordable} onClick={() => buyShopItem(selectedShopItem)}>{!tradeCity ? '현재 도시 없음' : offer.stock <= 0 ? '이번 달 품절' : selectedShopItem.unique && selectedShopItemCount > 0 ? '유니크 보유 중' : affordable ? `${selectedShopItem.name} 구매 · ${formatMoney(copperToMoney(offer.priceCopper))}` : '개인 자금 부족'}</button>
                    </>; })() : <div className="empty">왼쪽 목록에서 물품을 선택하세요.</div>}
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === '장비' && officerSelectedGeneral && (
            <section>
              <div className="section-head">
                <div><span className="eyebrow">EQUIPMENT INVENTORY</span><h2>보유 장비</h2></div>
                <span className="role-chip">현재 위치 · {tradeCity?.name ?? '거점 없음'} · 개인 인벤토리</span>
              </div>
              <div className="equipment-screen-grid">
                <div className="panel equipment-detail-frame">
                  {selectedInventoryItem ? <>
                    <div className="equipment-detail-hero"><span>{selectedInventoryItem.type}</span><strong>{selectedInventoryItem.name}</strong><small>장비 이미지 영역 · 추후 추가</small></div>
                    <div className="equipment-detail-copy"><div className="big-title"><h3>{selectedInventoryItem.name}</h3><span>{selectedInventoryItem.type} · {selectedInventoryItem.bonus}</span></div><div className="equipment-meta-grid"><div><span>효과</span><strong>{selectedInventoryItem.bonus}</strong></div><div><span>현재 상태</span><strong>{EQUIPPABLE_TYPES.includes(selectedInventoryItem.type) ? (selectedInventoryWearers.length ? `착용 ${selectedInventoryWearers.map(general => general.name).join(', ')}` : '미장착') : selectedInventoryItem.type === '소모품' ? (consumableUsedToday ? '오늘 회복 사용 완료' : '사용 가능') : selectedInventoryItem.type === '책' ? `연구 가능 · ${officerSelectedGeneral.name}` : '보관/선물용'}</strong></div><div><span>기준 가치</span><strong>{formatMoney(copperToMoney(selectedInventoryItem.priceCopper))}</strong></div><div><span>보유 수량</span><strong>{itemCount(game, selectedInventoryItem.id)}개</strong></div></div>{selectedInventoryItem.type === '책' && <div className="book-study-progress"><span>{bookStudySummary(selectedInventoryItem.id)}</span><div>{Object.entries(BOOK_STUDY_EFFECTS[selectedInventoryItem.id] ?? {}).map(([key]) => <small key={key}>{CORE_STAT_LABELS[key as CoreStatKey]} EXP {selectedBookStudyXp[key as CoreStatKey] ?? 0}/100</small>)}</div></div>}</div>
                    <div className="equipment-detail-actions">{(EQUIPPABLE_TYPES.includes(selectedInventoryItem.type) || selectedInventoryItem.type === '책') && <label>{selectedInventoryItem.type === '책' ? '연구 장수' : '장착 대상'}<select value={officerSelectedGeneral.id} onChange={event => setSelectedGeneralId(event.target.value)}>{playerGenerals.map(general => <option key={general.id} value={general.id}>{general.name} · {personnelLabel(general)}</option>)}</select></label>}<div>{EQUIPPABLE_TYPES.includes(selectedInventoryItem.type) && <button className="gold" onClick={() => equipItem(selectedInventoryItem.id, officerSelectedGeneral.id)}>{selectedInventoryWearer?.id === officerSelectedGeneral.id ? '현재 장착 중' : '선택 무장에게 장착'}</button>}{EQUIPPABLE_TYPES.includes(selectedInventoryItem.type) && <button disabled={!selectedInventoryWearer} onClick={() => selectedInventoryWearer && unequipItem(selectedInventoryItem.id, selectedInventoryWearer.id)}>장착 해제</button>}{selectedInventoryItem.type === '소모품' && <button className="gold" disabled={consumableUsedToday || itemCount(game, selectedInventoryItem.id) <= 0} onClick={() => useConsumable(selectedInventoryItem.id)}>{consumableUsedToday ? '오늘 사용 완료' : '소모품 사용'}</button>}{selectedInventoryItem.type === '책' && <button className="gold" disabled={game.actionPoints < 5} onClick={() => studyBook(selectedInventoryItem.id, officerSelectedGeneral.id)}>연구 · AP 5 · 2일</button>}<button onClick={() => { setEquipmentGiftOpen(true); setEquipmentGiftTargetId(''); }}>선물하기</button></div></div>
                  </> : <div className="empty">현재 보유한 장비가 없습니다.</div>}
                </div>
                <aside className="panel equipment-inventory-panel"><div className="equipment-inventory-head"><div><span className="eyebrow">MY ITEMS</span><h3>보유 아이템</h3></div><strong>{ownedEquipment.length}</strong></div><div className="equipment-inventory-list">{ownedEquipment.length === 0 ? <div className="empty">보유 아이템 없음</div> : ownedEquipment.map(item => { const wearers = game.generals.filter(general => Object.values(general.equipment).includes(item.id)); return <button type="button" key={item.id} className={selectedInventoryItem?.id === item.id ? 'selected' : ''} onClick={() => { setSelectedInventoryItemId(item.id); setEquipmentGiftOpen(false); }}><span className="equipment-list-type">{item.type.slice(0, 1)}</span><div><strong>{item.name} ×{itemCount(game, item.id)}</strong><small>{item.bonus}</small><em>{wearers.length ? `착용 ${wearers.map(general => general.name).join(', ')}` : item.unique ? '유니크' : '보유 중'}</em></div></button>; })}</div></aside>
              </div>
            </section>
          )}

          {tab === '에디터' && selectedCity && (
            <section>
              <div className="section-head">
                <div>
                  <span className="eyebrow">EDITOR</span>
                  <h2>게임 에디터</h2>
                </div>
                {renderCitySelector()}
              </div>
              <div className="editor-grid">
                <div className="panel">
                  <h3>무장 추가</h3>
                  <p className="muted">신규 무장은 8대 기본능력 70 · 전문능력 C로 생성합니다.</p>
                  <input aria-label="신규 무장 이름" placeholder="신규 무장 이름" value={editorName} onChange={event => { setEditorName(event.target.value); setEditorError(''); }} />
                  {editorError && <div className="form-error">{editorError}</div>}
                  <button onClick={addGeneral}>무장 추가</button>
                  <h3>보유 장비 편집</h3>
                  <div className="editor-item-list">
                    {itemCatalog.map(item => <label key={item.id}><input type="checkbox" checked={itemCount(game, item.id) > 0} onChange={() => toggleEditorItem(item.id)} /><span>{item.name}</span><small>{item.bonus}</small></label>)}
                  </div>
                </div>
                <div className="panel editor-officer-panel">
                  <h3>무장 상세 편집</h3>
                  <select value={selectedGeneralId} onChange={event => setSelectedGeneralId(event.target.value)}>{game.generals.map(general => <option key={general.id} value={general.id}>{general.name} · {general.force}</option>)}</select>
                  {selectedGeneral && <>
                    <div className="editor-stat-grid">{([
                      ['leadership', '통솔'], ['martial', '무력'], ['intelligence', '지략'], ['militaryStrategy', '군략'], ['politics', '정치'], ['diplomacy', '외교'], ['personnel', '인사'], ['charisma', '매력'],
                    ] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min="0" max="100" value={selectedGeneral[key]} onChange={event => editGameGeneralStat(key, Number(event.target.value))} /></label>)}</div>
                    <div className="editor-inline-grid"><label>충성<input type="number" min="0" max="100" value={selectedGeneral.loyalty} onChange={event => editGameGeneralStat('loyalty', Number(event.target.value))} /></label><label>소속 도시<select value={selectedGeneral.city} onChange={event => editGameGeneralCity(event.target.value)}>{game.cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label><label>직급<select disabled={selectedGeneral.name === game.ruler} value={selectedGeneral.name === game.ruler ? allowedOfficerRanks[allowedOfficerRanks.length - 1]?.name : selectedGeneral.rank} onChange={event => editGameGeneralRank(event.target.value as OfficerRank)}>{allowedOfficerRanks.map(rank => <option key={rank.name} value={rank.name}>{rank.name} · {rank.maxTroops.toLocaleString()}명</option>)}</select></label><label>보직<select disabled={selectedGeneral.name === game.ruler} value={selectedGeneral.name === game.ruler ? '없음' : selectedGeneral.appointment} onChange={event => editGameGeneralAppointment(event.target.value as OfficerAppointment)}>{allowedAppointments.map(appointment => <option key={appointment.name} value={appointment.name}>{appointment.name}</option>)}</select></label>{selectedGeneral.appointment === '태수' && selectedGeneral.name !== game.ruler && <label>태수 도시<select value={selectedGeneral.appointmentCityId ?? selectedGeneral.city} onChange={event => editGameGeneralAppointment('태수', event.target.value)}>{playerCities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label>}</div>
                    <h4>전문능력</h4>
                    <div className="editor-specialty-grid">{SPECIALTY_KEYS.map(key => <label key={key}>{key}<select value={selectedGeneral.specialties[key]} onChange={event => editGameGeneralSpecialty(key, event.target.value as (typeof SPECIALTY_GRADES)[number])}>{SPECIALTY_GRADES.map(grade => <option key={grade}>{grade}</option>)}</select></label>)}</div>
                    <div className="editor-profile-row"><div><strong>특성 {selectedGeneral.traits.length}/10</strong><span>{selectedGeneral.traits.join(' · ') || '없음'}</span><button onClick={() => { setGameProfilePicker('traits'); setGameProfilePickerQuery(''); }}>특성 편집</button></div><div><strong>성향 {selectedGeneral.tendencies.length}/5</strong><span>{selectedGeneral.tendencies.join(' · ') || '없음'}</span><button onClick={() => { setGameProfilePicker('tendencies'); setGameProfilePickerQuery(''); }}>성향 편집</button></div></div>
                  </>}
                </div>
                <div className="panel">
                  <h3>{selectedCity.name} 수치 편집</h3>
                  <label>
                    상업{' '}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedCity.commerce}
                      onChange={event =>
                        editSelectedCity('commerce', Number(event.target.value))
                      }
                    />
                  </label>
                  <label>
                    농업{' '}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedCity.agriculture}
                      onChange={event =>
                        editSelectedCity(
                          'agriculture',
                          Number(event.target.value)
                        )
                      }
                    />
                  </label>
                  <label>
                    치안{' '}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedCity.security}
                      onChange={event =>
                        editSelectedCity('security', Number(event.target.value))
                      }
                    />
                  </label>
                  <label>방벽 <input type="number" min="0" max="100" value={selectedCity.defense} onChange={event => editSelectedCity('defense', Number(event.target.value))} /></label>
                  <label>훈련 <input type="number" min="0" max="100" value={selectedCity.training} onChange={event => editSelectedCity('training', Number(event.target.value))} /></label>
                  <label>
                    병력{' '}
                    <input
                      type="number"
                      min="0"
                      value={selectedCity.troops}
                      onChange={event =>
                        editSelectedCity('troops', Number(event.target.value))
                      }
                    />
                  </label>
                </div>
              </div>
            </section>
          )}

          {tab === '시스템' && (
            <section>
              <div className="section-head">
                <div>
                  <span className="eyebrow">SYSTEM</span>
                  <h2>저장 · 게임 관리</h2>
                </div>
              </div>
              <div className="system-grid">
                <div className="panel">
                  <h3>로컬 저장</h3>
                  <p>
                    현재 브라우저에 진행 상태를 저장합니다. 새로고침 후에도 저장
                    시점의 진행을 유지합니다.
                  </p>
                  <button className="gold" onClick={saveGame}>
                    지금 저장
                  </button>
                </div>
                <div className="panel">
                  <h3>새 게임</h3>
                  <p>현재 저장 데이터와 진행 상황을 초기 상태로 되돌립니다.</p>
                  <button className="danger" onClick={resetGame}>
                    진행 초기화
                  </button>
                </div>
                <div className="panel">
                  <h3>이미지 확장 준비</h3>
                  <p>
                    무장 초상화·전신·도시·장비 이미지는 이후 데이터 키에 연결할
                    예정입니다. 현재 게임 로직은 이미지 없이 독립적으로
                    동작합니다.
                  </p>
                </div>
              </div>
            </section>
          )}

              </div>
            </>
          )}

          </div>

        </main>

        <aside className="city-rail">
          {selectedCity ? <>
            <div className={`city-rail-banner ${selectedCity.owner === affiliatedForce ? 'ours' : 'enemy'}`}>
              <div className="city-banner-title"><Landmark size={20} /><div><span>{selectedCity.owner === affiliatedForce ? (canManageSelectedCity ? 'MANAGED CITY' : 'AFFILIATED CITY') : 'CITY INTELLIGENCE'}</span><h2>{selectedCity.name}</h2><small>{selectedCity.region} · {selectedCity.owner}</small></div></div>
              <em>{cityScaleLabel(selectedCity.tier)}</em>
            </div>
            <div className="city-rail-preview"><img src={cityArtworkPath(selectedCity)} alt={`${selectedCity.name} 전경`} onError={event => { event.currentTarget.src = cityDetailPath(selectedCity); }} /><span>{selectedCity.name} · {cityScaleLabel(selectedCity.tier)}</span></div>
            <div className="city-rail-summary" aria-label={`${selectedCity.name} 핵심 현황`}>
              <div><span>인구</span><strong>{selectedCity.population.toLocaleString()}</strong></div>
              <div><span>병력</span><strong>{selectedCity.troops.toLocaleString()}</strong></div>
              <div><span>방어</span><strong>{selectedCity.defense}</strong></div>
              <div><span>훈련</span><strong>{selectedCity.training}</strong></div>
            </div>
            <div className="city-rail-block city-development"><h3>개발 지표</h3><label><span>농업</span><progress max="100" value={selectedCity.agriculture}/><b>{selectedCity.agriculture}</b></label><label><span>상업</span><progress max="100" value={selectedCity.commerce}/><b>{selectedCity.commerce}</b></label><label><span>치안</span><progress max="100" value={selectedCity.security}/><b>{selectedCity.security}</b></label><label><span>방벽</span><progress max="100" value={selectedCity.defense}/><b>{selectedCity.defense}</b></label><label><span>훈련</span><progress max="100" value={selectedCity.training}/><b>{selectedCity.training}</b></label></div>
            <div className="city-rail-block garrison-block"><div className="city-rail-heading"><h3>주둔 장수</h3><strong>{game.generals.filter(general => general.city === selectedCity.id).length}명</strong></div><div className="city-garrison-list">{game.generals.filter(general => general.city === selectedCity.id).slice(0, 3).map(general => <button key={general.id} onClick={() => { setSelectedGeneralId(general.id); setTab('장수'); }}><span>{general.name.slice(0, 1)}</span><div><strong>{general.name}</strong><small>{general.force} · {prisonerIds.has(general.id) ? '포로' : general.force === '재야' ? '재야' : personnelLabel(general)}</small></div></button>)}</div></div>
            <div className="city-rail-actions"><button className="primary" onClick={() => setTab('도시')}>도시 상세</button><button onClick={() => setTab('군사')}>{canManageSelectedCity ? '출정' : '개인 군사'}</button><button onClick={() => setTab('내정')}>{canManageSelectedCity ? '내정' : '개인 의뢰'}</button><button onClick={() => setTab('인사')}>인사</button><button onClick={() => setTab('장수')}>장수</button><button onClick={() => setTab('상점')}>상점</button></div>
            <div className="city-rail-legend"><strong>세력 색상</strong><div>{activeForceColorEntries.map(([force, color]) => <span key={force}><i style={{ backgroundColor: color }} />{force}</span>)}</div></div>
          </> : <div className="city-rail-empty">선택 도시 없음</div>}
        </aside>
      </div>

      {councilDue && (
        <div className="game-modal-backdrop">
          <div className="game-modal council-modal">
            <div className="game-modal-head"><div><span className="eyebrow">TEN-DAY COUNCIL</span><h2>군의 · 장수 조언과 임무 배정</h2><p>{dateLabel(game)} · 이번 순의 방침을 정합니다. 장수 추천을 그대로 쓰거나 직접 변경하세요.</p></div><strong>{playerGenerals.length}명 참석</strong></div>
            <div className="council-list">
              {playerGenerals.map(general => {
                const task = councilDraft[general.id] ?? recommendOfficerTask(general);
                return <div className="council-row" key={general.id}><div><strong>{general.name}</strong><span>{personnelLabel(general)} · {game.cities.find(city => city.id === general.city)?.name ?? '거점 없음'}</span><small>{taskAdvice(general, task)}</small></div><select value={task} onChange={event => setCouncilDraft(current => ({ ...current, [general.id]: event.target.value as OfficerTask }))}>{OFFICER_TASKS.map(entry => <option key={entry} value={entry}>{entry}</option>)}</select></div>;
              })}
            </div>
            <div className="game-modal-foot"><span>장수 임무는 플레이어 월 행동력을 소모하지 않습니다.</span><button className="gold" onClick={confirmCouncil}>이번 순 임무 확정</button></div>
          </div>
        </div>
      )}

      {equipmentGiftOpen && selectedInventoryItem && (
        <div className="game-modal-backdrop" onMouseDown={() => setEquipmentGiftOpen(false)}>
          <div className="game-modal equipment-gift-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="game-modal-head"><div><span className="eyebrow">EQUIPMENT GIFT</span><h2>{selectedInventoryItem.name} 선물</h2><p>{tradeCity?.name ?? '현재 도시'}에 플레이 장수와 함께 있는 장수 중 받을 사람을 선택하세요. 재야 장수도 포함됩니다.</p></div><button onClick={() => setEquipmentGiftOpen(false)}>닫기</button></div>
            <div className="equipment-gift-list">{equipmentGiftTargets.length === 0 ? <div className="empty">현재 도시에는 선물할 수 있는 장수가 없습니다.</div> : equipmentGiftTargets.map(general => { const free = general.force === '재야'; const relation = free ? game.freeOfficerRelations[general.id]?.favor ?? 0 : game.officerBonds[general.id]?.favor ?? 0; return <button type="button" key={general.id} className={equipmentGiftTargetId === general.id ? 'selected' : ''} onClick={() => setEquipmentGiftTargetId(general.id)}><span className="officer-roster-face">{general.name.slice(0, 1)}</span><div><strong>{general.name}</strong><small>{general.force} · {personnelLabel(general)}</small><em>{free ? `교분 ${relation}/100` : `친밀 ${relation}/100`}</em></div></button>; })}</div>
            <div className="game-modal-foot"><span>선물 시 장비가 인벤토리에서 제거되고, 착용 중이면 자동 해제됩니다. · AP 2 · 1일</span><button className="gold" disabled={!equipmentGiftTargetId || game.actionPoints < 2} onClick={() => giftInventoryItem(selectedInventoryItem.id, equipmentGiftTargetId)}>선물 확정</button></div>
          </div>
        </div>
      )}

      {battleReport && (
        <div className="game-modal-backdrop" onMouseDown={() => setBattleReport(null)}>
          <div className="game-modal battle-report-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="game-modal-head"><div><span className="eyebrow">BATTLE REPORT</span><h2>{battleReport.title}</h2><p>{battleReport.mode}</p></div><strong className={battleReport.victory ? 'battle-victory' : 'battle-defeat'}>{battleReport.result}</strong></div>
            <div className="battle-report-lines">{battleReport.lines.map((line, index) => <p key={`${line}-${index}`}><span>{index + 1}</span>{line}</p>)}</div>
            <div className="game-modal-foot"><span>{battleReport.victory && game.prisoners.length > 0 ? `확인 후 포로 ${game.prisoners.length}명의 처분을 순서대로 결정합니다.` : battleReport.victory ? '출정한 장수는 함락 도시로 이동해 주둔합니다.' : '출정 장수는 원래 도시에 남습니다.'}</span><button className="gold" onClick={() => setBattleReport(null)}>{battleReport.victory && game.prisoners.length > 0 ? '확인 · 포로 처분으로' : '확인'}</button></div>
          </div>
        </div>
      )}

      {!battleReport && pendingPrisoner && pendingPrisonerGeneral && (
        <div className="game-modal-backdrop">
          <div className="game-modal prisoner-modal">
            <div className="game-modal-head"><div><span className="eyebrow">PRISONER DISPOSITION</span><h2>포로 처분 · {pendingPrisonerGeneral.name}</h2><p>{game.cities.find(city => city.id === pendingPrisoner.capturedAtCityId)?.name ?? '함락 도시'}에서 사로잡은 {pendingPrisoner.originalForce} 장수입니다.</p></div><strong>대기 포로 {game.prisoners.length}명</strong></div>
            <div className="prisoner-summary"><div><span>직급</span><strong>{personnelLabel(pendingPrisonerGeneral)}</strong></div><div><span>통솔 / 무력</span><strong>{pendingPrisonerGeneral.leadership} / {pendingPrisonerGeneral.martial}</strong></div><div><span>지략 / 군략</span><strong>{pendingPrisonerGeneral.intelligence} / {pendingPrisonerGeneral.militaryStrategy}</strong></div><div><span>원 소속</span><strong>{pendingPrisoner.originalForce}</strong></div></div>
            <div className="prisoner-actions"><button className="gold" onClick={() => resolvePrisoner('recruit')}><strong>휘하로 등용</strong><span>내 세력 장수로 편입하고 함락 도시에 배치</span></button><button onClick={() => resolvePrisoner('release')}><strong>석방</strong><span>원 세력 거점으로 돌려보냄 · 거점이 없으면 재야</span></button><button className="danger" onClick={() => resolvePrisoner('execute')}><strong>참수</strong><span>장수 데이터를 전장에서 제거</span></button></div>
          </div>
        </div>
      )}

      {gameProfilePicker && selectedGeneral && (() => {
        const options = gameProfilePicker === 'traits' ? TRAIT_OPTIONS : TENDENCY_OPTIONS;
        const query = gameProfilePickerQuery.trim().toLowerCase();
        const filtered = options.filter(option => !query || [option.name, option.category, option.description, option.effect].some(value => value.toLowerCase().includes(query)));
        return <div className="profile-picker-backdrop" onMouseDown={() => setGameProfilePicker(null)}><div className="profile-picker-modal" onMouseDown={event => event.stopPropagation()}><div className="profile-picker-header"><div><span className="eyebrow">GAME EDITOR</span><h2>{selectedGeneral.name} · {gameProfilePicker === 'traits' ? '특성' : '성향'} 편집</h2><p>{gameProfilePicker === 'traits' ? `${selectedGeneral.traits.length}/10` : `${selectedGeneral.tendencies.length}/5`} 선택됨</p></div><button onClick={() => setGameProfilePicker(null)}>닫기</button></div><input className="profile-picker-search" placeholder="이름 · 분류 · 효과 검색" value={gameProfilePickerQuery} onChange={event => setGameProfilePickerQuery(event.target.value)} /><div className="profile-picker-list">{filtered.map(option => { const selected = gameProfilePicker === 'traits' ? selectedGeneral.traits.includes(option.name) : selectedGeneral.tendencies.includes(option.name); return <button key={option.name} className={`profile-option ${selected ? 'selected' : ''}`} onClick={() => toggleGameProfileSelection(gameProfilePicker, option.name)}><div className="profile-option-title"><strong>{option.name}</strong><span>{option.category}</span>{selected && <em>선택됨</em>}</div><p>{option.description}</p><small>{option.effect}</small></button>; })}</div><div className="profile-picker-footer"><span>최대 특성 10개 · 성향 5개</span><button className="gold" onClick={() => setGameProfilePicker(null)}>완료</button></div></div></div>;
      })()}
    </div>
  );
}

export default App;

