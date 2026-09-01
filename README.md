# LenDen

LenDen is a full-stack loan ledger app for managing borrowers, money given, repayments, and outstanding balances.

The app is designed for an admin-only workflow. There is no public registration for now. The admin can log in, create borrower profiles, add money given to borrowers, record money returned by borrowers, and view borrower details with balance summaries.

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

- Admin setup
- Admin login and logout
- Redis-backed admin sessions
- Borrower create, list, detail, and update
- Unique borrower mobile number per admin
- Add money given by admin
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

Create the first admin:

```bash
npm run seed
```

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
outstandingPrincipal = total amount given by admin - total amount paid by borrower
```

Monthly percentage is stored on each borrower profile. Interest calculation will be added after the exact business rule is finalized.
