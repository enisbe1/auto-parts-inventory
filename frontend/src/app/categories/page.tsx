"use client";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { Category } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName]             = useState("");
  const [description, setDesc]      = useState("");
  const [loading, setLoading]       = useState(false);
  const [toDelete, setToDelete]     = useState<Category | null>(null);
  const [toast, setToast]           = useState<{ message: string; type: "success" | "error" } | null>(null);

  const load = async () => {
    const { data } = await api.get("/categories");
    setCategories(data);
  };

  useEffect(() => {
    let active = true;
    api.get("/categories").then(({ data }) => {
      if (active) setCategories(data);
    });
    return () => { active = false; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/categories", { name: name.trim(), description: description.trim() || undefined });
      setToast({ message: `Category "${name.trim()}" created`, type: "success" });
      setName("");
      setDesc("");
      load();
    } catch (err: unknown) {
      let msg: string | string[] = "Failed to create category";
      if (isAxiosError<{ message?: string | string[] }>(err)) {
        msg = err.response?.data?.message ?? msg;
      }
      setToast({ message: Array.isArray(msg) ? msg.join(", ") : msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/categories/${toDelete.id}`);
      setToast({ message: `Category "${toDelete.name}" deleted`, type: "success" });
      load();
    } catch {
      setToast({ message: "Failed to delete category", type: "error" });
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && (
        <ConfirmModal
          message={`Delete category "${toDelete.name}"? Parts assigned to this category will lose their category.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Part Categories</h1>

      {/* Add category form */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Add New Category</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Engine, Gearbox, Body…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="self-start bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding…" : "+ Add Category"}
          </button>
        </div>
      </form>

      {/* Categories list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <span className="font-semibold text-gray-700">All Categories</span>
          <span className="ml-2 text-sm text-gray-400">({categories.length})</span>
        </div>
        {categories.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No categories yet</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map(c => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                </div>
                <button
                  onClick={() => setToDelete(c)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
