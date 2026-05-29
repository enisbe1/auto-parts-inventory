'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import api from '@/lib/api';
import type { Vehicle, Category } from '@/lib/types';

export default function NewPartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicleId');

  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicleId, setVehicleId]   = useState(preselectedVehicleId ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName]             = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [condition, setCondition]   = useState('good');
  const [price, setPrice]           = useState('');
  const [status, setStatus]         = useState('available');
  const [notes, setNotes]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState<{msg:string;type:'success'|'error'}|null>(null);

  useEffect(() => {
    Promise.all([api.get('/vehicles'), api.get('/categories')]).then(([v, c]) => {
      setVehicles(v.data);
      setCategories(c.data);
    });
  }, []);

  const getVehicleLabel = (v: Vehicle) => {
    const vt = v.variant;
    if (!vt) return `Vehicle #${v.id}`;
    const g = vt.generation; const m = g?.model; const mk = m?.make;
    return `${mk?.name ?? ''} ${m?.name ?? ''} ${g?.name ?? ''} ${vt.name} ${v.year ? `(${v.year})` : ''}`.trim();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setToast({ msg: 'Part name is required', type: 'error' }); return; }
    setLoading(true);
    try {
      const res = await api.post('/parts', {
        name: name.trim(),
        partNumber: partNumber || undefined,
        condition,
        price: price ? +price : undefined,
        status,
        notes: notes || undefined,
        vehicleId: vehicleId ? +vehicleId : undefined,
        categoryId: categoryId ? +categoryId : undefined,
      });
      setToast({ msg: 'Part added successfully!', type: 'success' });
      setTimeout(() => {
        if (preselectedVehicleId) router.push(`/vehicles/${preselectedVehicleId}`);
        else router.push('/parts');
      }, 1200);
    } catch {
      setToast({ msg: 'Failed to add part. Are you logged in?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const inp = (props: any) => <input {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />;
  const sel = (props: any, children: any) => <select {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white">{children}</select>;
  const field = (label: string, el: React.ReactNode, req = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{req && <span className="text-red-500 ml-1">*</span>}</label>
      {el}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-2xl font-bold text-gray-800">Add Part</h1>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-5">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Part Information</p>

          {field('Part Name', inp({ value: name, onChange: (e:any) => setName(e.target.value), placeholder: 'e.g. N47 2.0 Diesel Engine', required: true }), true)}

          <div className="grid grid-cols-2 gap-4">
            {field('Part Number', inp({ value: partNumber, onChange: (e:any) => setPartNumber(e.target.value), placeholder: 'OEM or aftermarket number' }))}
            {field('Price (€)', inp({ type: 'number', value: price, onChange: (e:any) => setPrice(e.target.value), placeholder: '450', min: 0, step: '0.01' }))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Condition', sel({ value: condition, onChange: (e:any) => setCondition(e.target.value) },
              <>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </>
            ))}
            {field('Status', sel({ value: status, onChange: (e:any) => setStatus(e.target.value) },
              <>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </>
            ))}
          </div>

          <hr className="border-gray-100" />
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Classification</p>

          {field('Source Vehicle', sel({ value: vehicleId, onChange: (e:any) => setVehicleId(e.target.value) },
            <>
              <option value="">— No vehicle selected —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{getVehicleLabel(v)}</option>)}
            </>
          ))}

          {field('Category', sel({ value: categoryId, onChange: (e:any) => setCategoryId(e.target.value) },
            <>
              <option value="">— No category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </>
          ))}

          {field('Notes', <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            placeholder="Any notes about this part..." />)}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Part'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
