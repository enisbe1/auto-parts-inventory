"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { Vehicle, Category, Part } from "@/lib/types";
import Toast from "@/components/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import PhotoUploader from "@/components/PhotoUploader";

// ─── Searchable vehicle picker (module scope — no remount on re-renders) ─────
function _vehicleLabel(v: Vehicle): string {
  const va = v.variant;
  if (!va) return `Vehicle #${v.id}`;
  const g = va.generation; const m = g?.model; const mk = m?.make;
  return [mk?.name, m?.name, g?.code, va.name].filter(Boolean).join(" ") + (v.year ? ` (${v.year})` : "");
}

function VehiclePicker({
  vehicles, value, onChange, noVehicleLabel,
}: {
  vehicles: Vehicle[]; value: string; onChange: (id: string) => void; noVehicleLabel: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const filtered = q ? vehicles.filter(v => _vehicleLabel(v).toLowerCase().includes(q)) : vehicles;
  const selected = vehicles.find(v => String(v.id) === value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter vehicles…"
          className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl pl-9 pr-8 py-2 text-sm transition"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition"
        size={Math.min(filtered.length + 1, 6)}
      >
        <option value="">{noVehicleLabel}</option>
        {filtered.map(v => <option key={v.id} value={v.id}>{_vehicleLabel(v)}</option>)}
      </select>
      {selected && (
        <p className="text-xs text-blue-400 font-medium">
          ✓ {_vehicleLabel(selected)}{" — "}
          <button type="button" onClick={() => onChange("")} className="underline hover:text-blue-300 transition-colors">clear</button>
        </p>
      )}
    </div>
  );
}

export default function EditPartPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t }  = useLanguage();

  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName]           = useState("");
  const [partNumber, setPartNum]  = useState("");
  const [condition, setCondition] = useState("good");
  const [price, setPrice]         = useState("");
  const [status, setStatus]       = useState("available");
  const [vehicleId, setVehicleId] = useState("");
  const [categoryId, setCatId]    = useState("");
  const [notes, setNotes]         = useState("");

  const [photos, setPhotos]       = useState<string[]>([]);

  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/parts/${id}`),
      api.get("/vehicles", { params: { page: 1, limit: 200 } }),
      api.get("/categories"),
    ]).then(([partRes, vehiclesRes, catsRes]) => {
      const p: Part = partRes.data;
      setName(p.name);
      setPartNum(p.partNumber || "");
      setCondition(p.condition);
      setPrice(p.price?.toString() || "");
      setStatus(p.status);
      setVehicleId(p.vehicleId?.toString() || "");
      setCatId(p.categoryId?.toString() || "");
      setNotes(p.notes || "");
      setPhotos(p.photos || []);
      setVehicles(vehiclesRes.data.data);
      setCategories(catsRes.data);
    }).finally(() => setFetching(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      setToast({ message: "Part name is required", type: "error" });
      return;
    }
    setNameError(false);
    setLoading(true);
    try {
      await api.patch(`/parts/${id}`, {
        name:       name.trim(),
        partNumber: partNumber || undefined,
        condition,
        price:      price ? +price : undefined,
        status,
        vehicleId:  vehicleId  ? +vehicleId  : undefined,
        categoryId: categoryId ? +categoryId : undefined,
        notes:      notes || undefined,
        photos,
      });
      setToast({ message: "Part updated successfully", type: "success" });
      setTimeout(() => router.back(), 1000);
    } catch (err: unknown) {
      let msg: string | string[] = "Failed to update part";
      if (isAxiosError<{ message?: string | string[] }>(err)) {
        msg = err.response?.data?.message ?? msg;
      }
      setToast({ message: Array.isArray(msg) ? msg.join(", ") : msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition";
  const sel = "w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition";

  if (fetching) return (
    <div className="p-8 flex items-center justify-center text-[var(--text-secondary)]">
      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {t.common.loading}
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.common.back}
        </button>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.common.edit} Part</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.newPart.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Part Information */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Part Information</p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {t.newPart.name} <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
              required
              className={`${inp} ${nameError ? "border-red-500 ring-2 ring-red-500/30" : ""}`}
            />
            {nameError && <p className="text-xs text-red-400 mt-1">Part name is required</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.partNumber}</label>
              <input value={partNumber} onChange={e => setPartNum(e.target.value)} placeholder="OEM or aftermarket"
                className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.price}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">€</span>
                <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl pl-8 pr-4 py-2.5 text-sm transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.condition}</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} className={sel}>
                <option value="good">{t.condition.good}</option>
                <option value="fair">{t.condition.fair}</option>
                <option value="poor">{t.condition.poor}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.status}</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={sel}>
                <option value="available">{t.status.available}</option>
                <option value="reserved">{t.status.reserved}</option>
                <option value="sold">{t.status.sold}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Classification</p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.vehicle}</label>
            <VehiclePicker vehicles={vehicles} value={vehicleId} onChange={setVehicleId} noVehicleLabel={t.newPart.noVehicle} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.category}</label>
            <select value={categoryId} onChange={e => setCatId(e.target.value)} className={sel}>
              <option value="">— No category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newPart.notes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition resize-none" />
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Photos</label>
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] py-2.5 rounded-xl text-sm font-medium transition-all">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? t.common.loading : t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}
