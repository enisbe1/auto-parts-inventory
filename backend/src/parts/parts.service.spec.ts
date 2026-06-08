import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { PartsService } from './parts.service';
import { Part } from './part.entity';

const mockPart: Part = {
  id: 1, name: 'N47 Engine', partNumber: 'N47D20', condition: 'good',
  price: 450, status: 'available', notes: null, vehicleId: 1, categoryId: 2,
  vehicle: null, category: null, createdAt: new Date(),
};

const mockRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('PartsService', () => {
  let service: PartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartsService,
        { provide: getRepositoryToken(Part), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PartsService>(PartsService);
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated parts with default page=1 limit=20', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);

      const result = await service.findAll({});

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0, take: 20,
      }));
      expect(result.data).toEqual([mockPart]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should apply correct skip offset for page 3', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 50]);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        skip: 20, take: 10,
      }));
    });

    it('should calculate totalPages correctly', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 47]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('should filter by status when provided', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);

      await service.findAll({ status: 'available' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'available' }),
      }));
    });

    it('should filter by vehicleId when provided', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);

      await service.findAll({ vehicleId: 5 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ vehicleId: 5 }),
      }));
    });

    it('should use ILike for name search', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);

      await service.findAll({ search: 'engine' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ name: ILike('%engine%') }),
      }));
    });

    it('should filter by condition when provided', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);

      await service.findAll({ condition: 'good' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ condition: 'good' }),
      }));
    });

    it('should filter by categoryId when provided', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);

      await service.findAll({ categoryId: 3 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ categoryId: 3 }),
      }));
    });

    it('should order by createdAt DESC', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        order: { createdAt: 'DESC' },
      }));
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a part by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockPart);

      const result = await service.findOne(1);

      expect(result).toEqual(mockPart);
      expect(mockRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    });

    it('should throw NotFoundException when part does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and save a new part', async () => {
      const dto = { name: 'Alternator', price: 85, status: 'available' };
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 2, ...dto });

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(dto);
      expect(result).toMatchObject({ id: 2, name: 'Alternator' });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a part and return the updated record', async () => {
      const updated = { ...mockPart, status: 'sold' };
      mockRepo.update.mockResolvedValue({ affected: 1 });
      mockRepo.findOne.mockResolvedValue(updated);

      const result = await service.update(1, { status: 'sold' });

      expect(mockRepo.update).toHaveBeenCalledWith(1, { status: 'sold' });
      expect(result.status).toBe('sold');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a part by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should apply multiple filters simultaneously', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockPart], 1]);
      await service.findAll({ status: 'available', condition: 'good', categoryId: 2, vehicleId: 1 });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: 'available',
          condition: 'good',
          categoryId: 2,
          vehicleId: 1,
        }),
      }));
    });

    it('should return totalPages of 0 when total is 0', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.total).toBe(0);
    });

    it('should return correct totalPages when total is exactly divisible by limit', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 40]);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.meta.totalPages).toBe(2);
    });

    it('should not add undefined filters to where clause', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ status: undefined, search: undefined });
      const call = mockRepo.findAndCount.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('status');
      expect(call.where).not.toHaveProperty('name');
    });

    it('should include deep relations chain in all findAll calls', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({});
      const call = mockRepo.findAndCount.mock.calls[0][0];
      expect(call.relations).toContain('vehicle');
      expect(call.relations).toContain('category');
    });
  });

});