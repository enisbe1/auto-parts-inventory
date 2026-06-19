import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('summary')
  getSummary() { return this.svc.getSummary(); }

  @Get('sales/daily')
  getSalesByDay(@Query('year') year: string, @Query('month') month: string) {
    return this.svc.getSalesByDay(parseInt(year, 10), parseInt(month, 10));
  }

  @Get('sales/monthly')
  getSalesByMonth(@Query('year') year: string) {
    return this.svc.getSalesByMonth(parseInt(year, 10));
  }

  @Get('purchases/daily')
  getPurchasesByDay(@Query('year') year: string, @Query('month') month: string) {
    return this.svc.getPurchasesByDay(parseInt(year, 10), parseInt(month, 10));
  }

  @Get('purchases/monthly')
  getPurchasesByMonth(@Query('year') year: string) {
    return this.svc.getPurchasesByMonth(parseInt(year, 10));
  }

  @Get('purchases/yearly')
  getPurchasesByYear() { return this.svc.getPurchasesByYear(); }
}
