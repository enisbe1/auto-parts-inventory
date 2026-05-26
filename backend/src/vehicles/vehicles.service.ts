import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private repo: Repository<Vehicle>) {}
  findAll() { return this.repo.find({ relations: ['variant', 'variant.generation', 'variant.generation.model', 'variant.generation.model.make'] }); }
  async findOne(id: number) {
    const v = await this.repo.findOne({ where: { id }, relations: ['variant', 'variant.generation', 'variant.generation.model', 'variant.generation.model.make', 'parts', 'parts.category'] });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }
  create(data: Partial<Vehicle>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<Vehicle>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
  async remove(id: number) { await this.repo.delete(id); }
}
