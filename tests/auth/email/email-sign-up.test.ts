// tests/auth/register.test.ts
import { beforeEach, describe, expect, it } from "vitest"
import {
  api,
  expectRateLimited,
  newUser,
  ROUTES,
  setCookies,
} from "../../helpers/app.js"
import { findUser, rolesOf } from "../../helpers/db.js"
import { mockMailer } from "../../helpers/mail.js"

describe("POST /api/auth/sign-up", () => {
  let mail: ReturnType<typeof mockMailer>
  beforeEach(() => {
    mail = mockMailer()
  })

  const send = (body: object) => api().post(ROUTES.signup).send(body)

  it("creates a pending user and sends a verification code", async () => {
    const user = newUser()
    const res = await send(user)

    expect(res.status).toBe(201)
    expect(res.body.data.email).toBe(user.email)

    const saved = await findUser(user.email)
    expect(saved).not.toBeNull()
    expect(saved!.emailVerified).toBe(false)
    expect(saved!.profile?.fullName).toBe(user.fullName)

    expect(mail.spy).toHaveBeenCalledTimes(1)
    expect(mail.codeFor(user.email)).toMatch(/^\d{6}$/)
    expect(mail.spy.mock.calls[0][2]).toBe("verification")
  })

  it("does not issue any tokens", async () => {
    const res = await send(newUser())
    expect(setCookies(res)).toHaveLength(0)
  })

  it("stores a hashed password, never the plain one", async () => {
    const user = newUser()
    await send(user)

    const saved = await findUser(user.email)
    expect(saved!.password).not.toBe(user.password)
    expect(saved!.password).toMatch(/^\$argon2id\$/)
  })

  it("assigns the default USER role", async () => {
    const user = newUser()
    await send(user)

    const saved = await findUser(user.email)
    expect(await rolesOf(saved!.userId)).toEqual(["USER"])
  })

  it("normalizes the email", async () => {
    const user = newUser()
    const res = await send({
      ...user,
      email: `  ${user.email.toUpperCase()}  `,
    })

    expect(res.status).toBe(201)
    expect(await findUser(user.email)).not.toBeNull()
  })

  it("returns 409 when the email is already registered", async () => {
    const user = newUser()
    await send(user)

    const res = await send(user)
    expect(res.status).toBe(409)
  })

  it.each([
    ["invalid email", { email: "not-an-email", password: "secret123" }],
    ["short password", { email: "a@example.com", password: "short" }],
    ["missing password", { email: "a@example.com" }],
    ["missing email", { password: "secret123" }],
  ])("returns 400 for %s", async (_name, body) => {
    const res = await send(body)
    expect(res.status).toBe(400)
  })

  it("returns 429 after exceeding the rate limit", async () => {
    const user = newUser() // the limiter keys on ip + email
    await expectRateLimited(() => send(user), 5)
  })
})
