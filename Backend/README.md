# LenDen Backend

Express + TypeScript backend for the LenDen loan ledger app. The first version supports one admin login, borrower profiles, money given by the admin, and money returned by borrowers.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- Redis for admin sessions
- JWT stored in an HTTP-only cookie and also returned for mobile clients
- Zod for request validation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis locally, then update `DATABASE_URL` and `REDIS_URL` in `.env`.

4. Run Prisma migration:

```bash
npm run prisma:migrate
```

This project currently uses Prisma 6, so `DATABASE_URL` is read from `.env` in `prisma/schema.prisma`.

5. Create the first admin in one of two ways:

```bash
npm run seed
```

or call:

```http
POST /api/auth/admin/setup
```

6. Start the API:

```bash
npm run dev
```

## Main API

### Auth

- `POST /api/auth/admin/setup` - create the first admin only
- `POST /api/auth/admin/login` - login with mobile and password
- `POST /api/auth/admin/logout` - logout current admin session
- `GET /api/auth/admin/me` - get current admin profile

### Borrowers

- `GET /api/borrowers` - list borrower names and summary amounts
- `POST /api/borrowers` - create borrower profile
- `GET /api/borrowers/:id` - get full borrower details, loans, payments, and totals
- `PATCH /api/borrowers/:id` - update borrower profile

Borrower fields:

- `name`
- `fatherOrHusband`
- `documentNote` optional text only, because hard copy documents are stored offline
- `village`
- `mobile`
- `monthlyPercentage`

### Loans

- `POST /api/loans` - add money given by admin to a borrower

Loan fields:

- `borrowerId`
- `amount`
- `purpose`
- `givenDate`
- `guarantor` optional text

### Payments

- `POST /api/payments` - add money returned by a borrower

Payment fields:

- `borrowerId`
- `amount`
- `paymentDate`
- `note` optional text

## Amount Calculation

For now the backend calculates principal only:

```text
outstandingPrincipal = total amount given by admin - total amount paid by borrower
```

Monthly percentage is stored on the borrower profile so interest calculations can be added once the exact business rule is confirmed.
