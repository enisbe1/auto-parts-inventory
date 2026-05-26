import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Part } from './part.entity';
@Injectable()
export class PartsService {
  constructor(@InjectRepository(Part) private repo: Repository<Part>) {}
  findAll(filters: { vehicleId?: number; categoryId?: number; status?: string; condition?: string; search?: string }) {
    const where: any = {};
    if (filters.vehicleId)  where.vehicleId  = filters.vehicleId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status)     where.status     = filters.status;
    if (filters.condition)  where.condition  = filters.condition;
    if (filters.search)     where.name       = ILike(`%${filters.search}%`);
    return this.repo.find({ where, relations: ['vehicle', 'vehicle.variant', 'vehicle.variant.generation', 'vehicle.variant.generation.model', 'vehicle.variant.generation.model.make', 'category'], order: { createdAt: 'DESC' } });
  }
  async findOne(id: number) {
    const p = await this.repo.findOne({ where: { id }, relations: ['vehicle', 'category'] });
    if (!p) throw new NotFoundException('Part not found');
    return p;
  }
  create(data: Partial<Part>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<Part>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
  async remove(id: number) { await this.repo.delete(id); }
}
