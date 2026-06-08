import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GenerationsService } from './generations.service';
import { Generation } from './generation.entity';

const mockGen: Generation = {
  id: 1, name: 'F30', code: 'F30', yearStart: 2012, yearEnd: 2018,
  modelId: 1,
  model: { id: 1, name: '3 Series', makeId: 1, bodyType: 'Saloon', make: null, generations: [] },
  variants: [],
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('GenerationsService', () => {
  let service: GenerationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationsService,
        { provide: getRepositoryToken(Generation), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<GenerationsService>(GenerationsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all generations when no modelId provided', async () => {
      mockRepo.find.mockResolvedValue([mockGen]);
      const result = await service.findAll();
      expect(result).toEqual([mockGen]);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('should filter by modelId when provided', async () => {
      mockRepo.find.mockResolvedValue([mockGen]);
      await service.findAll(1);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { modelId: 1 } }));
    });

    it('should return empty array when model has no generations', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll(42);
      expect(result).toEqual([]);
    });

    it('should include model and variants relations', async () => {
      mockRepo.find.mockResolvedValue([mockGen]);
      await service.findAll();
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        relations: expect.anything(),
      }));
    });
  });

  describe('findOne', () => {
    it('should return a generation by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockGen);
      const result = await service.findOne(1);
      expect(result).toEqual(mockGen);
    });

    it('should throw NotFoundException when generation not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('Generation not found');
    });
  });

  describe('create', () => {
    it('should create a generation with all fields', async () => {
      const data = { name: 'G20', code: 'G20', yearStart: 2019, modelId: 1 };
      mockRepo.create.mockReturnValue(data);
      mockRepo.save.mockResolvedValue({ id: 2, ...data, variants: [] });
      const result = await service.create(data);
      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(result).toMatchObject({ id: 2, name: 'G20' });
    });

    it('should create a generation without yearEnd (still in production)', async () => {
      const data = { name: 'G20', code: 'G20', yearStart: 2019, modelId: 1 };
      mockRepo.create.mockReturnValue(data);
      mockRepo.save.mockResolvedValue({ id: 3, ...data });
      await service.create(data);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.not.objectContaining({ yearEnd: expect.anything() }));
    });
  });

  describe('remove', () => {
    it('should delete a generation by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
