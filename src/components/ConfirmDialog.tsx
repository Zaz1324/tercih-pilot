import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "danger" | "warning";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const Icon = tone === "danger" ? Trash2 : AlertTriangle;
  const iconStyle =
    tone === "danger"
      ? "bg-rose-500/10 text-rose-300 ring-rose-400/20"
      : "bg-amber-500/10 text-amber-300 ring-amber-400/20";
  const buttonStyle =
    tone === "danger"
      ? "bg-rose-500 text-white hover:bg-rose-400"
      : "bg-amber-400 text-amber-950 hover:bg-amber-300";

  return (
    <Modal open={open} title={title} size="md" onClose={onCancel}>
      <div className="p-6 sm:p-7">
        <div className={`mb-5 flex size-12 items-center justify-center rounded-2xl ring-1 ${iconStyle}`}>
          <Icon className="size-6" />
        </div>
        <p className="text-sm leading-6 text-slate-300">{description}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${buttonStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
