import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { User } from './users/user.entity';
import { Make } from './makes/make.entity';
import { CarModel } from './models/car-model.entity';
import { Generation } from './generations/generation.entity';
import { Variant } from './variants/variant.entity';
import { Vehicle } from './vehicles/vehicle.entity';
import { Part } from './parts/part.entity';
import { Category } from './categories/category.entity';
import { Activity } from './activity/activity.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME     ?? 'autoparts',
  entities: [User, Make, CarModel, Generation, Variant, Vehicle, Part, Category, Activity],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
