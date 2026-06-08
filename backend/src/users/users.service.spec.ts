import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

const mockUser: User = {
  id: 1, email: 'enis@example.com', password: 'hashed_pw', role: 'operator', createdAt: new Date(),
};

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('enis@example.com');
      expect(result).toEqual(mockUser);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'enis@example.com' } });
    });

    it('should return null when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });

    it('should query by the exact email provided', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await service.findByEmail('TEST@EXAMPLE.COM');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: 'TEST@EXAMPLE.COM' } });
    });
  });

  describe('create', () => {
    it('should hash the password before saving', async () => {
      mockRepo.create.mockImplementation((data) => data);
      mockRepo.save.mockImplementation(async (data) => ({ id: 1, ...data }));

      await service.create('new@example.com', 'plainpassword');

      const savedArg = mockRepo.save.mock.calls[0][0];
      const isHashed = await bcrypt.compare('plainpassword', savedArg.password);
      expect(isHashed).toBe(true);
    });

    it('should never store the plain-text password', async () => {
      mockRepo.create.mockImplementation((data) => data);
      mockRepo.save.mockImplementation(async (data) => ({ id: 1, ...data }));

      await service.create('new@example.com', 'secret123');

      const savedArg = mockRepo.save.mock.calls[0][0];
      expect(savedArg.password).not.toBe('secret123');
    });

    it('should set default role to operator', async () => {
      mockRepo.create.mockImplementation((data) => data);
      mockRepo.save.mockImplementation(async (data) => ({ id: 1, ...data }));

      await service.create('new@example.com', 'pw');

      const createdArg = mockRepo.create.mock.calls[0][0];
      expect(createdArg.role).toBe('operator');
    });

    it('should allow a custom role to be specified', async () => {
      mockRepo.create.mockImplementation((data) => data);
      mockRepo.save.mockImplementation(async (data) => ({ id: 2, ...data }));

      await service.create('admin@example.com', 'pw', 'admin');

      const createdArg = mockRepo.create.mock.calls[0][0];
      expect(createdArg.role).toBe('admin');
    });

    it('should save with the provided email', async () => {
      mockRepo.create.mockImplementation((data) => data);
      mockRepo.save.mockImplementation(async (data) => ({ id: 1, ...data }));

      await service.create('user@test.com', 'pw');

      const createdArg = mockRepo.create.mock.calls[0][0];
      expect(createdArg.email).toBe('user@test.com');
    });
  });
});
