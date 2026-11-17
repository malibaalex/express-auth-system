import request from "supertest"
import { expect } from "vitest"

import App from "@/app/app.js"
import routes from "@/app/routes/index.js"

const app = new App(routes).instance

export const api = () => request(app)
export const browser = () => request.agent(app)

export const ROUTES = {
  googleRedirect: "/api/auth/google/redirect",
  googleCallback: "/api/auth/google/callback",
  signup: "/api/auth/email/sign-up",
  signin: "/api/auth/email/sign-in",
  otpSend: "/api/auth/otp/send",
  otpVerify: "/api/auth/otp/verify",
  passwordForgot: "/api/auth/password/forgot",
  passwordReset: "/api/auth/password/reset",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",
  me: "/api/auth/me",

  postCreate: "/api/posts/create",
  postList: "/api/posts/list",
  post: (id: string) => `/api/posts/${id}`,
}

export const newUser = () => ({
  fullName: "John Doe",
  email: `test+${crypto.randomUUID()}@example.com`,
  password: "secret123",
})

// ---- cookie helpers -------------------------------------------------------

export const setCookies = (res: request.Response): string[] =>
  (res.headers["set-cookie"] as unknown as string[] | undefined) ?? []

export const cookieNamed = (res: request.Response, name: string) =>
  setCookies(res).find((c) => c.startsWith(`${name}=`))

export const cookieValue = (res: request.Response, name: string) =>
  cookieNamed(res, name)
    ?.split(";")[0]
    .slice(name.length + 1)

/** express.clearCookie sends `name=; Path=...; Expires=1970` */
export const isCleared = (res: request.Response, name: string) =>
  setCookies(res).some((cookie) => {
    if (!cookie.startsWith(`${name}=`)) return false

    const expires = cookie.match(/expires=([^;]+)/i)?.[1]

    return (
      cookie.startsWith(`${name}=;`) ||
      (expires !== undefined && new Date(expires).getTime() <= Date.now())
    )
  })

// ---- rate limiting --------------------------------------------------------

/**
 * Sends `limit` requests, then asserts the next one is 429.
 * Requests made earlier in the same file also count toward the bucket,
 * so the limit may trip a little early. The final assertion still holds.
 */
export const expectRateLimited = async (
  send: () => PromiseLike<request.Response>,
  limit: number,
) => {
  for (let i = 0; i < limit; i++) await send()
  const res = await send()
  expect(res.status).toBe(429)
  expect(res.headers["retry-after"]).toBeDefined()
}
