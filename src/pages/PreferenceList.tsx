import { useState } from "react";
import {
  ArrowDown,
  ArrowDownNarrowWide,
  ArrowUp,
  Award,
  Building2,
  Eye,
  EyeOff,
  ListOrdered,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { useUniversities } from "../contexts/UniversityContext";
import type { PageKey, UniversityProgram } from "../types/university";
import { formatRanking } from "../utils/scoring";

interface PreferenceListProps {
  onNavigate: (page: PageKey) => void;
}

export function PreferenceList({ onNavigate }: PreferenceListProps) {
  const {
    universities,
    addToPreferenceList,
    removeFromPreferenceList,
    reorderPreferenceList,
  } = useUniversities();
  const [candidateId, setCandidateId] = useState("");
  const [hideEliminated, setHideEliminated] = useState(true);
  const preferences = universities
    .filter((university) => university.preferenceOrder > 0)
    .sort((a, b) => a.preferenceOrder - b.preferenceOrder);
  const candidates = universities
    .filter((university) => university.preferenceOrder === 0)
    .sort((a, b) => b.generalScore - a.generalScore);
  const visiblePreferences = hideEliminated
    ? preferences.filter((university) => university.status !== "Elendi")
    : preferences;

  const commitVisibleOrder = (nextVisible: UniversityProgram[]) => {
    const visibleIds = new Set(nextVisible.map((university) => university.id));
    const hidden = preferences.filter(
      (university) => !visibleIds.has(university.id),
    );
    reorderPreferenceList([
      ...nextVisible.map((university) => university.id),
      ...hidden.map((university) => university.id),
    ]);
  };

  const movePreference = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= visiblePreferences.length) {
      return;
    }

    const next = [...visiblePreferences];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    commitVisibleOrder(next);
  };

  const sortVisible = (mode: "score" | "ranking") => {
    const next = [...visiblePreferences].sort((a, b) =>
      mode === "score"
        ? b.generalScore - a.generalScore
        : a.ranking - b.ranking,
    );
    commitVisibleOrder(next);
  };

  const handleAddCandidate = () => {
    if (!candidateId) {
      return;
    }
    addToPreferenceList(candidateId);
    setCandidateId("");
  };

  if (universities.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Tercih sırası için önce kayıt ekle"
        description="Üniversite adaylarını ekledikten sonra istediğin programları burada nihai tercih listene alabilirsin."
        actionLabel="Üniversitelere Git"
        onAction={() => onNavigate("universities")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
            Nihai rota
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Tercih sıralaması
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {preferences.length} program listede · sıra numaraları otomatik
            güncellenir
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => sortVisible("score")}
            disabled={visiblePreferences.length < 2}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-2.5 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="size-4 text-pilot-300" />
            Puana Göre Sırala
          </button>
          <button
            type="button"
            onClick={() => sortVisible("ranking")}
            disabled={visiblePreferences.length < 2}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-2.5 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownNarrowWide className="size-4 text-violet-300" />
            Başarı Sırasına Göre
          </button>
          <button
            type="button"
            onClick={() => setHideEliminated((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-extrabold transition ${
              hideEliminated
                ? "border-rose-400/20 bg-rose-500/[0.07] text-rose-300"
                : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:bg-white/[0.07]"
            }`}
          >
            {hideEliminated ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            Elendileri {hideEliminated ? "Göster" : "Gizle"}
          </button>
        </div>
      </section>

      {candidates.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-pilot-400/[0.15] bg-pilot-500/[0.045] p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pilot-500/10 text-pilot-300">
              <Plus className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-200">
                Listeye program ekle
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Seçtiğin kayıt listenin sonuna eklenir.
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 gap-2 sm:max-w-xl">
            <select
              value={candidateId}
              onChange={(event) => setCandidateId(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-ink-950/60 px-3.5 py-2.5 text-xs font-semibold text-slate-300 outline-none focus:border-pilot-400/50"
            >
              <option value="">Program seç...</option>
              {candidates.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.universityName} · {university.programName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddCandidate}
              disabled={!candidateId}
              className="shrink-0 rounded-xl bg-pilot-500 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-pilot-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Listeye Ekle
            </button>
          </div>
        </section>
      )}

      {preferences.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Tercih listen henüz boş"
          description="Yukarıdaki seçim alanından bir program ekle. Eklenen her kayıt otomatik olarak bir sıra numarası alır."
        />
      ) : visiblePreferences.length === 0 ? (
        <EmptyState
          icon={EyeOff}
          title="Listede yalnızca elenen kayıtlar var"
          description="Elenen kayıtları görmek için görünürlük filtresini değiştirebilirsin."
          actionLabel="Elenenleri Göster"
          onAction={() => setHideEliminated(false)}
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-panel">
          <div className="hidden grid-cols-[70px_minmax(260px,1.4fr)_130px_120px_90px_140px_104px] items-center border-b border-white/[0.07] bg-ink-950/30 px-4 py-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-600 lg:grid">
            <span>Sıra</span>
            <span>Üniversite / program</span>
            <span>Şehir</span>
            <span>Başarı sırası</span>
            <span>Puan</span>
            <span>Durum</span>
            <span className="text-right">Düzenle</span>
          </div>

          <div className="divide-y divide-white/[0.055]">
            {visiblePreferences.map((university, index) => (
              <article
                key={university.id}
                className="group grid gap-4 px-4 py-4 transition hover:bg-white/[0.025] lg:grid-cols-[70px_minmax(260px,1.4fr)_130px_120px_90px_140px_104px] lg:items-center lg:gap-0"
              >
                <div className="flex items-center gap-3 lg:block">
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl text-sm font-black ${
                      university.preferenceOrder === 1
                        ? "bg-amber-400/[0.12] text-amber-300 ring-1 ring-amber-400/20"
                        : "bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    {university.preferenceOrder}
                  </span>
                  <div className="lg:hidden">
                    <p className="text-sm font-black text-white">
                      {university.universityName}
                    </p>
                    <p className="mt-1 text-xs text-pilot-300">
                      {university.programName}
                    </p>
                  </div>
                </div>

                <div className="hidden min-w-0 pr-4 lg:block">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-slate-200">
                      {university.universityName}
                    </p>
                    {university.preferenceOrder === 1 && (
                      <Award className="size-3.5 shrink-0 text-amber-300" />
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-pilot-300">
                    {university.programName}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 lg:contents">
                  <PreferenceValue
                    label="Şehir"
                    value={university.city}
                  />
                  <PreferenceValue
                    label="Başarı sırası"
                    value={formatRanking(university.ranking)}
                  />
                  <PreferenceValue
                    label="Genel puan"
                    value={`${university.generalScore}/100`}
                    highlight
                  />
                </div>

                <div>
                  <StatusBadge status={university.status} />
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => movePreference(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={`${university.universityName} kaydını yukarı taşı`}
                    title="Yukarı taşı"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePreference(index, 1)}
                    disabled={index === visiblePreferences.length - 1}
                    className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={`${university.universityName} kaydını aşağı taşı`}
                    title="Aşağı taşı"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromPreferenceList(university.id)}
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label={`${university.universityName} kaydını listeden çıkar`}
                    title="Listeden çıkar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PreferenceValue({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-ink-950/25 p-2.5 lg:bg-transparent lg:p-0">
      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-700 lg:hidden">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-xs font-extrabold lg:mt-0 ${
          highlight ? "text-pilot-300" : "text-slate-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
