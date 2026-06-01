"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Make, CarModel, Generation, Variant } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";

type Level = "makes" | "models" | "generations" | "variants";

export default function CataloguePage() {
  const [makes, setMakes]           = useState<Make[]>([]);
  const [models, setModels]         = useState<CarModel[]>([]);
  const [generations, setGens]      = useState<Generation[]>([]);
  const [variants, setVariants]     = useState<Variant[]>([]);

  const [selMake, setSelMake]       = useState<Make | null>(null);
  const [selModel, setSelModel]     = useState<CarModel | null>(null);
  const [selGen, setSelGen]         = useState<Generation | null>(null);

  const [toast, setToast]           = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [toDelete, setToDelete]     = useState<{ level: Level; id: number; name: string } | null>(null);

  // ── Add form state ───────────────────────────────────────────────────────
  const [newMake, setNewMake]               = useState({ name: "", countryOfOrigin: "" });
  const [newModel, setNewModel]             = useState({ name: "", bodyType: "" });
  const [newGen, setNewGen]                 = useState({ name: "", code: "", yearStart: "", yearEnd: "" });
  const [newVariant, setNewVariant]         = useState({ name: "", engine: "", fuelType: "Diesel", powerKw: "" });
  const [adding, setAdding]                 = useState(false);

  // ── Loaders ──────────────────────────────────────────────────────────────
  const loadMakes = async () => {
    const { data } = await api.get("/makes");
    setMakes(data);
  };
  const loadModels = async (makeId: number) => {
    const { data } = await api.get("/models", { params: { makeId } });
    setModels(data);
  };
  const loadGens = async (modelId: number) => {
    const { data } = await api.get("/generations", { params: { modelId } });
    setGens(data);
  };
  const loadVariants = async (genId: number) => {
    const { data } = await api.get("/variants", { params: { generationId: genId } });
    setVariants(data);
  };

  useEffect(() => { loadMakes(); }, []);

  const selectMake = (make: Make) => {
    setSelMake(make); setSelModel(null); setSelGen(null);
    setModels([]); setGens([]); setVariants([]);
    loadModels(make.id);
  };
  const selectModel = (model: CarModel) => {
    setSelModel(model); setSelGen(null);
    setGens([]); setVariants([]);
    loadGens(model.id);
  };
  const selectGen = (gen: Generation) => {
    setSelGen(gen); setVariants([]);
    loadVariants(gen.id);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!toDelete) return;
    const endpoints: Record<Level, string> = {
      makes: "/makes", models: "/models", generations: "/generations", variants: "/variants",
    };
    try {
      await api.delete(`${endpoints[toDelete.level]}/${toDelete.id}`);
      setToast({ message: `"${toDelete.name}" deleted`, type: "success" });
      // Reload current level
      if (toDelete.level === "makes")      { loadMakes(); setSelMake(null); setModels([]); setGens([]); setVariants([]); }
      if (toDelete.level === "models")     { selMake && loadModels(selMake.id); setSelModel(null); setGens([]); setVariants([]); }
      if (toDelete.level === "generations"){ selModel && loadGens(selModel.id); setSelGen(null); setVariants([]); }
      if (toDelete.level === "variants")   { selGen && loadVariants(selGen.id); }
    } catch {
      setToast({ message: "Failed to delete — it may have linked records", type: "error" });
    } finally {
      setToDelete(null);
    }
  };

  // ── Add handlers ─────────────────────────────────────────────────────────
  const addMake = async (e: React.FormEvent) => {
    e.preventDefault(); setAdding(true);
    try {
      await api.post("/makes", { name: newMake.name.trim(), countryOfOrigin: newMake.countryOfOrigin.trim() || undefined });
      setToast({ message: `Make "${newMake.name}" added`, type: "success" });
      setNewMake({ name: "", countryOfOrigin: "" });
      loadMakes();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message ?? "Failed to add make", type: "error" });
    } finally { setAdding(false); }
  };

  const addModel = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selMake) return; setAdding(true);
    try {
      await api.post("/models", { name: newModel.name.trim(), bodyType: newModel.bodyType || undefined, makeId: selMake.id });
      setToast({ message: `Model "${newModel.name}" added`, type: "success" });
      setNewModel({ name: "", bodyType: "" });
      loadModels(selMake.id);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message ?? "Failed to add model", type: "error" });
    } finally { setAdding(false); }
  };

  const addGen = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selModel) return; setAdding(true);
    try {
      await api.post("/generations", {
        name: newGen.name.trim(), code: newGen.code.trim() || undefined,
        yearStart: newGen.yearStart ? +newGen.yearStart : undefined,
        yearEnd:   newGen.yearEnd   ? +newGen.yearEnd   : undefined,
        modelId: selModel.id,
      });
      setToast({ message: `Generation "${newGen.name}" added`, type: "success" });
      setNewGen({ name: "", code: "", yearStart: "", yearEnd: "" });
      loadGens(selModel.id);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message ?? "Failed to add generation", type: "error" });
    } finally { setAdding(false); }
  };

  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selGen) return; setAdding(true);
    try {
      await api.post("/variants", {
        name: newVariant.name.trim(), engine: newVariant.engine || undefined,
        fuelType: newVariant.fuelType || undefined,
        powerKw:  newVariant.powerKw  ? +newVariant.powerKw : undefined,
        generationId: selGen.id,
      });
      setToast({ message: `Variant "${newVariant.name}" added`, type: "success" });
      setNewVariant({ name: "", engine: "", fuelType: "Diesel", powerKw: "" });
      loadVariants(selGen.id);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message ?? "Failed to add variant", type: "error" });
    } finally { setAdding(false); }
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const colClass = "bg-white rounded-xl shadow flex flex-col overflow-hidden";
  const headerClass = "px-4 py-3 bg-gray-50 border-b font-semibold text-gray-700 text-sm flex items-center justify-between";
  const itemClass = (active: boolean) =>
    `px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-blue-50 border-b last:border-0 text-sm transition-colors ${active ? "bg-blue-50 border-l-2 border-blue-500" : ""}`;

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btn = "bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && (
        <ConfirmModal
          message={`Delete "${toDelete.name}"? Any linked records will also be affected.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Vehicle Catalogue</h1>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <span className="font-medium text-gray-800">All Makes</span>
        {selMake && <><span>›</span><span className="font-medium text-gray-800">{selMake.name}</span></>}
        {selModel && <><span>›</span><span className="font-medium text-gray-800">{selModel.name}</span></>}
        {selGen && <><span>›</span><span className="font-medium text-gray-800">{selGen.name}</span></>}
      </div>

      <div className="grid grid-cols-4 gap-4">

        {/* ── Makes column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <span>Makes ({makes.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-72">
            {makes.length === 0 && <p className="px-4 py-4 text-gray-400 text-sm">No makes yet</p>}
            {makes.map(mk => (
              <div key={mk.id} className={itemClass(selMake?.id === mk.id)} onClick={() => selectMake(mk)}>
                <div>
                  <p className="font-medium text-gray-800">{mk.name}</p>
                  {mk.countryOfOrigin && <p className="text-xs text-gray-400">{mk.countryOfOrigin}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); setToDelete({ level: "makes", id: mk.id, name: mk.name }); }}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0">✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={addMake} className="p-3 border-t flex flex-col gap-2">
            <input value={newMake.name} onChange={e => setNewMake(p => ({ ...p, name: e.target.value }))}
              placeholder="Make name *" className={inp} required />
            <input value={newMake.countryOfOrigin} onChange={e => setNewMake(p => ({ ...p, countryOfOrigin: e.target.value }))}
              placeholder="Country (optional)" className={inp} />
            <button type="submit" disabled={adding} className={btn}>+ Add Make</button>
          </form>
        </div>

        {/* ── Models column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <span>Models {selMake ? `(${models.length})` : ""}</span>
            {selMake && <span className="text-xs text-blue-600 font-normal">{selMake.name}</span>}
          </div>
          <div className="flex-1 overflow-y-auto max-h-72">
            {!selMake && <p className="px-4 py-4 text-gray-400 text-sm">← Select a make</p>}
            {selMake && models.length === 0 && <p className="px-4 py-4 text-gray-400 text-sm">No models yet</p>}
            {models.map(m => (
              <div key={m.id} className={itemClass(selModel?.id === m.id)} onClick={() => selectModel(m)}>
                <div>
                  <p className="font-medium text-gray-800">{m.name}</p>
                  {m.bodyType && <p className="text-xs text-gray-400">{m.bodyType}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); setToDelete({ level: "models", id: m.id, name: m.name }); }}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0">✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={addModel} className="p-3 border-t flex flex-col gap-2">
            <input value={newModel.name} onChange={e => setNewModel(p => ({ ...p, name: e.target.value }))}
              placeholder="Model name *" className={inp} required disabled={!selMake} />
            <select value={newModel.bodyType} onChange={e => setNewModel(p => ({ ...p, bodyType: e.target.value }))}
              className={inp} disabled={!selMake}>
              <option value="">Body type…</option>
              {["Saloon","Hatchback","Estate","SUV","Coupe","Convertible","MPV","Van","Pickup"].map(t =>
                <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="submit" disabled={adding || !selMake} className={btn}>+ Add Model</button>
          </form>
        </div>

        {/* ── Generations column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <span>Generations {selModel ? `(${generations.length})` : ""}</span>
            {selModel && <span className="text-xs text-blue-600 font-normal">{selModel.name}</span>}
          </div>
          <div className="flex-1 overflow-y-auto max-h-72">
            {!selModel && <p className="px-4 py-4 text-gray-400 text-sm">← Select a model</p>}
            {selModel && generations.length === 0 && <p className="px-4 py-4 text-gray-400 text-sm">No generations yet</p>}
            {generations.map(g => (
              <div key={g.id} className={itemClass(selGen?.id === g.id)} onClick={() => selectGen(g)}>
                <div>
                  <p className="font-medium text-gray-800">{g.name}</p>
                  {(g.yearStart || g.yearEnd) && (
                    <p className="text-xs text-gray-400">{g.yearStart}–{g.yearEnd ?? "present"}</p>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); setToDelete({ level: "generations", id: g.id, name: g.name }); }}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0">✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={addGen} className="p-3 border-t flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={newGen.name} onChange={e => setNewGen(p => ({ ...p, name: e.target.value }))}
                placeholder="Name * (e.g. F30)" className={inp} required disabled={!selModel} />
              <input value={newGen.code} onChange={e => setNewGen(p => ({ ...p, code: e.target.value }))}
                placeholder="Code (e.g. F30)" className={inp} disabled={!selModel} />
              <input type="number" value={newGen.yearStart} onChange={e => setNewGen(p => ({ ...p, yearStart: e.target.value }))}
                placeholder="Year start" className={inp} disabled={!selModel} />
              <input type="number" value={newGen.yearEnd} onChange={e => setNewGen(p => ({ ...p, yearEnd: e.target.value }))}
                placeholder="Year end" className={inp} disabled={!selModel} />
            </div>
            <button type="submit" disabled={adding || !selModel} className={btn}>+ Add Generation</button>
          </form>
        </div>

        {/* ── Variants column ── */}
        <div className={colClass}>
          <div className={headerClass}>
            <span>Variants {selGen ? `(${variants.length})` : ""}</span>
            {selGen && <span className="text-xs text-blue-600 font-normal">{selGen.name}</span>}
          </div>
          <div className="flex-1 overflow-y-auto max-h-72">
            {!selGen && <p className="px-4 py-4 text-gray-400 text-sm">← Select a generation</p>}
            {selGen && variants.length === 0 && <p className="px-4 py-4 text-gray-400 text-sm">No variants yet</p>}
            {variants.map(v => (
              <div key={v.id} className={itemClass(false)}>
                <div>
                  <p className="font-medium text-gray-800">{v.name}</p>
                  <p className="text-xs text-gray-400">{[v.engine, v.fuelType, v.powerKw ? `${v.powerKw} kW` : null].filter(Boolean).join(" · ")}</p>
                </div>
                <button onClick={() => setToDelete({ level: "variants", id: v.id, name: v.name })}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0">✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={addVariant} className="p-3 border-t flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={newVariant.name} onChange={e => setNewVariant(p => ({ ...p, name: e.target.value }))}
                placeholder="Name * (e.g. 320d)" className={inp} required disabled={!selGen} />
              <input value={newVariant.engine} onChange={e => setNewVariant(p => ({ ...p, engine: e.target.value }))}
                placeholder="Engine (e.g. 2.0 TDI)" className={inp} disabled={!selGen} />
              <select value={newVariant.fuelType} onChange={e => setNewVariant(p => ({ ...p, fuelType: e.target.value }))}
                className={inp} disabled={!selGen}>
                {["Diesel","Petrol","Hybrid","Electric","LPG"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input type="number" value={newVariant.powerKw} onChange={e => setNewVariant(p => ({ ...p, powerKw: e.target.value }))}
                placeholder="Power (kW)" className={inp} disabled={!selGen} />
            </div>
            <button type="submit" disabled={adding || !selGen} className={btn}>+ Add Variant</button>
          </form>
        </div>

      </div>
    </div>
  );
}
