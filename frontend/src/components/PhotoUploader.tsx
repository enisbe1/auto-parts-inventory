"use client";
import { useRef, useState, useCallback } from "react";

const BACKEND = "http://localhost:3001";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch(`${BACKEND}/api/uploads`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (r.ok) {
          const data = await r.json();
          uploaded.push(data.url);
        }
      } catch {}
    }
    onChange([...photos, ...uploaded]);
    setUploading(false);
  }, [photos, onChange]);

  const removePhoto = (url: string) => onChange(photos.filter(p => p !== url));

  return (
    <div className="space-y-3">
      {/* Existing photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map(url => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--border)]">
              <img src={`${BACKEND}${url}`} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              >
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragOver
            ? "border-blue-500/60 bg-blue-500/5"
            : "border-[var(--border)] hover:border-[#3f3f46] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Uploading…
          </div>
        ) : (
          <>
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-xs text-[var(--text-secondary)]">Drop images here or <span className="text-blue-400">click to browse</span></p>
            <p className="text-[10px] text-[var(--text-muted)]">JPG, PNG, WEBP · max 10 MB each</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
}
