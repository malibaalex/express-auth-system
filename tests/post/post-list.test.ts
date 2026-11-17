import { describe, expect, it } from "vitest"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createPost, createUser } from "../helpers/db.js"

describe("GET /api/posts/list", () => {
  it("lists posts with pagination info", async () => {
    const user = await createUser()

    await createPost(user.userId, "first")
    await createPost(user.userId, "second")

    const res = await api().get(ROUTES.postList).set(authCookie(user))
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      page: 1,
      pageSize: 10,
    })
    expect(res.body.data.total).toBeGreaterThanOrEqual(2)
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2)
  })

  it("respects pageSize", async () => {
    const user = await createUser()

    await createPost(user.userId)
    await createPost(user.userId)

    const res = await api()
      .get(ROUTES.postList)
      .query({ pageSize: 1 })
      .set(authCookie(user))

    expect(res.status).toBe(200)
    expect(res.body.data.items).toHaveLength(1)
  })

  it.each([{ pageSize: 100 }, { page: 0 }, { page: "abc" }])(
    "returns 400 for query %j",
    async (query) => {
      const user = await createUser()

      const res = await api()
        .get(ROUTES.postList)
        .query(query)
        .set(authCookie(user))

      expect(res.status).toBe(400)
    },
  )
})
