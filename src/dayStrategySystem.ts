import { specialtyGradeValue, type SpecialtyMap } from './officerSystem';

export const MONTHLY_ACTION_POINTS = 100;
export const DAYS_PER_MONTH = 30;

export type TroopType = '보병' | '기병' | '궁병';
export type OfficerTask = '상업' | '농업' | '치안' | '방벽' | '훈련' | '인재탐색' | '휴식';

export const OFFICER_TASKS: OfficerTask[] = ['상업', '농업', '치안', '방벽', '훈련', '인재탐색', '휴식'];
export const TROOP_TYPES: TroopType[] = ['보병', '기병', '궁병'];

export function ageAtYear(birthYear: number | null | undefined, year: number) {
  if (!birthYear || birthYear > year) return null;
  return Math.max(1, year - birthYear + 1);
}

export function councilKey(year: number, month: number, day: number) {
  const period = Math.min(3, Math.floor((Math.max(1, day) - 1) / 10) + 1);
  return `${year}-${month}-${period}`;
}

export function cityRouteHops(cities: Array<{ id: string; neighbors: string[] }>, fromId: string, toId: string) {
  if (fromId === toId) return 0;
  const queue: Array<{ id: string; hops: number }> = [{ id: fromId, hops: 0 }];
  const visited = new Set([fromId]);
  while (queue.length) {
    const current = queue.shift()!;
    const city = cities.find(entry => entry.id === current.id);
    if (!city) continue;
    for (const neighbor of city.neighbors) {
      if (neighbor === toId) return current.hops + 1;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, hops: current.hops + 1 });
      }
    }
  }
  return Number.POSITIVE_INFINITY;
}

export function travelDaysBetween(cities: Array<{ id: string; neighbors: string[] }>, fromId: string, toId: string) {
  const hops = cityRouteHops(cities, fromId, toId);
  if (!Number.isFinite(hops)) return Number.POSITIVE_INFINITY;
  if (hops === 0) return 0;
  return Math.max(1, hops * 2);
}

export function preferredTroopType(officer: { specialties: SpecialtyMap }): TroopType {
  return (['보병', '기병', '궁병'] as TroopType[]).slice().sort(
    (a, b) => specialtyGradeValue(officer.specialties[b]) - specialtyGradeValue(officer.specialties[a])
  )[0];
}

export function troopMatchupMultiplier(attacker: TroopType, defender: TroopType) {
  if (attacker === defender) return 1;
  if ((attacker === '보병' && defender === '기병') || (attacker === '기병' && defender === '궁병') || (attacker === '궁병' && defender === '보병')) return 1.08;
  return 0.94;
}

export function recommendOfficerTask(officer: {
  politics: number;
  intelligence: number;
  personnel: number;
  specialties: SpecialtyMap;
}): OfficerTask {
  const scores: Array<[OfficerTask, number]> = [
    ['상업', officer.politics + specialtyGradeValue(officer.specialties['상업'])],
    ['농업', officer.politics + specialtyGradeValue(officer.specialties['농업'])],
    ['치안', officer.politics + officer.personnel * 0.3 + specialtyGradeValue(officer.specialties['치안'])],
    ['방벽', officer.politics + officer.intelligence * 0.25 + specialtyGradeValue(officer.specialties['축성'])],
    ['훈련', officer.personnel + officer.politics * 0.25 + specialtyGradeValue(officer.specialties['훈련'])],
    ['인재탐색', officer.intelligence + officer.personnel * 0.45 + specialtyGradeValue(officer.specialties['인재탐색'])],
  ];
  return scores.sort((a, b) => b[1] - a[1])[0][0];
}

export function taskAdvice(officer: { name: string; politics: number; intelligence: number; personnel: number; specialties: SpecialtyMap }, task: OfficerTask) {
  const specialty = task === '방벽' ? '축성' : task === '인재탐색' ? '인재탐색' : task === '훈련' ? '훈련' : task;
  if (task === '휴식') return `${officer.name}: 이번 순에는 휴식하며 다음 명을 기다리겠습니다.`;
  if (task === '인재탐색') return `${officer.name}: 지략 ${officer.intelligence}·인사 ${officer.personnel}, 인재탐색 ${officer.specialties['인재탐색']}를 살려 인재를 찾아보겠습니다.`;
  return `${officer.name}: 정치 ${officer.politics}·인사 ${officer.personnel}, ${specialty} ${officer.specialties[specialty]}를 활용해 ${task}에 힘쓰겠습니다.`;
}
