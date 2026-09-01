# LenDen Architecture

## Apps

LenDen will have three main parts:

- React Native mobile app for admin use on phone
- Next.js web app for admin use in browser
- Express TypeScript backend shared by both clients

## Backend Flow

```text
React Native / Next.js
        |
        | HTTP JSON API
        v
Express TypeScript API
        |
        | Prisma ORM
        v
PostgreSQL

Express API
        |
        | session lookup
        v
Redis
```

## Backend Modules

- `auth` handles first admin setup, login, logout, and current admin profile.
- `borrowers` stores borrower profile data and returns borrower summaries/details.
- `loans` stores every amount given by the admin to a borrower.
- `payments` stores every amount returned by a borrower.

## Data Model

```text
Admin
  has many Borrowers
  has many Loans
  has many Payments

Borrower
  belongs to Admin
  has many Loans
  has many Payments

Loan
  belongs to Admin
  belongs to Borrower

Payment
  belongs to Admin
  belongs to Borrower
```

## Authentication

There is no public registration. The first admin can be created once with `/api/auth/admin/setup` or by running the seed command.

After login:

- Backend creates a Redis session.
- Backend signs a JWT containing the admin id and session id.
- Web clients can use the HTTP-only cookie.
- Mobile clients can store and send the returned token as `Authorization: Bearer <token>`.

## Borrower Detail Calculation

Borrower detail API returns:

- all borrower profile fields
- all money-given records
- all money-returned records
- total given
- total paid
- outstanding principal

```text
outstanding principal = sum(loans.amount) - sum(payments.amount)
```

Monthly percentage is stored now. Interest calculation should be added after deciding whether interest is simple monthly, date-based per loan, or calculated only during final settlement.
