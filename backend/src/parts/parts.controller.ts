import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { parse } from 'csv-parse/sync';
import { PartsService } from './parts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { IsArray, IsString, IsNumber, IsOptional } from 'class-validator';
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
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
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
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
}

@Controller('parts')
export class PartsController {
  constructor(private svc: PartsService) {}

  @Get()
  findAll(
    @Query('vehicleId')    vehicleId?: string,
    @Query('categoryId')   categoryId?: string,
    @Query('modelId')      modelId?: string,
    @Query('generationId') generationId?: string,
    @Query('status')       status?: string,
    @Query('condition')    condition?: string,
    @Query('search')       search?: string,
    @Query('page')         page?: string,
    @Query('limit')        limit?: string,
  ) {
    return this.svc.findAll({
      vehicleId:    vehicleId    ? +vehicleId    : undefined,
      categoryId:   categoryId   ? +categoryId   : undefined,
      modelId:      modelId      ? +modelId      : undefined,
      generationId: generationId ? +generationId : undefined,
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
  @UseGuards(JwtAuthGuard) @Roles('admin') @Delete(':id')  remove(@Param('id') id: string) { return this.svc.remove(+id); }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async importCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const rows = parse(file.buffer, { columns: true, skip_empty_lines: true });
    return this.svc.bulkCreate(rows);
  }
}
