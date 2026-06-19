"use client";
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface Summary {
  totalPartsSold: number;
  totalRevenue: number;
  totalVehicles: number;
  totalPurchaseCost: number;
  netPL: number;
}
interface SalesDay    { day: string;    count: number; revenue: number; }
interface SalesMonth  { month: number;  count: number; revenue: number; }
interface PurchDay    { day: string;    count: number; totalCost: number; }
interface PurchMonth  { month: number;  count: number; totalCost: number; }
interface PurchYear   { year: number;   count: number; totalCost: number; }

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-2.5 shadow-xl text-xs min-w-[130px]">
      <p className="text-[var(--text-secondary)] mb-1.5 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}:{" "}
          {typeof p.value === "number" && (p.name.includes("€") || p.name.toLowerCase().includes("revenue") || p.name.toLowerCase().includes("cost"))
            ? `€${p.value.toFixed(2)}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const now = new Date();

  const [summary, setSummary]           = useState<Summary | null>(null);
  const [activeTab, setActiveTab]       = useState<"sales" | "purchases">("sales");
  const [viewMode, setViewMode]         = useState<"daily" | "monthly" | "yearly">("monthly");
  const [year, setYear]                 = useState(now.getFullYear());
  const [month, setMonth]               = useState(now.getMonth() + 1);
  const [salesDayData, setSalesDayData] = useState<SalesDay[]>([]);
  const [salesMonthData, setSalesMonthData] = useState<SalesMonth[]>([]);
  const [purchDayData, setPurchDayData]     = useState<PurchDay[]>([]);
  const [purchMonthData, setPurchMonthData] = useState<PurchMonth[]>([]);
  const [purchYearData, setPurchYearData]   = useState<PurchYear[]>([]);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    api.get("/analytics/summary").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "sales") {
        if (viewMode === "daily") {
          const r = await api.get("/analytics/sales/daily", { params: { year, month } });
          setSalesDayData(r.data);
        } else {
          const r = await api.get("/analytics/sales/monthly", { params: { year } });
          setSalesMonthData(r.data);
        }
      } else {
        if (viewMode === "daily") {
          const r = await api.get("/analytics/purchases/daily", { params: { year, month } });
          setPurchDayData(r.data);
        } else if (viewMode === "monthly") {
          const r = await api.get("/analytics/purchases/monthly", { params: { year } });
          setPurchMonthData(r.data);
        } else {
          const r = await api.get("/analytics/purchases/yearly");
          setPurchYearData(r.data);
        }
      }
    } catch {}
    setLoading(false);
  }, [activeTab, viewMode, year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  // Chart data
  const salesChartData =
    viewMode === "daily"
      ? salesDayData.map(d => ({ name: d.day.slice(8), "Revenue (€)": d.revenue, Parts: d.count }))
      : salesMonthData.map(d => ({ name: MONTHS_SHORT[d.month - 1], "Revenue (€)": d.revenue, Parts: d.count }));

  const purchChartData =
    viewMode === "daily"
      ? purchDayData.map(d => ({ name: d.day.slice(8), "Cost (€)": d.totalCost, Vehicles: d.count }))
      : viewMode === "monthly"
      ? purchMonthData.map(d => ({ name: MONTHS_SHORT[d.month - 1], "Cost (€)": d.totalCost, Vehicles: d.count }))
      : purchYearData.map(d => ({ name: String(d.year), "Cost (€)": d.totalCost, Vehicles: d.count }));

  const chartData  = activeTab === "sales" ? salesChartData : purchChartData;
  const isNoData   = !loading && chartData.length === 0;

  const netPositive = summary ? summary.netPL >= 0 : true;
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  const summaryCards = summary ? [
    { label: t.analytics.totalRevenue,  value: `€${summary.totalRevenue.toFixed(2)}`,      color: "text-emerald-400", ring: "ring-emerald-500/20", bg: "bg-emerald-500/10" },
    { label: t.analytics.totalSpent,    value: `€${summary.totalPurchaseCost.toFixed(2)}`, color: "text-red-400",     ring: "ring-red-500/20",     bg: "bg-red-500/10"     },
    { label: t.analytics.netPL,
      value: `${summary.netPL >= 0 ? "+" : ""}€${summary.netPL.toFixed(2)}`,
      color: netPositive ? "text-emerald-400" : "text-red-400",
      ring:  netPositive ? "ring-emerald-500/20" : "ring-red-500/20",
      bg:    netPositive ? "bg-emerald-500/10"   : "bg-red-500/10",
    },
    { label: t.analytics.partsSold,     value: summary.totalPartsSold,                     color: "text-blue-400",    ring: "ring-blue-500/20",    bg: "bg-blue-500/10"    },
    { label: t.analytics.vehicles,      value: summary.totalVehicles,                      color: "text-indigo-400",  ring: "ring-indigo-500/20",  bg: "bg-indigo-500/10"  },
  ] : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.analytics.title}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.analytics.subtitle}</p>
      </div>

      {/* Summary cards */}
      {summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {summaryCards.map(s => (
            <div key={s.label} className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xl shadow-black/20 ring-1 ${s.ring}`}>
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <div className={`w-3 h-3 rounded-full ${s.bg.replace('/10', '/60')}`} />
              </div>
              <p className={`text-xl font-bold ${s.color} mb-0.5 tabular-nums`}>{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      )}

      {/* Chart panel */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border)]">
          {/* Tab toggle */}
          <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1">
            {(["sales", "purchases"] as const).map(tab => (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setViewMode("monthly"); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-[var(--border-subtle)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}>
                {tab === "sales" ? t.analytics.sales : t.analytics.purchases}
              </button>
            ))}
          </div>

          {/* View mode + period */}
          <div className="flex items-center gap-2 flex-wrap">
            {(activeTab === "sales"
              ? (["daily", "monthly"] as const)
              : (["daily", "monthly", "yearly"] as const)
            ).map(v => (
              <button key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === v
                    ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/25"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                }`}>
                {t.analytics[v as "daily" | "monthly" | "yearly"]}
              </button>
            ))}

            {viewMode !== "yearly" && (
              <select value={year} onChange={e => setYear(+e.target.value)}
                className="bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-lg px-2.5 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/40">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {viewMode === "daily" && (
              <select value={month} onChange={e => setMonth(+e.target.value)}
                className="bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-lg px-2.5 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/40">
                {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className={`p-6 transition-opacity duration-200 ${loading ? "opacity-40 pointer-events-none" : ""}`}>
          {isNoData ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-sm">{t.analytics.noData}</p>
            </div>
          ) : activeTab === "sales" ? (
            <div className="space-y-8">
              {/* Revenue area chart */}
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">{t.analytics.revenueLabel}</p>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={salesChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={60} />
                    <Tooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="Revenue (€)" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Parts sold bar chart */}
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">{t.analytics.partsLabel}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={salesChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="Parts" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Purchase cost area chart */}
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">{t.analytics.costLabel}</p>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={purchChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f87171" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={60} />
                    <Tooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="Cost (€)" stroke="#f87171" strokeWidth={2} fill="url(#costGrad)" dot={false} activeDot={{ r: 4, fill: "#f87171" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Vehicles bar chart */}
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">{t.analytics.vehiclesLabel}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={purchChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="Vehicles" fill="#a78bfa" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
