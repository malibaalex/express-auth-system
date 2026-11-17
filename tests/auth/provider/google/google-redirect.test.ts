import { describe, expect, it } from "vitest"
import {
  api,
  cookieNamed,
  expectRateLimited,
  ROUTES,
} from "../../../helpers/app.js"

describe("GET /api/auth/google/redirect", () => {
  const send = () => api().get(ROUTES.googleRedirect)

  it("redirects to Google's authorization endpoint", async () => {
    const res = await send()
    expect(res.status).toBe(302)

    const url = new URL(res.headers.location)
    expect(url.origin).toBe("https://accounts.google.com")
    expect(url.pathname).toBe("/o/oauth2/v2/auth")
  })

  it("includes the required OAuth parameters", async () => {
    const res = await send()
    const params = new URL(res.headers.location).searchParams

    expect(params.get("client_id")).toBe(process.env.GOOGLE_CLIENT_ID)
    expect(params.get("redirect_uri")).toBe(process.env.GOOGLE_CALLBACK_URL)
    expect(params.get("response_type")).toBe("code")
    expect(params.get("scope")).toContain("profile")
    expect(params.get("scope")).toContain("email")
    expect(params.get("state")).toBeTruthy()
  })

  it("sets a signed, HttpOnly, lax state cookie scoped to /api/auth", async () => {
    const res = await send()
    const cookie = cookieNamed(res, "oauth_state")!

    expect(cookie).toBeDefined()
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("SameSite=Lax")
    expect(cookie).toContain("Path=/api/auth")
    expect(cookie.startsWith("oauth_state=s%3A")).toBe(true) // signed
  })

  it("binds the cookie to the state sent to Google", async () => {
    const res = await send()
    const state = new URL(res.headers.location).searchParams.get("state")!
    const raw = cookieNamed(res, "oauth_state")!.split(";")[0].split("=")[1]

    expect(decodeURIComponent(raw).startsWith(`s:${state}.`)).toBe(true)
  })

  it("uses a fresh state on every request", async () => {
    const a = new URL((await send()).headers.location).searchParams.get("state")
    const b = new URL((await send()).headers.location).searchParams.get("state")
    expect(a).not.toBe(b)
  })

  it("returns 429 after exceeding the rate limit", async () => {
    await expectRateLimited(send, 20) // must match the route config
  })
})
