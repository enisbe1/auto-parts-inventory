import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(@InjectRepository(Activity) private repo: Repository<Activity>) {}

  log(data: Partial<Activity>) {
    return this.repo.save(this.repo.create(data)).catch(() => {}); // silent fail
  }

  async findRecent(limit = 20) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
