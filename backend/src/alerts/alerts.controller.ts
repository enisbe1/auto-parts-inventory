import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly svc: AlertsService) {}

  @Get()
  getAlerts(
    @Query('staleDays') staleDays = '30',
  ) {
    return this.svc.getAlerts(parseInt(staleDays, 10));
  }
}
