import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarModel } from './car-model.entity';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
@Module({ imports: [TypeOrmModule.forFeature([CarModel])], providers: [ModelsService], controllers: [ModelsController], exports: [ModelsService] })
export class ModelsModule {}
