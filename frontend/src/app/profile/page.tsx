"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import Toast from "@/components/Toast";

function getUserEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email ?? "";
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const [email, setEmail]           = useState("");
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => { setEmail(getUserEmail()); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setToast({ message: "New passwords do not match", type: "error" });
      return;
    }
    if (newPw.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setToast({ message: "Password changed successfully", type: "success" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setToast({ message: msg ?? "Failed to change password", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Account info card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-5 mb-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm">{email || "—"}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Signed in account</p>
          </div>
        </div>
      </div>

      {/* Change password form */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-6 shadow-xl shadow-black/20">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
              className={`w-full bg-[var(--surface-raised)] border text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                confirmPw && confirmPw !== newPw
                  ? "border-red-500/40 focus:ring-red-500/40 focus:border-red-500/40"
                  : "border-[var(--border)] focus:ring-blue-500/40 focus:border-blue-500/40"
              }`}
            />
            {confirmPw && confirmPw !== newPw && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Saving…
                </span>
              ) : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
