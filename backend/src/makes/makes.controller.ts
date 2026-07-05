import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MakesService } from './makes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';
class CreateMakeDto { @IsString() name: string; @IsOptional() @IsString() countryOfOrigin?: string; }
class UpdateMakeDto { @IsOptional() @IsString() name?: string; @IsOptional() @IsString() countryOfOrigin?: string; }
@Controller('makes')
export class MakesController {
  constructor(private svc: MakesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(+id); }
  @UseGuards(JwtAuthGuard) @Post() create(@Body() dto: CreateMakeDto) { return this.svc.create(dto.name, dto.countryOfOrigin); }
  @UseGuards(JwtAuthGuard) @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMakeDto) { return this.svc.update(+id, dto); }
  @UseGuards(JwtAuthGuard) @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
