# Adding an Endpoint

Every endpoint is the same few files, each in its own folder with a registry `index.ts`. Follow the steps in order. The example adds `GET /api/posts/mine`, which lists the signed-in user's posts.

## The checklist

| # | Step | Where | Skip when |
|---|---|---|---|
| 1 | Schema change and migration | `prisma/schemas/*.prisma` | No new data |
| 2 | Service | `src/database/services/<domain>/` | An existing service already does the query |
| 3 | Validator | `src/app/validators/<domain>/` | The request has no input |
| 4 | Middleware | `src/app/middlewares/` | Existing ones cover the checks |
| 5 | Controller | `src/app/controllers/<domain>/` | Never |
| 6 | Route | `src/app/routes/<domain>/` | Never |
| 7 | Register and mount | each folder's `index.ts`, then `routes/index.ts` | Never |
| 8 | Seed | `prisma/seed.ts` | No new permission |
| 9 | Test | `tests/<domain>/` | Never |
| 10 | Docs | `docs/api-reference.md` | Never |

## The rules

- **One class per file**, default-exported, with a registry entry in the folder's `index.ts`.
- **Services do one data operation.** No hashing, no token signing, no env, no decisions. They return a row, a count, or `null`.
- **`null` from `service.call()` means "nothing found" or "the database failed".** Controllers treat it as a 500, or a 404 when that's the only sensible reading.
- **Controllers decide.** Status codes, orchestration, hashing and signing happen here.
- **Never trust the client for identity.** Take the user ID from `req.currentUser`, never from the body or URL.
- **Never return `req.currentUser` directly.** It contains the password hash. In auth controllers use `publicUser(user, access)`.
- **Normalize in validators.** Emails are trimmed and lowercased there, and services match them exactly.

## Worked example: `GET /api/posts/mine`

### 1. Schema

Nothing to change, because `Post.authorId` is already indexed.

### 2. Service

One query, with the same items-and-total transaction as `post-list`.

```ts
// src/database/services/post/post-list-by-author.ts
import BaseService from "@/database/system/base-service.js"
import type { Post } from "@/generated/prisma/client.js"
import type { Page } from "@/types/db.js"

export interface ListPostsByAuthorInput extends Page {
  authorId: string
}
export interface ListPostsByAuthorResult {
  items: Post[]
  total: number
}

class ListPostsByAuthorService extends BaseService<
  ListPostsByAuthorInput,
  ListPostsByAuthorResult
> {
  protected async transaction(
    data: ListPostsByAuthorInput,
  ): Promise<ListPostsByAuthorResult | null> {
    const { skip, take } = this.cursor(data)
    const where = { authorId: data.authorId }
    const [items, total] = await this.database.$transaction([
      this.database.post.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.database.post.count({ where }),
    ])
    return { items, total }
  }
}

export default ListPostsByAuthorService
```

Register it in `src/database/services/post/index.ts`:

```ts
const Post = {
  // ...existing
  ListByAuthor: new ListPostsByAuthorService(),
}
```

### 3. Validator

The existing list validator already parses `page` and `pageSize`, so reuse it. For new input, create a class that wraps a Zod schema with `bodyHandler`, `paramHandler` or `queryHandler`:

```ts
// src/app/validators/post/post-create.ts (pattern)
import { NextFunction, Request, Response } from "express"
import { z } from "zod"
import BaseMiddleWare from "@/core/base/base-middleware.js"

const schema = z.object({
  title: z.string().trim().min(1, "title is required").max(150),
})

export type PostCreateBody = z.infer<typeof schema>

class PostCreateValidator extends BaseMiddleWare {
  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, schema)
  }
}

export default PostCreateValidator
```

Zod strips unknown keys by default, which stops a client from sending fields like `authorId`. Register the class in the folder's `index.ts` under `Validators`.

### 4. Middleware

Not needed here. The route uses `Authenticate` and a permission check. If a route needs a rule that isn't a plain permission (for example ownership of another resource), write a middleware class like `PostWriteAccess` and register it under `Middlewares`.

### 5. Controller

```ts
// src/app/controllers/post/post-list-mine.ts
import { Request, Response } from "express"
import BaseController from "@/core/base/controller/base-controller.js"
import type { PostListQuery } from "@/app/validators/post/post-list.js"

class PostListMineController extends BaseController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { page, pageSize } = req.query as unknown as PostListQuery

    const result = await this.Services.Post.ListByAuthor.call({
      authorId: req.currentUser!.userId, // Authenticate guarantees it, never read from the client
      page,
      pageSize,
    })
    if (!result) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "SUCCESS", {
      data: { items: result.items, page, pageSize, total: result.total },
    })
  }
}

export default PostListMineController
```

Register it in `src/app/controllers/post/index.ts` as `Controllers.Post.ListMine`.

Use `respond(res, key, { message?, data? })`. Available keys: `SUCCESS`, `CREATED`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVER_ERROR`. Add a key to `HTTP_STATUS` and `HTTP_MSG` if you need another status.

If the controller issues sessions, sends OTPs or returns a user, extend `BaseAuthController`. It provides `issueSession`, `sendOtp`, `publicUser`, `loadAccess` and `assignDefaultRole`.

### 6. Route

```ts
// src/app/routes/post/post-list-mine.ts
import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"
import { PERMISSIONS } from "@/core/utils/utils-constants.js"

class PostListMineRoute extends BaseRoute {
  constructor() {
    super("/posts", {
      method: "get",
      route: "/mine",
      rateLimit: { limit: 60, minutes: 5 },
      validators: [Validators.Post.List],
      middlewares: [
        Middlewares.Auth.Authenticate,
        Middlewares.Authz.Permission(PERMISSIONS.POSTS_READ),
      ],
      controller: Controllers.Post.ListMine,
    })
  }
}

export default PostListMineRoute
```

**Pipeline order is fixed:** rate limit, validators, middlewares, controller. Inside `middlewares`, array order matters, so `Authenticate` must come before anything that reads `req.currentUser` or `req.access`.

**Rate limits:** pass `{ limit, minutes }`, and omit `message` to get the default text (an empty string produces a blank 429). The default key is IP plus `req.body.email`. Pass `keyGenerator` for anything else.

### 7. Register and mount

Add the route to `src/app/routes/post/index.ts`, then make sure it is mounted in `src/app/routes/index.ts`.

> **Order matters.** Express matches in registration order. `GET /posts/mine` must be registered **before** `GET /posts/:id`, or `mine` is captured as an `id` and fails UUID validation with a 400. Put static paths first and parameterized paths after.

### 8. Seed

Only needed for a **new permission**. Add it to the `PERMISSIONS` constant, then to the permission list and role mapping in `prisma/seed.ts`, and rerun `pnpm prisma:seed`. The seed is idempotent. This example reuses `posts:read`, so nothing changes.

### 9. Test

Tests go through the real app with Supertest. Create users with the helpers, and cover at least: unauthenticated (401), unauthorized (403), the happy path, validation (400), and the rate limit (429).

```ts
// tests/post/post-list-mine.test.ts
import { describe, expect, it } from "vitest"
import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createPost, createUser } from "../helpers/db.js"

describe("GET /api/posts/mine", () => {
  it("returns 401 without a token", async () => {
    expect((await api().get(ROUTES.postMine)).status).toBe(401)
  })

  it("returns only the current user's posts", async () => {
    const me = await createUser()
    const other = await createUser()
    await createPost(me.userId, "mine")
    await createPost(other.userId, "theirs")

    const res = await api().get(ROUTES.postMine).set(authCookie(me))

    expect(res.status).toBe(200)
    expect(
      res.body.data.items.every((p: { authorId: string }) => p.authorId === me.userId),
    ).toBe(true)
  })
})
```

Add the path to `ROUTES` in `tests/helpers/app.ts` (`postMine: "/api/posts/mine"`).

Test tips:
- **Assert exact status codes.** `not.toBe(401)` hides bugs, and it once hid a route-ordering bug.
- **Mock the mailer** with `mockMailer()` in `beforeEach` for any route that sends email. Never call Resend from tests.
- **Rate-limit tests** use `expectRateLimited(send, limit)`, and the `limit` must match the route config.
- Users are created with `test+...@example.com` emails and deleted after each file.

### 10. Docs

Add the endpoint to the table at the top of [api-reference.md](./api-reference.md) and give it a section: request, response, error cases and rate limit.

## Final check

```bash
pnpm check   # lint, format and typecheck
pnpm test
```

## Next

- [architecture.md](./archicteture.md) for why the layers are split this way
- [testing.md](./testing.md) for the test setup and helpers
- [api-reference.md](./api-reference.md) to document the new endpoint