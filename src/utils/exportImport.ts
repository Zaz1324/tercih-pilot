import type { UniversityProgram } from "../types/university";
import { normalizeUniversity, parseUniversityArray } from "./storage";

interface ExportPayload {
  app: "Tercih Pilot";
  version: 1;
  exportedAt: string;
  universities: UniversityProgram[];
}

export function downloadUniversityData(
  universities: UniversityProgram[],
): void {
  const payload: ExportPayload = {
    app: "Tercih Pilot",
    version: 1,
    exportedAt: new Date().toISOString(),
    universities,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `tercih-pilot-yedek-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function extractUniversities(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "universities" in value
  ) {
    return (value as { universities: unknown }).universities;
  }

  throw new Error("Dosya, Tercih Pilot verisi içermiyor.");
}

export async function readUniversityDataFile(
  file: File,
): Promise<UniversityProgram[]> {
  if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".json")) {
    throw new Error("Lütfen .json uzantılı bir yedek dosyası seç.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("JSON dosyası okunamadı veya geçerli JSON değil.");
  }

  const rawUniversities = extractUniversities(parsed);
  if (!Array.isArray(rawUniversities)) {
    throw new Error("Yedek içindeki üniversite listesi geçerli değil.");
  }

  const invalidCount = rawUniversities.filter(
    (item) => normalizeUniversity(item) === null,
  ).length;
  if (invalidCount > 0) {
    throw new Error(
      `${invalidCount} kayıt zorunlu alanları eksik olduğu için içe aktarılamadı.`,
    );
  }

  return parseUniversityArray(rawUniversities);
}
