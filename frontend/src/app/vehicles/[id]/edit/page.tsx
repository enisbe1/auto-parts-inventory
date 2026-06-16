"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { Make, CarModel, Generation, Variant, Vehicle } from "@/lib/types";
import Toast from "@/components/Toast";
import { useLanguage } from "@/contexts/LanguageContext";

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

  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(true);
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
      if (active) setModels(r.data);
    });
    return () => { active = false; };
  }, [makeId]);

  // Cascade: model → generations
  useEffect(() => {
    if (!modelId) return;
    let active = true;
    api.get("/generations", { params: { modelId } }).then(r => {
      if (active) setGens(r.data);
    });
    return () => { active = false; };
  }, [modelId]);

  // Cascade: generation → variants
  useEffect(() => {
    if (!genId) return;
    let active = true;
    api.get("/variants", { params: { generationId: genId } }).then(r => {
      if (active) setVariants(r.data);
    });
    return () => { active = false; };
  }, [genId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const inp = "w-full bg-[#18181b] border border-[#27272a] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition";
  const sel = "w-full bg-[#18181b] border border-[#27272a] text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-40";

  if (fetching) return (
    <div className="p-8 flex items-center justify-center text-zinc-400">
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
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.common.back}
        </button>
        <h1 className="text-2xl font-bold text-zinc-100">{t.common.edit} {t.nav.vehicles.slice(0, -1)}</h1>
        <p className="text-zinc-400 text-sm mt-1">{t.newVehicle.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hierarchy */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Vehicle Hierarchy</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Make</label>
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
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Model</label>
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
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Generation</label>
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
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Variant</label>
              <select value={variantId} onChange={e => setVariantId(e.target.value)} disabled={!genId} className={sel}>
                <option value="">{t.newVehicle.selectVariant}</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.name}{v.engine ? ` — ${v.engine}` : ""}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle details */}
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Vehicle Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.newVehicle.vin}</label>
              <input value={vin} onChange={e => setVin(e.target.value)} placeholder="WBA3B3…" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.newVehicle.year}</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2015" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.newVehicle.mileage}</label>
              <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="150000" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.newVehicle.purchasePrice}</label>
              <input type="number" step="0.01" value={purchasePrice} onChange={e => setPrice(e.target.value)} placeholder="800" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.newVehicle.purchaseDate}</label>
              <input type="date" value={purchaseDate} onChange={e => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.common.status}</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={sel}>
                <option value="in_stock">{t.status.in_stock}</option>
                <option value="scrapped">{t.status.scrapped}</option>
                <option value="sold">{t.status.sold}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t.newVehicle.notes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional notes…"
              className="w-full bg-[#18181b] border border-[#27272a] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-[#18181b] border border-[#27272a] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300 py-2.5 rounded-xl text-sm font-medium transition-all">
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
