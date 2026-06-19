import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Category } from '../categories/category.entity';

@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn() id: number;

  @Index()
  @Column() name: string;

  @Column({ nullable: true }) partNumber?: string;

  @Column({ default: 'good' }) condition: string;   // good | fair | poor

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) price?: number;

  @Index()
  @Column({ default: 'available' }) status: string; // available | reserved | sold

  @Column({ nullable: true }) notes?: string;

  @Index()
  @Column({ nullable: true }) vehicleId?: number;

  @Index()
  @Column({ nullable: true }) categoryId?: number;

  @ManyToOne(() => Vehicle, v => v.parts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle;

  @ManyToOne(() => Category, c => c.parts, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ type: 'text', array: true, default: [] }) photos: string[];
  @CreateDateColumn() createdAt: Date;

  @Column({ type: 'timestamp', nullable: true }) soldAt?: Date;
}
