"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Vehicle } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import { useLanguage } from "@/contexts/LanguageContext";

const statusBadge = (status: string) => {
  if (status === "in_stock") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  if (status === "sold")     return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/20";
  if (status === "scrapped") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/20";
};

function getMake(v: Vehicle)  { return v.variant?.generation?.model?.make?.name  ?? "Unknown Make"; }
function getModel(v: Vehicle) { return v.variant?.generation?.model?.name        ?? "Unknown Model"; }
function getVariant(v: Vehicle) {
  const va = v.variant;
  const g  = va?.generation;
  return [g?.code, va?.name].filter(Boolean).join(" ") || null;
}

// ─── Make grid ──────────────────────────────────────────────────────────────
function MakeGrid({ vehicles, onSelect }: { vehicles: Vehicle[]; onSelect: (make: string) => void }) {
  const { t } = useLanguage();
  const makes = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of vehicles) {
      const mk = getMake(v);
      map.set(mk, (map.get(mk) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [vehicles]);

  if (makes.length === 0) return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-6 py-14 text-center shadow-xl shadow-black/20">
      <div className="w-12 h-12 bg-[var(--surface-raised)] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      </div>
      <p className="text-[var(--text-secondary)] font-medium text-sm">{t.vehicles.noVehicles}</p>
      <Link href="/vehicles/new" className="inline-flex items-center gap-1.5 mt-3 text-blue-500 text-sm font-medium hover:text-blue-400 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t.vehicles.addFirst}
      </Link>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {makes.map(({ name, count }) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.03] hover:border-blue-500/40 transition-all shadow-xl shadow-black/20"
        >
          <div className="w-10 h-10 bg-blue-500/15 group-hover:bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 transition-colors">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <p className="font-bold text-[var(--text-primary)] text-sm group-hover:text-blue-400 transition-colors">{name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.vehicles.vehiclesCount(count)}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Model grid ──────────────────────────────────────────────────────────────
function ModelGrid({ vehicles, make, onSelect }: { vehicles: Vehicle[]; make: string; onSelect: (model: string) => void }) {
  const { t } = useLanguage();
  const filtered = vehicles.filter(v => getMake(v) === make);

  const models = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of filtered) {
      const mo = getModel(v);
      map.set(mo, (map.get(mo) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {models.map(({ name, count }) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.03] hover:border-blue-500/40 transition-all shadow-xl shadow-black/20"
        >
          <div className="w-10 h-10 bg-[var(--surface-raised)] group-hover:bg-blue-500/15 rounded-xl flex items-center justify-center mb-3 transition-colors">
            <svg className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="font-bold text-[var(--text-primary)] text-sm group-hover:text-blue-400 transition-colors">{name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.vehicles.vehiclesCount(count)}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Vehicle list ─────────────────────────────────────────────────────────────
function VehicleList({
  vehicles, make, model,
  onDelete,
}: {
  vehicles: Vehicle[];
  make: string;
  model: string;
  onDelete: (v: Vehicle) => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const filtered = vehicles.filter(v => getMake(v) === make && getModel(v) === model);

  if (filtered.length === 0) return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-6 py-12 text-center text-[var(--text-muted)] text-sm shadow-xl shadow-black/20">
      {t.common.noResults}
    </div>
  );

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.variant}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.year}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.vin}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.mileage}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.paid}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.status}</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {filtered.map(v => (
            <tr
              key={v.id}
              className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              onClick={() => router.push(`/vehicles/${v.id}`)}
            >
              <td className="px-6 py-3.5 font-semibold text-[var(--text-primary)]">
                {getVariant(v) || <span className="text-[var(--text-muted)] font-normal">{t.vehicles.base}</span>}
              </td>
              <td className="px-6 py-3.5 text-[var(--text-secondary)]">{v.year || <span className="text-[var(--text-muted)]">—</span>}</td>
              <td className="px-6 py-3.5 font-mono text-xs text-[var(--text-muted)]">{v.vin || <span className="text-[var(--text-muted)]">—</span>}</td>
              <td className="px-6 py-3.5 text-[var(--text-secondary)] text-xs">
                {v.mileage ? `${v.mileage.toLocaleString()} km` : <span className="text-[var(--text-muted)]">—</span>}
              </td>
              <td className="px-6 py-3.5 text-[var(--text-secondary)] text-xs font-medium">
                {v.purchasePrice ? `€${Number(v.purchasePrice).toLocaleString()}` : <span className="text-[var(--text-muted)]">—</span>}
              </td>
              <td className="px-6 py-3.5">
                <span className={statusBadge(v.status)}>{v.status.replace("_", " ")}</span>
              </td>
              <td className="px-6 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => router.push(`/vehicles/${v.id}`)}
                    className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {t.vehicles.view}
                  </button>
                  <button
                    onClick={() => onDelete(v)}
                    className="text-xs font-medium text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    {t.common.delete}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────
function VehiclesContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const selectedMake  = searchParams.get("make")  ?? "";
  const selectedModel = searchParams.get("model") ?? "";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [toast, setToast]       = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/vehicles", { params: { page: 1, limit: 500 } });
      setVehicles(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/vehicles/${toDelete.id}`);
      setToast({ message: "Vehicle deleted", type: "success" });
      load();
    } catch {
      setToast({ message: "Failed to delete vehicle", type: "error" });
    } finally {
      setToDelete(null);
    }
  };

  // Navigation helpers
  const goMakes  = () => router.push("/vehicles");
  const goModels = (make: string)  => router.push(`/vehicles?make=${encodeURIComponent(make)}`);
  const goCars   = (make: string, model: string) =>
    router.push(`/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);

  // Derived level
  const level = !selectedMake ? "makes" : !selectedModel ? "models" : "vehicles";

  // Heading
  const heading = level === "makes"
    ? t.vehicles.title
    : level === "models"
    ? selectedMake
    : `${selectedMake} ${selectedModel}`;

  const subtitle = level === "makes"
    ? t.vehicles.vehiclesCount(vehicles.length)
    : level === "models"
    ? t.vehicles.selectModel
    : `${vehicles.filter(v => getMake(v) === selectedMake && getModel(v) === selectedModel).length} vehicle(s)`;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && (
        <ConfirmModal
          message={`Delete this ${getMake(toDelete)} ${getModel(toDelete)}${toDelete.year ? ` (${toDelete.year})` : ""}? ${t.vehicles.deleteConfirm}`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          {/* Breadcrumb */}
          {level !== "makes" && (
            <nav className="flex items-center gap-1.5 text-sm mb-3">
              <button onClick={goMakes} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                {t.vehicles.allMakes}
              </button>
              {level === "vehicles" && (
                <>
                  <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <button onClick={() => goModels(selectedMake)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {selectedMake}
                  </button>
                </>
              )}
              <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-[var(--text-primary)] font-medium">
                {level === "models" ? selectedMake : selectedModel}
              </span>
            </nav>
          )}

          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{heading}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{loading ? t.common.loading : subtitle}</p>
        </div>

        <Link
          href="/vehicles/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t.vehicles.addVehicle}
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-[var(--text-muted)] gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {t.common.loading}
        </div>
      )}

      {/* Views */}
      {!loading && level === "makes" && (
        <MakeGrid vehicles={vehicles} onSelect={goModels} />
      )}
      {!loading && level === "models" && (
        <ModelGrid vehicles={vehicles} make={selectedMake} onSelect={(mo) => goCars(selectedMake, mo)} />
      )}
      {!loading && level === "vehicles" && (
        <VehicleList
          vehicles={vehicles}
          make={selectedMake}
          model={selectedModel}
          onDelete={setToDelete}
        />
      )}
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Loading…</div>}>
      <VehiclesContent />
    </Suspense>
  );
}
