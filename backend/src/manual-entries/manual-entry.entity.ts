import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('manual_entries')
export class ManualEntry {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'income' = other selling, 'expense' = other spending */
  @Column({ type: 'varchar', length: 10 })
  type: 'income' | 'expense';

  /** YYYY-MM-DD */
  @Column({ type: 'varchar', length: 10 })
  date: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
