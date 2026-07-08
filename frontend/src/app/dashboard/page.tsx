"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Part, Vehicle } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  if (status === "available") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  if (status === "reserved")  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/20";
};

function vehicleLabel(p: Part): string {
  const v = p.vehicle; if (!v?.variant) return "—";
  const va = v.variant; const g = va.generation; const m = g?.model; const mk = m?.make;
  return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ");
}

function vLabel(v: Vehicle): string {
  if (!v.variant) return `Vehicle #${v.id}`;
  const va = v.variant; const g = va.generation; const m = g?.model; const mk = m?.make;
  return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${v.id}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface RoiStat { id: number; purchasePrice: number; soldRevenue: number; availableValue: number; partsCount: number }
interface AgingPart extends Part { days: number }

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-[var(--surface-raised)] ${className}`} />;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, href, iconBg, iconColor, icon, accent,
}: {
  label: string; value: string | number; href: string;
  iconBg: string; iconColor: string; icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Link href={href}
      className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all shadow-xl shadow-black/20 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <svg className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div>
        <p className={`text-3xl font-bold mb-0.5 ${accent ?? "text-[var(--text-primary)]"}`}>{value}</p>
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [vehicleTotal, setVehicleTotal] = useState(0);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [reservedTotal, setReservedTotal] = useState(0);
  const [soldTotal, setSoldTotal] = useState(0);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [roiStats, setRoiStats] = useState<RoiStat[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentParts, setRecentParts] = useState<Part[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [vRes, avRes, soldRes, resRes, roiRes, recentRes] = await Promise.all([
          api.get("/vehicles",  { params: { page: 1, limit: 500 } }),
          api.get("/parts",     { params: { status: "available", page: 1, limit: 300 } }),
          api.get("/parts",     { params: { status: "sold",      page: 1, limit: 1   } }),
          api.get("/parts",     { params: { status: "reserved",  page: 1, limit: 1   } }),
          api.get("/vehicles/roi").catch(() => ({ data: [] })),
          api.get("/parts",     { params: { page: 1, limit: 8 } }),
        ]);
        setVehicleTotal(vRes.data.meta?.total  ?? (vRes.data.data ?? []).length);
        setVehicles(vRes.data.data ?? []);
        setAvailableTotal(avRes.data.meta?.total  ?? 0);
        setAvailableParts(avRes.data.data ?? []);
        setSoldTotal(soldRes.data.meta?.total  ?? 0);
        setReservedTotal(resRes.data.meta?.total ?? 0);
        setRoiStats(Array.isArray(roiRes.data) ? roiRes.data : []);
        setRecentParts(recentRes.data.data ?? []);
      } catch { /* silently degrade */ }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const now = Date.now();

  const agingParts = useMemo<AgingPart[]>(() => {
    return availableParts
      .map(p => ({ ...p, days: p.createdAt ? Math.floor((now - new Date(p.createdAt).getTime()) / 86400000) : 0 }))
      .filter(p => p.days >= 60)
      .sort((a, b) => b.days - a.days);
  }, [availableParts]);

  const stockValue = useMemo(
    () => availableParts.reduce((s, p) => s + (Number(p.price) || 0), 0),
    [availableParts],
  );

  const vehicleMap = useMemo(() => {
    const m = new Map<number, Vehicle>();
    vehicles.forEach(v => m.set(v.id, v));
    return m;
  }, [vehicles]);

  const roiSorted = useMemo(() =>
    roiStats
      .filter(r => r.purchasePrice > 0)
      .map(r => ({ ...r, pct: Math.min((r.soldRevenue / r.purchasePrice) * 100, 100), availPct: Math.min((r.availableValue / r.purchasePrice) * 100, 100) }))
      .sort((a, b) => (b.soldRevenue + b.availableValue) - (a.soldRevenue + a.availableValue))
      .slice(0, 7),
  [roiStats]);

  // ── Stat cards config ────────────────────────────────────────────────────────
  const statCards = [
    {
      label: t.dashboard.totalVehicles,
      value: loading ? "—" : vehicleTotal,
      href: "/vehicles",
      iconBg: "bg-blue-500/15", iconColor: "text-blue-400",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
    },
    {
      label: t.dashboard.available,
      value: loading ? "—" : availableTotal,
      href: "/parts?status=available",
      iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: t.dashboard.reserved,
      value: loading ? "—" : reservedTotal,
      href: "/parts?status=reserved",
      iconBg: "bg-amber-500/15", iconColor: "text-amber-400",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: t.dashboard.sold,
      value: loading ? "—" : soldTotal,
      href: "/parts?status=sold",
      iconBg: "bg-zinc-500/15", iconColor: "text-zinc-400",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75" /></svg>,
    },
    {
      label: t.dashboard.stockValue,
      value: loading ? "—" : `€${stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      href: "/parts",
      iconBg: "bg-purple-500/15", iconColor: "text-purple-400",
      accent: "text-purple-400",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.dashboard.title}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.dashboard.subtitle}</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Middle row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">

        {/* Aging inventory ─── left 3/5 */}
        <div className="lg:col-span-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${agingParts.length > 0 ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`}>
                {agingParts.length > 0 ? (
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t.dashboard.agingInventory}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.dashboard.partsOver60d}</p>
              </div>
            </div>
            {agingParts.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {agingParts.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="h-4 flex-1" />
                  <Shimmer className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : agingParts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">{t.dashboard.noAgingParts}</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] overflow-y-auto max-h-[340px]">
              {agingParts.map(p => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/parts/${p.id}/edit`)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                >
                  {/* Age badge */}
                  <span className={`shrink-0 inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg text-xs font-bold border ${
                    p.days >= 90
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>{p.days}d</span>

                  {/* Name + vehicle */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-blue-400 transition-colors">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{vehicleLabel(p)}</p>
                  </div>

                  {/* Price */}
                  <p className="text-sm font-semibold text-[var(--text-secondary)] shrink-0">
                    {p.price != null ? `€${Number(p.price).toFixed(0)}` : <span className="text-[var(--text-muted)]">—</span>}
                  </p>

                  {/* Arrow */}
                  <svg className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              ))}
            </div>
          )}

          {!loading && agingParts.length > 0 && (
            <div className="border-t border-[var(--border)] px-5 py-3">
              <Link href="/parts?status=available" className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors">
                View all available parts →
              </Link>
            </div>
          )}
        </div>

        {/* Vehicle ROI ─── right 2/5 */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{t.dashboard.vehicleRoi}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Cost vs. recovered revenue</p>
            </div>
            <Link href="/vehicles" className="text-xs text-blue-500 hover:text-blue-400 transition-colors font-medium">
              {t.common.viewAll}
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Shimmer className="h-3 w-3/4" />
                  <Shimmer className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : roiSorted.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6 py-10 text-center">
              <p className="text-sm text-[var(--text-muted)]">No vehicles with purchase price set</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] overflow-y-auto max-h-[340px]">
              {roiSorted.map(r => {
                const v = vehicleMap.get(r.id);
                const label = v ? vLabel(v) : `Vehicle #${r.id}`;
                const totalPct = Math.min(r.pct + r.availPct, 100);
                return (
                  <div
                    key={r.id}
                    onClick={() => router.push(`/vehicles/${r.id}`)}
                    className="px-5 py-3.5 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-blue-400 transition-colors">{label}</p>
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                        {r.pct.toFixed(0)}% {t.dashboard.recovered}
                      </span>
                    </div>
                    {/* Bar: green=sold, blue=available, grey=remaining */}
                    <div className="h-1.5 w-full rounded-full bg-[var(--surface-raised)] overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${r.pct}%` }} />
                      <div className="h-full bg-blue-500/50"                style={{ width: `${r.availPct}%` }} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--text-muted)]">
                      <span>Cost €{r.purchasePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className="text-emerald-400">Sold €{r.soldRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      {r.availableValue > 0 && <span className="text-blue-400">Available €{r.availableValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Parts ─────────────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">{t.dashboard.recentlyAdded}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Last 8 parts entered into inventory</p>
          </div>
          <Link href="/parts"
            className="text-sm text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors">
            {t.common.viewAll}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.dashboard.part}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.dashboard.vehicle}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.dashboard.price}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.status}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-6 py-3.5"><Shimmer className="h-3.5 w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : recentParts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-[var(--text-muted)] text-sm">{t.dashboard.noParts}</td>
              </tr>
            ) : recentParts.map(p => (
              <tr key={p.id}
                onClick={() => router.push(`/parts/${p.id}/edit`)}
                className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                <td className="px-6 py-3.5 font-medium text-[var(--text-primary)]">{p.name}</td>
                <td className="px-6 py-3.5 text-[var(--text-secondary)] text-xs max-w-[160px] truncate">{vehicleLabel(p)}</td>
                <td className="px-6 py-3.5 text-[var(--text-primary)] font-medium">
                  {p.price ? `€${Number(p.price).toFixed(2)}` : <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="px-6 py-3.5">
                  <span className={statusBadge(p.status)}>{(t.status as Record<string, string>)[p.status] ?? p.status}</span>
                </td>
                <td className="px-6 py-3.5 text-xs text-[var(--text-muted)]">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
