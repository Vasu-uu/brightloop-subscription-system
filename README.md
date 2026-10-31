# Brightloop Subscription System

A full-stack platform that runs the whole life of a subscription business: **products and plans → quotations → subscriptions → automated recurring invoices → discounts and taxes → payments → customer portal → finance reporting**.

Three roles (Admin, Staff, Customer), server-side pagination everywhere, idempotent billing, and a responsive light/dark UI.

![Finance dashboard](docs/screenshots/dashboard-light.png)

| Dark mode | Subscription lifecycle |
|---|---|
| ![Dashboard, dark mode](docs/screenshots/dashboard-dark.png) | ![Subscription detail](docs/screenshots/subscription-detail-light.png) |

---

## Table of contents

1. [Features](#features)
2. [Screenshots](#screenshots)
3. [Problem statement coverage](#problem-statement-coverage)
4. [Tech stack](#tech-stack)
5. [Quick start](#quick-start)
6. [Configuration](#configuration)
7. [Dev logins](#dev-logins)
8. [How billing works](#how-billing-works)
9. [Business rules](#business-rules)
10. [API reference](#api-reference)
11. [Architecture](#architecture)
12. [Project structure](#project-structure)
13. [Data model](#data-model)
14. [Performance](#performance)
15. [Troubleshooting](#troubleshooting)

---

## Features

**Catalog and rules**
- Products with variants (e.g. brand *Odoo* adds 560 to the price), taxes, and plans (daily / weekly / monthly / yearly) with minimum quantity, availability window, and per-plan toggles for auto-close, early close, pause and renew.
- Discounts: fixed or percentage, minimum purchase / quantity, start and end dates, usage limit, targeting specific products or subscriptions. They apply to the next invoice automatically and stop when expired or exhausted.

**Quotations and subscriptions**
- Quotation templates (plan + lines + validity in days) that spawn subscriptions in one call.
- Concurrency-safe numbering (`SUB-00001`, `INV-00001`, never reused).
- Strict status flow `DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED`, one step at a time, with early close only where the plan allows it.
- Pause, resume and renew, gated by plan flags.

**Billing and invoices**
- One-click (or scheduled) billing run that creates every missed period, in batches, with a database-level guarantee that nothing is billed twice.
- Invoice lifecycle: confirm, cancel, send, print and PDF download.
- Totals follow `total = subtotal − discountTotal + taxTotal`, computed per line.

**Payments and reporting**
- Record payments (cash, card, UPI, bank transfer, cheque) with row-level locking so concurrent payments can never overpay.
- Finance dashboard: active subscriptions, revenue, outstanding, overdue, revenue by month, and paid / outstanding / overdue invoice tabs.
- Customer portal: customers see only their own subscriptions (with lifecycle view) and invoices, and can pay online (simulated gateway).

**Security**
- JWT auth, bcrypt password hashing, strict password policy, role-based access on every route, hashed single-use password-reset tokens (1 hour expiry), customers get `404` (not `403`) for other customers' records.

**Experience**
- A product-style app shell: grouped, role-aware sidebar with an animated active marker, a top bar with a **command palette** (`Ctrl` / `Cmd` + `K`) to jump to any page or start an action (new subscription, run billing, switch theme).
- Dashboard with a greeting hero, count-up KPI cards that link to the matching list, an animated revenue chart with hover tooltips, and a sliding paid / outstanding / overdue switch.
- Smooth page transitions, staggered list animation, press and hover micro-interactions, skeleton loaders and toasts. Motion respects `prefers-reduced-motion` for number animation.
- Light and dark theme (persisted, no flash on load), mobile drawer navigation, searchable customer picker, confirm dialogs for destructive actions, accessible focus states and a print-friendly invoice.

---

## Screenshots

| Sign in | Create account |
|---|---|
| ![Login](docs/screenshots/login-light.png) | ![Signup](docs/screenshots/signup.png) |

**Command palette** (`Ctrl` / `Cmd` + `K`)

![Command palette](docs/screenshots/command-palette.png)

**Catalog (admin edits, staff reads)**

| Products with variants | Plans with lifecycle rules |
|---|---|
| ![Products](docs/screenshots/products.png) | ![Plans](docs/screenshots/plans.png) |

| Taxes | Discounts |
|---|---|
| ![Taxes](docs/screenshots/taxes.png) | ![Discounts](docs/screenshots/discounts.png) |

| Staff (admin only) | Quotation templates |
|---|---|
| ![Staff](docs/screenshots/staff.png) | ![Templates](docs/screenshots/templates.png) |

**Sales and billing**

| Subscriptions | Subscription: lifecycle stepper, variant lines, summary |
|---|---|
| ![Subscriptions](docs/screenshots/subscriptions.png) | ![Subscription detail](docs/screenshots/subscription-detail-light.png) |

| Invoices with filters and days overdue | Invoice: print, PDF, record payment |
|---|---|
| ![Invoices](docs/screenshots/invoices.png) | ![Invoice detail](docs/screenshots/invoice-detail-light.png) |

| Payments | Template editor |
|---|---|
| ![Payments](docs/screenshots/payments.png) | ![Template form](docs/screenshots/template-form.png) |

**Customer portal**

| My subscriptions | My invoices |
|---|---|
| ![Portal subscriptions](docs/screenshots/portal-subscriptions.png) | ![Portal invoices](docs/screenshots/portal-invoices.png) |

| Pay an invoice | Dark mode |
|---|---|
| ![Portal invoice](docs/screenshots/portal-invoice-light.png) | ![Subscription dark](docs/screenshots/subscription-detail-dark.png) |

---

## Problem statement coverage

Each scene from the brief and where it lives in the app:

| Scene | Implemented as |
|---|---|
| **A new customer signs up** | `/signup` with a live password checklist (more than 8 chars, upper, lower, special), unique case-insensitive email, `/forgot-password` and `/reset-password` (hashed, single-use, 1 hour link). Roles: Admin, Staff, Customer; only an admin can add staff (**Staff** page). |
| **Launching a new plan** | **Products** (name, type, sales price, cost price, notes, tax, variants such as *Brand / Odoo / +560*) and **Plans** (daily, weekly, monthly, yearly, minimum quantity, availability dates, auto-close, early close, pause, renew toggles). |
| **Turning a quote into a subscription** | **Quotation templates** (plan, lines with variants, validity days) and **Subscriptions → From template**. Each subscription has a generated number, customer, plan, start and expiry dates, payment terms and lines with product, quantity, unit price, tax and amount, plus a **lifecycle stepper** (Draft, Quotation, Confirmed, Active, Closed) visible on every record. |
| **Billing day** | Billing also runs **automatically** on a schedule (`BILLING_SCHEDULE`, default 02:00 daily). **Invoices → Run billing** does the same on demand and shows the schedule and last run. It creates every due invoice from its subscription with customer, lines, taxes and totals pre-filled. Confirm, cancel, print and PDF on each invoice (Draft, Confirmed, Paid). **Send** emails the customer the invoice with the PDF attached. A unique `(subscriptionId, periodStart)` key guarantees nothing is billed twice. |
| **A customer asks for a better price** | **Discounts** (admin only): fixed or percentage, minimum purchase or quantity, start and end dates, usage limit, specific products or whole subscriptions. Applied automatically to the next invoice and stops when expired or used up. |
| **The money comes in** | **Record payment** on an invoice (method, amount, date, note) and the **Payments** page with date and customer filters. Dashboard tabs show paid, outstanding and overdue invoices, with days overdue. |
| **The finance lead, at month end** | **Finance dashboard**: active subscriptions, revenue, this month, outstanding, overdue, revenue by month, and a filterable invoice table. Every list is server-paginated; measured responses are in the 5 to 15 ms range with 5,000 subscriptions. |
| **Customers manage their own** | **Portal**: only their own subscriptions and invoices (other customers' records return 404), lifecycle view, invoice history and online payment. Customers can also **pause, resume, renew and cancel** their own subscriptions, limited by what the plan allows. |
| **Spotting renewals** | The dashboard has a **Renewals due** card (active subscriptions expiring in 30 days) linking to a filtered Subscriptions list, and customers see an expiry banner with a Renew button. |

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20+, Express, TypeScript (strict), Prisma ORM, **MySQL 8**, zod validation, JWT, bcrypt, pdfkit, Nodemailer |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Axios, lucide-react icons |
| Conventions | camelCase everywhere (Prisma = API JSON = TypeScript), `UPPER_SNAKE_CASE` enums, integer ids, money as `Decimal(12,2)` serialized as JSON numbers |

---

## Quick start

**Prerequisites:** Node.js 20+, a running MySQL 8 server.

```bash
# 1. clone
git clone https://github.com/Vasu-uu/brightloop-subscription-system.git
cd brightloop-subscription-system

# 2. backend
cd backend
cp .env.example .env          # then edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy     # creates all tables
npm run seed                  # 5,000 subscriptions, demo users, invoices, payments
npm run dev                   # http://localhost:4000

# 3. frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Open <http://localhost:5173> and sign in with a [dev login](#dev-logins).

> The seed script is deterministic and safe to re-run: it clears and recreates all data.

---

## Configuration

`backend/.env`

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@localhost:3306/brightloop` |
| `JWT_SECRET` | Signing key for access tokens | a long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `APP_URL` | Used in password-reset links | `http://localhost:5173` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outgoing email server (optional) | empty in development; port defaults to 587 |
| `MAIL_FROM` | Sender shown on emails | `Brightloop <no-reply@yourdomain.com>` |
| `BILLING_SCHEDULE` | Cron expression for automatic billing, server time. `off` disables it | `0 2 * * *` |
| `PORT` | API port | `4000` |

`frontend/.env`

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | API base URL | `http://localhost:4000/api/v1` |

Without `SMTP_HOST`, password-reset and invoice emails are printed to the backend console instead of sent. With it set, they are delivered through SMTP and invoice emails carry the PDF as an attachment. Only one billing run executes at a time, so a manual run during a scheduled one returns `409`.

---

## Dev logins

Created by the seed script (password for all: `Brightloop@123`).

| Role | Email | Lands on |
|---|---|---|
| Admin | `admin@brightloop.test` | `/app/dashboard` |
| Staff | `staff@brightloop.test` | `/app/dashboard` |
| Customer | `customer@brightloop.test` | `/portal/subscriptions` |

---

## How billing works

```
ACTIVE subscription ── nextBillingDate ≤ run date and ≤ expiryDate ──▶ create invoice for that period
        │                                                                     │
        │   one transaction: number lock → insert invoice+lines+discounts →   │
        │   advance nextBillingDate by one billing period                     │
        ▼                                                                     ▼
   repeats for every missed period                          unique (subscriptionId, periodStart)
                                                            ⇒ a second attempt is skipped, never duplicated
```

1. The scheduler (or `POST /billing/run`, or the **Run billing** button) calls `runBilling(asOf)`. Runs are exclusive; `GET /billing/status` reports the schedule and the last run.
2. Subscriptions whose plan has `autoClose` and whose `expiryDate` has passed are closed first.
3. Eligible subscription ids are snapshotted once, then processed in batches of 200 with plans, lines and products loaded once per batch.
4. Pricing and applicable discounts are computed **before** the transaction opens; the transaction only takes the numbering lock, inserts the invoice and advances `nextBillingDate`. Discount usage is incremented only for genuinely created invoices.
5. Running billing twice in a row creates **0** invoices the second time.

Measured against the 5,000-subscription seed: **3,368 invoices created in ~30 s**; the repeat run is instant.

---

## Business rules

- **Password:** more than 8 characters with an uppercase letter, a lowercase letter and a special character. Emails are unique and stored lowercase. Signup always creates a `CUSTOMER`; only an admin can create staff.
- **Access:** Admin does everything. Staff can read catalog data and work with templates, subscriptions, invoices, payments, customers and the dashboard, but cannot write products, plans, taxes, discounts or staff. Customers can only use `/portal` and their own data.
- **Line price:** `product.salesPrice + variant.extraPrice`. `Plan.price` is display-only and is never added to invoices.
- **Plan limits:** each line quantity ≥ `plan.minQuantity`; `startDate` must be inside the plan's availability window.
- **Status flow:** one step forward at a time; `CLOSED` is reachable early from any other state only if `plan.allowEarlyClose`. Pause needs `allowPause` and `ACTIVE`; renew needs `allowRenew` and moves `expiryDate` forward one billing period. Moving to `ACTIVE` sets `nextBillingDate = startDate`.
- **Invoice:** new invoices are `DRAFT`; `confirm` → `CONFIRMED`; `cancel` only while nothing is paid; `PAID` is set only by recording a payment that clears the balance.
- **Discounts:** eligible when active, within dates, and under the usage limit; `PRODUCT` discounts use only matching lines, `SUBSCRIPTION` discounts use the whole subtotal (optionally limited to listed subscriptions); minimum quantity / purchase are checked against the eligible lines; `FIXED` is capped at the eligible subtotal.
- **Payments:** only `CONFIRMED` invoices, amount > 0 and ≤ balance, under a row lock.

---

## API reference

Base path `/api/v1`. Auth: `Authorization: Bearer <token>`.
Success: `{ "data": … }` (lists add `"meta": { page, pageSize, total, totalPages }`).
Error: `{ "error": { "code", "message", "fields"? } }` with codes `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409.
Every list accepts `page`, `pageSize` (max 100), `search`, `sort`, `order`, plus `status`, `customerId`, `from`, `to` where relevant.

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/signup`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`; `GET /auth/me` | public / any user |
| Staff | `GET, POST /staff` | Admin |
| Customers | `GET /customers` | Admin, Staff |
| Products | `GET, POST, PUT, DELETE /products[/:id]`; `POST, PUT, DELETE /products/:id/variants[/:vid]` | read Admin+Staff, write Admin |
| Plans / Taxes / Discounts | `GET, POST, PUT, DELETE /plans`, `/taxes`, `/discounts` (+ `/:id`) | read Admin+Staff, write Admin |
| Quotation templates | `GET, POST, PUT, DELETE /quotation-templates[/:id]` | Admin, Staff |
| Subscriptions | `GET, POST /subscriptions` (filters: `status`, `customerId`, `search`, `expiringInDays`); `GET, PUT /subscriptions/:id`; `POST /subscriptions/from-template` | Admin, Staff |
| Subscription actions | `POST /subscriptions/:id/transition` `{to}`, `/pause`, `/resume`, `/renew` | Admin, Staff |
| Invoices | `GET /invoices`; `GET /invoices/:id`; `POST /invoices/:id/confirm`, `/cancel`, `/send`; `GET /invoices/:id/pdf`; `GET /invoices/:id/payments` | Admin, Staff |
| Billing | `POST /billing/run` `{asOfDate?}` → `{ created, skipped, invoiceIds }` (409 if a run is in progress); `GET /billing/status` → `{ enabled, schedule, running, lastRun }` | Admin, Staff |
| Payments | `POST /payments`, `GET /payments` | Admin, Staff |
| Portal | `GET /portal/subscriptions[/:id]`, `GET /portal/invoices[/:id]`, `POST /portal/invoices/:id/pay` `{method}`, `POST /portal/subscriptions/:id/(pause\|resume\|renew\|close)` (plan rules apply) | Customer (own records only) |
| Dashboard | `GET /dashboard/summary`, `/dashboard/revenue-by-month`, `/dashboard/invoices?payment=paid\|outstanding\|overdue` | Admin, Staff |

Example:

```bash
TOKEN=$(curl -s -X POST localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@brightloop.test","password":"Brightloop@123"}' | jq -r .data.token)

curl -s -X POST localhost:4000/api/v1/billing/run \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
# {"data":{"created":3368,"skipped":0,"invoiceIds":[…]}}
```

---

## Architecture

![System architecture](docs/diagrams/architecture.png)

<sub>Diagram source: [`docs/diagrams/architecture.mmd`](docs/diagrams/architecture.mmd)</sub>

Design choices worth knowing:

- **Vertical slices.** Each feature is one folder (`routes`, `controller`, `service`, `validation`), so a change stays local.
- **One contract.** Prisma field names equal API JSON names equal TypeScript and React props. No mapping layers.
- **Money is exact.** `Decimal(12,2)` in the database, converted to JSON numbers at the response boundary.
- **Transactions stay small.** Pricing and discount lookups happen before a transaction opens; the transaction only takes the numbering lock, inserts and advances the billing date.

### Subscription lifecycle

![Subscription lifecycle](docs/diagrams/subscription-lifecycle.png)

<sub>Diagram source: [`docs/diagrams/subscription-lifecycle.mmd`](docs/diagrams/subscription-lifecycle.mmd)</sub>

### Invoice lifecycle

![Invoice lifecycle](docs/diagrams/invoice-lifecycle.png)

<sub>Diagram source: [`docs/diagrams/invoice-lifecycle.mmd`](docs/diagrams/invoice-lifecycle.mmd)</sub>

### A billing run, step by step

![Billing run sequence](docs/diagrams/billing-sequence.png)

<sub>Diagram source: [`docs/diagrams/billing-sequence.mmd`](docs/diagrams/billing-sequence.mmd)</sub>

### Who can do what

| Capability | Admin | Staff | Customer |
|---|:-:|:-:|:-:|
| Read products, plans, taxes, discounts | yes | yes | no |
| Create / edit / delete catalog data | yes | no | no |
| Add staff members | yes | no | no |
| Templates, subscriptions, invoices, billing, payments, dashboard | yes | yes | no |
| Own subscriptions and invoices, pay online | no | no | yes |

---

## Project structure

```
backend/
  prisma/
    schema.prisma            # data model (MySQL)
    migrations/              # SQL migrations
    seed.ts                  # deterministic demo data (5,000 subscriptions)
  src/
    app.ts, server.ts        # Express app and entrypoint
    modules/                 # one folder per feature: routes, controller, service, validation
      auth/ staff/ customers/ products/ plans/ taxes/ discounts/
      quotation-templates/ subscriptions/ invoices/ billing/
      payments/ portal/ dashboard/
    services/
      pricing.service.ts     # line totals, discount eligibility, usage tracking
      invoice.service.ts     # invoice creation and the billing run
      payment.service.ts     # transactional, row-locked payment recording
    shared/                  # auth middleware, errors, pagination, response helpers
frontend/
  src/
    api/                     # typed API client per module
    components/ui/           # Button, Input, Select, Modal, DataTable, StatusBadge, Toast, ...
    hooks/                   # useAuth, useTheme
    pages/                   # auth, dashboard, templates, subscriptions, invoices, payments, portal
    types/, constants/       # models and enums mirroring the Prisma schema
docs/screenshots/            # images used in this README
```

---

## Data model

15 tables. The diagram below is also stored as [`docs/schema.mmd`](docs/schema.mmd) (Mermaid source) and [`docs/schema.png`](docs/schema.png) (rendered image); the source of truth is [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

![Entity relationships](docs/diagrams/er-relationships.png)

<sub>Diagram source: [`docs/diagrams/er-relationships.mmd`](docs/diagrams/er-relationships.mmd)</sub>

Full column-level diagram:

![Database schema](docs/schema.png)

| Group | Tables |
|---|---|
| Identity | `User`, `PasswordResetToken` |
| Catalog | `Tax`, `Product`, `ProductVariant`, `Plan`, `Discount` |
| Sales | `QuotationTemplate`, `QuotationTemplateLine`, `Subscription`, `SubscriptionLine` |
| Billing | `Invoice`, `InvoiceLine`, `InvoiceDiscount`, `Payment` |

Key constraints and indexes:

- `Invoice (subscriptionId, periodStart)` is **unique**, which is what makes billing idempotent.
- `Subscription.number` and `Invoice.number` are unique, zero-padded and sequential (`SUB-00001`, `INV-00001`).
- `SubscriptionLine.unitPrice` and `taxPercent` are **snapshots**, so changing a product's price later never rewrites existing subscriptions or past invoices.
- `Subscription` is indexed on `status`, `customerId` and `nextBillingDate`; `Invoice` on `(status, dueDate)` and `customerId`; `Payment` on `invoiceId` and `paymentDate`.
- Subscription and Discount targeting is many-to-many; an empty list means the discount applies to all subscriptions.
- Line and discount rows cascade-delete with their parent subscription, template or invoice.

---

## Performance

With 5,000 subscriptions and 5,000+ invoices seeded, list and dashboard endpoints respond in roughly 5–15 ms. Dashboard numbers use SQL aggregates (never row loops), every list is paginated on the server, and the billing run processes thousands of invoices in tens of seconds.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `EADDRINUSE: :::4000` | Another backend instance is still running. Stop it (e.g. `Get-NetTCPConnection -LocalPort 4000` on Windows) and restart. |
| Tailwind classes such as `bg-brand-600` have no effect | Stale Vite cache after a `tailwind.config.js` change. Stop Vite, delete `frontend/node_modules/.vite`, start again. |
| `Transaction already closed … timeout was 5000 ms` | Don't call the plain `prisma` client from inside a `prisma.$transaction` callback; compute first, then open the transaction. |
| Dashboard or payments return 500 with SQL syntax errors | The SQL is written for MySQL (unquoted identifiers, `DATE_FORMAT`); it will not run on PostgreSQL. |
| Seed fails with duplicate or foreign-key errors | Re-run `npm run seed`; it clears and recreates everything. |

---

## Scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | API with auto-reload |
| backend | `npm run typecheck` | strict TypeScript check |
| backend | `npm run build` / `npm start` | compile and run |
| backend | `npm run seed` | reset and seed demo data |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run typecheck` | strict TypeScript check |
| frontend | `npm run build` | production bundle |
