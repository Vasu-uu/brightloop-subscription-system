# Brightloop Subscription System

Subscription management and recurring billing platform: plans, subscriptions,
auto-generated invoices, discounts and taxes, payments, customer portal and
finance dashboard.

## Stack

- **Backend**: Node.js, Express, Prisma ORM, MySQL, JWT auth, zod validation, pdfkit.
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios.

## Getting started

### 1. Database

Create a MySQL database and set `DATABASE_URL` in `backend/.env` (copy from
`backend/.env.example`):

```
DATABASE_URL="mysql://user:password@localhost:3306/brightloop"
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

The API listens on `http://localhost:4000`, under base path `/api/v1`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and talks to the API via `VITE_API_URL`
(see `frontend/.env.example`).

### Dev logins (from the seed script)

| Role     | Email                       | Password         |
|----------|------------------------------|-------------------|
| ADMIN    | admin@brightloop.test        | Brightloop@123    |
| STAFF    | staff@brightloop.test        | Brightloop@123    |
| CUSTOMER | customer@brightloop.test     | Brightloop@123    |

## Project layout

```
backend/
  prisma/schema.prisma       Database schema (MySQL)
  prisma/seed.ts             Deterministic seed (5,000 subscriptions)
  src/modules/               One folder per feature: routes + controller/service
  src/services/              Cross-module business logic (pricing, invoicing, payments)
  src/shared/                Auth, error handling, pagination, response helpers
frontend/
  src/pages/                 One folder per feature area
  src/api/                   Typed API client per module
  src/components/ui/         Shared UI kit (Button, DataTable, Modal, ...)
```

## Running tests / verification

There is no automated test suite yet. To sanity-check a change:

```bash
cd backend && npm run typecheck
cd frontend && npm run typecheck
```

Then exercise the relevant endpoints with `npm run dev` running against a
seeded database.
