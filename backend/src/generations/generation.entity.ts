import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CarModel } from '../models/car-model.entity';
import { Variant } from '../variants/variant.entity';
@Entity('generations')
export class Generation {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ nullable: true }) code: string;
  @Column({ nullable: true }) yearStart: number;
  @Column({ nullable: true }) yearEnd: number;
  @ManyToOne(() => CarModel, m => m.generations, { onDelete: 'CASCADE' }) @JoinColumn() model: CarModel;
  @Column() modelId: number;
  @OneToMany(() => Variant, v => v.generation) variants: Variant[];
}
