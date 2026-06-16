import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration.
 * Uses CREATE TABLE IF NOT EXISTS so it is safe to run against a database
 * that was previously managed by TypeORM's synchronize:true.
 */
export class InitialSchema1781636490414 implements MigrationInterface {
  name = 'InitialSchema1781636490414';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── users ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"        SERIAL PRIMARY KEY,
        "email"     VARCHAR NOT NULL UNIQUE,
        "password"  VARCHAR NOT NULL,
        "role"      VARCHAR NOT NULL DEFAULT 'operator',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── categories ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id"          SERIAL PRIMARY KEY,
        "name"        VARCHAR NOT NULL UNIQUE,
        "description" VARCHAR
      )
    `);

    // ── makes ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "makes" (
        "id"              SERIAL PRIMARY KEY,
        "name"            VARCHAR NOT NULL UNIQUE,
        "countryOfOrigin" VARCHAR
      )
    `);

    // ── car_models ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "car_models" (
        "id"       SERIAL PRIMARY KEY,
        "name"     VARCHAR NOT NULL,
        "bodyType" VARCHAR,
        "makeId"   INTEGER NOT NULL,
        CONSTRAINT "fk_car_models_make"
          FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE CASCADE
      )
    `);

    // ── generations ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "generations" (
        "id"        SERIAL PRIMARY KEY,
        "name"      VARCHAR NOT NULL,
        "code"      VARCHAR,
        "yearStart" INTEGER,
        "yearEnd"   INTEGER,
        "modelId"   INTEGER NOT NULL,
        CONSTRAINT "fk_generations_model"
          FOREIGN KEY ("modelId") REFERENCES "car_models"("id") ON DELETE CASCADE
      )
    `);

    // ── variants ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "variants" (
        "id"           SERIAL PRIMARY KEY,
        "name"         VARCHAR NOT NULL,
        "engine"       VARCHAR,
        "fuelType"     VARCHAR,
        "powerKw"      INTEGER,
        "generationId" INTEGER NOT NULL,
        CONSTRAINT "fk_variants_generation"
          FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE
      )
    `);

    // ── vehicles ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id"            SERIAL PRIMARY KEY,
        "vin"           VARCHAR,
        "year"          INTEGER,
        "mileage"       INTEGER,
        "purchasePrice" DECIMAL(10,2),
        "purchaseDate"  VARCHAR,
        "status"        VARCHAR NOT NULL DEFAULT 'in_stock',
        "notes"         VARCHAR,
        "variantId"     INTEGER,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_vehicles_variant"
          FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `COMMENT ON COLUMN "vehicles"."status" IS 'in_stock | scrapped | sold'`,
    );

    // ── parts ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parts" (
        "id"         SERIAL PRIMARY KEY,
        "name"       VARCHAR NOT NULL,
        "partNumber" VARCHAR,
        "condition"  VARCHAR NOT NULL DEFAULT 'good',
        "price"      DECIMAL(10,2),
        "status"     VARCHAR NOT NULL DEFAULT 'available',
        "notes"      VARCHAR,
        "vehicleId"  INTEGER,
        "categoryId" INTEGER,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_parts_vehicle"
          FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_parts_category"
          FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    // ── indexes ───────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parts_name"       ON "parts"("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parts_status"     ON "parts"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parts_vehicleId"  ON "parts"("vehicleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parts_categoryId" ON "parts"("categoryId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_parts_categoryId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_parts_vehicleId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_parts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_parts_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "variants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "generations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "car_models"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "makes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
