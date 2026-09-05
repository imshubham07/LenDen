# LenDen

LenDen is a full-stack loan ledger app for managing borrowers, money given, repayments, and outstanding balances.

The app is designed for an user account workflow. Anyone can sign up with their name, mobile number, and password. Each account owns its own ledger. The user can log in, create borrower profiles, add money given to borrowers, record money returned by borrowers, and view borrower details with balance summaries.

## Tech Stack

- Backend: Express, TypeScript, Prisma ORM
- Database: PostgreSQL
- Sessions: Redis
- Mobile App: Expo React Native
- Web App: Next.js planned

## Project Structure

```text
LenDen/
  Backend/      Express TypeScript API
  Mobile_App/   Expo React Native app
  Web/          Next.js web app folder
```

## Current Features

- User setup
- User login and logout
- Redis-backed user sessions
- Borrower create, list, detail, and update
- Unique borrower mobile number per user
- Add money given by user
- Add money returned by borrower
- Outstanding principal calculation
- Postman testing guide

## Backend Setup

Go to the backend folder:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Use these local service URLs:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lenden?schema=public"
REDIS_URL="redis://localhost:6379"
```

Run Prisma migration:

```bash
npm run prisma:migrate
```

Create an account using Sign up in the mobile app; no seed account is required.

Start the backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:4000
```

## Docker Services

PostgreSQL can run with Docker:

```bash
docker run -d \
  --name lenden-postgres \
  --network lenden-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lenden \
  -p 5432:5432 \
  -v lenden-postgres-data:/var/lib/postgresql/data \
  postgres:16
```

Redis can use local Redis on:

```text
redis://localhost:6379
```

Or Docker Redis on another port if local Redis already uses `6379`.

## Mobile App Setup

Go to the mobile app folder:

```bash
cd Mobile_App
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on web:

```bash
npm run web
```

## API Testing

Backend API testing docs are available in:

```text
Backend/POSTMAN_TESTING.md
```

The Postman collection export is ignored by Git because it is a local testing artifact.

## Amount Calculation

Current calculation:

```text
outstandingPrincipal = total amount given by user - total amount paid by borrower
```

Monthly percentage is stored on each borrower profile. Interest calculation will be added after the exact business rule is finalized.

## User authentication update

Use `POST /api/auth/signup` with `{ name, mobile, password }`, or `POST /api/auth/login` with `{ mobile, password }`. Both return `{ token, user }`. Send the token as `Authorization: Bearer <token>` for ledger requests, `GET /api/auth/me`, and `POST /api/auth/logout`.

Existing accounts and ledger records are preserved through Prisma table/column mappings; no database migration is needed. Run `npm run prisma:generate` and restart the backend after updating. Previous sessions require signing in again. The old admin auth endpoints have been removed.

The mobile startup no longer mounts the Expo logo overlay. The native LenDen splash stays visible until onboarding storage has loaded and the first screen has laid out. Verify native splash appearance in a release build, since Expo Go has its own launch UI.
