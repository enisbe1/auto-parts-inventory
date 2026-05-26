import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { Variant } from '../variants/variant.entity';
import { Part } from '../parts/part.entity';
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) vin: string;
  @Column({ nullable: true }) year: number;
  @Column({ nullable: true }) mileage: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) purchasePrice: number;
  @Column({ nullable: true }) purchaseDate: string;
  @Column({ default: 'in_stock', comment: 'in_stock | fully_dismantled' }) status: string;
  @Column({ nullable: true }) notes: string;
  @ManyToOne(() => Variant, v => v.vehicles, { onDelete: 'SET NULL', nullable: true }) @JoinColumn() variant: Variant;
  @Column({ nullable: true }) variantId: number;
  @OneToMany(() => Part, p => p.vehicle) parts: Part[];
  @CreateDateColumn() createdAt: Date;
}
