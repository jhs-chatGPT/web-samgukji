export type FamilyGender = '남' | '여';

export type FamilyCoreStatKey =
  | 'leadership'
  | 'martial'
  | 'intelligence'
  | 'militaryStrategy'
  | 'politics'
  | 'diplomacy'
  | 'personnel'
  | 'charisma';

export type FamilyCoreStats = Record<FamilyCoreStatKey, number>;

export type FamilyOfficer = {
  id: string;
  name: string;
  city: string;
  birthYear: number | null;
  birthYearEstimated?: boolean;
  gender: FamilyGender;
  relations?: string[];
};

export type FamilyParentProfile = {
  id: string;
  name: string;
  stats: FamilyCoreStats;
  traits?: string[];
  tendencies?: string[];
};

export type ParentingFocus = '무예' | '학문' | '통솔' | '정치' | '사교' | '균형';
export type ChildDevelopmentStage = '영아기' | '유아기' | '아동기' | '청소년기' | '성인식 대기';

export type FamilyChild = {
  id: string;
  name: string;
  gender: FamilyGender;
  fatherId: string;
  motherId: string;
  birthDate: string;
  birthDayNumber: number;
  stats: FamilyCoreStats;
  traits: string[];
  tendencies: string[];
  upbringing: Record<ParentingFocus, number>;
  educationMonths: number;
  personality: string;
  parentBond: number;
  completedMilestones: number[];
  officerId?: string;
  comingOfAgeDate?: string;
  successionDate?: string;
};

export type FamilyPregnancy = {
  motherId: string;
  fatherId: string;
  motherName: string;
  fatherName: string;
  conceivedDate: string;
  conceivedDayNumber: number;
  dueDate: string;
  dueDayNumber: number;
};

export type FamilyChronicleEntry = {
  id: string;
  date: string;
  type: '결혼' | '임신' | '출산' | '육아' | '성장' | '성인식' | '승계' | '가족';
  text: string;
};

export type FamilyState = {
  spouseId?: string;
  marriageDate?: string;
  spousesByOfficerId: Record<string, string>;
  pregnancy?: FamilyPregnancy;
  children: FamilyChild[];
  designatedHeirId?: string;
  childIds: string[];
  chronicle: FamilyChronicleEntry[];
};

export type MarriageCandidate = {
  officer: FamilyOfficer;
  age: number | null;
  favor: number;
  eligible: boolean;
  reason?: string;
};

export type MarriageRules = {
  minimumAge: number;
  minimumFavor: number;
  actionPointCost: number;
  dayCost: number;
  moneyCostCopper: number;
};

export type ChildPlanRules = {
  minimumAge: number;
  actionPointCost: number;
  dayCost: number;
  moneyCostCopper: number;
  pregnancyDays: number;
};

export type ParentingRules = {
  actionPointCost: number;
  dayCost: number;
  moneyCostCopper: number;
  maximumChildAge: number;
};

export const DEFAULT_MARRIAGE_RULES: MarriageRules = {
  minimumAge: 16,
  minimumFavor: 60,
  actionPointCost: 6,
  dayCost: 3,
  moneyCostCopper: 3000,
};

export const DEFAULT_CHILD_PLAN_RULES: ChildPlanRules = {
  minimumAge: 16,
  actionPointCost: 4,
  dayCost: 7,
  moneyCostCopper: 500,
  pregnancyDays: 270,
};

export const DEFAULT_PARENTING_RULES: ParentingRules = {
  actionPointCost: 4,
  dayCost: 30,
  moneyCostCopper: 300,
  maximumChildAge: 14,
};

export const PARENTING_FOCUSES: ParentingFocus[] = ['무예', '학문', '통솔', '정치', '사교', '균형'];

const CORE_STAT_KEYS: FamilyCoreStatKey[] = [
  'leadership', 'martial', 'intelligence', 'militaryStrategy', 'politics', 'diplomacy', 'personnel', 'charisma',
];

const EMPTY_UPBRINGING: Record<ParentingFocus, number> = {
  무예: 0,
  학문: 0,
  통솔: 0,
  정치: 0,
  사교: 0,
  균형: 0,
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function deterministicRoll(seed: string, minimum: number, maximum: number) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const span = maximum - minimum + 1;
  return minimum + ((hash >>> 0) % span);
}

function parseFamilyDate(date: string): { year: number; month: number; day: number } | null {
  const match = date.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function familyDateToDayNumber(year: number, month: number, day: number) {
  return year * 360 + (month - 1) * 30 + (day - 1);
}

export function familyDayNumberToDate(dayNumber: number) {
  const safe = Math.max(0, Math.floor(dayNumber));
  const year = Math.floor(safe / 360);
  const withinYear = safe % 360;
  const month = Math.floor(withinYear / 30) + 1;
  const day = (withinYear % 30) + 1;
  return { year, month, day, label: `${year}년 ${month}월 ${day}일` };
}

function normalizePregnancy(value?: Partial<FamilyPregnancy> | null): FamilyPregnancy | undefined {
  if (!value?.motherId || !value.fatherId) return undefined;
  let conceivedDayNumber = Number(value.conceivedDayNumber);
  let dueDayNumber = Number(value.dueDayNumber);
  if (!Number.isFinite(conceivedDayNumber)) {
    const parsed = value.conceivedDate ? parseFamilyDate(value.conceivedDate) : null;
    conceivedDayNumber = parsed ? familyDateToDayNumber(parsed.year, parsed.month, parsed.day) : 0;
  }
  if (!Number.isFinite(dueDayNumber)) dueDayNumber = conceivedDayNumber + DEFAULT_CHILD_PLAN_RULES.pregnancyDays;
  return {
    motherId: String(value.motherId),
    fatherId: String(value.fatherId),
    motherName: String(value.motherName ?? value.motherId),
    fatherName: String(value.fatherName ?? value.fatherId),
    conceivedDate: String(value.conceivedDate ?? familyDayNumberToDate(conceivedDayNumber).label),
    conceivedDayNumber,
    dueDate: String(value.dueDate ?? familyDayNumberToDate(dueDayNumber).label),
    dueDayNumber,
  };
}

function normalizeChild(value: Partial<FamilyChild>, index: number): FamilyChild | null {
  if (!value?.id || !value.fatherId || !value.motherId) return null;
  const birthDayNumber = Number.isFinite(Number(value.birthDayNumber))
    ? Number(value.birthDayNumber)
    : (() => {
        const parsed = value.birthDate ? parseFamilyDate(value.birthDate) : null;
        return parsed ? familyDateToDayNumber(parsed.year, parsed.month, parsed.day) : 0;
      })();
  const rawStats = value.stats ?? ({} as FamilyCoreStats);
  const stats = Object.fromEntries(CORE_STAT_KEYS.map(key => [key, clamp(Number(rawStats[key] ?? 50), 1, 100)])) as FamilyCoreStats;
  return {
    id: String(value.id),
    name: String(value.name || `아이 ${index + 1}`),
    gender: value.gender === '여' ? '여' : '남',
    fatherId: String(value.fatherId),
    motherId: String(value.motherId),
    birthDate: String(value.birthDate ?? familyDayNumberToDate(birthDayNumber).label),
    birthDayNumber,
    stats,
    traits: Array.isArray(value.traits) ? [...new Set(value.traits.filter(Boolean))].slice(0, 10) : [],
    tendencies: Array.isArray(value.tendencies) ? [...new Set(value.tendencies.filter(Boolean))].slice(0, 5) : [],
    upbringing: { ...EMPTY_UPBRINGING, ...(value.upbringing ?? {}) },
    educationMonths: Math.max(0, Number(value.educationMonths ?? 0)),
    personality: String(value.personality ?? '미형성'),
    parentBond: clamp(Number(value.parentBond ?? 50), 0, 100),
    completedMilestones: Array.isArray(value.completedMilestones)
      ? [...new Set(value.completedMilestones.map(Number).filter(age => [3, 6, 10, 15].includes(age)))].sort((a, b) => a - b)
      : [],
    officerId: value.officerId ? String(value.officerId) : undefined,
    comingOfAgeDate: value.comingOfAgeDate ? String(value.comingOfAgeDate) : undefined,
    successionDate: value.successionDate ? String(value.successionDate) : undefined,
  };
}

export function emptyFamilyState(): FamilyState {
  return {
    spouseId: undefined,
    marriageDate: undefined,
    spousesByOfficerId: {},
    pregnancy: undefined,
    children: [],
    designatedHeirId: undefined,
    childIds: [],
    chronicle: [],
  };
}

export function normalizeFamilyState(value?: Partial<FamilyState> | null): FamilyState {
  const spousesByOfficerId = value?.spousesByOfficerId && typeof value.spousesByOfficerId === 'object'
    ? Object.fromEntries(
        Object.entries(value.spousesByOfficerId)
          .filter(([officerId, spouseId]) => Boolean(officerId && spouseId))
          .map(([officerId, spouseId]) => [officerId, String(spouseId)]),
      )
    : {};
  const children = Array.isArray(value?.children)
    ? value.children.map((child, index) => normalizeChild(child, index)).filter((child): child is FamilyChild => Boolean(child))
    : [];
  const legacyChildIds = Array.isArray(value?.childIds) ? value.childIds.filter(Boolean) : [];
  const childIds = [...new Set([...children.map(child => child.id), ...legacyChildIds])];

  return {
    spouseId: value?.spouseId,
    marriageDate: value?.marriageDate,
    spousesByOfficerId,
    pregnancy: normalizePregnancy(value?.pregnancy),
    children,
    designatedHeirId: children.some(child => child.id === value?.designatedHeirId) ? value?.designatedHeirId : undefined,
    childIds,
    chronicle: Array.isArray(value?.chronicle) ? value.chronicle.filter(Boolean).slice(0, 150) : [],
  };
}

export function officerAgeAtYear(officer: Pick<FamilyOfficer, 'birthYear'>, year: number): number | null {
  if (officer.birthYear == null) return null;
  const age = year - officer.birthYear + 1;
  return age > 0 ? age : null;
}

export function childAgeAtDate(child: FamilyChild, year: number, month: number, day: number) {
  const current = familyDateToDayNumber(year, month, day);
  return Math.max(0, Math.floor((current - child.birthDayNumber) / 360));
}

export function childDevelopmentStage(age: number): ChildDevelopmentStage {
  if (age <= 2) return '영아기';
  if (age <= 5) return '유아기';
  if (age <= 9) return '아동기';
  if (age <= 14) return '청소년기';
  return '성인식 대기';
}

export function childDevelopmentDescription(age: number) {
  const stage = childDevelopmentStage(age);
  if (stage === '영아기') return '부모와의 유대와 기초 성정이 형성되는 시기입니다.';
  if (stage === '유아기') return '놀이와 기초 예절을 통해 성격의 방향이 잡히는 시기입니다.';
  if (stage === '아동기') return '무예·학문·통솔·정치·사교의 기초를 폭넓게 익힐 수 있습니다.';
  if (stage === '청소년기') return '강점을 집중적으로 수련해 장래의 장수 성향을 완성하는 시기입니다.';
  return '15세가 되어 성인식을 기다리고 있습니다.';
}

export function parentingAllowedFocuses(age: number): ParentingFocus[] {
  if (age <= 2) return ['사교', '균형'];
  if (age <= 5) return ['무예', '학문', '사교', '균형'];
  return [...PARENTING_FOCUSES];
}

export function dominantParentingFocus(child: FamilyChild): ParentingFocus {
  return [...PARENTING_FOCUSES].sort((a, b) => {
    const countDiff = (child.upbringing[b] ?? 0) - (child.upbringing[a] ?? 0);
    if (countDiff !== 0) return countDiff;
    return PARENTING_FOCUSES.indexOf(a) - PARENTING_FOCUSES.indexOf(b);
  })[0] ?? '균형';
}

export function childTalentSummary(child: FamilyChild) {
  const labels: Record<FamilyCoreStatKey, string> = {
    leadership: '통솔형', martial: '무장형', intelligence: '학자형', militaryStrategy: '책사형',
    politics: '정치형', diplomacy: '외교형', personnel: '인재형', charisma: '인덕형',
  };
  const ranked = [...CORE_STAT_KEYS].sort((a, b) => child.stats[b] - child.stats[a]);
  return `${labels[ranked[0]]} · ${labels[ranked[1]]}`;
}

export function childEducationStatus(child: FamilyChild, year: number, month: number, day: number) {
  const currentDay = familyDateToDayNumber(year, month, day);
  const livedMonths = Math.max(1, Math.min(180, Math.floor((currentDay - child.birthDayNumber) / 30)));
  const ratio = Math.min(1, child.educationMonths / livedMonths);
  if (child.educationMonths === 0) return { label: '미교육', ratio: 0 };
  if (ratio >= 0.65) return { label: '집중 교육', ratio };
  if (ratio >= 0.35) return { label: '충실', ratio };
  if (ratio >= 0.15) return { label: '보통', ratio };
  return { label: '부족', ratio };
}

export function pregnancyDaysRemaining(family: FamilyState, year: number, month: number, day: number) {
  if (!family.pregnancy) return 0;
  return Math.max(0, family.pregnancy.dueDayNumber - familyDateToDayNumber(year, month, day));
}

export function relationshipFavor(
  officerId: string,
  officerBonds: Record<string, { favor?: number } | undefined> = {},
  freeOfficerRelations: Record<string, { favor?: number } | undefined> = {},
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.max(officerBonds[officerId]?.favor ?? 0, freeOfficerRelations[officerId]?.favor ?? 0),
    ),
  );
}

export function spouseIdForOfficer(family: FamilyState, officerId: string): string | undefined {
  return family.spousesByOfficerId[officerId];
}

export function evaluateMarriageCandidate(args: {
  player: FamilyOfficer;
  candidate: FamilyOfficer;
  year: number;
  family: FamilyState;
  favor: number;
  rules?: MarriageRules;
}): MarriageCandidate {
  const { player, candidate, year, family, favor } = args;
  const rules = args.rules ?? DEFAULT_MARRIAGE_RULES;
  const age = officerAgeAtYear(candidate, year);
  const playerAge = officerAgeAtYear(player, year);
  const playerSpouse = family.spouseId ?? spouseIdForOfficer(family, player.id);
  const candidateSpouse = spouseIdForOfficer(family, candidate.id);

  if (playerSpouse) return { officer: candidate, age, favor, eligible: false, reason: '이미 배우자가 있습니다.' };
  if (candidateSpouse) return { officer: candidate, age, favor, eligible: false, reason: '상대 장수에게 이미 배우자가 있습니다.' };
  if (candidate.id === player.id) return { officer: candidate, age, favor, eligible: false, reason: '자기 자신과는 결혼할 수 없습니다.' };
  if (candidate.city !== player.city) return { officer: candidate, age, favor, eligible: false, reason: '같은 도시에 있어야 합니다.' };
  if (candidate.gender === player.gender) return { officer: candidate, age, favor, eligible: false, reason: '현재 규칙에서는 이성 장수만 결혼 후보가 됩니다.' };
  if (playerAge == null || playerAge < rules.minimumAge) return { officer: candidate, age, favor, eligible: false, reason: `플레이 장수가 ${rules.minimumAge}세 이상이어야 합니다.` };
  if (age == null || age < rules.minimumAge) return { officer: candidate, age, favor, eligible: false, reason: `상대 장수가 ${rules.minimumAge}세 이상이어야 합니다.` };
  if (favor < rules.minimumFavor) return { officer: candidate, age, favor, eligible: false, reason: `친밀/교분 ${rules.minimumFavor} 이상이 필요합니다.` };

  return { officer: candidate, age, favor, eligible: true };
}

export function buildMarriageCandidates(args: {
  player: FamilyOfficer;
  officers: FamilyOfficer[];
  year: number;
  family: FamilyState;
  officerBonds?: Record<string, { favor?: number } | undefined>;
  freeOfficerRelations?: Record<string, { favor?: number } | undefined>;
  rules?: MarriageRules;
}): MarriageCandidate[] {
  const { player, officers, year, family } = args;
  return officers
    .filter(officer => officer.id !== player.id)
    .map(officer => {
      const favor = relationshipFavor(officer.id, args.officerBonds, args.freeOfficerRelations);
      return evaluateMarriageCandidate({ player, candidate: officer, year, family, favor, rules: args.rules });
    })
    .filter(result => result.officer.city === player.city && result.officer.gender !== player.gender)
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (a.favor !== b.favor) return b.favor - a.favor;
      return a.officer.name.localeCompare(b.officer.name, 'ko');
    });
}

export type MarriageValidation =
  | { ok: true; rules: MarriageRules; candidate: MarriageCandidate }
  | { ok: false; message: string };

export function validateMarriage(args: {
  player: FamilyOfficer;
  candidate: FamilyOfficer;
  year: number;
  family: FamilyState;
  favor: number;
  actionPoints: number;
  personalMoneyCopper: number;
  rules?: MarriageRules;
}): MarriageValidation {
  const rules = args.rules ?? DEFAULT_MARRIAGE_RULES;
  const candidate = evaluateMarriageCandidate({
    player: args.player,
    candidate: args.candidate,
    year: args.year,
    family: args.family,
    favor: args.favor,
    rules,
  });

  if (!candidate.eligible) return { ok: false, message: candidate.reason ?? '결혼 조건을 만족하지 못했습니다.' };
  if (args.actionPoints < rules.actionPointCost) return { ok: false, message: `결혼 준비에는 AP ${rules.actionPointCost}가 필요합니다.` };
  if (args.personalMoneyCopper < rules.moneyCostCopper) return { ok: false, message: `결혼 준비금 ${rules.moneyCostCopper}동이 필요합니다.` };

  return { ok: true, rules, candidate };
}

export function completeMarriage(args: {
  family: FamilyState;
  player: FamilyOfficer;
  spouse: FamilyOfficer;
  date: string;
}): {
  family: FamilyState;
  player: FamilyOfficer;
  spouse: FamilyOfficer;
  chronicleText: string;
} {
  const normalized = normalizeFamilyState(args.family);
  const relationTextForPlayer = `${args.spouse.name}(배우자)`;
  const relationTextForSpouse = `${args.player.name}(배우자)`;
  const playerRelations = [...new Set([...(args.player.relations ?? []), relationTextForPlayer])];
  const spouseRelations = [...new Set([...(args.spouse.relations ?? []), relationTextForSpouse])];
  const chronicleText = `${args.player.name}과(와) ${args.spouse.name}이(가) 혼인했다.`;
  const chronicle: FamilyChronicleEntry = {
    id: `marriage:${args.player.id}:${args.spouse.id}:${args.date}`,
    date: args.date,
    type: '결혼',
    text: chronicleText,
  };

  return {
    family: {
      ...normalized,
      spouseId: args.spouse.id,
      marriageDate: args.date,
      spousesByOfficerId: {
        ...normalized.spousesByOfficerId,
        [args.player.id]: args.spouse.id,
        [args.spouse.id]: args.player.id,
      },
      chronicle: [chronicle, ...normalized.chronicle].slice(0, 150),
    },
    player: { ...args.player, relations: playerRelations },
    spouse: { ...args.spouse, relations: spouseRelations },
    chronicleText,
  };
}

export function spouseOf(family: FamilyState, officers: FamilyOfficer[], playerId?: string): FamilyOfficer | undefined {
  const spouseId = playerId
    ? spouseIdForOfficer(family, playerId) ?? (family.spouseId && family.spousesByOfficerId[playerId] == null ? family.spouseId : undefined)
    : family.spouseId;
  if (!spouseId) return undefined;
  return officers.find(officer => officer.id === spouseId);
}

export type ChildPlanValidation =
  | { ok: true; rules: ChildPlanRules; mother: FamilyOfficer; father: FamilyOfficer }
  | { ok: false; message: string };

export function validateChildPlan(args: {
  family: FamilyState;
  player: FamilyOfficer;
  spouse: FamilyOfficer;
  year: number;
  actionPoints: number;
  personalMoneyCopper: number;
  rules?: ChildPlanRules;
}): ChildPlanValidation {
  const rules = args.rules ?? DEFAULT_CHILD_PLAN_RULES;
  if (args.family.pregnancy) return { ok: false, message: '이미 임신 중입니다.' };
  if (args.player.city !== args.spouse.city) return { ok: false, message: '부부가 같은 도시에 있어야 자녀 계획을 세울 수 있습니다.' };
  const playerAge = officerAgeAtYear(args.player, args.year);
  const spouseAge = officerAgeAtYear(args.spouse, args.year);
  if (playerAge == null || playerAge < rules.minimumAge || spouseAge == null || spouseAge < rules.minimumAge) {
    return { ok: false, message: `부부 모두 ${rules.minimumAge}세 이상이어야 합니다.` };
  }
  if (args.player.gender === args.spouse.gender) return { ok: false, message: '현재 자녀 시스템은 남녀 부부를 기준으로 동작합니다.' };
  if (args.actionPoints < rules.actionPointCost) return { ok: false, message: `자녀 계획에는 AP ${rules.actionPointCost}가 필요합니다.` };
  if (args.personalMoneyCopper < rules.moneyCostCopper) return { ok: false, message: `가정 준비금 ${rules.moneyCostCopper}동이 필요합니다.` };
  const mother = args.player.gender === '여' ? args.player : args.spouse;
  const father = args.player.gender === '남' ? args.player : args.spouse;
  return { ok: true, rules, mother, father };
}

export function beginPregnancy(args: {
  family: FamilyState;
  mother: FamilyOfficer;
  father: FamilyOfficer;
  year: number;
  month: number;
  day: number;
  rules?: ChildPlanRules;
}) {
  const family = normalizeFamilyState(args.family);
  const rules = args.rules ?? DEFAULT_CHILD_PLAN_RULES;
  const conceivedDayNumber = familyDateToDayNumber(args.year, args.month, args.day);
  const dueDayNumber = conceivedDayNumber + rules.pregnancyDays;
  const conceivedDate = familyDayNumberToDate(conceivedDayNumber).label;
  const dueDate = familyDayNumberToDate(dueDayNumber).label;
  const pregnancy: FamilyPregnancy = {
    motherId: args.mother.id,
    fatherId: args.father.id,
    motherName: args.mother.name,
    fatherName: args.father.name,
    conceivedDate,
    conceivedDayNumber,
    dueDate,
    dueDayNumber,
  };
  const chronicleText = `${args.mother.name}에게 새 생명이 찾아왔다. 출산 예정일은 ${dueDate}이다.`;
  const chronicle: FamilyChronicleEntry = {
    id: `pregnancy:${args.mother.id}:${args.father.id}:${conceivedDayNumber}`,
    date: conceivedDate,
    type: '임신',
    text: chronicleText,
  };
  return {
    family: { ...family, pregnancy, chronicle: [chronicle, ...family.chronicle].slice(0, 150) },
    pregnancy,
    chronicleText,
  };
}

function inheritedStats(father: FamilyParentProfile | undefined, mother: FamilyParentProfile | undefined, seed: string): FamilyCoreStats {
  const fatherStats = father?.stats;
  const motherStats = mother?.stats;
  return Object.fromEntries(CORE_STAT_KEYS.map((key, index) => {
    const fatherValue = fatherStats?.[key] ?? 60;
    const motherValue = motherStats?.[key] ?? 60;
    const average = (fatherValue + motherValue) / 2;
    const variance = deterministicRoll(`${seed}:${key}:${index}`, -7, 7);
    return [key, clamp(average + variance, 30, 95)];
  })) as FamilyCoreStats;
}

export type BirthResolution = {
  family: FamilyState;
  child?: FamilyChild;
  chronicleText?: string;
};

export function resolveBirthIfDue(args: {
  family: FamilyState;
  year: number;
  month: number;
  day: number;
  parentsById: Record<string, FamilyParentProfile | undefined>;
}): BirthResolution {
  const family = normalizeFamilyState(args.family);
  const pregnancy = family.pregnancy;
  if (!pregnancy) return { family };
  const currentDayNumber = familyDateToDayNumber(args.year, args.month, args.day);
  if (currentDayNumber < pregnancy.dueDayNumber) return { family };

  const father = args.parentsById[pregnancy.fatherId];
  const mother = args.parentsById[pregnancy.motherId];
  const sequence = family.children.length + 1;
  const childId = `child:${pregnancy.fatherId}:${pregnancy.motherId}:${pregnancy.dueDayNumber}:${sequence}`;
  const gender: FamilyGender = deterministicRoll(`${childId}:gender`, 0, 1) === 0 ? '남' : '여';
  const child: FamilyChild = {
    id: childId,
    name: `아이 ${sequence}`,
    gender,
    fatherId: pregnancy.fatherId,
    motherId: pregnancy.motherId,
    birthDate: pregnancy.dueDate,
    birthDayNumber: pregnancy.dueDayNumber,
    stats: inheritedStats(father, mother, childId),
    traits: [],
    tendencies: [],
    upbringing: { ...EMPTY_UPBRINGING },
    educationMonths: 0,
    personality: '미형성',
    parentBond: 50,
    completedMilestones: [],
  };
  const fatherName = father?.name ?? pregnancy.fatherName;
  const motherName = mother?.name ?? pregnancy.motherName;
  const chronicleText = `${fatherName}과(와) ${motherName} 사이에서 ${gender === '남' ? '아들' : '딸'}이 태어났다.`;
  const chronicle: FamilyChronicleEntry = {
    id: `birth:${child.id}`,
    date: pregnancy.dueDate,
    type: '출산',
    text: chronicleText,
  };
  return {
    family: {
      ...family,
      pregnancy: undefined,
      children: [...family.children, child],
      childIds: [...new Set([...family.childIds, child.id])],
      chronicle: [chronicle, ...family.chronicle].slice(0, 150),
    },
    child,
    chronicleText,
  };
}

const PARENTING_EFFECTS: Record<ParentingFocus, {
  stats: Partial<FamilyCoreStats>;
  tendency: string;
  trait: string;
  description: string;
}> = {
  무예: { stats: { martial: 2, leadership: 1 }, tendency: '대담', trait: '맹장', description: '무예와 담력을 중점적으로 길렀다.' },
  학문: { stats: { intelligence: 2, militaryStrategy: 2 }, tendency: '냉정', trait: '책략가', description: '학문과 병법을 깊이 익혔다.' },
  통솔: { stats: { leadership: 2, militaryStrategy: 1, martial: 1 }, tendency: '과단', trait: '명장', description: '사람과 부대를 이끄는 법을 배웠다.' },
  정치: { stats: { politics: 2, diplomacy: 1, personnel: 1 }, tendency: '절제', trait: '국가경영', description: '행정과 정략의 기초를 익혔다.' },
  사교: { stats: { charisma: 2, diplomacy: 1, personnel: 1 }, tendency: '인정', trait: '인덕', description: '사람을 대하는 법과 관계의 중요성을 배웠다.' },
  균형: { stats: { leadership: 1, intelligence: 1, politics: 1, charisma: 1 }, tendency: '신중', trait: '균형감각', description: '한쪽에 치우치지 않는 균형 잡힌 교육을 받았다.' },
};

export function parentingFocusDescription(focus: ParentingFocus) {
  return PARENTING_EFFECTS[focus].description;
}

export type ParentingValidation =
  | { ok: true; rules: ParentingRules; child: FamilyChild }
  | { ok: false; message: string };

export function validateParenting(args: {
  family: FamilyState;
  childId: string;
  year: number;
  month: number;
  day: number;
  actionPoints: number;
  personalMoneyCopper: number;
  focus?: ParentingFocus;
  rules?: ParentingRules;
}): ParentingValidation {
  const rules = args.rules ?? DEFAULT_PARENTING_RULES;
  const family = normalizeFamilyState(args.family);
  const child = family.children.find(entry => entry.id === args.childId);
  if (!child) return { ok: false, message: '자녀 정보를 찾을 수 없습니다.' };
  const age = childAgeAtDate(child, args.year, args.month, args.day);
  if (age > rules.maximumChildAge) return { ok: false, message: `${rules.maximumChildAge + 1}세 이상은 성인식/후계 시스템에서 성장시켜야 합니다.` };
  if (args.focus && !parentingAllowedFocuses(age).includes(args.focus)) return { ok: false, message: `${childDevelopmentStage(age)}에는 ${args.focus} 교육을 선택할 수 없습니다.` };
  if (args.actionPoints < rules.actionPointCost) return { ok: false, message: `육아에는 AP ${rules.actionPointCost}가 필요합니다.` };
  if (args.personalMoneyCopper < rules.moneyCostCopper) return { ok: false, message: `교육비 ${rules.moneyCostCopper}동이 필요합니다.` };
  return { ok: true, rules, child };
}

export function applyParentingSession(args: {
  family: FamilyState;
  childId: string;
  focus: ParentingFocus;
  date: string;
}) {
  const family = normalizeFamilyState(args.family);
  const effect = PARENTING_EFFECTS[args.focus];
  const child = family.children.find(entry => entry.id === args.childId);
  if (!child) return { family, chronicleText: '', statChanges: {} as Partial<FamilyCoreStats> };
  const parsedDate = parseFamilyDate(args.date);
  const age = parsedDate ? childAgeAtDate(child, parsedDate.year, parsedDate.month, parsedDate.day) : 6;
  const allowed = parentingAllowedFocuses(age);
  if (!allowed.includes(args.focus)) {
    return { family, child, chronicleText: `${child.name}의 현재 성장 단계에는 ${args.focus} 교육이 아직 이릅니다.`, statChanges: {} as Partial<FamilyCoreStats> };
  }
  const stage = childDevelopmentStage(age);
  const nextCount = (child.upbringing[args.focus] ?? 0) + 1;
  const stats = { ...child.stats };
  const statChanges: Partial<FamilyCoreStats> = {};
  Object.entries(effect.stats).forEach(([key, rawGain], index) => {
    const statKey = key as FamilyCoreStatKey;
    let gain = Number(rawGain ?? 0);
    if (stage === '영아기') gain = index === 0 ? 1 : 0;
    else if (stage === '유아기') gain = Math.max(1, Math.round(gain * 0.6));
    else if (stage === '청소년기' && index === 0) gain += 1;
    const bonus = nextCount % 4 === 0 && deterministicRoll(`${child.id}:${args.focus}:${nextCount}:${statKey}`, 0, 1) === 1 ? 1 : 0;
    const before = stats[statKey];
    stats[statKey] = clamp(before + gain + bonus, 1, 100);
    statChanges[statKey] = stats[statKey] - before;
  });
  const tendencies = [...child.tendencies];
  const traits = [...child.traits];
  if (age >= 3 && nextCount >= 3 && !tendencies.includes(effect.tendency)) tendencies.push(effect.tendency);
  if (age >= 6 && nextCount >= 6 && !traits.includes(effect.trait)) traits.push(effect.trait);
  const personalityMap: Record<ParentingFocus, string> = {
    무예: '호방', 학문: '침착', 통솔: '과단', 정치: '신중', 사교: '사교적', 균형: '온화',
  };
  const nextUpbringing = { ...child.upbringing, [args.focus]: nextCount };
  const personality = age >= 3 && nextCount >= 3 ? personalityMap[args.focus] : child.personality;
  const bondGain = stage === '영아기' ? 4 : stage === '유아기' ? 3 : 2;
  const updatedChild: FamilyChild = {
    ...child,
    stats,
    personality,
    parentBond: clamp(child.parentBond + bondGain, 0, 100),
    tendencies: tendencies.slice(0, 5),
    traits: traits.slice(0, 10),
    upbringing: nextUpbringing,
    educationMonths: child.educationMonths + 1,
  };
  const chronicleText = `${child.name}에게 ${args.focus} 중심의 ${stage} 육아·교육을 실시했다. ${effect.description}`;
  const chronicle: FamilyChronicleEntry = {
    id: `parenting:${child.id}:${args.focus}:${updatedChild.educationMonths}:${args.date}`,
    date: args.date,
    type: '육아',
    text: chronicleText,
  };
  return {
    family: {
      ...family,
      children: family.children.map(entry => entry.id === child.id ? updatedChild : entry),
      chronicle: [chronicle, ...family.chronicle].slice(0, 150),
    },
    child: updatedChild,
    chronicleText,
    statChanges,
  };
}

const MILESTONE_AGES = [3, 6, 10, 15] as const;
const MILESTONE_TITLE: Record<(typeof MILESTONE_AGES)[number], string> = {
  3: '성정 형성',
  6: '기초 수학',
  10: '진로 수련',
  15: '성인식 대기',
};

function milestoneGrowth(child: FamilyChild, age: number): FamilyChild {
  const focus = dominantParentingFocus(child);
  const effect = PARENTING_EFFECTS[focus];
  const stats = { ...child.stats };
  const keys = Object.keys(effect.stats) as FamilyCoreStatKey[];
  const bonus = age === 3 ? 1 : age === 6 ? 2 : age === 10 ? 3 : 2;
  keys.slice(0, age >= 10 ? 3 : 2).forEach((key, index) => {
    stats[key] = clamp(stats[key] + Math.max(1, bonus - index), 1, 100);
  });
  const personalityMap: Record<ParentingFocus, string> = {
    무예: age >= 10 ? '용맹' : '호방',
    학문: age >= 10 ? '냉철' : '침착',
    통솔: age >= 10 ? '과단' : '당당',
    정치: age >= 10 ? '치밀' : '신중',
    사교: age >= 10 ? '인정' : '사교적',
    균형: age >= 10 ? '유연' : '온화',
  };
  const tendencies = [...child.tendencies];
  const traits = [...child.traits];
  if (age >= 3 && !tendencies.includes(effect.tendency)) tendencies.push(effect.tendency);
  if (age >= 10 && child.upbringing[focus] >= 6 && !traits.includes(effect.trait)) traits.push(effect.trait);
  if (age === 15 && child.educationMonths >= 24 && !traits.includes('가문교육')) traits.push('가문교육');
  return {
    ...child,
    stats,
    personality: personalityMap[focus],
    parentBond: clamp(child.parentBond + (age === 15 ? 2 : 4), 0, 100),
    tendencies: tendencies.slice(0, 5),
    traits: traits.slice(0, 10),
    completedMilestones: [...new Set([...child.completedMilestones, age])].sort((a, b) => a - b),
  };
}

export function resolveChildDevelopmentMilestones(args: {
  family: FamilyState;
  year: number;
  month: number;
  day: number;
}) {
  let family = normalizeFamilyState(args.family);
  const date = familyDayNumberToDate(familyDateToDayNumber(args.year, args.month, args.day)).label;
  const chronicleEntries: FamilyChronicleEntry[] = [];
  const eventTexts: string[] = [];
  const children = family.children.map(original => {
    let child = original;
    const age = childAgeAtDate(child, args.year, args.month, args.day);
    for (const milestoneAge of MILESTONE_AGES) {
      if (age < milestoneAge || child.completedMilestones.includes(milestoneAge)) continue;
      child = milestoneGrowth(child, milestoneAge);
      const focus = dominantParentingFocus(child);
      const stage = childDevelopmentStage(milestoneAge);
      const text = milestoneAge === 15
        ? `${child.name}이(가) 15세가 되어 성인식을 기다린다. ${focus} 중심의 가문 교육이 최종 성정에 반영되었다.`
        : `${child.name}이(가) ${milestoneAge}세 성장 단계(${MILESTONE_TITLE[milestoneAge]})에 들어섰다. ${focus} 중심의 교육이 성격과 재능에 영향을 주었다.`;
      chronicleEntries.push({
        id: `growth:${child.id}:${milestoneAge}`,
        date: familyDayNumberToDate(child.birthDayNumber + milestoneAge * 360).label,
        type: '성장',
        text,
      });
      eventTexts.push(`[가족·성장] ${text} · ${stage}`);
    }
    return child;
  });
  if (chronicleEntries.length) {
    family = {
      ...family,
      children,
      chronicle: [...chronicleEntries.reverse(), ...family.chronicle].slice(0, 150),
    };
  }
  return { family, eventTexts };
}

export function renameFamilyChild(familyInput: FamilyState, childId: string, name: string) {
  const family = normalizeFamilyState(familyInput);
  const nextName = name.trim().slice(0, 12);
  if (!nextName) return family;
  return {
    ...family,
    children: family.children.map(child => child.id === childId ? { ...child, name: nextName } : child),
  };
}


export function childBirthYear(child: FamilyChild) {
  return familyDayNumberToDate(child.birthDayNumber).year;
}

export function designateFamilyHeir(familyInput: FamilyState, childId: string, date: string) {
  const family = normalizeFamilyState(familyInput);
  const child = family.children.find(entry => entry.id === childId);
  if (!child) return family;
  const text = `${child.name}을(를) 가문의 후계자로 지정했다.`;
  const chronicle: FamilyChronicleEntry = {
    id: `heir:${child.id}:${date}`,
    date,
    type: '가족',
    text,
  };
  return {
    ...family,
    designatedHeirId: child.id,
    chronicle: [chronicle, ...family.chronicle].slice(0, 150),
  };
}

export function markChildComingOfAge(familyInput: FamilyState, childId: string, date: string) {
  const family = normalizeFamilyState(familyInput);
  const child = family.children.find(entry => entry.id === childId);
  if (!child) return { family, child: undefined as FamilyChild | undefined, chronicleText: '' };
  const updatedChild: FamilyChild = { ...child, officerId: child.officerId ?? child.id, comingOfAgeDate: child.comingOfAgeDate ?? date };
  const chronicleText = `${child.name}이(가) 성인식을 치르고 정식 장수로 이름을 올렸다.`;
  const chronicle: FamilyChronicleEntry = {
    id: `coming-of-age:${child.id}`,
    date,
    type: '성인식',
    text: chronicleText,
  };
  return {
    family: {
      ...family,
      children: family.children.map(entry => entry.id === child.id ? updatedChild : entry),
      chronicle: family.chronicle.some(entry => entry.id === chronicle.id) ? family.chronicle : [chronicle, ...family.chronicle].slice(0, 150),
    },
    child: updatedChild,
    chronicleText,
  };
}

export function markChildSuccession(familyInput: FamilyState, childId: string, date: string) {
  const family = normalizeFamilyState(familyInput);
  const child = family.children.find(entry => entry.id === childId);
  if (!child) return { family, child: undefined as FamilyChild | undefined, chronicleText: '' };
  const updatedChild: FamilyChild = { ...child, officerId: child.officerId ?? child.id, successionDate: child.successionDate ?? date };
  const chronicleText = `${child.name}이(가) 가문을 이어 새로운 플레이 장수가 되었다.`;
  const chronicle: FamilyChronicleEntry = {
    id: `succession:${child.id}`,
    date,
    type: '승계',
    text: chronicleText,
  };
  return {
    family: {
      ...family,
      designatedHeirId: child.id,
      children: family.children.map(entry => entry.id === child.id ? updatedChild : entry),
      chronicle: family.chronicle.some(entry => entry.id === chronicle.id) ? family.chronicle : [chronicle, ...family.chronicle].slice(0, 150),
    },
    child: updatedChild,
    chronicleText,
  };
}

export function selectFamilySuccessor(familyInput: FamilyState, parentId?: string) {
  const family = normalizeFamilyState(familyInput);
  const eligibleChildren = parentId
    ? family.children.filter(child => child.fatherId === parentId || child.motherId === parentId)
    : family.children;
  const designated = eligibleChildren.find(child => child.id === family.designatedHeirId);
  if (designated) return designated;
  return [...eligibleChildren].sort((a, b) => a.birthDayNumber - b.birthDayNumber)[0];
}
