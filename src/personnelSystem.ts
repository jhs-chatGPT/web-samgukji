export type ForceRankName = '현령' | '주목' | '중랑장' | '대장군' | '왕' | '황제';
export type OfficerRank = '일반' | '부장' | '도위' | '교위' | '중랑장' | '편장군' | '장군' | '상장군' | '대장군';
export type OfficerAppointment = '없음' | '군사' | '태수' | '도독' | '군량관' | '선봉장' | '친위대장';

export type OfficerRankDefinition = {
  name: OfficerRank;
  maxTroops: number;
  unlockTier: number;
  description: string;
};

export type AppointmentDefinition = {
  name: OfficerAppointment;
  unlockTier: number;
  unique: boolean;
  cityBound: boolean;
  effect: string;
};

export const OFFICER_RANKS: OfficerRankDefinition[] = [
  { name: '일반', maxTroops: 12000, unlockTier: 0, description: '기본 무관 직급. 소규모 부대를 지휘합니다.' },
  { name: '부장', maxTroops: 20000, unlockTier: 0, description: '주장을 보좌하며 중소 규모 부대를 지휘합니다.' },
  { name: '도위', maxTroops: 35000, unlockTier: 0, description: '현령급 세력에서 받을 수 있는 최고 군직입니다.' },
  { name: '교위', maxTroops: 50000, unlockTier: 1, description: '태수급 세력부터 임명 가능한 정규 지휘관입니다.' },
  { name: '중랑장', maxTroops: 75000, unlockTier: 1, description: '여러 부대를 묶어 운용할 수 있는 상급 지휘관입니다.' },
  { name: '편장군', maxTroops: 110000, unlockTier: 2, description: '주목급 세력부터 임명 가능한 장군급 직책입니다.' },
  { name: '장군', maxTroops: 160000, unlockTier: 3, description: '대규모 야전군을 지휘하는 정식 장군입니다.' },
  { name: '상장군', maxTroops: 230000, unlockTier: 3, description: '세력의 핵심 군권을 맡는 최고위 장수입니다.' },
  { name: '대장군', maxTroops: 325000, unlockTier: 4, description: '대장군급 세력에서만 임명 가능한 최고 군직입니다.' },
];

export const APPOINTMENT_OPTIONS: AppointmentDefinition[] = [
  { name: '없음', unlockTier: 0, unique: false, cityBound: false, effect: '별도 보직 효과 없음' },
  { name: '군사', unlockTier: 0, unique: true, cityBound: false, effect: '세력 전체 출정 시 지략 지원으로 공격 전투력 보정' },
  { name: '태수', unlockTier: 0, unique: false, cityBound: true, effect: '담당 도시의 내정 담당자로 우선 배치되고 내정 성과 보정' },
  { name: '친위대장', unlockTier: 0, unique: true, cityBound: false, effect: '일기토 지휘관일 때 일기토 능력 보정' },
  { name: '군량관', unlockTier: 1, unique: true, cityBound: false, effect: '출정군 보급을 관리해 아군 전투 손실 감소' },
  { name: '선봉장', unlockTier: 1, unique: true, cityBound: false, effect: '출전 부대에 포함되면 해당 부대 공격력 보정' },
  { name: '도독', unlockTier: 2, unique: true, cityBound: false, effect: '대군 지휘 보정과 출전 부대 공격력 보정' },
];

export function forceRankTier(forceRank: ForceRankName) {
  if (forceRank === '왕' || forceRank === '황제') return 4;
  if (forceRank === '대장군') return 3;
  if (forceRank === '중랑장') return 2;
  if (forceRank === '주목') return 1;
  return 0;
}

export function availableOfficerRanks(forceRank: ForceRankName) {
  const tier = forceRankTier(forceRank);
  return OFFICER_RANKS.filter(rank => rank.unlockTier <= tier);
}

export function availableAppointments(forceRank: ForceRankName) {
  const tier = forceRankTier(forceRank);
  return APPOINTMENT_OPTIONS.filter(appointment => appointment.unlockTier <= tier);
}

export function rankDefinition(rank: OfficerRank) {
  return OFFICER_RANKS.find(entry => entry.name === rank) ?? OFFICER_RANKS[0];
}

export function appointmentDefinition(appointment: OfficerAppointment) {
  return APPOINTMENT_OPTIONS.find(entry => entry.name === appointment) ?? APPOINTMENT_OPTIONS[0];
}

export function defaultOfficerRank(leadership: number, militaryStrategy: number, forceRank: ForceRankName): OfficerRank {
  const available = availableOfficerRanks(forceRank);
  const score = leadership + militaryStrategy;
  let offset = 0;
  if (score < 130) offset = 4;
  else if (score < 150) offset = 3;
  else if (score < 170) offset = 2;
  else if (score < 185) offset = 1;
  const index = Math.max(0, available.length - 1 - offset);
  return available[index].name;
}

export function normalizeOfficerRank(rank: OfficerRank | undefined, forceRank: ForceRankName, leadership: number, militaryStrategy: number): OfficerRank {
  const available = availableOfficerRanks(forceRank);
  if (rank && available.some(entry => entry.name === rank)) return rank;
  return defaultOfficerRank(leadership, militaryStrategy, forceRank);
}

export function normalizeAppointment(appointment: OfficerAppointment | undefined, forceRank: ForceRankName): OfficerAppointment {
  if (appointment && availableAppointments(forceRank).some(entry => entry.name === appointment)) return appointment;
  return '없음';
}

export function officerCommandCap(
  rank: OfficerRank,
  forceMaxTroops: number,
  leadership: number,
  militaryStrategy: number,
  appointment: OfficerAppointment,
  isRuler: boolean
) {
  if (isRuler) return forceMaxTroops;
  const hardCap = Math.min(forceMaxTroops, rankDefinition(rank).maxTroops);
  const abilityFactor = Math.min(1, 0.6 + (leadership + militaryStrategy) / 500);
  const appointmentFactor = appointment === '도독' ? 1.06 : 1;
  return Math.max(3000, Math.floor(Math.min(hardCap, hardCap * abilityFactor * appointmentFactor) / 500) * 500);
}
