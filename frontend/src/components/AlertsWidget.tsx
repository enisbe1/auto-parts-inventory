"use client";
import Link from "next/link";

interface StalePart {
  id: number;
  name: string;
  partNumber: string | null;
  price: number;
  daysInStock: number;
  vehicleId: number | null;
}

interface NegativeVehicle {
  id: number;
  purchasePrice: number;
  revenue: number;
  netPL: number;
}

interface AlertsData {
  staleParts: StalePart[];
  negativeVehicles: NegativeVehicle[];
}

interface AlertsWidgetProps {
  alerts: AlertsData;
}

export default function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const staleParts = alerts.staleParts ?? [];
  const negativeVehicles = alerts.negativeVehicles ?? [];

  if (staleParts.length === 0 && negativeVehicles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Slow-moving parts */}
      {staleParts.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Slow-moving Parts</h3>
                <p className="text-xs text-[var(--text-secondary)]">Unsold for 30+ days</p>
              </div>
            </div>
            {staleParts.length > 3 && (
              <Link
                href="/parts?status=available"
                className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
              >
                View all {staleParts.length}
              </Link>
            )}
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {staleParts.slice(0, 3).map((part) => (
              <div key={part.id} className="flex items-center gap-3 px-5 py-3.5 border-l-2 border-amber-500/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{part.name}</p>
                  {part.partNumber && (
                    <p className="text-xs text-[var(--text-muted)] font-mono">{part.partNumber}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-amber-400">{part.daysInStock}d in stock</p>
                  {part.price > 0 && (
                    <p className="text-xs text-[var(--text-secondary)]">€{part.price.toFixed(2)}</p>
                  )}
                </div>
                <Link
                  href={`/parts/${part.id}/edit`}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles in the red */}
      {negativeVehicles.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-500/15 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Vehicles in the Red</h3>
                <p className="text-xs text-[var(--text-secondary)]">Negative P/L vs. purchase price</p>
              </div>
            </div>
            {negativeVehicles.length > 3 && (
              <Link
                href="/vehicles"
                className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
              >
                View all {negativeVehicles.length}
              </Link>
            )}
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {negativeVehicles.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3.5 border-l-2 border-red-500/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Vehicle #{v.id}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Purchased: €{v.purchasePrice.toFixed(2)} &middot; Revenue: €{v.revenue.toFixed(2)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-red-400">
                    {v.netPL >= 0 ? "+" : ""}€{v.netPL.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">net P/L</p>
                </div>
                <Link
                  href={`/vehicles/${v.id}`}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
