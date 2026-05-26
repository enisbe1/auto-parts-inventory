import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';
class CreateCategoryDto { @IsString() name: string; @IsOptional() @IsString() description?: string; }
@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post() create(@Body() dto: CreateCategoryDto) { return this.svc.create(dto.name, dto.description); }
  @UseGuards(JwtAuthGuard) @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
