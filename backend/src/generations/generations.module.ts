import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Generation } from './generation.entity';
import { GenerationsService } from './generations.service';
import { GenerationsController } from './generations.controller';
@Module({ imports: [TypeOrmModule.forFeature([Generation])], providers: [GenerationsService], controllers: [GenerationsController], exports: [GenerationsService] })
export class GenerationsModule {}
