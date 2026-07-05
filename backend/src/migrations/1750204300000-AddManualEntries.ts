import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualEntries1750204300000 implements MigrationInterface {
  name = 'AddManualEntries1750204300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "manual_entries" (
        "id"          SERIAL NOT NULL,
        "type"        character varying(10)  NOT NULL,
        "date"        character varying(10)  NOT NULL,
        "description" character varying      NOT NULL,
        "category"    character varying,
        "amount"      numeric(10,2)          NOT NULL,
        "notes"       text,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_manual_entries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_manual_entries_type" ON "manual_entries" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_manual_entries_date" ON "manual_entries" ("date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_manual_entries_date"`);
    await queryRunner.query(`DROP INDEX "IDX_manual_entries_type"`);
    await queryRunner.query(`DROP TABLE "manual_entries"`);
  }
}
