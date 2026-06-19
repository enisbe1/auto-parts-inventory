import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityLog1750204200000 implements MigrationInterface {
  name = 'AddActivityLog1750204200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_log" (
        "id" SERIAL PRIMARY KEY,
        "action" VARCHAR NOT NULL,
        "entityType" VARCHAR,
        "entityId" INTEGER,
        "entityName" VARCHAR,
        "userId" INTEGER,
        "meta" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_activity_entityType" ON "activity_log" ("entityType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_activity_createdAt" ON "activity_log" ("createdAt" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_log"`);
  }
}
