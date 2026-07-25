import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

const YOK_ATLAS_BASE_URL = "https://yokatlas.yok.gov.tr";
const SEARCH_PATH = "/api/tercih-kilavuz/search";
const CACHE_TTL_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 1_000;
const PAGE_CONCURRENCY = 4;

type CatalogLevel = "Lisans" | "Önlisans";

type AcademicStaffSummary = {
  professor: number;
  associateProfessor: number;
  doctorFacultyMember: number;
  lecturer: number;
  researchAssistant: number;
  total: number;
};

type RankingHistoryItem = {
  year: number;
  ranking: number;
  baseScore?: number;
};

type CatalogProgram = {
  id: string;
  universityName: string;
  programName: string;
  city: string;
  ranking: number;
  generalScore: number;
  status: "Kararsız";
  facilities: string[];
  notes: string;
  preferenceOrder: 0;
  professors: [];
  atlasCode?: string;
  atlasUrl?: string;
  scholarship?: string;
  lastAtlasSyncAt: string;
  universityType?: string;
  facultyName?: string;
  district?: string;
  pointType?: string;
  baseScore?: number;
  quota?: number;
  atlasYear?: number;
  academicHierarchy?: string;
  rankingHistory: RankingHistoryItem[];
  educationLevel: CatalogLevel;
  educationType?: string;
  educationLanguage?: string;
  educationDuration?: number;
  occupancy?: string;
  placed?: number;
  previousRanking?: number;
  previousBaseScore?: number;
  academicStaffSummary?: AcademicStaffSummary;
  createdAt: string;
  updatedAt: string;
};

type CatalogCache = {
  programs: CatalogProgram[];
  fetchedAt: string;
  expiresAt: number;
  pageCount: number;
  warnings: string[];
};

type MiddlewareRequest = NodeJS.ReadableStream & {
  method?: string;
  url?: string;
};

type MiddlewareResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

type ApiPage = {
  content?: unknown[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  last?: boolean;
  yil?: number;
  source?: string;
};

let catalogCache: CatalogCache | null = null;
let catalogRequest: Promise<CatalogCache> | null = null;

function yokAtlasProxy(): Plugin {
  return {
    name: "yok-atlas-local-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/local-yok-atlas/catalog",
        async (
          request: MiddlewareRequest,
          response: MiddlewareResponse,
          next: () => void,
        ) => {
          if (request.method !== "GET") {
            next();
            return;
          }

          const requestUrl = new URL(request.url ?? "", "http://localhost");
          const force = requestUrl.searchParams.get("force") === "1";

          try {
            const catalog = await getCatalog(force);
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end(
              JSON.stringify({
                programs: catalog.programs,
                fetchedAt: catalog.fetchedAt,
                cached: !force && Date.now() < catalog.expiresAt,
                sourceCount: catalog.pageCount,
                warnings: catalog.warnings,
              }),
            );
          } catch (error) {
            response.statusCode = 502;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(
              JSON.stringify({
                message:
                  error instanceof Error
                    ? error.message
                    : "YÖK Atlas program kataloğu alınamadı.",
              }),
            );
          }
        },
      );

      server.middlewares.use(
        "/local-yok-atlas/search",
        async (
          request: MiddlewareRequest,
          response: MiddlewareResponse,
          next: () => void,
        ) => {
          if (request.method !== "POST") {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const atlasResponse = await fetchWithRetry(
              `${YOK_ATLAS_BASE_URL}${SEARCH_PATH}`,
              {
                method: "POST",
                headers: atlasHeaders(),
                body,
              },
            );
            response.statusCode = atlasResponse.status;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(await atlasResponse.text());
          } catch (error) {
            response.statusCode = 502;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(
              JSON.stringify({
                message:
                  error instanceof Error ? error.message : "YÖK Atlas proxy hatası.",
              }),
            );
          }
        },
      );
    },
  };
}

async function getCatalog(force: boolean): Promise<CatalogCache> {
  if (!force && catalogCache && Date.now() < catalogCache.expiresAt) {
    return catalogCache;
  }
  if (catalogRequest) return catalogRequest;

  catalogRequest = buildCatalog()
    .then((catalog) => {
      catalogCache = catalog;
      return catalog;
    })
    .finally(() => {
      catalogRequest = null;
    });

  return catalogRequest;
}

async function buildCatalog(): Promise<CatalogCache> {
  const fetchedAt = new Date().toISOString();
  const firstPage = await fetchCatalogPage(0, PAGE_SIZE);
  const totalPages = Math.max(1, asInteger(firstPage.totalPages) ?? 1);
  const pages: ApiPage[] = [firstPage];
  const warnings: string[] = [];

  for (let start = 1; start < totalPages; start += PAGE_CONCURRENCY) {
    const pageNumbers = Array.from(
      { length: Math.min(PAGE_CONCURRENCY, totalPages - start) },
      (_, offset) => start + offset,
    );
    const settled = await Promise.allSettled(
      pageNumbers.map((page) => fetchCatalogPage(page, PAGE_SIZE)),
    );

    settled.forEach((result, index) => {
      const page = pageNumbers[index];
      if (result.status === "fulfilled") {
        pages.push(result.value);
      } else {
        warnings.push(`Sayfa ${page + 1}: ${errorMessage(result.reason)}`);
      }
    });
  }

  const programs = dedupePrograms(
    pages.flatMap((page) =>
      (Array.isArray(page.content) ? page.content : [])
        .map((item) => mapApiProgram(item, fetchedAt, page.yil))
        .filter((item): item is CatalogProgram => item !== null),
    ),
  );

  if (programs.length === 0) {
    throw new Error("YÖK Atlas yanıt verdi ancak program verisi ayrıştırılamadı.");
  }

  return {
    programs,
    fetchedAt,
    expiresAt: Date.now() + CACHE_TTL_MS,
    pageCount: pages.length,
    warnings,
  };
}

async function fetchCatalogPage(page: number, size: number): Promise<ApiPage> {
  const response = await fetchWithRetry(`${YOK_ATLAS_BASE_URL}${SEARCH_PATH}`, {
    method: "POST",
    headers: atlasHeaders(),
    body: JSON.stringify({
      filters: {
        puanTuru: null,
        universiteId: [],
        birimGrupId: [],
        ilKodu: [],
        birimTuruId: null,
        universiteTuru: null,
        bursOraniId: null,
        ogrenimTuruId: null,
        kilavuzKodu: null,
        minBasariSirasi: null,
        maxBasariSirasi: null,
      },
      page,
      size,
      sortBy: "birimAdi",
      direction: "ASC",
    }),
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 300);
    throw new Error(`YÖK Atlas HTTP ${response.status}${message ? `: ${message}` : ""}`);
  }

  const payload = (await response.json()) as ApiPage;
  if (!payload || !Array.isArray(payload.content)) {
    throw new Error("YÖK Atlas beklenmeyen sayfa biçimi döndürdü.");
  }
  return payload;
}

function mapApiProgram(
  value: unknown,
  fetchedAt: string,
  fallbackYear?: number,
): CatalogProgram | null {
  if (!isRecord(value)) return null;

  const atlasCode = asText(pick(value, "kilavuzKodu", "kilavuz_kodu"));
  const universityName = asText(pick(value, "universiteAdi", "universite_adi"));
  const programName = asText(pick(value, "birimAdi", "birim_adi"));
  if (!atlasCode || !universityName || !programName) return null;

  const year =
    asInteger(pick(value, "yil", "year")) ??
    asInteger(fallbackYear) ??
    new Date(fetchedAt).getFullYear();
  const ranking = positiveInteger(pick(value, "basariSirasi", "basari_sirasi"));
  const baseScore = positiveNumber(pick(value, "minPuan", "min_puan"));
  const quota = nonNegativeInteger(pick(value, "kontenjan"));
  const placed = nonNegativeInteger(pick(value, "gkY", "yerlesen"));
  const educationLevel = normalizeLevel(
    asText(pick(value, "birimTuruAdi", "birim_turu_adi")),
  );
  const educationType = asText(
    pick(value, "ogrenimTuruAdi", "ogrenim_turu_adi"),
  );
  const educationLanguage = asText(
    pick(value, "ogrenimDiliAdi", "ogrenim_dili_adi"),
  );
  const educationDuration = positiveInteger(
    pick(value, "ogrenimSuresi", "ogrenim_suresi"),
  );
  const scholarship = asText(pick(value, "bursOraniAdi", "burs_orani_adi"));
  const universityType = titleCase(
    asText(pick(value, "universiteTuru", "universite_turu")),
  );
  const city =
    asText(pick(value, "ilAdi", "il_adi", "uniIlAdi", "uni_il_adi")) || "—";
  const district = asText(
    pick(value, "ilceAdi", "ilce_adi", "uniIlceAdi", "uni_ilce_adi"),
  );
  const facultyName = asText(pick(value, "fymkAdi", "fymk_adi"));
  const pointType = normalizePointType(asText(pick(value, "puanTuru", "puan_turu")));
  const academicHierarchy = asText(
    pick(value, "birimHiyerarsi", "birim_hiyerarsi"),
  );
  const academicStaffSummary = mapAcademicStaff(value);
  const rankingHistory = mapRankingHistory(value, year);
  const previous = rankingHistory.find((item) => item.year < year);
  const rankingValue = ranking ?? Number.MAX_SAFE_INTEGER;
  const occupancy = getOccupancy(quota, placed);
  const facilities = uniqueStrings([
    educationLevel,
    educationType,
    educationLanguage,
    educationDuration ? `${educationDuration} yıl` : "",
    scholarship,
    occupancy,
  ]);

  return {
    id: `atlas-${atlasCode}`,
    universityName,
    programName,
    city,
    ranking: rankingValue,
    generalScore: calculateGeneralScore(rankingValue, baseScore),
    status: "Kararsız",
    facilities,
    notes: "YÖK Atlas güncel tercih kılavuzu API verisinden çekildi.",
    preferenceOrder: 0,
    professors: [],
    atlasCode,
    atlasUrl: `${YOK_ATLAS_BASE_URL}/tercih-sihirbazi.php`,
    scholarship: scholarship || undefined,
    lastAtlasSyncAt: fetchedAt,
    universityType: universityType || undefined,
    facultyName: facultyName || undefined,
    district: district || undefined,
    pointType: pointType || undefined,
    baseScore,
    quota,
    atlasYear: year,
    academicHierarchy: academicHierarchy || undefined,
    rankingHistory,
    educationLevel,
    educationType: educationType || undefined,
    educationLanguage: educationLanguage || undefined,
    educationDuration,
    occupancy,
    placed,
    previousRanking: previous?.ranking,
    previousBaseScore: previous?.baseScore,
    academicStaffSummary,
    createdAt: fetchedAt,
    updatedAt: fetchedAt,
  };
}

function mapRankingHistory(
  value: Record<string, unknown>,
  currentYear: number,
): RankingHistoryItem[] {
  return [0, 1, 2, 3].flatMap((offset): RankingHistoryItem[] => {
    const suffix = offset === 0 ? "" : String(offset);
    const ranking = positiveInteger(
      pick(value, `basariSirasi${suffix}`, `basari_sirasi_${suffix}`),
    );
    if (!ranking) return [];
    const baseScore = positiveNumber(
      pick(value, `minPuan${suffix}`, `min_puan_${suffix}`),
    );
    return [
      {
        year: currentYear - offset,
        ranking,
        ...(baseScore !== undefined ? { baseScore } : {}),
      },
    ];
  });
}

function mapAcademicStaff(
  value: Record<string, unknown>,
): AcademicStaffSummary | undefined {
  const professor = nonNegativeInteger(pick(value, "prof")) ?? 0;
  const associateProfessor = nonNegativeInteger(pick(value, "doc")) ?? 0;
  const doctorFacultyMember = nonNegativeInteger(pick(value, "dou")) ?? 0;
  const lecturer = nonNegativeInteger(pick(value, "ogrGor", "ogr_gor")) ?? 0;
  const researchAssistant = nonNegativeInteger(pick(value, "arGor", "ar_gor")) ?? 0;
  const total =
    professor +
    associateProfessor +
    doctorFacultyMember +
    lecturer +
    researchAssistant;

  return total > 0
    ? {
        professor,
        associateProfessor,
        doctorFacultyMember,
        lecturer,
        researchAssistant,
        total,
      }
    : undefined;
}

function dedupePrograms(programs: CatalogProgram[]): CatalogProgram[] {
  const byCode = new Map<string, CatalogProgram>();
  programs.forEach((program) => {
    const key = program.atlasCode ?? program.id;
    const existing = byCode.get(key);
    if (!existing || dataCompleteness(program) > dataCompleteness(existing)) {
      byCode.set(key, program);
    }
  });
  return [...byCode.values()].sort(
    (a, b) =>
      a.programName.localeCompare(b.programName, "tr") ||
      a.universityName.localeCompare(b.universityName, "tr"),
  );
}

function dataCompleteness(program: CatalogProgram): number {
  return [
    program.city !== "—",
    Boolean(program.universityType),
    Boolean(program.scholarship),
    Boolean(program.educationType),
    Boolean(program.educationLanguage),
    Boolean(program.baseScore),
    program.ranking < Number.MAX_SAFE_INTEGER,
    Boolean(program.quota),
    Boolean(program.academicStaffSummary),
  ].filter(Boolean).length;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (response.status >= 500 && attempt + 1 < attempts) {
          await response.body?.cancel().catch(() => undefined);
          await delay(300 * (attempt + 1));
          continue;
        }
        return response;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await delay(300 * (attempt + 1));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("YÖK Atlas isteği başarısız oldu.");
}

function atlasHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.7",
    Origin: YOK_ATLAS_BASE_URL,
    Referer: `${YOK_ATLAS_BASE_URL}/`,
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  };
}

function readRequestBody(request: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 500_000) reject(new Error("İstek gövdesi çok büyük."));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function pick(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).replace(/\s+/g, " ").trim()
    : "";
}

function asInteger(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : Number.parseInt(asText(value), 10);
  return Number.isFinite(number) ? Math.round(number) : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  const number = asInteger(value);
  return number !== undefined && number > 0 ? number : undefined;
}

function nonNegativeInteger(value: unknown): number | undefined {
  const number = asInteger(value);
  return number !== undefined && number >= 0 ? number : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : undefined;
  }
  const text = asText(value).replace(/[^\d,.-]/g, "");
  if (!text) return undefined;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function normalizeLevel(value: string): CatalogLevel {
  return value.toLocaleUpperCase("tr-TR").includes("ÖN") ||
    value.toLocaleUpperCase("tr-TR").includes("ONLISANS")
    ? "Önlisans"
    : "Lisans";
}

function normalizePointType(value: string): string {
  const upper = value.toLocaleUpperCase("tr-TR");
  if (upper === "SOZ") return "SÖZ";
  if (upper === "DIL") return "DİL";
  return upper;
}

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("tr-TR"));
}

function getOccupancy(quota?: number, placed?: number): string | undefined {
  if (quota === undefined || placed === undefined) return undefined;
  if (quota === 0) return "Kontenjan yok";
  return placed >= quota ? "Doldu" : "Dolmadı";
}

function calculateGeneralScore(ranking: number, baseScore?: number): number {
  if (baseScore && baseScore > 0) {
    return Math.max(1, Math.min(100, Math.round((baseScore / 560) * 100)));
  }
  if (ranking === Number.MAX_SAFE_INTEGER) return 50;
  if (ranking <= 20_000) return 95;
  if (ranking <= 50_000) return 88;
  if (ranking <= 100_000) return 80;
  if (ranking <= 200_000) return 70;
  if (ranking <= 300_000) return 62;
  if (ranking <= 500_000) return 54;
  return 45;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default defineConfig({
  plugins: [react(), yokAtlasProxy()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
