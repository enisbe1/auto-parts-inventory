"use client";
import { useRef, useState, DragEvent } from "react";
import api from "@/lib/api";

interface ImportModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const TEMPLATE_HEADERS = "name,partNumber,condition,price,status,notes,vehicleId,categoryId";
const TEMPLATE_EXAMPLE = "Alternator,ALT-12345,good,85.00,available,OEM original,,2";

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "parts-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsePreview = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setError("CSV appears to be empty or has no data rows.");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const dataLines = lines.slice(1);
      setTotalRows(dataLines.length);
      const previewRows = dataLines.slice(0, 5).map((line) =>
        line.split(",").map((cell) => cell.trim())
      );
      setPreview({ headers, rows: previewRows });
      setError(null);
    };
    reader.readAsText(f);
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("Only .csv files are accepted.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    parsePreview(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/parts/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      if (data.imported > 0) {
        onSuccess(data.imported);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Import Parts from CSV</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Upload a CSV file to bulk-create parts</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Result state */}
        {result ? (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-400 font-semibold text-sm">
                {result.imported} part{result.imported !== 1 ? "s" : ""} imported successfully
              </p>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-h-40 overflow-y-auto">
                <p className="text-red-400 font-semibold text-xs mb-2">
                  {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} failed:
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-red-400/80 text-xs font-mono truncate">{err}</p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drop zone */}
            {!preview && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging
                    ? "border-blue-500/60 bg-blue-500/5"
                    : "border-[var(--border)] hover:border-[#3f3f46]"
                }`}
              >
                <svg className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-[var(--text-secondary)] text-sm font-medium">Drop your CSV here, or click to browse</p>
                <p className="text-[var(--text-muted)] text-xs mt-1">Only .csv files are accepted</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Preview — first {Math.min(5, preview.rows.length)} of {totalRows} rows
                  </p>
                  <button
                    onClick={() => { setFile(null); setPreview(null); setError(null); }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Change file
                  </button>
                </div>
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-52">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                          {preview.headers.map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[var(--text-secondary)] font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {preview.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-[var(--text-secondary)] max-w-[120px] truncate">{cell || <span className="text-[var(--text-muted)]">—</span>}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download template
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                {preview && (
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? "Importing…" : `Import ${totalRows} row${totalRows !== 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
