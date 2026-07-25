import type { LucideIcon } from "lucide-react";

type Accent = "blue" | "violet" | "cyan" | "emerald";

interface StatCardProps {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  accent?: Accent;
}

const accentStyles: Record<
  Accent,
  { icon: string; glow: string; bar: string }
> = {
  blue: {
    icon: "bg-blue-500/[0.12] text-blue-300 ring-blue-400/20",
    glow: "bg-blue-500/10",
    bar: "from-blue-500 to-cyan-400",
  },
  violet: {
    icon: "bg-violet-500/[0.12] text-violet-300 ring-violet-400/20",
    glow: "bg-violet-500/10",
    bar: "from-violet-500 to-fuchsia-400",
  },
  cyan: {
    icon: "bg-cyan-500/[0.12] text-cyan-300 ring-cyan-400/20",
    glow: "bg-cyan-500/10",
    bar: "from-cyan-500 to-blue-400",
  },
  emerald: {
    icon: "bg-emerald-500/[0.12] text-emerald-300 ring-emerald-400/20",
    glow: "bg-emerald-500/10",
    bar: "from-emerald-500 to-cyan-400",
  },
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = "blue",
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-panel transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.15]">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-3xl ${styles.glow}`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 truncate text-2xl font-black tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{helper}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${styles.icon}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <div
        className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r opacity-70 ${styles.bar}`}
      />
    </article>
  );
}
