import { describe, expect, it } from "vitest"
import {
  api,
  cookieNamed,
  expectRateLimited,
  isCleared,
  ROUTES,
} from "../../../helpers/app.js"

/** Starts the flow to obtain a genuine state value and its signed cookie */
async function startFlow() {
  const res = await api().get(ROUTES.googleRedirect)
  const state = new URL(res.headers.location).searchParams.get("state")!
  const cookie = cookieNamed(res, "oauth_state")!.split(";")[0]
  return { state, cookie }
}

describe("GET /api/auth/google/callback", () => {
  it("returns 400 when state is missing", async () => {
    const res = await api().get(ROUTES.googleCallback).query({ code: "abc" })
    expect(res.status).toBe(400)
  })

  it("returns 403 when the state cookie is missing", async () => {
    const res = await api()
      .get(ROUTES.googleCallback)
      .query({ state: "forged", code: "abc" })

    expect(res.status).toBe(403)
    expect(res.body.message).toBe("invalid oauth state")
  })

  it("returns 403 when state does not match the cookie", async () => {
    const { cookie } = await startFlow()

    const res = await api()
      .get(ROUTES.googleCallback)
      .set("Cookie", cookie)
      .query({ state: "not-the-real-state", code: "abc" })

    expect(res.status).toBe(403)
  })

  it("returns 403 when the cookie is tampered with", async () => {
    const { state } = await startFlow()

    const res = await api()
      .get(ROUTES.googleCallback)
      .set("Cookie", `oauth_state=s%3A${state}.invalidsignature`)
      .query({ state, code: "abc" })

    expect(res.status).toBe(403)
  })

  it("returns 401 when the user cancels on Google's consent screen", async () => {
    const { state, cookie } = await startFlow()

    const res = await api()
      .get(ROUTES.googleCallback)
      .set("Cookie", cookie)
      .query({ state, error: "access_denied" })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe("google sign-in cancelled")
  })

  it("clears the state cookie after use, valid or not", async () => {
    const { state, cookie } = await startFlow()

    const res = await api()
      .get(ROUTES.googleCallback)
      .set("Cookie", cookie)
      .query({ state, error: "access_denied" })

    expect(isCleared(res, "oauth_state")).toBe(true)
  })

  it("returns 429 after exceeding the rate limit", async () => {
    await expectRateLimited(() => api().get(ROUTES.googleCallback), 20)
  })
})
