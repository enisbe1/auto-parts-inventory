import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VariantsService } from './variants.service';
import { Variant } from './variant.entity';

const mockVariant: Variant = {
  id: 1, name: '320d', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 135,
  generationId: 1,
  generation: { id: 1, name: 'F30', code: 'F30', yearStart: 2012, yearEnd: 2018, modelId: 1, model: null, variants: [] },
  vehicles: [],
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('VariantsService', () => {
  let service: VariantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantsService,
        { provide: getRepositoryToken(Variant), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<VariantsService>(VariantsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all variants when no generationId provided', async () => {
      mockRepo.find.mockResolvedValue([mockVariant]);
      const result = await service.findAll();
      expect(result).toEqual([mockVariant]);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('should filter by generationId when provided', async () => {
      mockRepo.find.mockResolvedValue([mockVariant]);
      await service.findAll(1);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { generationId: 1 } }));
    });

    it('should return empty array when generation has no variants', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll(99);
      expect(result).toEqual([]);
    });

    it('should include generation relation', async () => {
      mockRepo.find.mockResolvedValue([mockVariant]);
      await service.findAll();
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        relations: expect.anything(),
      }));
    });
  });

  describe('findOne', () => {
    it('should return a variant by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockVariant);
      const result = await service.findOne(1);
      expect(result).toEqual(mockVariant);
    });

    it('should throw NotFoundException when variant not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('Variant not found');
    });
  });

  describe('create', () => {
    it('should create a diesel variant with all fields', async () => {
      const data = { name: '320d', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 135, generationId: 1 };
      mockRepo.create.mockReturnValue(data);
      mockRepo.save.mockResolvedValue({ id: 2, ...data });
      const result = await service.create(data);
      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(result).toMatchObject({ id: 2, name: '320d' });
    });

    it('should create a variant with minimal fields', async () => {
      const data = { name: '316i', generationId: 1 };
      mockRepo.create.mockReturnValue(data);
      mockRepo.save.mockResolvedValue({ id: 3, ...data });
      await service.create(data);
      expect(mockRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('remove', () => {
    it('should delete a variant by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
