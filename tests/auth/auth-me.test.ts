import jwt from "jsonwebtoken"
import { describe, expect, it } from "vitest"
import { prisma } from "@/database/system/db.js"
import { api, expectRateLimited, ROUTES } from "../helpers/app.js"
import { authCookie, createUser, tokenFor } from "../helpers/db.js"

describe("GET /api/auth/me", () => {
  const get = () => api().get(ROUTES.me)

  it("returns 401 without a token", async () => {
    expect((await get()).status).toBe(401)
  })

  it("returns 401 for a garbage token", async () => {
    const res = await get().set("Cookie", "access_token=garbage")
    expect(res.status).toBe(401)
  })

  it("returns 401 for a token signed with the wrong secret", async () => {
    const user = await createUser()
    const forged = jwt.sign(
      { payload: { userId: user.userId } },
      "wrong-secret",
    )

    const res = await get().set("Cookie", `access_token=${forged}`)
    expect(res.status).toBe(401)
  })

  it("returns 401 for an expired token", async () => {
    const user = await createUser()
    const expired = jwt.sign(
      { payload: { userId: user.userId } },
      process.env.JWT_ACCESS_SECRET_KEY!,
      { expiresIn: -10 },
    )

    const res = await get().set("Cookie", `access_token=${expired}`)
    expect(res.status).toBe(401)
  })

  it("returns the user with roles and permissions", async () => {
    const user = await createUser({ fullName: "Jane Roe" })
    const res = await get().set(authCookie(user))

    expect(res.status).toBe(200)
    expect(res.body.data.user).toMatchObject({
      userId: user.userId,
      email: user.email,
      fullName: "Jane Roe",
      emailVerified: true,
      roles: ["USER"],
    })
    expect(res.body.data.user.permissions).toContain("posts:create")
    expect(res.body.data.user.permissions).not.toContain("posts:update:any")
    expect(res.body.data.user).not.toHaveProperty("password")
  })

  it("accepts a Bearer token in the Authorization header", async () => {
    const user = await createUser()
    const res = await get().set("Authorization", `Bearer ${tokenFor(user)}`)

    expect(res.status).toBe(200)
  })

  it("gives admins the admin permissions", async () => {
    const admin = await createUser({ roles: ["ADMIN"] })
    const res = await get().set(authCookie(admin))

    expect(res.status).toBe(200)
    expect(res.body.data.user.roles).toEqual(["ADMIN"])
    expect(res.body.data.user.permissions).toContain("posts:update:any")
  })

  it("returns 401 once the account is disabled, even with a valid token", async () => {
    const user = await createUser()
    const cookie = authCookie(user)

    await prisma.user.update({
      where: { userId: user.userId },
      data: { status: false },
    })

    expect((await get().set(cookie)).status).toBe(401)
  })

  it("reflects a role change on the very next request", async () => {
    const user = await createUser()
    const cookie = authCookie(user)

    expect((await get().set(cookie)).body.data.user.roles).toEqual(["USER"])

    const admin = await prisma.role.findUniqueOrThrow({
      where: { name: "ADMIN" },
    })

    await prisma.userRole.create({
      data: { userId: user.userId, roleId: admin.id },
    })

    const res = await get().set(cookie)

    expect(res.status).toBe(200)
    expect(res.body.data.user.roles).toContain("ADMIN")
  })

  it("returns 429 after exceeding the rate limit", async () => {
    await expectRateLimited(() => get(), 60)
  })
})
