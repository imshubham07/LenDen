# LenDen Backend

Express + TypeScript API for the LenDen loan ledger app. It supports an user account workflow for managing borrowers, loans, repayments, and outstanding principal balances.

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- JWT authentication
- Zod validation

## Prerequisites

Install these before starting the backend:

- Node.js 20 or newer
- npm
- PostgreSQL
- Redis

## Start PostgreSQL And Redis With Docker

Pull the required images:

```bash
docker pull postgres:16-alpine
docker pull redis:7-alpine
```

Create a Docker network:

```bash
docker network create lenden-network
```

Run PostgreSQL locally with a named volume:

```bash
docker run -d \
  --name lenden-postgres \
  --network lenden-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lenden \
  -p 5432:5432 \
  -v lenden-postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

Run Redis locally with a named volume:

```bash
docker run -d \
  --name lenden-redis \
  --network lenden-network \
  -p 6379:6379 \
  -v lenden-redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

Check that both containers are running:

```bash
docker ps
```

If you need to stop them:

```bash
docker stop lenden-postgres lenden-redis
```

Start them again later:

```bash
docker start lenden-postgres lenden-redis
```

## Getting Started

Open the backend folder:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Update `.env` with your local values:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lenden?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-this-to-a-long-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:8081"
```

Start PostgreSQL and Redis, then run the database migration:

```bash
npm run prisma:migrate
```

Sign up in the mobile app to create an account. Seeding is optional and requires explicit credentials:

```bash
USER_NAME="Your Name" USER_MOBILE="9876543210" USER_PASSWORD="your-password" npm run seed
```

Start the development server:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:4000
```

Health check:

```text
GET /health
```

## Scripts

```bash
npm run dev              # Start the API in watch mode
npm run build            # Compile TypeScript into dist/
npm run start            # Run the compiled API
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:studio    # Open Prisma Studio
npm run seed             # Create or update an optional user account
```

## API Routes

### Auth

- `POST /api/auth/signup` - create a user account and sign in
- `POST /api/auth/login` - log in with mobile and password
- `POST /api/auth/logout` - log out the current user session
- `GET /api/auth/me` - get the logged-in user profile

### Borrowers

- `GET /api/borrowers` - list borrowers with summary amounts
- `POST /api/borrowers` - create a borrower
- `GET /api/borrowers/:id` - get borrower details, loans, payments, and totals
- `PATCH /api/borrowers/:id` - update a borrower

Borrower body:

```json
{
  "name": "Borrower Name",
  "fatherOrHusband": "Father or Husband Name",
  "documentNote": "Offline document details",
  "village": "Village Name",
  "mobile": "9999999999",
  "monthlyPercentage": 3
}
```

### Loans

- `POST /api/loans` - record money given to a borrower

Loan body:

```json
{
  "borrowerId": "borrower-id",
  "amount": 10000,
  "purpose": "Business",
  "givenDate": "2026-09-03",
  "guarantor": "Guarantor Name"
}
```

### Payments

- `POST /api/payments` - record money returned by a borrower

Payment body:

```json
{
  "borrowerId": "borrower-id",
  "amount": 2500,
  "paymentDate": "2026-09-03",
  "note": "Cash payment"
}
```

## Authentication

Protected routes require a valid user session. Login returns a JWT token in the response and also stores it in an HTTP-only `token` cookie.

For mobile clients, send the token in the authorization header:

```text
Authorization: Bearer <token>
```

## Amount Calculation

The backend currently calculates principal only:

```text
outstandingPrincipal = totalGiven - totalPaid
```

`monthlyPercentage` is stored on each borrower so interest calculation can be added when the business rule is finalized.

## Testing With Postman

Postman docs are available in:

```text
POSTMAN_TESTING.md
```

The collection file is:

```text
LenDen.postman_collection.json
```
