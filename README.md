# Auto Parts Inventory Management System

A full-stack web application for automotive dismantling businesses to manage car parts inventory, built with **NestJS** (backend), **Next.js** (frontend), and **PostgreSQL** (database).

## Project Structure

```
auto-parts-inventory/
├── backend/    # NestJS REST API
└── frontend/   # Next.js React app
```

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm or yarn

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env` already provided):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=auto_parts_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
PORT=3001
```

Create the database in PostgreSQL:
```sql
CREATE DATABASE auto_parts_db;
```

Run the backend:
```bash
npm run start:dev
```

API will be available at `http://localhost:3001/api`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/makes | List all car makes |
| POST | /api/makes | Create make (auth required) |
| GET | /api/models?makeId= | List models (filter by make) |
| GET | /api/generations?modelId= | List generations |
| GET | /api/variants?generationId= | List variants |
| GET | /api/vehicles | List all vehicles |
| POST | /api/vehicles | Add vehicle (auth required) |
| GET | /api/parts | List all parts |
| GET | /api/parts?search=&status=&categoryId= | Search/filter parts |
| POST | /api/parts | Add part (auth required) |
| PATCH | /api/parts/:id | Update part status (auth required) |

## Features

- Hierarchical inventory: Make → Model → Generation → Variant → Part
- JWT authentication and role-based access
- Full-text search across parts inventory
- Filter by status (available / reserved / sold), condition, category
- Dashboard with live stats
- Responsive UI built with Tailwind CSS

## Author

Enis Berisha — DLMCSPCSP01 Computer Science Project  
GitHub: https://github.com/enisbe1
