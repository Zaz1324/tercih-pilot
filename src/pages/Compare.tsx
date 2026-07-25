import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Banknote,
  BookOpenText,
  Building2,
  Check,
  CircleDot,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { useUniversities } from "../contexts/UniversityContext";
import type { PageKey } from "../types/university";
import {
  calculateAverageProfessorScore,
  calculateRecommendationScore,
  formatProfessorScore,
  formatRanking,
} from "../utils/scoring";
import { formatCurrency } from "../utils/yokAtlas";

interface CompareProps {
  onNavigate: (page: PageKey) => void;
}

export function Compare({ onNavigate }: CompareProps) {
  const { universities } = useUniversities();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const availableUniversities = universities.filter((university) =>
    [university.universityName, university.programName, university.city]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(normalizedSearch),
  );
  const selectedUniversities = selectedIds
    .map((id) => universities.find((university) => university.id === id))
    .filter(
      (university): university is NonNullable<typeof university> =>
        Boolean(university),
    );

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((current) => current.filter((item) => item !== id));
      return;
    }

    if (selectedIds.length < 4) {
      setSelectedIds((current) => [...current, id]);
    }
  };

  if (universities.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Karşılaştırılacak kayıt yok"
        description="Yan yana analiz yapabilmek için önce en az iki üniversite veya program kaydı ekle."
        actionLabel="Üniversitelere Git"
        onAction={() => onNavigate("universities")}
      />
    );
  }

  const recommendationValues = selectedUniversities.map(
    calculateRecommendationScore,
  );
  const generalScoreValues = selectedUniversities.map(
    (university) => university.generalScore,
  );
  const rankingValues = selectedUniversities.map(
    (university) => university.ranking,
  );
  const professorValues = selectedUniversities.map((university) =>
    calculateAverageProfessorScore(university.professors),
  );
  const facilityValues = selectedUniversities.map(
    (university) => university.facilities.length,
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
            Yan yana analiz
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Programları karşılaştır
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            2 ila 4 kayıt seç; öne çıkan değerleri otomatik vurgulayalım.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm">
          <span className="font-black text-white">{selectedIds.length}</span>
          <span className="text-slate-600"> / 4 seçildi</span>
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-panel sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Karşılaştırma havuzu
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Kartlara dokunarak seçim yap veya kaldır.
            </p>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-ink-950/50 py-2.5 pl-10 pr-9 text-sm text-white outline-none placeholder:text-slate-700 focus:border-pilot-400/50"
              placeholder="Kayıtlarda ara..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                aria-label="Aramayı temizle"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {availableUniversities.map((university) => {
            const isSelected = selectedIds.includes(university.id);
            const selectionDisabled = selectedIds.length >= 4 && !isSelected;

            return (
              <button
                key={university.id}
                type="button"
                onClick={() => toggleSelection(university.id)}
                disabled={selectionDisabled}
                className={`relative min-w-0 rounded-2xl border p-3.5 text-left transition ${
                  isSelected
                    ? "border-pilot-400/[0.35] bg-pilot-500/[0.09] ring-1 ring-pilot-400/[0.15]"
                    : "border-white/[0.07] bg-ink-950/30 hover:border-white/[0.15] hover:bg-white/[0.035]"
                } disabled:cursor-not-allowed disabled:opacity-[0.35]`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? "border-pilot-400 bg-pilot-500 text-white"
                        : "border-white/[0.15] text-transparent"
                    }`}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-slate-200">
                      {university.universityName}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-500">
                      {university.programName}
                    </p>
                    <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                      {university.city} · Öneri{" "}
                      {calculateRecommendationScore(university)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {availableUniversities.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-600">
            Aramana uyan kayıt bulunamadı.
          </p>
        )}
      </section>

      {selectedUniversities.length < 2 ? (
        <EmptyState
          icon={BarChart3}
          title={
            selectedUniversities.length === 0
              ? "Karşılaştırmaya iki kayıt seç"
              : "Bir kayıt daha seç"
          }
          description="Tablo, en az iki seçim yaptığında oluşacak. Dört programa kadar aynı anda karşılaştırabilirsin."
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-panel">
          <div className="overflow-x-auto">
            <div
              className="min-w-[760px]"
              style={{
                display: "grid",
                gridTemplateColumns: `180px repeat(${selectedUniversities.length}, minmax(190px, 1fr))`,
              }}
            >
              <div className="border-b border-r border-white/[0.07] bg-ink-950/[0.35] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Karşılaştırma
                </p>
                <p className="mt-2 text-sm font-extrabold text-slate-300">
                  {selectedUniversities.length} aday
                </p>
              </div>
              {selectedUniversities.map((university, index) => (
                <div
                  key={university.id}
                  className="relative border-b border-r border-white/[0.07] p-5 last:border-r-0"
                >
                  <span className="mb-3 flex size-7 items-center justify-center rounded-lg bg-pilot-500/10 text-[10px] font-black text-pilot-300">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-black leading-5 text-white">
                    {university.universityName}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-pilot-300">
                    {university.programName}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleSelection(university.id)}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-700 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label={`${university.universityName} seçimini kaldır`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}

              <ComparisonRow
                icon={MapPin}
                label="Şehir"
                values={selectedUniversities.map(
                  (university) => university.city,
                )}
              />
              <ComparisonRow
                icon={BookOpenText}
                label="Başarı sırası"
                values={rankingValues.map(formatRanking)}
                bestIndexes={getBestIndexes(rankingValues, "min")}
              />
              <ComparisonRow
                icon={Award}
                label="Genel puan"
                values={generalScoreValues.map((value) => `${value}/100`)}
                bestIndexes={getBestIndexes(generalScoreValues, "max")}
              />
              <ComparisonRow
                icon={Sparkles}
                label="Öneri puanı"
                values={recommendationValues.map((value) => `${value}/100`)}
                bestIndexes={getBestIndexes(recommendationValues, "max")}
              />
              <ComparisonRow
                icon={GraduationCap}
                label="Profesör ort."
                values={professorValues.map(
                  (value) =>
                    `${formatProfessorScore(value)}${value ? "/10" : ""}`,
                )}
                bestIndexes={
                  professorValues.some((value) => value > 0)
                    ? getBestIndexes(professorValues, "max")
                    : []
                }
              />
              <ComparisonRow
                icon={CircleDot}
                label="İmkân sayısı"
                values={facilityValues.map((value) => `${value} imkân`)}
                bestIndexes={getBestIndexes(facilityValues, "max")}
              />
              <ComparisonRow
                icon={Banknote}
                label="Burs/ücret"
                values={selectedUniversities.map((university) =>
                  [
                    university.scholarship,
                    formatCurrency(university.tuitionFee),
                  ]
                    .filter((item) => item && item !== "—")
                    .join(" · ") || "—",
                )}
              />

              <RowLabel icon={CircleDot} label="Durum" />
              {selectedUniversities.map((university) => (
                <div
                  key={`status-${university.id}`}
                  className="border-b border-r border-white/[0.055] p-4 last:border-r-0"
                >
                  <StatusBadge status={university.status} />
                </div>
              ))}

              <RowLabel icon={Sparkles} label="İmkânlar" />
              {selectedUniversities.map((university) => (
                <div
                  key={`facility-${university.id}`}
                  className="border-b border-r border-white/[0.055] p-4 last:border-r-0"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {university.facilities.length > 0 ? (
                      university.facilities.map((facility) => (
                        <span
                          key={facility}
                          className="rounded-md bg-cyan-500/[0.07] px-2 py-1 text-[9px] font-bold text-cyan-300"
                        >
                          {facility}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-700">Eklenmedi</span>
                    )}
                  </div>
                </div>
              ))}

              <RowLabel icon={BookOpenText} label="Notlar" last />
              {selectedUniversities.map((university) => (
                <div
                  key={`note-${university.id}`}
                  className="border-r border-white/[0.055] p-4 last:border-r-0"
                >
                  <p className="whitespace-pre-wrap text-xs leading-5 text-slate-500">
                    {university.notes || "Not eklenmedi."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function getBestIndexes(
  values: number[],
  mode: "min" | "max",
): number[] {
  if (values.length === 0) {
    return [];
  }
  const bestValue =
    mode === "min" ? Math.min(...values) : Math.max(...values);
  return values.flatMap((value, index) => (value === bestValue ? [index] : []));
}

interface ComparisonRowProps {
  icon: LucideIcon;
  label: string;
  values: string[];
  bestIndexes?: number[];
}

function ComparisonRow({
  icon,
  label,
  values,
  bestIndexes = [],
}: ComparisonRowProps) {
  return (
    <>
      <RowLabel icon={icon} label={label} />
      {values.map((value, index) => {
        const isBest = bestIndexes.includes(index);
        return (
          <div
            key={`${label}-${index}`}
            className={`relative border-b border-r border-white/[0.055] p-4 last:border-r-0 ${
              isBest ? "bg-emerald-400/[0.045]" : ""
            }`}
          >
            <p
              className={`text-sm font-extrabold ${
                isBest ? "text-emerald-300" : "text-slate-300"
              }`}
            >
              {value}
            </p>
            {isBest && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400/70">
                <Award className="size-3" />
                En iyi
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

function RowLabel({
  icon: Icon,
  label,
  last = false,
}: {
  icon: LucideIcon;
  label: string;
  last?: boolean;
}) {
  return (
    <div
      className={`border-r border-white/[0.07] bg-ink-950/25 p-4 ${
        last ? "" : "border-b"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-slate-600" />
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
    </div>
  );
}
