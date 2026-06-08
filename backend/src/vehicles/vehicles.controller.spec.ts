import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

const mockPaginatedResult = {
  data: [
    { id: 1, vin: 'WBA001', year: 2014, status: 'in_stock', variant: null, parts: [] },
    { id: 2, vin: 'WBA002', year: 2016, status: 'in_stock', variant: null, parts: [] },
  ],
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

const mockVehiclesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockVehiclesService }],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated vehicles with default params', async () => {
      mockVehiclesService.findAll.mockResolvedValue(mockPaginatedResult);
      const result = await controller.findAll();
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should pass status filter to service', async () => {
      mockVehiclesService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll('in_stock');
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_stock' }));
    });

    it('should pass VIN search string to service', async () => {
      mockVehiclesService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll(undefined, 'WBA');
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'WBA' }));
    });

    it('should convert page and limit strings to numbers', async () => {
      mockVehiclesService.findAll.mockResolvedValue(mockPaginatedResult);
      await controller.findAll(undefined, undefined, '3', '5');
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 3, limit: 5 }));
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id with all relations', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockPaginatedResult.data[0]);
      const result = await controller.findOne('1');
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPaginatedResult.data[0]);
    });

    it('should propagate NotFoundException for unknown vehicle', async () => {
      mockVehiclesService.findOne.mockRejectedValue(new NotFoundException('Vehicle not found'));
      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new vehicle', async () => {
      const dto = { vin: 'NEW001', year: 2018, variantId: 1 } as any;
      const created = { id: 3, ...dto, status: 'in_stock', parts: [] };
      mockVehiclesService.create.mockResolvedValue(created);
      const result = await controller.create(dto);
      expect(mockVehiclesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a vehicle field and return updated record', async () => {
      const dto = { status: 'scrapped' } as any;
      const updated = { ...mockPaginatedResult.data[0], status: 'scrapped' };
      mockVehiclesService.update.mockResolvedValue(updated);
      const result = await controller.update('1', dto);
      expect(mockVehiclesService.update).toHaveBeenCalledWith(1, dto);
      expect(result.status).toBe('scrapped');
    });
  });

  describe('remove', () => {
    it('should remove a vehicle by id', async () => {
      mockVehiclesService.remove.mockResolvedValue(undefined);
      await controller.remove('1');
      expect(mockVehiclesService.remove).toHaveBeenCalledWith(1);
    });
  });
});
