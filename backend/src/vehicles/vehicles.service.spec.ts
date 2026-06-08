import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';

const mockVariant = {
  id: 1, name: '320d', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 135,
  generation: { id: 1, name: 'F30', code: 'F30', yearStart: 2012, yearEnd: 2018,
    model: { id: 1, name: '3 Series', make: { id: 1, name: 'BMW' } } },
};

const mockVehicle: Vehicle = {
  id: 1, vin: 'WBA3B31070F000001', year: 2014, mileage: 187000,
  purchasePrice: 800 as any, purchaseDate: '2024-01-15', status: 'in_stock',
  notes: null, variantId: 1, variant: mockVariant as any, parts: [], createdAt: new Date(),
};

const mockRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated vehicles with default page=1 limit=20', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockVehicle], 1]);

      const result = await service.findAll({});

      expect(result.data).toEqual([mockVehicle]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });

    it('should apply correct pagination offset', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 100]);

      await service.findAll({ page: 5, limit: 10 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 40, take: 10 }));
    });

    it('should calculate totalPages correctly for remainder', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 21]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(2);
    });

    it('should filter by status when provided', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockVehicle], 1]);

      await service.findAll({ status: 'in_stock' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: 'in_stock' }),
      }));
    });

    it('should use ILike for VIN search', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockVehicle], 1]);

      await service.findAll({ search: 'WBA' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ vin: ILike('%WBA%') }),
      }));
    });

    it('should order by createdAt DESC', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        order: { createdAt: 'DESC' },
      }));
    });

    it('should return empty data array when no vehicles found', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a vehicle with relations by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne(1);

      expect(result).toEqual(mockVehicle);
      expect(mockRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and save a new vehicle', async () => {
      const dto = { vin: 'ABC123', year: 2015, status: 'in_stock', variantId: 1 };
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 2, ...dto });

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(dto);
      expect(result).toMatchObject({ id: 2, vin: 'ABC123' });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a vehicle and return the updated record', async () => {
      const updated = { ...mockVehicle, status: 'scrapped' };
      mockRepo.update.mockResolvedValue({ affected: 1 });
      mockRepo.findOne.mockResolvedValue(updated);

      const result = await service.update(1, { status: 'scrapped' });

      expect(mockRepo.update).toHaveBeenCalledWith(1, { status: 'scrapped' });
      expect(result.status).toBe('scrapped');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a vehicle by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should return totalPages of 0 when no vehicles exist', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll({});
      expect(result.meta.totalPages).toBe(0);
    });

    it('should apply both status and search filters together', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockVehicle], 1]);
      await service.findAll({ status: 'in_stock', search: 'WBA' });
      const call = mockRepo.findAndCount.mock.calls[0][0];
      expect(call.where).toMatchObject({ status: 'in_stock' });
    });

    it('should not add undefined filters to where clause', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ status: undefined, search: undefined });
      const call = mockRepo.findAndCount.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('status');
      expect(call.where).not.toHaveProperty('vin');
    });

    it('should use page 1 as default when not specified', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll({});
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });
  });

});