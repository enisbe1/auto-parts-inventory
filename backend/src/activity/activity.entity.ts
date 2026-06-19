import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('activity_log')
export class Activity {
  @PrimaryGeneratedColumn() id: number;
  @Column() action: string;            // created | updated | deleted | sold
  @Column() entityType: string;        // part | vehicle
  @Column({ nullable: true }) entityId: number;
  @Column({ nullable: true }) entityName: string;
  @Column({ nullable: true }) userId: number;
  @Column({ type: 'jsonb', nullable: true }) meta: Record<string, any>;
  @CreateDateColumn() createdAt: Date;
}
