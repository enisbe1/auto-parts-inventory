import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Part } from './part.entity';
import { ActivityService } from '../activity/activity.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class PartsService {
  constructor(
    @InjectRepository(Part) private repo: Repository<Part>,
    private readonly activity: ActivityService,
  ) {}

  async findAll(filters: {
    vehicleId?: number;
    categoryId?: number;
    modelId?: number;
    generationId?: number;
    status?: string;
    condition?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Part>> {
    const { page = 1, limit = 20, ...rest } = filters;

    // When filtering by model or generation we must JOIN through the vehicle hierarchy —
    // TypeORM's simple where object can't traverse nested relations.
    if (rest.modelId || rest.generationId) {
      const qb = this.repo.createQueryBuilder('part')
        .leftJoinAndSelect('part.vehicle',           'vehicle')
        .leftJoinAndSelect('vehicle.variant',        'variant')
        .leftJoinAndSelect('variant.generation',     'generation')
        .leftJoinAndSelect('generation.model',       'model')
        .leftJoinAndSelect('model.make',             'make')
        .leftJoinAndSelect('part.category',          'category');

      // Primary hierarchy filter — generationId is more specific than modelId
      if (rest.modelId && rest.generationId) {
        qb.where('model.id = :modelId AND generation.id = :generationId',
                 { modelId: rest.modelId, generationId: rest.generationId });
      } else if (rest.generationId) {
        qb.where('generation.id = :generationId', { generationId: rest.generationId });
      } else {
        qb.where('model.id = :modelId', { modelId: rest.modelId });
      }

      if (rest.vehicleId)  qb.andWhere('part.vehicleId  = :vid',  { vid:  rest.vehicleId });
      if (rest.categoryId) qb.andWhere('part.categoryId = :cid',  { cid:  rest.categoryId });
      if (rest.status)     qb.andWhere('part.status     = :st',   { st:   rest.status });
      if (rest.condition)  qb.andWhere('part.condition  = :cond', { cond: rest.condition });
      if (rest.search)     qb.andWhere('part.name ILIKE :q',      { q:    `%${rest.search}%` });

      qb.orderBy('part.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await qb.getManyAndCount();
      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    // Default path — no model filter
    const where: any = {};
    if (rest.vehicleId) where.vehicleId = rest.vehicleId;
    if (rest.categoryId) where.categoryId = rest.categoryId;
    if (rest.status) where.status = rest.status;
    if (rest.condition) where.condition = rest.condition;
    if (rest.search) where.name = ILike(`%${rest.search}%`);

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: {
        vehicle: { variant: { generation: { model: { make: true } } } },
        category: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({
      where: { id },
      relations: { vehicle: true, category: true },
    });
    if (!p) throw new NotFoundException('Part not found');
    return p;
  }

  async create(data: Partial<Part>) {
    const saved = await this.repo.save(this.repo.create(data));
    this.activity.log({ action: 'created', entityType: 'part', entityId: saved.id, entityName: saved.name });
    return saved;
  }

  async update(id: number, data: Partial<Part>) {
    // Auto-stamp soldAt when a part is marked as sold
    if (data.status === 'sold' && !data.soldAt) {
      data.soldAt = new Date();
    }
    await this.repo.update(id, data);
    const updated = await this.findOne(id);
    if (data.status === 'sold') {
      this.activity.log({ action: 'sold', entityType: 'part', entityId: updated.id, entityName: updated.name });
    } else {
      this.activity.log({ action: 'updated', entityType: 'part', entityId: updated.id, entityName: updated.name });
    }
    return updated;
  }

  async remove(id: number) {
    const part = await this.repo.findOne({ where: { id } });
    this.activity.log({ action: 'deleted', entityType: 'part', entityId: id, entityName: part?.name });
    await this.repo.delete(id);
  }

  async bulkCreate(rows: any[]): Promise<{ imported: number; errors: string[] }> {
    let imported = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await this.repo.save(this.repo.create({
          name: row.name?.trim(),
          partNumber: row.partNumber?.trim() || undefined,
          condition: row.condition?.trim() || 'good',
          price: row.price ? parseFloat(row.price) : undefined,
          status: row.status?.trim() || 'available',
          notes: row.notes?.trim() || undefined,
          vehicleId: row.vehicleId ? parseInt(row.vehicleId) : undefined,
          categoryId: row.categoryId ? parseInt(row.categoryId) : undefined,
        }));
        imported++;
      } catch (e: any) {
        errors.push(`Row "${row.name}": ${e.message}`);
      }
    }
    return { imported, errors };
  }
}
