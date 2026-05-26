import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
class CreateVehicleDto {
  @IsOptional() @IsNumber() @Type(() => Number) variantId?: number;
  @IsOptional() @IsString() vin?: string;
  @IsOptional() @IsNumber() @Type(() => Number) year?: number;
  @IsOptional() @IsNumber() @Type(() => Number) mileage?: number;
  @IsOptional() @IsNumber() @Type(() => Number) purchasePrice?: number;
  @IsOptional() @IsString() purchaseDate?: string;
  @IsOptional() @IsString() notes?: string;
}
@Controller('vehicles')
export class VehiclesController {
  constructor(private svc: VehiclesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post() create(@Body() dto: CreateVehicleDto) { return this.svc.create(dto); }
  @UseGuards(JwtAuthGuard) @Patch(':id') update(@Param('id') id: string, @Body() dto: CreateVehicleDto) { return this.svc.update(+id, dto); }
  @UseGuards(JwtAuthGuard) @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
