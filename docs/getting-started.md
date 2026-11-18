# Getting Started

Set up the project on a fresh machine and confirm it works. This takes about 10 minutes.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 24+ | Checked by `engines` in `package.json` |
| pnpm | pinned in `packageManager` | Run `corepack enable` and the right version is used automatically |
| PostgreSQL | 17 (what CI runs) | Docker, a local install, or a hosted database such as Neon or Supabase |
| Docker engine | any recent | Only if you use `docker compose` for the database |

## 1. Install and configure

```bash
git clone <repo-url>
cd express-auth-system
corepack enable
pnpm install
cp .env.example .env
```

Fill in `.env` now, because Docker Compose reads it in the next step. See [Environment variables](#environment-variables).

## 2. Start a database

Pick one. Both end with a `DATABASE_URL` in `.env`.

**Docker (no PostgreSQL install needed):**

```bash
docker compose up -d     # reads POSTGRES_USER, POSTGRES_PASSWORD and POSTGRES_DB from .env
```

**A PostgreSQL you already have:** create an empty database.

```bash
createdb dev_db
```

Notes:
- Compose creates the database named in `POSTGRES_DB`. Set it to `dev_db`, because local tests point at `dev_db`.
- The `pgdata` volume persists data. Run `docker compose down -v` to reset it.
- If port 5432 is already taken by a local PostgreSQL, the container can't bind to it. Stop one of them, or change the host port in `docker-compose.yml` (for example `5433:5432`) and use that port in the URL.

## Environment variables

They are validated at startup in `src/core/utils/utils-env.ts`, so the app refuses to boot and prints which variable is invalid.

### Required

| Variable | Example / default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/dev_db?schema=public` | Postgres connection string |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `postgres` / `postgres` / `dev_db` | Validated at startup. Docker Compose also uses them to create the container's database |
| `JWT_ACCESS_SECRET_KEY` | | Generate with `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET_KEY` | | Same command, **use a different value** |
| `COOKIE_SECRET` | | Same command. Signs the OAuth state cookie |
| `APP_URL` | `http://localhost:3000` | Where the frontend lives. Google sign-in redirects here after login |
| `GOOGLE_CLIENT_ID` | | From the Google Cloud console |
| `GOOGLE_CLIENT_SECRET` | | From the Google Cloud console |
| `GOOGLE_CALLBACK_URL` | `http://localhost:4001/api/auth/google/callback` | Must exactly match a redirect URI registered in Google |
| `GOOGLE_START_PATH` | `/api/auth/google/redirect` | Required by the env schema |
| `RESEND_API_KEY` | | From resend.com |
| `EMAIL_FROM` | `onboarding@resend.dev` | Must be a valid address allowed by your Resend account |

### Optional

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4001` | |
| `NODE_ENV` | `development` | `production` turns on secure cookies (HTTPS required) |
| `JWT_ACCESS_SECRET_KEY_EXPIRES_IN` | `900` | Seconds (15 minutes) |
| `JWT_REFRESH_SECRET_KEY_EXPIRES_IN` | `604800` | Seconds (7 days) |

### Seed only

| Variable | Notes |
|---|---|
| `SEED_ADMIN_EMAIL` | Email of the admin account the seed creates |
| `SEED_ADMIN_NAME` | Display name for that admin |

The seed creates the admin without a password. Sign in through Google, or use **forgot password** to set one.

### Which values can be fake?

The schema requires the Google and Resend variables, but you only need real ones for the flows that use them:

| You want to run | Needs real values for |
|---|---|
| The test suite | Nothing. Google is never contacted and the mailer is mocked |
| Email sign-up, password reset | `RESEND_API_KEY`, `EMAIL_FROM` |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, plus the callback URL registered in Google |
| Everything else (sign-in, refresh, posts) | Placeholders are fine |

Never commit `.env`. Use a different set of secrets in every environment.

## 3. Set up the database

```bash
pnpm prisma:generate   # generate the client (rerun after every schema change)
pnpm prisma:migrate    # create and apply migrations (development)
pnpm prisma:seed       # create roles, permissions and the admin account
```

**Don't skip the seed.** New users receive the `USER` role at sign-up. Without the seed, sign-ups succeed but users have no permissions, so every post route returns 403.

Use `pnpm prisma:deploy` instead of `migrate` in CI and production: it applies existing migrations and never creates new ones.

## 4. Run

```bash
pnpm dev   # http://localhost:4001
```

## 5. Verify it works

**The server is up:**

```bash
curl http://localhost:4001/
# {"status":200,"message":"welcome to the API", ...}
```

**The database and seed are in place:** sign up a user. This sends a real email, so it needs a working Resend key.

```bash
curl -X POST http://localhost:4001/api/auth/email/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret123"}'
# 201: "verification code sent"
```

If you get a 500 saying the account was created but the code could not be sent, the database is fine and the Resend key or `EMAIL_FROM` is wrong. Fix them and call `POST /api/auth/otp/send` for the same email.

**Everything works end to end:**

```bash
pnpm test
```

Tests run against the database in `DATABASE_URL`. They create users with `test+...@example.com` emails and delete them afterward. Locally, `tests/setup.ts` points them at `dev_db`, so start the database first.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Invalid environment variables` at startup | The log lists the failing variable. Check it against the tables above |
| Postgres container exits right after `docker compose up` | `POSTGRES_*` are missing from `.env`. Fill them in, then `docker compose down -v` and start again |
| `P1001: Can't reach database server` | The database isn't running, or the host and port in `DATABASE_URL` are wrong. Check with `docker compose ps` |
| Port 5432 already in use | A local PostgreSQL is running. See step 2 |
| `redirect_uri_mismatch` from Google | `GOOGLE_CALLBACK_URL` doesn't exactly match a URI registered in the Google console |
| Cookies aren't sent by the browser | Cookie paths are `/api` and `/api/auth`, so the API must be served under `/api`. In production, cookies are `secure` and need HTTPS |
| Every post route returns 403 | The seed didn't run. Run `pnpm prisma:seed` |
| Tests fail on a fresh database | Run `pnpm prisma:migrate` and `pnpm prisma:seed` first. The tests rely on the seeded roles |

## Before you commit

Run `pnpm check` (lint, format check and typecheck). CI runs the same check, then the build, the tests and a dependency audit, so a failure locally is a failure in CI.

## Next

- [api-reference.md](./api-reference.md) for every endpoint
- [architecture.md](./architecture.md) for how the pieces fit together
- [adding-endpoints.md](./adding-endpoints.md) to extend the API
- [testing.md](./testing.md) for how the tests work