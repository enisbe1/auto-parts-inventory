import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part } from './part.entity';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
@Module({ imports: [TypeOrmModule.forFeature([Part])], providers: [PartsService], controllers: [PartsController] })
export class PartsModule {}
