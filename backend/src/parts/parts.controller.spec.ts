import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';

const mockPaginatedResult = {
  data: [
    { id: 1, name: 'N47 Engine', condition: 'good', status: 'available', price: 450 },
    { id: 2, name: 'ZF Gearbox', condition: 'fair', status: 'reserved', price: 320 },
  ],
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

const mockPartsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PartsController', () => {
  let controller: PartsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartsController],
      providers: [{ provide: PartsService, useValue: mockPartsService }],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PartsController>(PartsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated parts with default params', async () => {
      mockPartsService.findAll.mockResolvedValue(mockPaginatedResult);
      const result = await controller.findAll();
      expect(mockPartsService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should pass search filter to service', async () => {
      mockPartsService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll(undefined, undefined, undefined, undefined, 'engine');
      expect(mockPartsService.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'engine' }));
    });

    it('should pass status filter to service', async () => {
      mockPartsService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll(undefined, undefined, 'available');
      expect(mockPartsService.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'available' }));
    });

    it('should pass vehicleId as number to service', async () => {
      mockPartsService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll('5');
      expect(mockPartsService.findAll).toHaveBeenCalledWith(expect.objectContaining({ vehicleId: 5 }));
    });

    it('should pass categoryId as number to service', async () => {
      mockPartsService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll(undefined, '3');
      expect(mockPartsService.findAll).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 3 }));
    });

    it('should pass page and limit as numbers to service', async () => {
      mockPartsService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll(undefined, undefined, undefined, undefined, undefined, '2', '10');
      expect(mockPartsService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 10 }));
    });
  });

  describe('findOne', () => {
    it('should return a single part by id', async () => {
      mockPartsService.findOne.mockResolvedValue(mockPaginatedResult.data[0]);
      const result = await controller.findOne('1');
      expect(mockPartsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPaginatedResult.data[0]);
    });

    it('should propagate NotFoundException for unknown id', async () => {
      mockPartsService.findOne.mockRejectedValue(new NotFoundException('Part not found'));
      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a part and return it', async () => {
      const dto = { name: 'Alternator', condition: 'good', status: 'available', price: 85 } as any;
      const created = { id: 3, ...dto };
      mockPartsService.create.mockResolvedValue(created);
      const result = await controller.create(dto);
      expect(mockPartsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a part and return updated record', async () => {
      const dto = { status: 'sold' } as any;
      const updated = { ...mockPaginatedResult.data[0], status: 'sold' };
      mockPartsService.update.mockResolvedValue(updated);
      const result = await controller.update('1', dto);
      expect(mockPartsService.update).toHaveBeenCalledWith(1, dto);
      expect(result.status).toBe('sold');
    });
  });

  describe('remove', () => {
    it('should delete a part by id', async () => {
      mockPartsService.remove.mockResolvedValue(undefined);
      await controller.remove('1');
      expect(mockPartsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
