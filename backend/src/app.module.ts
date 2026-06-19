import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MakesModule } from './makes/makes.module';
import { ModelsModule } from './models/models.module';
import { GenerationsModule } from './generations/generations.module';
import { VariantsModule } from './variants/variants.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PartsModule } from './parts/parts.module';
import { CategoriesModule } from './categories/categories.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';
import { AlertsModule } from './alerts/alerts.module';
import { ActivityModule } from './activity/activity.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT')!),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsTableName: 'typeorm_migrations',
        synchronize: false,
      }),
    }),
    AuthModule,
    UsersModule,
    MakesModule,
    ModelsModule,
    GenerationsModule,
    VariantsModule,
    VehiclesModule,
    PartsModule,
    CategoriesModule,
    AnalyticsModule,
    UploadsModule,
    AlertsModule,
    ActivityModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
