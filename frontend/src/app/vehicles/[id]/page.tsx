"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Vehicle, Part } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";

export default function VehicleDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [vehicle, setVehicle]     = useState<Vehicle | null>(null);
  const [toDelete, setToDelete]   = useState<Part | null>(null);
  const [delVehicle, setDelVeh]   = useState(false);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    const { data } = await api.get(`/vehicles/${id}`);
    setVehicle(data);
  };

  useEffect(() => {
    let active = true;
    api.get(`/vehicles/${id}`).then(({ data }) => {
      if (active) setVehicle(data);
    });
    return () => { active = false; };
  }, [id]);

  const updatePartStatus = async (partId: number, status: string) => {
    try {
      await api.patch(`/parts/${partId}`, { status });
      load();
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    }
  };

  const confirmDeletePart = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/parts/${toDelete.id}`);
      setToast({ message: `Part "${toDelete.name}" deleted`, type: "success" });
      load();
    } catch {
      setToast({ message: "Failed to delete part", type: "error" });
    } finally {
      setToDelete(null);
    }
  };

  const confirmDeleteVehicle = async () => {
    try {
      await api.delete(`/vehicles/${id}`);
      router.push("/vehicles");
    } catch {
      setToast({ message: "Failed to delete vehicle", type: "error" });
      setDelVeh(false);
    }
  };

  if (!vehicle) return <div className="p-6 text-gray-500">Loading…</div>;

  const va = vehicle.variant;
  const g  = va?.generation;
  const m  = g?.model;
  const mk = m?.make;
  const title = [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${vehicle.id}`;

  const parts      = vehicle.parts ?? [];
  const available  = parts.filter(p => p.status === "available").length;
  const reserved   = parts.filter(p => p.status === "reserved").length;
  const sold       = parts.filter(p => p.status === "sold").length;

  const conditionColor = (c: string) =>
    c === "good" ? "bg-green-100 text-green-700" :
    c === "fair" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && (
        <ConfirmModal
          message={`Delete part "${toDelete.name}"?`}
          onConfirm={confirmDeletePart}
          onCancel={() => setToDelete(null)}
        />
      )}
      {delVehicle && (
        <ConfirmModal
          message={`Delete vehicle "${title}"? All its parts will be unlinked from this vehicle.`}
          onConfirm={confirmDeleteVehicle}
          onCancel={() => setDelVeh(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/vehicles")} className="text-gray-500 hover:text-gray-700 text-sm">← Vehicles</button>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            vehicle.status === "in_stock" ? "bg-green-100 text-green-700" :
            vehicle.status === "sold"     ? "bg-gray-100 text-gray-600" :
            "bg-yellow-100 text-yellow-700"
          }`}>{vehicle.status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/vehicles/${id}/edit`)}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium">
            Edit
          </button>
          <button onClick={() => setDelVeh(true)}
            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm hover:bg-red-100 font-medium">
            Delete Vehicle
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Year",           value: vehicle.year?.toString() || "—" },
          { label: "Mileage",        value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—" },
          { label: "Purchase Price", value: vehicle.purchasePrice ? `€${Number(vehicle.purchasePrice).toFixed(2)}` : "—" },
          { label: "Purchase Date",  value: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : "—" },
          { label: "VIN",            value: vehicle.vin || "—" },
          { label: "Engine",         value: va?.engine || "—" },
          { label: "Fuel",           value: va?.fuelType || "—" },
          { label: "Power",          value: va?.powerKw ? `${va.powerKw} kW` : "—" },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Parts summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Available", value: available, color: "text-green-600" },
          { label: "Reserved",  value: reserved,  color: "text-yellow-600" },
          { label: "Sold",      value: sold,       color: "text-gray-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Parts table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Parts ({parts.length})</h2>
          <Link href={`/parts/new?vehicleId=${id}`}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 font-medium">
            + Add Part
          </Link>
        </div>
        {parts.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No parts added yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Condition</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColor(p.condition)}`}>{p.condition}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.price ? `€${Number(p.price).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3">
                    <select value={p.status} onChange={e => updatePartStatus(p.id, e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/parts/${p.id}/edit`)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => setToDelete(p)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {vehicle.notes && (
        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl px-5 py-4">
          <p className="text-xs text-yellow-600 font-medium mb-1">Notes</p>
          <p className="text-sm text-gray-700">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}
