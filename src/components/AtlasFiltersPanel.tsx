import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import type {
  AtlasFilterOptions,
  AtlasFilters,
  AtlasMultiFilterKey,
  AtlasSortKey,
} from "../utils/atlasFilters";
import { rankAtlasOptions } from "../utils/atlasFilters";
import { normalizeSearchText } from "../utils/yokAtlas";

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-pilot-400/50 focus:ring-2 focus:ring-pilot-500/10";

type SuggestionGroup = {
  field: AtlasMultiFilterKey;
  caption: string;
  options: string[];
  limit: number;
};

type Props = {
  filters: AtlasFilters;
  options: AtlasFilterOptions;
  activeFilterCount: number;
  onChange: (filters: AtlasFilters) => void;
  onClear: () => void;
};

export function AtlasFiltersPanel({
  filters,
  options,
  activeFilterCount,
  onChange,
  onClear,
}: Props) {
  const patch = <K extends keyof AtlasFilters>(
    key: K,
    value: AtlasFilters[K],
  ) => onChange({ ...filters, [key]: value });

  const groups = useMemo<SuggestionGroup[]>(
    () => [
      { field: "programs", caption: "Bölüm", options: options.programs, limit: 8 },
      { field: "universities", caption: "Üniversite", options: options.universities, limit: 5 },
      { field: "cities", caption: "Şehir", options: options.cities, limit: 4 },
      { field: "pointTypes", caption: "Puan türü", options: options.pointTypes, limit: 3 },
      { field: "educationLevels", caption: "Seviye", options: options.educationLevels, limit: 2 },
      { field: "universityTypes", caption: "Üniversite türü", options: options.universityTypes, limit: 3 },
      { field: "scholarships", caption: "Burs / ücret", options: options.scholarships, limit: 4 },
      { field: "educationTypes", caption: "Öğretim türü", options: options.educationTypes, limit: 3 },
      { field: "educationLanguages", caption: "Öğretim dili", options: options.educationLanguages, limit: 3 },
      { field: "occupancies", caption: "Doluluk", options: options.occupancies, limit: 2 },
    ],
    [options],
  );

  const addSuggestedFilter = (field: AtlasMultiFilterKey, value: string) => {
    const selected = filters[field];
    onChange({
      ...filters,
      query: "",
      [field]: selected.includes(value) ? selected : [...selected, value],
    });
  };

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-panel sm:p-5">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-pilot-300" />
            <h3 className="text-sm font-extrabold text-white">Akıllı filtreler</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Yazdıkça uygun bölüm, üniversite, şehir ve diğer filtreler görünür.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-white/[0.08] bg-ink-950/35 px-3 py-2 text-xs font-bold text-slate-500">
            {activeFilterCount} aktif filtre
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={activeFilterCount === 0}
            className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tümünü Temizle
          </button>
        </div>
      </div>

      <div className="mt-4">
        <GlobalSearch
          value={filters.query}
          groups={groups}
          onChange={(query) => patch("query", query)}
          onSelect={addSuggestedFilter}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <SmartMultiSelect
          label="Bölüm / Program"
          placeholder="Örn. Mekatronik Mühendisliği"
          options={options.programs}
          selected={filters.programs}
          onChange={(value) => patch("programs", value)}
        />
        <SmartMultiSelect
          label="Üniversite"
          placeholder="Örn. Yıldız Teknik"
          options={options.universities}
          selected={filters.universities}
          onChange={(value) => patch("universities", value)}
        />
        <SmartMultiSelect
          label="Şehir"
          placeholder="Örn. İstanbul"
          options={options.cities}
          selected={filters.cities}
          onChange={(value) => patch("cities", value)}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <FilterGroup title="Puan türü">
          <QuickChips
            options={options.pointTypes}
            selected={filters.pointTypes}
            onChange={(value) => patch("pointTypes", value)}
          />
        </FilterGroup>
        <FilterGroup title="Program seviyesi">
          <QuickChips
            options={options.educationLevels}
            selected={filters.educationLevels}
            onChange={(value) => patch("educationLevels", value)}
          />
        </FilterGroup>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <SmartMultiSelect
          label="Üniversite türü"
          placeholder="Devlet / Vakıf"
          options={options.universityTypes}
          selected={filters.universityTypes}
          onChange={(value) => patch("universityTypes", value)}
        />
        <SmartMultiSelect
          label="Burs / Ücret"
          placeholder="Burslu, ücretli, indirimli"
          options={options.scholarships}
          selected={filters.scholarships}
          onChange={(value) => patch("scholarships", value)}
        />
        <SmartMultiSelect
          label="Öğretim türü"
          placeholder="Örgün, ikinci öğretim..."
          options={options.educationTypes}
          selected={filters.educationTypes}
          onChange={(value) => patch("educationTypes", value)}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <SmartMultiSelect
          label="Öğretim dili"
          placeholder="Türkçe, İngilizce..."
          options={options.educationLanguages}
          selected={filters.educationLanguages}
          onChange={(value) => patch("educationLanguages", value)}
        />
        <SmartMultiSelect
          label="Doluluk"
          placeholder="Doldu / Dolmadı"
          options={options.occupancies}
          selected={filters.occupancies}
          onChange={(value) => patch("occupancies", value)}
        />
        <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
          Sonuç sıralaması
          <select
            value={filters.sort}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              patch("sort", event.target.value as AtlasSortKey)
            }
            className={`${inputClass} mt-2`}
          >
            <option value="ranking">Başarı sırası: en iyi</option>
            <option value="score">Taban puan: yüksek</option>
            <option value="previousRanking">Geçmiş sıra: en iyi</option>
            <option value="name">Bölüm adına göre</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <NumberFilter label="Min. başarı sırası" value={filters.minRanking} placeholder="Örn. 10000" onChange={(value) => patch("minRanking", value)} />
        <NumberFilter label="Maks. başarı sırası" value={filters.maxRanking} placeholder="Örn. 300000" onChange={(value) => patch("maxRanking", value)} />
        <NumberFilter label="Min. taban puan" value={filters.minScore} placeholder="Örn. 250" allowDecimal onChange={(value) => patch("minScore", value)} />
        <NumberFilter label="Maks. taban puan" value={filters.maxScore} placeholder="Örn. 500" allowDecimal onChange={(value) => patch("maxScore", value)} />
        <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-white/[0.08] bg-ink-950/35 px-3.5 py-3 text-xs font-bold text-slate-400">
          Sırası bilinenler
          <input
            type="checkbox"
            checked={filters.onlyKnownRanking}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              patch("onlyKnownRanking", event.target.checked)
            }
            className="size-4 accent-blue-500"
          />
        </label>
      </div>
    </section>
  );
}

function GlobalSearch({
  value,
  groups,
  onChange,
  onSelect,
}: {
  value: string;
  groups: SuggestionGroup[];
  onChange: (value: string) => void;
  onSelect: (field: AtlasMultiFilterKey, value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const normalized = normalizeSearchText(value);
  const suggestions = useMemo(() => {
    if (normalized.length < 2) return [];
    return groups
      .flatMap((group) =>
        rankAtlasOptions(group.options, normalized, group.limit).map((label) => ({
          field: group.field,
          label,
          caption: group.caption,
        })),
      )
      .sort(
        (a, b) =>
          normalizeSearchText(a.label).indexOf(normalized) -
            normalizeSearchText(b.label).indexOf(normalized) ||
          a.label.length - b.label.length ||
          a.label.localeCompare(b.label, "tr"),
      )
      .slice(0, 16);
  }, [groups, normalized]);

  return (
    <div className="relative">
      <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
        Her yerde ara
        <span className="relative mt-2 block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-600" />
          <input
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            className={`${inputClass} py-3 pl-10 pr-10`}
            placeholder="Bölüm, üniversite, şehir, dil, burs veya puan türü yaz..."
            autoComplete="off"
          />
          {value && (
            <button type="button" onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-white" aria-label="Aramayı temizle">
              <X className="size-4" />
            </button>
          )}
        </span>
      </label>
      {focused && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-white/[0.1] bg-ink-850 p-1.5 shadow-2xl">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.field}-${suggestion.label}`}
              type="button"
              onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
              onClick={() => onSelect(suggestion.field, suggestion.label)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-pilot-500/10"
            >
              <span className="min-w-0 truncate text-xs font-semibold text-slate-300">{suggestion.label}</span>
              <span className="shrink-0 rounded-md bg-white/[0.05] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600">{suggestion.caption}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SmartMultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(
    () =>
      rankAtlasOptions(
        options.filter((option) => !selected.includes(option)),
        normalizeSearchText(query),
        30,
      ),
    [options, query, selected],
  );

  const add = (value: string) => {
    if (!selected.includes(value)) onChange([...selected, value]);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}</p>
      <div className="mt-2 rounded-xl border border-white/[0.08] bg-ink-950/60 p-2 focus-within:border-pilot-400/50 focus-within:ring-2 focus-within:ring-pilot-500/10">
        <div className="flex min-h-8 flex-wrap items-center gap-1.5">
          {selected.map((item) => (
            <button key={item} type="button" onClick={() => onChange(selected.filter((value) => value !== item))} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-pilot-500/12 px-2 py-1 text-[10px] font-bold text-pilot-200" title={`${item} filtresini kaldır`}>
              <span className="truncate">{item}</span><X className="size-3 shrink-0" />
            </button>
          ))}
          <input
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter" && suggestions[0]) { event.preventDefault(); add(suggestions[0]); }
              if (event.key === "Backspace" && !query && selected.length > 0) onChange(selected.slice(0, -1));
            }}
            className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-xs font-semibold text-white outline-none placeholder:text-slate-700"
            placeholder={selected.length > 0 ? "Başka ekle..." : placeholder}
            autoComplete="off"
          />
          <ChevronDown className="size-3.5 shrink-0 text-slate-700" />
        </div>
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/[0.1] bg-ink-850 p-1.5 shadow-2xl">
          {suggestions.map((option) => (
            <button key={option} type="button" onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()} onClick={() => add(option)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-pilot-500/10 hover:text-white">
              <span className="truncate">{option}</span><Check className="size-3.5 shrink-0 text-pilot-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickChips({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button key={option} type="button" onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])} className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${active ? "border-pilot-400/35 bg-pilot-500/15 text-pilot-200" : "border-white/[0.08] bg-white/[0.025] text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"}`}>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-ink-950/25 p-3"><p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{title}</p>{children}</div>;
}

function NumberFilter({ label, value, placeholder, onChange, allowDecimal = false }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; allowDecimal?: boolean }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
      {label}
      <input value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value.replace(allowDecimal ? /[^\d,.]/g : /[^\d]/g, ""))} inputMode={allowDecimal ? "decimal" : "numeric"} className={`${inputClass} mt-2`} placeholder={placeholder} />
    </label>
  );
}
