"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Part, Vehicle } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import ActivityFeed from "@/components/ActivityFeed";
import AlertsWidget from "@/components/AlertsWidget";

const statusBadge = (status: string) => {
  if (status === "available") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  if (status === "reserved")  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/20";
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const [vehicleMeta, setVehicleMeta] = useState<{ total: number } | null>(null);
  const [partMeta, setPartMeta]       = useState<{ total: number } | null>(null);
  const [recentParts, setRecentParts] = useState<Part[]>([]);
  const [stats, setStats] = useState({ available: 0, sold: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [vRes, pRes, avRes, soldRes] = await Promise.all([
        api.get("/vehicles", { params: { page: 1, limit: 1 } }),
        api.get("/parts",    { params: { page: 1, limit: 5 } }),
        api.get("/parts",    { params: { status: "available", page: 1, limit: 1 } }),
        api.get("/parts",    { params: { status: "sold",      page: 1, limit: 1 } }),
      ]);
      setVehicleMeta(vRes.data.meta);
      setPartMeta(pRes.data.meta);
      setRecentParts(pRes.data.data);
      setStats({ available: avRes.data.meta.total, sold: soldRes.data.meta.total });
      api.get('/activity?limit=5').then(r => setActivities(r.data)).catch(() => {});
      api.get('/alerts').then(r => setAlerts(r.data)).catch(() => {});
    })();
  }, []);

  const vehicleLabel = (p: Part) => {
    const v = p.vehicle;
    if (!v?.variant) return "—";
    const { variant: va } = v;
    const g  = va.generation;
    const m  = g?.model;
    const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ");
  };

  const statCards = [
    {
      label: t.dashboard.totalVehicles,
      value: vehicleMeta?.total ?? "—",
      href: "/vehicles",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
    {
      label: t.dashboard.totalParts,
      value: partMeta?.total ?? "—",
      href: "/parts",
      iconBg: "bg-indigo-500/15",
      iconColor: "text-indigo-400",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      ),
    },
    {
      label: t.dashboard.available,
      value: stats.available,
      href: "/parts?status=available",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t.dashboard.sold,
      value: stats.sold,
      href: "/parts?status=sold",
      iconBg: "bg-zinc-500/15",
      iconColor: "text-zinc-400",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.dashboard.title}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.dashboard.subtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all group shadow-xl shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                <span className={s.iconColor}>{s.icon}</span>
              </div>
              <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{s.value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Parts table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">{t.dashboard.recentParts}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.dashboard.last5}</p>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {recentParts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-[var(--text-muted)] text-sm">
                  {t.dashboard.noParts}
                </td>
              </tr>
            )}
            {recentParts.map((p) => (
              <tr key={p.id} className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                <td className="px-6 py-3.5 font-medium text-[var(--text-primary)]">{p.name}</td>
                <td className="px-6 py-3.5 text-[var(--text-secondary)] text-xs max-w-[180px] truncate">{vehicleLabel(p)}</td>
                <td className="px-6 py-3.5 text-[var(--text-primary)] font-medium">
                  {p.price ? `€${Number(p.price).toFixed(2)}` : <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="px-6 py-3.5">
                  <span className={statusBadge(p.status)}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alerts && (alerts.staleParts?.length > 0 || alerts.negativeVehicles?.length > 0) && (
        <AlertsWidget alerts={alerts} />
      )}

      {activities.length > 0 && (
        <div className="mt-6">
          <ActivityFeed activities={activities} />
        </div>
      )}
    </div>
  );
}
