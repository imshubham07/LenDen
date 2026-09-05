# LenDen Architecture

## Apps

LenDen will have three main parts:

- React Native mobile app for user use on phone
- Next.js web app for user use in browser
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

- `auth` handles user signup, login, logout, and current user profile.
- `borrowers` stores borrower profile data and returns borrower summaries/details.
- `loans` stores every amount given by the user to a borrower.
- `payments` stores every amount returned by a borrower.

## Data Model

```text
User
  has many Borrowers
  has many Loans
  has many Payments

Borrower
  belongs to User
  has many Loans
  has many Payments

Loan
  belongs to User
  belongs to Borrower

Payment
  belongs to User
  belongs to Borrower
```

## Authentication

Public registration is available through `/api/auth/signup`. Each user has the same ledger features and can access only their own borrowers, loans, and payments. Prisma maps the User model and userId fields onto the existing Admin table and adminId columns to preserve existing data.

After login:

- Backend creates a Redis session.
- Backend signs a JWT containing the user id and session id.
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
