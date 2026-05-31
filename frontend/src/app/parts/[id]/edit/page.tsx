"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { Vehicle, Category, Part } from "@/lib/types";
import Toast from "@/components/Toast";

export default function EditPartPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

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

  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      setVehicles(vehiclesRes.data.data);
      setCategories(catsRes.data);
    }).finally(() => setFetching(false));
  }, [id]);

  const vehicleLabel = (v: Vehicle) => {
    const va = v.variant;
    if (!va) return `Vehicle #${v.id}`;
    const g  = va.generation;
    const m  = g?.model;
    const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va.name].filter(Boolean).join(" ") + (v.year ? ` (${v.year})` : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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

  if (fetching) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Part</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Part Name <span className="text-red-500">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Part Number</label>
            <input value={partNumber} onChange={e => setPartNum(e.target.value)} placeholder="OEM or aftermarket"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Price (€)</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
          <select value={categoryId} onChange={e => setCatId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
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
