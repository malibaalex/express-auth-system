import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/database/system/db.js"
import {
  api,
  cookieNamed,
  expectRateLimited,
  newUser,
  ROUTES,
  setCookies,
} from "../../helpers/app.js"
import {
  createOtp,
  createUser,
  findUser,
  TEST_PASSWORD,
} from "../../helpers/db.js"
import { mockMailer } from "../../helpers/mail.js"

describe("POST /api/auth/otp/verify", () => {
  let mail: ReturnType<typeof mockMailer>
  beforeEach(() => {
    mail = mockMailer()
  })

  const verify = (email: string, code: string) =>
    api().post(ROUTES.otpVerify).send({ email, code })

  describe("success", () => {
    it("verifies the email, deletes the code and logs the user in", async () => {
      const user = await createUser({ emailVerified: false })
      await createOtp(user.userId, { code: "123456" })

      const res = await verify(user.email, "123456")

      expect(res.status).toBe(200)
      expect(res.body.data.user.emailVerified).toBe(true)
      expect(cookieNamed(res, "access_token")).toBeDefined()
      expect(cookieNamed(res, "refresh_token")).toBeDefined()

      expect((await findUser(user.email))!.emailVerified).toBe(true)
      expect(
        await prisma.emailOtp.count({ where: { userId: user.userId } }),
      ).toBe(0)
    })

    it("completes the full register, verify, login flow", async () => {
      const user = newUser()

      await api().post(ROUTES.signup).send(user)
      const code = mail.codeFor(user.email)!

      const verified = await verify(user.email, code)
      expect(verified.status).toBe(200)

      const login = await api()
        .post(ROUTES.signin)
        .send({ email: user.email, password: user.password })
      expect(login.status).toBe(200)
    })

    it("cannot be reused after a successful verification", async () => {
      const user = await createUser({ emailVerified: false })
      await createOtp(user.userId, { code: "123456" })

      await verify(user.email, "123456")
      const again = await verify(user.email, "123456")

      expect(again.status).toBe(400)
    })
  })

  describe("rejections", () => {
    it("returns 400 for a wrong code, counts the attempt, and stays pending", async () => {
      const user = await createUser({ emailVerified: false })
      await createOtp(user.userId, { code: "123456" })

      const res = await verify(user.email, "000000")

      expect(res.status).toBe(400)
      expect(setCookies(res)).toHaveLength(0)
      expect((await findUser(user.email))!.emailVerified).toBe(false)

      const otp = await prisma.emailOtp.findFirst({
        where: { userId: user.userId },
      })
      expect(otp!.attempts).toBe(1)
    })

    it("returns 400 for an expired code and deletes it", async () => {
      const user = await createUser({ emailVerified: false })
      await createOtp(user.userId, {
        code: "123456",
        expiresAt: new Date(Date.now() - 1000),
      })

      const res = await verify(user.email, "123456")

      expect(res.status).toBe(400)
      expect(
        await prisma.emailOtp.count({ where: { userId: user.userId } }),
      ).toBe(0)
    })

    it("returns 400 when no code was requested", async () => {
      const user = await createUser({ emailVerified: false })
      const res = await verify(user.email, "123456")
      expect(res.status).toBe(400)
    })

    it("returns 400 for an unknown email, an already verified user and a disabled user", async () => {
      const verified = await createUser()
      const disabled = await createUser({ emailVerified: false, status: false })
      await createOtp(verified.userId)
      await createOtp(disabled.userId)

      for (const email of [newUser().email, verified.email, disabled.email]) {
        const res = await verify(email, "123456")
        expect(res.status).toBe(400)
      }
    })

    it("rejects a password-reset code used as a signup code", async () => {
      const user = await createUser({ emailVerified: false })
      await createOtp(user.userId, {
        code: "123456",
        purpose: "PASSWORD_RESET",
      })

      const res = await verify(user.email, "123456")

      expect(res.status).toBe(400)
      expect((await findUser(user.email))!.emailVerified).toBe(false)
    })

    it("locks the code after too many attempts, even for the right code", async () => {
      const user = await createUser({ emailVerified: false })
      await createOtp(user.userId, { code: "123456" })

      for (let i = 0; i < 5; i++) {
        expect((await verify(user.email, "000000")).status).toBe(400)
      }

      const locked = await verify(user.email, "123456") // correct, too late
      expect(locked.status).toBe(429)
      expect((await findUser(user.email))!.emailVerified).toBe(false)

      // the code was deleted, so a new one must be requested
      expect((await verify(user.email, "123456")).status).toBe(400)
    })
  })

  describe("validation", () => {
    it.each(["12345", "1234567", "abcdef", ""])(
      "returns 400 for code %j",
      async (code) => {
        const res = await verify("a@example.com", code)
        expect(res.status).toBe(400)
      },
    )
  })

  it("returns 429 after exceeding the rate limit", async () => {
    const { email } = newUser()
    await expectRateLimited(() => verify(email, "123456"), 10)
  })

  it("keeps the password usable after verification", async () => {
    const user = await createUser({ emailVerified: false })
    await createOtp(user.userId, { code: "123456" })
    await verify(user.email, "123456")

    const login = await api()
      .post(ROUTES.signin)
      .send({ email: user.email, password: TEST_PASSWORD })
    expect(login.status).toBe(200)
  })
})
