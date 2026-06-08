import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

const mockUser = { id: 1, email: 'test@example.com', password: 'hashed', role: 'operator' };

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService,   useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────────────────────────
  describe('register', () => {
    it('should register a new user and return an access token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register('test@example.com', 'password123');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual({ access_token: 'mock.jwt.token' });
    });

    it('should throw UnauthorizedException if email already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register('test@example.com', 'password123'))
        .rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should return an access token for valid credentials', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });

      const result = await service.login('test@example.com', 'correctpassword');

      expect(result).toEqual({ access_token: 'mock.jwt.token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id, email: mockUser.email, role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });

      await expect(service.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('nouser@example.com', 'anypassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should sign the JWT with correct payload fields', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      const user = { id: 42, email: 'admin@test.com', password: hashed, role: 'admin' };
      mockUsersService.findByEmail.mockResolvedValue(user);

      await service.login('admin@test.com', 'pass');

      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 42, email: 'admin@test.com', role: 'admin' });
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should call findByEmail before attempting to create user on register', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      await service.register('new@example.com', 'pass');
      const findOrder = mockUsersService.findByEmail.mock.invocationCallOrder[0];
      const createOrder = mockUsersService.create.mock.invocationCallOrder[0];
      expect(findOrder).toBeLessThan(createOrder);
    });

    it('should not call create when email already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      try { await service.register('dup@example.com', 'pass'); } catch {}
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should include user id in JWT sub claim', async () => {
      const hashed = await (await import('bcryptjs')).hash('pass', 10);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, id: 7, password: hashed });
      await service.login('test@example.com', 'pass');
      expect(mockJwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ sub: 7 }));
    });
  });

});