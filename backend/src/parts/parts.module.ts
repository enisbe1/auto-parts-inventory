import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part } from './part.entity';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([Part]), ActivityModule],
  providers: [PartsService],
  controllers: [PartsController],
})
export class PartsModule {}
