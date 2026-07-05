import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManualEntry } from './manual-entry.entity';

export interface CreateManualEntryDto {
  type: 'income' | 'expense';
  date: string;
  description: string;
  category?: string;
  amount: number;
  notes?: string;
}

@Injectable()
export class ManualEntriesService {
  constructor(
    @InjectRepository(ManualEntry)
    private repo: Repository<ManualEntry>,
  ) {}

  findAll(filters: { type?: string; year?: number; month?: number }) {
    const qb = this.repo
      .createQueryBuilder('e')
      .orderBy('e.date', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');
    if (filters.type) qb.andWhere('e.type = :type', { type: filters.type });
    if (filters.year)
      qb.andWhere('EXTRACT(YEAR  FROM e.date::date) = :year', {
        year: filters.year,
      });
    if (filters.month)
      qb.andWhere('EXTRACT(MONTH FROM e.date::date) = :month', {
        month: filters.month,
      });
    return qb.getMany();
  }

  create(dto: CreateManualEntryDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
