import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/database/system/db.js"
import { api, expectRateLimited, newUser, ROUTES } from "../../helpers/app.js"
import { createOtp, createUser } from "../../helpers/db.js"
import { mockMailer } from "../../helpers/mail.js"

describe("POST /api/auth/otp/send", () => {
  let mail: ReturnType<typeof mockMailer>
  beforeEach(() => {
    mail = mockMailer()
  })

  const send = (email: string) => api().post(ROUTES.otpSend).send({ email })

  it("sends a code to a pending user", async () => {
    const user = await createUser({ emailVerified: false })
    const res = await send(user.email)

    expect(res.status).toBe(200)
    expect(mail.spy).toHaveBeenCalledTimes(1)
    expect(mail.codeFor(user.email)).toMatch(/^\d{6}$/)

    const otp = await prisma.emailOtp.findFirst({
      where: { userId: user.userId },
    })
    expect(otp!.purpose).toBe("VERIFY_EMAIL")
    expect(otp!.codeHash).not.toBe(mail.codeFor(user.email)) // stored hashed
  })

  it("enforces the resend cooldown", async () => {
    const user = await createUser({ emailVerified: false })
    await send(user.email)
    const second = await send(user.email)

    expect(second.status).toBe(200) // same response, nothing leaks
    expect(mail.spy).toHaveBeenCalledTimes(1)
  })

  it("replaces the previous code once the cooldown has passed", async () => {
    const user = await createUser({ emailVerified: false })
    await createOtp(user.userId, {
      createdAt: new Date(Date.now() - 2 * 60_000),
    })

    await send(user.email)

    expect(mail.spy).toHaveBeenCalledTimes(1)
    expect(
      await prisma.emailOtp.count({ where: { userId: user.userId } }),
    ).toBe(1)
  })

  it("gives the same answer for unknown, verified and disabled accounts", async () => {
    const verified = await createUser()
    const disabled = await createUser({ emailVerified: false, status: false })
    const pending = await createUser({ emailVerified: false })

    const responses = [
      await send(newUser().email),
      await send(verified.email),
      await send(disabled.email),
      await send(pending.email),
    ]

    for (const res of responses) expect(res.status).toBe(200)
    expect(new Set(responses.map((r) => r.body.message)).size).toBe(1)
    expect(mail.spy).toHaveBeenCalledTimes(1) // only the pending user
  })

  it("returns 400 for an invalid email", async () => {
    const res = await send("not-an-email")
    expect(res.status).toBe(400)
  })

  it("returns 429 after exceeding the rate limit", async () => {
    const email = newUser().email

    await expectRateLimited(() => send(email), 5)
  })
})
