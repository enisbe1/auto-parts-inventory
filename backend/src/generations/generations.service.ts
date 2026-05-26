import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Generation } from './generation.entity';
@Injectable()
export class GenerationsService {
  constructor(@InjectRepository(Generation) private repo: Repository<Generation>) {}
  findAll(modelId?: number) {
    const where = modelId ? { modelId } : {};
    return this.repo.find({ where, relations: ['model', 'variants'] });
  }
  async findOne(id: number) {
    const g = await this.repo.findOne({ where: { id }, relations: ['model', 'variants'] });
    if (!g) throw new NotFoundException('Generation not found');
    return g;
  }
  create(data: Partial<Generation>) { return this.repo.save(this.repo.create(data)); }
  async remove(id: number) { await this.repo.delete(id); }
}
