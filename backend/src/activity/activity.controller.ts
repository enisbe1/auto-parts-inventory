import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private svc: ActivityService) {}

  @Get()
  findRecent(@Query('limit') limit = '20') {
    return this.svc.findRecent(parseInt(limit, 10));
  }
}
