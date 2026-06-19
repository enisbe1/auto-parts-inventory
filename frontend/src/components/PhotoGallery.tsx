"use client";
import { useState } from "react";

const BACKEND = "http://localhost:3001";

interface Props { photos: string[]; }

export default function PhotoGallery({ photos }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  if (!photos?.length) return null;

  const open = (i: number) => { setIdx(i); setLightbox(photos[i]); };
  const prev = () => { const n = (idx - 1 + photos.length) % photos.length; setIdx(n); setLightbox(photos[n]); };
  const next = () => { const n = (idx + 1) % photos.length; setIdx(n); setLightbox(photos[n]); };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.map((url, i) => (
          <button key={url} type="button" onClick={() => open(i)}
            className="aspect-square rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--text-secondary)] transition-all group">
            <img src={`${BACKEND}${url}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          {/* Close */}
          <button className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors" onClick={() => setLightbox(null)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Prev */}
          {photos.length > 1 && (
            <button className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); prev(); }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <img src={`${BACKEND}${lightbox}`} alt="" className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          {/* Next */}
          {photos.length > 1 && (
            <button className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); next(); }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          {/* Counter */}
          {photos.length > 1 && (
            <p className="absolute bottom-4 text-white/50 text-sm">{idx + 1} / {photos.length}</p>
          )}
        </div>
      )}
    </>
  );
}
