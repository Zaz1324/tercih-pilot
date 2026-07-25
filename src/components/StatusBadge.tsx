import type { UniversityStatus } from "../types/university";

const statusStyles: Record<UniversityStatus, string> = {
  Kesin: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  "Güçlü Aday": "border-blue-400/25 bg-blue-400/10 text-blue-300",
  Kararsız: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  Yedek: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  Elendi: "border-rose-400/25 bg-rose-400/10 text-rose-300",
};

export function StatusBadge({ status }: { status: UniversityStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
