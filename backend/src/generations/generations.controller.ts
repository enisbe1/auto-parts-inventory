import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { GenerationsService } from './generations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
class CreateGenerationDto {
  @IsString() name: string;
  @IsNumber() @Type(() => Number) modelId: number;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsNumber() @Type(() => Number) yearStart?: number;
  @IsOptional() @IsNumber() @Type(() => Number) yearEnd?: number;
}
class UpdateGenerationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsNumber() @Type(() => Number) yearStart?: number;
  @IsOptional() @IsNumber() @Type(() => Number) yearEnd?: number;
}
@Controller('generations')
export class GenerationsController {
  constructor(private svc: GenerationsService) {}
  @Get() findAll(@Query('modelId') modelId?: string) { return this.svc.findAll(modelId ? +modelId : undefined); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post() create(@Body() dto: CreateGenerationDto) { return this.svc.create(dto); }
  @UseGuards(JwtAuthGuard) @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGenerationDto) { return this.svc.update(+id, dto); }
  @UseGuards(JwtAuthGuard) @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
