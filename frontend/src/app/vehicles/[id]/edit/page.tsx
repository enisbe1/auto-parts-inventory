"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { Make, CarModel, Generation, Variant, Vehicle } from "@/lib/types";
import Toast from "@/components/Toast";

export default function EditVehiclePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

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

  if (fetching) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Vehicle</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        {/* Hierarchy */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Make</label>
            <select value={makeId} onChange={e => {
              setMakeId(e.target.value);
              setModelId("");
              setGenId("");
              setVariantId("");
              setModels([]);
              setGens([]);
              setVariants([]);
            }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select make…</option>
              {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
            <select value={modelId} onChange={e => {
              setModelId(e.target.value);
              setGenId("");
              setVariantId("");
              setGens([]);
              setVariants([]);
            }} disabled={!makeId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
              <option value="">Select model…</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Generation</label>
            <select value={genId} onChange={e => {
              setGenId(e.target.value);
              setVariantId("");
              setVariants([]);
            }} disabled={!modelId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
              <option value="">Select generation…</option>
              {generations.map(g => <option key={g.id} value={g.id}>{g.name} {g.yearStart ? `(${g.yearStart}${g.yearEnd ? `–${g.yearEnd}` : "+"})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Variant</label>
            <select value={variantId} onChange={e => setVariantId(e.target.value)} disabled={!genId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
              <option value="">Select variant…</option>
              {variants.map(v => <option key={v.id} value={v.id}>{v.name}{v.engine ? ` — ${v.engine}` : ""}</option>)}
            </select>
          </div>
        </div>

        {/* Vehicle details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">VIN</label>
            <input value={vin} onChange={e => setVin(e.target.value)} placeholder="WBA3B3…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2015"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Mileage (km)</label>
            <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="150000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Purchase Price (€)</label>
            <input type="number" step="0.01" value={purchasePrice} onChange={e => setPrice(e.target.value)} placeholder="800"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Purchase Date</label>
            <input type="date" value={purchaseDate} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="in_stock">In Stock</option>
              <option value="scrapped">Scrapped</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional notes…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border border-gray-300 px-6 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
