import type { ReactNode } from "react";
import {
  Building2,
  DatabaseBackup,
  Gauge,
  GitCompareArrows,
  ListOrdered,
  Plane,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { PageKey } from "../types/university";

interface LayoutProps {
  activePage: PageKey;
  children: ReactNode;
  onNavigate: (page: PageKey) => void;
}

const navItems = [
  {
    id: "dashboard" as const,
    label: "Dashboard",
    shortLabel: "Özet",
    icon: Gauge,
    description: "Genel görünüm",
  },
  {
    id: "profile" as const,
    label: "Profil",
    shortLabel: "Profil",
    icon: UserRound,
    description: "İsim bilgisi",
  },
  {
    id: "universities" as const,
    label: "Üniversiteler",
    shortLabel: "Kayıtlar",
    icon: Building2,
    description: "Aday programlar",
  },
  {
    id: "compare" as const,
    label: "Karşılaştırma",
    shortLabel: "Kıyasla",
    icon: GitCompareArrows,
    description: "Yan yana analiz",
  },
  {
    id: "preferences" as const,
    label: "Tercih Sıralaması",
    shortLabel: "Sıralama",
    icon: ListOrdered,
    description: "Nihai liste",
  },
  {
    id: "settings" as const,
    label: "Veri & Ayarlar",
    shortLabel: "Veri",
    icon: DatabaseBackup,
    description: "Yedekleme merkezi",
  },
];

const pageDescriptions: Record<PageKey, string> = {
  dashboard: "Karar sürecinin güncel özeti",
  profile: "Aday isim bilgin ve yerel profil sekmen",
  universities: "Tüm üniversite ve program adayların",
  compare: "Güçlü ve zayıf yönleri yan yana gör",
  preferences: "Tercih listenin son sırasını belirle",
  settings: "Yerel verilerini yönet ve yedekle",
};

export function Layout({
  activePage,
  children,
  onNavigate,
}: LayoutProps) {
  const activeItem = navItems.find((item) => item.id === activePage)!;
  const today = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-blue-600/[0.07] blur-3xl" />
        <div className="absolute -right-56 top-1/3 size-[32rem] rounded-full bg-violet-600/[0.06] blur-3xl" />
        <div className="app-grid absolute inset-0 opacity-40" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.07] bg-ink-950/[0.85] px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex size-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-pilot-400 to-violet-500 text-white shadow-glow">
            <Plane className="size-5 -rotate-12" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/[0.15] to-white/20" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-pilot-300">
              Karar Merkezi
            </p>
            <p className="text-lg font-black tracking-tight text-white">
              Tercih Pilot
            </p>
          </div>
        </div>

        <div className="mx-2 my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <nav className="flex flex-1 flex-col gap-1.5" aria-label="Ana menü">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  isActive
                    ? "bg-pilot-500/[0.12] text-white ring-1 ring-pilot-400/20"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span className="absolute -left-4 h-7 w-1 rounded-r-full bg-pilot-400 shadow-[0_0_14px_rgba(93,156,255,0.9)]" />
                )}
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "bg-pilot-500/[0.15] text-pilot-300"
                      : "bg-white/[0.035] text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  <Icon className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-600">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-emerald-400/[0.15] bg-emerald-400/[0.045] p-3.5">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="size-4" />
            <span className="text-xs font-extrabold">Tamamen yerel</span>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">
            Verilerin yalnızca bu tarayıcıda saklanır.
          </p>
        </div>
      </aside>

      <div className="relative min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pilot-400 to-violet-500 text-white lg:hidden">
                <Plane className="size-4 -rotate-12" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight text-white sm:text-lg">
                  {activeItem.label}
                </h1>
                <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block">
                  {pageDescriptions[activePage]}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-500 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {today}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div key={activePage} className="animate-rise">
            {children}
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-6 rounded-2xl border border-white/10 bg-ink-900/90 p-1.5 shadow-panel backdrop-blur-xl lg:hidden"
        aria-label="Mobil ana menü"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activePage;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 transition ${
                isActive
                  ? "bg-pilot-500/[0.15] text-pilot-300"
                  : "text-slate-600"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4" />
              <span className="w-full truncate text-center text-[9px] font-bold">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
