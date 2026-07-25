import type { UniversityProgram } from "../types/university";
import { hasKnownRanking } from "./scoring";
import { getProgramSearchText, normalizeSearchText } from "./yokAtlas";

export type AtlasSortKey = "ranking" | "score" | "name" | "previousRanking";

export type AtlasFilters = {
  query: string;
  programs: string[];
  universities: string[];
  cities: string[];
  pointTypes: string[];
  educationLevels: string[];
  universityTypes: string[];
  scholarships: string[];
  educationTypes: string[];
  educationLanguages: string[];
  occupancies: string[];
  minRanking: string;
  maxRanking: string;
  minScore: string;
  maxScore: string;
  onlyKnownRanking: boolean;
  sort: AtlasSortKey;
};

export type AtlasMultiFilterKey =
  | "programs"
  | "universities"
  | "cities"
  | "pointTypes"
  | "educationLevels"
  | "universityTypes"
  | "scholarships"
  | "educationTypes"
  | "educationLanguages"
  | "occupancies";

export type AtlasFilterOptions = {
  programs: string[];
  universities: string[];
  cities: string[];
  pointTypes: string[];
  educationLevels: string[];
  universityTypes: string[];
  scholarships: string[];
  educationTypes: string[];
  educationLanguages: string[];
  occupancies: string[];
};

export const DEFAULT_ATLAS_FILTERS: AtlasFilters = {
  query: "",
  programs: [],
  universities: [],
  cities: [],
  pointTypes: [],
  educationLevels: [],
  universityTypes: [],
  scholarships: [],
  educationTypes: [],
  educationLanguages: [],
  occupancies: [],
  minRanking: "",
  maxRanking: "",
  minScore: "",
  maxScore: "",
  onlyKnownRanking: false,
  sort: "ranking",
};

export function buildAtlasFilterOptions(
  catalog: UniversityProgram[],
): AtlasFilterOptions {
  return {
    programs: unique(catalog.map((item) => item.programName)),
    universities: unique(catalog.map((item) => item.universityName)),
    cities: unique(
      catalog.map((item) => item.city).filter((item) => item !== "—"),
    ),
    pointTypes: unique(catalog.map((item) => item.pointType ?? "")),
    educationLevels: unique(
      catalog.map((item) => item.educationLevel ?? ""),
    ),
    universityTypes: unique(
      catalog.map((item) => item.universityType ?? ""),
    ),
    scholarships: unique(catalog.map((item) => item.scholarship ?? "")),
    educationTypes: unique(
      catalog.map((item) => item.educationType ?? ""),
    ),
    educationLanguages: unique(
      catalog.map((item) => item.educationLanguage ?? ""),
    ),
    occupancies: unique(catalog.map((item) => item.occupancy ?? "")),
  };
}

export function buildAtlasSearchIndex(
  catalog: UniversityProgram[],
): Map<string, string> {
  return new Map(
    catalog.map((program) => [program.id, getProgramSearchText(program)]),
  );
}

export function filterAtlasPrograms(
  catalog: UniversityProgram[],
  filters: AtlasFilters,
  query: string,
  searchIndex: Map<string, string>,
): UniversityProgram[] {
  const queryTokens = normalizeSearchText(query).split(" ").filter(Boolean);
  const minRanking = toNumber(filters.minRanking);
  const maxRanking = toNumber(filters.maxRanking);
  const minScore = toNumber(filters.minScore);
  const maxScore = toNumber(filters.maxScore);

  return catalog
    .filter((program) => {
      const text = searchIndex.get(program.id) ?? "";
      if (
        queryTokens.length > 0 &&
        !queryTokens.every((token) => text.includes(token))
      ) {
        return false;
      }
      if (!matchesSelected(program.programName, filters.programs)) return false;
      if (!matchesSelected(program.universityName, filters.universities)) {
        return false;
      }
      if (!matchesSelected(program.city, filters.cities)) return false;
      if (!matchesSelected(program.pointType, filters.pointTypes)) return false;
      if (!matchesSelected(program.educationLevel, filters.educationLevels)) {
        return false;
      }
      if (!matchesSelected(program.universityType, filters.universityTypes)) {
        return false;
      }
      if (!matchesSelected(program.scholarship, filters.scholarships)) {
        return false;
      }
      if (!matchesSelected(program.educationType, filters.educationTypes)) {
        return false;
      }
      if (
        !matchesSelected(
          program.educationLanguage,
          filters.educationLanguages,
        )
      ) {
        return false;
      }
      if (!matchesSelected(program.occupancy, filters.occupancies)) return false;

      const rankingKnown = hasKnownRanking(program.ranking);
      if (filters.onlyKnownRanking && !rankingKnown) return false;
      if ((minRanking !== null || maxRanking !== null) && !rankingKnown) {
        return false;
      }
      if (minRanking !== null && program.ranking < minRanking) return false;
      if (maxRanking !== null && program.ranking > maxRanking) return false;
      if (minScore !== null && (program.baseScore ?? -Infinity) < minScore) {
        return false;
      }
      if (maxScore !== null && (program.baseScore ?? Infinity) > maxScore) {
        return false;
      }
      return true;
    })
    .sort((a, b) => sortPrograms(a, b, filters.sort));
}

export function countActiveAtlasFilters(filters: AtlasFilters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.programs.length +
    filters.universities.length +
    filters.cities.length +
    filters.pointTypes.length +
    filters.educationLevels.length +
    filters.universityTypes.length +
    filters.scholarships.length +
    filters.educationTypes.length +
    filters.educationLanguages.length +
    filters.occupancies.length +
    (filters.minRanking ? 1 : 0) +
    (filters.maxRanking ? 1 : 0) +
    (filters.minScore ? 1 : 0) +
    (filters.maxScore ? 1 : 0) +
    (filters.onlyKnownRanking ? 1 : 0)
  );
}

export function getAtlasProgramKey(program: UniversityProgram): string {
  return normalizeSearchText(
    [
      program.atlasCode ?? "",
      program.universityName,
      program.programName,
      program.city,
      program.pointType ?? "",
    ].join("|"),
  );
}

export function rankAtlasOptions(
  options: string[],
  query: string,
  limit: number,
): string[] {
  if (!query) return options.slice(0, limit);
  return options
    .map((option) => {
      const normalized = normalizeSearchText(option);
      return { option, index: normalized.indexOf(query) };
    })
    .filter((item) => item.index >= 0)
    .sort(
      (a, b) =>
        a.index - b.index ||
        a.option.length - b.option.length ||
        a.option.localeCompare(b.option, "tr"),
    )
    .slice(0, limit)
    .map((item) => item.option);
}

function matchesSelected(
  value: string | undefined,
  selected: string[],
): boolean {
  return selected.length === 0 || Boolean(value && selected.includes(value));
}

function sortPrograms(
  a: UniversityProgram,
  b: UniversityProgram,
  sort: AtlasSortKey,
): number {
  if (sort === "name") {
    return (
      a.programName.localeCompare(b.programName, "tr") ||
      a.universityName.localeCompare(b.universityName, "tr")
    );
  }
  if (sort === "score") return (b.baseScore ?? 0) - (a.baseScore ?? 0);
  if (sort === "previousRanking") {
    return (
      (a.previousRanking ?? Number.MAX_SAFE_INTEGER) -
      (b.previousRanking ?? Number.MAX_SAFE_INTEGER)
    );
  }
  const rankingA = hasKnownRanking(a.ranking)
    ? a.ranking
    : Number.MAX_SAFE_INTEGER;
  const rankingB = hasKnownRanking(b.ranking)
    ? b.ranking
    : Number.MAX_SAFE_INTEGER;
  return rankingA - rankingB;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "tr"),
  );
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const compact = value.replace(/\s/g, "");
  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
