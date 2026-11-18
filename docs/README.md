# Express Auth System

A production-minded authentication and authorization backend built with Express 5, TypeScript and PostgreSQL. It covers the full auth lifecycle (Google OAuth, email and password with OTP verification, password reset, rotating sessions) and role-based access control, with a small posts CRUD that demonstrates permission and ownership checks.

## What it gives you

**Authentication**
- **Google sign-in** through Passport, with a signed `state` cookie to prevent login CSRF.
- **Email and password sign-up** with a pending state: accounts stay unverified until a 6-digit emailed OTP is confirmed.
- **Password reset** by OTP. This also lets a Google-only user add a first password.
- **Sessions** with short-lived access tokens and rotating refresh tokens, both in HttpOnly cookies.
- **Replay detection:** reusing an already-rotated refresh token revokes every session for that user.

**Authorization**
- **RBAC:** users have roles, roles bundle permissions named `resource:action` (for example `posts:read`).
- **Permission and role middlewares** you attach per route.
- **Ownership checks:** owners need an `:own` permission, everyone else needs the `:any` variant.
- **Live access data:** roles and permissions are loaded from the database on every authenticated request, so changes apply immediately.

**Security**
- Passwords hashed with Argon2id (Node's native `crypto`).
- OTPs and refresh tokens are stored hashed, never in plain text.
- OTP attempt limit and resend cooldown.
- Generic sign-in errors with equalized timing, so responses don't reveal which emails are registered.
- Per-route rate limiting.
- Structured logging with pino and sensitive-header redaction.

**Demo**
- A posts CRUD guarded by permissions and ownership.
- A profile update endpoint.

## Stack

| Area | Tools |
|---|---|
| Runtime | Node.js 24+, TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL 17, Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Passport (`passport-google-oauth20`), `jsonwebtoken`, native Argon2id |
| Validation | Zod 4 |
| Email | Resend |
| Logging | pino, pino-http, pino-roll |
| Testing | Vitest, Supertest |
| Tooling | pnpm, ESLint, Prettier, tsc-alias |
| CI | GitHub Actions (check, test, security audit) |

## Quick start

Requires Node.js 24+ and pnpm (pinned in `packageManager`; run `corepack enable`).

### 1. Configure

```bash
pnpm install
cp .env.example .env     # fill in every variable (Google and Resend can be placeholders until you use them)
```

### 2. Start a database

You need a PostgreSQL database. Use whichever option fits your machine.

**Option A: Docker (recommended).** Requires the Docker engine. No local PostgreSQL install needed.

```bash
docker compose up -d     # reads POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB from .env
```

**Option B: a local PostgreSQL you already have.** Skip Docker and create an empty database:

```bash
createdb dev_db
```

Set `DATABASE_URL` in `.env` to match the database you chose:

```
# Docker setup (credentials from POSTGRES_* in .env)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/dev_db?schema=public

# Your own local PostgreSQL (replace user, password, host, port and database name)
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>?schema=public
```

> Docker Compose creates the database named in `POSTGRES_DB`. Set it to `dev_db`, because local tests point at `dev_db`. The `pgdata` volume keeps your data between restarts. Run `docker compose down -v` to reset it.

CI runs PostgreSQL 17, and any recent version should work. The database user needs permission to create tables, because `pnpm prisma:migrate` applies the schema.

### 3. Run the app

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed         # creates roles, permissions and the admin account: required before sign-ups work
pnpm dev                 # http://localhost:4001
```

### 4. Configure external services (only for the flows that need them)

| Flow | Needs |
|---|---|
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` registered in the Google console |
| OTP emails (sign-up, reset) | `RESEND_API_KEY` and `EMAIL_FROM` |

The test suite needs neither: Google is never contacted and the mailer is mocked.

The full variable list and a verification checklist are in [getting-started.md](./getting-started.md).

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start the dev server with nodemon |
| `pnpm build` | Compile TypeScript and resolve path aliases into `dist/` |
| `pnpm start` | Run the compiled server |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm check` | Lint, format check and typecheck |
| `pnpm lint` / `pnpm format` / `pnpm typecheck` | The individual checks |
| `pnpm prisma:generate` | Generate the Prisma client |
| `pnpm prisma:migrate` | Create and apply migrations (development) |
| `pnpm prisma:deploy` | Apply existing migrations (CI and production) |
| `pnpm prisma:seed` | Seed roles, permissions and the admin account |

## Project layout

```
src/
├── core/        base classes, utils (token, password, otp, cookies, mailer), strategies
├── app/         routes, controllers, middlewares, validators
├── database/    prisma client and single-purpose data services
└── types/
prisma/          schema, per-domain models, migrations, seed
tests/           endpoint tests and helpers
docs/            documentation
```

Each controller, validator, middleware, route and service is one class per file. Services perform a single database operation and hold no business logic. Decisions live in controllers and middlewares.

## Documentation

| Doc | What's inside |
|---|---|
| [getting-started.md](./getting-started.md) | Fresh-machine setup: prerequisites, install, configuration, verification |
| [api-reference.md](./api-reference.md) | Every endpoint: auth requirements, parameters, examples, error codes |
| [architecture.md](./architecture.md) | Diagram, components, data flow, key decisions |
| [adding-endpoints.md](./adding-endpoints.md) | Step-by-step guide to adding an endpoint |
| [testing.md](./testing.md) | Running tests, helpers, writing a new test |
| [deployment.md](./deployment.md) | Pointer to Express production best practices |

## License

ISC