import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Part } from './part.entity';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class PartsService {
  constructor(@InjectRepository(Part) private repo: Repository<Part>) {}

  async findAll(filters: {
    vehicleId?: number;
    categoryId?: number;
    status?: string;
    condition?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Part>> {
    const { page = 1, limit = 20, ...rest } = filters;
    const where: any = {};
    if (rest.vehicleId)  where.vehicleId  = rest.vehicleId;
    if (rest.categoryId) where.categoryId = rest.categoryId;
    if (rest.status)     where.status     = rest.status;
    if (rest.condition)  where.condition  = rest.condition;
    if (rest.search)     where.name       = ILike(`%${rest.search}%`);

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: [
        'vehicle',
        'vehicle.variant',
        'vehicle.variant.generation',
        'vehicle.variant.generation.model',
        'vehicle.variant.generation.model.make',
        'category',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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
