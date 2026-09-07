# LenDen

A loan ledger app for keeping track of borrowers, money lent, repayments, and outstanding balances. Each user has their own account and ledger.

[Download Android APK](https://github.com/imshubham07/LenDen/releases/download/v1.0.0/LenDen-v1.0.0.apk) · [Report a bug](https://github.com/imshubham07/LenDen/issues) · [Contribute](#contributing)

## Features

- Sign up with your name, mobile number, and password.
- Sign in securely with account-specific ledgers and Redis-backed sessions.
- Recover your account using a recovery code.
- Create and update borrower profiles, with unique mobile numbers within your account.
- Record money lent and repayments, and view transaction details.
- See borrower summaries and outstanding principal balances.
- Explore the project through a responsive website with an interactive sample ledger.

The current balance calculation is:

```text
Outstanding principal = total money lent − total repayments
```

A monthly percentage is stored on borrower profiles, but interest is not yet included in balance calculations.

## Download for Android

Download [LenDen v1.0.0 for Android](https://github.com/imshubham07/LenDen/releases/download/v1.0.0/LenDen-v1.0.0.apk), or open [GitHub Releases](https://github.com/imshubham07/LenDen/releases) to view release notes and checksums. Transfer it to your Android device, open it, and allow installation from your browser or file manager if Android prompts you.

The current Android build is **1.0.0** and requires **Android 7.0 or newer**. Create an account in the app to start your ledger. An internet connection is required to use the backend.

## Tech stack

| Component | Technologies |
| --- | --- |
| Mobile app | Expo, React Native, TypeScript, Expo Router, NativeWind |
| Backend | Node.js, Express, TypeScript, Prisma, Zod |
| Database | PostgreSQL |
| Authentication | JWT, password hashing, Redis-backed sessions |
| Project website | Next.js, React, TypeScript |

## Project structure

```text
LenDen/
├── Backend/       API, database schema, migrations, and authentication tests
├── Mobile_App/    Expo app and native Android project
├── Web/           Next.js project website and sample ledger
└── LICENSE        MIT license
```

## Local development

### Prerequisites

- Node.js 22.13+ on the 22.x line, or a version supported by the packages in the component you are working on, and npm.
- PostgreSQL and Redis, running locally or through hosted services.
- Android Studio, an Android SDK, and JDK 17 for native Android builds.
- Docker, optionally, for the local database and Redis commands below.

Clone the repository:

```bash
git clone https://github.com/imshubham07/LenDen.git
cd LenDen
```

Run each component in a separate terminal. Paths below start from the repository root.

### 1. Start PostgreSQL and Redis

If you already have these services, use their connection URLs instead. Otherwise:

```bash
docker run -d --name lenden-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lenden \
  -p 127.0.0.1:5432:5432 \
  -v lenden-postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine

docker run -d --name lenden-redis \
  -p 127.0.0.1:6379:6379 \
  -v lenden-redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

For later sessions, restart the existing containers with `docker start lenden-postgres lenden-redis`.

### 2. Start the backend

```bash
cd Backend
npm ci
cp .env.example .env
```

Edit `Backend/.env` to match your services. For the local containers above:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lenden?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/lenden?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="replace-with-your-own-long-random-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000,http://localhost:8081"
```

Use your own JWT secret of at least 12 characters. Then generate the client, apply migrations, and start the API:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API runs at `http://localhost:4000`; check it at `http://localhost:4000/health`. Sign up through the mobile app; no seed account is required.

For hosted PostgreSQL or Upstash Redis configuration and API details, see [Backend/README.md](Backend/README.md).

### 3. Start the mobile app

```bash
cd Mobile_App
npm ci
```

Create `Mobile_App/.env` and point the app at your development backend:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

Use `10.0.2.2` for the Android Studio emulator, your computer's LAN IP for a physical phone on the same network, or `localhost` for a browser or iOS simulator. Restart Expo after changing this value. Setting it explicitly ensures development uses your chosen backend; release builds otherwise default to the deployed API.

```bash
npm run android   # Build and launch on an Android emulator or connected device
```

Other commands:

```bash
npm start         # Start the Expo development server
npm run ios       # Build and launch on iOS; requires macOS and Xcode
npm run web       # Run the Expo app in a browser
```

To build an Android release APK locally after configuring the Android SDK:

```bash
cd Mobile_App/android  # From the repository root
./gradlew assembleRelease
```

The output is `Mobile_App/android/app/build/outputs/apk/release/app-release.apk`. The checked-in Gradle configuration signs release builds with the development keystore; configure your own release signing key for production distribution. The Expo EAS `preview` profile in [Mobile_App/eas.json](Mobile_App/eas.json) is also configured to produce an APK.

### 4. Start the project website

```bash
cd Web
npm ci
npm run dev
```

Open `http://localhost:3000`. The website's ledger uses sample data held in memory. The mobile app provides the full ledger connected to the backend. See [Web/README.md](Web/README.md) for website details and production commands.

## Development checks

Run the checks for the component you changed:

| Component | Commands, run inside its folder |
| --- | --- |
| Backend | `npm test` (builds TypeScript and runs authentication tests) |
| Mobile app | `npm run lint` and `npx tsc --noEmit` |
| Website | `npm run lint`, `npm run typecheck`, and `npm run build` |

For mobile UI changes, also verify the affected flow on an emulator or device. Check the native splash screen in a release build, since Expo Go uses its own launch UI.

## Contributing

**Everyone is welcome to contribute — feel free to help!** Whether you are fixing your first typo or building a feature, contributions of all sizes are appreciated.

You can help with bug fixes, UI improvements, accessibility, documentation, tests, or feature ideas. Check the [issues](https://github.com/imshubham07/LenDen/issues) for existing discussions, or open an issue to describe a bug or suggest an improvement. For larger changes, discuss the approach in an issue first.

1. Fork the repository and clone your fork.
2. Create a branch: `git checkout -b feat/your-change` or `git checkout -b fix/your-fix`.
3. Follow the setup steps for the component you want to work on.
4. Make a focused change, follow the surrounding code style, and update documentation or tests where needed.
5. Run the relevant development checks and manually verify changed behavior.
6. Commit and push your branch, then open a pull request against `master`.

In your pull request, explain what changed and why, link any related issue, and include testing details. Add screenshots or a short recording for visual changes. Keep credentials, `.env` files, personal ledger data, and generated build files out of commits; distribute APKs through GitHub Releases.

Please be respectful and constructive in issues, reviews, and discussions. If you are new to the project, you are welcome to ask for guidance in an issue.

## License

LenDen is available under the [MIT License](LICENSE).
