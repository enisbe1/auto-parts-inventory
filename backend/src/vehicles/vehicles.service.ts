import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const RELATIONS = { variant: { generation: { model: { make: true } } } };

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private repo: Repository<Vehicle>) {}

  async findAll(
    filters: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<PaginatedResult<Vehicle>> {
    const { page = 1, limit = 20, status, search } = filters;

    const qb = this.repo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.variant', 'variant')
      .leftJoinAndSelect('variant.generation', 'gen')
      .leftJoinAndSelect('gen.model', 'model')
      .leftJoinAndSelect('model.make', 'make')
      .orderBy('v.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('v.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(v.vin ILIKE :q OR make.name ILIKE :q OR model.name ILIKE :q OR CAST(v.year AS TEXT) LIKE :q)',
        { q: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const v = await this.repo.findOne({
      where: { id },
      relations: {
        variant: { generation: { model: { make: true } } },
        parts: { category: true },
      },
    });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  create(data: Partial<Vehicle>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Vehicle>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
  }
}
