"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Vehicle } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";

interface PaginatedVehicles {
  data: Vehicle[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function VehiclesPage() {
  const router = useRouter();
  const [result, setResult]     = useState<PaginatedVehicles | null>(null);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [toast, setToast]       = useState<{ message: string; type: "success" | "error" } | null>(null);
  const limit = 20;

  const load = async (p: number, q: string) => {
    const params: Record<string, string | number> = { page: p, limit };
    if (q) params.search = q;
    const { data } = await api.get("/vehicles", { params });
    setResult(data);
  };

  useEffect(() => { load(page, search); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/vehicles/${toDelete.id}`);
      setToast({ message: `Vehicle #${toDelete.id} deleted`, type: "success" });
      load(page, search);
    } catch {
      setToast({ message: "Failed to delete vehicle", type: "error" });
    } finally {
      setToDelete(null);
    }
  };

  const label = (v: Vehicle) => {
    const va = v.variant;
    if (!va) return `Vehicle #${v.id}`;
    const g = va.generation;
    const m = g?.model;
    const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va.name].filter(Boolean).join(" ");
  };

  const vehicles = result?.data ?? [];
  const meta     = result?.meta;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && (
        <ConfirmModal
          message={`Delete ${label(toDelete)}? This will also remove all its parts.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
        <Link href="/vehicles/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Add Vehicle
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by VIN…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">Search</button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">VIN</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Year</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Mileage</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No vehicles found</td></tr>
            )}
            {vehicles.map(v => (
              <tr key={v.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/vehicles/${v.id}`)}>
                <td className="px-4 py-3 text-gray-500">{v.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{label(v)}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{v.vin || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{v.year || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{v.mileage ? `${v.mileage.toLocaleString()} km` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    v.status === "in_stock" ? "bg-green-100 text-green-700" :
                    v.status === "sold"     ? "bg-gray-100 text-gray-600"   :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{v.status}</span>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/vehicles/${v.id}`)} className="text-blue-600 hover:underline text-xs">View</button>
                    <button onClick={() => setToDelete(v)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>{meta.total} vehicles — page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">← Prev</button>
            <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
