import { describe, expect, it } from "vitest"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createPost, createUser } from "../helpers/db.js"

describe("GET /api/posts/:id", () => {
  it("returns a post", async () => {
    const user = await createUser()
    const post = await createPost(user.userId)

    const res = await api().get(ROUTES.post(post.id)).set(authCookie(user))

    expect(res.status).toBe(200)
    expect(res.body.data.post.id).toBe(post.id)
  })

  it("returns 404 for an unknown id", async () => {
    const user = await createUser()

    const res = await api()
      .get(ROUTES.post(crypto.randomUUID()))
      .set(authCookie(user))

    expect(res.status).toBe(404)
  })

  it("returns 400 for a malformed id", async () => {
    const user = await createUser()

    const res = await api().get(ROUTES.post("not-a-uuid")).set(authCookie(user))

    expect(res.status).toBe(400)
  })
})
