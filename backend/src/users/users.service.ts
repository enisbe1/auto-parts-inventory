import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  async findByEmail(email: string) { return this.repo.findOne({ where: { email } }); }
  async create(email: string, password: string, role = 'operator') {
    const hash = await bcrypt.hash(password, 10);
    return this.repo.save(this.repo.create({ email, password: hash, role }));
  }
}
