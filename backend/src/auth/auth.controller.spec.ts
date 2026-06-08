import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return a token', async () => {
      mockAuthService.register.mockResolvedValue({ access_token: 'jwt.token' });
      const result = await controller.register({ email: 'a@b.com', password: 'pass' });
      expect(mockAuthService.register).toHaveBeenCalledWith('a@b.com', 'pass');
      expect(result).toEqual({ access_token: 'jwt.token' });
    });

    it('should propagate UnauthorizedException when email already exists', async () => {
      mockAuthService.register.mockRejectedValue(new UnauthorizedException('Email already registered'));
      await expect(controller.register({ email: 'dup@b.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should call authService.login and return a token', async () => {
      mockAuthService.login.mockResolvedValue({ access_token: 'jwt.token' });
      const result = await controller.login({ email: 'a@b.com', password: 'pass' });
      expect(mockAuthService.login).toHaveBeenCalledWith('a@b.com', 'pass');
      expect(result).toEqual({ access_token: 'jwt.token' });
    });

    it('should propagate UnauthorizedException for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      await expect(controller.login({ email: 'a@b.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
