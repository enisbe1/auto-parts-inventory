'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';
import type { Part } from '@/lib/types';

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = (s?: string) => {
    const params = s ? `?status=${s}` : '';
    api.get(`/parts${params}`).then(r => { setParts(r.data); setLoading(false); });
  };
  useEffect(() => { load(status); }, [status]);

  const updateStatus = async (id: number, newStatus: string) => {
    await api.patch(`/parts/${id}`, { status: newStatus });
    load(status);
  };

  const statusColor = (s: string) => s === 'available' ? 'bg-green-100 text-green-700' : s === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Parts Inventory</h1>
          <Link href="/parts/new" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition">+ Add Part</Link>
        </div>
        <div className="flex gap-2 mb-4">
          {['', 'available', 'reserved', 'sold'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 rounded-full text-sm font-medium border transition ${status === s ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <p className="text-gray-400">Loading...</p> : parts.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No parts found.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                <th className="px-4 py-3 text-left">Part</th><th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Vehicle</th><th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Price</th><th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {parts.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="font-medium text-gray-800">{p.name}</div>{p.partNumber && <div className="text-xs text-gray-400">{p.partNumber}</div>}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.vehicle?.variant ? `${p.vehicle.variant.generation?.model?.make?.name} ${p.vehicle.variant.name}` : '—'}</td>
                    <td className="px-4 py-3 capitalize">{p.condition}</td>
                    <td className="px-4 py-3">{p.price ? `€${p.price}` : '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)} className="text-xs border rounded px-2 py-1 text-gray-600">
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
