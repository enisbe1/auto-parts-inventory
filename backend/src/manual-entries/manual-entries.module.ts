import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManualEntry } from './manual-entry.entity';
import { ManualEntriesController } from './manual-entries.controller';
import { ManualEntriesService } from './manual-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManualEntry])],
  controllers: [ManualEntriesController],
  providers: [ManualEntriesService],
  exports: [ManualEntriesService],
})
export class ManualEntriesModule {}
