# Testing Atlas

This guide covers the browser UI and the real API test suite. The browser checklist is for manual end-to-end verification; the automated suite uses Supertest against PostgreSQL.

## Before testing

Serve the `public/` directory at `/app/` on the same origin as the API. The frontend calls `/api/...` on that origin. Google OAuth must return to the frontend entry route, for example `http://localhost:4001/app/`; the backend callback's `APP_URL` controls that redirect.

Start the database and prepare the test data:

```bash
docker compose up -d
pnpm prisma:migrate       # first time only
pnpm prisma:seed          # first time only; tests rely on seeded roles and permissions
```

`tests/global-setup.ts` applies migrations before the suite. It does not seed. Without the seed, post routes can return 403 and new users may have no role.

## Manual browser flow

### 1. Registration and verification

1. Open `/app/` and choose **Create an account**.
2. Register with a fresh email address and a password between 8 and 128 characters.
3. Confirm the app advances to the verification screen.
4. Enter the six-digit code delivered to that email.
5. Confirm verification establishes the session and opens the account page.
6. Try an invalid or expired code and confirm the error is shown.
7. Try **Resend verification code** and confirm the neutral response is shown.

### 2. Sign-in and Google OAuth

1. Sign out, then sign in with the verified email and password.
2. Sign in with Google using an existing linked account.
3. Sign in with Google using an account that has not used Google before.
4. Confirm the callback response redirects to `/app/` and sets the authentication cookies.
5. Confirm `/api/auth/me` returns the user at `body.data.user` and the account page displays the profile.

Do not share OAuth authorization codes, `state`, cookie values or token values in screenshots or logs.

### 3. Password recovery

1. From the sign-in page, choose **Forgot password?**.
2. Submit the account email and wait for the neutral confirmation.
3. Use **Enter reset code** to continue to the reset form. The reset page is intended to follow this request in the same browser session.
4. Enter the six-digit code and a matching password between 8 and 128 characters.
5. Confirm the UI returns to sign-in after a successful reset.
6. Sign in with the new password.
7. Confirm old refresh sessions have been revoked by the backend.

Google-only accounts can use password recovery to set their first password, provided the account is verified and enabled.

### 4. Posts and ownership

Use two separate verified user accounts for this section.

1. Sign in as User A and open **Posts**.
2. Create a post with a title (1–150 characters) and content (1–10,000 characters).
3. Open the post detail page and confirm its title, content and timestamps render.
4. Confirm User A sees the ownership note and can edit or delete the post.
5. Edit the title only, then edit the content only, and confirm both PATCH requests work.
6. Sign in as User B and open the same post.
7. Confirm User B can read it but sees the read-only ownership explanation and no Edit/Delete controls.
8. Confirm the backend rejects User B's direct PATCH and DELETE attempts. Hiding controls in the browser is not authorization.
9. Sign back in as User A, delete the post, and confirm it disappears from the list.
10. Create more than 10 posts and verify Previous/Next pagination and the total count.
11. Test empty list, invalid post ID, server errors and expired sessions.

The frontend compares `post.authorId` with the authenticated `user.userId` to decide which controls to display. This is presentation only. The API's authentication and `PostWriteAccess` middleware must enforce ownership on every write request.

## Seeded admin account

The seed configuration identifies the admin account with:

```env
SEED_ADMIN_EMAIL=malibaalex@example.com
SEED_ADMIN_NAME="Rio admin"
```

Run `pnpm prisma:seed` after migrations to ensure the seeded roles and permissions exist. Sign in using the credentials configured by your seed process; this guide intentionally does not specify or store an admin password.

When the `/api/auth/me` response includes the `ADMIN` role, the account page displays a note that admin moderation is planned. **Admin management is not implemented in this frontend yet.** There are no admin-only list-all, delete-any, user-management or role-management controls in this build. Do not treat the informational note as an admin feature. Those screens should be added only after the corresponding admin endpoints and authorization tests exist.

For today's deployment check, verify the seeded admin can sign in and use the standard post workspace. Tomorrow's admin implementation should separately cover viewing all posts, deleting another user's post, and any additional staff-management operations that the backend actually supports.

## Automated API tests

Every test calls the real app through Supertest against a real PostgreSQL database. There are no separate service tests, because services only wrap Prisma and every endpoint test exercises them. Google and Resend are never called.

### Run

```bash
docker compose up -d     # the database must be running
pnpm prisma:migrate      # first time only
pnpm prisma:seed         # first time only; tests rely on seeded roles and permissions
pnpm test                # run once
pnpm test:watch
pnpm test:coverage
pnpm vitest run tests/post/post-list.test.ts   # one file
```

`tests/global-setup.ts` applies migrations before the suite. It does not seed. Without the seed, post routes return 403 and new users have no role.

### Setup

| File | Does |
|---|---|
| `vitest.config.ts` | `@` alias, picks up `tests/**/*.test.ts`, resets mocks between tests |
| `tests/global-setup.ts` | Runs `prisma migrate deploy` |
| `tests/setup.ts` | Fills missing env vars with test defaults (fake Google and Resend keys), points `DATABASE_URL` at `dev_db` locally (CI uses its own), deletes test users after each file |

**Locally, tests use your `dev_db`**, the same database as `pnpm dev`. They only create and delete users whose email starts with `test+`, so don't use that prefix for real data.

### Layout

`tests/` mirrors `src/app`: `auth/` (with `email/`, `otp/`, `password/`, `provider/google/`) and `post/`. One file per endpoint, plus `post-authz.test.ts` and `post-permissions.test.ts` for access rules.

Each endpoint test covers the success path, validation (400), authentication (401), permissions (403) where they apply, and the rate limit (429).

**Not covered:** successful Google callbacks (new user, link, returning user), which need a stubbed strategy.

### Helpers (`tests/helpers`)

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

### Writing a test

Follow step 9 in `adding-endpoints.md`. Rules that matter:

- **Assert exact status codes.** `not.toBe(401)` once hid a route-ordering bug.
- **Call `mockMailer()` in `beforeEach`** for any route that sends email. Mocks are reset after every test.
- **Rate-limit tests:** use `expectRateLimited(send, limit)`, and the limit must match the route config. Counters are per test file. For routes that read `email` from the body, send the same email every time.
- **Use unique users per test.** Files run in parallel against one database.
- Argon2 hashing is slow. If tests time out, raise `testTimeout` in `vitest.config.ts`.

### CI

| Workflow | Runs |
|---|---|
| `ci.yml` | `pnpm check` and `pnpm build` |
| `test.yml` | PostgreSQL 17 service, `prisma:deploy`, `prisma:seed`, `pnpm test` |
| `security.yml` | `pnpm audit --prod` (blocking) and a full audit (informational, known `picomatch` advisory in dev tooling), also weekly |

### Next references

- `adding-endpoints.md` for the full endpoint checklist, including the test step
- `api-reference.md` for the status codes each endpoint should return

## UI implementation notes

- Static HTML, CSS and vanilla JavaScript ES modules; no frontend framework or CDN.
- Requests use `credentials: "include"`; JavaScript never reads or stores HttpOnly tokens.
- The shared API client coordinates one refresh request and retries a protected request once.
- The reset form follows the forgot-password request and uses the email held in `sessionStorage` for that browser session.
- Post ownership labels are based on `authorId === userId`; backend authorization remains mandatory.
- The admin account notice is informational only. Admin endpoints and moderation actions are not part of this build.

## Design credit

The UI craft pass follows the audit, direction and restraint principles from [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky. Unslop is licensed CC BY 4.0; this project credits the source and links back to the repository.
