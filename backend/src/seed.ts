import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

import { Make } from './makes/make.entity';
import { CarModel } from './models/car-model.entity';
import { Generation } from './generations/generation.entity';
import { Variant } from './variants/variant.entity';
import { Category } from './categories/category.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  port:     +(process.env.DB_PORT   || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME     || 'auto_parts',
  entities: [Make, CarModel, Generation, Variant, Category],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to DB');

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoryRepo = AppDataSource.getRepository(Category);
  const categoryData = [
    { name: 'Engine',       description: 'Engine block, head, pistons, camshaft, crankshaft, timing components' },
    { name: 'Gearbox',      description: 'Manual and automatic transmission assemblies and components' },
    { name: 'Suspension',   description: 'Control arms, struts, springs, stabiliser bars, wheel bearings' },
    { name: 'Brakes',       description: 'Callipers, discs, pads, master cylinders, brake lines' },
    { name: 'Body',         description: 'Doors, bonnets, bumpers, wings, boot lids, glass panels' },
    { name: 'Electronics',  description: 'ECU, sensors, wiring harnesses, alternators, starters, instrument clusters' },
    { name: 'Interior',     description: 'Seats, dashboards, door cards, carpets, steering wheels, mirrors' },
    { name: 'Cooling',      description: 'Radiators, water pumps, thermostats, fans, intercoolers' },
    { name: 'Exhaust',      description: 'Manifolds, catalytic converters, DPF, silencers, downpipes' },
    { name: 'Fuel System',  description: 'Injectors, fuel pumps, fuel rails, throttle bodies' },
  ];
  for (const c of categoryData) {
    const exists = await categoryRepo.findOne({ where: { name: c.name } });
    if (!exists) await categoryRepo.save(categoryRepo.create(c));
  }
  console.log('Categories seeded');

  // ── Makes ──────────────────────────────────────────────────────────────────
  const makeRepo = AppDataSource.getRepository(Make);

  const makesData = [
    { name: 'BMW',         countryOfOrigin: 'Germany' },
    { name: 'Audi',        countryOfOrigin: 'Germany' },
    { name: 'Volkswagen',  countryOfOrigin: 'Germany' },
    { name: 'Mercedes-Benz', countryOfOrigin: 'Germany' },
    { name: 'Toyota',      countryOfOrigin: 'Japan' },
    { name: 'Ford',        countryOfOrigin: 'USA' },
  ];
  const makes: Record<string, Make> = {};
  for (const m of makesData) {
    let make = await makeRepo.findOne({ where: { name: m.name } });
    if (!make) make = await makeRepo.save(makeRepo.create(m));
    makes[m.name] = make;
  }
  console.log('Makes seeded');

  // ── Models ─────────────────────────────────────────────────────────────────
  const modelRepo = AppDataSource.getRepository(CarModel);

  type ModelSpec = { name: string; bodyType: string; make: string };
  const modelsData: ModelSpec[] = [
    // BMW
    { name: '3 Series', bodyType: 'Saloon',  make: 'BMW' },
    { name: '5 Series', bodyType: 'Saloon',  make: 'BMW' },
    { name: 'X5',       bodyType: 'SUV',     make: 'BMW' },
    // Audi
    { name: 'A4',       bodyType: 'Saloon',  make: 'Audi' },
    { name: 'A6',       bodyType: 'Saloon',  make: 'Audi' },
    { name: 'Q5',       bodyType: 'SUV',     make: 'Audi' },
    // VW
    { name: 'Golf',     bodyType: 'Hatchback', make: 'Volkswagen' },
    { name: 'Passat',   bodyType: 'Saloon',    make: 'Volkswagen' },
    { name: 'Tiguan',   bodyType: 'SUV',       make: 'Volkswagen' },
    // Mercedes
    { name: 'C-Class',  bodyType: 'Saloon',  make: 'Mercedes-Benz' },
    { name: 'E-Class',  bodyType: 'Saloon',  make: 'Mercedes-Benz' },
    // Toyota
    { name: 'Corolla',  bodyType: 'Saloon',  make: 'Toyota' },
    // Ford
    { name: 'Focus',    bodyType: 'Hatchback', make: 'Ford' },
  ];

  const models: Record<string, CarModel> = {};
  for (const m of modelsData) {
    const key = `${m.make}-${m.name}`;
    let model = await modelRepo.findOne({ where: { name: m.name, make: { id: makes[m.make].id } } });
    if (!model) {
      model = await modelRepo.save(modelRepo.create({ name: m.name, bodyType: m.bodyType, make: makes[m.make] }));
    }
    models[key] = model;
  }
  console.log('Models seeded');

  // ── Generations ────────────────────────────────────────────────────────────
  const genRepo = AppDataSource.getRepository(Generation);

  type GenSpec = { model: string; make: string; name: string; code: string; yearStart: number; yearEnd?: number };
  const gensData: GenSpec[] = [
    // BMW 3 Series
    { make: 'BMW', model: '3 Series', name: 'F30',  code: 'F30',  yearStart: 2012, yearEnd: 2018 },
    { make: 'BMW', model: '3 Series', name: 'G20',  code: 'G20',  yearStart: 2019 },
    { make: 'BMW', model: '3 Series', name: 'E90',  code: 'E90',  yearStart: 2005, yearEnd: 2011 },
    // BMW 5 Series
    { make: 'BMW', model: '5 Series', name: 'F10',  code: 'F10',  yearStart: 2010, yearEnd: 2016 },
    { make: 'BMW', model: '5 Series', name: 'G30',  code: 'G30',  yearStart: 2017 },
    // BMW X5
    { make: 'BMW', model: 'X5',       name: 'E70',  code: 'E70',  yearStart: 2006, yearEnd: 2013 },
    { make: 'BMW', model: 'X5',       name: 'F15',  code: 'F15',  yearStart: 2013, yearEnd: 2018 },
    // Audi A4
    { make: 'Audi', model: 'A4', name: 'B8',  code: 'B8',  yearStart: 2008, yearEnd: 2015 },
    { make: 'Audi', model: 'A4', name: 'B9',  code: 'B9',  yearStart: 2016 },
    // Audi A6
    { make: 'Audi', model: 'A6', name: 'C7',  code: 'C7',  yearStart: 2011, yearEnd: 2018 },
    { make: 'Audi', model: 'A6', name: 'C8',  code: 'C8',  yearStart: 2018 },
    // VW Golf
    { make: 'Volkswagen', model: 'Golf', name: 'Mk6', code: 'Mk6', yearStart: 2008, yearEnd: 2012 },
    { make: 'Volkswagen', model: 'Golf', name: 'Mk7', code: 'Mk7', yearStart: 2013, yearEnd: 2019 },
    { make: 'Volkswagen', model: 'Golf', name: 'Mk8', code: 'Mk8', yearStart: 2020 },
    // VW Passat
    { make: 'Volkswagen', model: 'Passat', name: 'B7', code: 'B7', yearStart: 2010, yearEnd: 2015 },
    { make: 'Volkswagen', model: 'Passat', name: 'B8', code: 'B8', yearStart: 2015 },
    // Mercedes C-Class
    { make: 'Mercedes-Benz', model: 'C-Class', name: 'W204', code: 'W204', yearStart: 2007, yearEnd: 2014 },
    { make: 'Mercedes-Benz', model: 'C-Class', name: 'W205', code: 'W205', yearStart: 2014 },
  ];

  const gens: Record<string, Generation> = {};
  for (const g of gensData) {
    const modelKey = `${g.make}-${g.model}`;
    const key = `${modelKey}-${g.code}`;
    let gen = await genRepo.findOne({ where: { code: g.code, model: { id: models[modelKey].id } } });
    if (!gen) {
      gen = await genRepo.save(genRepo.create({
        name: g.name, code: g.code, yearStart: g.yearStart,
        yearEnd: g.yearEnd, model: models[modelKey],
      }));
    }
    gens[key] = gen;
  }
  console.log('Generations seeded');

  // ── Variants ───────────────────────────────────────────────────────────────
  const variantRepo = AppDataSource.getRepository(Variant);

  type VarSpec = { make: string; model: string; gen: string; name: string; engine: string; fuelType: string; powerKw: number };
  const variantsData: VarSpec[] = [
    // BMW F30
    { make: 'BMW', model: '3 Series', gen: 'F30', name: '320d',  engine: '2.0 TDI',  fuelType: 'Diesel',  powerKw: 135 },
    { make: 'BMW', model: '3 Series', gen: 'F30', name: '320i',  engine: '2.0 TFSI',  fuelType: 'Petrol',  powerKw: 135 },
    { make: 'BMW', model: '3 Series', gen: 'F30', name: '328i',  engine: '2.0 TFSI',  fuelType: 'Petrol',  powerKw: 180 },
    { make: 'BMW', model: '3 Series', gen: 'F30', name: '330d',  engine: '3.0 TDI',  fuelType: 'Diesel',  powerKw: 190 },
    // BMW G20
    { make: 'BMW', model: '3 Series', gen: 'G20', name: '320d',  engine: '2.0 TDI',  fuelType: 'Diesel',  powerKw: 140 },
    { make: 'BMW', model: '3 Series', gen: 'G20', name: '330i',  engine: '2.0 TFSI',  fuelType: 'Petrol',  powerKw: 190 },
    // BMW E90
    { make: 'BMW', model: '3 Series', gen: 'E90', name: '320d',  engine: '2.0 TDI',  fuelType: 'Diesel',  powerKw: 120 },
    { make: 'BMW', model: '3 Series', gen: 'E90', name: '325i',  engine: '2.5 N52',  fuelType: 'Petrol',  powerKw: 160 },
    // BMW F10
    { make: 'BMW', model: '5 Series', gen: 'F10', name: '520d',  engine: '2.0 TDI',  fuelType: 'Diesel',  powerKw: 135 },
    { make: 'BMW', model: '5 Series', gen: 'F10', name: '530d',  engine: '3.0 TDI',  fuelType: 'Diesel',  powerKw: 190 },
    { make: 'BMW', model: '5 Series', gen: 'F10', name: '528i',  engine: '2.0 TFSI',  fuelType: 'Petrol',  powerKw: 180 },
    // Audi A4 B8
    { make: 'Audi', model: 'A4', gen: 'B8', name: '2.0 TDI', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 105 },
    { make: 'Audi', model: 'A4', gen: 'B8', name: '2.0 TFSI', engine: '2.0 TFSI', fuelType: 'Petrol', powerKw: 155 },
    // Audi A4 B9
    { make: 'Audi', model: 'A4', gen: 'B9', name: '2.0 TDI', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 110 },
    { make: 'Audi', model: 'A4', gen: 'B9', name: '2.0 TFSI', engine: '2.0 TFSI', fuelType: 'Petrol', powerKw: 140 },
    // VW Golf Mk7
    { make: 'Volkswagen', model: 'Golf', gen: 'Mk7', name: '1.6 TDI', engine: '1.6 TDI', fuelType: 'Diesel', powerKw: 85 },
    { make: 'Volkswagen', model: 'Golf', gen: 'Mk7', name: '2.0 TDI', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 110 },
    { make: 'Volkswagen', model: 'Golf', gen: 'Mk7', name: '1.4 TSI', engine: '1.4 TSI', fuelType: 'Petrol', powerKw: 92 },
    // VW Golf Mk6
    { make: 'Volkswagen', model: 'Golf', gen: 'Mk6', name: '2.0 TDI', engine: '2.0 TDI', fuelType: 'Diesel', powerKw: 103 },
    { make: 'Volkswagen', model: 'Golf', gen: 'Mk6', name: '1.6 TDI', engine: '1.6 TDI', fuelType: 'Diesel', powerKw: 77 },
    // Mercedes W204
    { make: 'Mercedes-Benz', model: 'C-Class', gen: 'W204', name: 'C220 CDI', engine: '2.2 CDI', fuelType: 'Diesel', powerKw: 125 },
    { make: 'Mercedes-Benz', model: 'C-Class', gen: 'W204', name: 'C180',     engine: '1.6 CGI', fuelType: 'Petrol', powerKw: 115 },
  ];

  for (const v of variantsData) {
    const genKey = `${v.make}-${v.model}-${v.gen}`;
    const exists = await variantRepo.findOne({ where: { name: v.name, generation: { id: gens[genKey].id } } });
    if (!exists) {
      await variantRepo.save(variantRepo.create({
        name: v.name, engine: v.engine, fuelType: v.fuelType,
        powerKw: v.powerKw, generation: gens[genKey],
      }));
    }
  }
  console.log('Variants seeded');

  await AppDataSource.destroy();
  console.log('\nSeed complete! Your database now has:');
  console.log('  • 6 makes  (BMW, Audi, VW, Mercedes, Toyota, Ford)');
  console.log('  • 13 models');
  console.log('  • 18 generations');
  console.log('  • 22 variants');
  console.log('  • 10 part categories');
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
