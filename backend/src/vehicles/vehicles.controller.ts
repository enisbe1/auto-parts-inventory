import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CreateVehicleDto {
  @IsOptional() @IsNumber() @Type(() => Number) variantId?: number;
  @IsOptional() @IsString() vin?: string;
  @IsOptional() @IsNumber() @Type(() => Number) year?: number;
  @IsOptional() @IsNumber() @Type(() => Number) mileage?: number;
  @IsOptional() @IsNumber() @Type(() => Number) purchasePrice?: number;
  @IsOptional() @IsString() purchaseDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
}

@Controller('vehicles')
export class VehiclesController {
  constructor(private svc: VehiclesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.svc.findAll({
      status,
      search,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post()        create(@Body() dto: CreateVehicleDto) { return this.svc.create(dto); }
  @UseGuards(JwtAuthGuard) @Patch(':id')  update(@Param('id') id: string, @Body() dto: CreateVehicleDto) { return this.svc.update(+id, dto); }
  @UseGuards(JwtAuthGuard) @Roles('admin') @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
