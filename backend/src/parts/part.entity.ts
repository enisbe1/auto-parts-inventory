import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Category } from '../categories/category.entity';
@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ nullable: true }) partNumber: string;
  @Column({ default: 'good', comment: 'good | fair | poor' }) condition: string;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) price: number;
  @Column({ default: 'available', comment: 'available | reserved | sold' }) status: string;
  @Column({ nullable: true }) notes: string;
  @ManyToOne(() => Vehicle, v => v.parts, { onDelete: 'SET NULL', nullable: true }) @JoinColumn() vehicle: Vehicle;
  @Column({ nullable: true }) vehicleId: number;
  @ManyToOne(() => Category, c => c.parts, { nullable: true }) @JoinColumn() category: Category;
  @Column({ nullable: true }) categoryId: number;
  @CreateDateColumn() createdAt: Date;
}
