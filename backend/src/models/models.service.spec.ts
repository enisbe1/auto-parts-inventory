import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModelsService } from './models.service';
import { CarModel } from './car-model.entity';

const mockModel: CarModel = {
  id: 1, name: '3 Series', makeId: 1, bodyType: 'Saloon',
  make: { id: 1, name: 'BMW', countryOfOrigin: 'Germany', models: [] },
  generations: [],
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('ModelsService', () => {
  let service: ModelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        { provide: getRepositoryToken(CarModel), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ModelsService>(ModelsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all models when no makeId filter provided', async () => {
      mockRepo.find.mockResolvedValue([mockModel]);
      const result = await service.findAll();
      expect(result).toEqual([mockModel]);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('should filter models by makeId when provided', async () => {
      mockRepo.find.mockResolvedValue([mockModel]);
      await service.findAll(1);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { makeId: 1 } }));
    });

    it('should return empty array when no models match filter', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll(999);
      expect(result).toEqual([]);
    });

    it('should include make and generations relations', async () => {
      mockRepo.find.mockResolvedValue([mockModel]);
      await service.findAll();
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        relations: expect.anything(),
      }));
    });
  });

  describe('findOne', () => {
    it('should return a model by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockModel);
      const result = await service.findOne(1);
      expect(result).toEqual(mockModel);
      expect(mockRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    });

    it('should throw NotFoundException when model does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('Model not found');
    });
  });

  describe('create', () => {
    it('should create a model with name, makeId and bodyType', async () => {
      const created = { id: 2, name: '5 Series', makeId: 1, bodyType: 'Saloon', make: null, generations: [] };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);
      const result = await service.create('5 Series', 1, 'Saloon');
      expect(mockRepo.create).toHaveBeenCalledWith({ name: '5 Series', makeId: 1, bodyType: 'Saloon' });
      expect(result.name).toBe('5 Series');
    });

    it('should create a model without bodyType', async () => {
      const created = { id: 3, name: 'Golf', makeId: 2, bodyType: undefined, make: null, generations: [] };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);
      await service.create('Golf', 2);
      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Golf', makeId: 2, bodyType: undefined });
    });
  });

  describe('remove', () => {
    it('should delete a model by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
