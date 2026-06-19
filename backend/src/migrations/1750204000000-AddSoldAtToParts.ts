import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoldAtToParts1750204000000 implements MigrationInterface {
  name = 'AddSoldAtToParts1750204000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "parts"
      ADD COLUMN IF NOT EXISTS "soldAt" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "parts"
      DROP COLUMN IF EXISTS "soldAt"
    `);
  }
}
