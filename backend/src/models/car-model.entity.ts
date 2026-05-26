import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Make } from '../makes/make.entity';
import { Generation } from '../generations/generation.entity';
@Entity('car_models')
export class CarModel {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ nullable: true }) bodyType: string;
  @ManyToOne(() => Make, m => m.models, { onDelete: 'CASCADE' }) @JoinColumn() make: Make;
  @Column() makeId: number;
  @OneToMany(() => Generation, g => g.model) generations: Generation[];
}
