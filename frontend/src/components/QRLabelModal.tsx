"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  part: { id: number; name: string; partNumber?: string };
  onClose: () => void;
}

export default function QRLabelModal({ part, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");

  const url = `http://localhost:3000/parts?search=${encodeURIComponent(part.partNumber || part.name)}`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setDataUrl);
  }, [url]);

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .qr-print-label { display: flex !important; }
        }
        .qr-print-label { display: none; }
      `}</style>

      {/* Screen modal */}
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-80 shadow-2xl flex flex-col items-center gap-4">
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">QR Label</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* QR code */}
          <div className="bg-white rounded-lg p-3">
            {dataUrl ? (
              <img src={dataUrl} alt="QR Code" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-[var(--text-secondary)] text-xs">
                Generating…
              </div>
            )}
          </div>

          {/* Part info */}
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{part.name}</p>
            {part.partNumber && (
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">{part.partNumber}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button
              onClick={onClose}
              className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              disabled={!dataUrl}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Print-only label (hidden on screen, shown when printing) */}
      <div
        className="qr-print-label"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          flexDirection: "column",
          gap: "8px",
          padding: "16px",
        }}
      >
        {dataUrl && <img src={dataUrl} alt="QR Code" width={200} height={200} />}
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", fontFamily: "sans-serif" }}>{part.name}</p>
        {part.partNumber && (
          <p style={{ margin: 0, fontSize: "11px", fontFamily: "monospace", color: "#555" }}>{part.partNumber}</p>
        )}
      </div>
    </>
  );
}
