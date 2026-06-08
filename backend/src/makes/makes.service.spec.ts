import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MakesService } from './makes.service';
import { Make } from './make.entity';

const mockMake: Make = {
  id: 1, name: 'BMW', countryOfOrigin: 'Germany', models: [],
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('MakesService', () => {
  let service: MakesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakesService,
        { provide: getRepositoryToken(Make), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MakesService>(MakesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all makes with models relation', async () => {
      mockRepo.find.mockResolvedValue([mockMake]);
      const result = await service.findAll();
      expect(result).toEqual([mockMake]);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ relations: expect.anything() }));
    });

    it('should return empty array when no makes exist', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a make with models relation by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockMake);
      const result = await service.findOne(1);
      expect(result).toEqual(mockMake);
      expect(mockRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    });

    it('should throw NotFoundException when make not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a make with name and country', async () => {
      const created = { id: 2, name: 'Audi', countryOfOrigin: 'Germany', models: [] };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create('Audi', 'Germany');

      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Audi', countryOfOrigin: 'Germany' });
      expect(result.name).toBe('Audi');
    });

    it('should create a make without country of origin', async () => {
      const created = { id: 3, name: 'Toyota', countryOfOrigin: undefined, models: [] };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create('Toyota');

      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Toyota', countryOfOrigin: undefined });
      expect(result.name).toBe('Toyota');
    });
  });

  describe('remove', () => {
    it('should delete a make by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
