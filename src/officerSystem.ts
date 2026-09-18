export type SpecialtyGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export const SPECIALTY_GRADES: SpecialtyGrade[] = ['E', 'D', 'C', 'B', 'A', 'S'];
export const SPECIALTY_KEYS = [
  '보병', '기병', '궁병', '공성', '수전', '산악전', '방어전', '야전', '보급', '훈련',
  '농업', '상업', '기술', '축성', '치안', '인재탐색', '등용', '설전', '첩보', '계략', '화계', '호위',
] as const;
export type SpecialtyKey = typeof SPECIALTY_KEYS[number];
export type SpecialtyMap = Record<SpecialtyKey, SpecialtyGrade>;

export type OfficerContext = 'combat' | 'defense' | 'search' | 'recruit' | 'domestic';
export type ProfileOption = {
  name: string;
  category: string;
  description: string;
  effect: string;
  bonuses: Partial<Record<OfficerContext, number>>;
};

export const TRAIT_OPTIONS: ProfileOption[] = [
  { name: '인덕', category: '인재·민심', description: '사람을 포용하고 민심을 얻는 데 뛰어납니다.', effect: '등용 +10 · 내정 +4', bonuses: { recruit: 10, domestic: 4 } },
  { name: '인재애호', category: '인재', description: '능력 있는 인물을 적극적으로 찾고 받아들입니다.', effect: '인재탐색 +15 · 등용 +15', bonuses: { search: 15, recruit: 15 } },
  { name: '인재친화', category: '인재', description: '재야 인물이 쉽게 마음을 열도록 만드는 친화력이 있습니다.', effect: '인재탐색 +10 · 등용 +15', bonuses: { search: 10, recruit: 15 } },
  { name: '민심장악', category: '내정', description: '백성과 지방 사회를 안정시키는 능력이 뛰어납니다.', effect: '내정 +6', bonuses: { domestic: 6 } },
  { name: '왕좌지재', category: '인재·내정', description: '군주를 보좌하고 인재를 배치하는 최고 수준의 재능입니다.', effect: '인재탐색 +12 · 등용 +4 · 내정 +5', bonuses: { search: 12, recruit: 4, domestic: 5 } },
  { name: '인재발굴', category: '인재', description: '숨은 인재의 재능을 빠르게 알아봅니다.', effect: '인재탐색 +12', bonuses: { search: 12 } },
  { name: '용병술', category: '전투', description: '부대 운용과 전장 판단이 탁월합니다.', effect: '공격전 +7', bonuses: { combat: 7 } },
  { name: '대도독', category: '전투', description: '대규모 군단과 여러 병종을 통합 지휘합니다.', effect: '공격전 +7 · 방어전 +3', bonuses: { combat: 7, defense: 3 } },
  { name: '명장', category: '전투', description: '공수 양면에서 안정적인 지휘 능력을 보입니다.', effect: '공격전 +4 · 방어전 +3', bonuses: { combat: 4, defense: 3 } },
  { name: '맹장', category: '전투', description: '선두에서 적진을 무너뜨리는 강한 전투력을 지녔습니다.', effect: '공격전 +4', bonuses: { combat: 4 } },
  { name: '일기당천', category: '전투', description: '개인의 무용으로 아군의 전투 기세를 끌어올립니다.', effect: '공격전 +4', bonuses: { combat: 4 } },
  { name: '철벽', category: '방어', description: '불리한 상황에서도 방어선을 쉽게 무너뜨리지 않습니다.', effect: '방어전 +8', bonuses: { defense: 8 } },
  { name: '지구전', category: '방어', description: '장기전과 소모전에서 끈질기게 버팁니다.', effect: '방어전 +8', bonuses: { defense: 8 } },
  { name: '위엄', category: '지휘·인재', description: '강한 존재감으로 병사와 인재를 압도합니다.', effect: '방어전 +3 · 등용 +3', bonuses: { defense: 3, recruit: 3 } },
  { name: '충의', category: '충성·민심', description: '주군과 세력에 대한 충성심이 강하고 조직을 안정시킵니다.', effect: '방어전 +4 · 내정 +2', bonuses: { defense: 4, domestic: 2 } },
  { name: '재기', category: '전투', description: '위기 뒤에도 빠르게 전열을 정비하고 다시 공세를 펼칩니다.', effect: '공격전 +3', bonuses: { combat: 3 } },
  { name: '간웅', category: '전략·인재', description: '수단을 가리지 않는 결단과 인재 활용 능력을 지녔습니다.', effect: '공격전 +2 · 인재탐색 +3 · 등용 +5', bonuses: { combat: 2, search: 3, recruit: 5 } },
  { name: '냉철', category: '전략', description: '감정에 흔들리지 않고 상황을 분석합니다.', effect: '방어전 +3 · 인재탐색 +4', bonuses: { defense: 3, search: 4 } },
  { name: '국가경영', category: '내정', description: '국가 규모의 행정과 자원 운용을 체계적으로 수행합니다.', effect: '내정 +7', bonuses: { domestic: 7 } },
  { name: '균형감각', category: '내정·인재', description: '군사와 내정, 인재 운용의 균형을 잘 맞춥니다.', effect: '내정 +4 · 등용 +3', bonuses: { domestic: 4, recruit: 3 } },
  { name: '통합전략', category: '전략·외교', description: '군사와 외교를 하나의 큰 전략으로 연결합니다.', effect: '공격전 +3 · 등용 +4', bonuses: { combat: 3, recruit: 4 } },
  { name: '정략', category: '내정·외교', description: '정치적 이해관계를 조율하고 세력 운영을 안정시킵니다.', effect: '내정 +4 · 등용 +3', bonuses: { domestic: 4, recruit: 3 } },
  { name: '청렴', category: '내정', description: '부패를 억제하고 행정 신뢰도를 높입니다.', effect: '내정 +5', bonuses: { domestic: 5 } },
  { name: '외교가', category: '외교', description: '협상과 설득을 통해 상대의 경계심을 낮춥니다.', effect: '등용 +6', bonuses: { recruit: 6 } },
  { name: '논객', category: '외교', description: '논리와 언변으로 상대를 설득하는 데 능합니다.', effect: '등용 +4', bonuses: { recruit: 4 } },
  { name: '첩보가', category: '정보', description: '소문과 정보망을 이용해 인물과 세력 정보를 수집합니다.', effect: '인재탐색 +6', bonuses: { search: 6 } },
  { name: '책략가', category: '전략', description: '전장과 인재 운용에서 한 수 앞선 계책을 준비합니다.', effect: '공격전 +3 · 인재탐색 +3', bonuses: { combat: 3, search: 3 } },
  { name: '화공', category: '전투', description: '화계와 기습적인 전술 운용에 능합니다.', effect: '공격전 +4', bonuses: { combat: 4 } },
  { name: '호위', category: '방어', description: '주군과 핵심 부대를 지키는 데 특화되어 있습니다.', effect: '방어전 +4', bonuses: { defense: 4 } },
  { name: '수군숙련', category: '전투', description: '수상 전투와 함대 운용 경험이 풍부합니다.', effect: '공격전 +3', bonuses: { combat: 3 } },
  { name: '신궁', category: '전투', description: '원거리 공격과 정밀 사격에 뛰어납니다.', effect: '공격전 +3', bonuses: { combat: 3 } },
  { name: '기병대가', category: '전투', description: '기병 돌격과 기동전에서 강점을 보입니다.', effect: '공격전 +3', bonuses: { combat: 3 } },
  { name: '산악전문', category: '전투', description: '험지와 산악 지형에서 부대를 효율적으로 운용합니다.', effect: '공격전 +3', bonuses: { combat: 3 } },
  { name: '보급달인', category: '군정', description: '보급선을 안정시키고 장기 작전을 지원합니다.', effect: '공격전 +2 · 내정 +3', bonuses: { combat: 2, domestic: 3 } },
  { name: '훈련가', category: '군정', description: '병사 훈련과 군율 유지에 뛰어납니다.', effect: '공격전 +2 · 내정 +3', bonuses: { combat: 2, domestic: 3 } },
  { name: '축성가', category: '방어·내정', description: '성벽과 방어 시설의 효율을 높입니다.', effect: '방어전 +5 · 내정 +3', bonuses: { defense: 5, domestic: 3 } },
  { name: '오만', category: '부정특성', description: '자신감은 강하지만 타인을 설득할 때 마찰이 생깁니다.', effect: '등용 -5', bonuses: { recruit: -5 } },
  { name: '주호', category: '부정특성', description: '호방한 기세는 강하지만 방어 판단이 흐려질 수 있습니다.', effect: '공격전 +2 · 방어전 -3', bonuses: { combat: 2, defense: -3 } },
  { name: '격정', category: '부정특성', description: '공세에서는 강하지만 냉정한 수비에는 약합니다.', effect: '공격전 +4 · 방어전 -3', bonuses: { combat: 4, defense: -3 } },
  { name: '변덕', category: '부정특성', description: '판단이 자주 바뀌어 조직과 협상에 불안 요소가 됩니다.', effect: '방어전 -2 · 등용 -4', bonuses: { defense: -2, recruit: -4 } },
];

export const TENDENCY_OPTIONS: ProfileOption[] = [
  { name: '의리', category: '충성', description: '약속과 관계를 중시하며 쉽게 동료를 버리지 않습니다.', effect: '방어전 +2 · 내정 +2', bonuses: { defense: 2, domestic: 2 } },
  { name: '야망', category: '권력', description: '성과와 세력 확대를 적극적으로 추구합니다.', effect: '공격전 +3 · 등용 +2', bonuses: { combat: 3, recruit: 2 } },
  { name: '냉정', category: '판단', description: '감정보다 정보와 상황 판단을 우선합니다.', effect: '방어전 +3 · 인재탐색 +4', bonuses: { defense: 3, search: 4 } },
  { name: '대담', category: '행동', description: '위험을 감수하고 적극적으로 승부를 겁니다.', effect: '공격전 +5 · 방어전 -2', bonuses: { combat: 5, defense: -2 } },
  { name: '신중', category: '판단', description: '확실한 정보를 확보한 뒤 움직이는 성향입니다.', effect: '방어전 +5 · 인재탐색 +2 · 공격전 -1', bonuses: { defense: 5, search: 2, combat: -1 } },
  { name: '탐욕', category: '욕망', description: '개인 이익을 중시해 장기적인 행정과 설득에 악영향을 줍니다.', effect: '내정 -4 · 등용 -2', bonuses: { domestic: -4, recruit: -2 } },
  { name: '인정', category: '인간관계', description: '사람의 사정을 살피며 부드럽게 관계를 형성합니다.', effect: '등용 +5 · 내정 +3', bonuses: { recruit: 5, domestic: 3 } },
  { name: '과단', category: '행동', description: '결정한 뒤에는 빠르게 행동으로 옮깁니다.', effect: '공격전 +4', bonuses: { combat: 4 } },
  { name: '격정', category: '감정', description: '감정의 폭발력이 행동력으로 이어지지만 수비에는 불안합니다.', effect: '공격전 +3 · 방어전 -3', bonuses: { combat: 3, defense: -3 } },
  { name: '소심', category: '판단', description: '무리한 승부를 피하고 안전을 우선합니다.', effect: '방어전 +2 · 공격전 -4', bonuses: { defense: 2, combat: -4 } },
  { name: '절제', category: '자기관리', description: '욕망을 억제하고 자원과 조직을 안정적으로 관리합니다.', effect: '내정 +4', bonuses: { domestic: 4 } },
  { name: '의심', category: '경계', description: '적의 의도를 경계하지만 새로운 인물을 받아들이는 데는 소극적입니다.', effect: '방어전 +3 · 등용 -3', bonuses: { defense: 3, recruit: -3 } },
];

export type OfficerAdvancedFields = {
  militaryStrategy: number;
  diplomacy: number;
  personnel: number;
  specialties: SpecialtyMap;
  tendencies: string[];
};

type ProfileSource = {
  id: string;
  name: string;
  leadership?: number;
  martial?: number;
  intelligence?: number;
  militaryStrategy?: number;
  politics?: number;
  diplomacy?: number;
  personnel?: number;
  charisma?: number;
  specialties?: Partial<SpecialtyMap>;
  traits?: string[];
  tendencies?: string[];
  relations?: string[];
};

type CoreOverride = Partial<Pick<Required<ProfileSource>, 'leadership' | 'martial' | 'intelligence' | 'militaryStrategy' | 'politics' | 'diplomacy' | 'personnel' | 'charisma'>> & {
  specialties?: Partial<SpecialtyMap>;
  traits?: string[];
  tendencies?: string[];
};

const CORE_OVERRIDES: Record<string, CoreOverride> = {
  caocao: {
    leadership: 97, martial: 73, intelligence: 96, militaryStrategy: 100, politics: 96, diplomacy: 93, personnel: 100, charisma: 94,
    specialties: { 야전: 'S', 보급: 'S', 훈련: 'S', 인재탐색: 'S', 등용: 'S', 계략: 'S', 첩보: 'A' },
    traits: ['간웅', '인재애호', '용병술', '냉철', '야심가'], tendencies: ['야망', '냉정', '대담'],
  },
  liubei: {
    leadership: 84, martial: 75, intelligence: 78, militaryStrategy: 83, politics: 82, diplomacy: 95, personnel: 97, charisma: 100,
    specialties: { 인재탐색: 'S', 등용: 'S', 설전: 'A', 치안: 'A', 보급: 'B' },
    traits: ['인덕', '인재친화', '민심장악', '의형제', '재기'], tendencies: ['의리', '인정', '신중'],
  },
  guanyu: {
    leadership: 95, martial: 98, intelligence: 78, militaryStrategy: 87, politics: 62, diplomacy: 52, personnel: 65, charisma: 94,
    specialties: { 보병: 'S', 수전: 'A', 야전: 'A', 방어전: 'A', 호위: 'A' },
    traits: ['의협', '위엄', '수군숙련', '오만', '명장'], tendencies: ['의리', '대담'],
  },
  zhangfei: {
    leadership: 88, martial: 100, intelligence: 43, militaryStrategy: 78, politics: 28, diplomacy: 32, personnel: 44, charisma: 82,
    specialties: { 보병: 'S', 야전: 'S', 산악전: 'A', 호위: 'A', 훈련: 'B' },
    traits: ['호걸', '맹장', '위압', '주호', '격정'], tendencies: ['대담', '의리'],
  },
  zhaoyun: {
    leadership: 92, martial: 96, intelligence: 80, militaryStrategy: 89, politics: 65, diplomacy: 71, personnel: 82, charisma: 91,
    specialties: { 기병: 'S', 보병: 'A', 야전: 'S', 호위: 'S', 공성: 'C', 수전: 'C' },
    traits: ['호위', '충의', '침착'], tendencies: ['의리', '신중', '대담'],
  },
  zhugeliang: {
    leadership: 88, martial: 34, intelligence: 100, militaryStrategy: 96, politics: 100, diplomacy: 96, personnel: 93, charisma: 91,
    specialties: { 계략: 'S', 첩보: 'S', 보급: 'S', 기술: 'S', 축성: 'S', 설전: 'S', 공성: 'A', 방어전: 'A', 농업: 'A' },
    traits: ['와룡', '국가경영', '신중', '충의'], tendencies: ['신중', '냉정', '의리'],
  },
  simayi: {
    leadership: 94, martial: 52, intelligence: 99, militaryStrategy: 99, politics: 96, diplomacy: 87, personnel: 94, charisma: 78,
    specialties: { 계략: 'S', 첩보: 'S', 방어전: 'S', 야전: 'A', 인재탐색: 'S', 보급: 'A', 축성: 'A' },
    traits: ['심모', '지구전', '권모', '냉철'], tendencies: ['냉정', '신중', '야망'],
  },
  zhouyu: {
    leadership: 96, martial: 72, intelligence: 98, militaryStrategy: 98, politics: 89, diplomacy: 94, personnel: 91, charisma: 96,
    specialties: { 수전: 'S', 화계: 'S', 야전: 'A', 보병: 'B', 공성: 'B', 계략: 'S', 훈련: 'A' },
    traits: ['대도독', '수군', '화공', '미주랑'], tendencies: ['대담', '냉정'],
  },
  xunyu: {
    leadership: 65, martial: 28, intelligence: 97, militaryStrategy: 88, politics: 98, diplomacy: 93, personnel: 100, charisma: 94,
    specialties: { 인재탐색: 'S', 등용: 'S', 보급: 'S', 상업: 'A', 농업: 'A', 치안: 'A', 설전: 'A' },
    traits: ['왕좌지재', '인재발굴', '정략'], tendencies: ['신중', '인정', '의리'],
  },
  lusu: {
    leadership: 84, martial: 52, intelligence: 94, militaryStrategy: 90, politics: 88, diplomacy: 100, personnel: 90, charisma: 91,
    specialties: { 설전: 'S', 등용: 'A', 보급: 'A', 수전: 'A', 상업: 'A', 계략: 'A' },
    traits: ['대전략', '외교', '통합전략'], tendencies: ['신중', '인정'],
  },
  sunquan: {
    leadership: 85, martial: 69, intelligence: 88, militaryStrategy: 86, politics: 94, diplomacy: 96, personnel: 96, charisma: 95,
    specialties: { 등용: 'S', 인재탐색: 'A', 수전: 'A', 치안: 'A', 상업: 'A' },
    traits: ['수성', '인재등용', '균형감각'], tendencies: ['신중', '인정', '야망'],
  },
  lvbu: {
    leadership: 89, martial: 100, intelligence: 38, militaryStrategy: 71, politics: 24, diplomacy: 31, personnel: 42, charisma: 78,
    specialties: { 기병: 'S', 야전: 'S', 호위: 'A', 보병: 'A', 훈련: 'B' },
    traits: ['비장', '일기당천', '변덕'], tendencies: ['대담', '야망'],
  },
};

const GRADE_SCORE: Record<SpecialtyGrade, number> = { E: 35, D: 50, C: 62, B: 74, A: 86, S: 97 };
const GRADE_MULTIPLIER: Record<SpecialtyGrade, number> = { E: 0.86, D: 0.93, C: 1, B: 1.08, A: 1.17, S: 1.28 };

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function hasTrait(traits: string[], keyword: string) {
  return traits.some(trait => trait.includes(keyword));
}

function scoreToGrade(score: number): SpecialtyGrade {
  if (score >= 93) return 'S';
  if (score >= 83) return 'A';
  if (score >= 72) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'E';
}

function specialtyTraitBonus(key: SpecialtyKey, traits: string[]) {
  let bonus = 0;
  if (key === '기병' && traits.some(t => ['기병', '백마', '호표', '서량'].some(k => t.includes(k)))) bonus += 16;
  if (key === '궁병' && traits.some(t => ['궁술', '신궁'].some(k => t.includes(k)))) bonus += 18;
  if (key === '공성' && hasTrait(traits, '공성')) bonus += 15;
  if (key === '수전' && traits.some(t => ['수군', '대도독', '수전'].some(k => t.includes(k)))) bonus += 20;
  if (key === '산악전' && traits.some(t => ['산악', '남중', '산월'].some(k => t.includes(k)))) bonus += 16;
  if (key === '방어전' && traits.some(t => ['수비', '철벽', '지구전'].some(k => t.includes(k)))) bonus += 16;
  if (key === '야전' && traits.some(t => ['용병', '기습', '선봉', '맹공'].some(k => t.includes(k)))) bonus += 12;
  if (key === '보급' && traits.some(t => ['둔전', '재정', '국가경영'].some(k => t.includes(k)))) bonus += 15;
  if (key === '훈련' && traits.some(t => ['정예', '엄정', '호표'].some(k => t.includes(k)))) bonus += 14;
  if (key === '농업' && traits.some(t => ['둔전', '농정'].some(k => t.includes(k)))) bonus += 16;
  if (key === '상업' && traits.some(t => ['재정', '호상', '상재'].some(k => t.includes(k)))) bonus += 16;
  if (key === '기술' && traits.some(t => ['기계', '기술', '발명'].some(k => t.includes(k)))) bonus += 20;
  if (key === '축성' && traits.some(t => ['수비', '축성'].some(k => t.includes(k)))) bonus += 12;
  if (key === '치안' && traits.some(t => ['인덕', '청렴', '민심'].some(k => t.includes(k)))) bonus += 13;
  if (key === '인재탐색' && traits.some(t => ['인재', '왕좌지재', '명사'].some(k => t.includes(k)))) bonus += 18;
  if (key === '등용' && traits.some(t => ['인재', '인덕', '인망'].some(k => t.includes(k)))) bonus += 18;
  if (key === '설전' && traits.some(t => ['외교', '논객', '학자'].some(k => t.includes(k)))) bonus += 17;
  if (key === '첩보' && traits.some(t => ['귀모', '책략', '심모', '간웅'].some(k => t.includes(k)))) bonus += 14;
  if (key === '계략' && traits.some(t => ['모사', '책략', '기책', '귀모', '와룡', '심모'].some(k => t.includes(k)))) bonus += 18;
  if (key === '화계' && traits.some(t => ['화공', '화계'].some(k => t.includes(k)))) bonus += 24;
  if (key === '호위' && traits.some(t => ['호위', '충의', '악래', '호치'].some(k => t.includes(k)))) bonus += 20;
  return bonus;
}

function deriveSpecialties(core: Required<Pick<ProfileSource, 'leadership' | 'martial' | 'intelligence' | 'militaryStrategy' | 'politics' | 'diplomacy' | 'personnel' | 'charisma'>>, traits: string[]): SpecialtyMap {
  const l = core.leadership;
  const m = core.martial;
  const i = core.intelligence;
  const s = core.militaryStrategy;
  const p = core.politics;
  const d = core.diplomacy;
  const h = core.personnel;
  const c = core.charisma;
  const scores: Record<SpecialtyKey, number> = {
    보병: l * 0.5 + s * 0.3 + m * 0.2,
    기병: l * 0.45 + s * 0.3 + m * 0.25,
    궁병: l * 0.35 + m * 0.4 + s * 0.25,
    공성: s * 0.45 + i * 0.35 + l * 0.2,
    수전: s * 0.4 + l * 0.35 + i * 0.25,
    산악전: l * 0.4 + s * 0.35 + m * 0.25,
    방어전: l * 0.42 + s * 0.4 + p * 0.18,
    야전: l * 0.45 + s * 0.42 + m * 0.13,
    보급: p * 0.42 + h * 0.3 + i * 0.28,
    훈련: l * 0.42 + h * 0.32 + p * 0.26,
    농업: p * 0.58 + i * 0.25 + h * 0.17,
    상업: p * 0.5 + i * 0.25 + d * 0.25,
    기술: i * 0.55 + p * 0.28 + h * 0.17,
    축성: p * 0.45 + s * 0.3 + i * 0.25,
    치안: p * 0.4 + l * 0.32 + h * 0.28,
    인재탐색: h * 0.43 + i * 0.34 + c * 0.23,
    등용: h * 0.4 + c * 0.31 + d * 0.29,
    설전: d * 0.4 + i * 0.34 + c * 0.26,
    첩보: i * 0.5 + s * 0.3 + d * 0.2,
    계략: i * 0.5 + s * 0.35 + d * 0.15,
    화계: i * 0.45 + s * 0.4 + l * 0.15,
    호위: m * 0.5 + l * 0.32 + h * 0.18,
  };
  return Object.fromEntries(SPECIALTY_KEYS.map(key => [key, scoreToGrade(scores[key] + specialtyTraitBonus(key, traits))])) as SpecialtyMap;
}

function inferTendencies(core: Required<Pick<ProfileSource, 'leadership' | 'martial' | 'intelligence' | 'militaryStrategy' | 'politics' | 'diplomacy' | 'personnel' | 'charisma'>>, traits: string[]) {
  const values: string[] = [];
  if (traits.some(t => ['의형제', '신의', '충의', '의협'].some(k => t.includes(k)))) values.push('의리');
  if (traits.some(t => ['간웅', '참칭', '야심', '권모'].some(k => t.includes(k)))) values.push('야망');
  if (core.intelligence >= 88 || core.militaryStrategy >= 90) values.push('냉정');
  if (core.leadership >= 85 && core.martial >= 82) values.push('대담');
  if (core.politics >= 88 || core.personnel >= 90) values.push('신중');
  if (traits.some(t => ['폭정', '탐욕'].some(k => t.includes(k)))) values.push('탐욕');
  if (core.charisma >= 90 || hasTrait(traits, '인덕')) values.push('인정');
  return unique(values).slice(0, 4);
}

export function createDefaultSpecialties(grade: SpecialtyGrade = 'C'): SpecialtyMap {
  return Object.fromEntries(SPECIALTY_KEYS.map(key => [key, grade])) as SpecialtyMap;
}

export function enrichOfficer<T extends ProfileSource>(source: T): T & OfficerAdvancedFields & {
  leadership: number;
  martial: number;
  intelligence: number;
  politics: number;
  charisma: number;
  traits: string[];
  relations: string[];
} {
  const override = CORE_OVERRIDES[source.id] ?? {};
  const leadership = clamp(override.leadership ?? source.leadership ?? 70);
  const martial = clamp(override.martial ?? source.martial ?? 70);
  const intelligence = clamp(override.intelligence ?? source.intelligence ?? 70);
  const politics = clamp(override.politics ?? source.politics ?? 70);
  const charisma = clamp(override.charisma ?? source.charisma ?? 70);
  const militaryStrategy = clamp(override.militaryStrategy ?? source.militaryStrategy ?? (leadership * 0.45 + intelligence * 0.45 + politics * 0.1));
  const diplomacy = clamp(override.diplomacy ?? source.diplomacy ?? (intelligence * 0.25 + politics * 0.35 + charisma * 0.4));
  const personnel = clamp(override.personnel ?? source.personnel ?? (politics * 0.35 + charisma * 0.45 + intelligence * 0.2));
  const traits = unique([...(source.traits ?? []), ...(override.traits ?? [])]);
  const relations = unique(source.relations ?? []);
  const core = { leadership, martial, intelligence, militaryStrategy, politics, diplomacy, personnel, charisma };
  const derived = deriveSpecialties(core, traits);
  const specialties = { ...derived, ...(override.specialties ?? {}), ...(source.specialties ?? {}) } as SpecialtyMap;
  const tendencies = source.tendencies?.length ? unique(source.tendencies) : override.tendencies ?? inferTendencies(core, traits);
  return { ...source, ...core, specialties, tendencies: unique(tendencies), traits, relations };
}

export function ensureOfficerProfile<T extends ProfileSource>(source: T) {
  return enrichOfficer(source);
}

export function specialtyGradeValue(grade: SpecialtyGrade) {
  return GRADE_SCORE[grade];
}

export function specialtyMultiplier(grade: SpecialtyGrade) {
  return GRADE_MULTIPLIER[grade];
}

export function bestTroopSpecialty(profile: { specialties: SpecialtyMap }) {
  const keys: SpecialtyKey[] = ['보병', '기병', '궁병'];
  return keys
    .map(key => ({ key, grade: profile.specialties[key], value: specialtyGradeValue(profile.specialties[key]) }))
    .sort((a, b) => b.value - a.value)[0];
}

function optionContextBonus(options: ProfileOption[], values: string[], context: OfficerContext) {
  return values.reduce((sum, value) => sum + (options.find(option => option.name === value)?.bonuses[context] ?? 0), 0);
}

export function traitContextBonus(traits: string[], context: OfficerContext) {
  let bonus = optionContextBonus(TRAIT_OPTIONS, traits, context);
  const fallbackTraits = traits.filter(trait => !TRAIT_OPTIONS.some(option => option.name === trait));
  if (context === 'combat') {
    if (fallbackTraits.some(t => ['용병술', '대도독'].some(k => t.includes(k)))) bonus += 7;
    if (fallbackTraits.some(t => ['맹장', '일기당천', '명장'].some(k => t.includes(k)))) bonus += 4;
  }
  if (context === 'defense' && fallbackTraits.some(t => ['철벽', '수비', '지구전'].some(k => t.includes(k)))) bonus += 8;
  if (context === 'search') {
    if (hasTrait(fallbackTraits, '인재애호')) bonus += 15;
    if (hasTrait(fallbackTraits, '인재친화')) bonus += 10;
    if (hasTrait(fallbackTraits, '왕좌지재') || hasTrait(fallbackTraits, '인재발굴')) bonus += 12;
  }
  if (context === 'recruit') {
    if (hasTrait(fallbackTraits, '인재애호')) bonus += 15;
    if (hasTrait(fallbackTraits, '인재친화')) bonus += 15;
    if (hasTrait(fallbackTraits, '인덕')) bonus += 10;
    if (hasTrait(fallbackTraits, '인재등용')) bonus += 12;
  }
  if (context === 'domestic') {
    if (hasTrait(fallbackTraits, '민심장악')) bonus += 6;
    if (hasTrait(fallbackTraits, '왕좌지재') || hasTrait(fallbackTraits, '재상')) bonus += 5;
    if (hasTrait(fallbackTraits, '정무') || hasTrait(fallbackTraits, '국가경영')) bonus += 4;
  }
  return bonus;
}

export function tendencyContextBonus(tendencies: string[], context: OfficerContext) {
  return optionContextBonus(TENDENCY_OPTIONS, tendencies, context);
}

export function traitEffectLabel(trait: string) {
  const catalog = TRAIT_OPTIONS.find(option => option.name === trait);
  if (catalog) return catalog.effect;
  if (trait.includes('인재애호')) return '인재 탐색·등용 보정 +15';
  if (trait.includes('인재친화')) return '인재 탐색·등용에 강함';
  if (trait.includes('용병술')) return '야전 지휘 보정';
  if (trait.includes('민심장악')) return '치안·내정 보정';
  if (trait.includes('왕좌지재')) return '인사·내정 보정';
  if (trait.includes('대도독')) return '대규모 전투 지휘 보정';
  if (trait.includes('철벽') || trait.includes('수비')) return '방어전 보정';
  if (trait.includes('맹장') || trait.includes('일기당천')) return '직접 전투 보정';
  if (trait.includes('오만')) return '강한 위엄과 함께 외교상 약점';
  if (trait.includes('인덕')) return '등용·민심 보정';
  return '';
}

export function tendencyEffectLabel(tendency: string) {
  return TENDENCY_OPTIONS.find(option => option.name === tendency)?.effect ?? '';
}
