import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}
  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email already registered');
    const user = await this.users.create(email, password);
    return this.sign(user);
  }
  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Invalid credentials');
    return this.sign(user);
  }
  private sign(user: any) {
    return { access_token: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }) };
  }
}
