import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variant } from './variant.entity';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
@Module({ imports: [TypeOrmModule.forFeature([Variant])], providers: [VariantsService], controllers: [VariantsController], exports: [VariantsService] })
export class VariantsModule {}
