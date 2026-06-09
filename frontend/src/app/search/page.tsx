"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Part } from "@/lib/types";

function SearchContent() {
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [parts, setParts]     = useState<Part[]>([]);
  const [total, setTotal]     = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get("/parts", { params: { search: query.trim(), page: 1, limit: 50 } });
      setParts(data.data);
      setTotal(data.meta.total);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const vehicleLabel = (p: Part) => {
    const v = p.vehicle;
    if (!v) return "—";
    const va = v.variant;
    const g  = va?.generation;
    const m  = g?.model;
    const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${v.id}`;
  };

  const conditionColor = (c: string) =>
    c === "good" ? "bg-green-100 text-green-700" :
    c === "fair" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Search Parts</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by part name…"
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {searched && (
        <p className="text-sm text-gray-500 mb-4">
          {total === 0 ? "No parts found" : `Found ${total} part${total !== 1 ? "s" : ""}${total! > 50 ? " — showing first 50" : ""}`}
        </p>
      )}

      {parts.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Part Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Condition</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => p.vehicleId && router.push(`/vehicles/${p.vehicleId}`)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{vehicleLabel(p)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColor(p.condition)}`}>{p.condition}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.price ? `€${Number(p.price).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === "available" ? "bg-green-100 text-green-700" :
                      p.status === "reserved"  ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{p.status}</span>
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

export default function SearchPage() {
  return <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}><SearchContent /></Suspense>;
}
