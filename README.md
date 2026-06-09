# Auto Parts Inventory Management System

A full-stack web application for automotive dismantling businesses to manage car parts inventory, tracking each part back to its source vehicle through a six-level hierarchy: **Make → Model → Generation → Variant → Vehicle → Part**.

Built with **NestJS** (backend REST API), **PostgreSQL** (database), and **Next.js 15** (frontend).

**GitHub:** https://github.com/enisbe1/auto-parts-inventory

---

## Quick Start

### Requirements

- Node.js 22+ (`.nvmrc` included — run `nvm use`)
- Docker + Docker Compose (for PostgreSQL)
- npm

### 1. Clone and install

```bash
git clone https://github.com/enisbe1/auto-parts-inventory.git
cd auto-parts-inventory
nvm use
```

### 2. Start the database

```bash
cd backend
docker-compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed — defaults work with docker-compose out of the box
```

### 4. Start the backend

```bash
npm install
npm run start:dev
```

API available at: `http://localhost:3001/api`

### 5. Seed the database

```bash
npm run seed
```

This populates:
- 6 makes (BMW, Audi, Volkswagen, Mercedes-Benz, Toyota, Ford)
- 13 models, 18 generations, 22 variants
- 10 part categories (Engine, Gearbox, Suspension, Brakes, Body, Electronics, Interior, Cooling, Exhaust, Fuel System)
- Default login: **admin@autoparts.com** / **admin123**

### 6. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

App available at: `http://localhost:3000`

---

## Project Structure

```
auto-parts-inventory/
├── .nvmrc                    # Node 22
├── backend/
│   ├── docker-compose.yml    # PostgreSQL 16 container
│   ├── .env.example          # Environment template
│   └── src/
│       ├── auth/             # JWT authentication
│       ├── users/            # User accounts
│       ├── makes/            # Car makes
│       ├── models/           # Car models
│       ├── generations/      # Model generations (e.g. F30, G20)
│       ├── variants/         # Engine variants (e.g. 320d, 320i)
│       ├── vehicles/         # Physical vehicles in stock
│       ├── parts/            # Individual parts
│       ├── categories/       # Part categories
│       └── seed.ts           # Database seeder
└── frontend/
    └── src/
        ├── app/
        │   ├── login/        # Login & register
        │   ├── dashboard/    # Stats overview
        │   ├── vehicles/     # Vehicle list, detail, add, edit
        │   ├── parts/        # Parts list with search, filter, bulk actions
        │   ├── categories/   # Category management
        │   ├── catalogue/    # Make/Model/Generation/Variant management
        │   └── search/       # Full-text part search
        ├── components/       # Navbar, Toast, ConfirmModal
        └── lib/              # Axios client, TypeScript types
```

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | Login / register — redirects to dashboard if already authenticated |
| `/dashboard` | Live stats: total vehicles, parts, available, sold |
| `/vehicles` | Paginated vehicle list with VIN search and status filter |
| `/vehicles/new` | Add vehicle — cascading Make → Model → Generation → Variant dropdowns |
| `/vehicles/[id]` | Vehicle detail — info grid, parts table with inline status update |
| `/vehicles/[id]/edit` | Edit vehicle — pre-populated form with full hierarchy |
| `/parts` | Paginated parts list — search, filter, bulk status update, CSV export |
| `/parts/new` | Add part — pre-selects vehicle if `?vehicleId=` param present |
| `/parts/[id]/edit` | Edit part — all fields pre-populated |
| `/categories` | Add and delete part categories |
| `/catalogue` | Four-column panel to manage Makes, Models, Generations, Variants |
| `/search` | Full-text search across all parts with provenance chain |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/makes` | — | List all makes |
| POST | `/api/makes` | JWT | Create make |
| DELETE | `/api/makes/:id` | JWT | Delete make |
| GET | `/api/models?makeId=` | — | List models (filter by make) |
| POST | `/api/models` | JWT | Create model |
| GET | `/api/generations?modelId=` | — | List generations |
| POST | `/api/generations` | JWT | Create generation |
| GET | `/api/variants?generationId=` | — | List variants |
| POST | `/api/variants` | JWT | Create variant |
| GET | `/api/vehicles?page=&limit=&status=&search=` | — | Paginated vehicles |
| GET | `/api/vehicles/:id` | — | Vehicle with all parts |
| POST | `/api/vehicles` | JWT | Register vehicle |
| PATCH | `/api/vehicles/:id` | JWT | Update vehicle |
| DELETE | `/api/vehicles/:id` | JWT | Delete vehicle |
| GET | `/api/parts?page=&limit=&search=&status=&condition=&categoryId=&vehicleId=` | — | Paginated parts |
| POST | `/api/parts` | JWT | Add part |
| PATCH | `/api/parts/:id` | JWT | Update part (incl. status) |
| DELETE | `/api/parts/:id` | JWT | Delete part |
| GET | `/api/categories` | — | List categories |
| POST | `/api/categories` | JWT | Create category |
| DELETE | `/api/categories/:id` | JWT | Delete category |

All list endpoints return: `{ data: [...], meta: { total, page, limit, totalPages } }`

---

## Running Tests

```bash
cd backend
npm test
```

**120 tests across 12 suites** — all passing:

| Suite | Tests |
|-------|-------|
| auth.service.spec.ts | 9 |
| users.service.spec.ts | 8 |
| parts.service.spec.ts | 19 |
| vehicles.service.spec.ts | 16 |
| categories.service.spec.ts | 7 |
| makes.service.spec.ts | 7 |
| models.service.spec.ts | 10 |
| generations.service.spec.ts | 10 |
| variants.service.spec.ts | 10 |
| auth.controller.spec.ts | 4 |
| parts.controller.spec.ts | 10 |
| vehicles.controller.spec.ts | 10 |

---

## Features

- **Six-level hierarchy** — Make → Model → Generation → Variant → Vehicle → Part, enforced at database level with foreign key constraints
- **JWT authentication** — stateless, all write operations protected
- **Paginated API** — all list endpoints support `?page=&limit=` with total metadata
- **Full-text search** — ILike search on parts with full provenance chain
- **Cascading dropdowns** — Add Vehicle form restricts to valid Make/Model/Generation/Variant combinations
- **Bulk actions** — select multiple parts to update status or delete in one action
- **CSV export** — download filtered parts list as CSV
- **Catalogue management** — add/remove makes, models, generations, variants from the browser
- **Database indexes** — on `parts.name`, `parts.status`, `parts.vehicleId`, `parts.categoryId`
- **Docker Compose** — single command database setup with persistent volume
- **Seed script** — populates real automotive reference data + default user

---

## Author

Enis Berisha — DLMCSPCSP01 Computer Science Project  
Matriculation: 9210947  
GitHub: https://github.com/enisbe1
