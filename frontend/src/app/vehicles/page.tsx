'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';
import type { Vehicle } from '@/lib/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/vehicles').then(r => { setVehicles(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const getLabel = (v: Vehicle) => {
    const vt = v.variant;
    if (!vt) return 'Unknown vehicle';
    const g = vt.generation; const m = g?.model; const mk = m?.make;
    return `${mk?.name ?? ''} ${m?.name ?? ''} ${g?.name ?? ''} ${vt.name}`.trim();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <Link href="/vehicles/new" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition">+ Add Vehicle</Link>
        </div>
        {loading ? <p className="text-gray-400">Loading...</p> : vehicles.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No vehicles yet. Add your first one!</div>
        ) : (
          <div className="grid gap-4">
            {vehicles.map(v => (
              <Link key={v.id} href={`/vehicles/${v.id}`} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{getLabel(v)}</div>
                  <div className="text-sm text-gray-500 mt-1">{v.year ? `Year: ${v.year}` : ''}{v.mileage ? ` · ${v.mileage.toLocaleString()} km` : ''}{v.vin ? ` · VIN: ${v.vin}` : ''}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${v.status === 'in_stock' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{v.status}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
