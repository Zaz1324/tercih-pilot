import { type ChangeEvent, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Database,
  Download,
  FileJson,
  HardDrive,
  Info,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../contexts/ToastContext";
import { useUniversities } from "../contexts/UniversityContext";
import { createDemoUniversities } from "../data/demoData";
import type { UniversityProgram } from "../types/university";
import {
  downloadUniversityData,
  readUniversityDataFile,
} from "../utils/exportImport";
import { STORAGE_KEY } from "../utils/storage";

interface PendingImport {
  fileName: string;
  universities: UniversityProgram[];
}

export function Settings() {
  const { universities, replaceUniversities, clearUniversities } =
    useUniversities();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "clear" | "demo" | null
  >(null);
  const serializedSize = new Blob([JSON.stringify(universities)]).size;
  const preferenceCount = universities.filter(
    (university) => university.preferenceOrder > 0,
  ).length;
  const professorCount = universities.reduce(
    (total, university) => total + university.professors.length,
    0,
  );
  const lastUpdated = [...universities]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    ?.updatedAt;

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const importedUniversities = await readUniversityDataFile(file);
      setPendingImport({
        fileName: file.name,
        universities: importedUniversities,
      });
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Dosya içe aktarılırken bir hata oluştu.",
        "error",
      );
    }
  };

  const loadDemoData = () => {
    const demoData = createDemoUniversities();
    if (universities.length === 0) {
      replaceUniversities(demoData, "Demo veriler yüklendi.");
      return;
    }
    setConfirmAction("demo");
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pilot-300">
          Yerel veri merkezi
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Ayarlar ve veri yedekleme
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Kayıtların bu tarayıcının LocalStorage alanında tutulur. Buluta veya
          herhangi bir sunucuya gönderilmez.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataStat
          icon={Database}
          label="Toplam kayıt"
          value={String(universities.length)}
        />
        <DataStat
          icon={FileJson}
          label="Tercih listesi"
          value={String(preferenceCount)}
        />
        <DataStat
          icon={Sparkles}
          label="Akademisyen"
          value={String(professorCount)}
        />
        <DataStat
          icon={HardDrive}
          label="Yaklaşık boyut"
          value={formatBytes(serializedSize)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-panel sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Yedekleme işlemleri
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Verilerini taşımak veya güvenli bir kopya almak için JSON
                dosyası kullan.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ActionCard
              icon={Download}
              title="JSON Dışa Aktar"
              description="Tüm kayıtları tek bir yedek dosyası olarak indir."
              buttonLabel="Yedeği İndir"
              disabled={universities.length === 0}
              onClick={() => {
                downloadUniversityData(universities);
                notify("JSON yedeği hazırlandı.");
              }}
            />
            <ActionCard
              icon={Upload}
              title="JSON İçe Aktar"
              description="Daha önce alınmış bir Tercih Pilot yedeğini yükle."
              buttonLabel="Dosya Seç"
              onClick={() => fileInputRef.current?.click()}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-400/10 bg-blue-500/[0.04] p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-300" />
            <p className="text-[11px] leading-5 text-slate-500">
              İçe aktarma mevcut verilerin yerini alır. Dosya uygulanmadan önce
              kayıt sayısını gösteren bir onay penceresi açılır.
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-panel sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
              <Database className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Veri durumu
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Yerel depolamanın kısa teknik özeti.
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3">
            <DataRow label="Depolama" value="Tarayıcı LocalStorage" />
            <DataRow label="Sunucu bağlantısı" value="Yok" success />
            <DataRow
              label="Son güncelleme"
              value={
                lastUpdated
                  ? new Intl.DateTimeFormat("tr-TR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(lastUpdated))
                  : "Henüz veri yok"
              }
            />
            <DataRow label="Depolama anahtarı" value={STORAGE_KEY} mono />
          </dl>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-500/[0.045] px-3.5 py-3 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="size-4" />
            Uygulama çevrimdışı ve yerel kullanıma hazır.
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-panel sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Başlangıç ve sıfırlama
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Uygulamayı örnek verilerle keşfet veya tüm yerel kayıtları temizle.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadDemoData}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] px-4 py-2.5 text-sm font-extrabold text-violet-300 transition hover:bg-violet-500/[0.15]"
            >
              <Sparkles className="size-4" />
              Demo Veri Yükle
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction("clear")}
              disabled={universities.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] px-4 py-2.5 text-sm font-extrabold text-rose-300 transition hover:bg-rose-500/[0.15] disabled:cursor-not-allowed disabled:opacity-[0.35]"
            >
              <Trash2 className="size-4" />
              Tüm Verileri Sil
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Yedek dosyasını içe aktar?"
        description={
          pendingImport
            ? `${pendingImport.fileName} dosyasında ${pendingImport.universities.length} kayıt bulundu. Mevcut ${universities.length} kayıt bu verilerle değiştirilecek.`
            : ""
        }
        confirmLabel="İçe Aktar"
        tone="warning"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) {
            replaceUniversities(
              pendingImport.universities,
              `${pendingImport.universities.length} kayıt içe aktarıldı.`,
            );
          }
          setPendingImport(null);
        }}
      />

      <ConfirmDialog
        open={confirmAction === "clear"}
        title="Tüm verileri silmek istiyor musun?"
        description={`${universities.length} üniversite kaydı, profesör değerlendirmeleri ve tercih sıralaması kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Tümünü Sil"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          clearUniversities();
          setConfirmAction(null);
        }}
      />

      <ConfirmDialog
        open={confirmAction === "demo"}
        title="Demo verilerle değiştir?"
        description={`Mevcut ${universities.length} kayıt silinip 5 örnek üniversite kaydı yüklenecek. Önce JSON yedeği alman önerilir.`}
        confirmLabel="Demo Veriyi Yükle"
        tone="warning"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          replaceUniversities(
            createDemoUniversities(),
            "Demo veriler yüklendi.",
          );
          setConfirmAction(null);
        }}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toLocaleString("tr-TR", {
    maximumFractionDigits: 1,
  })} KB`;
}

function DataStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] text-pilot-300">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  disabled?: boolean;
  onClick: () => void;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  disabled = false,
  onClick,
}: ActionCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-ink-950/25 p-4">
      <Icon className="size-5 text-slate-500" />
      <h4 className="mt-4 text-sm font-extrabold text-slate-200">{title}</h4>
      <p className="mt-1.5 flex-1 text-[11px] leading-5 text-slate-600">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-xs font-extrabold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-[0.35]"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function DataRow({
  label,
  value,
  success = false,
  mono = false,
}: {
  label: string;
  value: string;
  success?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-ink-950/30 px-3.5 py-3 text-xs">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={`truncate text-right font-extrabold ${
          success ? "text-emerald-300" : "text-slate-300"
        } ${mono ? "font-mono text-[10px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
