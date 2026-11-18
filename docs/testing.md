Testing
Every test calls the real app through Supertest against a real PostgreSQL database. There are no separate service tests, because services only wrap Prisma and every endpoint test exercises them. Google and Resend are never called.
Run
docker compose up -d     # the database must be running
pnpm prisma:migrate      # first time only
pnpm prisma:seed         # first time only, tests rely on the seeded roles and permissions
pnpm test                # run once
pnpm test:watch
pnpm test:coverage
pnpm vitest run tests/post/post-list.test.ts   # one file
tests/global-setup.ts applies migrations before the suite. It does not seed. Without the seed, post routes return 403 and new users have no role.
Setup
File	Does
vitest.config.ts	@ alias, picks up tests/**/*.test.ts, resets mocks between tests
tests/global-setup.ts	Runs prisma migrate deploy
tests/setup.ts	Fills missing env vars with test defaults (fake Google and Resend keys), points DATABASE_URL at dev_db locally (CI uses its own), deletes test users after each file


Locally, tests use your dev_db, the same database as pnpm dev. They only create and delete users whose email starts with test+, so don't use that prefix for real data.
Layout
tests/ mirrors src/app: auth/ (with email/, otp/, password/, provider/google/) and post/. One file per endpoint, plus post-authz.test.ts and post-permissions.test.ts for access rules.

Each endpoint test covers the success path, validation (400), authentication (401), permissions (403) where they apply, and the rate limit (429).

Not covered: successful Google callbacks (new user, link, returning user), which need a stubbed strategy.
Helpers (tests/helpers)
Helper	Use
api()	New Supertest request against the app
ROUTES	Every path. Add new endpoints here
newUser()	Unique sign-up body
createUser({ roles, status, emailVerified, password, fullName })	Insert a user directly. password: null makes a Google-only account
authCookie(user)	.set(authCookie(user)) authenticates without a request
createRefreshToken(userId), refreshCookie(token)	Refresh sessions
createOtp(userId, { code, purpose, expiresAt, attempts })	An OTP with a known code
mockMailer()	Replaces Resend. codeFor(email) returns the code that was sent
createPost(authorId)	Insert a post
cookieNamed, isCleared, expectRateLimited	Cookie and 429 assertions


Writing a test
Follow step 9 in [adding-endpoints.md](./adding-endpoints.md). Rules that matter:
- Assert exact status codes. not.toBe(401) once hid a route-ordering bug.
- Call mockMailer() in beforeEach for any route that sends email. Mocks are reset after every test.
- Rate-limit tests: use expectRateLimited(send, limit), and the limit must match the route config. Counters are per test file. For routes that read email from the body, send the same email every time.
- Use unique users per test. Files run in parallel against one database.
- Argon2 hashing is slow. If tests time out, raise testTimeout in vitest.config.ts.
CI
Workflow	Runs
ci.yml	pnpm check and pnpm build
test.yml	PostgreSQL 17 service, prisma:deploy, prisma:seed, pnpm test
security.yml	pnpm audit --prod (blocking) and a full audit (informational, known picomatch advisory in dev tooling), also weekly


Next
- [adding-endpoints.md](./adding-endpoints.md) for the full endpoint checklist, including the test step
- [api-reference.md](./api-reference.md) for the status codes each endpoint should return
Browser UI smoke checks
These checks exercise the static frontend against the running API. They complement the Supertest suite; they do not replace endpoint authorization tests.
Authentication screens
- [ ] Sign-in is the entry screen and links to account creation and forgot password.
- [ ] Sign-up submits email, password, and optional fullName to the existing sign-up endpoint.
- [ ] Successful sign-up leads to the email verification screen.
- [ ] Verification submits email and code; successful verification establishes the cookie session.
- [ ] Resend verification submits only email and displays the API's neutral confirmation.
- [ ] Forgot password appears before reset: submit the email first, then continue to the reset-code form.
- [ ] Reset submits email, code, and password; success returns the user to sign-in.
- [ ] Google sign-in returns to the configured frontend route. Check the callback Location and cookie attributes without exposing authorization codes or cookie values.
- [ ] /api/auth/me is handled using the returned data.user object.
- [ ] Logout clears the session and returns to sign-in.
Post UI and ownership
Use two distinct verified accounts and the real post API.
- [ ] User A can create a post with a 1–150 character title and 1–10,000 character content.
- [ ] The list displays posts and paginates using page and pageSize.
- [ ] Opening a post displays its title, content and available timestamps.
- [ ] User A sees edit/delete actions for a post whose authorId matches their authenticated userId.
- [ ] User B can read User A's post but sees a read-only ownership explanation and no owner actions.
- [ ] User A can update only the title or only the content using PATCH /api/posts/:id.
- [ ] User A can delete their own post after confirming the action.
- [ ] Directly attempt User B's PATCH and DELETE requests and verify the backend rejects them. UI hiding is not authorization.
- [ ] Check empty, loading, validation, not-found, server-error and expired-session states.
Seeded admin account (informational UI only)
SEED_ADMIN_EMAIL=malibaalex@example.com
SEED_ADMIN_NAME="Rio admin"
- [ ] Run the seed after migrations and sign in using the credentials configured by the seed process.
- [ ] Confirm /api/auth/me includes the expected admin role.
- [ ] Confirm the UI identifies the admin account and explains that admin moderation is not yet available.
- [ ] Do not expect list-all-posts, delete-any-post, staff-management or role-management controls in this version. Those require dedicated backend endpoints and authorization tests first.
Deployment note
The browser checks above are manual smoke tests. Run the automated Supertest/PostgreSQL suite separately using the commands in Run. Do not deploy based only on a successful UI walkthrough.