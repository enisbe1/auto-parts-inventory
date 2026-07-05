import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ManualEntriesService } from './manual-entries.service';
import type { CreateManualEntryDto } from './manual-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('manual-entries')
export class ManualEntriesController {
  constructor(private svc: ManualEntriesService) {}

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.svc.findAll({
      type,
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateManualEntryDto) {
    return this.svc.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(parseInt(id));
  }
}
