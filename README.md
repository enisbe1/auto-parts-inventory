# Auto Parts Inventory Management System

A full-stack web application for automotive dismantling businesses to manage vehicle and parts inventory. Each part is traceable back to its source vehicle through a six-level hierarchy: **Make → Model → Generation → Variant → Vehicle → Part**.

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
# Defaults work with docker-compose out of the box — no changes needed
```

### 4. Run migrations

```bash
npm run migration:run
```

### 5. Start the backend

```bash
npm run start:dev
```

API available at: `http://localhost:3001/api`

### 6. Seed the database

```bash
npm run seed
```

Populates:
- 6 makes (BMW, Audi, Volkswagen, Mercedes-Benz, Toyota, Ford)
- 13 models, 18 generations, 22 variants
- 10 part categories (Engine, Gearbox, Suspension, Brakes, Body, Electronics, Interior, Cooling, Exhaust, Fuel System)
- Default login: **admin@autoparts.com** / **admin123**

### 7. Start the frontend

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
├── .nvmrc                        # Node 22
├── backend/
│   ├── docker-compose.yml        # PostgreSQL 16 container
│   ├── .env.example              # Environment template
│   └── src/
│       ├── auth/                 # JWT authentication
│       ├── users/                # User accounts & roles
│       ├── makes/                # Car makes
│       ├── models/               # Car models
│       ├── generations/          # Model generations (e.g. F30, G20)
│       ├── variants/             # Engine variants (e.g. 320d, 320i)
│       ├── vehicles/             # Physical vehicles in stock
│       ├── parts/                # Individual parts with photos
│       ├── categories/           # Part categories
│       ├── analytics/            # Sales & purchase aggregations
│       ├── activity/             # Audit log
│       ├── alerts/               # Low-stock alerts
│       ├── uploads/              # Photo upload (static file serving)
│       └── seed.ts               # Database seeder
└── frontend/
    └── src/
        ├── app/
        │   ├── login/            # Login & register
        │   ├── dashboard/        # Stats + activity feed + alerts
        │   ├── vehicles/         # Vehicle list, detail, add, edit
        │   ├── parts/            # Parts list, add, edit
        │   ├── categories/       # Category management
        │   ├── catalogue/        # Make/Model/Generation/Variant management
        │   ├── search/           # Full-text part search
        │   ├── analytics/        # Sales & purchase charts
        │   ├── part-templates/   # Reusable part name templates
        │   └── finances/         # Revenue, purchases & expense tracker
        ├── components/           # Sidebar, Modals, Toast, Command Palette, etc.
        ├── contexts/             # ThemeContext, LanguageContext
        └── lib/                  # Axios client, i18n, TypeScript types
```

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | Login / register — redirects to dashboard if already authenticated |
| `/dashboard` | Live stats, recent activity feed, and low-stock alerts |
| `/vehicles` | Paginated vehicle list with search and status filter |
| `/vehicles/new` | Add vehicle — cascading Make → Model → Generation → Variant dropdowns |
| `/vehicles/[id]` | Vehicle detail — info, profitability breakdown, parts table |
| `/vehicles/[id]/edit` | Edit vehicle — pre-populated form |
| `/parts` | Paginated parts list — search, filter, bulk actions, CSV export, QR labels |
| `/parts/new` | Add part — photo upload, price suggestion from templates |
| `/parts/[id]/edit` | Edit part — all fields including photos |
| `/categories` | Add and delete part categories |
| `/catalogue` | Manage Makes, Models, Generations, Variants |
| `/search` | Full-text search across all parts with vehicle provenance |
| `/analytics` | Daily/monthly/yearly charts for sales revenue and vehicle purchases |
| `/part-templates` | Manage reusable part name templates for fast data entry |
| `/finances` | Track part sales revenue, vehicle purchase costs, and manual expenses |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |

### Catalogue
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/makes` | — | List all makes |
| POST | `/api/makes` | JWT | Create make |
| DELETE | `/api/makes/:id` | JWT | Delete make |
| GET | `/api/models?makeId=` | — | List models |
| POST | `/api/models` | JWT | Create model |
| GET | `/api/generations?modelId=` | — | List generations |
| POST | `/api/generations` | JWT | Create generation |
| GET | `/api/variants?generationId=` | — | List variants |
| POST | `/api/variants` | JWT | Create variant |

### Vehicles & Parts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/vehicles?page=&limit=&status=&search=` | — | Paginated vehicles |
| GET | `/api/vehicles/:id` | — | Vehicle with all parts |
| POST | `/api/vehicles` | JWT | Register vehicle |
| PATCH | `/api/vehicles/:id` | JWT | Update vehicle |
| DELETE | `/api/vehicles/:id` | JWT | Delete vehicle (cascades parts) |
| GET | `/api/parts?page=&limit=&search=&status=&condition=&categoryId=&vehicleId=` | — | Paginated parts |
| POST | `/api/parts` | JWT | Add part |
| PATCH | `/api/parts/:id` | JWT | Update part |
| DELETE | `/api/parts/:id` | JWT | Delete part |
| GET | `/api/categories` | — | List categories |
| POST | `/api/categories` | JWT | Create category |
| DELETE | `/api/categories/:id` | JWT | Delete category |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/summary` | JWT | Overall totals — revenue, P/L, vehicles |
| GET | `/api/analytics/sales/daily?year=&month=` | JWT | Daily sales for a month |
| GET | `/api/analytics/sales/monthly?year=` | JWT | Monthly sales for a year |
| GET | `/api/analytics/purchases/daily?year=&month=` | JWT | Daily purchases for a month |
| GET | `/api/analytics/purchases/monthly?year=` | JWT | Monthly purchases for a year |
| GET | `/api/analytics/purchases/yearly` | JWT | Per-year purchase totals |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/activity?limit=` | JWT | Recent audit log entries |
| GET | `/api/alerts` | JWT | Low-stock alerts |
| POST | `/api/uploads/photo` | JWT | Upload part photo (returns URL) |

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

### Core Inventory
- **Six-level hierarchy** — Make → Model → Generation → Variant → Vehicle → Part, enforced with foreign key constraints
- **JWT authentication** — stateless, all write operations protected; admin vs. standard roles
- **Paginated API** — all list endpoints support `?page=&limit=` with total metadata
- **Full-text search** — case-insensitive search on parts with full vehicle provenance chain
- **Cascading dropdowns** — Add Vehicle form restricts to valid Make/Model/Generation/Variant combinations
- **Bulk actions** — select multiple parts to update status or delete in one action
- **CSV export** — download the filtered parts list as a CSV file

### Phase 3 Features
- **Analytics Dashboard** — daily and monthly area/bar charts for sales revenue and vehicle purchases
- **Activity Feed** — real-time audit log of part and vehicle changes on the dashboard
- **Low-stock Alerts** — configurable threshold alerts shown on the dashboard
- **QR Label Generator** — print QR code labels for any part, linking to its detail page
- **Photo Uploads** — attach multiple photos to each part; full-screen lightbox viewer
- **CSV Import** — bulk-import parts from a CSV file into a vehicle
- **Sell Part Flow** — dedicated modal to record final sale price (override asking price)
- **Part Templates** — save reusable part names for fast data entry
- **Multilingual UI** — English, German (Deutsch), and Albanian (Shqip) via language picker in sidebar
- **Light / Dark Mode** — full CSS-variable theming with toggle button; preference saved to localStorage
- **Finances Page** — drill-down tracker for sales revenue (by day/month/year), vehicle purchase costs, and a manual other-spendings ledger

### Infrastructure
- **Database indexes** — on `parts.name`, `parts.status`, `parts.vehicleId`, `parts.categoryId`
- **TypeORM migrations** — schema versioned with migration files
- **Docker Compose** — single command database setup with persistent volume
- **Seed script** — populates real automotive reference data and a default admin user
- **Static file serving** — uploaded photos served via NestJS ServeStaticModule

---

## Author

Enis Berisha — DLMCSPCSP01 Computer Science Project  
Matriculation: 9210947  
GitHub: https://github.com/enisbe1
