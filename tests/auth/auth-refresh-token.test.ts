import jwt from "jsonwebtoken"
import { describe, expect, it } from "vitest"
import { Utils } from "@/core/utils/index.js"
import {
  api,
  cookieNamed,
  cookieValue,
  expectRateLimited,
  isCleared,
  ROUTES,
} from "../helpers/app.js"
import {
  createRefreshToken,
  createUser,
  hasRefreshToken,
  refreshCookie,
  refreshCount,
} from "../helpers/db.js"

describe("POST /api/auth/refresh", () => {
  const send = (token?: string) => {
    const req = api().post(ROUTES.refresh)
    return token ? req.set(refreshCookie(token)) : req
  }

  describe("success", () => {
    it("rotates the refresh token and issues a new access token", async () => {
      const user = await createUser()
      const old = await createRefreshToken(user.userId)

      const res = await send(old)

      expect(res.status).toBe(200)
      expect(cookieNamed(res, "access_token")).toBeDefined()

      const fresh = cookieValue(res, "refresh_token")!
      expect(fresh).toBeTruthy()
      expect(fresh).not.toBe(old)

      expect(await hasRefreshToken(old)).toBe(false)
      expect(await hasRefreshToken(fresh)).toBe(true)
    })

    it("returns the current user with roles and permissions", async () => {
      const user = await createUser()
      const res = await send(await createRefreshToken(user.userId))

      expect(res.body.data.user.userId).toBe(user.userId)
      expect(res.body.data.user.roles).toEqual(["USER"])
      expect(res.body.data.user.permissions).toContain("posts:read")
      expect(res.body.data.user).not.toHaveProperty("password")
    })

    it("accepts the rotated token on the next refresh", async () => {
      const user = await createUser()
      const first = await send(await createRefreshToken(user.userId))
      const second = await send(cookieValue(first, "refresh_token"))

      expect(second.status).toBe(200)
    })
  })

  describe("rejections", () => {
    it("returns 401 and clears cookies without a refresh cookie", async () => {
      const res = await send()

      expect(res.status).toBe(401)
      expect(isCleared(res, "access_token")).toBe(true)
      expect(isCleared(res, "refresh_token")).toBe(true)
    })

    it("returns 401 for a garbage token", async () => {
      expect((await send("not.a.jwt")).status).toBe(401)
    })

    it("returns 401 for a token signed with the wrong secret", async () => {
      const user = await createUser()
      const forged = jwt.sign({ userId: user.userId }, "wrong-secret")

      expect((await send(forged)).status).toBe(401)
    })

    it("returns 401 for a validly signed token that is not stored", async () => {
      const user = await createUser()
      const unstored = Utils.Token.signRefresh({ userId: user.userId })

      expect((await send(unstored)).status).toBe(401)
    })

    it("treats a replayed token as theft and revokes every session", async () => {
      const user = await createUser()
      const stolen = await createRefreshToken(user.userId)
      const other = await createRefreshToken(user.userId)

      expect((await send(stolen)).status).toBe(200) // legitimate rotation
      expect((await send(stolen)).status).toBe(401) // replay

      expect(await hasRefreshToken(other)).toBe(false)
      expect(await refreshCount(user.userId)).toBe(0)
    })

    it("returns 401 and deletes the token for a disabled user", async () => {
      const user = await createUser({ status: false })
      const token = await createRefreshToken(user.userId)

      expect((await send(token)).status).toBe(401)
      expect(await hasRefreshToken(token)).toBe(false)
    })
  })

  it("returns 429 after exceeding the rate limit", async () => {
    await expectRateLimited(() => send(), 30)
  })
})
