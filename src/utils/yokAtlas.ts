import type {
  Professor,
  ProfessorProfile,
  UniversityProgram,
} from "../types/university";
import { createId } from "./storage";

export type AtlasOptionKind =
  | "universite-programlar"
  | "universite-iller"
  | "universiteler";

export interface AtlasOption {
  id: string;
  label: string;
  value: string;
}

export interface YokAtlasSearchFilters {
  query?: string;
  city?: string;
  university?: string;
  program?: string;
  pointType?: string;
  universityType?: string;
  minRanking?: string;
  maxRanking?: string;
}

const SEARCH_ENDPOINT = "/local-yok-atlas/search";
const OPTION_ENDPOINT = "/local-yok-atlas/options";
const ACADEMIC_ENDPOINT = "/local-yok-akademik";
const ACADEMIC_PAGE_ENDPOINT = "/local-yok-akademik-page";

export function formatCurrency(value?: number | string | null): string {
  const numericValue = typeof value === "string" ? parseNumber(value) : value;

  if (
    typeof numericValue !== "number" ||
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    return "—";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export async function fetchYokAtlasOptions(
  kind: AtlasOptionKind,
): Promise<AtlasOption[]> {
  const response = await fetch(`${OPTION_ENDPOINT}/${kind}`);

  if (!response.ok) {
    throw new Error(`YÖK Atlas seçenekleri alınamadı: ${response.status}`);
  }

  const raw = await response.json();
  return uniqueOptions(extractRows(raw).map(toAtlasOption));
}

export async function searchYokAtlas(
  filters: YokAtlasSearchFilters,
): Promise<UniversityProgram[]> {
  const payloads = createAtlasPayloads(filters);
  let lastError: Error | null = null;

  for (const payload of payloads) {
    try {
      const response = await fetch(SEARCH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        lastError = new Error(`YÖK Atlas araması başarısız: ${response.status}`);
        continue;
      }

      const json = await response.json();
      const mapped = extractRows(json)
        .map(mapAtlasProgram)
        .filter((item): item is UniversityProgram => item !== null);
      const deduped = dedupeUniversities(mapped);

      if (deduped.length > 0 || payload === payloads[payloads.length - 1]) {
        return deduped.filter((program) => matchesClientFilters(program, filters));
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("YÖK Atlas araması sırasında bilinmeyen hata oluştu.");
    }
  }

  throw lastError ?? new Error("YÖK Atlas araması sonuç döndürmedi.");
}

export async function fetchYokAcademicStaff(
  academicLink: string,
): Promise<Professor[]> {
  if (!academicLink.trim()) return [];

  const response = await fetch(
    `${ACADEMIC_ENDPOINT}?akademikLink=${encodeURIComponent(academicLink)}`,
  );

  if (!response.ok) {
    throw new Error(`YÖK Akademik kadro alınamadı: ${response.status}`);
  }

  return parseAcademicStaff(await response.text());
}

export async function fetchYokAcademicProfile(
  profileUrl: string,
  seedUrl?: string,
): Promise<ProfessorProfile> {
  const query = new URLSearchParams({ url: profileUrl });
  if (seedUrl) query.set("seedUrl", seedUrl);

  const response = await fetch(`${ACADEMIC_PAGE_ENDPOINT}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`YÖK Akademik özgeçmiş alınamadı: ${response.status}`);
  }

  return parseProfessorProfile(await response.text(), profileUrl);
}

function createAtlasPayloads(filters: YokAtlasSearchFilters): Record<string, unknown>[] {
  const query = cleanText(filters.query);
  const program = cleanText(filters.program);
  const university = cleanText(filters.university);
  const city = cleanText(filters.city);
  const pointType = cleanText(filters.pointType);
  const universityType = cleanText(filters.universityType);
  const keyword = [query, program, university, city].filter(Boolean).join(" ");

  return [
    {
      search: keyword,
      q: keyword,
      program,
      universite: university,
      sehir: city,
      puan_turu: pointType,
      universite_turu: universityType,
      page: 1,
      limit: 100,
    },
    {
      keyword,
      program_adi: program || query,
      universite_adi: university,
      sehir_adi: city,
      puan_turu: pointType,
      universite_turu: universityType,
      sayfa: 1,
      adet: 100,
    },
    {
      arama: keyword,
      bolum: program || query,
      universite: university,
      il: city,
      puanTuru: pointType,
      tur: universityType,
    },
  ];
}

function mapAtlasProgram(value: unknown): UniversityProgram | null {
  if (!isRecord(value)) return null;

  const universityName = pickString(value, [
    "universityName",
    "universiteAdi",
    "universite_adi",
    "universite",
    "universiteAd",
    "univ_adi",
    "uadi",
    "name",
  ]);
  const programName = pickString(value, [
    "programName",
    "programAdi",
    "program_adi",
    "bolum",
    "bolumAdi",
    "program",
    "padi",
  ]);
  const city = pickString(value, ["city", "il", "sehir", "sehirAdi", "ilAdi", "cityName"]);
  const atlasCode = pickString(value, [
    "atlasCode",
    "programKodu",
    "program_kodu",
    "yopKodu",
    "yop_kodu",
    "kod",
    "code",
    "id",
  ]);
  const pointType = pickString(value, ["pointType", "puanTuru", "puan_turu", "puan"]);
  const universityType = pickString(value, ["universityType", "universiteTuru", "universite_turu", "tur", "type"]);
  const facultyName = pickString(value, ["facultyName", "fakulte", "fakulteAdi", "fakulte_adi"]);
  const scholarship = pickString(value, ["scholarship", "burs", "bursDurumu", "ucretBurs", "burs_orani"]);
  const academicLink = pickString(value, [
    "academicStaffUrl",
    "akademikLink",
    "akademik_link",
    "akademikKadro",
    "akademik_kadro",
    "akademik",
    "yokAkademikLink",
  ]);
  const rawAtlasUrl = pickString(value, ["atlasUrl", "url", "link", "programUrl", "program_url"]);
  const ranking = parseNumber(
    pickValue(value, [
      "ranking",
      "basariSirasi",
      "basari_sirasi",
      "minBasariSirasi",
      "min_basari_sirasi",
      "siralama",
      "enKucukBasariSirasi",
      "bs",
    ]),
  );
  const baseScore = parseNumber(
    pickValue(value, ["baseScore", "tabanPuan", "taban_puan", "minPuan", "min_puan", "puan"]),
  );
  const quota = parseNumber(
    pickValue(value, ["quota", "kontenjan", "genelKontenjan", "kontenjan_sayi"]),
  );
  const tuitionFee = parseNumber(
    pickValue(value, ["tuitionFee", "ucret", "egitimUcreti", "egitim_ucreti"]),
  );

  if (!universityName || !programName) return null;

  const now = new Date().toISOString();
  const normalizedRanking = ranking && ranking > 0 ? Math.round(ranking) : Number.MAX_SAFE_INTEGER;
  const stableId = slugify(atlasCode || `${universityName}-${programName}-${city}-${pointType}`);

  return {
    id: `atlas-${stableId}`,
    universityName,
    programName,
    city: city || "—",
    ranking: normalizedRanking,
    generalScore: calculateGeneralScore(normalizedRanking, baseScore),
    status: "Kararsız",
    facilities: parseFacilities(value),
    notes: "YÖK Atlas canlı arama sonucundan çekildi.",
    preferenceOrder: 0,
    professors: [],
    atlasCode: atlasCode || undefined,
    atlasUrl: normalizeAtlasUrl(rawAtlasUrl, atlasCode),
    academicStaffUrl: academicLink || undefined,
    scholarship: scholarship || undefined,
    tuitionFee: tuitionFee || undefined,
    baseScore: baseScore || undefined,
    quota: quota ? Math.round(quota) : undefined,
    pointType: pointType || undefined,
    universityType: universityType || undefined,
    facultyName: facultyName || undefined,
    atlasYear: new Date().getFullYear(),
    rankingHistory: [],
    lastAtlasSyncAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function parseAcademicStaff(html: string): Professor[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const rows = [...document.querySelectorAll("tbody tr, tr")];
  return dedupeProfessors(
    rows.map(parseProfessorRow).filter((professor): professor is Professor => professor !== null),
  );
}

function parseProfessorRow(row: Element): Professor | null {
  const text = cleanText(row.textContent);
  if (!text || text.length < 6) return null;

  const link =
    row.querySelector<HTMLAnchorElement>("a[href*='/AkademikArama/']") ??
    row.querySelector<HTMLAnchorElement>("a[href]");
  const title = extractTitle(text);
  const name = normalizeProfessorName(cleanText(link?.textContent) || text, title);

  if (!name || name.length < 5) return null;

  return {
    id: createId("prof"),
    name,
    title,
    field: extractAcademicField(text),
    score: 5,
    note: "YÖK Akademik canlı kadro bilgisinden çekildi.",
    profileUrl: link?.getAttribute("href")
      ? toAbsoluteAcademicUrl(link.getAttribute("href") ?? "")
      : undefined,
  };
}

function parseProfessorProfile(html: string, sourceUrl: string): ProfessorProfile {
  const document = new DOMParser().parseFromString(html, "text/html");
  const blocks = [...document.querySelectorAll("li, td, p, div.panel-body, div.well")]
    .map((item) => cleanText(item.textContent))
    .filter((text) => text.length > 12);

  return {
    sourceUrl,
    lastUpdated: new Date().toISOString(),
    education: pickProfileTexts(blocks, ["eğitim", "lisans", "yüksek lisans", "doktora"]),
    academicDuties: pickProfileTexts(blocks, ["akademik görev", "öğretim", "araştırma görevlisi", "profesör", "doçent"]),
    projects: pickProfileTexts(blocks, ["proje", "tübitak", "bap"]),
    articles: pickProfileTexts(blocks, ["makale", "article", "dergi"]),
    books: pickProfileTexts(blocks, ["kitap", "book"]),
    proceedings: pickProfileTexts(blocks, ["bildiri", "kongre", "sempozyum"]),
    externalExperience: pickProfileTexts(blocks, ["deneyim", "iş deneyimi", "kurum dışı"]),
    administrativeDuties: pickProfileTexts(blocks, ["idari görev", "bölüm başkanı", "dekan", "müdür"]),
    awards: pickProfileTexts(blocks, ["ödül", "award"]),
    patents: pickProfileTexts(blocks, ["patent"]),
    memberships: pickProfileTexts(blocks, ["üyelik", "member"]),
    theses: pickProfileTexts(blocks, ["tez", "thesis"]),
    courses: pickProfileTexts(blocks, ["ders", "course"]),
  };
}

function pickProfileTexts(texts: string[], keywords: string[]): string[] {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLocaleLowerCase("tr-TR"));
  return uniqueStrings(
    texts.filter((text) => {
      const normalized = text.toLocaleLowerCase("tr-TR");
      return normalizedKeywords.some((keyword) => normalized.includes(keyword));
    }),
  ).slice(0, 12);
}

function extractRows(value: unknown, depth = 0): unknown[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  for (const key of ["data", "results", "items", "rows", "programs", "programlar", "tercihler", "list", "content"]) {
    const rows = extractRows(value[key], depth + 1);
    if (rows.length > 0) return rows;
  }

  for (const nested of Object.values(value)) {
    const rows = extractRows(nested, depth + 1);
    if (rows.length > 0 && rows.some(isRecord)) return rows;
  }

  return [];
}

function toAtlasOption(value: unknown): AtlasOption | null {
  if (typeof value === "string" || typeof value === "number") {
    const label = cleanText(String(value));
    return label ? { id: slugify(label), label, value: label } : null;
  }
  if (!isRecord(value)) return null;

  const label = pickString(value, ["label", "text", "name", "ad", "adi", "title", "value", "programAdi", "universiteAdi", "ilAdi"]);
  const id = pickString(value, ["id", "kod", "code", "value"]) || label;
  return label ? { id: slugify(id), label, value: label } : null;
}

function uniqueOptions(options: (AtlasOption | null)[]): AtlasOption[] {
  const seen = new Set<string>();
  return options
    .filter((option): option is AtlasOption => option !== null)
    .filter((option) => {
      const key = option.label.toLocaleLowerCase("tr-TR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

function dedupeUniversities(items: UniversityProgram[]): UniversityProgram[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.atlasCode ?? ""}|${item.universityName}|${item.programName}|${item.city}`.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeProfessors(items: Professor[]): Professor[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesClientFilters(program: UniversityProgram, filters: YokAtlasSearchFilters): boolean {
  const query = cleanText(filters.query).toLocaleLowerCase("tr-TR");
  const minRanking = parseNumber(filters.minRanking);
  const maxRanking = parseNumber(filters.maxRanking);
  const haystack = [program.universityName, program.programName, program.city, program.facultyName ?? "", program.pointType ?? "", program.universityType ?? ""]
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  if (query && !haystack.includes(query)) return false;
  if (filters.city && !program.city.toLocaleLowerCase("tr-TR").includes(filters.city.toLocaleLowerCase("tr-TR"))) return false;
  if (filters.university && !program.universityName.toLocaleLowerCase("tr-TR").includes(filters.university.toLocaleLowerCase("tr-TR"))) return false;
  if (filters.program && !program.programName.toLocaleLowerCase("tr-TR").includes(filters.program.toLocaleLowerCase("tr-TR"))) return false;
  if (filters.pointType && !(program.pointType ?? "").toLocaleLowerCase("tr-TR").includes(filters.pointType.toLocaleLowerCase("tr-TR"))) return false;
  if (filters.universityType && !(program.universityType ?? "").toLocaleLowerCase("tr-TR").includes(filters.universityType.toLocaleLowerCase("tr-TR"))) return false;
  if (minRanking && program.ranking < minRanking) return false;
  if (maxRanking && program.ranking > maxRanking) return false;
  return true;
}

function parseFacilities(value: Record<string, unknown>): string[] {
  return uniqueStrings([
    pickString(value, ["ogretimDili", "ogretim_dili", "language"]),
    pickString(value, ["egitimSuresi", "egitim_suresi", "sure"]),
    pickString(value, ["burs", "bursDurumu", "scholarship"]),
    pickString(value, ["programTuru", "program_turu"]),
  ]);
}

function pickString(value: Record<string, unknown>, keys: string[]): string {
  const picked = pickValue(value, keys);
  if (typeof picked === "string" || typeof picked === "number") return cleanText(String(picked));
  return "";
}

function pickValue(value: Record<string, unknown>, keys: string[]): unknown {
  const lowered = new Map(Object.entries(value).map(([key, inner]) => [key.toLocaleLowerCase("tr-TR"), inner]));
  for (const key of keys) {
    const exact = value[key];
    if (exact !== undefined && exact !== null && exact !== "") return exact;
    const loose = lowered.get(key.toLocaleLowerCase("tr-TR"));
    if (loose !== undefined && loose !== null && loose !== "") return loose;
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function calculateGeneralScore(ranking: number, baseScore?: number): number {
  if (baseScore && baseScore > 0) return Math.max(1, Math.min(100, Math.round((baseScore / 560) * 100)));
  if (ranking === Number.MAX_SAFE_INTEGER) return 50;
  if (ranking <= 20_000) return 95;
  if (ranking <= 50_000) return 88;
  if (ranking <= 100_000) return 80;
  if (ranking <= 200_000) return 70;
  if (ranking <= 300_000) return 62;
  if (ranking <= 500_000) return 54;
  return 45;
}

function normalizeAtlasUrl(url: string, atlasCode: string): string | undefined {
  if (url) return url.startsWith("http") ? url : new URL(url, "https://yokatlas.yok.gov.tr").toString();
  if (atlasCode) return `https://yokatlas.yok.gov.tr/lisans.php?y=${encodeURIComponent(atlasCode)}`;
  return undefined;
}

function toAbsoluteAcademicUrl(url: string): string {
  return url.startsWith("http") ? url : new URL(url, "https://akademik.yok.gov.tr").toString();
}

function extractTitle(text: string): string {
  const match = text.match(/(Prof\.?\s*Dr\.?|Doç\.?\s*Dr\.?|Dr\.?\s*Öğr\.?\s*Üyesi|Öğr\.?\s*Gör\.?|Arş\.?\s*Gör\.?|Dr\.?)/i);
  return cleanText(match?.[0]);
}

function normalizeProfessorName(text: string, title: string): string {
  const cleaned = cleanText(title ? text.replace(title, "") : text)
    .replace(/\b(YÖK Akademik|Profil|Detay|Akademik)\b/gi, "")
    .trim();
  const parts = cleaned.split(/\s+/).filter((part) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(part));
  return parts.slice(0, Math.min(parts.length, 4)).join(" ");
}

function extractAcademicField(text: string): string {
  const known = ["Bilgisayar", "Yazılım", "Elektrik", "Elektronik", "Makine", "İnşaat", "Endüstri", "Mekatronik", "Matematik", "Fizik", "Kimya", "Mimarlık"];
  return known.find((item) => text.toLocaleLowerCase("tr-TR").includes(item.toLocaleLowerCase("tr-TR"))) ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : "";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function slugify(value: string): string {
  return cleanText(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || createId("atlas");
}
