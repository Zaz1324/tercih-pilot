import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleHelp,
  Compass,
  GraduationCap,
  ListOrdered,
  MapPin,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { useUniversities } from "../contexts/UniversityContext";
import { createDemoUniversities } from "../data/demoData";
import type { PageKey, UniversityStatus } from "../types/university";
import {
  calculateAverageProfessorScore,
  calculateRecommendationScore,
  formatRanking,
  getMostCommonCity,
} from "../utils/scoring";

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
}

const focusStatuses: {
  status: UniversityStatus;
  icon: typeof CheckCircle2;
  color: string;
  bar: string;
}[] = [
  {
    status: "Kesin",
    icon: CheckCircle2,
    color: "text-emerald-300 bg-emerald-500/10",
    bar: "bg-emerald-400",
  },
  {
    status: "Kararsız",
    icon: CircleHelp,
    color: "text-amber-300 bg-amber-500/10",
    bar: "bg-amber-400",
  },
  {
    status: "Elendi",
    icon: XCircle,
    color: "text-rose-300 bg-rose-500/10",
    bar: "bg-rose-400",
  },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const { universities, replaceUniversities } = useUniversities();
  const highestRated = [...universities].sort(
    (a, b) => b.generalScore - a.generalScore,
  )[0];
  const professorScores = universities.flatMap((university) =>
    university.professors.map((professor) => professor.score),
  );
  const averageProfessorScore =
    professorScores.length > 0
      ? professorScores.reduce((sum, score) => sum + score, 0) /
        professorScores.length
      : 0;
  const topCity = getMostCommonCity(universities);
  const topRecommendations = [...universities]
    .sort(
      (a, b) =>
        calculateRecommendationScore(b) - calculateRecommendationScore(a),
    )
    .slice(0, 5);
  const preferenceCount = universities.filter(
    (university) => university.preferenceOrder > 0,
  ).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-pilot-400/[0.15] bg-gradient-to-br from-blue-600/[0.13] via-white/[0.035] to-violet-600/[0.08] p-6 shadow-glow sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pilot-400/20 bg-pilot-500/[0.08] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-pilot-300">
              <Compass className="size-3.5" />
              Tercih rotan
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Kararlarını veriye dayandır.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Aday programlarını tek yerde değerlendir, akademik kadroyu
              puanla ve sana en uygun tercih sırasını adım adım oluştur.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("universities")}
              className="inline-flex items-center gap-2 rounded-xl bg-pilot-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400"
            >
              <Building2 className="size-4" />
              Üniversiteleri Yönet
            </button>
            {universities.length === 0 && (
              <button
                type="button"
                onClick={() =>
                  replaceUniversities(
                    createDemoUniversities(),
                    "Demo veriler yüklendi.",
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-slate-200 transition hover:bg-white/10"
              >
                <Sparkles className="size-4" />
                Demo Veri Yükle
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam Kayıt"
          value={universities.length}
          helper={`${preferenceCount} tanesi tercih listende`}
          icon={Building2}
          accent="blue"
        />
        <StatCard
          label="En Yüksek Puan"
          value={highestRated ? `${highestRated.generalScore}/100` : "—"}
          helper={highestRated?.universityName ?? "Henüz kayıt yok"}
          icon={Trophy}
          accent="violet"
        />
        <StatCard
          label="Profesör Ortalaması"
          value={
            averageProfessorScore
              ? `${averageProfessorScore.toLocaleString("tr-TR", {
                  maximumFractionDigits: 1,
                })}/10`
              : "—"
          }
          helper={`${professorScores.length} akademisyen puanlandı`}
          icon={GraduationCap}
          accent="cyan"
        />
        <StatCard
          label="Öne Çıkan Şehir"
          value={topCity?.city ?? "—"}
          helper={
            topCity
              ? `${topCity.count} program bu şehirde`
              : "Henüz şehir verisi yok"
          }
          icon={MapPin}
          accent="emerald"
        />
      </section>

      {universities.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Rotanı oluşturmak için ilk kaydı ekle"
          description="Üniversite ve program adaylarını ekledikçe istatistikler, öneri puanları ve karşılaştırmalar burada şekillenecek."
          actionLabel="Yeni Üniversite Ekle"
          onAction={() => onNavigate("universities")}
        />
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <article className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-panel">
            <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  İlk 5 önerilen tercih
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Genel puan, akademik kadro ve imkânlara göre
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("compare")}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-pilot-300 transition hover:text-white"
              >
                Karşılaştır
                <ArrowUpRight className="size-3.5" />
              </button>
            </header>

            <div className="divide-y divide-white/[0.055]">
              {topRecommendations.map((university, index) => {
                const recommendation =
                  calculateRecommendationScore(university);
                const professorAverage = calculateAverageProfessorScore(
                  university.professors,
                );

                return (
                  <div
                    key={university.id}
                    className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[42px_minmax(0,1fr)_110px_78px] sm:px-6"
                  >
                    <span
                      className={`flex size-8 items-center justify-center rounded-xl text-xs font-black ${
                        index === 0
                          ? "bg-amber-400/[0.12] text-amber-300 ring-1 ring-amber-400/20"
                          : "bg-white/[0.04] text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-slate-200">
                          {university.universityName}
                        </p>
                        <div className="hidden sm:block">
                          <StatusBadge status={university.status} />
                        </div>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {university.programName} · {university.city} ·{" "}
                        {formatRanking(university.ranking)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[9px] font-bold uppercase text-slate-600">
                        Akademik ort.
                      </p>
                      <p className="mt-1 text-xs font-extrabold text-slate-300">
                        {professorAverage
                          ? professorAverage.toLocaleString("tr-TR", {
                              maximumFractionDigits: 1,
                            })
                          : "—"}
                        {professorAverage ? "/10" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">
                        {recommendation}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-pilot-300">
                        Öneri
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-panel sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Karar dağılımı
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Kritik durumların özeti
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.04] text-slate-500">
                <ListOrdered className="size-4" />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {focusStatuses.map((item) => {
                const Icon = item.icon;
                const count = universities.filter(
                  (university) => university.status === item.status,
                ).length;
                const percentage = Math.round(
                  (count / universities.length) * 100,
                );

                return (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-7 items-center justify-center rounded-lg ${item.color}`}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-200">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${item.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigate("preferences")}
              className="mt-7 flex w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-ink-950/[0.35] px-4 py-3.5 text-left transition hover:border-pilot-400/20 hover:bg-pilot-500/[0.05]"
            >
              <div>
                <p className="text-xs font-extrabold text-slate-300">
                  Tercih sıralaman
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  {preferenceCount} kayıt sıralandı
                </p>
              </div>
              <ArrowUpRight className="size-4 text-pilot-300" />
            </button>
          </article>
        </section>
      )}
    </div>
  );
}
