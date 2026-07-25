import type { Professor, UniversityProgram } from "../types/university";

export const UNKNOWN_RANKING = Number.MAX_SAFE_INTEGER;

type ScoringInput = Pick<
  UniversityProgram,
  "generalScore" | "professors" | "facilities"
>;

export function calculateAverageProfessorScore(
  professors: Professor[],
): number {
  if (professors.length === 0) {
    return 0;
  }

  const total = professors.reduce((sum, professor) => sum + professor.score, 0);
  return total / professors.length;
}

export function calculateRecommendationScore(input: ScoringInput): number {
  const professorScore =
    calculateAverageProfessorScore(input.professors) * 10;
  const facilityScore = Math.min(input.facilities.length / 8, 1) * 100;

  return Math.round(
    input.generalScore * 0.5 + professorScore * 0.3 + facilityScore * 0.2,
  );
}

export function formatRanking(ranking: number): string {
  return hasKnownRanking(ranking)
    ? new Intl.NumberFormat("tr-TR").format(ranking)
    : "—";
}

export function hasKnownRanking(ranking: number): boolean {
  return (
    Number.isFinite(ranking) &&
    Number.isInteger(ranking) &&
    ranking > 0 &&
    ranking < UNKNOWN_RANKING
  );
}

export function formatProfessorScore(score: number): string {
  if (score === 0) {
    return "—";
  }

  return score.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function getMostCommonCity(
  universities: UniversityProgram[],
): { city: string; count: number } | null {
  if (universities.length === 0) {
    return null;
  }

  const cityCounts = universities.reduce<Record<string, number>>(
    (counts, university) => {
      counts[university.city] = (counts[university.city] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const [city, count] = Object.entries(cityCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"),
  )[0];

  return { city, count };
}
