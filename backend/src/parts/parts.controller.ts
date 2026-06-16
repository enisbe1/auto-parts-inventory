import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PartsService } from './parts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CreatePartDto {
  @IsString() name: string;
  @IsOptional() @IsString() partNumber?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsNumber() @Type(() => Number) price?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @Type(() => Number) vehicleId?: number;
  @IsOptional() @IsNumber() @Type(() => Number) categoryId?: number;
}

class UpdatePartDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() partNumber?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsNumber() @Type(() => Number) price?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @Type(() => Number) vehicleId?: number;
  @IsOptional() @IsNumber() @Type(() => Number) categoryId?: number;
}

@Controller('parts')
export class PartsController {
  constructor(private svc: PartsService) {}

  @Get()
  findAll(
    @Query('vehicleId')   vehicleId?: string,
    @Query('categoryId')  categoryId?: string,
    @Query('status')      status?: string,
    @Query('condition')   condition?: string,
    @Query('search')      search?: string,
    @Query('page')        page?: string,
    @Query('limit')       limit?: string,
  ) {
    return this.svc.findAll({
      vehicleId:  vehicleId  ? +vehicleId  : undefined,
      categoryId: categoryId ? +categoryId : undefined,
      status,
      condition,
      search,
      page:  page  ? +page  : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post()         create(@Body() dto: CreatePartDto) { return this.svc.create(dto); }
  @UseGuards(JwtAuthGuard) @Patch(':id')   update(@Param('id') id: string, @Body() dto: UpdatePartDto) { return this.svc.update(+id, dto); }
  @UseGuards(JwtAuthGuard) @Delete(':id')  remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
