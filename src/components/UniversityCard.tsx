import {
  ArrowRight,
  Banknote,
  BookOpenText,
  GraduationCap,
  ListPlus,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import type { UniversityProgram } from "../types/university";
import {
  calculateAverageProfessorScore,
  calculateRecommendationScore,
  formatProfessorScore,
  formatRanking,
} from "../utils/scoring";
import { formatCurrency } from "../utils/yokAtlas";
import { StatusBadge } from "./StatusBadge";

interface UniversityCardProps {
  university: UniversityProgram;
  saved?: boolean;
  onDelete: (university: UniversityProgram) => void;
  onDetail: (university: UniversityProgram) => void;
  onEdit: (university: UniversityProgram) => void;
  onAddToPreferences: (university: UniversityProgram) => void;
  onSave?: (university: UniversityProgram) => void;
}

export function UniversityCard({
  university,
  saved = true,
  onDelete,
  onDetail,
  onEdit,
  onAddToPreferences,
  onSave,
}: UniversityCardProps) {
  const professorAverage = calculateAverageProfessorScore(
    university.professors,
  );
  const recommendation = calculateRecommendationScore(university);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-panel transition duration-200 hover:-translate-y-0.5 hover:border-pilot-400/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pilot-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={university.status} />
              {university.preferenceOrder > 0 && (
                <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-extrabold text-slate-400">
                  Listede #{university.preferenceOrder}
                </span>
              )}
            </div>
            <h3 className="line-clamp-2 text-base font-black leading-6 text-white">
              {university.universityName}
            </h3>
            <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-pilot-300">
              {university.programName}
            </p>
            {(university.scholarship ||
              typeof university.tuitionFee === "number") && (
              <p className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-amber-400/[0.14] bg-amber-500/[0.06] px-2 py-1 text-[10px] font-bold text-amber-200">
                <Banknote className="size-3 shrink-0" />
                <span className="truncate">
                  {[university.scholarship, formatCurrency(university.tuitionFee)]
                    .filter((item) => item && item !== "—")
                    .join(" · ")}
                </span>
              </p>
            )}
            {university.universityType && (
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                {university.universityType}
                {university.pointType ? ` · ${university.pointType}` : ""}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="flex size-14 flex-col items-center justify-center rounded-2xl border border-pilot-400/[0.15] bg-pilot-500/[0.07]">
              <strong className="text-xl font-black leading-none text-white">
                {recommendation}
              </strong>
              <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-pilot-300">
                Öneri
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-ink-950/[0.45] px-3 py-2.5">
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin className="size-3" />
              <span className="text-[9px] font-bold uppercase">Şehir</span>
            </div>
            <p className="mt-1 truncate text-xs font-extrabold text-slate-300">
              {university.city}
            </p>
          </div>
          <div className="rounded-xl bg-ink-950/[0.45] px-3 py-2.5">
            <div className="flex items-center gap-1 text-slate-600">
              <BookOpenText className="size-3" />
              <span className="text-[9px] font-bold uppercase">Sıralama</span>
            </div>
            <p className="mt-1 truncate text-xs font-extrabold text-slate-300">
              {formatRanking(university.ranking)}
            </p>
          </div>
          <div className="rounded-xl bg-ink-950/[0.45] px-3 py-2.5">
            <div className="flex items-center gap-1 text-slate-600">
              <GraduationCap className="size-3" />
              <span className="text-[9px] font-bold uppercase">Akademik</span>
            </div>
            <p className="mt-1 truncate text-xs font-extrabold text-slate-300">
              {formatProfessorScore(professorAverage)}
              {professorAverage > 0 ? "/10" : ""}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold">
            <span className="uppercase tracking-wider text-slate-600">
              Genel tercih puanı
            </span>
            <span className="text-slate-300">{university.generalScore}/100</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
              style={{ width: `${university.generalScore}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
          {university.facilities.slice(0, 4).map((facility) => (
            <span
              key={facility}
              className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10px] font-bold text-slate-500"
            >
              {facility}
            </span>
          ))}
          {university.facilities.length > 4 && (
            <span className="rounded-lg px-1.5 py-1 text-[10px] font-bold text-slate-600">
              +{university.facilities.length - 4}
            </span>
          )}
          {university.facilities.length === 0 && (
            <span className="text-[10px] italic text-slate-700">
              İmkân etiketi eklenmedi
            </span>
          )}
        </div>
      </div>

      <footer className="flex items-center gap-1 border-t border-white/[0.06] bg-ink-950/25 px-3 py-3">
        <button
          type="button"
          onClick={() => onDetail(university)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-extrabold text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          Detay
          <ArrowRight className="size-3.5" />
        </button>
        {!saved && (
          <button
            type="button"
            onClick={() => onSave?.(university)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-extrabold text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-300"
            aria-label="Kaydı listeye kaydet"
            title="Kaydı listeye kaydet"
          >
            <ListPlus className="size-4" />
            <span className="hidden sm:inline">Kaydet</span>
          </button>
        )}
        {saved && university.preferenceOrder === 0 && (
          <button
            type="button"
            onClick={() => onAddToPreferences(university)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-extrabold text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"
            aria-label="Tercih listesine ekle"
            title="Tercih listesine ekle"
          >
            <ListPlus className="size-4" />
            <span className="hidden sm:inline">Listeye Ekle</span>
          </button>
        )}
        {saved && (
          <>
            <button
              type="button"
              onClick={() => onEdit(university)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-amber-500/10 hover:text-amber-300"
              aria-label="Düzenle"
              title="Düzenle"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(university)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
              aria-label="Sil"
              title="Sil"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </footer>
    </article>
  );
}
