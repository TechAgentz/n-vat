# N-VAT — VAT / Damage Invoice Management

Production-ready Next.js 15 (App Router) + TypeScript application for managing VAT sales invoices and converting selected VAT invoices into **N-VAT / Damage** post-invoice adjustment transactions.

> "N-VAT" in this system is **not** a separate non-VAT company. It represents a post-invoice damage/adjustment transaction for products that were originally invoiced with VAT. The original VAT invoice is preserved forever for audit; conversion writes an additive `InvoiceConversion` record and stock movements.

## Tech stack

- Next.js 15 (App Router, React 19, Server Actions)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui-style primitives (Radix)
- PostgreSQL + Prisma ORM
- NextAuth v5 (credentials, JWT sessions)
- React Hook Form + Zod
- Sonner (toasts), Lucide (icons)

## Feature coverage

| # | Requirement | Location |
|---|---|---|
| 1 | Project structure | `src/app`, `src/components`, `src/server`, `src/lib`, `prisma` |
| 2 | Database schema | `prisma/schema.prisma` |
| 3 | Migrations | `npm run db:migrate` |
| 4 | Authentication | `src/lib/auth.ts`, `src/app/login/*`, `src/middleware.ts` |
| 5 | RBAC | `src/lib/rbac.ts` (ADMIN / MANAGER / USER / AUDITOR + `canConvert` flag) |
| 6 | Invoice CRUD | `src/server/invoices.ts` |
| 7 | Invoice selection | `src/app/(app)/invoices/invoice-list-client.tsx` |
| 8 | Four-key shortcut | `src/hooks/use-shortcut.ts` (Ctrl + Alt + Shift + N by default) |
| 9 | Conversion modal | `src/app/(app)/invoices/conversion-dialog.tsx` |
| 10 | Mandatory manual remark | Zod schema `remarkSchema` (`src/lib/validation.ts`); Convert button disabled until valid |
| 11 | VAT → N-VAT / Damage conversion | `convertInvoicesToNvat` in `src/server/invoices.ts` (atomic, optimistic-locked, serializable txn) |
| 12 | Stock transaction logic | Every invoice + conversion writes `StockTransaction` (`SALE` / `DAMAGE` / `N_VAT_ADJUSTMENT`) |
| 13 | Audit logging | `src/lib/audit.ts` + `AuditLog` table; written inside the same transaction |
| 14 | Reports | `src/app/(app)/reports/**` |
| 15 | Dashboard | `src/app/(app)/dashboard/page.tsx` |
| 16 | Error handling | `src/app/(app)/error.tsx`, translated conversion errors |
| 17 | Loading states | `src/app/(app)/loading.tsx`, `useTransition` in dialog |
| 18 | Responsive desktop-first UI | Tailwind + `md:` breakpoints |
| 19 | Seed data | `prisma/seed.ts` |
| 20 | README | this file |

## Quick start

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

- `DATABASE_URL` must point at a running PostgreSQL 13+.
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.

### 3. Provision the database

```bash
npm run db:migrate   # creates tables via Prisma migrate
npm run db:seed      # seeds company, users, customers, products, sample invoices
```

Seeded logins (change immediately in real deployment):

| Email | Password | Role |
|---|---|---|
| admin@nvat.local | Admin@12345 | ADMIN |
| manager@nvat.local | Manager@12345 | MANAGER |
| user@nvat.local | User@12345 | USER (`canConvert = true`) |
| auditor@nvat.local | Auditor@12345 | AUDITOR |

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, sign in, land on `/dashboard`.

## Using the conversion flow

1. Go to **Invoices**.
2. Filter (invoice #, customer, date range, status, type, sort).
3. Tick the checkbox on one or more **VAT / ISSUED** invoices. Ineligible rows are disabled.
4. Press **Ctrl + Alt + Shift + N** — or click **Convert to N-VAT / Damage**.
5. Enter a **mandatory manual remark** (5–500 chars; whitespace-only rejected).
6. Click **Convert**.

The conversion:

- Runs per-invoice inside a `SERIALIZABLE` Prisma transaction.
- Uses optimistic locking (`Invoice.version`) to reject concurrent modifications with the exact error `"Another user has already modified this invoice."`
- Never deletes the invoice. Sets its status to `CONVERTED` and its `modifiedById`.
- Creates an `InvoiceConversion` row with a full snapshot of affected items, original VAT/total, remark, and both statuses.
- Emits `StockTransaction`s of type `DAMAGE` or `N_VAT_ADJUSTMENT`, tied to the invoice and conversion.
- Writes an `AuditLog` in the same transaction.

If any step fails, the entire transaction rolls back — no partial state.

## Keyboard shortcut

- Default: **Ctrl + Alt + Shift + N** (four keys pressed simultaneously).
- Configurable per browser at **Settings → Keyboard shortcut** (persisted in `localStorage`).
- Implementation (`src/hooks/use-shortcut.ts`):
  - Registered with `{ capture: true }` so it fires before other listeners.
  - `event.preventDefault()` + `event.stopPropagation()` swallow the browser default.
  - `event.repeat` is checked so held keys never re-trigger.
  - Ignored while focus is inside `<input>` / `<textarea>` / contentEditable (opt-out with `allowInInputs`).
  - Reads the required modifier state directly from the event — the four modifiers must all be down at once.

The shortcut label is shown on the dashboard, in the sidebar footer, in the top bar, and on the invoice list heading.

## Business rules preserved

- Original VAT invoice is **never** hard-deleted or overwritten.
- The remark is **mandatory** at both the client (React Hook Form + Zod `remarkSchema`) and the server (`convertInvoicesSchema.parse`).
- Stock is centralized on `Product.stockQty`; every change is auditable via `StockTransaction`.
- Negative stock is prevented at `createInvoice` (`STOCK_NEGATIVE` rollback).
- Concurrent conversion attempts on the same invoice are rejected — only the first commit wins.

## Directory map

```
src/
  app/
    login/                      # Sign-in page + client form
    (app)/                      # Authenticated shell (sidebar + topbar)
      dashboard/                # KPIs, recent invoices, recent conversions, low stock
      invoices/                 # List, detail, conversion modal, shortcut wiring
      stock/                    # Availability + movements
      reports/                  # Daily sales, VAT sales, N-VAT/damage, stock, movements, purchases, expenses, conversions
      audit/                    # Audit log (ADMIN / AUDITOR)
      users/                    # User admin (ADMIN)
      settings/                 # Shortcut configuration
    api/auth/[...nextauth]/     # NextAuth handlers
  components/
    ui/                         # Button, Input, Dialog, Checkbox, Table, Badge, Select, Card, Textarea, Label, Toaster
    shell/                      # Sidebar, Topbar
  hooks/
    use-shortcut.ts             # Global four-key shortcut hook + persistence
  lib/
    prisma.ts                   # Prisma singleton
    auth.ts                     # NextAuth v5 configuration + requireUser()
    rbac.ts                     # Permission matrix + assert()
    audit.ts                    # writeAudit()
    validation.ts               # Zod schemas (remark, filters, invoice, conversion)
    utils.ts                    # cn(), formatters
  server/
    invoices.ts                 # listInvoices, getInvoice, createInvoice, convertInvoicesToNvat
    stock.ts                    # listStock, listStockMovements
    reports.ts                  # dashboardMetrics, conversionReport, dailySalesReport
    audit.ts                    # listAuditLogs
  middleware.ts                 # Route protection
  types/next-auth.d.ts          # Session/JWT augmentation
prisma/
  schema.prisma                 # All 11+ models
  seed.ts                       # Idempotent seed
```

## Security

- Every server action calls `requireUser()` and `assert(user, Permission)` — permissions are enforced on the server, never trusted from the client.
- Passwords hashed with `bcrypt`, cost 10.
- Sessions are JWT-based via NextAuth v5.
- CSRF: NextAuth built-in for its endpoints; server actions are protected by Next.js's server-action origin check.
- All conversion, invoice creation, and audit writes are inside a single database transaction.

## Extending

- Add a **new report**: add a route under `src/app/(app)/reports/<slug>/page.tsx`, add a query to `src/server/reports.ts`, guard with `assert(user, "REPORT_VIEW")`.
- Add a **new permission**: add a key in `Permissions` in `src/lib/rbac.ts`, then `assert(user, "YOUR_PERM")` in any server action.
- Add a **new conversion type**: extend the `ConversionType` enum in `prisma/schema.prisma`, migrate, and expose it in the modal's confirmation payload.

## Notes and known limitations

- Purchases and Expenses reports are placeholders; the schema supports adding a full purchase/expense flow without touching the conversion pipeline.
- The invoice-creation UI is not part of this deliverable; the server action `createInvoice` is fully implemented and used by the seed. Wire a form under `src/app/(app)/invoices/new` when needed.
- Multi-tenant isolation: every query is scoped by `companyId` from the session. Do not remove those `where` clauses when extending.
