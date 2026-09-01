# Postman Testing Guide

Use this guide to test the LenDen backend from the Postman app.

## Base URL

```text
http://localhost:4000
```

Create one Postman variable:

```text
baseUrl = http://localhost:4000
```

After login, also create:

```text
token = your-login-token
borrowerId = created-borrower-id
```

For protected APIs, add this header:

```http
Authorization: Bearer {{token}}
```

Also add this header for JSON requests:

```http
Content-Type: application/json
```

## 1. Health Check

Use this first to confirm the backend is running.

```http
GET {{baseUrl}}/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## 2. Create First Admin

Use this only once. There is no public registration after the first admin exists.

```http
POST {{baseUrl}}/api/auth/admin/setup
```

Body:

```json
{
  "name": "Admin",
  "mobile": "8541064068",
  "password": "admin12345"
}
```

Expected response:

```json
{
  "admin": {
    "id": "admin-id",
    "name": "Admin",
    "mobile": "8541064068",
    "createdAt": "date"
  }
}
```

If you already created admin using `npm run seed`, this API returns:

```json
{
  "message": "Admin already exists"
}
```

That is okay.

## 3. Admin Login

```http
POST {{baseUrl}}/api/auth/admin/login
```

Body:

```json
{
  "mobile": "8541064068",
  "password": "admin12345"
}
```

Expected response:

```json
{
  "token": "jwt-token",
  "admin": {
    "id": "admin-id",
    "name": "Admin",
    "mobile": "8541064068"
  }
}
```

Copy the `token` value and save it in Postman variable:

```text
token = jwt-token
```

## 4. Current Admin Profile

```http
GET {{baseUrl}}/api/auth/admin/me
```

Headers:

```http
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "admin": {
    "id": "admin-id",
    "name": "Admin",
    "mobile": "8541064068"
  }
}
```

## 5. Create Borrower

```http
POST {{baseUrl}}/api/borrowers
```

Headers:

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body:

```json
{
  "name": "Ramesh Kumar",
  "fatherOrHusband": "Suresh Kumar",
  "documentNote": "Aadhaar hard copy submitted",
  "village": "Rampur",
  "mobile": "9876543210",
  "monthlyPercentage": 3
}
```

Expected response:

```json
{
  "borrower": {
    "id": "borrower-id",
    "name": "Ramesh Kumar",
    "fatherOrHusband": "Suresh Kumar",
    "documentNote": "Aadhaar hard copy submitted",
    "village": "Rampur",
    "mobile": "9876543210",
    "monthlyPercentage": "3",
    "adminId": "admin-id",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

Copy the borrower `id` and save it in Postman variable:

```text
borrowerId = borrower-id
```

## 6. List Borrowers

This shows borrower names and summary amounts.

```http
GET {{baseUrl}}/api/borrowers
```

Headers:

```http
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "borrowers": [
    {
      "id": "borrower-id",
      "name": "Ramesh Kumar",
      "fatherOrHusband": "Suresh Kumar",
      "village": "Rampur",
      "mobile": "9876543210",
      "monthlyPercentage": 3,
      "totalGiven": 0,
      "totalPaid": 0,
      "outstandingPrincipal": 0,
      "createdAt": "date"
    }
  ]
}
```

## 7. Add Money Given By Admin

```http
POST {{baseUrl}}/api/loans
```

Headers:

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body:

```json
{
  "borrowerId": "{{borrowerId}}",
  "amount": 50000,
  "purpose": "Business investment",
  "givenDate": "2026-09-01",
  "guarantor": "Mahesh Kumar"
}
```

Expected response:

```json
{
  "loan": {
    "id": "loan-id",
    "adminId": "admin-id",
    "borrowerId": "borrower-id",
    "amount": "50000",
    "purpose": "Business investment",
    "givenDate": "2026-09-01T00:00:00.000Z",
    "guarantor": "Mahesh Kumar",
    "status": "ACTIVE",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

## 8. Add Money Returned By Borrower

```http
POST {{baseUrl}}/api/payments
```

Headers:

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body:

```json
{
  "borrowerId": "{{borrowerId}}",
  "amount": 10000,
  "paymentDate": "2026-09-10",
  "note": "First payment"
}
```

Expected response:

```json
{
  "payment": {
    "id": "payment-id",
    "adminId": "admin-id",
    "borrowerId": "borrower-id",
    "amount": "10000",
    "paymentDate": "2026-09-10T00:00:00.000Z",
    "note": "First payment",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

## 9. Borrower Full Detail

This is the API you will call when clicking a borrower name in admin page.

```http
GET {{baseUrl}}/api/borrowers/{{borrowerId}}
```

Headers:

```http
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "borrower": {
    "id": "borrower-id",
    "name": "Ramesh Kumar",
    "fatherOrHusband": "Suresh Kumar",
    "documentNote": "Aadhaar hard copy submitted",
    "village": "Rampur",
    "mobile": "9876543210",
    "monthlyPercentage": "3",
    "loans": [
      {
        "amount": "50000",
        "purpose": "Business investment"
      }
    ],
    "payments": [
      {
        "amount": "10000",
        "note": "First payment"
      }
    ]
  },
  "summary": {
    "totalGiven": 50000,
    "totalPaid": 10000,
    "outstandingPrincipal": 40000
  }
}
```

## 10. Update Borrower

```http
PATCH {{baseUrl}}/api/borrowers/{{borrowerId}}
```

Headers:

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body:

```json
{
  "village": "New Rampur",
  "monthlyPercentage": 2.5
}
```

Expected response:

```json
{
  "borrower": {
    "id": "borrower-id",
    "village": "New Rampur",
    "monthlyPercentage": "2.5"
  }
}
```

## 11. Logout

```http
POST {{baseUrl}}/api/auth/admin/logout
```

Headers:

```http
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "message": "Logged out"
}
```

After logout, protected APIs should return:

```json
{
  "message": "Session expired"
}
```

## Testing Order

Follow this order:

```text
Health Check
Create First Admin or npm run seed
Admin Login
Current Admin Profile
Create Borrower
List Borrowers
Add Money Given By Admin
Add Money Returned By Borrower
Borrower Full Detail
Update Borrower
Logout
```
