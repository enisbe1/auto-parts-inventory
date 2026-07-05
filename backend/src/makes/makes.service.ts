import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Make } from './make.entity';
@Injectable()
export class MakesService {
  constructor(@InjectRepository(Make) private repo: Repository<Make>) {}
  findAll() {
    return this.repo.find({ relations: { models: true } });
  }
  async findOne(id: number) {
    const m = await this.repo.findOne({
      where: { id },
      relations: { models: true },
    });
    if (!m) throw new NotFoundException('Make not found');
    return m;
  }
  create(name: string, countryOfOrigin?: string) {
    return this.repo.save(this.repo.create({ name, countryOfOrigin }));
  }
  async update(id: number, data: { name?: string; countryOfOrigin?: string }) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
  async remove(id: number) {
    await this.repo.delete(id);
  }
}
