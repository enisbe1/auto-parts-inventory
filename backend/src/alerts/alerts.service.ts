import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AlertsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async getAlerts(staleDays: number) {
    // Parts unsold for more than staleDays
    const staleParts = await this.ds.query(`
      SELECT p.id, p.name, p."partNumber", p.price, p."createdAt",
             EXTRACT(DAY FROM NOW() - p."createdAt")::int AS "daysInStock",
             v.id AS "vehicleId"
      FROM parts p
      LEFT JOIN vehicles v ON p."vehicleId" = v.id
      WHERE p.status = 'available'
        AND p."createdAt" < NOW() - INTERVAL '${staleDays} days'
      ORDER BY "daysInStock" DESC
      LIMIT 20
    `);

    // Vehicles with negative P/L (revenue from sold parts < purchase price)
    const negativeVehicles = await this.ds.query(`
      SELECT
        v.id,
        v."purchasePrice",
        COALESCE(SUM(CASE WHEN p.status = 'sold' THEN p.price ELSE 0 END), 0) AS revenue,
        (COALESCE(SUM(CASE WHEN p.status = 'sold' THEN p.price ELSE 0 END), 0) - v."purchasePrice") AS "netPL"
      FROM vehicles v
      LEFT JOIN parts p ON p."vehicleId" = v.id
      WHERE v."purchasePrice" IS NOT NULL
      GROUP BY v.id, v."purchasePrice"
      HAVING COALESCE(SUM(CASE WHEN p.status = 'sold' THEN p.price ELSE 0 END), 0) < v."purchasePrice"
        AND v.status != 'scrapped'
      ORDER BY "netPL" ASC
      LIMIT 10
    `);

    return {
      staleParts: staleParts.map((r: any) => ({
        ...r,
        price: parseFloat(r.price || 0),
        daysInStock: parseInt(r.daysInStock, 10),
      })),
      negativeVehicles: negativeVehicles.map((r: any) => ({
        ...r,
        purchasePrice: parseFloat(r.purchasePrice || 0),
        revenue: parseFloat(r.revenue || 0),
        netPL: parseFloat(r.netPL || 0),
      })),
    };
  }
}
