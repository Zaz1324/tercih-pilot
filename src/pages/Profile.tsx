import { type FormEvent, useEffect, useState } from "react";
import { Save, ShieldCheck, UserRound } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

const PROFILE_STORAGE_KEY = "tercih-pilot:profile:v1";

interface CandidateProfile {
  name: string;
}

const DEFAULT_PROFILE: CandidateProfile = {
  name: "",
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-pilot-400/50 focus:ring-2 focus:ring-pilot-500/10";

export function Profile() {
  const { notify } = useToast();
  const [profile, setProfile] = useState<CandidateProfile>(() =>
    loadProfile(),
  );
  const displayName = profile.name.trim();

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    notify(displayName ? "Profil ismi kaydedildi." : "Profil temizlendi.");
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-panel">
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-blue-500/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 size-72 rounded-full bg-emerald-500/[0.055] blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
                Aday profili
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                {displayName
                  ? `${displayName} için kişisel sekme`
                  : "Profil sekmeni hazırla"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Profil artık sade çalışır: sadece ad soyad bilgisini alır ve bu
                tarayıcıda saklar. Diğer tercih kararları Üniversiteler,
                Karşılaştırma ve Tercih Sıralaması sekmelerinde kalır.
              </p>
            </div>
            <div className="flex min-w-48 items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4">
              <ShieldCheck className="size-5 text-emerald-300" />
              <div>
                <p className="text-xs font-extrabold text-white">
                  Yerel kayıt
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  Sadece LocalStorage
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-panel sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20">
            <UserRound className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">İsim bilgisi</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Profil sekmesi artık tek alanla çalışır; hızlı, temiz ve
              kararsızlık çıkarmayan bir küçük pasaport gibi.
            </p>
          </div>
        </div>

        <label className="mt-6 block text-xs font-bold text-slate-500">
          Ad soyad
          <span className="relative block">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-700" />
            <input
              value={profile.name}
              onChange={(event) =>
                setProfile({ name: event.target.value })
              }
              className={`${inputClass} pl-11`}
              placeholder="Örn. Zeynep Yılmaz"
            />
          </span>
        </label>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-slate-600">
            Yazdığın isim otomatik kaydedilir; düğme sadece kaydedildi mesajı
            verir.
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pilot-500 px-5 py-3 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400"
          >
            <Save className="size-4" />
            Profili Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}

function loadProfile(): CandidateProfile {
  try {
    const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_PROFILE;
    }

    const parsed = JSON.parse(rawValue) as Partial<CandidateProfile>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}
