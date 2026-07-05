"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Part } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

function SearchContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery]       = useState("");
  const [parts, setParts]       = useState<Part[]>([]);
  const [total, setTotal]       = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);
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

  const statusBadge = (status: string) => {
    if (status === "available") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
    if (status === "reserved")  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20";
    return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/20";
  };

  const conditionBadge = (c: string) => {
    if (c === "good") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
    if (c === "fair") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20";
    return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.search.title}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.search.subtitle}</p>
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors min-w-[100px]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t.search.searching}
            </span>
          ) : t.search.searchButton}
        </button>
      </form>

      {/* Results summary */}
      {searched && (
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {total === 0
            ? t.search.noResults
            : t.search.resultsFound(total!, query) + (total! > 50 ? " — showing first 50" : "")}
        </p>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-[var(--surface-raised)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">{t.search.title}</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">{t.search.tryDifferent}</p>
        </div>
      )}

      {/* Results table */}
      {parts.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.partName}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.category}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.vehicle}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.condition}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.price}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {parts.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                  onClick={() => p.vehicleId && router.push(`/vehicles/${p.vehicleId}`)}
                >
                  <td className="px-6 py-3.5 font-semibold text-[var(--text-primary)]">{p.name}</td>
                  <td className="px-6 py-3.5 text-[var(--text-secondary)] text-xs">{p.category?.name || <span className="text-[var(--text-muted)]">—</span>}</td>
                  <td className="px-6 py-3.5 text-xs text-[var(--text-secondary)] max-w-[160px] truncate">{vehicleLabel(p)}</td>
                  <td className="px-6 py-3.5">
                    <span className={conditionBadge(p.condition)}>{(t.condition as Record<string, string>)[p.condition] ?? p.condition}</span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-[var(--text-primary)]">
                    {p.price ? `€${Number(p.price).toFixed(2)}` : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={statusBadge(p.status)}>{(t.status as Record<string, string>)[p.status] ?? p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {parts.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">{t.search.clickPart}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
