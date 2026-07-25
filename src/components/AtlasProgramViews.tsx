import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookOpenText,
  Building2,
  ExternalLink,
  GraduationCap,
  Loader2,
  MapPin,
  Star,
  UsersRound,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { AcademicStaffSummary, UniversityProgram } from "../types/university";
import { formatRanking } from "../utils/scoring";
import { formatCurrency } from "../utils/yokAtlas";

export function AtlasProgramCard({
  program,
  selected,
  stored,
  onSelect,
  onStore,
  onPreference,
}: {
  program: UniversityProgram;
  selected: boolean;
  stored: boolean;
  onSelect: () => void;
  onStore: () => void;
  onPreference: () => void;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 transition ${
        selected
          ? "border-pilot-400/30 bg-pilot-500/[0.07] shadow-glow"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pilot-300">
              {program.city} · {program.pointType ?? "Puan türü yok"} ·{" "}
              {program.educationLevel ?? "Program"}
            </p>
            <h3 className="mt-2 text-base font-black leading-5 text-white">
              {program.universityName}
            </h3>
            <p className="mt-1 text-sm font-bold leading-5 text-slate-300">
              {program.programName}
            </p>
          </div>
          <StatusBadge status={program.status} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Başarı sırası" value={formatRanking(program.ranking)} />
          <MiniStat
            label="Taban puan"
            value={program.baseScore ? program.baseScore.toFixed(3) : "—"}
          />
          <MiniStat
            label="Kontenjan"
            value={program.quota !== undefined ? `${program.quota}` : "—"}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            program.universityType,
            program.scholarship,
            program.educationType,
            program.educationLanguage,
          ]
            .filter((value): value is string => Boolean(value))
            .map((value) => (
              <Tag key={value}>{value}</Tag>
            ))}
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={onStore} disabled={stored}>
          {stored ? "Havuzda" : "Havuza Al"}
        </ActionButton>
        <PrimaryButton onClick={onPreference}>Tercihe Ekle</PrimaryButton>
      </div>
    </article>
  );
}

export function AtlasProgramDetail({
  program,
  stored,
  onStore,
  onPreference,
}: {
  program: UniversityProgram;
  stored: boolean;
  onStore: () => void;
  onPreference: () => void;
}) {
  const history = (program.rankingHistory ?? []).filter(
    (item) => item.ranking > 0,
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.035] shadow-panel">
      <header className="border-b border-white/[0.08] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pilot-300">
          {program.city} · {program.pointType ?? "—"}
        </p>
        <h3 className="mt-2 text-xl font-black leading-7 text-white">
          {program.universityName}
        </h3>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-300">
          {program.programName}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton onClick={onStore} disabled={stored}>
            {stored ? "Havuzda" : "Havuza Al"}
          </ActionButton>
          <PrimaryButton onClick={onPreference}>Tercihe Ekle</PrimaryButton>
          {program.atlasUrl && (
            <a
              href={program.atlasUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07]"
            >
              YÖK Atlas
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </header>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat
            icon={BookOpenText}
            label="Başarı sırası"
            value={formatRanking(program.ranking)}
          />
          <DetailStat
            icon={Star}
            label="Taban puan"
            value={program.baseScore ? program.baseScore.toFixed(3) : "—"}
          />
          <DetailStat
            icon={MapPin}
            label="Şehir / ilçe"
            value={[program.city, program.district].filter(Boolean).join(" / ")}
          />
          <DetailStat
            icon={Building2}
            label="Üniversite türü"
            value={program.universityType ?? "—"}
          />
          <DetailStat
            icon={GraduationCap}
            label="Öğretim"
            value={
              [
                program.educationLevel,
                program.educationType,
                program.educationLanguage,
              ]
                .filter(Boolean)
                .join(" · ") || "—"
            }
          />
          <DetailStat
            icon={Banknote}
            label="Burs / ücret"
            value={
              [program.scholarship, formatCurrency(program.tuitionFee)]
                .filter((value) => value && value !== "—")
                .join(" · ") || "—"
            }
          />
        </div>

        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
            Kontenjan ve yerleşme
          </h4>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat
              label="Kontenjan"
              value={program.quota !== undefined ? `${program.quota}` : "—"}
            />
            <MiniStat
              label="Yerleşen"
              value={program.placed !== undefined ? `${program.placed}` : "—"}
            />
            <MiniStat label="Doluluk" value={program.occupancy ?? "—"} />
          </div>
        </div>

        <AcademicStaffBlock summary={program.academicStaffSummary} />

        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
            Yıllara göre başarı sırası
          </h4>
          {history.length > 0 ? (
            <div className="mt-3 space-y-2">
              {history.map((item) => (
                <div
                  key={item.year}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-ink-950/30 px-4 py-3"
                >
                  <span className="text-xs font-black text-slate-400">
                    {item.year}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">
                      {formatRanking(item.ranking)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {item.baseScore
                        ? `${item.baseScore.toFixed(3)} puan`
                        : "Puan yok"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-white/[0.08] p-4 text-sm text-slate-600">
              Bu program için geçmiş sıralama verisi yayımlanmamış.
            </p>
          )}
        </div>

        {program.facultyName && (
          <div className="rounded-2xl border border-white/[0.07] bg-ink-950/30 p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
              Fakülte / yüksekokul
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-300">
              {program.facultyName}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function AcademicStaffBlock({ summary }: { summary?: AcademicStaffSummary }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <UsersRound className="size-4 text-pilot-300" />
        <h4 className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
          Akademik kadro özeti
        </h4>
      </div>
      {summary ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MiniStat label="Profesör" value={`${summary.professor}`} />
          <MiniStat label="Doçent" value={`${summary.associateProfessor}`} />
          <MiniStat
            label="Dr. Öğr. Üyesi"
            value={`${summary.doctorFacultyMember}`}
          />
          <MiniStat label="Öğr. Gör." value={`${summary.lecturer}`} />
          <MiniStat label="Arş. Gör." value={`${summary.researchAssistant}`} />
          <MiniStat label="Toplam" value={`${summary.total}`} />
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-white/[0.08] p-4 text-sm leading-6 text-slate-600">
          Güncel YÖK Atlas API bu program için kadro sayısı döndürmedi.
        </p>
      )}
    </div>
  );
}

export function AtlasLoadingState() {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-6 py-16 text-center">
      <Loader2 className="mx-auto size-9 animate-spin text-pilot-300" />
      <h3 className="mt-4 text-lg font-extrabold text-white">
        YÖK Atlas programları yükleniyor
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Güncel JSON kataloğu sayfalar halinde paralel alınıyor. İlk yükleme
        bittikten sonra yazdıkça filtreleme anında çalışacak.
      </p>
    </div>
  );
}

export function AtlasMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
            {label}
          </p>
          <p className="mt-1 text-lg font-black text-white">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-pilot-500/10 text-pilot-300">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-ink-950/30 p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-ink-950/35 p-4">
      <Icon className="size-4 text-slate-600" />
      <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-xl bg-pilot-500 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-pilot-400"
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: string | number }) {
  return (
    <span className="rounded-full bg-white/[0.055] px-2.5 py-1 text-[10px] font-bold text-slate-400">
      {children}
    </span>
  );
}
