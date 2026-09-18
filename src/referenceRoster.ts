import { REFERENCE_DATA_PART_1 } from './referenceRosterPart1';
import { REFERENCE_DATA_PART_2 } from './referenceRosterPart2';
import { REFERENCE_DATA_PART_3 } from './referenceRosterPart3';
import { REFERENCE_DATA_PART_4 } from './referenceRosterPart4';

export type ReferenceOfficerSeed = {
  id: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  activeFrom: number;
  activeTo: number;
  force: string;
  city: string;
  leadership: number;
  martial: number;
  intelligence: number;
  politics: number;
  charisma: number;
};

export const REFERENCE_SCENARIO_COUNTS = { 184: 1000, 221: 583 } as const;

const FORCE_CODES: Record<string, string> = {
  r: '재야', h: '후한 조정', y: '황건군', d: '동탁군', s: '손견군',
  g: '공손찬군', l: '유언군', j: '정원군', x: '사섭군', m: '마등군',
};

const DATA = [REFERENCE_DATA_PART_1, REFERENCE_DATA_PART_2, REFERENCE_DATA_PART_3, REFERENCE_DATA_PART_4].join('\n');

export const REFERENCE_OFFICERS_DATA: ReferenceOfficerSeed[] = DATA.split('\n').map((line, index) => {
  const [name, birthText, deathText, activeFromText, forceCode, city, leadershipText, martialText, intelligenceText, politicsText, charismaText] = line.split('|');
  const birthYear = birthText ? Number(birthText) : null;
  const deathYear = deathText ? Number(deathText) : null;
  const activeFrom = Number(activeFromText);
  return {
    id: `ref-${String(index + 1).padStart(4, '0')}`,
    name,
    birthYear,
    deathYear,
    activeFrom,
    activeTo: deathYear ?? 280,
    force: FORCE_CODES[forceCode] ?? '재야',
    city,
    leadership: Number(leadershipText),
    martial: Number(martialText),
    intelligence: Number(intelligenceText),
    politics: Number(politicsText),
    charisma: Number(charismaText),
  };
});

export function resolveReferenceProfile(name: string, activeFrom: number, activeTo?: number) {
  const candidates = REFERENCE_OFFICERS_DATA.filter(officer => officer.name === name);
  if (!candidates.length) return undefined;
  const viable = candidates.filter(officer => (officer.birthYear ?? -999) <= activeFrom && officer.activeTo >= activeFrom);
  const pool = viable.length ? viable : candidates;
  return pool.slice().sort((a, b) => {
    const aAgeScore = a.birthYear === null ? 20 : Math.abs((activeFrom - a.birthYear) - 25);
    const bAgeScore = b.birthYear === null ? 20 : Math.abs((activeFrom - b.birthYear) - 25);
    const aScore = Math.abs(activeFrom - a.activeFrom) * 2 + aAgeScore + Math.abs((activeTo ?? a.activeTo) - a.activeTo) * 0.03;
    const bScore = Math.abs(activeFrom - b.activeFrom) * 2 + bAgeScore + Math.abs((activeTo ?? b.activeTo) - b.activeTo) * 0.03;
    return aScore - bScore;
  })[0];
}

export function resolveReferenceLife(name: string, activeFrom: number, activeTo?: number) {
  const match = resolveReferenceProfile(name, activeFrom, activeTo);
  if (!match || match.birthYear === null || match.deathYear === null) return undefined;
  return [match.birthYear, match.deathYear] as const;
}
