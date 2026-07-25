import type { UniversityProgram } from "../types/university";

export interface YokAtlasCatalogResponse {
  programs: UniversityProgram[];
  fetchedAt: string;
  cached: boolean;
  sourceCount: number;
  warnings: string[];
}

export async function fetchYokAtlasCatalog(
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<YokAtlasCatalogResponse> {
  const query = options.force ? "?force=1" : "";
  const response = await fetch(`/local-yok-atlas/catalog${query}`, {
    signal: options.signal,
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => null)) as
    | YokAtlasCatalogResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload && "message" in payload && payload.message
        ? payload.message
        : `YÖK Atlas verileri alınamadı (${response.status}).`,
    );
  }

  if (!payload || !("programs" in payload) || !Array.isArray(payload.programs)) {
    throw new Error("YÖK Atlas beklenmeyen bir veri biçimi döndürdü.");
  }

  return {
    programs: payload.programs,
    fetchedAt:
      typeof payload.fetchedAt === "string"
        ? payload.fetchedAt
        : new Date().toISOString(),
    cached: Boolean(payload.cached),
    sourceCount:
      typeof payload.sourceCount === "number" ? payload.sourceCount : 0,
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.filter(
          (warning): warning is string => typeof warning === "string",
        )
      : [],
  };
}

export function formatCurrency(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getProgramSearchText(program: UniversityProgram): string {
  return normalizeSearchText(
    [
      program.universityName,
      program.programName,
      program.city,
      program.district,
      program.universityType,
      program.facultyName,
      program.academicHierarchy,
      program.pointType,
      program.scholarship,
      program.educationLevel,
      program.educationType,
      program.educationLanguage,
      program.educationDuration
        ? `${program.educationDuration} yıl`
        : undefined,
      program.occupancy,
      program.atlasCode,
      program.facilities.join(" "),
    ]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  );
}
