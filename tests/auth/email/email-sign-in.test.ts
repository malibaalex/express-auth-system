import { beforeEach, describe, expect, it } from "vitest"
import {
  api,
  cookieNamed,
  expectRateLimited,
  newUser,
  ROUTES,
  setCookies,
} from "../../helpers/app.js"
import { createUser, refreshCount, TEST_PASSWORD } from "../../helpers/db.js"
import { mockMailer } from "../../helpers/mail.js"

const INVALID_HINT = "invalid email or password"

describe("POST /api/auth/sign-in", () => {
  let mail: ReturnType<typeof mockMailer>
  beforeEach(() => {
    mail = mockMailer()
  })

  const send = (body: object) => api().post(ROUTES.signin).send(body)

  describe("success", () => {
    it("logs in and sets both cookies", async () => {
      const user = await createUser()
      const res = await send({ email: user.email, password: TEST_PASSWORD })

      expect(res.status).toBe(200)
      expect(cookieNamed(res, "access_token")).toContain("HttpOnly")
      expect(cookieNamed(res, "refresh_token")).toContain("HttpOnly")
      expect(cookieNamed(res, "refresh_token")).toContain("Path=/api/auth")
    })

    it("returns the public user with roles and permissions", async () => {
      const user = await createUser()
      const res = await send({ email: user.email, password: TEST_PASSWORD })
      const body = res.body.data.user

      expect(body.userId).toBe(user.userId)
      expect(body.email).toBe(user.email)
      expect(body.roles).toEqual(["USER"])
      expect(body.permissions).toContain("posts:read")
      expect(body).not.toHaveProperty("password")
    })

    it("stores the refresh token (hashed) in the database", async () => {
      const user = await createUser()
      await send({ email: user.email, password: TEST_PASSWORD })

      expect(await refreshCount(user.userId)).toBe(1)
    })

    it("matches the email case-insensitively", async () => {
      const user = await createUser()
      const res = await send({
        email: user.email.toUpperCase(),
        password: TEST_PASSWORD,
      })
      expect(res.status).toBe(200)
    })
  })

  describe("credential failures", () => {
    it("returns 401 for a wrong password", async () => {
      const user = await createUser()
      const res = await send({ email: user.email, password: "wrong-password" })

      expect(res.status).toBe(401)
      expect(res.body.message).toContain(INVALID_HINT)
      expect(setCookies(res)).toHaveLength(0)
    })

    it("returns 401 for an unknown email", async () => {
      const res = await send(newUser())
      expect(res.status).toBe(401)
      expect(res.body.message).toContain(INVALID_HINT)
    })

    it("gives Google-only accounts the same response, with no OTP", async () => {
      const google = await createUser({ password: null })
      const wrong = await createUser()

      const a = await send({ email: google.email, password: "whatever123" })
      const b = await send({ email: wrong.email, password: "whatever123" })

      expect(a.status).toBe(401)
      expect(a.body.message).toBe(b.body.message) // no account-type leak
      expect(mail.spy).not.toHaveBeenCalled()
    })
  })

  describe("account state (revealed only after a correct password)", () => {
    it("returns 403 for an unverified email and issues no tokens", async () => {
      const user = await createUser({ emailVerified: false })
      const res = await send({ email: user.email, password: TEST_PASSWORD })

      expect(res.status).toBe(403)
      expect(res.body.message).toBe("email not verified")
      expect(setCookies(res)).toHaveLength(0)
    })

    it("returns 403 for a disabled account", async () => {
      const user = await createUser({ status: false })
      const res = await send({ email: user.email, password: TEST_PASSWORD })

      expect(res.status).toBe(403)
      expect(res.body.message).toBe("account disabled")
    })

    it("does not reveal disabled/unverified state for a wrong password", async () => {
      const user = await createUser({ status: false })
      const res = await send({ email: user.email, password: "wrong-password" })

      expect(res.status).toBe(401)
    })
  })

  describe("validation", () => {
    it.each([
      ["invalid email", { email: "nope", password: "secret123" }],
      ["missing password", { email: "a@example.com" }],
      ["empty body", {}],
    ])("returns 400 for %s", async (_name, body) => {
      const res = await send(body)
      expect(res.status).toBe(400)
    })
  })

  describe("rate limiting", () => {
    it("returns 429 after exceeding the rate limit", async () => {
      const body = {
        email: newUser().email,
        password: "secret123",
      }

      await expectRateLimited(() => send(body), 10)
    })
  })
})
