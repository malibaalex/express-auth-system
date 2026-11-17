import { describe, expect, it } from "vitest"

import { prisma } from "@/database/system/db.js"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createPost, createUser } from "../helpers/db.js"

type User = Awaited<ReturnType<typeof createUser>>

const patch = (id: string, user: User, payload: object) =>
  api().patch(ROUTES.post(id)).set(authCookie(user)).send(payload)

describe("PATCH /api/posts/:id", () => {
  it("lets the owner update their post", async () => {
    const owner = await createUser()
    const post = await createPost(owner.userId)

    const res = await patch(post.id, owner, {
      title: "Updated",
    })

    expect(res.status).toBe(200)
    expect(res.body.data.post.title).toBe("Updated")
  })

  it("forbids another user and leaves the post unchanged", async () => {
    const owner = await createUser()
    const stranger = await createUser()
    const post = await createPost(owner.userId, "Original")

    const res = await patch(post.id, stranger, {
      title: "Hacked",
    })

    expect(res.status).toBe(403)

    const unchanged = await prisma.post.findUnique({
      where: { id: post.id },
    })

    expect(unchanged!.title).toBe("Original")
  })

  it("lets an admin update anyone's post", async () => {
    const owner = await createUser()
    const admin = await createUser({ roles: ["ADMIN"] })
    const post = await createPost(owner.userId)

    const res = await patch(post.id, admin, {
      content: "Moderated",
    })

    expect(res.status).toBe(200)
    expect(res.body.data.post.content).toBe("Moderated")
  })

  it("returns 404 for an unknown post", async () => {
    const user = await createUser()

    const res = await patch(crypto.randomUUID(), user, {
      title: "x",
    })

    expect(res.status).toBe(404)
  })

  it("returns 400 for an empty body", async () => {
    const owner = await createUser()
    const post = await createPost(owner.userId)

    const res = await patch(post.id, owner, {})

    expect(res.status).toBe(400)
  })
})
