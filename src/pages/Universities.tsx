import { type FormEvent, useMemo, useState } from "react";
import {
  type LucideIcon,
  BookOpen,
  Building2,
  ExternalLink,
  Filter,
  GraduationCap,
  Link2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { useUniversities } from "../contexts/UniversityContext";
import { useToast } from "../contexts/ToastContext";
import {
  UNIVERSITY_STATUSES,
  type Professor,
  type ProfessorProfile,
  type UniversityFormValues,
  type UniversityProgram,
  type UniversityStatus,
} from "../types/university";
import { createId } from "../utils/storage";
import {
  calculateAverageProfessorScore,
  calculateRecommendationScore,
  formatProfessorScore,
  formatRanking,
  hasKnownRanking,
  UNKNOWN_RANKING,
} from "../utils/scoring";

type SortKey = "recommendation" | "score" | "ranking" | "name";

type Filters = {
  query: string;
  statuses: UniversityStatus[];
  programs: string[];
  cities: string[];
  universityTypes: string[];
  minRanking: string;
  maxRanking: string;
  onlyWithProfessors: boolean;
  onlyWithProfile: boolean;
  sort: SortKey;
};

type FormState = {
  universityName: string;
  programName: string;
  city: string;
  ranking: string;
  generalScore: string;
  status: UniversityStatus;
  facilities: string;
  notes: string;
  professors: string;
  universityType: string;
  facultyName: string;
  pointType: string;
  baseScore: string;
  quota: string;
  scholarship: string;
  tuitionFee: string;
  atlasUrl: string;
  academicStaffUrl: string;
};

const DEFAULT_FILTERS: Filters = {
  query: "",
  statuses: [],
  programs: [],
  cities: [],
  universityTypes: [],
  minRanking: "",
  maxRanking: "",
  onlyWithProfessors: false,
  onlyWithProfile: false,
  sort: "recommendation",
};

const EMPTY_FORM: FormState = {
  universityName: "",
  programName: "",
  city: "",
  ranking: "",
  generalScore: "75",
  status: "Kararsız",
  facilities: "",
  notes: "",
  professors: "",
  universityType: "",
  facultyName: "",
  pointType: "",
  baseScore: "",
  quota: "",
  scholarship: "",
  tuitionFee: "",
  atlasUrl: "",
  academicStaffUrl: "",
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
  const {
    universities,
    addUniversity,
    updateUniversity,
    deleteUniversity,
    addToPreferenceList,
  } = useUniversities();
  const { notify } = useToast();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileTarget, setProfileTarget] = useState<{
    universityId: string;
    professor: Professor;
  } | null>(null);

  const options = useMemo(
    () => ({
      programs: unique(universities.map((item) => item.programName)),
      cities: unique(universities.map((item) => item.city)),
      types: unique(
        universities.map((item) => item.universityType ?? "").filter(Boolean),
      ),
    }),
    [universities],
  );

  const visible = useMemo(
    () =>
      universities
        .filter((university) => matchesFilters(university, filters))
        .sort((a, b) => sortUniversities(a, b, filters.sort)),
    [filters, universities],
  );

  const selected =
    universities.find((university) => university.id === selectedId) ??
    visible[0] ??
    null;
  const profileUniversity = profileTarget
    ? universities.find((item) => item.id === profileTarget.universityId)
    : null;
  const profileProfessor = profileTarget
    ? profileUniversity?.professors.find(
        (professor) => professor.id === profileTarget.professor.id,
      ) ?? profileTarget.professor
    : null;
  const hasFilters = isFiltered(filters);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (university: UniversityProgram) => {
    setEditingId(university.id);
    setForm(toForm(university));
    setFormOpen(true);
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = toValues(form);
    if (!values.universityName || !values.programName || !values.city) {
      notify("Üniversite, program ve şehir alanları zorunlu.", "error");
      return;
    }

    if (editingId) {
      const old = universities.find((item) => item.id === editingId);
      updateUniversity(
        editingId,
        old ? preserveProfiles(values, old.professors) : values,
      );
    } else {
      addUniversity(values);
    }
    setFormOpen(false);
    setEditingId(null);
  };

  const remove = (university: UniversityProgram) => {
    if (
      window.confirm(
        `${university.universityName} - ${university.programName} kaydı silinsin mi?`,
      )
    ) {
      deleteUniversity(university.id);
      if (selectedId === university.id) setSelectedId(null);
    }
  };

  const saveProfessorProfile = (
    university: UniversityProgram,
    professor: Professor,
    profile: ProfessorProfile,
  ) => {
    updateUniversity(university.id, {
      ...university,
      professors: university.professors.map((item) =>
        item.id === professor.id
          ? {
              ...item,
              profile,
              profileFetchedAt: new Date().toISOString(),
              profileUrl: item.profileUrl ?? profile.sourceUrl,
            }
          : item,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-pilot-400/[0.15] bg-gradient-to-br from-blue-600/[0.11] via-white/[0.035] to-violet-600/[0.08] p-5 shadow-glow sm:p-7">
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
              Tercih havuzu
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Üniversite ve program kayıtları
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Filtreler artık sadece görünümü daraltır; temizleme işlemi kayıtları
              veya Atlas'tan çekilmiş verileri silmez. Hoca özgeçmişleri ayrı
              başlıklara ayrılmış okunabilir kartlarla gösterilir.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pilot-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400"
          >
            <Plus className="size-4" />
            Kodla / Manuel Ekle
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Filter} label="Görünen" value={`${visible.length}/${universities.length}`} />
        <Metric
          icon={UsersRound}
          label="Hoca"
          value={`${visible.reduce((sum, item) => sum + item.professors.length, 0)}`}
        />
        <Metric
          icon={Star}
          label="En iyi öneri"
          value={visible[0] ? `${calculateRecommendationScore(visible[0])}/100` : "—"}
        />
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-panel sm:p-5">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-pilot-300" />
              <h3 className="text-sm font-extrabold text-white">Filtreler</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Arama, çoklu seçim ve aralık filtreleri birlikte çalışır.
            </p>
          </div>
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-2.5 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-4" />
            Filtreleri Temizle
          </button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(260px,1.5fr)_180px_180px_180px]">
          <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
            Arama
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-700" />
              <input
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }
                className={`${inputClass} pl-10`}
                placeholder="Üniversite, bölüm, şehir, imkan veya hoca ara"
              />
            </span>
          </label>
          <NumberBox
            label="Min. sıralama"
            value={filters.minRanking}
            onChange={(value) =>
              setFilters((current) => ({ ...current, minRanking: value }))
            }
          />
          <NumberBox
            label="Maks. sıralama"
            value={filters.maxRanking}
            onChange={(value) =>
              setFilters((current) => ({ ...current, maxRanking: value }))
            }
          />
          <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
            Sıralama
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sort: event.target.value as SortKey,
                }))
              }
              className={`${inputClass} mt-2`}
            >
              <option value="recommendation">Öneri puanı</option>
              <option value="score">Genel puan</option>
              <option value="ranking">Başarı sırası</option>
              <option value="name">Üniversite adı</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-4">
          <MultiSelect
            title="Durum"
            options={[...UNIVERSITY_STATUSES]}
            selected={filters.statuses}
            onChange={(statuses) =>
              setFilters((current) => ({ ...current, statuses: statuses as UniversityStatus[] }))
            }
          />
          <MultiSelect
            title="Program"
            options={options.programs}
            selected={filters.programs}
            onChange={(programs) => setFilters((current) => ({ ...current, programs }))}
          />
          <MultiSelect
            title="Şehir"
            options={options.cities}
            selected={filters.cities}
            onChange={(cities) => setFilters((current) => ({ ...current, cities }))}
          />
          <MultiSelect
            title="Üniversite türü"
            options={options.types}
            selected={filters.universityTypes}
            emptyText="Tür verisi yok"
            onChange={(universityTypes) =>
              setFilters((current) => ({ ...current, universityTypes }))
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3 rounded-2xl border border-white/[0.08] bg-ink-950/30 p-3">
          <CheckBox
            label="Sadece hocası olanlar"
            checked={filters.onlyWithProfessors}
            onChange={(onlyWithProfessors) =>
              setFilters((current) => ({ ...current, onlyWithProfessors }))
            }
          />
          <CheckBox
            label="Sadece özgeçmişi olanlar"
            checked={filters.onlyWithProfile}
            onChange={(onlyWithProfile) =>
              setFilters((current) => ({ ...current, onlyWithProfile }))
            }
          />
        </div>
      </section>

      {universities.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Henüz üniversite kaydı yok"
          description="Manuel kayıt ekleyebilir veya dashboarddan demo verileri yükleyebilirsin."
          actionLabel="İlk Kaydı Ekle"
          onAction={openCreate}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="Filtreyle eşleşen kayıt yok"
          description="Kayıtlar silinmedi. Filtreleri temizleyerek tüm listeye dönebilirsin."
          actionLabel="Filtreleri Temizle"
          onAction={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            {visible.map((university) => (
              <ProgramCard
                key={university.id}
                university={university}
                selected={selected?.id === university.id}
                onSelect={() => setSelectedId(university.id)}
                onEdit={() => openEdit(university)}
                onDelete={() => remove(university)}
                onPreference={() => addToPreferenceList(university.id)}
              />
            ))}
          </div>

          {selected && (
            <DetailPanel
              university={selected}
              onEdit={() => openEdit(selected)}
              onProfessor={(professor) =>
                setProfileTarget({ universityId: selected.id, professor })
              }
            />
          )}
        </section>
      )}

      {formOpen && (
        <Editor
          state={form}
          editing={Boolean(editingId)}
          onChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={submitForm}
        />
      )}

      {profileUniversity && profileProfessor && (
        <ProfileModal
          professor={profileProfessor}
          university={profileUniversity}
          onClose={() => setProfileTarget(null)}
          onSave={(profile) =>
            saveProfessorProfile(profileUniversity, profileProfessor, profile)
          }
        />
      )}
    </div>
  );
}

function ProgramCard({
  university,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onPreference,
}: {
  university: UniversityProgram;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreference: () => void;
}) {
  const average = calculateAverageProfessorScore(university.professors);
  return (
    <article
      className={`rounded-3xl border bg-white/[0.03] p-4 shadow-panel transition hover:bg-white/[0.045] ${
        selected ? "border-pilot-400/35" : "border-white/[0.08]"
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <StatusBadge status={university.status} />
              {university.universityType && <Tag>{university.universityType}</Tag>}
              {university.scholarship && <Tag>{university.scholarship}</Tag>}
            </div>
            <h3 className="text-base font-black text-white">
              {university.universityName}
            </h3>
            <p className="mt-1 text-sm font-bold text-pilot-300">
              {university.programName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {[university.city, university.facultyName, university.pointType]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="grid min-w-[230px] grid-cols-3 gap-2 text-center">
            <MiniStat label="Öneri" value={`${calculateRecommendationScore(university)}`} />
            <MiniStat label="Sıra" value={formatRanking(university.ranking)} />
            <MiniStat
              label="Hoca"
              value={average ? formatProfessorScore(average) : "—"}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {university.facilities.slice(0, 8).map((facility) => (
            <Tag key={facility}>{facility}</Tag>
          ))}
          {university.professors.length > 0 && (
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-300">
              {university.professors.length} hoca
            </span>
          )}
        </div>
      </button>
      <div className="mt-4 flex flex-wrap justify-end gap-1.5 border-t border-white/[0.07] pt-3">
        {university.preferenceOrder === 0 && (
          <button type="button" onClick={onPreference} className="action-button">
            Tercihe ekle
          </button>
        )}
        <button type="button" onClick={onEdit} className="action-button">
          <Pencil className="size-3.5" /> Düzenle
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-extrabold text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <Trash2 className="size-3.5" /> Sil
        </button>
      </div>
    </article>
  );
}

function DetailPanel({
  university,
  onEdit,
  onProfessor,
}: {
  university: UniversityProgram;
  onEdit: () => void;
  onProfessor: (professor: Professor) => void;
}) {
  return (
    <aside className="h-max rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-panel xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
            Detay
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            {university.universityName}
          </h3>
          <p className="mt-1 text-sm font-bold text-pilot-300">
            {university.programName}
          </p>
        </div>
        <button type="button" onClick={onEdit} className="icon-button" aria-label="Düzenle">
          <Pencil className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <MiniStat label="Öneri" value={`${calculateRecommendationScore(university)}/100`} />
        <MiniStat label="Puan" value={`${university.generalScore}/100`} />
        <MiniStat label="Başarı sırası" value={formatRanking(university.ranking)} />
        <MiniStat
          label="Taban puan"
          value={
            typeof university.baseScore === "number"
              ? university.baseScore.toLocaleString("tr-TR", { maximumFractionDigits: 3 })
              : "—"
          }
        />
      </div>

      <div className="mt-5 space-y-2">
        <Info label="Şehir" value={university.city} />
        <Info label="Fakülte" value={university.facultyName} />
        <Info label="Puan türü" value={university.pointType} />
        <Info label="Kontenjan" value={university.quota?.toString()} />
        <Info
          label="Ücret"
          value={
            typeof university.tuitionFee === "number"
              ? `${university.tuitionFee.toLocaleString("tr-TR")} TL`
              : undefined
          }
        />
      </div>

      {university.notes && (
        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-ink-950/25 p-4">
          <h4 className="text-xs font-extrabold text-white">Not</h4>
          <p className="mt-2 text-xs leading-5 text-slate-400">{university.notes}</p>
        </div>
      )}

      <div className="mt-5">
        <h4 className="text-xs font-extrabold text-white">Akademik kadro</h4>
        {university.professors.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-white/[0.1] p-4 text-xs leading-5 text-slate-500">
            Bu kayda henüz hoca eklenmemiş.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {university.professors.map((professor) => (
              <button
                key={professor.id}
                type="button"
                onClick={() => onProfessor(professor)}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:border-pilot-400/25 hover:bg-pilot-500/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pilot-500/10 text-pilot-300 ring-1 ring-pilot-400/20">
                    <UserRound className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-white">
                      {[professor.title, professor.name].filter(Boolean).join(" ")}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {professor.field || "Alan bilgisi yok"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Tag>{`${professor.score}/10`}</Tag>
                      {professor.profile && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          Özgeçmiş var
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={university.atlasUrl} label="Atlas" />
        <LinkButton href={university.academicStaffUrl} label="Akademik kadro" />
      </div>
    </aside>
  );
}

function ProfileModal({
  professor,
  university,
  onClose,
  onSave,
}: {
  professor: Professor;
  university: UniversityProgram;
  onClose: () => void;
  onSave: (profile: ProfessorProfile) => void;
}) {
  const { notify } = useToast();
  const [rawText, setRawText] = useState("");
  const profile = professor.profile;
  const sections = profile
    ? profileSections.filter((section) => profile[section.key].length > 0)
    : [];
  const total = sections.reduce((sum, section) => sum + (profile?.[section.key].length ?? 0), 0);

  const saveRawProfile = () => {
    if (!rawText.trim()) {
      notify("Özgeçmiş metni boş.", "error");
      return;
    }
    onSave(parseProfileText(rawText, professor.profileUrl ?? profile?.sourceUrl));
    setRawText("");
    notify("Özgeçmiş düzenli bölümlere ayrıldı.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.1] bg-ink-900 shadow-panel">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
              Akademisyen özgeçmişi
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              {[professor.title, professor.name].filter(Boolean).join(" ")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {professor.field || university.programName} · {university.universityName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Kapat">
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Hoca puanı" value={`${professor.score}/10`} />
            <MiniStat label="Bölüm" value={`${sections.length}`} />
            <MiniStat label="Toplam madde" value={`${total}`} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href={professor.profileUrl} label="Profil linki" />
            <LinkButton href={profile?.sourceUrl} label="Kaynak" />
            {professor.orcid && <Tag>{`ORCID: ${professor.orcid}`}</Tag>}
          </div>

          {professor.note && (
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <h4 className="text-xs font-extrabold text-white">Kişisel not</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{professor.note}</p>
            </div>
          )}

          <div className="mt-5 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4">
            <h4 className="text-sm font-extrabold text-white">
              Özgeçmiş metni yapıştır
            </h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              YÖK Akademik veya üniversite sayfasından alınan metni buraya yapıştırınca
              eğitim, proje, makale, bildiri, kitap ve görev başlıklarına ayrılır.
            </p>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              className={`${inputClass} mt-3 min-h-28 resize-y`}
              placeholder="Özgeçmiş metnini buraya yapıştır"
            />
            <button
              type="button"
              onClick={saveRawProfile}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-pilot-500 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-pilot-400"
            >
              <GraduationCap className="size-4" />
              Özgeçmişi Düzenle
            </button>
          </div>

          {!profile || sections.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.025] p-8 text-center">
              <BookOpen className="mx-auto size-9 text-slate-600" />
              <h4 className="mt-3 text-sm font-extrabold text-white">
                Okunabilir özgeçmiş verisi yok
              </h4>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500">
                Bu alana metin eklediğinde hoca bilgileri uzun paragraf yerine
                başlıklı kartlarda gösterilir.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="h-max rounded-3xl border border-white/[0.08] bg-ink-950/35 p-4 xl:sticky xl:top-4">
                <h4 className="text-xs font-extrabold text-white">Özet</h4>
                <div className="mt-3 space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.key}
                      className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3 py-2"
                    >
                      <span className="text-xs font-bold text-slate-400">
                        {section.title}
                      </span>
                      <span className="text-xs font-black text-white">
                        {profile[section.key].length}
                      </span>
                    </div>
                  ))}
                </div>
              </aside>
              <div className="space-y-4">
                {sections.map((section) => (
                  <section
                    key={section.key}
                    className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4"
                  >
                    <h4 className="text-sm font-extrabold text-white">
                      {section.title}
                    </h4>
                    <ol className="mt-3 space-y-2">
                      {profile[section.key].map((item, index) => (
                        <li
                          key={`${section.key}-${index}`}
                          className="rounded-2xl border border-white/[0.06] bg-ink-950/30 px-4 py-3 text-sm leading-6 text-slate-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function Editor({
  state,
  editing,
  onChange,
  onClose,
  onSubmit,
}: {
  state: FormState;
  editing: boolean;
  onChange: (state: FormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const set = (key: keyof FormState, value: string) => onChange({ ...state, [key]: value });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.1] bg-ink-900 shadow-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
              {editing ? "Kaydı düzenle" : "Yeni kayıt"}
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              Üniversite / program bilgisi
            </h3>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Kapat">
            <X className="size-4" />
          </button>
        </header>
        <div className="max-h-[calc(92vh-168px)] overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Üniversite adı" value={state.universityName} onChange={(v) => set("universityName", v)} required />
            <Field label="Program" value={state.programName} onChange={(v) => set("programName", v)} required />
            <Field label="Şehir" value={state.city} onChange={(v) => set("city", v)} required />
            <Field label="Başarı sırası" type="number" value={state.ranking} onChange={(v) => set("ranking", v)} />
            <Field label="Genel puan" type="number" value={state.generalScore} onChange={(v) => set("generalScore", v)} />
            <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
              Durum
              <select value={state.status} onChange={(e) => set("status", e.target.value)} className={`${inputClass} mt-2`}>
                {UNIVERSITY_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <Field label="Üniversite türü" value={state.universityType} onChange={(v) => set("universityType", v)} />
            <Field label="Fakülte" value={state.facultyName} onChange={(v) => set("facultyName", v)} />
            <Field label="Puan türü" value={state.pointType} onChange={(v) => set("pointType", v)} />
            <Field label="Taban puan" type="number" value={state.baseScore} onChange={(v) => set("baseScore", v)} />
            <Field label="Kontenjan" type="number" value={state.quota} onChange={(v) => set("quota", v)} />
            <Field label="Burs" value={state.scholarship} onChange={(v) => set("scholarship", v)} />
            <Field label="Ücret" type="number" value={state.tuitionFee} onChange={(v) => set("tuitionFee", v)} />
            <Field label="Atlas URL" value={state.atlasUrl} onChange={(v) => set("atlasUrl", v)} />
            <Field label="Akademik kadro URL" value={state.academicStaffUrl} onChange={(v) => set("academicStaffUrl", v)} />
          </div>
          <Area label="İmkanlar" value={state.facilities} onChange={(v) => set("facilities", v)} placeholder="Kampüs, Erasmus, Teknopark" />
          <Area label="Notlar" value={state.notes} onChange={(v) => set("notes", v)} placeholder="Kişisel değerlendirme" />
          <Area
            label="Hocalar"
            value={state.professors}
            onChange={(v) => set("professors", v)}
            placeholder="Her satır: Ünvan | İsim | Alan | Puan | Not | Profil URL"
          />
        </div>
        <footer className="flex justify-end gap-2 border-t border-white/[0.08] p-4">
          <button type="button" onClick={onClose} className="action-button">Vazgeç</button>
          <button type="submit" className="rounded-xl bg-pilot-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400">
            {editing ? "Güncelle" : "Kaydet"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function MultiSelect({
  title,
  options,
  selected,
  onChange,
  emptyText = "Seçenek yok",
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const visible = options.filter((option) => norm(option).includes(norm(query)));
  const toggle = (option: string) =>
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-950/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{title}</p>
        {selected.length > 0 && <button type="button" onClick={() => onChange([])} className="text-[10px] font-extrabold text-pilot-300">Temizle</button>}
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} mt-2 py-2`} placeholder="Seçenek ara" />
      <div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-1">
        {visible.length === 0 ? <p className="rounded-xl border border-dashed border-white/[0.08] px-3 py-3 text-xs text-slate-600">{emptyText}</p> : visible.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.045]">
            <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
            <span className="min-w-0 flex-1 truncate">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function matchesFilters(university: UniversityProgram, filters: Filters) {
  const text = norm([
    university.universityName,
    university.programName,
    university.city,
    university.universityType,
    university.facultyName,
    university.notes,
    university.facilities.join(" "),
    university.professors.map((p) => [p.title, p.name, p.field, p.note].join(" ")).join(" "),
  ].filter(Boolean).join(" "));
  const min = toNumber(filters.minRanking);
  const max = toNumber(filters.maxRanking);
  return (
    (!filters.query || text.includes(norm(filters.query))) &&
    (filters.statuses.length === 0 || filters.statuses.includes(university.status)) &&
    (filters.programs.length === 0 || filters.programs.includes(university.programName)) &&
    (filters.cities.length === 0 || filters.cities.includes(university.city)) &&
    (filters.universityTypes.length === 0 || filters.universityTypes.includes(university.universityType ?? "")) &&
    (min === null || university.ranking >= min) &&
    (max === null || university.ranking <= max) &&
    (!filters.onlyWithProfessors || university.professors.length > 0) &&
    (!filters.onlyWithProfile || university.professors.some((p) => p.profile))
  );
}

function sortUniversities(a: UniversityProgram, b: UniversityProgram, sort: SortKey) {
  if (sort === "score") return b.generalScore - a.generalScore;
  if (sort === "ranking") return a.ranking - b.ranking;
  if (sort === "name") return a.universityName.localeCompare(b.universityName, "tr");
  return calculateRecommendationScore(b) - calculateRecommendationScore(a);
}

function isFiltered(filters: Filters) {
  return JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
}

function toForm(university: UniversityProgram): FormState {
  return {
    universityName: university.universityName,
    programName: university.programName,
    city: university.city,
    ranking: hasKnownRanking(university.ranking) ? String(university.ranking) : "",
    generalScore: String(university.generalScore),
    status: university.status,
    facilities: university.facilities.join(", "),
    notes: university.notes,
    professors: university.professors.map((p) => [p.title, p.name, p.field, p.score, p.note, p.profileUrl ?? ""].join(" | ")).join("\n"),
    universityType: university.universityType ?? "",
    facultyName: university.facultyName ?? "",
    pointType: university.pointType ?? "",
    baseScore: university.baseScore?.toString() ?? "",
    quota: university.quota?.toString() ?? "",
    scholarship: university.scholarship ?? "",
    tuitionFee: university.tuitionFee?.toString() ?? "",
    atlasUrl: university.atlasUrl ?? "",
    academicStaffUrl: university.academicStaffUrl ?? "",
  };
}

function toValues(state: FormState): UniversityFormValues {
  return {
    universityName: state.universityName.trim(),
    programName: state.programName.trim(),
    city: state.city.trim(),
    ranking: toNumber(state.ranking) ?? UNKNOWN_RANKING,
    generalScore: clamp(toNumber(state.generalScore) ?? 50, 1, 100),
    status: state.status,
    facilities: unique(state.facilities.split(/[,\n]/g)),
    notes: state.notes.trim(),
    professors: parseProfessors(state.professors),
    universityType: state.universityType.trim() || undefined,
    facultyName: state.facultyName.trim() || undefined,
    pointType: state.pointType.trim() || undefined,
    baseScore: toNumber(state.baseScore) ?? undefined,
    quota: toNumber(state.quota) ?? undefined,
    scholarship: state.scholarship.trim() || undefined,
    tuitionFee: toNumber(state.tuitionFee) ?? undefined,
    atlasUrl: state.atlasUrl.trim() || undefined,
    academicStaffUrl: state.academicStaffUrl.trim() || undefined,
    rankingHistory: [],
  };
}

function preserveProfiles(values: UniversityFormValues, previous: Professor[]): UniversityFormValues {
  return {
    ...values,
    professors: values.professors.map((professor) => {
      const old = previous.find((item) => norm(item.name) === norm(professor.name));
      return old ? { ...professor, id: old.id, profile: old.profile, profileFetchedAt: old.profileFetchedAt, profileUrl: professor.profileUrl ?? old.profileUrl } : professor;
    }),
  };
}

function parseProfessors(value: string): Professor[] {
  return value.split("\n").map((line): Professor | null => {
    const [title = "", name = "", field = "", score = "5", note = "", url = ""] = line.split("|").map((part) => part.trim());
    const professorName = name || title;
    if (!professorName) return null;
    const professor: Professor = {
      id: createId("prof"),
      title: name ? title : "",
      name: professorName,
      field,
      score: clamp(toNumber(score) ?? 5, 1, 10),
      note,
    };
    return url ? { ...professor, profileUrl: url } : professor;
  }).filter((item): item is Professor => item !== null);
}

function parseProfileText(text: string, sourceUrl?: string): ProfessorProfile {
  const profile = emptyProfile(sourceUrl);
  const lines = unique(text.split(/\n|•|;/g).map(clean).filter((line) => line.length > 4));
  for (const line of lines) {
    const lower = norm(line);
    if (lower.includes("eğitim") || lower.includes("lisans") || lower.includes("doktora")) profile.education.push(line);
    else if (lower.includes("proje")) profile.projects.push(line);
    else if (lower.includes("makale") || lower.includes("article")) profile.articles.push(line);
    else if (lower.includes("bildiri") || lower.includes("proceeding")) profile.proceedings.push(line);
    else if (lower.includes("kitap") || lower.includes("book")) profile.books.push(line);
    else if (lower.includes("tez")) profile.theses.push(line);
    else if (lower.includes("ders")) profile.courses.push(line);
    else if (lower.includes("ödül") || lower.includes("odul")) profile.awards.push(line);
    else if (lower.includes("patent")) profile.patents.push(line);
    else if (lower.includes("idari") || lower.includes("müdür") || lower.includes("başkan")) profile.administrativeDuties.push(line);
    else if (lower.includes("üyelik") || lower.includes("uyelik")) profile.memberships.push(line);
    else if (lower.includes("görev") || lower.includes("akademik")) profile.academicDuties.push(line);
    else if (lower.includes("deneyim") || lower.includes("çalış")) profile.externalExperience.push(line);
    else profile.academicDuties.push(line);
  }
  return profile;
}

function emptyProfile(sourceUrl?: string): ProfessorProfile {
  return { sourceUrl, lastUpdated: new Date().toLocaleDateString("tr-TR"), academicDuties: [], education: [], projects: [], articles: [], books: [], proceedings: [], externalExperience: [], administrativeDuties: [], awards: [], patents: [], memberships: [], theses: [], courses: [] };
}

function unique(values: string[]) {
  return [...new Set(values.map(clean).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
}
function norm(value: string) { return value.toLocaleLowerCase("tr-TR").trim(); }
function clean(value: string) { return value.replace(/\s+/g, " ").trim(); }
function toNumber(value: string) { if (!value.trim()) return null; const n = Number(value.replace(".", "").replace(",", ".")); return Number.isFinite(n) ? n : null; }
function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }
function Tag({ children }: { children: string | number }) { return <span className="rounded-full bg-white/[0.055] px-2.5 py-1 text-[10px] font-bold text-slate-400">{children}</span>; }
function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-panel"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div><div className="flex size-10 items-center justify-center rounded-xl bg-pilot-500/10 text-pilot-300"><Icon className="size-5" /></div></div></div>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/[0.08] bg-ink-950/30 p-3"><p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}</p><p className="mt-1 truncate text-sm font-black text-white">{value}</p></div>; }
function Info({ label, value }: { label: string; value?: string }) { return value ? <div className="flex items-center justify-between gap-3 border-b border-white/[0.055] pb-2"><span className="text-xs font-bold text-slate-600">{label}</span><span className="text-right text-xs font-extrabold text-slate-300">{value}</span></div> : null; }
function NumberBox({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}<input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-2`} /></label>; }
function CheckBox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 text-xs font-semibold text-slate-300"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }
function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "number"; required?: boolean }) { return <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}<input value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} className={`${inputClass} mt-2`} /></label>; }
function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="mt-3 block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-2 min-h-28 resize-y`} placeholder={placeholder} /></label>; }
function LinkButton({ href, label }: { href?: string; label: string }) { return href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"><Link2 className="size-3.5" />{label}<ExternalLink className="size-3.5" /></a> : null; }
