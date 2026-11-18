# API Reference

All routes are mounted under `/api`, except the welcome route.

## Endpoints

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/` | No | | Welcome message |
| GET | `/api/auth/google/redirect` | No | | Start Google sign-in (302 to Google) |
| GET | `/api/auth/google/callback` | No | | Finish Google sign-in (sets cookies, 302 to the app) |
| POST | `/api/auth/email/sign-up` | No | | Create a pending account and email a code |
| POST | `/api/auth/otp/verify` | No | | Verify the email with the code and sign in |
| POST | `/api/auth/otp/send` | No | | Send a new verification code |
| POST | `/api/auth/email/sign-in` | No | | Sign in with email and password |
| POST | `/api/auth/password/forgot` | No | | Email a password reset code |
| POST | `/api/auth/password/reset` | No | | Set a new password with the code |
| POST | `/api/auth/refresh` | Refresh cookie | | Rotate the refresh token, issue a new access token |
| POST | `/api/auth/logout` | No | | Revoke the current refresh token, clear cookies |
| GET | `/api/auth/me` | Yes | | Current user with roles and permissions |
| PATCH | `/api/auth/me` | Yes | | Update the current user's profile |
| GET | `/api/posts/list` | Yes | `posts:read` | List posts (paginated) |
| POST | `/api/posts/create` | Yes | `posts:create` | Create a post |
| GET | `/api/posts/:id` | Yes | `posts:read` | Get one post |
| PATCH | `/api/posts/:id` | Yes | `posts:update:own` or `posts:update:any` | Update a post |
| DELETE | `/api/posts/:id` | Yes | `posts:delete:own` or `posts:delete:any` | Delete a post |

## Response format

Every response, success or error, uses the same envelope:

```json
{
  "status": 200,
  "message": "success",
  "timestamp": "2026-11-18T09:30:00.000Z",
  "requestId": "…",
  "data": {}
}
```

`data` is omitted when there's nothing to return, including on errors. Validation errors (400) put the first failing rule in `message`, for example `"invalid email address"`.

### The user object

Returned by sign-in, OTP verify, refresh, `GET /me` and `PATCH /me`. It never contains the password hash.

```json
{
  "userId": "0b9f…",
  "email": "jane@example.com",
  "fullName": "Jane Roe",
  "avatarUrl": null,
  "emailVerified": true,
  "roles": ["USER"],
  "permissions": ["posts:read", "posts:create", "posts:update:own", "posts:delete:own"]
}
```

`roles` and `permissions` are for the UI (show or hide controls). The server enforces them on every request regardless of what the client does.

## Authentication

- **Access token:** 15 minutes by default. Sent as the `access_token` HttpOnly cookie (path `/api`) or as `Authorization: Bearer <token>`.
- **Refresh token:** 7 days by default. `refresh_token` HttpOnly cookie (path `/api/auth`). Only a SHA-256 hash is stored. It is rotated on every refresh.
- **Cookies:** `sameSite=strict`, and `secure` when `NODE_ENV=production` (requires HTTPS). The OAuth `oauth_state` cookie is `lax` and signed, because it must survive the redirect back from Google.
- **Every authenticated request** reloads the user, their roles and their permissions from the database. A disabled account is rejected immediately, and a role change applies on the next request.
- **Passwords:** Argon2id (memory 19,456 KiB, 2 passes, 1 lane, random 16-byte salt).
- **OTP codes:** 6 digits, valid 10 minutes, one resend per 60 seconds, 5 attempts per code. Stored hashed with Argon2id.

## Authorization

Roles bundle permissions, and routes check permissions.

| Permission | `USER` | `ADMIN` |
|---|---|---|
| `posts:read` | yes | yes |
| `posts:create` | yes | yes |
| `posts:update:own` | yes | yes |
| `posts:delete:own` | yes | yes |
| `posts:update:any` | | yes |
| `posts:delete:any` | | yes |
| `users:read`, `users:write` | | yes |

Every new account (email or Google) gets the `USER` role.

## Errors

| Status | Meaning |
|---|---|
| 400 | Validation failed, or an invalid or expired code |
| 401 | Not authenticated, or bad credentials |
| 403 | Authenticated but not allowed (permission, disabled account, unverified email) |
| 404 | Resource or route not found |
| 405 | Method not allowed |
| 409 | Email already registered |
| 429 | Rate limit exceeded. Check the `Retry-After` header (seconds) |
| 500 | Server error |

## Rate limiting

Every route has its own limit, shown in each section. Requests are counted per IP, and per IP and email when the body contains an `email`. A blocked request returns 429 with `Retry-After`. Allowed requests include `RateLimit-Limit` and `RateLimit-Remaining` headers. Counters are held in memory, so they reset on restart and aren't shared between instances.

---

## Google sign-in

### `GET /api/auth/google/redirect`

Starts the flow. Generates a random `state`, stores it in a signed `oauth_state` cookie (10 minutes) and redirects to Google.

- **Success:** `302` to `accounts.google.com`
- **Rate limit:** 20 per 5 minutes

### `GET /api/auth/google/callback`

Google redirects here after consent.

| Query | Required | Notes |
|---|---|---|
| `state` | yes | Must match the `oauth_state` cookie. Single use |
| `code` | on success | Sent by Google |
| `error` | no | Sent by Google when the user cancels (for example `access_denied`) |

**Success:** sets both cookies and redirects `302` to `APP_URL`. The account is resolved like this:

1. A Google account already linked: sign in.
2. Email not registered: create a verified user with the `USER` role.
3. Email already registered: link Google to it. If that account was still unverified, it becomes verified and **its password is removed**, so whoever pre-registered the email can't keep access.

| Status | When |
|---|---|
| 400 | `state` missing |
| 401 | The user cancelled, or Google authentication failed |
| 403 | `state` doesn't match the cookie, Google's email isn't verified, or the account is disabled |
| 500 | Database failure |

Errors are JSON, so a browser shows raw JSON. **Rate limit:** 20 per 5 minutes.

---

## Email sign-up and verification

New accounts are **pending** (`emailVerified: false`) until the emailed code is confirmed. No tokens are issued while pending.

### `POST /api/auth/email/sign-up`

```json
{ "email": "jane@example.com", "password": "secret123", "fullName": "Jane Roe" }
```

| Field | Rules |
|---|---|
| `email` | Valid email. Trimmed and lowercased |
| `password` | 8 to 128 characters |
| `fullName` | Optional, 1 to 100 characters |

**`201`** (no cookies):

```json
{ "status": 201, "message": "verification code sent", "data": { "email": "jane@example.com" } }
```

| Status | When |
|---|---|
| 400 | Validation failed |
| 409 | Email already registered |
| 429 | Rate limit |
| 500 | Account created but the email couldn't be sent. Call `otp/send` to get a new code |

**Rate limit:** 5 per 15 minutes.

### `POST /api/auth/otp/verify`

```json
{ "email": "jane@example.com", "code": "123456" }
```

**`200`:** marks the email verified, deletes the code, sets both cookies and returns `data.user`.

| Status | When |
|---|---|
| 400 | Wrong, expired or missing code, unknown email, or the account is already verified or disabled. All use the same message, `invalid or expired code` |
| 429 | Too many attempts. The code is deleted, so request a new one |

Each attempt counts, including wrong ones. After 5 the code is locked even if the next one is correct. **Rate limit:** 10 per 10 minutes.

### `POST /api/auth/otp/send`

```json
{ "email": "jane@example.com" }
```

Sends a new code to a pending account. The reply is the same whether or not the account exists or is pending, so it can't be used to discover registered emails.

**`200`:** `"if the account is pending verification, a code was sent"`. If a code was requested less than 60 seconds ago, nothing is sent and the reply is still `200`. **Rate limit:** 5 per 10 minutes.

---

## Email sign-in

### `POST /api/auth/email/sign-in`

```json
{ "email": "jane@example.com", "password": "secret123" }
```

**`200`:** sets both cookies and returns `data.user`.

| Status | Message | When |
|---|---|---|
| 401 | `invalid email or password. if you signed up with Google, use Continue with Google` | Unknown email, wrong password, **or** a Google-only account with no password. One message for all three, with equalized timing |
| 403 | `account disabled` | Correct password, but the account is disabled |
| 403 | `email not verified` | Correct password, but the email isn't verified. Use `otp/send` |
| 400 | | Validation failed |

The 403 cases are only shown after the password is proven correct. Sign-in never sends an OTP. A Google-only user adds a password through **forgot password**. **Rate limit:** 10 per 15 minutes.

---

## Password reset

### `POST /api/auth/password/forgot`

```json
{ "email": "jane@example.com" }
```

**`200`:** `"if an account exists for this email, a reset code was sent"`. A code is only sent to verified, enabled accounts, and that includes Google-only accounts. The reply is identical in every other case. Reset codes are separate from signup codes: one can't be used for the other. **Rate limit:** 5 per 10 minutes.

### `POST /api/auth/password/reset`

```json
{ "email": "jane@example.com", "code": "654321", "password": "a-new-password" }
```

**`200`:** `"password updated, please sign in"`. The password is changed, the code is deleted, **all refresh tokens for the user are revoked** (every device signs out), and the auth cookies are cleared. The user must sign in again.

| Status | When |
|---|---|
| 400 | Wrong, expired or missing code, unknown, unverified or disabled account, or a weak password |
| 429 | Too many attempts on the code |

**Rate limit:** 10 per 10 minutes.

---

## Session

### `POST /api/auth/refresh`

No body. Reads the `refresh_token` cookie.

**`200`:** issues a new access token and a new refresh token, and returns `data.user`. The old refresh token stops working.

**`401`** clears both cookies when the cookie is missing, invalid, expired, belongs to a disabled user, or was already used. **A refresh token that is validly signed but no longer stored is treated as stolen, and every session for that user is revoked.**

If your client has several tabs or requests, send only one refresh at a time and share the result. Two simultaneous refreshes look like a replay. **Rate limit:** 30 per 5 minutes.

### `POST /api/auth/logout`

No body. Deletes the current refresh token and clears both cookies. Always `200`, even when already signed out. It only ends the current session. **Rate limit:** 20 per 5 minutes.

The access token isn't revocable. It stops working only when it expires (15 minutes by default), or immediately if the account is disabled.

### `GET /api/auth/me`

**`200`:** `data.user`. **401** when the token is missing, invalid or expired, or the user is gone or disabled. **Rate limit:** 60 per 5 minutes.

### `PATCH /api/auth/me`

```json
{ "fullName": "Jane R.", "avatarUrl": "https://example.com/jane.png" }
```

| Field | Rules |
|---|---|
| `fullName` | 1 to 100 characters, or `null` to clear |
| `avatarUrl` | `https` URL up to 2048 characters, or `null` to clear |

Omit a field to leave it unchanged. At least one field is required. Unknown fields, such as `email`, are ignored. The target is always the signed-in user.

**`200`:** the updated `data.user`. **400** for an empty body or invalid values. **Rate limit:** 20 per 5 minutes.

---

## Posts

A post:

```json
{
  "id": "6f1d…",
  "title": "Hello",
  "content": "World",
  "authorId": "0b9f…",
  "createdAt": "2026-11-18T09:30:00.000Z",
  "updatedAt": "2026-11-18T09:30:00.000Z"
}
```

All post routes require authentication (401 otherwise) and the permission shown (403 `insufficient permissions` otherwise).

### `GET /api/posts/list`

| Query | Default | Rules |
|---|---|---|
| `page` | `1` | Integer, 1 or more |
| `pageSize` | `10` | Integer, 1 to 50 |

**`200`:** `{ "items": [Post], "page": 1, "pageSize": 10, "total": 42 }`, newest first. **400** for invalid query values. **Rate limit:** 60 per 5 minutes.

### `POST /api/posts/create`

```json
{ "title": "Hello", "content": "World" }
```

`title` is 1 to 150 characters, and `content` is 1 to 10,000. The author is always the signed-in user, and an `authorId` in the body is ignored. **`201`:** `data.post`. **Rate limit:** 20 per 5 minutes.

### `GET /api/posts/:id`

**`200`:** `data.post`. **400** if `id` isn't a UUID. **404** if the post doesn't exist. **Rate limit:** 60 per 5 minutes.

### `PATCH /api/posts/:id`

```json
{ "title": "New title" }
```

Send `title`, `content` or both (at least one). **Owners** need `posts:update:own`, and **everyone else** needs `posts:update:any`.

**`200`:** `data.post`. **400** for an invalid id or empty body. **403** if you aren't the owner and don't have `:any`. **404** if the post doesn't exist. **Rate limit:** 30 per 5 minutes.

### `DELETE /api/posts/:id`

Same ownership rule, with `posts:delete:own` and `posts:delete:any`. **`200`:** `"post deleted"`. **Rate limit:** 30 per 5 minutes.

---

## Example: sign up and call a protected route

```bash
# 1. Sign up (a code is emailed)
curl -X POST http://localhost:4001/api/auth/email/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'

# 2. Verify the code and keep the cookies
curl -c cookies.txt -X POST http://localhost:4001/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","code":"123456"}'

# 3. Call a protected route
curl -b cookies.txt http://localhost:4001/api/auth/me
```

The refresh cookie is only sent to paths under `/api/auth`, so `-b cookies.txt` works for both.