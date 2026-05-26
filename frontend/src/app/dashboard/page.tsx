'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ vehicles: 0, parts: 0, available: 0, sold: 0 });
  const [recentParts, setRecentParts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.get('/vehicles'), api.get('/parts')]).then(([v, p]) => {
      const parts = p.data;
      setStats({
        vehicles: v.data.length,
        parts: parts.length,
        available: parts.filter((p: any) => p.status === 'available').length,
        sold: parts.filter((p: any) => p.status === 'sold').length,
      });
      setRecentParts(parts.slice(0, 5));
    }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Vehicles', value: stats.vehicles, color: 'bg-blue-600', link: '/vehicles' },
    { label: 'Total Parts', value: stats.parts, color: 'bg-green-600', link: '/parts' },
    { label: 'Available', value: stats.available, color: 'bg-yellow-500', link: '/parts?status=available' },
    { label: 'Sold', value: stats.sold, color: 'bg-gray-500', link: '/parts?status=sold' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map(c => (
            <Link key={c.label} href={c.link} className={`${c.color} text-white rounded-xl p-5 shadow hover:opacity-90 transition`}>
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="text-sm mt-1 opacity-90">{c.label}</div>
            </Link>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Recent Parts</h2>
          {recentParts.length === 0 ? (
            <p className="text-gray-400 text-sm">No parts yet. <Link href="/parts" className="text-blue-600 hover:underline">Add your first part →</Link></p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Name</th><th className="pb-2">Condition</th><th className="pb-2">Price</th><th className="pb-2">Status</th></tr></thead>
              <tbody>
                {recentParts.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 capitalize">{p.condition}</td>
                    <td className="py-2">{p.price ? `€${p.price}` : '—'}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'available' ? 'bg-green-100 text-green-700' : p.status === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
