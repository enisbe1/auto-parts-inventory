"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Part, Vehicle } from "@/lib/types";

export default function DashboardPage() {
  const [vehicleMeta, setVehicleMeta] = useState<{ total: number } | null>(null);
  const [partMeta, setPartMeta]       = useState<{ total: number } | null>(null);
  const [recentParts, setRecentParts] = useState<Part[]>([]);
  const [stats, setStats] = useState({ available: 0, sold: 0 });

  useEffect(() => {
    (async () => {
      const [vRes, pRes, avRes, soldRes] = await Promise.all([
        api.get("/vehicles", { params: { page: 1, limit: 1 } }),
        api.get("/parts",    { params: { page: 1, limit: 5 } }),
        api.get("/parts",    { params: { status: "available", page: 1, limit: 1 } }),
        api.get("/parts",    { params: { status: "sold",      page: 1, limit: 1 } }),
      ]);
      setVehicleMeta(vRes.data.meta);
      setPartMeta(pRes.data.meta);
      setRecentParts(pRes.data.data);
      setStats({ available: avRes.data.meta.total, sold: soldRes.data.meta.total });
    })();
  }, []);

  const vehicleLabel = (p: Part) => {
    const v = p.vehicle;
    if (!v?.variant) return "—";
    const { variant: va } = v;
    const g  = va.generation;
    const m  = g?.model;
    const mk = m?.make;
    return [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Vehicles", value: vehicleMeta?.total ?? "…", color: "blue" },
          { label: "Total Parts",    value: partMeta?.total    ?? "…", color: "indigo" },
          { label: "Available",      value: stats.available,           color: "green" },
          { label: "Sold",           value: stats.sold,                color: "gray" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Parts */}
      <div className="bg-white rounded-xl shadow">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Recent Parts</h2>
          <Link href="/parts" className="text-blue-600 text-sm hover:underline">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Name</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Vehicle</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Price</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentParts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No parts yet — add your first vehicle to get started</td></tr>
            )}
            {recentParts.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{vehicleLabel(p)}</td>
                <td className="px-4 py-3 text-gray-700">{p.price ? `€${Number(p.price).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === "available" ? "bg-green-100 text-green-700" :
                    p.status === "reserved"  ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
