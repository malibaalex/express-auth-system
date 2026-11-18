# Testing

Every test calls the real app through Supertest against a real PostgreSQL database. There are no separate service tests, because services only wrap Prisma and every endpoint test exercises them. Google and Resend are never called.

## Run

```bash
docker compose up -d     # the database must be running
pnpm prisma:migrate      # first time only
pnpm prisma:seed         # first time only, tests rely on the seeded roles and permissions
pnpm test                # run once
pnpm test:watch
pnpm test:coverage
pnpm vitest run tests/post/post-list.test.ts   # one file
```

`tests/global-setup.ts` applies migrations before the suite. It does not seed. Without the seed, post routes return 403 and new users have no role.

## Setup

| File | Does |
|---|---|
| `vitest.config.ts` | `@` alias, picks up `tests/**/*.test.ts`, resets mocks between tests |
| `tests/global-setup.ts` | Runs `prisma migrate deploy` |
| `tests/setup.ts` | Fills missing env vars with test defaults (fake Google and Resend keys), points `DATABASE_URL` at `dev_db` locally (CI uses its own), deletes test users after each file |

**Locally, tests use your `dev_db`**, the same database as `pnpm dev`. They only create and delete users whose email starts with `test+`, so don't use that prefix for real data.

## Layout

`tests/` mirrors `src/app`: `auth/` (with `email/`, `otp/`, `password/`, `provider/google/`) and `post/`. One file per endpoint, plus `post-authz.test.ts` and `post-permissions.test.ts` for access rules.

Each endpoint test covers the success path, validation (400), authentication (401), permissions (403) where they apply, and the rate limit (429).

**Not covered:** successful Google callbacks (new user, link, returning user), which need a stubbed strategy.

## Helpers (`tests/helpers`)

| Helper | Use |
|---|---|
| `api()` | New Supertest request against the app |
| `ROUTES` | Every path. Add new endpoints here |
| `newUser()` | Unique sign-up body |
| `createUser({ roles, status, emailVerified, password, fullName })` | Insert a user directly. `password: null` makes a Google-only account |
| `authCookie(user)` | `.set(authCookie(user))` authenticates without a request |
| `createRefreshToken(userId)`, `refreshCookie(token)` | Refresh sessions |
| `createOtp(userId, { code, purpose, expiresAt, attempts })` | An OTP with a known code |
| `mockMailer()` | Replaces Resend. `codeFor(email)` returns the code that was sent |
| `createPost(authorId)` | Insert a post |
| `cookieNamed`, `isCleared`, `expectRateLimited` | Cookie and 429 assertions |

## Writing a test

Follow step 9 in [adding-endpoints.md](./adding-endpoints.md). Rules that matter:

- **Assert exact status codes.** `not.toBe(401)` once hid a route-ordering bug.
- **Call `mockMailer()` in `beforeEach`** for any route that sends email. Mocks are reset after every test.
- **Rate-limit tests:** use `expectRateLimited(send, limit)`, and the limit must match the route config. Counters are per test file. For routes that read `email` from the body, send the same email every time.
- **Use unique users per test.** Files run in parallel against one database.
- Argon2 hashing is slow. If tests time out, raise `testTimeout` in `vitest.config.ts`.

## CI

| Workflow | Runs |
|---|---|
| `ci.yml` | `pnpm check` and `pnpm build` |
| `test.yml` | PostgreSQL 17 service, `prisma:deploy`, `prisma:seed`, `pnpm test` |
| `security.yml` | `pnpm audit` (also weekly) |

## Next

- [adding-endpoints.md](./adding-endpoints.md) for the full endpoint checklist, including the test step
- [api-reference.md](./api-reference.md) for the status codes each endpoint should return