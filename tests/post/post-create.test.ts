import { describe, expect, it } from "vitest"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createUser } from "../helpers/db.js"

const body = { title: "Hello", content: "World" }

describe("POST /api/posts/create", () => {
  it("creates a post owned by the current user", async () => {
    const user = await createUser()

    const res = await api()
      .post(ROUTES.postCreate)
      .set(authCookie(user))
      .send(body)

    expect(res.status).toBe(201)
    expect(res.body.data.post).toMatchObject({
      ...body,
      authorId: user.userId,
    })
  })

  it("ignores an authorId sent in the body", async () => {
    const user = await createUser()
    const other = await createUser()

    const res = await api()
      .post(ROUTES.postCreate)
      .set(authCookie(user))
      .send({
        ...body,
        authorId: other.userId,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.post.authorId).toBe(user.userId)
  })

  it.each([
    ["missing title", { content: "x" }],
    ["empty content", { title: "x", content: "" }],
    ["title too long", { title: "x".repeat(151), content: "x" }],
  ])("returns 400 for %s", async (_name, payload) => {
    const user = await createUser()

    const res = await api()
      .post(ROUTES.postCreate)
      .set(authCookie(user))
      .send(payload)

    expect(res.status).toBe(400)
  })
})
