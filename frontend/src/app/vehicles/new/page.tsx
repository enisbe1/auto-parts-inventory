'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import api from '@/lib/api';
import type { Make, CarModel, Generation, Variant } from '@/lib/types';

export default function NewVehiclePage() {
  const router = useRouter();
  const [makes, setMakes]           = useState<Make[]>([]);
  const [models, setModels]         = useState<CarModel[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [variants, setVariants]     = useState<Variant[]>([]);

  const [makeId, setMakeId]         = useState('');
  const [modelId, setModelId]       = useState('');
  const [generationId, setGenerationId] = useState('');
  const [variantId, setVariantId]   = useState('');
  const [vin, setVin]               = useState('');
  const [year, setYear]             = useState('');
  const [mileage, setMileage]       = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate]   = useState('');
  const [notes, setNotes]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<{msg:string;type:'success'|'error'}|null>(null);

  useEffect(() => { api.get('/makes').then(r => setMakes(r.data)); }, []);

  useEffect(() => {
    if (!makeId) { setModels([]); setModelId(''); return; }
    api.get(`/models?makeId=${makeId}`).then(r => { setModels(r.data); setModelId(''); setGenerations([]); setVariants([]); });
  }, [makeId]);

  useEffect(() => {
    if (!modelId) { setGenerations([]); setGenerationId(''); return; }
    api.get(`/generations?modelId=${modelId}`).then(r => { setGenerations(r.data); setGenerationId(''); setVariants([]); });
  }, [modelId]);

  useEffect(() => {
    if (!generationId) { setVariants([]); setVariantId(''); return; }
    api.get(`/variants?generationId=${generationId}`).then(r => { setVariants(r.data); setVariantId(''); });
  }, [generationId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/vehicles', {
        variantId: variantId ? +variantId : undefined,
        vin: vin || undefined,
        year: year ? +year : undefined,
        mileage: mileage ? +mileage : undefined,
        purchasePrice: purchasePrice ? +purchasePrice : undefined,
        purchaseDate: purchaseDate || undefined,
        notes: notes || undefined,
      });
      setToast({ msg: 'Vehicle added successfully!', type: 'success' });
      setTimeout(() => router.push('/vehicles'), 1200);
    } catch {
      setToast({ msg: 'Failed to add vehicle. Are you logged in?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, el: React.ReactNode, req = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{req && <span className="text-red-500 ml-1">*</span>}</label>
      {el}
    </div>
  );
  const inp = (props: any) => <input {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />;
  const sel = (props: any) => <select {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-2xl font-bold text-gray-800">Add Vehicle</h1>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-5">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Vehicle Hierarchy</p>

          {field('Make', sel({ value: makeId, onChange: (e:any) => setMakeId(e.target.value) }),
            <><option value="">— Select Make —</option>{makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</>
          )}
          {field('Model', sel({ value: modelId, onChange: (e:any) => setModelId(e.target.value), disabled: !makeId }),
            <><option value="">— Select Model —</option>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</>
          )}
          {field('Generation', sel({ value: generationId, onChange: (e:any) => setGenerationId(e.target.value), disabled: !modelId }),
            <><option value="">— Select Generation —</option>{generations.map(g => <option key={g.id} value={g.id}>{g.name}{g.code ? ` (${g.code})` : ''}</option>)}</>
          )}
          {field('Variant', sel({ value: variantId, onChange: (e:any) => setVariantId(e.target.value), disabled: !generationId }),
            <><option value="">— Select Variant —</option>{variants.map(v => <option key={v.id} value={v.id}>{v.name}{v.fuelType ? ` · ${v.fuelType}` : ''}</option>)}</>
          )}

          <hr className="border-gray-100" />
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Vehicle Details</p>

          <div className="grid grid-cols-2 gap-4">
            {field('VIN', inp({ value: vin, onChange: (e:any) => setVin(e.target.value), placeholder: 'WBA3B31070F000001' }))}
            {field('Year', inp({ type: 'number', value: year, onChange: (e:any) => setYear(e.target.value), placeholder: '2014', min: 1980, max: 2030 }))}
            {field('Mileage (km)', inp({ type: 'number', value: mileage, onChange: (e:any) => setMileage(e.target.value), placeholder: '187000', min: 0 }))}
            {field('Purchase Price (€)', inp({ type: 'number', value: purchasePrice, onChange: (e:any) => setPurchasePrice(e.target.value), placeholder: '800', min: 0, step: '0.01' }))}
            {field('Purchase Date', inp({ type: 'date', value: purchaseDate, onChange: (e:any) => setPurchaseDate(e.target.value) }))}
          </div>

          {field('Notes', <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            placeholder="Any additional notes about this vehicle..." />)}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
