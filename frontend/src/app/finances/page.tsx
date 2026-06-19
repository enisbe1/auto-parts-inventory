"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: number;
  year: number;
  purchasePrice: string | null;
  purchaseDate: string | null;
  createdAt: string;
  variant?: {
    name: string;
    generation?: {
      name: string;
      model?: { name: string; make?: { name: string } };
    };
  };
}

interface SoldPart {
  id: number;
  name: string;
  partNumber?: string;
  price: string | null;
  soldAt: string | null;
  createdAt: string;
  vehicle?: {
    id: number;
    year: number;
    variant?: { generation?: { model?: { name: string; make?: { name: string } } } };
  };
  category?: { name: string };
}

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

type MainTab = "sellings" | "purchases" | "other";
type Granularity = "day" | "month" | "year";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const EXPENSE_CATS = [
  "Rent","Utilities","Tools & Equipment","Marketing",
  "Shipping","Insurance","Salaries","Repairs","Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | string | null | undefined) {
  const v = parseFloat(String(n ?? 0));
  return isNaN(v) ? "€0.00" : `€${v.toFixed(2)}`;
}

function vehicleName(v: Vehicle) {
  const make  = v.variant?.generation?.model?.make?.name ?? "";
  const model = v.variant?.generation?.model?.name ?? "";
  return `${v.year} ${make} ${model}`.trim() || `Vehicle #${v.id}`;
}

function partVehicle(p: SoldPart) {
  const make  = p.vehicle?.variant?.generation?.model?.make?.name ?? "";
  const model = p.vehicle?.variant?.generation?.model?.name ?? "";
  const year  = p.vehicle?.year ?? "";
  return `${year} ${make} ${model}`.trim();
}

function toDateStr(s: string | null | undefined): string {
  if (!s) return "";
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ""; }
}

function vehicleDate(v: Vehicle) {
  return v.purchaseDate && v.purchaseDate.length >= 10
    ? v.purchaseDate.slice(0, 10)
    : toDateStr(v.createdAt);
}

function groupByDate<T>(items: T[], getDate: (i: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const d = getDate(item);
    if (!d) continue;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

function groupByMonth<T>(items: T[], getDate: (i: T) => string): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const d = getDate(item);
    if (!d) continue;
    const m = parseInt(d.split("-")[1]);
    if (!map.has(m)) map.set(m, []);
    map.get(m)!.push(item);
  }
  return new Map([...map.entries()].sort((a, b) => b[0] - a[0]));
}

function sumV(vs: Vehicle[]) {
  return vs.reduce((a, v) => a + parseFloat(v.purchasePrice ?? "0"), 0);
}
function sumP(ps: SoldPart[]) {
  return ps.reduce((a, p) => a + parseFloat(p.price ?? "0"), 0);
}
function sumE(es: Expense[]) {
  return es.reduce((a, e) => a + e.amount, 0);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${open ? "rotate-90" : ""}`}
      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function RowHeader({
  date, label, count, noun, total, colorCls, open, onToggle,
}: {
  date: string; label?: string; count: number; noun: string;
  total: number; colorCls: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface-raised)] transition-all text-left"
    >
      <div className="flex items-center gap-3">
        <ChevronIcon open={open} />
        <p className="text-sm font-medium text-[var(--text-primary)]">{label ?? date}</p>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-raised)] px-2 py-0.5 rounded-full">
          {count} {noun}{count !== 1 ? "s" : ""}
        </span>
      </div>
      <p className={`text-sm font-semibold ${colorCls}`}>{fmt(total)}</p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  const now = new Date();

  const [mainTab,     setMainTab]     = useState<MainTab>("sellings");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [expGran,     setExpGran]     = useState<Granularity>("month");

  const [selectedDate,  setSelectedDate]  = useState(now.toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());

  const [vehicles,  setVehicles]  = useState<Vehicle[]>([]);
  const [soldParts, setSoldParts] = useState<SoldPart[]>([]);
  const [loadingV,  setLoadingV]  = useState(false);
  const [loadingP,  setLoadingP]  = useState(false);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExp, setNewExp] = useState({
    date: now.toISOString().slice(0, 10),
    description: "",
    category: "Other",
    amount: "",
  });

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mainTab !== "purchases" || vehicles.length) return;
    setLoadingV(true);
    api.get("/vehicles?limit=9999&page=1")
      .then(r => setVehicles(r.data?.data ?? r.data ?? []))
      .finally(() => setLoadingV(false));
  }, [mainTab, vehicles.length]);

  useEffect(() => {
    if (mainTab !== "sellings" || soldParts.length) return;
    setLoadingP(true);
    api.get("/parts?status=sold&limit=9999&page=1")
      .then(r => setSoldParts(r.data?.data ?? r.data ?? []))
      .finally(() => setLoadingP(false));
  }, [mainTab, soldParts.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ap_expenses");
      if (raw) setExpenses(JSON.parse(raw));
    } catch {}
  }, []);

  // ── Expense helpers ──────────────────────────────────────────────────────────

  const saveExpenses = (list: Expense[]) => {
    setExpenses(list);
    localStorage.setItem("ap_expenses", JSON.stringify(list));
  };

  const addExpense = () => {
    const amount = parseFloat(newExp.amount);
    if (!newExp.description.trim() || isNaN(amount) || amount <= 0) return;
    saveExpenses([...expenses, {
      id: `${Date.now()}-${Math.random()}`,
      date: newExp.date,
      description: newExp.description.trim(),
      category: newExp.category,
      amount,
    }]);
    setNewExp(p => ({ ...p, description: "", amount: "" }));
  };

  const deleteExpense = (id: string) => saveExpenses(expenses.filter(e => e.id !== id));

  const toggleRow = (key: string) =>
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Derived: Purchases ───────────────────────────────────────────────────────

  const vForDay = useMemo(() =>
    vehicles
      .filter(v => vehicleDate(v) === selectedDate)
      .sort((a, b) => vehicleDate(b).localeCompare(vehicleDate(a))),
  [vehicles, selectedDate]);

  const vForMonth = useMemo(() => {
    const f = vehicles.filter(v => {
      const d = vehicleDate(v);
      const [y, m] = d.split("-").map(Number);
      return y === selectedYear && m === selectedMonth;
    });
    return groupByDate(f, vehicleDate);
  }, [vehicles, selectedYear, selectedMonth]);

  const vForYear = useMemo(() => {
    const f = vehicles.filter(v => parseInt(vehicleDate(v).split("-")[0]) === selectedYear);
    return groupByMonth(f, vehicleDate);
  }, [vehicles, selectedYear]);

  // ── Derived: Sellings ────────────────────────────────────────────────────────

  const soldDate = (p: SoldPart) => toDateStr(p.soldAt ?? p.createdAt);

  const pForDay = useMemo(() =>
    soldParts
      .filter(p => soldDate(p) === selectedDate)
      .sort((a, b) => soldDate(b).localeCompare(soldDate(a))),
  [soldParts, selectedDate]);

  const pForMonth = useMemo(() => {
    const f = soldParts.filter(p => {
      const d = soldDate(p);
      const [y, m] = d.split("-").map(Number);
      return y === selectedYear && m === selectedMonth;
    });
    return groupByDate(f, soldDate);
  }, [soldParts, selectedYear, selectedMonth]);

  const pForYear = useMemo(() => {
    const f = soldParts.filter(p => parseInt(soldDate(p).split("-")[0]) === selectedYear);
    return groupByMonth(f, soldDate);
  }, [soldParts, selectedYear]);

  // ── Derived: Expenses ────────────────────────────────────────────────────────

  const eForDay = useMemo(() =>
    expenses.filter(e => e.date === selectedDate),
  [expenses, selectedDate]);

  const eForMonth = useMemo(() => {
    const f = expenses.filter(e => {
      const [y, m] = e.date.split("-").map(Number);
      return y === selectedYear && m === selectedMonth;
    });
    return groupByDate(f, e => e.date);
  }, [expenses, selectedYear, selectedMonth]);

  const eForYear = useMemo(() => {
    const f = expenses.filter(e => parseInt(e.date.split("-")[0]) === selectedYear);
    return groupByMonth(f, e => e.date);
  }, [expenses, selectedYear]);

  // ── Shared classes ───────────────────────────────────────────────────────────

  const tabCls = (a: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      a ? "bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
    }`;

  const granCls = (a: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
      a ? "bg-[var(--surface-raised)] text-[var(--text-primary)] ring-1 ring-[var(--border)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
    }`;

  const inputCls = "px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  // ── Date pickers ─────────────────────────────────────────────────────────────

  const DatePicker = ({ g }: { g: Granularity }) => (
    <div className="flex items-center gap-2 flex-wrap">
      {g === "day" && (
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputCls} />
      )}
      {g === "month" && (
        <>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className={inputCls}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={`${inputCls} w-24`} />
        </>
      )}
      {g === "year" && (
        <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={`${inputCls} w-28`} />
      )}
    </div>
  );

  // ── Render: Purchases ─────────────────────────────────────────────────────────

  function renderPurchases() {
    if (loadingV) return <Spinner label="Loading vehicles…" />;

    if (granularity === "day") {
      return (
        <div>
          <SummaryLine count={vForDay.length} noun="vehicle" total={sumV(vForDay)} colorCls="text-[var(--text-primary)]" label={`on ${selectedDate}`} />
          {vForDay.length === 0
            ? <Empty msg="No vehicles purchased on this date" />
            : <div className="space-y-2">
                {vForDay.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{vehicleName(v)}</p>
                      <p className="text-xs text-[var(--text-muted)]">Purchased {vehicleDate(v)}</p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{fmt(v.purchasePrice)}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      );
    }

    if (granularity === "month") {
      const allV = [...vForMonth.values()].flat();
      return (
        <div>
          <SummaryLine count={allV.length} noun="vehicle" total={sumV(allV)} colorCls="text-[var(--text-primary)]"
            label={`in ${MONTHS[selectedMonth - 1]} ${selectedYear}`} totalLabel="Month total" />
          {vForMonth.size === 0
            ? <Empty msg={`No purchases in ${MONTHS[selectedMonth - 1]} ${selectedYear}`} />
            : <div className="space-y-1">
                {[...vForMonth.entries()].map(([date, vs]) => {
                  const key = `p-m-${date}`;
                  const open = expandedRows.has(key);
                  return (
                    <div key={date} className="rounded-lg border border-[var(--border)] overflow-hidden">
                      <RowHeader date={date} count={vs.length} noun="vehicle" total={sumV(vs)}
                        colorCls="text-[var(--text-primary)]" open={open} onToggle={() => toggleRow(key)} />
                      {open && (
                        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                          {vs.map(v => (
                            <div key={v.id} className="flex items-center justify-between px-6 py-2.5 hover:bg-[var(--surface-raised)] transition-all">
                              <p className="text-sm text-[var(--text-primary)]">{vehicleName(v)}</p>
                              <p className="text-sm text-[var(--text-secondary)]">{fmt(v.purchasePrice)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          }
        </div>
      );
    }

    // Year
    const allV = [...vForYear.values()].flat();
    return (
      <div>
        <SummaryLine count={allV.length} noun="vehicle" total={sumV(allV)} colorCls="text-[var(--text-primary)]"
          label={`in ${selectedYear}`} totalLabel="Year total" />
        {vForYear.size === 0
          ? <Empty msg={`No purchases in ${selectedYear}`} />
          : <div className="space-y-1">
              {[...vForYear.entries()].map(([month, vs]) => {
                const key = `p-y-${month}`;
                const open = expandedRows.has(key);
                const byDay = groupByDate(vs, vehicleDate);
                return (
                  <div key={month} className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <RowHeader date={`${month}`} label={`${MONTHS[month - 1]} ${selectedYear}`}
                      count={vs.length} noun="vehicle" total={sumV(vs)}
                      colorCls="text-[var(--text-primary)]" open={open} onToggle={() => toggleRow(key)} />
                    {open && (
                      <div className="border-t border-[var(--border-subtle)]">
                        {[...byDay.entries()].map(([date, dayVs]) => (
                          <div key={date}>
                            <div className="flex justify-between px-6 py-2 bg-[var(--surface)] border-b border-[var(--border-subtle)]">
                              <p className="text-xs font-semibold text-[var(--text-muted)]">{date}</p>
                              <p className="text-xs font-semibold text-[var(--text-muted)]">{fmt(sumV(dayVs))}</p>
                            </div>
                            {dayVs.map(v => (
                              <div key={v.id} className="flex items-center justify-between px-8 py-2 hover:bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] last:border-0 transition-all">
                                <p className="text-sm text-[var(--text-primary)]">{vehicleName(v)}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{fmt(v.purchasePrice)}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        }
      </div>
    );
  }

  // ── Render: Sellings ──────────────────────────────────────────────────────────

  function renderSellings() {
    if (loadingP) return <Spinner label="Loading sold parts…" />;

    if (granularity === "day") {
      return (
        <div>
          <SummaryLine count={pForDay.length} noun="part" total={sumP(pForDay)} colorCls="text-green-400" label={`sold on ${selectedDate}`} />
          {pForDay.length === 0
            ? <Empty msg="No parts sold on this date" />
            : <div className="space-y-2">
                {pForDay.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {partVehicle(p) ? `From ${partVehicle(p)}` : ""}
                        {p.category?.name ? ` · ${p.category.name}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-400">{fmt(p.price)}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      );
    }

    if (granularity === "month") {
      const allP = [...pForMonth.values()].flat();
      return (
        <div>
          <SummaryLine count={allP.length} noun="part" total={sumP(allP)} colorCls="text-green-400"
            label={`sold in ${MONTHS[selectedMonth - 1]} ${selectedYear}`} totalLabel="Month revenue" />
          {pForMonth.size === 0
            ? <Empty msg={`No sales in ${MONTHS[selectedMonth - 1]} ${selectedYear}`} />
            : <div className="space-y-1">
                {[...pForMonth.entries()].map(([date, ps]) => {
                  const key = `s-m-${date}`;
                  const open = expandedRows.has(key);
                  return (
                    <div key={date} className="rounded-lg border border-[var(--border)] overflow-hidden">
                      <RowHeader date={date} count={ps.length} noun="part" total={sumP(ps)}
                        colorCls="text-green-400" open={open} onToggle={() => toggleRow(key)} />
                      {open && (
                        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                          {ps.map(p => (
                            <div key={p.id} className="flex items-center justify-between px-6 py-2.5 hover:bg-[var(--surface-raised)] transition-all">
                              <div>
                                <p className="text-sm text-[var(--text-primary)]">{p.name}</p>
                                {partVehicle(p) && <p className="text-xs text-[var(--text-muted)]">From {partVehicle(p)}</p>}
                              </div>
                              <p className="text-sm text-green-400">{fmt(p.price)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          }
        </div>
      );
    }

    // Year
    const allP = [...pForYear.values()].flat();
    return (
      <div>
        <SummaryLine count={allP.length} noun="part" total={sumP(allP)} colorCls="text-green-400"
          label={`sold in ${selectedYear}`} totalLabel="Year revenue" />
        {pForYear.size === 0
          ? <Empty msg={`No sales in ${selectedYear}`} />
          : <div className="space-y-1">
              {[...pForYear.entries()].map(([month, ps]) => {
                const key = `s-y-${month}`;
                const open = expandedRows.has(key);
                const byDay = groupByDate(ps, soldDate);
                return (
                  <div key={month} className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <RowHeader date={`${month}`} label={`${MONTHS[month - 1]} ${selectedYear}`}
                      count={ps.length} noun="part" total={sumP(ps)}
                      colorCls="text-green-400" open={open} onToggle={() => toggleRow(key)} />
                    {open && (
                      <div className="border-t border-[var(--border-subtle)]">
                        {[...byDay.entries()].map(([date, dayPs]) => (
                          <div key={date}>
                            <div className="flex justify-between px-6 py-2 bg-[var(--surface)] border-b border-[var(--border-subtle)]">
                              <p className="text-xs font-semibold text-[var(--text-muted)]">{date}</p>
                              <p className="text-xs font-semibold text-green-400/70">{fmt(sumP(dayPs))}</p>
                            </div>
                            {dayPs.map(p => (
                              <div key={p.id} className="flex items-center justify-between px-8 py-2 hover:bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] last:border-0 transition-all">
                                <div>
                                  <p className="text-sm text-[var(--text-primary)]">{p.name}</p>
                                  {partVehicle(p) && <p className="text-xs text-[var(--text-muted)]">From {partVehicle(p)}</p>}
                                </div>
                                <p className="text-sm text-green-400">{fmt(p.price)}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        }
      </div>
    );
  }

  // ── Render: Other Spendings ───────────────────────────────────────────────────

  function renderOtherSpendings() {
    const renderExpList = (es: Expense[], nested = false) =>
      es.map(e => (
        <div key={e.id}
          className={`flex items-center justify-between py-2.5 hover:bg-[var(--surface-raised)] group transition-all ${nested ? "px-6 border-b border-[var(--border-subtle)] last:border-0" : "px-4 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] mb-2"}`}
        >
          <div>
            <p className="text-sm text-[var(--text-primary)]">{e.description}</p>
            <p className="text-xs text-[var(--text-muted)]">{e.category}{nested ? "" : ` · ${e.date}`}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-orange-400">{fmt(e.amount)}</p>
            <button
              onClick={() => deleteExpense(e.id)}
              className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ));

    const renderGrouped = (
      map: Map<string | number, Expense[]>,
      keyPrefix: string,
      labelFn: (k: string | number) => string,
    ) => (
      <div className="space-y-1">
        {[...map.entries()].map(([k, es]) => {
          const rowKey = `${keyPrefix}-${k}`;
          const open = expandedRows.has(rowKey);
          return (
            <div key={rowKey} className="rounded-lg border border-[var(--border)] overflow-hidden">
              <RowHeader date={String(k)} label={labelFn(k)} count={es.length} noun="expense"
                total={sumE(es)} colorCls="text-orange-400" open={open} onToggle={() => toggleRow(rowKey)} />
              {open && (
                <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                  {renderExpList(es, true)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Add form */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Add Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Date</label>
              <input type="date" value={newExp.date} onChange={e => setNewExp(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
              <input type="text" value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Monthly rent"
                onKeyDown={e => e.key === "Enter" && addExpense()}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Category</label>
              <select value={newExp.category} onChange={e => setNewExp(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Amount (€)</label>
              <div className="flex gap-2">
                <input type="number" value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00" min="0" step="0.01"
                  onKeyDown={e => e.key === "Enter" && addExpense()}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button onClick={addExpense}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* All-time total badge */}
        {expenses.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-orange-400">All-time total: {fmt(sumE(expenses))}</p>
              <p className="text-xs text-[var(--text-muted)]">{expenses.length} expense record{expenses.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {/* Granularity + date pickers */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border-subtle)]">
            {(["day", "month", "year"] as Granularity[]).map(g => (
              <button key={g} onClick={() => setExpGran(g)} className={granCls(expGran === g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          <DatePicker g={expGran} />
        </div>

        {/* List */}
        {expGran === "day" && (
          <div>
            <SummaryLine count={eForDay.length} noun="expense" total={sumE(eForDay)} colorCls="text-orange-400" label={`on ${selectedDate}`} />
            {eForDay.length === 0
              ? <Empty msg="No expenses on this date" />
              : renderExpList(eForDay)
            }
          </div>
        )}
        {expGran === "month" && (
          <div>
            <SummaryLine count={[...eForMonth.values()].flat().length} noun="expense"
              total={sumE([...eForMonth.values()].flat())} colorCls="text-orange-400"
              label={`in ${MONTHS[selectedMonth - 1]} ${selectedYear}`} totalLabel="Month total" />
            {eForMonth.size === 0
              ? <Empty msg={`No expenses in ${MONTHS[selectedMonth - 1]} ${selectedYear}`} />
              : renderGrouped(eForMonth as Map<string, Expense[]>, "e-m", k => String(k))
            }
          </div>
        )}
        {expGran === "year" && (
          <div>
            <SummaryLine count={[...eForYear.values()].flat().length} noun="expense"
              total={sumE([...eForYear.values()].flat())} colorCls="text-orange-400"
              label={`in ${selectedYear}`} totalLabel="Year total" />
            {eForYear.size === 0
              ? <Empty msg={`No expenses in ${selectedYear}`} />
              : renderGrouped(
                  new Map([...eForYear.entries()].map(([m, es]) => [m, es])) as Map<number, Expense[]>,
                  "e-y",
                  k => `${MONTHS[(k as number) - 1]} ${selectedYear}`,
                )
            }
          </div>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Finances</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Track vehicle purchases, part sales, and other business expenses
          </p>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] w-fit">
          {([
            ["sellings",  "Sellings"],
            ["purchases", "Purchases"],
            ["other",     "Other Spendings"],
          ] as [MainTab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setMainTab(k)} className={tabCls(mainTab === k)}>{l}</button>
          ))}
        </div>

        {/* Content */}
        {mainTab !== "other" ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {/* Controls bar */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border-subtle)] flex-wrap">
              <div className="flex gap-1 p-1 rounded-lg bg-[var(--background)] border border-[var(--border-subtle)]">
                {(["day", "month", "year"] as Granularity[]).map(g => (
                  <button key={g} onClick={() => { setGranularity(g); setExpandedRows(new Set()); }} className={granCls(granularity === g)}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
              <DatePicker g={granularity} />
            </div>

            {/* Body */}
            <div className="p-5">
              {mainTab === "purchases" ? renderPurchases() : renderSellings()}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {renderOtherSpendings()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-12 justify-center">
      <div className="w-4 h-4 border-2 border-[var(--border)] border-t-blue-400 rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-center py-12 text-sm text-[var(--text-muted)]">{msg}</p>;
}

function SummaryLine({
  count, noun, total, colorCls, label, totalLabel = "Total",
}: {
  count: number; noun: string; total: number; colorCls: string;
  label: string; totalLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-[var(--text-muted)]">
        {count} {noun}{count !== 1 ? "s" : ""} {label}
      </p>
      <p className={`text-sm font-semibold ${colorCls}`}>{totalLabel}: {fmt(total)}</p>
    </div>
  );
}
