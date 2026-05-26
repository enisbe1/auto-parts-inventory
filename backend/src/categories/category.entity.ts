import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Part } from '../parts/part.entity';
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) name: string;
  @Column({ nullable: true }) description: string;
  @OneToMany(() => Part, p => p.category) parts: Part[];
}
