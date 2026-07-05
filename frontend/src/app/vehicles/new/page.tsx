'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import api from '@/lib/api';
import type { Make, CarModel, Generation, Variant } from '@/lib/types';
import { loadTemplates, getCategories, type PartTemplate } from '@/lib/partTemplates';
import { useLanguage } from '@/contexts/LanguageContext';

type Lang = 'en' | 'al' | 'de';

const LANG_LABELS: Record<Lang, string> = { en: 'EN', al: 'AL', de: 'DE' };

// ─── Component ───────────────────────────────────────────────────────────────
export default function NewVehiclePage() {
  const router = useRouter();
  const { t }  = useLanguage();

  // Step 1 state
  const [makes, setMakes]             = useState<Make[]>([]);
  const [models, setModels]           = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [variants, setVariants]       = useState<Variant[]>([]);
  const [makeId, setMakeId]               = useState('');
  const [modelId, setModelId]             = useState('');
  const [generationId, setGenerationId]   = useState('');
  const [variantId, setVariantId]         = useState('');
  const [vin, setVin]                     = useState('');
  const [year, setYear]                   = useState('');
  const [mileage, setMileage]             = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate]   = useState('');
  const [notes, setNotes]                 = useState('');
  const [status, setStatus]               = useState('in_stock');
  const [saving, setSaving]               = useState(false);
  const [variantsLoaded, setVariantsLoaded] = useState(false);

  // Step 2 state
  const [step, setStep]               = useState<1 | 2>(1);
  const [vehicleId, setVehicleId]     = useState<number | null>(null);
  const [vehicleTitle, setVehicleTitle] = useState('');
  const [lang, setLang]               = useState<Lang>('en');
  const [templates, setTemplates]     = useState<PartTemplate[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [condition, setCondition]     = useState<'good' | 'fair' | 'poor'>('good');
  const [addingParts, setAddingParts] = useState(false);
  const [progress, setProgress]       = useState({ done: 0, total: 0 });

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Load part templates from localStorage on mount
  useEffect(() => {
    const loaded = loadTemplates();
    setTemplates(loaded);
    setSelected(new Set(loaded.map(p => p.id)));
  }, []);

  // Cascading dropdowns
  useEffect(() => { api.get('/makes').then(r => setMakes(r.data)); }, []);
  useEffect(() => {
    if (!makeId) { setModels([]); setModelId(''); setGenerations([]); setGenerationId(''); setVariants([]); setVariantId(''); return; }
    api.get('/models', { params: { makeId } }).then(r => {
      const data = r.data;
      setModels(data);
      setModelId('');
      setGenerations([]); setGenerationId('');
      setVariants([]); setVariantId('');
      // auto-select if only one model
      if (data.length === 1) setModelId(String(data[0].id));
    });
  }, [makeId]);
  useEffect(() => {
    if (!modelId) { setGenerations([]); setGenerationId(''); setVariants([]); setVariantId(''); return; }
    api.get('/generations', { params: { modelId } }).then(r => {
      const data = r.data;
      setGenerations(data);
      setGenerationId('');
      setVariants([]); setVariantId('');
      // auto-select if only one generation
      if (data.length === 1) setGenerationId(String(data[0].id));
    });
  }, [modelId]);
  useEffect(() => {
    if (!generationId) { setVariants([]); setVariantId(''); setVariantsLoaded(false); return; }
    setVariantsLoaded(false);
    api.get('/variants', { params: { generationId } }).then(r => {
      const data = r.data;
      setVariants(data);
      setVariantId('');
      setVariantsLoaded(true);
      // auto-select if only one variant
      if (data.length === 1) setVariantId(String(data[0].id));
    });
  }, [generationId]);

  // ── Submit vehicle ──────────────────────────────────────────────────────────
  const submitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    // Warn if user selected make/model but didn't complete hierarchy to variant
    if (makeId && !variantId) {
      const noVariantsInCatalogue = generationId && variantsLoaded && variants.length === 0;
      setToast({
        msg: noVariantsInCatalogue
          ? 'This generation has no variants in the catalogue. Go to Catalogue → add Variants, then come back here.'
          : generationId
            ? 'Please select a Variant to link the full vehicle hierarchy.'
            : modelId
              ? 'Please select a Generation and Variant to link the model.'
              : 'Please complete the Make → Model → Generation → Variant selection.',
        type: 'error',
      });
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/vehicles', {
        variantId:     variantId     ? +variantId     : undefined,
        vin:           vin           || undefined,
        year:          year          ? +year          : undefined,
        mileage:       mileage       ? +mileage       : undefined,
        purchasePrice: purchasePrice ? +purchasePrice : undefined,
        purchaseDate:  purchaseDate  || undefined,
        status,
        notes:         notes         || undefined,
      });
      // Build a readable title for step 2
      const selVariant = variants.find(v => String(v.id) === variantId);
      const selGen     = generations.find(g => String(g.id) === generationId);
      const selModel   = models.find(m => String(m.id) === modelId);
      const selMake    = makes.find(m => String(m.id) === makeId);
      const title = [selMake?.name, selModel?.name, selGen?.code || selGen?.name, selVariant?.name, year ? `(${year})` : '']
        .filter(Boolean).join(' ') || `Vehicle #${data.id}`;
      setVehicleId(data.id);
      setVehicleTitle(title);
      setStep(2);
    } catch {
      setToast({ msg: 'Failed to add vehicle', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Part selection helpers ──────────────────────────────────────────────────
  const togglePart = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    const catIds = templates.filter(p => p.category === cat).map(p => p.id);
    const allOn  = catIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      catIds.forEach(id => allOn ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const selectAll  = () => setSelected(new Set(templates.map(p => p.id)));
  const selectNone = () => setSelected(new Set());

  // ── Submit parts ────────────────────────────────────────────────────────────
  const submitParts = async () => {
    if (!vehicleId) return;
    const toAdd = templates.filter(p => selected.has(p.id));
    if (toAdd.length === 0) { router.push(`/vehicles/${vehicleId}`); return; }

    setAddingParts(true);
    setProgress({ done: 0, total: toAdd.length });

    let done = 0;
    for (const part of toAdd) {
      try {
        await api.post('/parts', {
          name:      part[lang],
          condition,
          status:    'available',
          vehicleId,
        });
      } catch { /* skip failed ones */ }
      done++;
      setProgress({ done, total: toAdd.length });
    }

    setAddingParts(false);
    router.push(`/vehicles/${vehicleId}`);
  };

  // ── Style helpers ───────────────────────────────────────────────────────────
  const inp = 'w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-40';
  const sel = 'w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-40';

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Vehicle form
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="p-8 max-w-2xl mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.nav.vehicles}
        </button>
        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
            <span className="text-sm font-semibold text-blue-400">{t.newVehicle.step1}</span>
          </div>
          <div className="flex-1 h-px bg-[var(--border)] mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--border)] text-[var(--text-secondary)] text-xs flex items-center justify-center font-bold">2</div>
            <span className="text-sm text-[var(--text-secondary)]">{t.newVehicle.step2}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.newVehicle.title}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{t.newVehicle.subtitle}</p>
      </div>

      <form onSubmit={submitVehicle} className="space-y-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Vehicle Hierarchy</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Make</label>
              <select value={makeId} onChange={e => setMakeId(e.target.value)} className={sel}>
                <option value="">{t.newVehicle.selectMake}</option>
                {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Model</label>
              <select value={modelId} onChange={e => setModelId(e.target.value)} disabled={!makeId} className={sel}>
                <option value="">{t.newVehicle.selectModel}</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Generation</label>
              <select value={generationId} onChange={e => setGenerationId(e.target.value)} disabled={!modelId} className={sel}>
                <option value="">{t.newVehicle.selectGeneration}</option>
                {generations.map(g => <option key={g.id} value={g.id}>{g.name}{g.code ? ` (${g.code})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Variant</label>
              <select value={variantId} onChange={e => setVariantId(e.target.value)} disabled={!generationId} className={sel}>
                <option value="">{t.newVehicle.selectVariant}</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.name}{v.fuelType ? ` · ${v.fuelType}` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Warning: generation selected but no variants exist in catalogue */}
          {generationId && variantsLoaded && variants.length === 0 && (
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-400">No variants in catalogue for this generation</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Go to <strong className="font-semibold">Catalogue</strong> and add at least one Variant to this Generation, then come back here to create the vehicle.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Vehicle Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.vin}</label>
              <input value={vin} onChange={e => setVin(e.target.value)} placeholder="WBA3B31070F000001" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.year}</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2014" min={1980} max={2030} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.mileage}</label>
              <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="187000" min={0} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.purchasePrice}</label>
              <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="800" min={0} step="0.01" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.purchaseDate}</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.common.status}</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={sel}>
                <option value="in_stock">{t.status.in_stock}</option>
                <option value="scrapped">{t.status.scrapped}</option>
                <option value="sold">{t.status.sold}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t.newVehicle.notes}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Any additional notes…"
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 rounded-xl px-4 py-2.5 text-sm transition resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] py-2.5 rounded-xl text-sm font-medium transition-all">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
            {saving ? t.newVehicle.saving : t.newVehicle.saveAndContinue}
          </button>
        </div>
      </form>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Parts selection
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">{t.newVehicle.step1}</span>
        </div>
        <div className="flex-1 h-px bg-[var(--border)] mx-2" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
          <span className="text-sm font-semibold text-blue-400">{t.newVehicle.step2}</span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.newVehicle.step2}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Vehicle <span className="font-medium text-[var(--text-primary)]">{vehicleTitle}</span> saved. Select which parts to create automatically.
        </p>
      </div>

      {/* Controls bar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4">
        {/* Language picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">{t.newVehicle.lang}:</span>
          {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${lang === l ? 'bg-blue-600 text-white' : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)]'}`}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Condition */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">{t.newVehicle.condition}:</span>
          {(['good', 'fair', 'poor'] as const).map(c => (
            <button key={c} onClick={() => setCondition(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${condition === c
                ? c === 'good' ? 'bg-emerald-600 text-white'
                  : c === 'fair' ? 'bg-amber-500 text-white'
                  : 'bg-red-600 text-white'
                : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)]'}`}>
              {t.condition[c]}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Select all / none */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--text-secondary)]">{selected.size} of {templates.length} {t.common.selected}</span>
          <button onClick={selectAll}  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">{t.newVehicle.allSelected}</button>
          <button onClick={selectNone} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors">{t.newVehicle.noneSelected}</button>
        </div>
      </div>

      {/* Parts grid by category */}
      <div className="space-y-4 mb-6">
        {getCategories(templates).map(cat => {
          const catParts = templates.filter(p => p.category === cat);
          const allOn    = catParts.every(p => selected.has(p.id));
          const someOn   = catParts.some(p => selected.has(p.id));
          return (
            <div key={cat} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              {/* Category header */}
              <button onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-5 py-3 bg-[var(--surface)] border-b border-[var(--border-subtle)] hover:bg-black/[0.04] dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allOn ? 'bg-blue-600 border-blue-600' : someOn ? 'bg-blue-500/20 border-blue-500/40' : 'border-[var(--border)]'}`}>
                    {allOn && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                    {!allOn && someOn && <div className="w-1.5 h-1.5 bg-blue-400 rounded-sm" />}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{cat}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{catParts.filter(p => selected.has(p.id)).length}/{catParts.length}</span>
                </div>
              </button>

              {/* Parts grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y divide-[var(--border-subtle)]">
                {catParts.map(part => {
                  const on = selected.has(part.id);
                  return (
                    <label key={part.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${on ? 'bg-blue-500/5 hover:bg-blue-500/10' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.02]'}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => togglePart(part.id)}
                        className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500/40 shrink-0 bg-[var(--surface-raised)]"
                      />
                      <span className={`text-sm ${on ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{part[lang]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar while adding */}
      {addingParts && (
        <div className="mb-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">{t.newVehicle.addingParts}</span>
            <span className="text-sm text-[var(--text-secondary)]">{progress.done} / {progress.total}</span>
          </div>
          <div className="w-full bg-[var(--border)] rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/vehicles/${vehicleId}`)}
          disabled={addingParts}
          className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[var(--text-primary)] py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
        >
          {t.newVehicle.skip}
        </button>
        <button
          onClick={submitParts}
          disabled={addingParts || selected.size === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {addingParts
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> {t.newVehicle.addingParts}</>
            : t.newVehicle.addSelectedParts(selected.size)
          }
        </button>
      </div>
    </div>
  );
}
