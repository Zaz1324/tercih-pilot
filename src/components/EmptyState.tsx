import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.025] px-6 py-14 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_58%)]" />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-pilot-500/10 text-pilot-300 ring-1 ring-pilot-400/20">
          <Icon className="size-7" />
        </div>
        <h3 className="text-lg font-extrabold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 rounded-xl bg-pilot-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:bg-pilot-400"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
