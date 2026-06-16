# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent npm projects, no workspace root:

- `backend/` — NestJS 11 REST API on port 3001, PostgreSQL via TypeORM, JWT auth
- `frontend/` — Next.js 16 + React 19 app on port 3000, Tailwind 4

Run `npm install` separately in each. Node 22 (`.nvmrc` at repo root — `nvm use`).

## Common commands

**Database** (from `backend/`):
- `docker-compose up -d` — start Postgres 16 (container exposes **5437→5432**, so `.env` must use `DB_PORT=5437`, not the `5432` shown in `.env.example`)
- `npm run seed` — populate reference data + default user `admin@autoparts.com` / `admin123`

**Backend** (from `backend/`):
- `npm run start:dev` — watch mode on http://localhost:3001/api
- `npm test` — full Jest suite
- `npx jest src/parts/parts.service.spec.ts` — single test file (Jest `rootDir` is `src/`, `testRegex` is `*.spec.ts$`)
- `npm test -- -t "creates a part"` — filter by test name
- `npm run lint` — eslint with `--fix`
- `npm run build` — `nest build` → `dist/`

**Frontend** (from `frontend/`):
- `npm run dev` — http://localhost:3000
- `npm run build`, `npm run lint`

There is no top-level script that runs both — start them in separate terminals.

## Architecture

### Domain hierarchy
The core invariant is a six-level chain enforced by FK constraints:

```
Make → Model → Generation → Variant → Vehicle → Part
```

A Part traces to its source Vehicle, which traces up through Variant/Generation/Model/Make. The cascading dropdowns on `/vehicles/new` and the relation chain in `PartsService.findAll` (loads `vehicle.variant.generation.model.make`) both depend on this. When adding fields or endpoints, preserve this chain — do not let Parts skip levels or attach to entities above Vehicle.

### Backend module pattern
Each domain (`auth`, `users`, `makes`, `models`, `generations`, `variants`, `vehicles`, `parts`, `categories`) is a self-contained NestJS module with the same five-file shape: `*.entity.ts`, `*.module.ts`, `*.controller.ts`, `*.service.ts`, and a `.spec.ts` per controller/service. Wire new modules into `src/app.module.ts`.

- Entities use TypeORM decorators; `synchronize: true` is on (see `app.module.ts`) so **schema is auto-derived from entities — no migrations exist**. Schema changes happen by editing the entity.
- All controllers register under the global prefix `/api` (set in `main.ts`).
- DTOs are declared inline in controllers using `class-validator`; a global `ValidationPipe({ whitelist: true, transform: true })` strips unknown fields and coerces types.
- Reads are public; writes are guarded with `@UseGuards(JwtAuthGuard)`. The guard is just `AuthGuard('jwt')` backed by `JwtStrategy` (Bearer token, secret from `JWT_SECRET`).
- List endpoints return `{ data, meta: { total, page, limit, totalPages } }` — preserve this shape; the frontend depends on it.
- Seeder is a standalone script (`src/seed.ts`) run via `ts-node`, not a Nest CLI command.

### Frontend
- App Router under `src/app/`; shared HTTP client in `src/lib/api.ts`; shared TS types in `src/lib/types.ts`.
- `api.ts` is the single Axios instance: attaches `access_token` from `localStorage` on every request, and on any 401 clears the token and redirects to `/login`. Use this client for all API calls — do not call `fetch` directly or `axios.create` again.
- CORS in backend allows exactly `http://localhost:3000` with credentials. Changing the frontend origin requires updating `main.ts`.

### Next.js 16 warning (from `frontend/AGENTS.md`)
This project uses **Next.js 16**, which has breaking changes from the 13/14/15 conventions in most training data. Before writing or modifying frontend code, consult `frontend/node_modules/next/dist/docs/` for the current API. Heed deprecation notices.
