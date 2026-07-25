import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  type LucideIcon,
  Award,
  Banknote,
  BookOpenText,
  Building2,
  Database,
  ExternalLink,
  Filter,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCcw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../contexts/ToastContext";
import { useUniversities } from "../contexts/UniversityContext";
import type { Professor, ProfessorProfile, UniversityProgram } from "../types/university";
import {
  calculateAverageProfessorScore,
  calculateRecommendationScore,
  formatProfessorScore,
  formatRanking,
  hasKnownRanking,
} from "../utils/scoring";
import {
  fetchYokAcademicProfile,
  fetchYokAcademicStaff,
  fetchYokAtlasOptions,
  formatCurrency,
  searchYokAtlas,
  type AtlasOption,
  type YokAtlasSearchFilters,
} from "../utils/yokAtlas";

type SortKey = "ranking" | "recommendation" | "score" | "name";

type LiveFilters = YokAtlasSearchFilters & {
  onlyWithAcademicLink: boolean;
  onlyWithProfile: boolean;
  sort: SortKey;
};

const DEFAULT_FILTERS: LiveFilters = {
  query: "",
  city: "",
  university: "",
  program: "",
  pointType: "",
  universityType: "",
  minRanking: "",
  maxRanking: "",
  onlyWithAcademicLink: false,
  onlyWithProfile: false,
  sort: "ranking",
};

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3.5 py-2.5 text-xs font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-pilot-400/50 focus:ring-2 focus:ring-pilot-500/10";

const profileSections: {
  key: keyof Omit<ProfessorProfile, "sourceUrl" | "lastUpdated">;
  title: string;
}[] = [
  { key: "education", title: "Eğitim" },
  { key: "academicDuties", title: "Akademik görevler" },
  { key: "projects", title: "Projeler" },
  { key: "articles", title: "Makaleler" },
  { key: "proceedings", title: "Bildiriler" },
  { key: "books", title: "Kitaplar" },
  { key: "theses", title: "Tezler" },
  { key: "courses", title: "Dersler" },
  { key: "awards", title: "Ödüller" },
  { key: "patents", title: "Patentler" },
  { key: "administrativeDuties", title: "İdari görevler" },
  { key: "externalExperience", title: "Kurum dışı deneyim" },
  { key: "memberships", title: "Üyelikler" },
];

export function Universities() {
  const { universities, replaceUniversities } = useUniversities();
  const { notify } = useToast();
  const [filters, setFilters] = useState<LiveFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<UniversityProgram[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState<{
    programs: AtlasOption[];
    cities: AtlasOption[];
    universities: AtlasOption[];
  }>({ programs: [], cities: [], universities: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingStaffId, setLoadingStaffId] = useState<string | null>(null);
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [profileTarget, setProfileTarget] = useState<{
    university: UniversityProgram;
    professor: Professor;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [programs, cities, universities] = await Promise.all([
          fetchYokAtlasOptions("universite-programlar"),
          fetchYokAtlasOptions("universite-iller"),
          fetchYokAtlasOptions("universiteler"),
        ]);

        if (!cancelled) setOptions({ programs, cities, universities });
      } catch (error) {
        if (!cancelled) {
          notify(
            error instanceof Error
              ? error.message
              : "YÖK Atlas filtre seçenekleri alınamadı.",
            "error",
          );
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const storedKeys = useMemo(
    () => new Set(universities.map(getProgramKey)),
    [universities],
  );

  const visible = useMemo(
    () =>
      results
        .filter((program) => matchesFilters(program, filters))
        .sort((a, b) => sortPrograms(a, b, filters.sort)),
    [filters, results],
  );

  const selected =
    visible.find((program) => program.id === selectedId) ?? visible[0] ?? null;

  const runSearch = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setLoadingSearch(true);
    try {
      const livePrograms = await searchYokAtlas(filters);
      setResults(livePrograms);
      setSelectedId(livePrograms[0]?.id ?? null);
      setLastSyncAt(new Date().toISOString());
      notify(
        livePrograms.length
          ? `${livePrograms.length} program YÖK Atlas'tan anlık çekildi.`
          : "YÖK Atlas araması sonuç döndürmedi.",
        livePrograms.length ? "success" : "info",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "YÖK Atlas araması başarısız.",
        "error",
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  const storeProgram = (program: UniversityProgram, addToPreference = false) => {
    const existing = universities.find(
      (item) => getProgramKey(item) === getProgramKey(program),
    );
    const nextPreferenceOrder =
      universities.reduce((highest, item) => Math.max(highest, item.preferenceOrder), 0) + 1;
    const now = new Date().toISOString();
    const storedProgram: UniversityProgram = {
      ...program,
      id: existing?.id ?? program.id,
      status: existing?.status ?? program.status,
      notes: existing?.notes ?? program.notes,
      professors: program.professors.length ? program.professors : existing?.professors ?? [],
      preferenceOrder: addToPreference
        ? existing?.preferenceOrder || nextPreferenceOrder
        : existing?.preferenceOrder ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    replaceUniversities(
      existing
        ? universities.map((item) => (item.id === existing.id ? storedProgram : item))
        : [...universities, storedProgram],
      addToPreference
        ? "YÖK Atlas kaydı tercih listesine eklendi."
        : "YÖK Atlas kaydı tercih havuzuna alındı.",
    );
  };

  const replaceResult = (program: UniversityProgram) => {
    setResults((current) => current.map((item) => (item.id === program.id ? program : item)));
  };

  const loadStaff = async (program: UniversityProgram) => {
    const academicLink = program.academicStaffUrl ?? program.atlasCode ?? "";
    if (!academicLink) {
      notify("Bu YÖK Atlas sonucunda akademik kadro bağlantısı yok.", "error");
      return;
    }

    setLoadingStaffId(program.id);
    try {
      const professors = await fetchYokAcademicStaff(academicLink);
      const nextProgram = {
        ...program,
        professors,
        updatedAt: new Date().toISOString(),
      };
      replaceResult(nextProgram);
      setSelectedId(program.id);
      if (storedKeys.has(getProgramKey(program))) storeProgram(nextProgram);
      notify(
        professors.length
          ? `${professors.length} hoca YÖK Akademik'ten çekildi.`
          : "Akademik kadro bağlantısı veri döndürmedi.",
        professors.length ? "success" : "info",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "YÖK Akademik kadro bilgisi alınamadı.",
        "error",
      );
    } finally {
      setLoadingStaffId(null);
    }
  };

  const openProfile = async (program: UniversityProgram, professor: Professor) => {
    setProfileTarget({ university: program, professor });
    if (!professor.profileUrl || professor.profile) return;

    setLoadingProfileId(professor.id);
    try {
      const profile = await fetchYokAcademicProfile(
        professor.profileUrl,
        program.academicStaffUrl,
      );
      const nextProgram = {
        ...program,
        professors: program.professors.map((item) =>
          item.id === professor.id
            ? { ...item, profile, profileFetchedAt: new Date().toISOString() }
            : item,
        ),
        updatedAt: new Date().toISOString(),
      };
      replaceResult(nextProgram);
      const nextProfessor =
        nextProgram.professors.find((item) => item.id === professor.id) ?? professor;
      setProfileTarget({ university: nextProgram, professor: nextProfessor });
      if (storedKeys.has(getProgramKey(program))) storeProgram(nextProgram);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Hoca özgeçmişi alınamadı.",
        "error",
      );
    } finally {
      setLoadingProfileId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-pilot-400/[0.15] bg-gradient-to-br from-blue-600/[0.11] via-white/[0.035] to-violet-600/[0.08] p-5 shadow-glow sm:p-7">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
              YÖK Atlas canlı arama
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Programları anlık çek ve filtrele
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Ana veri kaynağı artık YÖK Atlas proxy. Elle kayıt akışı kaldırıldı;
              sonuçlar canlı çekilir, filtrelenir ve yalnızca seçtiklerin tercih havuzuna alınır.
            </p>
          </div>
          <button
            type="button"
            onClick={() => runSearch()}
            disabled={loadingSearch}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pilot-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSearch ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            YÖK Atlas'tan Çek
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Metric icon={Database} label="Canlı sonuç" value={`${visible.length}/${results.length}`} />
        <Metric icon={UsersRound} label="YÖK Akademik hoca" value={`${visible.reduce((sum, item) => sum + item.professors.length, 0)}`} />
        <Metric icon={Star} label="Tercih havuzu" value={`${universities.length}`} />
        <Metric
          icon={Filter}
          label="Son çekim"
          value={lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "—"}
        />
      </section>

      <form onSubmit={runSearch} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-panel sm:p-5">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-pilot-300" />
              <h3 className="text-sm font-extrabold text-white">YÖK Atlas filtreleri</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Filtreler canlı arama kriteri olarak gönderilir; gelen sonuçlar ayrıca ekranda filtrelenir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!isFiltered(filters)}
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-2.5 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-4" />
              Filtreleri Temizle
            </button>
            <button
              type="submit"
              disabled={loadingSearch}
              className="inline-flex items-center gap-2 rounded-xl bg-pilot-500 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-pilot-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSearch ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Canlı Ara
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)_160px_160px]">
          <TextBox label="Genel arama" value={filters.query ?? ""} onChange={(query) => setFilters((current) => ({ ...current, query }))} placeholder="Üniversite, bölüm veya şehir" />
          <TextBox label="Üniversite" value={filters.university ?? ""} onChange={(university) => setFilters((current) => ({ ...current, university }))} placeholder="Üniversite seç / yaz" listId="atlas-universities" />
          <TextBox label="Program" value={filters.program ?? ""} onChange={(program) => setFilters((current) => ({ ...current, program }))} placeholder="Program seç / yaz" listId="atlas-programs" />
          <TextBox label="Şehir" value={filters.city ?? ""} onChange={(city) => setFilters((current) => ({ ...current, city }))} placeholder="İl seç / yaz" listId="atlas-cities" />
          <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
            Sıralama
            <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as SortKey }))} className={`${inputClass} mt-2`}>
              <option value="ranking">Başarı sırası</option>
              <option value="recommendation">Öneri puanı</option>
              <option value="score">Taban puan</option>
              <option value="name">Üniversite adı</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <TextBox label="Puan türü" value={filters.pointType ?? ""} onChange={(pointType) => setFilters((current) => ({ ...current, pointType }))} placeholder="SAY, EA, SÖZ, DİL" />
          <TextBox label="Üniversite türü" value={filters.universityType ?? ""} onChange={(universityType) => setFilters((current) => ({ ...current, universityType }))} placeholder="Devlet / Vakıf" />
          <NumberBox label="Min. başarı sırası" value={filters.minRanking ?? ""} onChange={(minRanking) => setFilters((current) => ({ ...current, minRanking }))} />
          <NumberBox label="Maks. başarı sırası" value={filters.maxRanking ?? ""} onChange={(maxRanking) => setFilters((current) => ({ ...current, maxRanking }))} />
          <div className="grid gap-2 pt-5">
            <Toggle label="Akademik kadro linki olanlar" checked={filters.onlyWithAcademicLink} onChange={(onlyWithAcademicLink) => setFilters((current) => ({ ...current, onlyWithAcademicLink }))} />
            <Toggle label="Özgeçmişi çekilmiş hocalar" checked={filters.onlyWithProfile} onChange={(onlyWithProfile) => setFilters((current) => ({ ...current, onlyWithProfile }))} />
          </div>
        </div>

        <datalist id="atlas-universities">{options.universities.map((option) => <option key={option.id} value={option.value} />)}</datalist>
        <datalist id="atlas-programs">{options.programs.map((option) => <option key={option.id} value={option.value} />)}</datalist>
        <datalist id="atlas-cities">{options.cities.map((option) => <option key={option.id} value={option.value} />)}</datalist>
        {loadingOptions && <p className="mt-3 text-xs font-semibold text-slate-600">YÖK Atlas filtre seçenekleri yükleniyor...</p>}
      </form>

      {results.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Henüz YÖK Atlas verisi çekilmedi"
          description="Üniversite, program veya şehir filtresi girip Canlı Ara butonuna bas. Sonuçlar YÖK Atlas proxy üzerinden anlık alınacak."
          actionLabel="YÖK Atlas'tan Çek"
          onAction={() => runSearch()}
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="space-y-3">
            {visible.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                selected={selected?.id === program.id}
                stored={storedKeys.has(getProgramKey(program))}
                loadingStaff={loadingStaffId === program.id}
                onSelect={() => setSelectedId(program.id)}
                onStore={() => storeProgram(program)}
                onPreference={() => storeProgram(program, true)}
                onLoadStaff={() => loadStaff(program)}
              />
            ))}
            {visible.length === 0 && <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-sm font-semibold text-slate-500">Canlı sonuç geldi ama aktif filtrelere uyan kayıt yok.</div>}
          </div>

          <aside className="xl:sticky xl:top-5 xl:self-start">
            {selected ? (
              <ProgramDetail
                program={selected}
                stored={storedKeys.has(getProgramKey(selected))}
                loadingStaff={loadingStaffId === selected.id}
                loadingProfileId={loadingProfileId}
                onStore={() => storeProgram(selected)}
                onPreference={() => storeProgram(selected, true)}
                onLoadStaff={() => loadStaff(selected)}
                onOpenProfile={(professor) => openProfile(selected, professor)}
              />
            ) : (
              <EmptyState icon={Filter} title="Sonuç seçilmedi" description="Detayları görmek için canlı sonuçlardan bir kayıt seç." />
            )}
          </aside>
        </section>
      )}

      {profileTarget && (
        <ProfessorProfileModal university={profileTarget.university} professor={profileTarget.professor} loading={loadingProfileId === profileTarget.professor.id} onClose={() => setProfileTarget(null)} />
      )}
    </div>
  );
}

function ProgramCard({ program, selected, stored, loadingStaff, onSelect, onStore, onPreference, onLoadStaff }: {
  program: UniversityProgram;
  selected: boolean;
  stored: boolean;
  loadingStaff: boolean;
  onSelect: () => void;
  onStore: () => void;
  onPreference: () => void;
  onLoadStaff: () => void;
}) {
  return (
    <article className={`rounded-3xl border p-4 transition ${selected ? "border-pilot-400/30 bg-pilot-500/[0.07] shadow-glow" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]"}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pilot-300">{program.city} · {program.pointType ?? "Puan türü yok"}</p>
            <h3 className="mt-2 text-base font-black leading-5 text-white">{program.universityName}</h3>
            <p className="mt-1 text-sm font-bold leading-5 text-slate-300">{program.programName}</p>
          </div>
          <StatusBadge status={program.status} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Başarı sırası" value={formatRanking(program.ranking)} />
          <MiniStat label="Taban puan" value={program.baseScore ? program.baseScore.toFixed(2) : "—"} />
          <MiniStat label="Öneri" value={`${calculateRecommendationScore(program)}/100`} />
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={onStore} disabled={stored}>{stored ? "Havuzda" : "Havuza Al"}</ActionButton>
        <ActionButton onClick={onPreference}>Tercihe Ekle</ActionButton>
        <ActionButton onClick={onLoadStaff} disabled={loadingStaff}>{loadingStaff ? "Kadro çekiliyor" : "Akademik Kadro"}</ActionButton>
      </div>
    </article>
  );
}

function ProgramDetail({ program, stored, loadingStaff, loadingProfileId, onStore, onPreference, onLoadStaff, onOpenProfile }: {
  program: UniversityProgram;
  stored: boolean;
  loadingStaff: boolean;
  loadingProfileId: string | null;
  onStore: () => void;
  onPreference: () => void;
  onLoadStaff: () => void;
  onOpenProfile: (professor: Professor) => void;
}) {
  const professorScore = calculateAverageProfessorScore(program.professors);
  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-panel">
      <div className="border-b border-white/[0.07] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pilot-300">YÖK Atlas detayı</p>
        <h3 className="mt-2 text-xl font-black leading-7 text-white">{program.universityName}</h3>
        <p className="mt-1 text-sm font-bold leading-5 text-slate-300">{program.programName}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton onClick={onStore} disabled={stored}>{stored ? "Tercih havuzunda" : "Tercih havuzuna al"}</ActionButton>
          <ActionButton onClick={onPreference}>Tercih listesine ekle</ActionButton>
          {program.atlasUrl && <a href={program.atlasUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07]"><ExternalLink className="size-3.5" />Atlas</a>}
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <DetailItem icon={MapPin} label="Şehir" value={program.city} />
        <DetailItem icon={Building2} label="Üniversite türü" value={program.universityType ?? "—"} />
        <DetailItem icon={BookOpenText} label="Fakülte" value={program.facultyName ?? "—"} />
        <DetailItem icon={Award} label="Başarı sırası" value={formatRanking(program.ranking)} />
        <DetailItem icon={Star} label="Taban puan" value={program.baseScore ? program.baseScore.toFixed(2) : "—"} />
        <DetailItem icon={Banknote} label="Ücret" value={formatCurrency(program.tuitionFee)} />
        <DetailItem icon={GraduationCap} label="Hoca ortalaması" value={`${formatProfessorScore(professorScore)}${professorScore ? "/10" : ""}`} />
        <DetailItem icon={UsersRound} label="Hoca sayısı" value={`${program.professors.length}`} />
      </div>
      <div className="border-t border-white/[0.07] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-white">Akademik kadro</h4>
            <p className="mt-1 text-xs text-slate-600">Kadro ve özgeçmişler YÖK Akademik proxy üzerinden canlı çekilir.</p>
          </div>
          <ActionButton onClick={onLoadStaff} disabled={loadingStaff}>{loadingStaff ? "Çekiliyor" : "Kadroyu Çek"}</ActionButton>
        </div>
        <div className="mt-4 space-y-2">
          {program.professors.length ? program.professors.map((professor) => (
            <button key={professor.id} type="button" onClick={() => onOpenProfile(professor)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-ink-950/30 p-3 text-left transition hover:border-pilot-400/25 hover:bg-pilot-500/[0.05]">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">{[professor.title, professor.name].filter(Boolean).join(" ")}</p>
                <p className="mt-1 text-xs text-slate-600">{professor.field || professor.note || "YÖK Akademik kaydı"}</p>
              </div>
              {loadingProfileId === professor.id ? <Loader2 className="size-4 shrink-0 animate-spin text-pilot-300" /> : <UserRound className="size-4 shrink-0 text-slate-600" />}
            </button>
          )) : <p className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-sm text-slate-600">Henüz kadro çekilmedi. “Kadroyu Çek” butonunu kullan.</p>}
        </div>
      </div>
    </section>
  );
}

function ProfessorProfileModal({ university, professor, loading, onClose }: { university: UniversityProgram; professor: Professor; loading: boolean; onClose: () => void }) {
  const profile = professor.profile;
  const filled = profile ? profileSections.filter((section) => profile[section.key].length > 0) : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.1] bg-ink-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-pilot-300">YÖK Akademik özgeçmiş</p>
            <h3 className="mt-2 text-xl font-black text-white">{[professor.title, professor.name].filter(Boolean).join(" ")}</h3>
            <p className="mt-1 text-xs text-slate-500">{university.universityName} · {university.programName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-slate-400 transition hover:text-white" aria-label="Özgeçmiş penceresini kapat"><X className="size-4" /></button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          {loading && <div className="mb-4 flex items-center gap-2 rounded-2xl border border-pilot-400/20 bg-pilot-500/[0.07] p-4 text-sm font-bold text-pilot-200"><Loader2 className="size-4 animate-spin" />Özgeçmiş YÖK Akademik'ten çekiliyor...</div>}
          {!profile && !loading && <div className="rounded-2xl border border-dashed border-white/[0.08] p-5 text-sm leading-6 text-slate-500">Bu hocanın profil bağlantısı bulunamadı veya YÖK Akademik sayfası ayrıştırılamadı.</div>}
          {profile && <><div className="grid gap-3 sm:grid-cols-3"><MiniStat label="Bölüm sayısı" value={`${filled.length}`} /><MiniStat label="Toplam kayıt" value={`${filled.reduce((sum, section) => sum + profile[section.key].length, 0)}`} /><MiniStat label="Son çekim" value={profile.lastUpdated ? new Date(profile.lastUpdated).toLocaleDateString("tr-TR") : "—"} /></div><div className="mt-5 space-y-4">{filled.length ? filled.map((section) => <ProfileSection key={section.key} title={section.title} items={profile[section.key]} />) : <p className="rounded-2xl border border-dashed border-white/[0.08] p-5 text-sm text-slate-500">Profil sayfası çekildi fakat özgeçmiş bölümleri otomatik ayrıştırılamadı.</p>}</div>{profile.sourceUrl && <a href={profile.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07]"><ExternalLink className="size-3.5" />Kaynak profili aç</a>}</>}
        </div>
      </section>
    </div>
  );
}

function TextBox({ label, value, onChange, placeholder, listId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; listId?: string }) {
  return <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}<span className="relative mt-2 block"><input value={value} list={listId} onChange={(event) => onChange(event.target.value)} className={inputClass} placeholder={placeholder} />{value && <button type="button" onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 transition hover:text-white" aria-label={`${label} alanını temizle`}><X className="size-3.5" /></button>}</span></label>;
}

function NumberBox({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}<input value={value} inputMode="numeric" onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))} className={`${inputClass} mt-2`} placeholder="Örn. 250000" /></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-ink-950/35 px-3 py-2 text-xs font-bold text-slate-400">{label}<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-blue-500" /></label>;
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"><Icon className="size-4 text-pilot-300" /><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-ink-950/35 p-3"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>;
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-ink-950/35 p-4"><Icon className="size-4 text-slate-600" /><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>;
}

function ActionButton({ children, onClick, disabled = false }: { children: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45">{children}</button>;
}

function ProfileSection({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><h4 className="text-sm font-black text-white">{title}</h4><ul className="mt-3 space-y-2">{items.map((item, index) => <li key={`${title}-${index}`} className="text-sm leading-6 text-slate-400">{item}</li>)}</ul></section>;
}

function matchesFilters(program: UniversityProgram, filters: LiveFilters): boolean {
  const query = normalize(filters.query);
  const minRanking = toNumber(filters.minRanking);
  const maxRanking = toNumber(filters.maxRanking);
  const haystack = [program.universityName, program.programName, program.city, program.facultyName ?? "", program.pointType ?? "", program.universityType ?? "", program.facilities.join(" "), program.professors.map((professor) => professor.name).join(" ")].join(" ").toLocaleLowerCase("tr-TR");
  if (query && !haystack.includes(query)) return false;
  if (filters.city && !normalize(program.city).includes(normalize(filters.city))) return false;
  if (filters.university && !normalize(program.universityName).includes(normalize(filters.university))) return false;
  if (filters.program && !normalize(program.programName).includes(normalize(filters.program))) return false;
  if (filters.pointType && !normalize(program.pointType ?? "").includes(normalize(filters.pointType))) return false;
  if (filters.universityType && !normalize(program.universityType ?? "").includes(normalize(filters.universityType))) return false;
  if (minRanking && hasKnownRanking(program.ranking) && program.ranking < minRanking) return false;
  if (maxRanking && hasKnownRanking(program.ranking) && program.ranking > maxRanking) return false;
  if (filters.onlyWithAcademicLink && !program.academicStaffUrl) return false;
  if (filters.onlyWithProfile && !program.professors.some((professor) => professor.profile)) return false;
  return true;
}

function sortPrograms(a: UniversityProgram, b: UniversityProgram, sort: SortKey): number {
  if (sort === "name") return a.universityName.localeCompare(b.universityName, "tr") || a.programName.localeCompare(b.programName, "tr");
  if (sort === "score") return (b.baseScore ?? 0) - (a.baseScore ?? 0);
  if (sort === "recommendation") return calculateRecommendationScore(b) - calculateRecommendationScore(a);
  const rankingA = hasKnownRanking(a.ranking) ? a.ranking : Number.MAX_SAFE_INTEGER;
  const rankingB = hasKnownRanking(b.ranking) ? b.ranking : Number.MAX_SAFE_INTEGER;
  return rankingA - rankingB;
}

function isFiltered(filters: LiveFilters): boolean {
  return JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
}

function getProgramKey(program: UniversityProgram): string {
  return [program.atlasCode ?? "", program.universityName, program.programName, program.city, program.pointType ?? ""].join("|").toLocaleLowerCase("tr-TR");
}

function normalize(value?: string): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function toNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
