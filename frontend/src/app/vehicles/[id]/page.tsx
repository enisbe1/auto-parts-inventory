'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import api from '@/lib/api';
import type { Vehicle, Part } from '@/lib/types';
import Link from 'next/link';

export default function VehicleDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [confirm, setConfirm] = useState<{partId?:number;vehicle?:boolean}|null>(null);

  const load = () => api.get(`/vehicles/${id}`).then(r => { setVehicle(r.data); setLoading(false); });
  useEffect(() => { load(); }, [id]);

  const getLabel = (v: Vehicle) => {
    const vt = v.variant;
    if (!vt) return 'Unknown vehicle';
    const g = vt.generation; const m = g?.model; const mk = m?.make;
    return `${mk?.name ?? ''} ${m?.name ?? ''} ${g?.name ?? ''} ${vt.name}`.trim();
  };

  const deletePart = async (partId: number) => {
    try {
      await api.delete(`/parts/${partId}`);
      setToast({ msg: 'Part deleted', type: 'success' });
      load();
    } catch { setToast({ msg: 'Failed to delete part', type: 'error' }); }
    setConfirm(null);
  };

  const deleteVehicle = async () => {
    try {
      await api.delete(`/vehicles/${id}`);
      setToast({ msg: 'Vehicle deleted', type: 'success' });
      setTimeout(() => router.push('/vehicles'), 1200);
    } catch { setToast({ msg: 'Failed to delete vehicle', type: 'error' }); }
    setConfirm(null);
  };

  const updatePartStatus = async (partId: number, status: string) => {
    await api.patch(`/parts/${partId}`, { status });
    load();
  };

  const statusColor = (s: string) =>
    s === 'available' ? 'bg-green-100 text-green-700' :
    s === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Loading...</div></div>;
  if (!vehicle) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Vehicle not found.</div></div>;

  const parts: Part[] = vehicle.parts ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmModal
          message={confirm.vehicle ? 'Delete this vehicle and all its parts?' : 'Delete this part?'}
          onConfirm={() => confirm.vehicle ? deleteVehicle() : deletePart(confirm.partId!)}
          onCancel={() => setConfirm(null)}
        />
      )}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-2xl font-bold text-gray-800">{getLabel(vehicle)}</h1>
        </div>

        {/* Vehicle info card */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              {[
                ['VIN', vehicle.vin ?? '—'],
                ['Year', vehicle.year ?? '—'],
                ['Mileage', vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—'],
                ['Purchase Price', vehicle.purchasePrice ? `€${vehicle.purchasePrice}` : '—'],
                ['Purchase Date', vehicle.purchaseDate ?? '—'],
                ['Status', vehicle.status],
                ['Total Parts', parts.length],
                ['Available', parts.filter(p => p.status === 'available').length],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{val}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setConfirm({ vehicle: true })}
              className="ml-4 text-red-500 hover:text-red-700 text-sm border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
              Delete Vehicle
            </button>
          </div>
          {vehicle.notes && <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">📝 {vehicle.notes}</p>}
        </div>

        {/* Parts list */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Parts ({parts.length})</h2>
          <Link href={`/parts/new?vehicleId=${id}`}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition">
            + Add Part
          </Link>
        </div>

        {parts.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            No parts registered yet.
            <Link href={`/parts/new?vehicleId=${id}`} className="ml-2 text-blue-600 hover:underline">Add the first part →</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Part</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Condition</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parts.map(part => (
                  <tr key={part.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{part.name}</div>
                      {part.partNumber && <div className="text-xs text-gray-400">{part.partNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{part.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{part.condition}</td>
                    <td className="px-4 py-3 font-medium">{part.price ? `€${part.price}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(part.status)}`}>{part.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select value={part.status} onChange={e => updatePartStatus(part.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 text-gray-600">
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                        </select>
                        <button onClick={() => setConfirm({ partId: part.id })}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
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
