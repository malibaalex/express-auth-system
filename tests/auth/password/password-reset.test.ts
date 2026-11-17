import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/database/system/db.js"
import {
  api,
  expectRateLimited,
  isCleared,
  newUser,
  ROUTES,
} from "../../helpers/app.js"
import {
  createOtp,
  createRefreshToken,
  createUser,
  refreshCount,
  TEST_PASSWORD,
} from "../../helpers/db.js"
import { mockMailer } from "../../helpers/mail.js"

const NEW_PASSWORD = "brand-new-password"

describe("POST /api/auth/password/reset", () => {
  beforeEach(() => {
    mockMailer()
  })

  const reset = (email: string, code: string, password = NEW_PASSWORD) =>
    api().post(ROUTES.passwordReset).send({ email, code, password })

  const login = (email: string, password: string) =>
    api().post(ROUTES.signin).send({ email, password })

  describe("success", () => {
    it("changes the password, consumes the code and clears cookies", async () => {
      const user = await createUser()
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })

      const res = await reset(user.email, "654321")

      expect(res.status).toBe(200)
      expect(isCleared(res, "access_token")).toBe(true)
      expect(isCleared(res, "refresh_token")).toBe(true)
      expect(
        await prisma.emailOtp.count({ where: { userId: user.userId } }),
      ).toBe(0)

      expect((await login(user.email, NEW_PASSWORD)).status).toBe(200)
      expect((await login(user.email, TEST_PASSWORD)).status).toBe(401)
    })

    it("logs out every device", async () => {
      const user = await createUser()
      await createRefreshToken(user.userId)
      await createRefreshToken(user.userId)
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })
      expect(await refreshCount(user.userId)).toBe(2)

      await reset(user.email, "654321")

      expect(await refreshCount(user.userId)).toBe(0)
    })

    it("lets a Google-only user set a first password", async () => {
      const user = await createUser({ password: null })
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })

      expect((await login(user.email, NEW_PASSWORD)).status).toBe(401)

      await reset(user.email, "654321")

      expect((await login(user.email, NEW_PASSWORD)).status).toBe(200)
    })

    it("cannot reuse the same code twice", async () => {
      const user = await createUser()
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })

      await reset(user.email, "654321")
      const again = await reset(user.email, "654321", "another-password-1")

      expect(again.status).toBe(400)
    })
  })

  describe("rejections", () => {
    it("returns 400 for a wrong code and leaves the password unchanged", async () => {
      const user = await createUser()
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })

      const res = await reset(user.email, "000000")

      expect(res.status).toBe(400)
      expect((await login(user.email, TEST_PASSWORD)).status).toBe(200)
    })

    it("rejects a signup code used as a reset code", async () => {
      const user = await createUser()
      await createOtp(user.userId, { code: "654321", purpose: "VERIFY_EMAIL" })

      const res = await reset(user.email, "654321")

      expect(res.status).toBe(400)
      expect((await login(user.email, TEST_PASSWORD)).status).toBe(200)
    })

    it("returns 400 for an expired code", async () => {
      const user = await createUser()
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() - 1000),
      })

      expect((await reset(user.email, "654321")).status).toBe(400)
    })

    it("locks the code after too many attempts", async () => {
      const user = await createUser()
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })

      for (let i = 0; i < 5; i++) {
        expect((await reset(user.email, "000000")).status).toBe(400)
      }

      expect((await reset(user.email, "654321")).status).toBe(429)
      expect((await login(user.email, TEST_PASSWORD)).status).toBe(200)
    })

    it("returns 400 for unknown, pending and disabled accounts", async () => {
      const pending = await createUser({ emailVerified: false })
      const disabled = await createUser({ status: false })
      await createOtp(pending.userId, { purpose: "PASSWORD_RESET" })
      await createOtp(disabled.userId, { purpose: "PASSWORD_RESET" })

      for (const email of [newUser().email, pending.email, disabled.email]) {
        expect((await reset(email, "123456")).status).toBe(400)
      }
    })

    it("returns 400 for a weak new password", async () => {
      const user = await createUser()
      await createOtp(user.userId, {
        code: "654321",
        purpose: "PASSWORD_RESET",
      })

      expect((await reset(user.email, "654321", "short")).status).toBe(400)
    })
  })

  it("returns 429 after exceeding the rate limit", async () => {
    const { email } = newUser()
    await expectRateLimited(() => reset(email, "123456"), 10)
  })
})
