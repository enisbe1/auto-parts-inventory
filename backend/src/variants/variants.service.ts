import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './variant.entity';
@Injectable()
export class VariantsService {
  constructor(@InjectRepository(Variant) private repo: Repository<Variant>) {}
  findAll(generationId?: number) {
    const where = generationId ? { generationId } : {};
    return this.repo.find({ where, relations: { generation: true } });
  }
  async findOne(id: number) {
    const v = await this.repo.findOne({
      where: { id },
      relations: { generation: true },
    });
    if (!v) throw new NotFoundException('Variant not found');
    return v;
  }
  create(data: Partial<Variant>) {
    return this.repo.save(this.repo.create(data));
  }
  async update(id: number, data: Partial<Pick<Variant, 'name' | 'engine' | 'fuelType' | 'powerKw'>>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
  async remove(id: number) {
    await this.repo.delete(id);
  }
}
