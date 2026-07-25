import {
  UNIVERSITY_STATUSES,
  type Professor,
  type ProfessorProfile,
  type RankingHistoryItem,
  type UniversityProgram,
  type UniversityStatus,
} from "../types/university";

export const STORAGE_KEY = "tercih-pilot:data:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function asIsoDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return fallback;
  }

  return new Date(value).toISOString();
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function createId(prefix = "item"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProfessorProfile(value: unknown): ProfessorProfile | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    sourceUrl: asString(value.sourceUrl).trim() || undefined,
    lastUpdated: asString(value.lastUpdated).trim() || undefined,
    academicDuties: asStringArray(value.academicDuties),
    education: asStringArray(value.education),
    projects: asStringArray(value.projects),
    articles: asStringArray(value.articles),
    books: asStringArray(value.books),
    proceedings: asStringArray(value.proceedings),
    externalExperience: asStringArray(value.externalExperience),
    administrativeDuties: asStringArray(value.administrativeDuties),
    awards: asStringArray(value.awards),
    patents: asStringArray(value.patents),
    memberships: asStringArray(value.memberships),
    theses: asStringArray(value.theses),
    courses: asStringArray(value.courses),
  };
}

function normalizeProfessor(value: unknown): Professor | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asString(value.name).trim();
  if (!name) {
    return null;
  }

  return {
    id: asString(value.id).trim() || createId("prof"),
    name,
    title: asString(value.title).trim(),
    field: asString(value.field).trim(),
    score: clamp(asFiniteNumber(value.score, 5), 1, 10),
    note: asString(value.note).trim(),
    profileUrl: asString(value.profileUrl).trim() || undefined,
    researcherId: asString(value.researcherId).trim() || undefined,
    orcid: asString(value.orcid).trim() || undefined,
    profile: normalizeProfessorProfile(value.profile),
    profileFetchedAt:
      asIsoDate(value.profileFetchedAt, "").trim() || undefined,
  };
}

function normalizeRankingHistoryItem(
  value: unknown,
): RankingHistoryItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const year = Math.round(asFiniteNumber(value.year, 0));
  const ranking = Math.round(asFiniteNumber(value.ranking, 0));
  if (year < 2000 || ranking < 1) {
    return null;
  }

  const baseScore =
    typeof value.baseScore === "number" && Number.isFinite(value.baseScore)
      ? value.baseScore
      : undefined;

  return {
    year,
    ranking,
    baseScore,
  };
}

function isUniversityStatus(value: unknown): value is UniversityStatus {
  return (
    typeof value === "string" &&
    UNIVERSITY_STATUSES.includes(value as UniversityStatus)
  );
}

export function normalizeUniversity(
  value: unknown,
): UniversityProgram | null {
  if (!isRecord(value)) {
    return null;
  }

  const universityName = asString(value.universityName).trim();
  const programName = asString(value.programName).trim();
  const city = asString(value.city).trim();
  const ranking = Math.round(asFiniteNumber(value.ranking, 0));

  if (!universityName || !programName || !city || ranking < 1) {
    return null;
  }

  const now = new Date().toISOString();
  const facilities = Array.isArray(value.facilities)
    ? [
        ...new Set(
          value.facilities
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ]
    : [];
  const professors = Array.isArray(value.professors)
    ? value.professors
        .map(normalizeProfessor)
        .filter((professor): professor is Professor => professor !== null)
    : [];
  const rankingHistory = Array.isArray(value.rankingHistory)
    ? value.rankingHistory
        .map(normalizeRankingHistoryItem)
        .filter(
          (item): item is RankingHistoryItem => item !== null,
        )
        .sort((a, b) => b.year - a.year)
    : [];

  return {
    id: asString(value.id).trim() || createId("university"),
    universityName,
    programName,
    city,
    ranking,
    generalScore: clamp(
      Math.round(asFiniteNumber(value.generalScore, 50)),
      1,
      100,
    ),
    status: isUniversityStatus(value.status) ? value.status : "Kararsız",
    facilities,
    notes: asString(value.notes).trim(),
    preferenceOrder: Math.max(
      0,
      Math.round(asFiniteNumber(value.preferenceOrder, 0)),
    ),
    professors,
    atlasCode: asString(value.atlasCode).trim() || undefined,
    atlasUrl: asString(value.atlasUrl).trim() || undefined,
    academicStaffUrl:
      asString(value.academicStaffUrl).trim() || undefined,
    scholarship: asString(value.scholarship).trim() || undefined,
    tuitionFee:
      typeof value.tuitionFee === "number" &&
      Number.isFinite(value.tuitionFee)
        ? Math.max(0, value.tuitionFee)
        : undefined,
    baseTuitionFee:
      typeof value.baseTuitionFee === "number" &&
      Number.isFinite(value.baseTuitionFee)
        ? Math.max(0, value.baseTuitionFee)
        : undefined,
    lastAtlasSyncAt:
      asIsoDate(value.lastAtlasSyncAt, "").trim() || undefined,
    universityType: asString(value.universityType).trim() || undefined,
    facultyName: asString(value.facultyName).trim() || undefined,
    district: asString(value.district).trim() || undefined,
    pointType: asString(value.pointType).trim() || undefined,
    baseScore:
      typeof value.baseScore === "number" &&
      Number.isFinite(value.baseScore)
        ? value.baseScore
        : undefined,
    quota:
      typeof value.quota === "number" && Number.isFinite(value.quota)
        ? Math.max(0, Math.round(value.quota))
        : undefined,
    atlasYear:
      typeof value.atlasYear === "number" && Number.isFinite(value.atlasYear)
        ? Math.round(value.atlasYear)
        : undefined,
    academicHierarchy:
      asString(value.academicHierarchy).trim() || undefined,
    rankingHistory,
    createdAt: asIsoDate(value.createdAt, now),
    updatedAt: asIsoDate(value.updatedAt, now),
  };
}

export function normalizePreferenceOrders(
  universities: UniversityProgram[],
): UniversityProgram[] {
  const orderedIds = universities
    .filter((university) => university.preferenceOrder > 0)
    .sort(
      (a, b) =>
        a.preferenceOrder - b.preferenceOrder ||
        a.createdAt.localeCompare(b.createdAt),
    )
    .map((university) => university.id);
  const orderMap = new Map(
    orderedIds.map((id, index) => [id, index + 1] as const),
  );

  return universities.map((university) => ({
    ...university,
    preferenceOrder: orderMap.get(university.id) ?? 0,
  }));
}

export function parseUniversityArray(value: unknown): UniversityProgram[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const normalized = value
    .map(normalizeUniversity)
    .filter(
      (university): university is UniversityProgram => university !== null,
    )
    .map((university) => {
      if (seenIds.has(university.id)) {
        return { ...university, id: createId("university") };
      }

      seenIds.add(university.id);
      return university;
    });

  return normalizePreferenceOrders(normalized);
}

export function loadUniversities(): UniversityProgram[] {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    return parseUniversityArray(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function saveUniversities(
  universities: UniversityProgram[],
): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(universities));
    return true;
  } catch {
    return false;
  }
}
