"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Vehicle, Part } from "@/lib/types";

export default function VehicleReportPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/vehicles/${id}`)
      .then(({ data }) => setVehicle(data))
      .catch(() => setError("Failed to load vehicle data."));
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", color: "#c00" }}>
        {error}
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif", color: "#666" }}>
        Loading…
      </div>
    );
  }

  const va = vehicle.variant;
  const g = va?.generation;
  const m = g?.model;
  const mk = m?.make;
  const title =
    [mk?.name, m?.name, g?.code, va?.name].filter(Boolean).join(" ") ||
    `Vehicle #${vehicle.id}`;

  const parts: Part[] = vehicle.parts ?? [];
  const sold = parts.filter((p) => p.status === "sold");
  const available = parts.filter((p) => p.status === "available");
  const reserved = parts.filter((p) => p.status === "reserved");

  const purchaseCost =
    vehicle.purchasePrice != null ? Number(vehicle.purchasePrice) : null;
  const soldRevenue = sold.reduce(
    (sum, p) => sum + (p.price != null ? Number(p.price) : 0),
    0
  );
  const netPL =
    purchaseCost != null ? soldRevenue - purchaseCost : null;
  const isProfit = netPL !== null && netPL >= 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          aside { display: none !important; }
          .no-print { display: none !important; }
          .print-page { margin: 0; padding: 24px; }
        }
        .print-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: white;
          color: #111;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
          min-height: 100vh;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #111;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .report-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #111;
        }
        .report-logo span {
          color: #2563eb;
        }
        .report-meta {
          text-align: right;
          font-size: 12px;
          color: #555;
        }
        .report-title {
          font-size: 26px;
          font-weight: 700;
          color: #111;
          margin-bottom: 4px;
        }
        .report-subtitle {
          font-size: 13px;
          color: #666;
          margin-bottom: 28px;
        }
        .section-heading {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #555;
          margin-top: 28px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 8px;
        }
        .info-cell {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px 14px;
        }
        .info-cell-label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .info-cell-value {
          font-size: 13px;
          font-weight: 600;
          color: #111;
        }
        .profit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 8px;
        }
        .profit-cell {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px 14px;
        }
        .profit-label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .profit-value {
          font-size: 18px;
          font-weight: 700;
          color: #111;
        }
        .profit-value.green { color: #16a34a; }
        .profit-value.red { color: #dc2626; }
        .parts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 4px;
        }
        .parts-table th {
          background: #f3f4f6;
          text-align: left;
          padding: 8px 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #555;
          border: 1px solid #e5e7eb;
        }
        .parts-table td {
          padding: 8px 10px;
          border: 1px solid #e5e7eb;
          color: #222;
          vertical-align: middle;
        }
        .parts-table tr:nth-child(even) td {
          background: #f9fafb;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .badge-available { background: #d1fae5; color: #065f46; }
        .badge-reserved  { background: #fef3c7; color: #92400e; }
        .badge-sold      { background: #e5e7eb; color: #374151; }
        .badge-good      { background: #d1fae5; color: #065f46; }
        .badge-fair      { background: #fef3c7; color: #92400e; }
        .badge-poor      { background: #fee2e2; color: #991b1b; }
        .report-footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #aaa;
          display: flex;
          justify-content: space-between;
        }
      `}</style>

      {/* Print / close button — hidden when printing */}
      <div className="no-print" style={{ background: "#f3f4f6", padding: "12px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 13, color: "#555" }}>Print preview — use the button below to print or save as PDF</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.history.back()}
            style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", fontSize: 13, cursor: "pointer", color: "#374151" }}
          >
            Back
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#2563eb", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="print-page">
        {/* Header */}
        <div className="report-header">
          <div>
            <div className="report-logo">
              Auto<span>Parts</span>
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              Inventory Management System
            </div>
          </div>
          <div className="report-meta">
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
              Vehicle Report
            </div>
            <div style={{ marginTop: 4 }}>Generated: {today}</div>
            <div>Vehicle ID: #{vehicle.id}</div>
          </div>
        </div>

        {/* Title */}
        <div className="report-title">{title}</div>
        <div className="report-subtitle">
          Status:{" "}
          <strong style={{ textTransform: "capitalize" }}>
            {vehicle.status.replace("_", " ")}
          </strong>
          {vehicle.vin && (
            <>
              {" "}
              &nbsp;·&nbsp; VIN: <strong>{vehicle.vin}</strong>
            </>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="section-heading">Vehicle Information</div>
        <div className="info-grid">
          {[
            { label: "VIN", value: vehicle.vin || "—" },
            { label: "Year", value: vehicle.year?.toString() || "—" },
            {
              label: "Mileage",
              value: vehicle.mileage
                ? `${vehicle.mileage.toLocaleString()} km`
                : "—",
            },
            {
              label: "Purchase Price",
              value:
                purchaseCost != null ? `€${fmt(purchaseCost)}` : "—",
            },
            {
              label: "Purchase Date",
              value: vehicle.purchaseDate
                ? new Date(vehicle.purchaseDate).toLocaleDateString()
                : "—",
            },
            { label: "Status", value: vehicle.status.replace("_", " ") },
          ].map((item) => (
            <div className="info-cell" key={item.label}>
              <div className="info-cell-label">{item.label}</div>
              <div className="info-cell-value">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Profitability */}
        <div className="section-heading">Profitability Summary</div>
        <div className="profit-grid">
          <div className="profit-cell">
            <div className="profit-label">Purchased For</div>
            <div className="profit-value">
              {purchaseCost != null ? `€${fmt(purchaseCost)}` : "—"}
            </div>
          </div>
          <div className="profit-cell">
            <div className="profit-label">Revenue (sold parts)</div>
            <div className="profit-value green">€{fmt(soldRevenue)}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {sold.length} part{sold.length !== 1 ? "s" : ""} sold
            </div>
          </div>
          <div className="profit-cell">
            <div className="profit-label">Net P/L</div>
            {netPL !== null ? (
              <>
                <div className={`profit-value ${isProfit ? "green" : "red"}`}>
                  {isProfit ? "+" : ""}€{fmt(netPL)}
                </div>
                <div style={{ fontSize: 11, color: isProfit ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                  {isProfit
                    ? "In profit"
                    : `€${fmt(Math.abs(netPL))} to break even`}
                </div>
              </>
            ) : (
              <div className="profit-value" style={{ color: "#aaa", fontSize: 14 }}>
                Set purchase price
              </div>
            )}
          </div>
        </div>

        {/* Parts */}
        <div className="section-heading">
          Parts Inventory ({parts.length} total — {available.length} available,{" "}
          {reserved.length} reserved, {sold.length} sold)
        </div>

        {parts.length === 0 ? (
          <p style={{ fontSize: 13, color: "#888", fontStyle: "italic" }}>
            No parts added to this vehicle.
          </p>
        ) : (
          <table className="parts-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Part Number</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ color: "#aaa", width: 32 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: "#555", fontFamily: "monospace" }}>
                    {p.partNumber || "—"}
                  </td>
                  <td>{p.category?.name || "—"}</td>
                  <td>
                    <span className={`badge badge-${p.condition}`}>
                      {p.condition}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {p.price != null ? `€${fmt(Number(p.price))}` : "—"}
                  </td>
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Notes */}
        {vehicle.notes && (
          <>
            <div className="section-heading">Notes</div>
            <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
              {vehicle.notes}
            </p>
          </>
        )}

        {/* Footer */}
        <div className="report-footer">
          <span>AutoParts Inventory Management</span>
          <span>Report generated {today}</span>
        </div>
      </div>
    </>
  );
}
