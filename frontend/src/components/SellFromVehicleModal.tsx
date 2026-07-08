'use client';
import { useState } from 'react';
import { Part } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  partName: string;
  /** All parts with this name in the current filter context (any status) */
  parts: Part[];
  isLoading: boolean;
  onConfirm: (partId: number, soldPrice: number | undefined) => Promise<void>;
  onClose: () => void;
}

function vehicleLabel(p: Part): string {
  const v = p.vehicle;
  if (!v) return `Part #${p.id}`;
  const va = v.variant;
  const g  = va?.generation;
  const m  = g?.model;
  const mk = m?.make;
  return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(' ') || `Vehicle #${v.id}`;
}

const condCls = (c: string) =>
  c === 'good' ? 'text-emerald-400' : c === 'fair' ? 'text-amber-400' : 'text-red-400';

export default function SellFromVehicleModal({ partName, parts, isLoading, onConfirm, onClose }: Props) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [price, setPrice]           = useState('');
  const [saving, setSaving]         = useState(false);

  const available    = parts.filter(p => p.status === 'available');
  const selectedPart = parts.find(p => p.id === selectedId);

  const handleSelect = (p: Part) => {
    setSelectedId(p.id);
    setPrice(p.price != null ? Number(p.price).toFixed(2) : '');
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await onConfirm(selectedId, price ? parseFloat(price) : undefined);
    } finally {
      setSaving(false);
    }
  };

  const diff = selectedPart?.price != null && price
    ? parseFloat(price) - Number(selectedPart.price)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] w-full max-w-lg flex flex-col"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {t.sell.title}: <span className="text-[var(--text-primary)]">{partName}</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t.parts.chooseVehicle}
              {' · '}
              <span className={available.length > 0 ? 'text-emerald-400 font-medium' : 'text-[var(--text-muted)]'}>
                {available.length} {t.status.available.toLowerCase()}
              </span>
            </p>
          </div>
        </div>

        {/* ── Part list ───────────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {available.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">{t.parts.noAvailableUnits}</p>
          )}

          {parts.map(p => {
            const isAvail = p.status === 'available';
            const isSel   = selectedId === p.id;

            return (
              <div key={p.id}>
                {/* ── Vehicle row ── */}
                <button
                  type="button"
                  disabled={!isAvail}
                  onClick={() => isAvail && handleSelect(p)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                    isSel
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isAvail
                        ? 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer'
                        : 'border-[var(--border)] bg-[var(--surface-raised)] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: radio + vehicle info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSel ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--border)]'
                      }`}>
                        {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {vehicleLabel(p)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {p.vehicle?.year     && <span className="text-xs text-[var(--text-muted)]">{p.vehicle.year}</span>}
                          {p.vehicle?.mileage  && <span className="text-xs text-[var(--text-muted)]">{p.vehicle.mileage.toLocaleString()} km</span>}
                          {p.vehicle?.vin      && <span className="text-xs font-mono text-[var(--text-muted)]">VIN: {p.vehicle.vin}</span>}
                          {p.partNumber        && <span className="text-xs font-mono text-[var(--text-muted)]">#{p.partNumber}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: price + condition */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {p.price != null ? `€${Number(p.price).toFixed(2)}` : '—'}
                      </p>
                      <p className={`text-xs mt-0.5 font-medium ${condCls(p.condition)}`}>
                        {(t.condition as Record<string, string>)[p.condition] ?? p.condition}
                      </p>
                    </div>
                  </div>

                  {/* Status pill for non-available parts */}
                  {!isAvail && (
                    <div className="mt-2 ml-7">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                        {(t.status as Record<string, string>)[p.status] ?? p.status}
                      </span>
                    </div>
                  )}
                </button>

                {/* ── Inline price input (shown only for selected part) ── */}
                {isSel && (
                  <div className="mt-1.5 px-4 py-3 rounded-xl bg-[var(--surface-raised)] border border-emerald-500/20">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      {t.sell.soldPrice} <span className="text-[var(--text-muted)] font-normal">(€)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">€</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        autoFocus
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                      />
                    </div>
                    {selectedPart?.price != null && price && Math.abs(diff) >= 0.01 && (
                      <p className={`text-xs mt-1.5 ${diff > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {diff > 0
                          ? t.sell.aboveAsking(diff.toFixed(2))
                          : t.sell.belowAsking(Math.abs(diff).toFixed(2))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving || isLoading}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || saving || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving || isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {t.common.loading}
              </>
            ) : t.sell.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
