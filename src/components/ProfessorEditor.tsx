import { GraduationCap, Plus, Trash2 } from "lucide-react";
import type { Professor } from "../types/university";
import { createId } from "../utils/storage";

interface ProfessorEditorProps {
  professors: Professor[];
  onChange: (professors: Professor[]) => void;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-pilot-400/60 focus:ring-2 focus:ring-pilot-500/10";

export function ProfessorEditor({
  professors,
  onChange,
}: ProfessorEditorProps) {
  const addProfessor = () => {
    onChange([
      ...professors,
      {
        id: createId("prof"),
        name: "",
        title: "",
        field: "",
        score: 5,
        note: "",
      },
    ]);
  };

  const updateProfessor = (id: string, updates: Partial<Professor>) => {
    onChange(
      professors.map((professor) =>
        professor.id === id ? { ...professor, ...updates } : professor,
      ),
    );
  };

  const removeProfessor = (id: string) => {
    onChange(professors.filter((professor) => professor.id !== id));
  };

  return (
    <div>
      {professors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-7 text-center">
          <GraduationCap className="mx-auto size-7 text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-400">
            Henüz akademisyen eklenmedi
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Akademik kadroyu puanlamak öneri skorunu güçlendirir.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {professors.map((professor, index) => (
            <article
              key={professor.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-black text-violet-300 ring-1 ring-violet-400/20">
                    {index + 1}
                  </span>
                  <p className="text-sm font-extrabold text-slate-200">
                    Akademisyen
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProfessor(professor.id)}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label={`${index + 1}. akademisyeni sil`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-500">
                  Ad soyad <span className="text-rose-400">*</span>
                  <input
                    value={professor.name}
                    onChange={(event) =>
                      updateProfessor(professor.id, {
                        name: event.target.value,
                      })
                    }
                    className={`${inputClass} mt-1.5`}
                    placeholder="Örn. Prof. Dr. Ayşe Yılmaz"
                  />
                </label>
                <label className="text-xs font-bold text-slate-500">
                  Unvan
                  <input
                    value={professor.title}
                    onChange={(event) =>
                      updateProfessor(professor.id, {
                        title: event.target.value,
                      })
                    }
                    className={`${inputClass} mt-1.5`}
                    placeholder="Prof. Dr., Doç. Dr..."
                  />
                </label>
                <label className="text-xs font-bold text-slate-500">
                  Alan / uzmanlık
                  <input
                    value={professor.field}
                    onChange={(event) =>
                      updateProfessor(professor.id, {
                        field: event.target.value,
                      })
                    }
                    className={`${inputClass} mt-1.5`}
                    placeholder="Yapay zekâ, robotik..."
                  />
                </label>
                <label className="text-xs font-bold text-slate-500">
                  Puan:{" "}
                  <span className="font-black text-pilot-300">
                    {professor.score}/10
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={professor.score}
                    onChange={(event) =>
                      updateProfessor(professor.id, {
                        score: Number(event.target.value),
                      })
                    }
                    className="mt-3 h-1.5 w-full cursor-pointer accent-blue-500"
                  />
                </label>
              </div>
              <label className="mt-3 block text-xs font-bold text-slate-500">
                Profesör notu
                <textarea
                  value={professor.note}
                  onChange={(event) =>
                    updateProfessor(professor.id, {
                      note: event.target.value,
                    })
                  }
                  className={`${inputClass} mt-1.5 min-h-20 resize-y`}
                  placeholder="Araştırmaları, dersleri veya görüşme notların..."
                />
              </label>
            </article>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addProfessor}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-2.5 text-sm font-extrabold text-violet-300 transition hover:bg-violet-500/[0.15]"
      >
        <Plus className="size-4" />
        Profesör Ekle
      </button>
    </div>
  );
}
