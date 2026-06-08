import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

const mockCategory: Category = {
  id: 1, name: 'Engine', description: 'Engine components', parts: [],
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockRepo.find.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no categories exist', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockCategory);
      const result = await service.findOne(1);
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a category with name and description', async () => {
      const created = { id: 2, name: 'Gearbox', description: 'Transmission parts', parts: [] };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create('Gearbox', 'Transmission parts');

      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Gearbox', description: 'Transmission parts' });
      expect(result).toEqual(created);
    });

    it('should create a category without description', async () => {
      const created = { id: 3, name: 'Body', description: undefined, parts: [] };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create('Body');

      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Body', description: undefined });
      expect(result.name).toBe('Body');
    });
  });

  describe('remove', () => {
    it('should delete a category by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
