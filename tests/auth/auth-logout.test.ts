import { describe, expect, it } from "vitest"
import { api, expectRateLimited, isCleared, ROUTES } from "../helpers/app.js"
import {
  createRefreshToken,
  createUser,
  hasRefreshToken,
  refreshCookie,
  refreshCount,
} from "../helpers/db.js"

describe("POST /api/auth/logout", () => {
  const send = (token?: string) => {
    const req = api().post(ROUTES.logout)
    return token ? req.set(refreshCookie(token)) : req
  }

  it("deletes the stored token and clears both cookies", async () => {
    const user = await createUser()
    const token = await createRefreshToken(user.userId)

    const res = await send(token)

    expect(res.status).toBe(200)
    expect(isCleared(res, "access_token")).toBe(true)
    expect(isCleared(res, "refresh_token")).toBe(true)
    expect(await hasRefreshToken(token)).toBe(false)
  })

  it("only ends the current session", async () => {
    const user = await createUser()
    const current = await createRefreshToken(user.userId)
    await createRefreshToken(user.userId)

    await send(current)

    expect(await refreshCount(user.userId)).toBe(1)
  })

  it("succeeds without a cookie", async () => {
    const res = await send()

    expect(res.status).toBe(200)
    expect(isCleared(res, "refresh_token")).toBe(true)
  })

  it("succeeds with a garbage cookie", async () => {
    expect((await send("garbage")).status).toBe(200)
  })

  it("makes the refresh token unusable afterwards", async () => {
    const user = await createUser()
    const token = await createRefreshToken(user.userId)

    await send(token)
    const refresh = await api().post(ROUTES.refresh).set(refreshCookie(token))

    expect(refresh.status).toBe(401)
  })

  it("returns 429 after exceeding the rate limit", async () => {
    await expectRateLimited(() => send(), 20)
  })
})
