# Password recovery and privacy policy

LenDen is free to use. Recovery uses a 128-bit random recovery code, so no SMS provider is required.

## User flow

1. While signed in, open Profile → Recovery Code.
2. Confirm the current password and generate a code. Save it outside LenDen; generating another replaces the old code.
3. On the login screen choose Forgot password, then enter the registered mobile number, saved code, and new password.
4. Log in again and generate a new recovery code. The previous code and all previous login tokens no longer work.

Users who never generated a code cannot recover solely by knowing a mobile number. The app directs them to support, which must verify ownership before making account changes. No automated support reset is implemented.

## Backend rollout

Run from `Backend` with the correct database configuration:

```sh
npx prisma migrate deploy
npm run prisma:generate
npm run build
```

Restart the backend after deployment. The additive migration creates nullable `Admin.recoveryCodeHash`. Existing accounts remain intact. Existing login tokens from before this release must log in again because tokens now carry a password-version signature.

Run `npm test` for recovery and authentication regression coverage. Tests use mocked database/Redis services; they do not establish that a deployed database has been migrated.

## Policy

The in-app `/privacy-policy` route is accessible from login and Profile, without signing in. It describes the free app, account and ledger data, local notes, feedback, recovery codes, retention, and the support email.

Before a store release, host the policy at a public URL and confirm it matches the actual operator, hosting providers, retention practices, and support process. A support email request is not a complete self-service account-deletion feature.

References used in review:
- https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- https://support.google.com/googleplay/android-developer/answer/10144311
