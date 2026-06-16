import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarModel } from './car-model.entity';
@Injectable()
export class ModelsService {
  constructor(@InjectRepository(CarModel) private repo: Repository<CarModel>) {}
  findAll(makeId?: number) {
    const where = makeId ? { makeId } : {};
    return this.repo.find({
      where,
      relations: { make: true, generations: true },
    });
  }
  async findOne(id: number) {
    const m = await this.repo.findOne({
      where: { id },
      relations: { make: true, generations: true },
    });
    if (!m) throw new NotFoundException('Model not found');
    return m;
  }
  create(name: string, makeId: number, bodyType?: string) {
    return this.repo.save(this.repo.create({ name, makeId, bodyType }));
  }
  async remove(id: number) {
    await this.repo.delete(id);
  }
}
