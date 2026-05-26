'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import type { Part } from '@/lib/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Part[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.get(`/parts?search=${encodeURIComponent(query)}`);
    setResults(data);
    setSearched(true);
  };

  const statusColor = (s: string) => s === 'available' ? 'bg-green-100 text-green-700' : s === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Search Inventory</h1>
        <form onSubmit={search} className="flex gap-3 mb-8">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by part name, number..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">Search</button>
        </form>
        {searched && (
          results.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No parts found for "{query}"</div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
              {results.map(p => (
                <div key={p.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-800">{p.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {p.category?.name && <span className="mr-3">📦 {p.category.name}</span>}
                      {p.vehicle?.variant && <span>🚗 {p.vehicle.variant.generation?.model?.make?.name} {p.vehicle.variant.name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{p.price ? `€${p.price}` : '—'}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
