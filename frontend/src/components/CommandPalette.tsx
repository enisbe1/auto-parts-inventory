"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface NavItem {
  type: "nav";
  label: string;
  href: string;
}

interface VehicleItem {
  type: "vehicle";
  id: number;
  label: string;
  href: string;
}

interface PartItem {
  type: "part";
  id: number;
  label: string;
  href: string;
}

type ResultItem = NavItem | VehicleItem | PartItem;

const NAV_LINKS: NavItem[] = [
  { type: "nav", label: "Dashboard",       href: "/dashboard"       },
  { type: "nav", label: "Vehicles",        href: "/vehicles"        },
  { type: "nav", label: "Parts",           href: "/parts"           },
  { type: "nav", label: "Categories",      href: "/categories"      },
  { type: "nav", label: "Catalogue",       href: "/catalogue"       },
  { type: "nav", label: "Search",          href: "/search"          },
  { type: "nav", label: "Analytics",       href: "/analytics"       },
  { type: "nav", label: "Part Templates",  href: "/part-templates"  },
];

function fuzzy(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [parts, setParts]       = useState<PartItem[]>([]);
  const [cursor, setCursor]     = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut to open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setVehicles([]);
      setParts([]);
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Debounced API search
  const fetchResults = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setVehicles([]);
      setParts([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const [vRes, pRes] = await Promise.all([
          api.get("/vehicles", { params: { search: q, limit: 5 } }),
          api.get("/parts",    { params: { search: q, limit: 5 } }),
        ]);
        const vData: Array<{ id: number; variant?: { name?: string; generation?: { code?: string; model?: { name?: string; make?: { name?: string } } } } }> =
          vRes.data?.data ?? vRes.data ?? [];
        const pData: Array<{ id: number; name: string; partNumber?: string }> =
          pRes.data?.data ?? pRes.data ?? [];

        setVehicles(
          vData.map((v) => {
            const va = v.variant; const g = va?.generation; const m = g?.model; const mk = m?.make;
            const label = [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${v.id}`;
            return { type: "vehicle", id: v.id, label, href: `/vehicles/${v.id}` };
          })
        );
        setParts(
          pData.map((p) => ({
            type: "part",
            id: p.id,
            label: p.partNumber ? `${p.name} — ${p.partNumber}` : p.name,
            href: `/parts/${p.id}/edit`,
          }))
        );
      } catch {
        // silently ignore API errors in palette
      }
    }, 300);
  }, []);

  useEffect(() => {
    fetchResults(query);
  }, [query, fetchResults]);

  // Build filtered nav items
  const filteredNav = query.trim()
    ? NAV_LINKS.filter((n) => fuzzy(query, n.label))
    : NAV_LINKS;

  // Flatten all results for keyboard navigation
  const allItems: ResultItem[] = [
    ...filteredNav,
    ...vehicles,
    ...parts,
  ];

  const totalCount = allItems.length;

  // Keyboard navigation inside palette
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % Math.max(totalCount, 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => (c - 1 + Math.max(totalCount, 1)) % Math.max(totalCount, 1)); }
    if (e.key === "Enter") {
      const item = allItems[cursor];
      if (item) { router.push(item.href); setOpen(false); }
    }
  };

  // Ensure cursor stays in range when results change
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(totalCount - 1, 0)));
  }, [totalCount]);

  if (!open) return null;

  const navStart     = 0;
  const vehicleStart = filteredNav.length;
  const partStart    = filteredNav.length + vehicles.length;

  const itemClass = (idx: number) =>
    `flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
      cursor === idx
        ? "bg-blue-600/10 text-blue-400"
        : "text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
        onKeyDown={onKeyDown}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <svg className="w-4 h-4 text-[var(--text-secondary)] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            placeholder="Search pages, vehicles, parts…"
            className="flex-1 bg-transparent py-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] text-[10px] font-mono">⌘</kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] text-[10px] font-mono">K</kbd>
          </div>
          {query && (
            <button
              onClick={() => { setQuery(""); setCursor(0); inputRef.current?.focus(); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1"
              tabIndex={-1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto">
          {totalCount === 0 && query.trim() && (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No results for &ldquo;{query}&rdquo;</p>
          )}

          {/* Navigation section */}
          {filteredNav.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-4 pt-3 pb-1">Navigation</p>
              {filteredNav.map((item, i) => (
                <div
                  key={item.href}
                  className={itemClass(navStart + i)}
                  onMouseEnter={() => setCursor(navStart + i)}
                  onClick={() => { router.push(item.href); setOpen(false); }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Vehicles section */}
          {vehicles.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-4 pt-3 pb-1">Vehicles</p>
              {vehicles.map((item, i) => (
                <div
                  key={item.id}
                  className={itemClass(vehicleStart + i)}
                  onMouseEnter={() => setCursor(vehicleStart + i)}
                  onClick={() => { router.push(item.href); setOpen(false); }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Parts section */}
          {parts.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-4 pt-3 pb-1">Parts</p>
              {parts.map((item, i) => (
                <div
                  key={item.id}
                  className={itemClass(partStart + i)}
                  onMouseEnter={() => setCursor(partStart + i)}
                  onClick={() => { router.push(item.href); setOpen(false); }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[var(--border-subtle)] px-4 py-2.5 flex items-center gap-4">
          <span className="text-[var(--text-muted)] text-xs">↑↓ navigate</span>
          <span className="text-[var(--text-muted)] text-xs">↵ select</span>
          <span className="text-[var(--text-muted)] text-xs">esc close</span>
        </div>
      </div>
    </div>
  );
}
