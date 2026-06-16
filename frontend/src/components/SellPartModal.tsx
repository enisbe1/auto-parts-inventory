'use client';
import { useState } from 'react';
import { Part } from '@/lib/types';

interface Props {
  part: Part;
  onConfirm: (soldPrice: number | undefined) => void;
  onCancel: () => void;
}

export default function SellPartModal({ part, onConfirm, onCancel }: Props) {
  const [soldPrice, setSoldPrice] = useState(part.price != null ? String(part.price) : '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-[#111113] rounded-2xl border border-[#27272a] p-6 max-w-sm w-full"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </div>

        <h3 className="font-semibold text-zinc-100 mb-0.5">Confirm Sale</h3>
        <p className="text-sm text-zinc-500 mb-5">
          <span className="font-medium text-zinc-300">{part.name}</span>
          {part.price != null && (
            <span className="text-zinc-600"> — asking €{Number(part.price).toFixed(2)}</span>
          )}
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Sold price <span className="text-zinc-600 font-normal">(€)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">€</span>
            <input
              type="number"
              value={soldPrice}
              onChange={e => setSoldPrice(e.target.value)}
              placeholder="0.00"
              min={0}
              step="0.01"
              autoFocus
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
            />
          </div>
          {part.price != null && soldPrice && Number(soldPrice) !== Number(part.price) && (
            <p className={`text-xs mt-1.5 ${Number(soldPrice) > Number(part.price) ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Number(soldPrice) > Number(part.price)
                ? `+€${(Number(soldPrice) - Number(part.price)).toFixed(2)} above asking price`
                : `-€${(Number(part.price) - Number(soldPrice)).toFixed(2)} below asking price`}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#27272a] text-zinc-400 text-sm font-medium hover:bg-white/[0.04] hover:text-zinc-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(soldPrice ? +soldPrice : undefined)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}
