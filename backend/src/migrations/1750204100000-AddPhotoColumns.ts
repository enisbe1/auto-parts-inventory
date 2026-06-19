import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoColumns1750204100000 implements MigrationInterface {
  name = 'AddPhotoColumns1750204100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "parts"
      ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "photos"`);
    await queryRunner.query(`ALTER TABLE "parts"    DROP COLUMN IF EXISTS "photos"`);
  }
}
