"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Part } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";

interface PaginatedParts {
  data: Part[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function PartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult]         = useState<PaginatedParts | null>(null);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState(searchParams.get("search") || "");
  const [status, setStatus]         = useState(searchParams.get("status") || "");
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("available");
  const [toDelete, setToDelete]     = useState<Part | null>(null);
  const [bulkDelConfirm, setBulkDel] = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [bulkLoading, setBulkLoad]  = useState(false);
  const limit = 20;

  const load = async (p: number) => {
    const params: Record<string, string | number> = { page: p, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    const { data } = await api.get("/parts", { params });
    setResult(data);
    setSelected(new Set());
  };

  useEffect(() => { load(page); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setPage(1); load(1);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleOne = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    const ids = (result?.data ?? []).map(p => p.id);
    if (selected.size === ids.length) setSelected(new Set());
    else setSelected(new Set(ids));
  };

  // ── Bulk status update ────────────────────────────────────────────────────
  const bulkUpdateStatus = async () => {
    if (selected.size === 0) return;
    setBulkLoad(true);
    try {
      await Promise.all([...selected].map(id => api.patch(`/parts/${id}`, { status: bulkStatus })));
      setToast({ message: `${selected.size} parts marked as ${bulkStatus}`, type: "success" });
      load(page);
    } catch {
      setToast({ message: "Some updates failed", type: "error" });
    } finally { setBulkLoad(false); }
  };

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const bulkDelete = async () => {
    setBulkLoad(true);
    try {
      await Promise.all([...selected].map(id => api.delete(`/parts/${id}`)));
      setToast({ message: `${selected.size} parts deleted`, type: "success" });
      load(page);
    } catch {
      setToast({ message: "Some deletes failed", type: "error" });
    } finally { setBulkLoad(false); setBulkDel(false); }
  };

  // ── Single delete ─────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/parts/${toDelete.id}`);
      setToast({ message: `Part "${toDelete.name}" deleted`, type: "success" });
      load(page);
    } catch {
      setToast({ message: "Failed to delete part", type: "error" });
    } finally { setToDelete(null); }
  };

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    const params: Record<string, string | number> = { page: 1, limit: 10000 };
    if (search) params.search = search;
    if (status) params.status = status;
    const { data } = await api.get("/parts", { params });
    const parts: Part[] = data.data;
    const headers = ["ID","Name","Part Number","Category","Vehicle","Condition","Price (EUR)","Status","Notes","Created At"];
    const rows = parts.map(p => {
      const v = p.vehicle; const va = v?.variant;
      const vLabel = va
        ? [va.generation?.model?.make?.name, va.generation?.model?.name, va.generation?.code, va.name].filter(Boolean).join(" ")
        : (v ? `Vehicle #${v.id}` : "");
      return [p.id, `"${p.name}"`, p.partNumber||"", p.category?.name||"", vLabel, p.condition, p.price??"", p.status, `"${(p.notes||"").replace(/"/g,"'")}"`, p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `parts-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    setToast({ message: `Exported ${parts.length} parts to CSV`, type: "success" });
  };

  const vehicleLabel = (p: Part) => {
    const v = p.vehicle; if (!v) return "—";
    const va = v.variant; const g = va?.generation; const m = g?.model; const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${v.id}`;
  };

  const conditionColor = (c: string) =>
    c === "good" ? "bg-green-100 text-green-700" : c === "fair" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  const parts  = result?.data ?? [];
  const meta   = result?.meta;
  const allSel = parts.length > 0 && selected.size === parts.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && <ConfirmModal message={`Delete part "${toDelete.name}"?`} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}
      {bulkDelConfirm && (
        <ConfirmModal
          message={`Delete ${selected.size} selected parts? This cannot be undone.`}
          onConfirm={bulkDelete}
          onCancel={() => setBulkDel(false)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parts Inventory</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium">
            ↓ Export CSV
          </button>
          <Link href="/parts/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Add Part
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">Filter</button>
      </form>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4 text-sm">
          <span className="font-medium text-blue-700">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-500">Mark as:</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none">
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
            <button onClick={bulkUpdateStatus} disabled={bulkLoading}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {bulkLoading ? "Updating…" : "Apply"}
            </button>
            <button onClick={() => setBulkDel(true)} disabled={bulkLoading}
              className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-sm hover:bg-red-100 disabled:opacity-50">
              Delete selected
            </button>
            <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-gray-600 text-xs">✕ Clear</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={allSel} onChange={toggleAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Part Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Part No.</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Condition</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No parts found</td></tr>
            )}
            {parts.map(p => (
              <tr key={p.id} className={`border-b hover:bg-gray-50 ${selected.has(p.id) ? "bg-blue-50" : ""}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.partNumber || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name || "—"}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{vehicleLabel(p)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColor(p.condition)}`}>{p.condition}</span>
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium">{p.price ? `€${Number(p.price).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === "available" ? "bg-green-100 text-green-700" :
                    p.status === "reserved"  ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{p.status}</span>
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
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>{meta.total} parts — page {meta.page} of {meta.totalPages}</span>
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

export default function PartsPage() {
  return <Suspense fallback={<div className="p-6 text-gray-500">Loading parts…</div>}><PartsContent /></Suspense>;
}
