import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "@/database/system/db.js"
import { api, expectRateLimited, newUser, ROUTES } from "../../helpers/app.js"
import { createUser } from "../../helpers/db.js"
import { mockMailer } from "../../helpers/mail.js"

describe("POST /api/auth/password/forgot", () => {
  let mail: ReturnType<typeof mockMailer>
  beforeEach(() => {
    mail = mockMailer()
  })

  const send = (email: string) =>
    api().post(ROUTES.passwordForgot).send({ email })

  it("sends a reset code to a verified user", async () => {
    const user = await createUser()
    const res = await send(user.email)

    expect(res.status).toBe(200)
    expect(mail.spy).toHaveBeenCalledTimes(1)
    expect(mail.spy.mock.calls[0][2]).toBe("password_reset")

    const otp = await prisma.emailOtp.findFirst({
      where: { userId: user.userId },
    })
    expect(otp!.purpose).toBe("PASSWORD_RESET")
  })

  it("sends a code to a Google-only user so they can add a password", async () => {
    const user = await createUser({ password: null })
    await send(user.email)

    expect(mail.spy).toHaveBeenCalledTimes(1)
  })

  it("gives the same answer for unknown, pending and disabled accounts", async () => {
    const verified = await createUser()
    const pending = await createUser({ emailVerified: false })
    const disabled = await createUser({ status: false })

    const responses = [
      await send(verified.email),
      await send(newUser().email),
      await send(pending.email),
      await send(disabled.email),
    ]

    for (const res of responses) expect(res.status).toBe(200)
    expect(new Set(responses.map((r) => r.body.message)).size).toBe(1)
    expect(mail.spy).toHaveBeenCalledTimes(1) // only the verified user
  })

  it("enforces the resend cooldown silently", async () => {
    const user = await createUser()
    await send(user.email)
    const second = await send(user.email)

    expect(second.status).toBe(200)
    expect(mail.spy).toHaveBeenCalledTimes(1)
  })

  it("returns 400 for an invalid email", async () => {
    expect((await send("nope")).status).toBe(400)
  })

  it("returns 429 after exceeding the rate limit", async () => {
    const { email } = newUser()
    await expectRateLimited(() => send(email), 5)
  })
})
