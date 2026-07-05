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

function getMake(v: Vehicle)  { return v.variant?.generation?.model?.make?.name  ?? ""; }
function getModel(v: Vehicle) { return v.variant?.generation?.model?.name        ?? ""; }
function getVariant(v: Vehicle) {
  const va = v.variant;
  const g  = va?.generation;
  return [g?.code, va?.name].filter(Boolean).join(" ") || null;
}

// ─── Make grid ──────────────────────────────────────────────────────────────
function MakeGrid({ vehicles, onSelect, hasUnlinked }: { vehicles: Vehicle[]; onSelect: (make: string) => void; hasUnlinked: boolean }) {
  const { t } = useLanguage();
  const makes = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of vehicles) {
      if (!v.variant) continue; // vehicles without full hierarchy handled separately
      const mk = getMake(v);
      if (!mk) continue;
      map.set(mk, (map.get(mk) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [vehicles]);

  // If no linked vehicles but there ARE unlinked ones, skip empty state (unlinked panel shows below)
  if (makes.length === 0 && hasUnlinked) return null;

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
  const [globalSearch, setGlobalSearch] = useState("");

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

  // Global search — filters across all vehicles client-side (instant, no extra API call)
  const gq = globalSearch.toLowerCase().trim();
  const searchResults = gq
    ? vehicles.filter(v =>
        getMake(v).toLowerCase().includes(gq) ||
        getModel(v).toLowerCase().includes(gq) ||
        (v.vin && v.vin.toLowerCase().includes(gq)) ||
        (v.year && String(v.year).includes(gq))
      )
    : [];

  // Vehicles that have no variant linked — shown separately, not in the make/model hierarchy
  const unlinkedVehicles = useMemo(() => vehicles.filter(v => !v.variant), [vehicles]);

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
          message={`Delete ${toDelete.variant ? `${getMake(toDelete)} ${getModel(toDelete)}` : `Vehicle #${toDelete.id}`}${toDelete.year ? ` (${toDelete.year})` : ""}? ${t.vehicles.deleteConfirm}`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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

      {/* Global search */}
      <div className="relative max-w-sm mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
          placeholder="Search by make, model, year, VIN…"
          className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-zinc-600 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
        />
        {globalSearch && (
          <button onClick={() => setGlobalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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

      {/* Search results (overrides normal hierarchy view) */}
      {!loading && gq && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
          {searchResults.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">{t.common.noResults}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Make / Model</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.year}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.vin}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.status}</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {searchResults.map(v => (
                  <tr key={v.id} className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors" onClick={() => router.push(`/vehicles/${v.id}`)}>
                    <td className="px-6 py-3.5 font-semibold text-[var(--text-primary)]">
                      {v.variant ? (
                        <>
                          {getMake(v)} <span className="text-[var(--text-secondary)] font-normal">{getModel(v)}</span>
                          {getVariant(v) && <span className="text-xs text-[var(--text-muted)] ml-1">· {getVariant(v)}</span>}
                        </>
                      ) : (
                        <span className="text-[var(--text-muted)] italic font-normal">Vehicle #{v.id} — no hierarchy</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-[var(--text-secondary)]">{v.year || "—"}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-[var(--text-muted)]">{v.vin || "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        v.status === "in_stock" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                        v.status === "sold"     ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/20" :
                        "bg-red-500/15 text-red-400 border-red-500/20"
                      }`}>{v.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => router.push(`/vehicles/${v.id}`)} className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors">
                        {t.vehicles.view}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Normal hierarchy views (hidden while searching) */}
      {!loading && !gq && level === "makes" && (
        <MakeGrid vehicles={vehicles} onSelect={goModels} hasUnlinked={unlinkedVehicles.length > 0} />
      )}
      {!loading && !gq && level === "models" && (
        <ModelGrid vehicles={vehicles} make={selectedMake} onSelect={(mo) => goCars(selectedMake, mo)} />
      )}
      {!loading && !gq && level === "vehicles" && (
        <VehicleList
          vehicles={vehicles}
          make={selectedMake}
          model={selectedModel}
          onDelete={setToDelete}
        />
      )}

      {/* Unlinked vehicles — shown at makes level only, below the grid */}
      {!loading && !gq && level === "makes" && unlinkedVehicles.length > 0 && (
        <div className="mt-6 bg-[var(--surface)] border border-amber-500/20 rounded-xl overflow-hidden shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)]">
            <div className="w-7 h-7 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-400">
                {unlinkedVehicles.length} unlinked vehicle{unlinkedVehicles.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                These vehicles have no make/model hierarchy. Edit each one to assign a Variant.
              </p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Vehicle</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.year}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.vehicles.vin}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.status}</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {unlinkedVehicles.map(v => (
                <tr key={v.id} className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors" onClick={() => router.push(`/vehicles/${v.id}`)}>
                  <td className="px-5 py-3 text-[var(--text-muted)] italic text-sm">Vehicle #{v.id}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{v.year || "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text-muted)]">{v.vin || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={statusBadge(v.status)}>{v.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => router.push(`/vehicles/${v.id}/edit`)} className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
                        Edit & link
                      </button>
                      <button onClick={() => setToDelete(v)} className="text-xs font-medium text-[var(--text-muted)] hover:text-red-400 transition-colors">
                        {t.common.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
