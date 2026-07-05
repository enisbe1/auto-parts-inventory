"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { Make, CarModel, Generation, Variant, Vehicle } from "@/lib/types";
import Toast from "@/components/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import PhotoUploader from "@/components/PhotoUploader";

export default function EditVehiclePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t }  = useLanguage();

  const [makes, setMakes]           = useState<Make[]>([]);
  const [models, setModels]         = useState<CarModel[]>([]);
  const [generations, setGens]      = useState<Generation[]>([]);
  const [variants, setVariants]     = useState<Variant[]>([]);

  const [makeId, setMakeId]         = useState("");
  const [modelId, setModelId]       = useState("");
  const [genId, setGenId]           = useState("");
  const [variantId, setVariantId]   = useState("");
  const [vin, setVin]               = useState("");
  const [year, setYear]             = useState("");
  const [mileage, setMileage]       = useState("");
  const [purchasePrice, setPrice]   = useState("");
  const [purchaseDate, setDate]     = useState("");
  const [status, setStatus]         = useState("in_stock");
  const [notes, setNotes]           = useState("");

  const [photos, setPhotos]         = useState<string[]>([]);

  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(true);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load makes and existing vehicle
  useEffect(() => {
    Promise.all([
      api.get("/makes"),
      api.get(`/vehicles/${id}`),
    ]).then(([makesRes, vehicleRes]) => {
      setMakes(makesRes.data);
      const v: Vehicle = vehicleRes.data;
      // Pre-populate text fields
      setVin(v.vin || "");
      setYear(v.year?.toString() || "");
      setMileage(v.mileage?.toString() || "");
      setPrice(v.purchasePrice?.toString() || "");
      setDate(v.purchaseDate ? v.purchaseDate.split("T")[0] : "");
      setStatus(v.status || "in_stock");
      setNotes(v.notes || "");
      setPhotos(v.photos || []);
      // Pre-populate hierarchy
      if (v.variant) {
        const g = v.variant.generation;
        const m = g?.model;
        const mk = m?.make;
        if (mk) setMakeId(mk.id.toString());
        if (m)  setModelId(m.id.toString());
        if (g)  setGenId(g.id.toString());
        setVariantId(v.variant.id.toString());
      }
    }).finally(() => setFetching(false));
  }, [id]);

  // Cascade: make → models
  useEffect(() => {
    if (!makeId) return;
    let active = true;
    api.get("/models", { params: { makeId } }).then(r => {
      if (!active) return;
      setModels(r.data);
      if (r.data.length === 1 && !modelId) setModelId(String(r.data[0].id));
    });
    return () => { active = false; };
  }, [makeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade: model → generations
  useEffect(() => {
    if (!modelId) return;
    let active = true;
    api.get("/generations", { params: { modelId } }).then(r => {
      if (!active) return;
      setGens(r.data);
      if (r.data.length === 1 && !genId) setGenId(String(r.data[0].id));
    });
    return () => { active = false; };
  }, [modelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade: generation → variants
  useEffect(() => {
    if (!genId) { setVariantsLoaded(false); return; }
    setVariantsLoaded(false);
    let active = true;
    api.get("/variants", { params: { generationId: genId } }).then(r => {
      if (!active) return;
      setVariants(r.data);
      setVariantsLoaded(true);
      if (r.data.length === 1 && !variantId) setVariantId(String(r.data[0].id));
    });
    return () => { active = false; };
  }, [genId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If the user picked a make but didn't navigate all the way down to a variant,
    // warn them — otherwise the vehicle hierarchy won't be saved.
    if (makeId && !variantId) {
      const noVariantsInCatalogue = genId && variantsLoaded && variants.length === 0;
      const step = !modelId ? "model" : !genId ? "generation" : "variant";
      setToast({
        message: noVariantsInCatalogue
          ? "This generation has no variants in the catalogue. Go to Catalogue → add Variants, then return here."
          : `Please also select a ${step} to complete the vehicle hierarchy.`,
        type: "error",
      });
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/vehicles/${id}`, {
        variantId:     variantId     ? +variantId     : undefined,
        vin:           vin           || undefined,
        year:          year          ? +year          : undefined,
        mileage:       mileage       ? +mileage       : undefined,
        purchasePrice: purchasePrice ? +purchasePrice : undefined,
        purchaseDate:  purchaseDate  || undefined,
        status,
        notes:         notes         || undefined,
        photos,
      });
      setToast({ message: "Vehicle updated successfully", type: "success" });
      setTimeout(() => router.push(`/vehicles/${id}`), 1000);
    } catch (err: unknown) {
      let msg: string | string[] = "Failed to update vehicle";
      if (isAxiosError<{ message?: string | string[] }>(err)) {
        msg = err.response?.data?.message ?? msg;
      }
      setToast({ message: Array.isArray(msg) ? msg.join(", ") : msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition";
  const sel = "w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-40";

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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.common.edit} {t.nav.vehicles.slice(0, -1)}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.newVehicle.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hierarchy */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Vehicle Hierarchy</p>
            {!variantId && <p className="text-xs text-[var(--text-muted)]">Select Make → Model → Generation → Variant</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Make</label>
              <select value={makeId} onChange={e => {
                setMakeId(e.target.value);
                setModelId("");
                setGenId("");
                setVariantId("");
                setModels([]);
                setGens([]);
                setVariants([]);
              }} className={sel}>
                <option value="">{t.newVehicle.selectMake}</option>
                {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Model</label>
              <select value={modelId} onChange={e => {
                setModelId(e.target.value);
                setGenId("");
                setVariantId("");
                setGens([]);
                setVariants([]);
              }} disabled={!makeId} className={sel}>
                <option value="">{t.newVehicle.selectModel}</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Generation</label>
              <select value={genId} onChange={e => {
                setGenId(e.target.value);
                setVariantId("");
                setVariants([]);
              }} disabled={!modelId} className={sel}>
                <option value="">{t.newVehicle.selectGeneration}</option>
                {generations.map(g => <option key={g.id} value={g.id}>{g.name} {g.yearStart ? `(${g.yearStart}${g.yearEnd ? `–${g.yearEnd}` : "+"})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Variant</label>
              <select value={variantId} onChange={e => setVariantId(e.target.value)} disabled={!genId} className={sel}>
                <option value="">{t.newVehicle.selectVariant}</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.name}{v.engine ? ` — ${v.engine}` : ""}</option>)}
              </select>
            </div>
          </div>

          {/* Warning: generation chosen but no variants exist in catalogue */}
          {genId && variantsLoaded && variants.length === 0 && (
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-400">No variants in catalogue for this generation</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Go to <strong className="font-semibold">Catalogue</strong> and add at least one Variant to this Generation before saving.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle details */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Vehicle Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.vin}</label>
              <input value={vin} onChange={e => setVin(e.target.value)} placeholder="WBA3B3…" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.year}</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2015" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.mileage}</label>
              <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="150000" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.purchasePrice}</label>
              <input type="number" step="0.01" value={purchasePrice} onChange={e => setPrice(e.target.value)} placeholder="800" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.purchaseDate}</label>
              <input type="date" value={purchaseDate} onChange={e => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.common.status}</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={sel}>
                <option value="in_stock">{t.status.in_stock}</option>
                <option value="scrapped">{t.status.scrapped}</option>
                <option value="sold">{t.status.sold}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.notes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional notes…"
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition resize-none" />
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
