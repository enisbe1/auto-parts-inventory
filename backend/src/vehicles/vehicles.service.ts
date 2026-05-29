import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Vehicle } from './vehicle.entity';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private repo: Repository<Vehicle>) {}

  async findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResult<Vehicle>> {
    const { page = 1, limit = 20, status, search } = filters;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.vin    = ILike(`%${search}%`);

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['variant', 'variant.generation', 'variant.generation.model', 'variant.generation.model.make'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const v = await this.repo.findOne({
      where: { id },
      relations: [
        'variant', 'variant.generation',
        'variant.generation.model', 'variant.generation.model.make',
        'parts', 'parts.category',
      ],
    });
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
