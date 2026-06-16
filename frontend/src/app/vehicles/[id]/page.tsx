"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Vehicle, Part } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import SellPartModal from "@/components/SellPartModal";
import { useLanguage } from "@/contexts/LanguageContext";

const statusBadge = (status: string) => {
  if (status === "available") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (status === "reserved")  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
};

const conditionBadge = (c: string) => {
  if (c === "good") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (c === "fair") return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
};

const vehicleStatusBadge = (status: string) => {
  if (status === "in_stock") return "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  if (status === "sold")     return "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (status === "scrapped") return "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  return "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
};

export default function VehicleDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { t }   = useLanguage();
  const [vehicle, setVehicle]   = useState<Vehicle | null>(null);
  const [toDelete, setToDelete] = useState<Part | null>(null);
  const [delVehicle, setDelVeh] = useState(false);
  const [toast, setToast]       = useState<{ message: string; type: "success" | "error" } | null>(null);
  // Sell modal state
  const [sellPart, setSellPart] = useState<Part | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ partId: number; newStatus: string } | null>(null);

  const load = async () => {
    const { data } = await api.get(`/vehicles/${id}`);
    setVehicle(data);
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (part: Part, newStatus: string) => {
    if (newStatus === "sold") {
      // Intercept — show sell modal
      setSellPart(part);
      setPendingStatus({ partId: part.id, newStatus });
    } else {
      applyStatusUpdate(part.id, newStatus, undefined);
    }
  };

  const applyStatusUpdate = async (partId: number, status: string, price: number | undefined) => {
    try {
      const body: Record<string, unknown> = { status };
      if (price !== undefined) body.price = price;
      await api.patch(`/parts/${partId}`, body);
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    } finally {
      load(); // always reload so the UI reflects the true DB state
    }
  };

  const confirmSell = async (soldPrice: number | undefined) => {
    if (!pendingStatus) return;
    await applyStatusUpdate(pendingStatus.partId, "sold", soldPrice);
    setSellPart(null);
    setPendingStatus(null);
  };

  const cancelSell = () => {
    setSellPart(null);
    setPendingStatus(null);
  };

  const confirmDeletePart = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/parts/${toDelete.id}`);
      setToast({ message: "Part deleted", type: "success" });
      load();
    } catch {
      setToast({ message: "Failed to delete part", type: "error" });
    } finally {
      setToDelete(null);
    }
  };

  const confirmDeleteVehicle = async () => {
    try {
      await api.delete(`/vehicles/${id}`);
      router.push("/vehicles");
    } catch {
      setToast({ message: "Failed to delete vehicle", type: "error" });
      setDelVeh(false);
    }
  };

  if (!vehicle) {
    return (
      <div className="p-8 flex items-center justify-center text-zinc-400">
        <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        {t.common.loading}
      </div>
    );
  }

  const va    = vehicle.variant;
  const g     = va?.generation;
  const m     = g?.model;
  const mk    = m?.make;
  const title = [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") || `Vehicle #${vehicle.id}`;

  const parts     = vehicle.parts ?? [];
  const available = parts.filter((p) => p.status === "available");
  const reserved  = parts.filter((p) => p.status === "reserved");
  const sold      = parts.filter((p) => p.status === "sold");

  // Profitability
  const purchaseCost  = vehicle.purchasePrice ? Number(vehicle.purchasePrice) : null;
  const soldRevenue   = sold.reduce((sum, p) => sum + (p.price ? Number(p.price) : 0), 0);
  const potentialValue = [...available, ...reserved].reduce((sum, p) => sum + (p.price ? Number(p.price) : 0), 0);
  const profit        = purchaseCost !== null ? soldRevenue - purchaseCost : null;
  const isProfit      = profit !== null && profit >= 0;

  const infoItems = [
    { label: t.vehicleDetail.year,          value: vehicle.year?.toString() },
    { label: t.vehicleDetail.mileage,       value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : null },
    { label: t.vehicleDetail.purchasePrice, value: vehicle.purchasePrice ? `€${Number(vehicle.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null },
    { label: t.vehicleDetail.purchaseDate,  value: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : null },
    { label: t.vehicleDetail.vin,           value: vehicle.vin },
    { label: t.vehicleDetail.engine,        value: va?.engine },
    { label: t.vehicleDetail.fuelType,      value: va?.fuelType },
    { label: t.vehicleDetail.power,         value: va?.powerKw ? `${va.powerKw} kW` : null },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {toDelete && (
        <ConfirmModal message={`Delete part "${toDelete.name}"?`} onConfirm={confirmDeletePart} onCancel={() => setToDelete(null)} />
      )}
      {delVehicle && (
        <ConfirmModal
          message={`Delete "${title}"? All its parts will be unlinked.`}
          onConfirm={confirmDeleteVehicle}
          onCancel={() => setDelVeh(false)}
        />
      )}
      {sellPart && (
        <SellPartModal
          part={sellPart}
          onConfirm={confirmSell}
          onCancel={cancelSell}
        />
      )}

      {/* Breadcrumb + header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/vehicles")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.nav.vehicles}
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
            <span className={vehicleStatusBadge(vehicle.status)}>{vehicle.status.replace("_", " ")}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/vehicles/${id}/edit`)}
              className="inline-flex items-center gap-2 bg-[#18181b] border border-[#27272a] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {t.common.edit}
            </button>
            <button
              onClick={() => setDelVeh(true)}
              className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {t.common.delete}
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {infoItems.map((item) => (
          <div key={item.label} className="bg-[#18181b] rounded-lg px-4 py-3">
            <p className="text-xs text-zinc-600 mb-1">{item.label}</p>
            <p className="text-sm font-medium text-zinc-200">{item.value || <span className="text-zinc-600">—</span>}</p>
          </div>
        ))}
      </div>

      {/* Profitability card */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-100 text-sm">{t.vehicleDetail.profitability}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Purchase cost — blue accent */}
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 border-t-2 border-t-blue-500/40">
            <p className="text-xs font-medium text-zinc-600 mb-1">{t.vehicleDetail.purchasedFor}</p>
            <p className="font-bold text-zinc-200 text-lg">
              {purchaseCost != null ? `€${purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="text-zinc-600 text-base">—</span>}
            </p>
          </div>

          {/* Revenue from sold parts — emerald accent */}
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 border-t-2 border-t-emerald-500/40">
            <p className="text-xs font-medium text-emerald-500 mb-1">{t.vehicleDetail.revenue}</p>
            <p className="font-bold text-emerald-400 text-lg">
              €{soldRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">{sold.length} part{sold.length !== 1 ? "s" : ""} sold</p>
          </div>

          {/* Remaining potential — purple accent */}
          <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 border-t-2 border-t-purple-500/40">
            <p className="text-xs font-medium text-purple-400 mb-1">{t.vehicleDetail.remainingValue}</p>
            <p className="font-bold text-purple-300 text-lg">
              €{potentialValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              {available.length} avail., {reserved.length} reserved
            </p>
          </div>

          {/* Net profit — green/red accent */}
          <div className={`bg-[#111113] border border-[#27272a] rounded-xl p-4 border-t-2 ${profit !== null ? (isProfit ? "border-t-emerald-500/40" : "border-t-red-500/40") : "border-t-zinc-500/40"}`}>
            <p className={`text-xs font-medium mb-1 ${profit !== null ? (isProfit ? "text-emerald-500" : "text-red-400") : "text-zinc-600"}`}>
              {t.vehicleDetail.netPL}
            </p>
            {profit !== null ? (
              <>
                <p className={`font-bold text-lg ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                  {isProfit ? "+" : ""}€{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs mt-0.5 ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                  {isProfit ? "In profit" : `€${Math.abs(profit).toFixed(2)} to break even`}
                </p>
              </>
            ) : (
              <p className="font-bold text-zinc-600 text-base">Set purchase price</p>
            )}
          </div>
        </div>
      </div>

      {/* Parts summary mini-stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t.status.available, value: available.length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: t.status.reserved,  value: reserved.length,  color: "text-amber-400",   bg: "bg-amber-500/10" },
          { label: t.status.sold,      value: sold.length,      color: "text-zinc-400",    bg: "bg-zinc-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111113] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-sm text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Parts table */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <div>
            <h2 className="font-semibold text-zinc-100">{t.vehicleDetail.partsInventory}</h2>
            <p className="text-xs text-zinc-600 mt-0.5">{parts.length} part{parts.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href={`/parts/new?vehicleId=${id}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.vehicleDetail.addPart}
          </Link>
        </div>

        {parts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-500 text-sm">No parts added yet</p>
            <p className="text-zinc-600 text-xs mt-1">Add parts from this vehicle using the button above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f0f12] border-b border-[#1f1f23]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cond.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.common.status}</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23]">
              {parts.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-zinc-100">{p.name}</td>
                  <td className="px-6 py-3.5 text-zinc-500 text-xs">{p.category?.name || <span className="text-zinc-700">—</span>}</td>
                  <td className="px-6 py-3.5">
                    <span className={conditionBadge(p.condition)}>{p.condition}</span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-zinc-300">
                    {p.price != null ? `€${Number(p.price).toFixed(2)}` : <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    {p.status === "sold" ? (
                      <span className={statusBadge("sold")}>{t.status.sold}</span>
                    ) : (
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p, e.target.value)}
                        className="bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
                      >
                        <option value="available">{t.status.available}</option>
                        <option value="reserved">{t.status.reserved}</option>
                        <option value="sold">{t.status.sold}</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => router.push(`/parts/${p.id}/edit`)} className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">{t.common.edit}</button>
                      <button onClick={() => setToDelete(p)} className="text-xs font-medium text-zinc-600 hover:text-red-400 transition-colors">{t.common.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {vehicle.notes && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">{t.common.notes}</p>
          <p className="text-sm text-zinc-300">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}
