import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  Database,
  Filter,
  RefreshCcw,
  Search,
  Star,
} from "lucide-react";
import { AtlasFiltersPanel } from "../components/AtlasFiltersPanel";
import {
  AtlasLoadingState,
  AtlasMetric,
  AtlasProgramCard,
  AtlasProgramDetail,
} from "../components/AtlasProgramViews";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../contexts/ToastContext";
import { useUniversities } from "../contexts/UniversityContext";
import type { UniversityProgram } from "../types/university";
import {
  buildAtlasFilterOptions,
  buildAtlasSearchIndex,
  countActiveAtlasFilters,
  DEFAULT_ATLAS_FILTERS,
  filterAtlasPrograms,
  getAtlasProgramKey,
  type AtlasFilters,
} from "../utils/atlasFilters";
import { fetchYokAtlasCatalog } from "../utils/yokAtlas";

const RESULT_STEP = 100;

export function Universities() {
  const { universities, replaceUniversities } = useUniversities();
  const { notify } = useToast();
  const [catalog, setCatalog] = useState<UniversityProgram[]>([]);
  const [filters, setFilters] = useState<AtlasFilters>(DEFAULT_ATLAS_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultLimit, setResultLimit] = useState(RESULT_STEP);
  const deferredQuery = useDeferredValue(filters.query);

  const loadCatalog = useCallback(
    async (force = false, signal?: AbortSignal) => {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);

      try {
        const response = await fetchYokAtlasCatalog({ force, signal });
        setCatalog(response.programs);
        setFetchedAt(response.fetchedAt);
        setWarnings(response.warnings);
        setSelectedId((current) =>
          current && response.programs.some((program) => program.id === current)
            ? current
            : response.programs[0]?.id ?? null,
        );
      } catch (loadError) {
        if (signal?.aborted) return;
        const message =
          loadError instanceof Error
            ? loadError.message
            : "YÖK Atlas verileri alınamadı.";
        setError(message);
        notify(message, "error");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadCatalog(false, controller.signal);
    return () => controller.abort();
  }, [loadCatalog]);

  useEffect(() => {
    setResultLimit(RESULT_STEP);
  }, [filters]);

  const options = useMemo(() => buildAtlasFilterOptions(catalog), [catalog]);
  const searchIndex = useMemo(() => buildAtlasSearchIndex(catalog), [catalog]);
  const filtered = useMemo(
    () => filterAtlasPrograms(catalog, filters, deferredQuery, searchIndex),
    [catalog, deferredQuery, filters, searchIndex],
  );
  const visible = filtered.slice(0, resultLimit);
  const selected =
    filtered.find((program) => program.id === selectedId) ?? filtered[0] ?? null;
  const storedKeys = useMemo(
    () => new Set(universities.map(getAtlasProgramKey)),
    [universities],
  );
  const activeFilterCount = countActiveAtlasFilters(filters);

  const storeProgram = useCallback(
    (program: UniversityProgram, addToPreference = false) => {
      const key = getAtlasProgramKey(program);
      const existing = universities.find(
        (item) => getAtlasProgramKey(item) === key,
      );
      const nextPreferenceOrder =
        universities.reduce(
          (highest, item) => Math.max(highest, item.preferenceOrder),
          0,
        ) + 1;
      const now = new Date().toISOString();
      const merged: UniversityProgram = {
        ...program,
        id: existing?.id ?? program.id,
        status: existing?.status ?? "Kararsız",
        notes: existing?.notes ?? program.notes,
        professors: existing?.professors ?? program.professors,
        preferenceOrder: addToPreference
          ? existing?.preferenceOrder || nextPreferenceOrder
          : existing?.preferenceOrder ?? 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      replaceUniversities(
        existing
          ? universities.map((item) => (item.id === existing.id ? merged : item))
          : [...universities, merged],
        addToPreference
          ? "Program tercih listesine eklendi."
          : existing
            ? "Program güncel YÖK Atlas verisiyle yenilendi."
            : "Program tercih havuzuna eklendi.",
      );
    },
    [replaceUniversities, universities],
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-pilot-400/[0.15] bg-gradient-to-br from-blue-600/[0.11] via-white/[0.035] to-violet-600/[0.08] p-5 shadow-glow sm:p-7">
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
              YÖK Atlas canlı katalog
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Yazdıkça bölümü bul, filtreyi anında uygula
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Güncel katalog bir kez alınır. Sonrasında arama ve filtreler yerel
              olarak anında çalışır; her tuşta yeniden sunucu beklenmez.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadCatalog(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pilot-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Verileri Yenile
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AtlasMetric icon={Database} label="Toplam program" value={catalog.length} />
        <AtlasMetric icon={Filter} label="Eşleşen" value={filtered.length} />
        <AtlasMetric icon={Star} label="Tercih havuzu" value={universities.length} />
        <AtlasMetric
          icon={RefreshCcw}
          label="Son güncelleme"
          value={
            fetchedAt
              ? new Date(fetchedAt).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
        />
      </section>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-extrabold">Veri kısmen alındı</p>
              <p className="mt-1 text-xs leading-5 text-amber-100/70">
                {warnings.join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <AtlasFiltersPanel
        filters={filters}
        options={options}
        activeFilterCount={activeFilterCount}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_ATLAS_FILTERS)}
      />

      {loading ? (
        <AtlasLoadingState />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="YÖK Atlas verisi alınamadı"
          description={error}
          actionLabel="Tekrar Dene"
          onAction={() => void loadCatalog(true)}
        />
      ) : catalog.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Program kataloğu boş"
          description="YÖK Atlas bağlantısı veri döndürmedi. Verileri Yenile düğmesini kullan."
          actionLabel="Verileri Yenile"
          onAction={() => void loadCatalog(true)}
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-extrabold text-white">
                {filtered.length.toLocaleString("tr-TR")} sonuç
              </p>
              <p className="text-xs text-slate-600">
                İlk {Math.min(visible.length, filtered.length).toLocaleString("tr-TR")} gösteriliyor
              </p>
            </div>

            {visible.map((program) => (
              <AtlasProgramCard
                key={program.id}
                program={program}
                selected={selected?.id === program.id}
                stored={storedKeys.has(getAtlasProgramKey(program))}
                onSelect={() => setSelectedId(program.id)}
                onStore={() => storeProgram(program)}
                onPreference={() => storeProgram(program, true)}
              />
            ))}

            {visible.length === 0 && (
              <EmptyState
                icon={Search}
                title="Bu filtrelerle sonuç bulunamadı"
                description="Yazımı sadeleştir, bazı seçimleri kaldır veya başarı sırası aralığını genişlet."
              />
            )}

            {visible.length < filtered.length && (
              <button
                type="button"
                onClick={() => setResultLimit((current) => current + RESULT_STEP)}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm font-extrabold text-slate-300 transition hover:bg-white/[0.07]"
              >
                {Math.min(RESULT_STEP, filtered.length - visible.length)} sonuç daha göster
              </button>
            )}
          </div>

          <aside className="xl:sticky xl:top-5 xl:self-start">
            {selected ? (
              <AtlasProgramDetail
                program={selected}
                stored={storedKeys.has(getAtlasProgramKey(selected))}
                onStore={() => storeProgram(selected)}
                onPreference={() => storeProgram(selected, true)}
              />
            ) : (
              <EmptyState
                icon={Filter}
                title="Sonuç seçilmedi"
                description="Detayları görmek için sonuçlardan bir program seç."
              />
            )}
          </aside>
        </section>
      )}
    </div>
  );
}
