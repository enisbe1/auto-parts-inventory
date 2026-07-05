import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
class CreateVariantDto {
  @IsString() name: string;
  @IsNumber() @Type(() => Number) generationId: number;
  @IsOptional() @IsString() engine?: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsNumber() @Type(() => Number) powerKw?: number;
}
class UpdateVariantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() engine?: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsNumber() @Type(() => Number) powerKw?: number;
}
@Controller('variants')
export class VariantsController {
  constructor(private svc: VariantsService) {}
  @Get() findAll(@Query('generationId') gid?: string) { return this.svc.findAll(gid ? +gid : undefined); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post() create(@Body() dto: CreateVariantDto) { return this.svc.create(dto); }
  @UseGuards(JwtAuthGuard) @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateVariantDto) { return this.svc.update(+id, dto); }
  @UseGuards(JwtAuthGuard) @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
