import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ModelsService } from './models.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
class CreateModelDto { @IsString() name: string; @IsNumber() @Type(() => Number) makeId: number; @IsOptional() @IsString() bodyType?: string; }
@Controller('models')
export class ModelsController {
  constructor(private svc: ModelsService) {}
  @Get() findAll(@Query('makeId') makeId?: string) { return this.svc.findAll(makeId ? +makeId : undefined); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post() create(@Body() dto: CreateModelDto) { return this.svc.create(dto.name, dto.makeId, dto.bodyType); }
  @UseGuards(JwtAuthGuard) @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
