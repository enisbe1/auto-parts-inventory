import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async getSummary() {
    const [partsSold] = await this.ds.query(`
      SELECT COUNT(*) AS count, COALESCE(SUM(price), 0) AS revenue
      FROM parts WHERE status = 'sold'
    `);
    const [vehicles] = await this.ds.query(`
      SELECT COUNT(*) AS count, COALESCE(SUM("purchasePrice"), 0) AS "totalCost"
      FROM vehicles
    `);
    const revenue   = parseFloat(partsSold.revenue);
    const totalCost = parseFloat(vehicles.totalCost);
    return {
      totalPartsSold:    parseInt(partsSold.count, 10),
      totalRevenue:      revenue,
      totalVehicles:     parseInt(vehicles.count, 10),
      totalPurchaseCost: totalCost,
      netPL:             revenue - totalCost,
    };
  }

  async getSalesByDay(year: number, month: number) {
    const rows = await this.ds.query(`
      SELECT
        TO_CHAR(COALESCE("soldAt", "createdAt"), 'YYYY-MM-DD') AS day,
        COUNT(*)                                                 AS count,
        COALESCE(SUM(price), 0)                                  AS revenue
      FROM parts
      WHERE status = 'sold'
        AND EXTRACT(YEAR  FROM COALESCE("soldAt", "createdAt")) = $1
        AND EXTRACT(MONTH FROM COALESCE("soldAt", "createdAt")) = $2
      GROUP BY day
      ORDER BY day
    `, [year, month]);
    return rows.map((r: any) => ({
      day:     r.day,
      count:   parseInt(r.count, 10),
      revenue: parseFloat(r.revenue),
    }));
  }

  async getSalesByMonth(year: number) {
    const rows = await this.ds.query(`
      SELECT
        EXTRACT(MONTH FROM COALESCE("soldAt", "createdAt"))::int AS month,
        COUNT(*)                                                   AS count,
        COALESCE(SUM(price), 0)                                    AS revenue
      FROM parts
      WHERE status = 'sold'
        AND EXTRACT(YEAR FROM COALESCE("soldAt", "createdAt")) = $1
      GROUP BY month
      ORDER BY month
    `, [year]);
    return rows.map((r: any) => ({
      month:   parseInt(r.month, 10),
      count:   parseInt(r.count, 10),
      revenue: parseFloat(r.revenue),
    }));
  }

  async getPurchasesByDay(year: number, month: number) {
    const rows = await this.ds.query(`
      SELECT
        TO_CHAR(
          CASE WHEN "purchaseDate" IS NOT NULL AND "purchaseDate" <> ''
               THEN "purchaseDate"::date
               ELSE "createdAt"
          END, 'YYYY-MM-DD'
        ) AS day,
        COUNT(*)                       AS count,
        COALESCE(SUM("purchasePrice"), 0) AS "totalCost"
      FROM vehicles
      WHERE EXTRACT(YEAR FROM
          CASE WHEN "purchaseDate" IS NOT NULL AND "purchaseDate" <> ''
               THEN "purchaseDate"::date ELSE "createdAt" END) = $1
        AND EXTRACT(MONTH FROM
          CASE WHEN "purchaseDate" IS NOT NULL AND "purchaseDate" <> ''
               THEN "purchaseDate"::date ELSE "createdAt" END) = $2
      GROUP BY day
      ORDER BY day
    `, [year, month]);
    return rows.map((r: any) => ({
      day:       r.day,
      count:     parseInt(r.count, 10),
      totalCost: parseFloat(r.totalCost),
    }));
  }

  async getPurchasesByMonth(year: number) {
    const rows = await this.ds.query(`
      SELECT
        EXTRACT(MONTH FROM
          CASE WHEN "purchaseDate" IS NOT NULL AND "purchaseDate" <> ''
               THEN "purchaseDate"::date ELSE "createdAt" END)::int AS month,
        COUNT(*)                       AS count,
        COALESCE(SUM("purchasePrice"), 0) AS "totalCost"
      FROM vehicles
      WHERE EXTRACT(YEAR FROM
          CASE WHEN "purchaseDate" IS NOT NULL AND "purchaseDate" <> ''
               THEN "purchaseDate"::date ELSE "createdAt" END) = $1
      GROUP BY month
      ORDER BY month
    `, [year]);
    return rows.map((r: any) => ({
      month:     parseInt(r.month, 10),
      count:     parseInt(r.count, 10),
      totalCost: parseFloat(r.totalCost),
    }));
  }

  async getPurchasesByYear() {
    const rows = await this.ds.query(`
      SELECT
        EXTRACT(YEAR FROM
          CASE WHEN "purchaseDate" IS NOT NULL AND "purchaseDate" <> ''
               THEN "purchaseDate"::date ELSE "createdAt" END)::int AS year,
        COUNT(*)                       AS count,
        COALESCE(SUM("purchasePrice"), 0) AS "totalCost"
      FROM vehicles
      GROUP BY year
      ORDER BY year
    `);
    return rows.map((r: any) => ({
      year:      parseInt(r.year, 10),
      count:     parseInt(r.count, 10),
      totalCost: parseFloat(r.totalCost),
    }));
  }
}
