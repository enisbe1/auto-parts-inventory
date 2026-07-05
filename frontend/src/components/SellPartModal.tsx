'use client';
import { useState } from 'react';
import { Part } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  part: Part;
  onConfirm: (soldPrice: number | undefined) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SellPartModal({ part, onConfirm, onCancel, isLoading = false }: Props) {
  const { t } = useLanguage();
  const [soldPrice, setSoldPrice] = useState(part.price != null ? String(part.price) : '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 max-w-sm w-full"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </div>

        <h3 className="font-semibold text-[var(--text-primary)] mb-0.5">{t.sell.title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          <span className="font-medium text-[var(--text-primary)]">{part.name}</span>
          {part.price != null && (
            <span className="text-[var(--text-muted)]"> — {t.sell.askingPrice} €{Number(part.price).toFixed(2)}</span>
          )}
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            {t.sell.soldPrice} <span className="text-[var(--text-muted)] font-normal">(€)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm font-medium">€</span>
            <input
              type="number"
              value={soldPrice}
              onChange={e => setSoldPrice(e.target.value)}
              placeholder="0.00"
              min={0}
              step="0.01"
              autoFocus
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
            />
          </div>
          {part.price != null && soldPrice && Number(soldPrice) !== Number(part.price) && (
            <p className={`text-xs mt-1.5 ${Number(soldPrice) > Number(part.price) ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Number(soldPrice) > Number(part.price)
                ? t.sell.aboveAsking((Number(soldPrice) - Number(part.price)).toFixed(2))
                : t.sell.belowAsking((Number(part.price) - Number(soldPrice)).toFixed(2))}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={() => onConfirm(soldPrice ? +soldPrice : undefined)}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
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
