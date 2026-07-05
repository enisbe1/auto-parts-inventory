"use client";
import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Part, Make, CarModel, Generation } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import QRLabelModal from "@/components/QRLabelModal";
import ImportModal from "@/components/ImportModal";
import SellPartModal from "@/components/SellPartModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaginatedParts {
  data: Part[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ── Shared badge helpers (module scope) ───────────────────────────────────────
const statusBadge = (status: string) => {
  if (status === "available") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  if (status === "reserved")  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-[var(--text-secondary)] border border-zinc-500/20";
};

const conditionBadge = (c: string) => {
  if (c === "good") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
  if (c === "fair") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20";
};

const sel = "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40";

function QRIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 17.25h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
  );
}

// ── PartRow at MODULE SCOPE — prevents remount on every parent render ─────────
interface PartRowProps {
  p: Part;
  showVehicle: boolean;
  isSelected: boolean;
  vehicleLabel: string;
  conditionLabel: string;
  statusSold: string;
  statusAvailable: string;
  statusReserved: string;
  editLabel: string;
  deleteLabel: string;
  onToggle: () => void;
  onStatusChange: (newStatus: string) => void;
  onQR: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PartRow({
  p, showVehicle, isSelected, vehicleLabel,
  conditionLabel,
  statusSold, statusAvailable, statusReserved,
  editLabel, deleteLabel,
  onToggle, onStatusChange, onQR, onEdit, onDelete,
}: PartRowProps) {
  return (
    <tr className={`hover:bg-white/[0.03] transition-colors ${isSelected ? "bg-blue-500/5" : ""}`}>
      <td className="px-5 py-3.5">
        <input type="checkbox" checked={isSelected} onChange={onToggle}
          className="rounded border-zinc-700 text-blue-600 focus:ring-blue-500/40 bg-[var(--surface-raised)]" />
      </td>
      <td className="px-5 py-3.5 font-semibold text-[var(--text-primary)]">{p.name}</td>
      <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-secondary)]">
        {p.partNumber || <span className="text-[var(--text-muted)]">—</span>}
      </td>
      <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs">
        {p.category?.name || <span className="text-[var(--text-muted)]">—</span>}
      </td>
      {showVehicle && (
        <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] max-w-[160px] truncate">{vehicleLabel}</td>
      )}
      <td className="px-5 py-3.5"><span className={conditionBadge(p.condition)}>{conditionLabel}</span></td>
      <td className="px-5 py-3.5 font-medium text-zinc-300">
        {p.price ? `€${Number(p.price).toFixed(2)}` : <span className="text-[var(--text-muted)]">—</span>}
      </td>
      <td className="px-5 py-3.5">
        {p.status === "sold" ? (
          <span className={statusBadge("sold")}>{statusSold}</span>
        ) : (
          <select value={p.status} onChange={e => onStatusChange(e.target.value)}
            className="bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition">
            <option value="available">{statusAvailable}</option>
            <option value="reserved">{statusReserved}</option>
            <option value="sold">{statusSold}</option>
          </select>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onQR} aria-label="Generate QR label"
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[var(--text-primary)] transition-colors">
            <QRIcon />
          </button>
          <button onClick={onEdit} aria-label={`Edit ${p.name}`}
            className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors">
            {editLabel}
          </button>
          <button onClick={onDelete} aria-label={`Delete ${p.name}`}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-red-400 transition-colors">
            {deleteLabel}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Loading skeleton row ──────────────────────────────────────────────────────
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-[var(--border-subtle)]">
          <td className="px-5 py-3.5" />{/* checkbox */}
          {[...Array(cols - 1)].map((__, j) => (
            <td key={j} className="px-5 py-3.5">
              <div className="h-3.5 rounded bg-[var(--surface-raised)] w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function PartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]       = useState(searchParams.get("search") || "");
  const [status, setStatus]       = useState(searchParams.get("status") || "");
  const [condition, setCondition] = useState("");
  const [makeId, setMakeId]             = useState("");
  const [modelId, setModelId]           = useState("");
  const [generationId, setGenerationId] = useState("");
  const [sortBy, setSortBy]             = useState("newest");
  const [groupByVehicle, setGroupByVehicle] = useState(false);

  // ── Catalogue dropdowns ───────────────────────────────────────────────────
  const [makes, setMakes]           = useState<Make[]>([]);
  const [models, setModels]         = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [result, setResult]   = useState<PaginatedParts | null>(null);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const normalLimit           = 20;
  const groupLimit            = 500;

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selected, setSelected]           = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus]       = useState("available");
  const [toDelete, setToDelete]           = useState<Part | null>(null);
  const [qrPart, setQrPart]               = useState<Part | null>(null);
  const [showImport, setShowImport]       = useState(false);
  const [bulkDelConfirm, setBulkDel]      = useState(false);
  const [toast, setToast]                 = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [bulkLoading, setBulkLoad]        = useState(false);
  const [sellPart, setSellPart]           = useState<Part | null>(null);
  const [sellLoading, setSellLoading]     = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ partId: number; newStatus: string } | null>(null);

  // ── Abort ref — cancels in-flight requests when a newer one fires ─────────
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { api.get('/makes').then(r => setMakes(r.data)); }, []);

  useEffect(() => {
    if (!makeId) { setModels([]); setModelId(''); setGenerations([]); setGenerationId(''); return; }
    api.get('/models', { params: { makeId } }).then(r => { setModels(r.data); setModelId(''); setGenerations([]); setGenerationId(''); });
  }, [makeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modelId) { setGenerations([]); setGenerationId(''); return; }
    api.get('/generations', { params: { modelId } }).then(r => { setGenerations(r.data); setGenerationId(''); });
  }, [modelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtersRef = useRef({ search, status, condition, modelId, generationId, groupByVehicle });
  useEffect(() => {
    filtersRef.current = { search, status, condition, modelId, generationId, groupByVehicle };
  }, [search, status, condition, modelId, generationId, groupByVehicle]);

  const load = async (
    p: number,
    overrideSearch?: string,
    overrideStatus?: string,
    overrideModelId?: string,
    overrideGenerationId?: string,
    overrideCondition?: string,
  ) => {
    // Cancel any in-flight request to prevent stale data overwriting fresh results
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const s    = overrideSearch       !== undefined ? overrideSearch       : filtersRef.current.search;
    const st   = overrideStatus       !== undefined ? overrideStatus       : filtersRef.current.status;
    const mid  = overrideModelId      !== undefined ? overrideModelId      : filtersRef.current.modelId;
    const gid  = overrideGenerationId !== undefined ? overrideGenerationId : filtersRef.current.generationId;
    const cond = overrideCondition    !== undefined ? overrideCondition    : filtersRef.current.condition;
    const gbv  = filtersRef.current.groupByVehicle;
    const limit = gbv && (mid || gid) ? groupLimit : normalLimit;

    const params: Record<string, string | number> = { page: p, limit };
    if (s)    params.search       = s;
    if (st)   params.status       = st;
    if (mid)  params.modelId      = mid;
    if (gid)  params.generationId = gid;
    if (cond) params.condition    = cond;

    setLoading(true);
    try {
      const { data } = await api.get("/parts", { params, signal: controller.signal });
      setResult(data);
      setSelected(new Set());
    } catch (err: unknown) {
      // Ignore cancellation — a newer request is already in flight
      if ((err as { code?: string })?.code === 'ERR_CANCELED') return;
      setToast({ message: "Failed to load parts", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, search); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load(1); }, [groupByVehicle]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setPage(1); load(1, search, status, modelId, generationId, condition);
  };

  // ── Status / sell ─────────────────────────────────────────────────────────
  const handleStatusChange = (part: Part, newStatus: string) => {
    if (newStatus === "sold") { setSellPart(part); setPendingStatus({ partId: part.id, newStatus }); }
    else applyStatusUpdate(part.id, newStatus, undefined);
  };

  const applyStatusUpdate = async (partId: number, st: string, price: number | undefined) => {
    try {
      const body: Record<string, unknown> = { status: st };
      if (price !== undefined) body.price = price;
      await api.patch(`/parts/${partId}`, body);
      load(page);
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    }
  };

  const confirmSell = async (soldPrice: number | undefined) => {
    if (!pendingStatus) return;
    setSellLoading(true);
    try {
      await applyStatusUpdate(pendingStatus.partId, "sold", soldPrice);
    } finally {
      setSellLoading(false);
      setSellPart(null);
      setPendingStatus(null);
    }
  };

  const cancelSell = () => { setSellPart(null); setPendingStatus(null); };

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleOne = (id: number) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const toggleAll = () => {
    const ids = (result?.data ?? []).map(p => p.id);
    if (selected.size === ids.length) setSelected(new Set());
    else setSelected(new Set(ids));
  };

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

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/parts/${toDelete.id}`);
      setToast({ message: "Part deleted", type: "success" });
      load(page);
    } catch {
      setToast({ message: "Failed to delete part", type: "error" });
    } finally { setToDelete(null); }
  };

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    const params: Record<string, string | number> = { page: 1, limit: 10000 };
    if (search)       params.search       = search;
    if (status)       params.status       = status;
    if (modelId)      params.modelId      = modelId;
    if (generationId) params.generationId = generationId;
    if (condition)    params.condition    = condition;
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
    setToast({ message: `Exported ${parts.length} parts`, type: "success" });
  };

  const getVehicleLabel = (p: Part) => {
    const v = p.vehicle; if (!v) return "—";
    const va = v.variant; const g = va?.generation; const m = g?.model; const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${v.id}`;
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const parts  = result?.data ?? [];
  const meta   = result?.meta;
  const allSel = parts.length > 0 && selected.size === parts.length;

  const sortedParts = useMemo(() => {
    const arr = [...parts];
    if (sortBy === "price_asc")  arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === "price_desc") arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sortBy === "name_asc")   arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [parts, sortBy]);

  const groupedByVehicle = useMemo(() => {
    if (!groupByVehicle) return null;
    const map = new Map<number, { vehicle: Part["vehicle"]; parts: Part[] }>();
    for (const p of sortedParts) {
      const vid = p.vehicleId ?? 0;
      if (!map.has(vid)) map.set(vid, { vehicle: p.vehicle, parts: [] });
      map.get(vid)!.parts.push(p);
    }
    return [...map.entries()].sort(([, a], [, b]) => {
      const ya = a.vehicle?.year ?? 0, yb = b.vehicle?.year ?? 0;
      return yb - ya || (b.vehicle?.id ?? 0) - (a.vehicle?.id ?? 0);
    });
  }, [sortedParts, groupByVehicle]);

  const modelStats = useMemo(() => {
    if (!modelId && !generationId) return null;
    const avail = parts.filter(p => p.status === "available").length;
    const res   = parts.filter(p => p.status === "reserved").length;
    const sold  = parts.filter(p => p.status === "sold").length;
    const vehicleIds = new Set(parts.map(p => p.vehicleId).filter(Boolean));
    return { avail, res, sold, vehicleCount: vehicleIds.size, total: meta?.total ?? parts.length };
  }, [parts, modelId, generationId, meta]);

  const activeMakeName       = makes.find(mk => String(mk.id) === makeId)?.name;
  const activeModelName      = models.find(m => String(m.id) === modelId)?.name;
  const activeGeneration     = generations.find(g => String(g.id) === generationId);
  const activeGenerationName = activeGeneration?.code || activeGeneration?.name;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {toast    && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {qrPart   && <QRLabelModal part={qrPart} onClose={() => setQrPart(null)} />}
      {sellPart && <SellPartModal part={sellPart} isLoading={sellLoading} onConfirm={confirmSell} onCancel={cancelSell} />}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)}
          onSuccess={n => { setShowImport(false); setToast({ message: `${n} parts imported successfully`, type: "success" }); load(1); }} />
      )}
      {toDelete && <ConfirmModal message={`Delete part "${toDelete.name}"?`} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />}
      {bulkDelConfirm && (
        <ConfirmModal message={`Delete ${selected.size} selected parts? ${t.parts.deleteConfirm}`}
          onConfirm={bulkDelete} onCancel={() => setBulkDel(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.parts.title}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {loading && !result ? t.common.loading : meta ? t.parts.partsTotal(meta.total) : t.common.loading}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t.common.export}
          </button>
          <button onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t.parts.importCsv}
          </button>
          <Link href="/parts/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.parts.addPart}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.parts.searchParts}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-zinc-700 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40" />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select value={makeId} onChange={e => { const v = e.target.value; setMakeId(v); if (!v) { setModelId(''); setGenerationId(''); setPage(1); load(1, search, status, '', '', condition); } }} className={sel}>
          <option value="">{t.parts.allMakes}</option>
          {makes.map(mk => <option key={mk.id} value={String(mk.id)}>{mk.name}</option>)}
        </select>

        {makeId && (
          <select value={modelId} onChange={e => { const v = e.target.value; setModelId(v); setGenerationId(''); setPage(1); load(1, search, status, v, '', condition); }} className={sel}>
            <option value="">{t.parts.allModels}</option>
            {models.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
          </select>
        )}

        {modelId && generations.length > 0 && (
          <select value={generationId} onChange={e => { const v = e.target.value; setGenerationId(v); setPage(1); load(1, search, status, modelId, v, condition); }} className={sel}>
            <option value="">{t.parts.allGenerations}</option>
            {generations.map(g => (
              <option key={g.id} value={String(g.id)}>
                {g.code && g.name && g.code !== g.name ? `${g.code} · ${g.name}` : (g.code || g.name)}
                {g.yearStart ? ` (${g.yearStart}${g.yearEnd ? `–${g.yearEnd}` : '+'})` : ''}
              </option>
            ))}
          </select>
        )}

        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); load(1, search, e.target.value, modelId, generationId, condition); }} className={sel}>
          <option value="">{t.common.allStatuses}</option>
          <option value="available">{t.status.available}</option>
          <option value="reserved">{t.status.reserved}</option>
          <option value="sold">{t.status.sold}</option>
        </select>

        <select value={condition} onChange={e => { setCondition(e.target.value); setPage(1); load(1, search, status, modelId, generationId, e.target.value); }} className={sel}>
          <option value="">{t.parts.allConditions}</option>
          <option value="good">{t.condition.good}</option>
          <option value="fair">{t.condition.fair}</option>
          <option value="poor">{t.condition.poor}</option>
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={sel}>
          <option value="newest">{t.parts.sortNewest}</option>
          <option value="price_asc">{t.parts.sortPriceAsc}</option>
          <option value="price_desc">{t.parts.sortPriceDesc}</option>
          <option value="name_asc">{t.parts.sortNameAz}</option>
        </select>

        {(modelId || generationId) && (
          <button type="button"
            onClick={() => { setMakeId(''); setModelId(''); setGenerationId(''); setGroupByVehicle(false); setPage(1); load(1, search, status, '', '', condition); }}
            className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-blue-500/15 transition-colors">
            {[activeMakeName, activeModelName, activeGenerationName].filter(Boolean).join(' · ')}
            <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          {t.common.filter}
        </button>
      </form>

      {/* Model summary card */}
      {(modelId || generationId) && modelStats && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 mb-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {[activeMakeName, activeModelName, activeGenerationName].filter(Boolean).join(' ')}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t.vehicles.vehiclesCount(modelStats.vehicleCount)} {t.parts.inInventory}
                {" · "}{t.parts.partsTotal(modelStats.total)}
                {search && ` · ${t.parts.matching} "${search}"`}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-semibold">{modelStats.avail}</span>
                <span className="text-[var(--text-muted)]">{t.status.available}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-400 font-semibold">{modelStats.res}</span>
                <span className="text-[var(--text-muted)]">{t.status.reserved}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0" />
                <span className="text-[var(--text-secondary)] font-semibold">{modelStats.sold}</span>
                <span className="text-[var(--text-muted)]">{t.status.sold}</span>
              </span>
            </div>
            <button type="button" onClick={() => setGroupByVehicle(v => !v)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                groupByVehicle
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                  : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              {t.parts.groupByVehicle}
            </button>
          </div>
        </div>
      )}

      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="font-semibold text-blue-400">{selected.size} {t.common.selected}</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[var(--text-secondary)] text-xs">{t.common.markAs}</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none">
              <option value="available">{t.status.available}</option>
              <option value="reserved">{t.status.reserved}</option>
              <option value="sold">{t.status.sold}</option>
            </select>
            <button onClick={bulkUpdateStatus} disabled={bulkLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {bulkLoading ? t.common.loading : t.common.apply}
            </button>
            <button onClick={() => setBulkDel(true)} disabled={bulkLoading}
              className="bg-[var(--surface-raised)] text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors">
              {t.common.delete}
            </button>
            <button onClick={() => setSelected(new Set())}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs transition-colors ml-1">
              ✕ {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* GROUP BY VEHICLE view */}
      {groupByVehicle && groupedByVehicle ? (
        <div className="space-y-4">
          {loading && groupedByVehicle.length === 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-12 flex justify-center">
              <svg className="animate-spin w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
          )}
          {!loading && groupedByVehicle.length === 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-12 text-center text-[var(--text-muted)] text-sm">
              {t.parts.noParts}
            </div>
          )}
          {groupedByVehicle.map(([vid, { vehicle: veh, parts: vparts }]) => {
            const va = veh?.variant; const g = va?.generation; const m = g?.model; const mk = m?.make;
            const vTitle = [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${veh?.id ?? vid}`;
            const vAvail = vparts.filter(p => p.status === "available").length;
            const vRes   = vparts.filter(p => p.status === "reserved").length;
            const vSold  = vparts.filter(p => p.status === "sold").length;
            const allVSel = vparts.every(p => selected.has(p.id));
            const toggleVehicle = () => setSelected(prev => {
              const next = new Set(prev);
              vparts.forEach(p => allVSel ? next.delete(p.id) : next.add(p.id));
              return next;
            });
            return (
              <div key={vid} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--surface-raised)] border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{vTitle}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                        {veh?.year && <span>{veh.year}</span>}
                        {veh?.mileage && <span>{veh.mileage.toLocaleString()} km</span>}
                        {veh?.vin && <span className="font-mono">VIN: {veh.vin}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs">
                      {vAvail > 0 && <span className="text-emerald-400 font-semibold">{vAvail} {t.status.available}</span>}
                      {vRes   > 0 && <span className="text-amber-400 font-semibold">{vRes} {t.status.reserved}</span>}
                      {vSold  > 0 && <span className="text-[var(--text-muted)]">{vSold} {t.status.sold}</span>}
                      <span className="text-[var(--text-muted)]">· {vparts.length} {t.common.parts}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={toggleVehicle}
                        className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors border border-[var(--border)] px-2.5 py-1 rounded-lg">
                        {allVSel ? t.parts.deselectAll : t.parts.selectAll}
                      </button>
                      <button onClick={() => router.push(`/vehicles/${veh?.id}`)}
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                        {t.parts.viewVehicle} →
                      </button>
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <th className="px-5 py-2.5 w-10" />
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.parts.partName}</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.parts.partNo}</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.parts.category}</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.parts.condition}</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.parts.price}</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.common.status}</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {vparts.map(p => (
                      <PartRow key={p.id} p={p} showVehicle={false}
                        isSelected={selected.has(p.id)}
                        vehicleLabel={getVehicleLabel(p)}
                        conditionLabel={(t.condition as Record<string, string>)[p.condition] ?? p.condition}
                        statusSold={t.status.sold} statusAvailable={t.status.available} statusReserved={t.status.reserved}
                        editLabel={t.common.edit} deleteLabel={t.common.delete}
                        onToggle={() => toggleOne(p.id)}
                        onStatusChange={ns => handleStatusChange(p, ns)}
                        onQR={() => setQrPart(p)}
                        onEdit={() => router.push(`/parts/${p.id}/edit`)}
                        onDelete={() => setToDelete(p)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        /* FLAT TABLE */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="px-5 py-3 w-10">
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    className="rounded border-zinc-700 text-blue-600 focus:ring-blue-500/40 bg-[var(--surface-raised)]" />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.partName}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.partNo}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.category}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.vehicle}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.condition}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.parts.price}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.status}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23]">
              {loading ? (
                <SkeletonRows cols={9} />
              ) : sortedParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[var(--text-muted)]">{t.parts.noParts}</td>
                </tr>
              ) : sortedParts.map(p => (
                <PartRow key={p.id} p={p} showVehicle={true}
                  isSelected={selected.has(p.id)}
                  vehicleLabel={getVehicleLabel(p)}
                  conditionLabel={(t.condition as Record<string, string>)[p.condition] ?? p.condition}
                  statusSold={t.status.sold} statusAvailable={t.status.available} statusReserved={t.status.reserved}
                  editLabel={t.common.edit} deleteLabel={t.common.delete}
                  onToggle={() => toggleOne(p.id)}
                  onStatusChange={ns => handleStatusChange(p, ns)}
                  onQR={() => setQrPart(p)}
                  onEdit={() => router.push(`/parts/${p.id}/edit`)}
                  onDelete={() => setToDelete(p)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!groupByVehicle && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="text-[var(--text-secondary)]">
            {t.common.page} {meta.page} {t.common.of} {meta.totalPages} &mdash; {meta.total} {t.common.parts}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              {t.common.prev}
            </button>
            <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {t.common.next}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--text-secondary)]">Loading parts…</div>}>
      <PartsContent />
    </Suspense>
  );
}
