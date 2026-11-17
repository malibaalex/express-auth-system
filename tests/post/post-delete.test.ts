import { describe, expect, it } from "vitest"

import { prisma } from "@/database/system/db.js"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createPost, createUser } from "../helpers/db.js"

type User = Awaited<ReturnType<typeof createUser>>

const remove = (id: string, user: User) =>
  api().delete(ROUTES.post(id)).set(authCookie(user))

describe("DELETE /api/posts/:id", () => {
  it("lets the owner delete their post", async () => {
    const owner = await createUser()
    const post = await createPost(owner.userId)

    const res = await remove(post.id, owner)

    expect(res.status).toBe(200)

    expect(
      await prisma.post.findUnique({
        where: { id: post.id },
      }),
    ).toBeNull()
  })

  it("forbids another user and keeps the post", async () => {
    const owner = await createUser()
    const stranger = await createUser()
    const post = await createPost(owner.userId)

    const res = await remove(post.id, stranger)

    expect(res.status).toBe(403)

    expect(
      await prisma.post.findUnique({
        where: { id: post.id },
      }),
    ).not.toBeNull()
  })

  it("lets an admin delete anyone's post", async () => {
    const owner = await createUser()
    const admin = await createUser({ roles: ["ADMIN"] })
    const post = await createPost(owner.userId)

    const res = await remove(post.id, admin)

    expect(res.status).toBe(200)

    expect(
      await prisma.post.findUnique({
        where: { id: post.id },
      }),
    ).toBeNull()
  })

  it("returns 404 for an unknown post", async () => {
    const user = await createUser()

    const res = await remove(crypto.randomUUID(), user)

    expect(res.status).toBe(404)
  })
})
