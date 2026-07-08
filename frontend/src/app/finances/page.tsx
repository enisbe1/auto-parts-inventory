"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: number;
  year: number;
  purchasePrice: string | null;
  purchaseDate: string | null;
  createdAt: string;
  variant?: { generation?: { model?: { name: string; make?: { name: string } } } };
}

interface SoldPart {
  id: number;
  name: string;
  price: string | null;
  soldAt: string | null;
  createdAt: string;
  vehicle?: { year: number; variant?: { generation?: { model?: { name: string; make?: { name: string } } } } };
  category?: { name: string };
}

interface ManualEntry {
  id: number;
  type: "income" | "expense";
  date: string;
  description: string;
  category: string;
  amount: string;
  notes?: string;
}

type MainTab = "sellings" | "purchases";

interface UnifiedItem {
  key: string;
  date: string;
  label: string;
  sub: string;
  amount: number;
  amtCls: string;
  badgeText: string;
  badgeCls: string;
  onDelete?: () => void;
}
type Granularity = "day" | "month" | "year";
type FormState = { date: string; description: string; category: string; amount: string; notes: string };

// ─── Locale map for Intl month names ─────────────────────────────────────────

const localeMap: Record<string, string> = { en: "en-US", de: "de-DE", al: "sq-AL" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string | null | undefined) => {
  const v = parseFloat(String(n ?? 0));
  return isNaN(v) ? "€0.00" : `€${v.toFixed(2)}`;
};

const vehicleName = (v: Vehicle) => {
  const make  = v.variant?.generation?.model?.make?.name ?? "";
  const model = v.variant?.generation?.model?.name ?? "";
  return `${v.year} ${make} ${model}`.trim() || `Vehicle #${v.id}`;
};

const partVehicle = (p: SoldPart) => {
  const make  = p.vehicle?.variant?.generation?.model?.make?.name ?? "";
  const model = p.vehicle?.variant?.generation?.model?.name ?? "";
  return `${p.vehicle?.year ?? ""} ${make} ${model}`.trim();
};

const toDateStr = (s: string | null | undefined) => {
  if (!s) return "";
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ""; }
};

const vehicleDate = (v: Vehicle) =>
  (v.purchaseDate && v.purchaseDate.length >= 10) ? v.purchaseDate.slice(0, 10) : toDateStr(v.createdAt);

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

const sumV  = (vs: Vehicle[])     => vs.reduce((a, v) => a + parseFloat(v.purchasePrice ?? "0"), 0);
const sumP  = (ps: SoldPart[])    => ps.reduce((a, p) => a + parseFloat(p.price ?? "0"), 0);
const sumM  = (ms: ManualEntry[]) => ms.reduce((a, m) => a + parseFloat(m.amount ?? "0"), 0);

// ─── Module-scope CSS (prevents class recreation on every render) ─────────────

const formInputCls = "w-full px-3 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

// ─── AddEntryForm — defined OUTSIDE FinancesPage to prevent remount on state changes ──

interface AddEntryFormLabels {
  title: string; date: string; description: string; category: string;
  amount: string; add: string; incomePlaceholder: string; expensePlaceholder: string;
}

function AddEntryForm({ type, cats, form, setForm, onAdd, saving, labels }: {
  type: "income" | "expense";
  cats: readonly string[];
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onAdd: () => void;
  saving: boolean;
  labels: AddEntryFormLabels;
}) {
  const placeholder = type === "income" ? labels.incomePlaceholder : labels.expensePlaceholder;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 mb-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{labels.title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{labels.date}</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={formInputCls} />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{labels.description}</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder={placeholder}
            onKeyDown={e => e.key === "Enter" && onAdd()}
            className={formInputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{labels.category}</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={formInputCls}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{labels.amount}</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00" min="0" step="0.01"
              onKeyDown={e => e.key === "Enter" && onAdd()}
              className={`${formInputCls} flex-1`}
            />
            <button
              onClick={onAdd}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 ${
                type === "income" ? "bg-green-600 hover:bg-green-500" : "bg-orange-600 hover:bg-orange-500"
              }`}
            >
              {labels.add}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${open ? "rotate-90" : ""}`}
      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function RowHeader({ label, count, noun, total, colorCls, open, onToggle }: {
  label: string; count: number; noun: string;
  total: number; colorCls: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--surface-raised)] transition-all text-left">
      <div className="flex items-center gap-3">
        <ChevronIcon open={open} />
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-raised)] px-2 py-0.5 rounded-full">
          {count} {noun}{count !== 1 ? "s" : ""}
        </span>
      </div>
      <p className={`text-sm font-semibold ${colorCls}`}>{fmt(total)}</p>
    </button>
  );
}

function SummaryLine({ count, noun, total, colorCls, label, totalLabel }: {
  count: number; noun: string; total: number; colorCls: string; label: string; totalLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-[var(--text-muted)]">{count} {noun}{count !== 1 ? "s" : ""} {label}</p>
      <p className={`text-sm font-semibold ${colorCls}`}>{totalLabel}: {fmt(total)}</p>
    </div>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  const { t, lang } = useLanguage();
  const tf = t.finances;
  const now = new Date();
  const locale = localeMap[lang] ?? "en-US";
  const monthName = useCallback(
    (m: number) => new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2000, m - 1, 1)),
    [locale],
  );

  const [mainTab,         setMainTab]         = useState<MainTab>("sellings");
  const [showAddIncome,   setShowAddIncome]   = useState(false);
  const [showAddExpense,  setShowAddExpense]  = useState(false);
  const [granularity,   setGranularity]   = useState<Granularity>("month");
  const [selectedDate,  setSelectedDate]  = useState(now.toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [expandedRows,  setExpandedRows]  = useState<Set<string>>(new Set());

  const [vehicles,       setVehicles]       = useState<Vehicle[]>([]);
  const [soldParts,      setSoldParts]      = useState<SoldPart[]>([]);
  const [incomeEntries,  setIncomeEntries]  = useState<ManualEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ManualEntry[]>([]);

  const [loadingV, setLoadingV] = useState(false);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingI, setLoadingI] = useState(false);
  const [loadingE, setLoadingE] = useState(false);

  const emptyForm: FormState = { date: now.toISOString().slice(0, 10), description: "", category: "", amount: "", notes: "" };
  const [newIncome,  setNewIncome]  = useState<FormState>({ ...emptyForm, category: "Other" });
  const [newExpense, setNewExpense] = useState<FormState>({ ...emptyForm, category: "Other" });
  const [saving, setSaving] = useState(false);

  // ── Fetchers ──────────────────────────────────────────────────────────────────

  const loadVehicles = useCallback(() => {
    if (vehicles.length) return;
    setLoadingV(true);
    api.get("/vehicles?limit=9999&page=1")
      .then(r => setVehicles(r.data?.data ?? r.data ?? []))
      .finally(() => setLoadingV(false));
  }, [vehicles.length]);

  const loadSoldParts = useCallback(() => {
    if (soldParts.length) return;
    setLoadingP(true);
    api.get("/parts?status=sold&limit=9999&page=1")
      .then(r => setSoldParts(r.data?.data ?? r.data ?? []))
      .finally(() => setLoadingP(false));
  }, [soldParts.length]);

  const loadIncome = useCallback(() => {
    setLoadingI(true);
    api.get("/manual-entries?type=income")
      .then(r => setIncomeEntries(r.data ?? []))
      .finally(() => setLoadingI(false));
  }, []);

  const loadExpenses = useCallback(() => {
    setLoadingE(true);
    api.get("/manual-entries?type=expense")
      .then(r => setExpenseEntries(r.data ?? []))
      .finally(() => setLoadingE(false));
  }, []);

  useEffect(() => {
    if (mainTab === "sellings")  { loadSoldParts(); loadIncome(); }
    if (mainTab === "purchases") { loadVehicles();  loadExpenses(); }
  }, [mainTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Entry CRUD ────────────────────────────────────────────────────────────────

  const addEntry = async (type: "income" | "expense") => {
    const form = type === "income" ? newIncome : newExpense;
    const amount = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await api.post("/manual-entries", { type, ...form, amount });
      if (type === "income") { setNewIncome({ ...emptyForm, category: "Other" }); loadIncome(); }
      else                   { setNewExpense({ ...emptyForm, category: "Other" }); loadExpenses(); }
    } finally { setSaving(false); }
  };

  const deleteEntry = async (id: number, type: "income" | "expense") => {
    await api.delete(`/manual-entries/${id}`);
    if (type === "income") loadIncome();
    else                   loadExpenses();
  };

  const toggleRow = (key: string) =>
    setExpandedRows(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // ── Styles ────────────────────────────────────────────────────────────────────

  const tabCls = (a: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
      a ? "bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
    }`;

  const granCls = (a: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
      a ? "bg-[var(--surface-raised)] text-[var(--text-primary)] ring-1 ring-[var(--border)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
    }`;

  const inputCls = "px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  // ── Date picker ───────────────────────────────────────────────────────────────

  const DatePicker = ({ g }: { g: Granularity }) => (
    <div className="flex items-center gap-2 flex-wrap">
      {g === "day" && (
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputCls} />
      )}
      {g === "month" && (
        <>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className={inputCls}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{monthName(i + 1)}</option>
            ))}
          </select>
          <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={`${inputCls} w-24`} />
        </>
      )}
      {g === "year" && (
        <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={`${inputCls} w-28`} />
      )}
    </div>
  );

  // ── Derived data ──────────────────────────────────────────────────────────────

  const soldDate = (p: SoldPart) => toDateStr(p.soldAt ?? p.createdAt);

  const vFiltered = useMemo(() => {
    if (granularity === "day")   return vehicles.filter(v => vehicleDate(v) === selectedDate);
    if (granularity === "month") return vehicles.filter(v => { const d = vehicleDate(v); const [y, m] = d.split("-").map(Number); return y === selectedYear && m === selectedMonth; });
    return vehicles.filter(v => parseInt(vehicleDate(v).split("-")[0]) === selectedYear);
  }, [vehicles, granularity, selectedDate, selectedMonth, selectedYear]);

  const pFiltered = useMemo(() => {
    if (granularity === "day")   return soldParts.filter(p => soldDate(p) === selectedDate);
    if (granularity === "month") return soldParts.filter(p => { const d = soldDate(p); const [y, m] = d.split("-").map(Number); return y === selectedYear && m === selectedMonth; });
    return soldParts.filter(p => parseInt(soldDate(p).split("-")[0]) === selectedYear);
  }, [soldParts, granularity, selectedDate, selectedMonth, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const mFiltered = (entries: ManualEntry[]) => {
    if (granularity === "day")   return entries.filter(e => e.date === selectedDate);
    if (granularity === "month") return entries.filter(e => { const [y, m] = e.date.split("-").map(Number); return y === selectedYear && m === selectedMonth; });
    return entries.filter(e => parseInt(e.date.split("-")[0]) === selectedYear);
  };

  // ── Generic renderers ─────────────────────────────────────────────────────────

  function renderDayView<T>(
    items: T[], getKey: (i: T) => number, getLabel: (i: T) => string, getSub: (i: T) => string,
    getAmt: (i: T) => string | null, sum: (is: T[]) => number, colorCls: string, noun: string,
    emptyMsg: string, onDelete?: (i: T) => void,
  ) {
    return (
      <div>
        <SummaryLine count={items.length} noun={noun} total={sum(items)} colorCls={colorCls}
          label={`${tf.on} ${selectedDate}`} totalLabel={tf.total} />
        {items.length === 0 ? <Empty msg={emptyMsg} /> : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={getKey(item)} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] group">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{getLabel(item)}</p>
                  {getSub(item) && <p className="text-xs text-[var(--text-muted)]">{getSub(item)}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-semibold ${colorCls}`}>{fmt(getAmt(item))}</p>
                  {onDelete && (
                    <button onClick={() => onDelete(item)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderMonthView<T>(
    items: T[], getDate: (i: T) => string, getKey: (i: T) => number, getLabel: (i: T) => string,
    getSub: (i: T) => string, getAmt: (i: T) => string | null, sum: (is: T[]) => number,
    colorCls: string, noun: string, rowPrefix: string, emptyMsg: string, onDelete?: (i: T) => void,
  ) {
    const grouped = groupByDate(items, getDate);
    return (
      <div>
        <SummaryLine count={items.length} noun={noun} total={sum(items)} colorCls={colorCls}
          label={`${tf.in} ${monthName(selectedMonth)} ${selectedYear}`} totalLabel={tf.monthTotal} />
        {grouped.size === 0 ? <Empty msg={emptyMsg} /> : (
          <div className="space-y-1">
            {[...grouped.entries()].map(([date, dayItems]) => {
              const key = `${rowPrefix}-${date}`;
              const open = expandedRows.has(key);
              return (
                <div key={date} className="rounded-lg border border-[var(--border)] overflow-hidden">
                  <RowHeader label={date} count={dayItems.length} noun={noun} total={sum(dayItems)}
                    colorCls={colorCls} open={open} onToggle={() => toggleRow(key)} />
                  {open && (
                    <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                      {dayItems.map(item => (
                        <div key={getKey(item)} className="flex items-center justify-between px-6 py-2.5 hover:bg-[var(--surface-raised)] transition-all group">
                          <div>
                            <p className="text-sm text-[var(--text-primary)]">{getLabel(item)}</p>
                            {getSub(item) && <p className="text-xs text-[var(--text-muted)]">{getSub(item)}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className={`text-sm ${colorCls}`}>{fmt(getAmt(item))}</p>
                            {onDelete && (
                              <button onClick={() => onDelete(item)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderYearView<T>(
    items: T[], getDate: (i: T) => string, getKey: (i: T) => number, getLabel: (i: T) => string,
    getSub: (i: T) => string, getAmt: (i: T) => string | null, sum: (is: T[]) => number,
    colorCls: string, noun: string, rowPrefix: string, emptyMsg: string, onDelete?: (i: T) => void,
  ) {
    const byMonth = groupByMonth(items, getDate);
    return (
      <div>
        <SummaryLine count={items.length} noun={noun} total={sum(items)} colorCls={colorCls}
          label={`${tf.in} ${selectedYear}`} totalLabel={tf.yearTotal} />
        {byMonth.size === 0 ? <Empty msg={emptyMsg} /> : (
          <div className="space-y-1">
            {[...byMonth.entries()].map(([month, monthItems]) => {
              const key  = `${rowPrefix}-${month}`;
              const open = expandedRows.has(key);
              const byDay = groupByDate(monthItems, getDate);
              return (
                <div key={month} className="rounded-lg border border-[var(--border)] overflow-hidden">
                  <RowHeader label={`${monthName(month)} ${selectedYear}`} count={monthItems.length} noun={noun}
                    total={sum(monthItems)} colorCls={colorCls} open={open} onToggle={() => toggleRow(key)} />
                  {open && (
                    <div className="border-t border-[var(--border-subtle)]">
                      {[...byDay.entries()].map(([date, dayItems]) => (
                        <div key={date}>
                          <div className="flex justify-between px-6 py-2 bg-[var(--surface)] border-b border-[var(--border-subtle)]">
                            <p className="text-xs font-semibold text-[var(--text-muted)]">{date}</p>
                            <p className={`text-xs font-semibold ${colorCls} opacity-70`}>{fmt(sum(dayItems))}</p>
                          </div>
                          {dayItems.map(item => (
                            <div key={getKey(item)} className="flex items-center justify-between px-8 py-2 hover:bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] last:border-0 transition-all group">
                              <div>
                                <p className="text-sm text-[var(--text-primary)]">{getLabel(item)}</p>
                                {getSub(item) && <p className="text-xs text-[var(--text-muted)]">{getSub(item)}</p>}
                              </div>
                              <div className="flex items-center gap-3">
                                <p className={`text-sm ${colorCls}`}>{fmt(getAmt(item))}</p>
                                {onDelete && (
                                  <button onClick={() => onDelete(item)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
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
        )}
      </div>
    );
  }

  // ── Normalise to UnifiedItem ──────────────────────────────────────────────────

  function toUnifiedParts(parts: SoldPart[]): UnifiedItem[] {
    return parts.map(p => ({
      key: `part-${p.id}`,
      date: soldDate(p),
      label: p.name,
      sub: partVehicle(p) ? `${tf.from} ${partVehicle(p)}${p.category?.name ? " · " + p.category.name : ""}` : (p.category?.name ?? ""),
      amount: parseFloat(p.price ?? "0"),
      amtCls: "text-green-400",
      badgeText: tf.part,
      badgeCls: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
    }));
  }

  function toUnifiedIncome(entries: ManualEntry[]): UnifiedItem[] {
    return entries.map(m => ({
      key: `income-${m.id}`,
      date: m.date,
      label: m.description,
      sub: m.category,
      amount: parseFloat(m.amount),
      amtCls: "text-teal-400",
      badgeText: m.category || tf.otherSellings,
      badgeCls: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",
      onDelete: () => deleteEntry(m.id, "income"),
    }));
  }

  function toUnifiedVehicles(veh: Vehicle[]): UnifiedItem[] {
    return veh.map(v => ({
      key: `vehicle-${v.id}`,
      date: vehicleDate(v),
      label: vehicleName(v),
      sub: tf.purchasedOn(vehicleDate(v)),
      amount: parseFloat(v.purchasePrice ?? "0"),
      amtCls: "text-[var(--text-primary)]",
      badgeText: tf.vehicle,
      badgeCls: "bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border)]",
    }));
  }

  function toUnifiedExpenses(entries: ManualEntry[]): UnifiedItem[] {
    return entries.map(m => ({
      key: `expense-${m.id}`,
      date: m.date,
      label: m.description,
      sub: m.category,
      amount: parseFloat(m.amount),
      amtCls: "text-orange-400",
      badgeText: m.category || tf.otherSpendings,
      badgeCls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
      onDelete: () => deleteEntry(m.id, "expense"),
    }));
  }

  // ── Unified renderers ─────────────────────────────────────────────────────────

  function renderUnifiedItem(item: UnifiedItem) {
    return (
      <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] group">
        <div className="min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.label}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${item.badgeCls}`}>{item.badgeText}</span>
          </div>
          {item.sub && <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{item.sub}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className={`text-sm font-semibold ${item.amtCls}`}>{fmt(item.amount)}</p>
          {item.onDelete && (
            <button onClick={item.onDelete} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderUnifiedDay(items: UnifiedItem[], totalAmt: number, colorCls: string, emptyMsg: string) {
    return (
      <div>
        <SummaryLine count={items.length} noun={tf.entry} total={totalAmt} colorCls={colorCls}
          label={`${tf.on} ${selectedDate}`} totalLabel={tf.total} />
        {items.length === 0 ? <Empty msg={emptyMsg} /> : (
          <div className="space-y-2">{items.map(renderUnifiedItem)}</div>
        )}
      </div>
    );
  }

  function renderUnifiedMonth(items: UnifiedItem[], totalAmt: number, colorCls: string, rowPrefix: string, emptyMsg: string) {
    const grouped = groupByDate(items, i => i.date);
    return (
      <div>
        <SummaryLine count={items.length} noun={tf.entry} total={totalAmt} colorCls={colorCls}
          label={`${tf.in} ${monthName(selectedMonth)} ${selectedYear}`} totalLabel={tf.monthTotal} />
        {grouped.size === 0 ? <Empty msg={emptyMsg} /> : (
          <div className="space-y-1">
            {[...grouped.entries()].map(([date, dayItems]) => {
              const key  = `${rowPrefix}-${date}`;
              const open = expandedRows.has(key);
              const dayTotal = dayItems.reduce((a, i) => a + i.amount, 0);
              return (
                <div key={date} className="rounded-lg border border-[var(--border)] overflow-hidden">
                  <RowHeader label={date} count={dayItems.length} noun={tf.entry} total={dayTotal}
                    colorCls={colorCls} open={open} onToggle={() => toggleRow(key)} />
                  {open && (
                    <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                      {dayItems.map(item => (
                        <div key={item.key} className="flex items-center justify-between px-6 py-2.5 hover:bg-[var(--surface-raised)] transition-all group">
                          <div className="min-w-0 flex-1 mr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-[var(--text-primary)] truncate">{item.label}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${item.badgeCls}`}>{item.badgeText}</span>
                            </div>
                            {item.sub && <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className={`text-sm ${item.amtCls}`}>{fmt(item.amount)}</p>
                            {item.onDelete && (
                              <button onClick={item.onDelete} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderUnifiedYear(items: UnifiedItem[], totalAmt: number, colorCls: string, rowPrefix: string, emptyMsg: string) {
    const byMonth = groupByMonth(items, i => i.date);
    return (
      <div>
        <SummaryLine count={items.length} noun={tf.entry} total={totalAmt} colorCls={colorCls}
          label={`${tf.in} ${selectedYear}`} totalLabel={tf.yearTotal} />
        {byMonth.size === 0 ? <Empty msg={emptyMsg} /> : (
          <div className="space-y-1">
            {[...byMonth.entries()].map(([month, monthItems]) => {
              const key  = `${rowPrefix}-${month}`;
              const open = expandedRows.has(key);
              const byDay = groupByDate(monthItems, i => i.date);
              const mTotal = monthItems.reduce((a, i) => a + i.amount, 0);
              return (
                <div key={month} className="rounded-lg border border-[var(--border)] overflow-hidden">
                  <RowHeader label={`${monthName(month)} ${selectedYear}`} count={monthItems.length} noun={tf.entry}
                    total={mTotal} colorCls={colorCls} open={open} onToggle={() => toggleRow(key)} />
                  {open && (
                    <div className="border-t border-[var(--border-subtle)]">
                      {[...byDay.entries()].map(([date, dayItems]) => (
                        <div key={date}>
                          <div className="flex justify-between px-6 py-2 bg-[var(--surface)] border-b border-[var(--border-subtle)]">
                            <p className="text-xs font-semibold text-[var(--text-muted)]">{date}</p>
                            <p className={`text-xs font-semibold ${colorCls} opacity-70`}>{fmt(dayItems.reduce((a, i) => a + i.amount, 0))}</p>
                          </div>
                          {dayItems.map(item => (
                            <div key={item.key} className="flex items-center justify-between px-8 py-2 hover:bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] last:border-0 transition-all group">
                              <div className="min-w-0 flex-1 mr-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-[var(--text-primary)] truncate">{item.label}</p>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${item.badgeCls}`}>{item.badgeText}</span>
                                </div>
                                {item.sub && <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <p className={`text-sm ${item.amtCls}`}>{fmt(item.amount)}</p>
                                {item.onDelete && (
                                  <button onClick={item.onDelete} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
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
        )}
      </div>
    );
  }

  // ── Tab renderers ─────────────────────────────────────────────────────────────

  const incomeFormLabels: AddEntryFormLabels = {
    title: tf.addIncome, date: tf.date, description: tf.description,
    category: tf.category, amount: tf.amount, add: tf.add,
    incomePlaceholder: "e.g. Sold scrap metal 50kg",
    expensePlaceholder: "e.g. Monthly rent",
  };
  const expenseFormLabels: AddEntryFormLabels = {
    title: tf.addExpense, date: tf.date, description: tf.description,
    category: tf.category, amount: tf.amount, add: tf.add,
    incomePlaceholder: "e.g. Sold scrap metal 50kg",
    expensePlaceholder: "e.g. Monthly rent",
  };

  function renderSellings() {
    if (loadingP || loadingI) return <Spinner label={tf.loadingParts} />;
    const mName = monthName(selectedMonth);

    const filteredIncome = mFiltered(incomeEntries);
    const allItems = [
      ...toUnifiedParts(pFiltered),
      ...toUnifiedIncome(filteredIncome),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const totalAmt = pFiltered.reduce((a, p) => a + parseFloat(p.price ?? "0"), 0)
                   + filteredIncome.reduce((a, m) => a + parseFloat(m.amount), 0);

    const noItemsMsg = granularity === "day"   ? tf.noPartsSoldDay
                     : granularity === "month" ? tf.noPartsSoldMonth(mName, selectedYear)
                     :                           tf.noPartsSoldYear(selectedYear);

    return (
      <div>
        {/* Add other income toggle */}
        <div className="mb-5">
          <button
            onClick={() => setShowAddIncome(v => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              showAddIncome
                ? "bg-teal-500/10 border-teal-500/25 text-teal-400"
                : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className={`w-4 h-4 transition-transform ${showAddIncome ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {tf.addIncome}
          </button>
          {showAddIncome && (
            <div className="mt-3">
              <AddEntryForm
                type="income" cats={tf.incomeCats}
                form={newIncome} setForm={setNewIncome}
                onAdd={() => addEntry("income")} saving={saving}
                labels={incomeFormLabels}
              />
            </div>
          )}
        </div>

        {granularity === "day"   && renderUnifiedDay(allItems, totalAmt, "text-green-400", noItemsMsg)}
        {granularity === "month" && renderUnifiedMonth(allItems, totalAmt, "text-green-400", "sl-m", noItemsMsg)}
        {granularity === "year"  && renderUnifiedYear(allItems, totalAmt, "text-green-400", "sl-y", noItemsMsg)}
      </div>
    );
  }

  function renderPurchases() {
    if (loadingV || loadingE) return <Spinner label={tf.loadingVehicles} />;
    const mName = monthName(selectedMonth);

    const filteredExpenses = mFiltered(expenseEntries);
    const allItems = [
      ...toUnifiedVehicles(vFiltered),
      ...toUnifiedExpenses(filteredExpenses),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const totalAmt = vFiltered.reduce((a, v) => a + parseFloat(v.purchasePrice ?? "0"), 0)
                   + filteredExpenses.reduce((a, m) => a + parseFloat(m.amount), 0);

    const noItemsMsg = granularity === "day"   ? tf.noVehiclesDay
                     : granularity === "month" ? tf.noVehiclesMonth(mName, selectedYear)
                     :                           tf.noVehiclesYear(selectedYear);

    return (
      <div>
        {/* Add other expense toggle */}
        <div className="mb-5">
          <button
            onClick={() => setShowAddExpense(v => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              showAddExpense
                ? "bg-orange-500/10 border-orange-500/25 text-orange-400"
                : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className={`w-4 h-4 transition-transform ${showAddExpense ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {tf.addExpense}
          </button>
          {showAddExpense && (
            <div className="mt-3">
              <AddEntryForm
                type="expense" cats={tf.expenseCats}
                form={newExpense} setForm={setNewExpense}
                onAdd={() => addEntry("expense")} saving={saving}
                labels={expenseFormLabels}
              />
            </div>
          )}
        </div>

        {granularity === "day"   && renderUnifiedDay(allItems, totalAmt, "text-[var(--text-primary)]", noItemsMsg)}
        {granularity === "month" && renderUnifiedMonth(allItems, totalAmt, "text-[var(--text-primary)]", "pu-m", noItemsMsg)}
        {granularity === "year"  && renderUnifiedYear(allItems, totalAmt, "text-[var(--text-primary)]", "pu-y", noItemsMsg)}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  const TABS: [MainTab, string][] = [
    ["sellings",   tf.sellings],
    ["purchases",  tf.purchases],
  ];

  const GRANS: [Granularity, string][] = [
    ["day",   tf.day],
    ["month", tf.month],
    ["year",  tf.year],
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{tf.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{tf.subtitle}</p>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] w-fit overflow-x-auto">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => { setMainTab(k); setExpandedRows(new Set()); }} className={tabCls(mainTab === k)}>{l}</button>
          ))}
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
            {GRANS.map(([g, label]) => (
              <button key={g} onClick={() => { setGranularity(g); setExpandedRows(new Set()); }} className={granCls(granularity === g)}>
                {label}
              </button>
            ))}
          </div>
          <DatePicker g={granularity} />
        </div>

        {/* Content */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {mainTab === "sellings"  && renderSellings()}
          {mainTab === "purchases" && renderPurchases()}
        </div>

      </div>
    </div>
  );
}
