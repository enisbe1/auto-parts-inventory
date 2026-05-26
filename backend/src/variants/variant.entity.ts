import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Generation } from '../generations/generation.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
@Entity('variants')
export class Variant {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ nullable: true }) engine: string;
  @Column({ nullable: true }) fuelType: string;
  @Column({ nullable: true }) powerKw: number;
  @ManyToOne(() => Generation, g => g.variants, { onDelete: 'CASCADE' }) @JoinColumn() generation: Generation;
  @Column() generationId: number;
  @OneToMany(() => Vehicle, v => v.variant) vehicles: Vehicle[];
}
