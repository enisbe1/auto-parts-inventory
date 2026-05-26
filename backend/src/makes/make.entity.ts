import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CarModel } from '../models/car-model.entity';
@Entity('makes')
export class Make {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) name: string;
  @Column({ nullable: true }) countryOfOrigin: string;
  @OneToMany(() => CarModel, m => m.make) models: CarModel[];
}
