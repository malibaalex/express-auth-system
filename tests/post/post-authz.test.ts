import { describe, expect, it } from "vitest"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createUser } from "../helpers/db.js"

const body = { title: "Hello", content: "World" }

describe("Posts: authentication", () => {
  it.each([
    ["GET", ROUTES.postList],
    ["POST", ROUTES.postCreate],
    ["GET", ROUTES.post(crypto.randomUUID())],
    ["PATCH", ROUTES.post(crypto.randomUUID())],
    ["DELETE", ROUTES.post(crypto.randomUUID())],
  ] as const)("%s %s accepts an authenticated user", async (method, url) => {
    const user = await createUser()
    const cookie = authCookie(user)

    let res

    switch (method) {
      case "GET":
        res = await api().get(url).set(cookie)
        break

      case "POST":
        res = await api().post(url).set(cookie).send(body)
        break

      case "PATCH":
        res = await api().patch(url).set(cookie).send(body)
        break

      case "DELETE":
        res = await api().delete(url).set(cookie)
        break
    }

    expect(res.status).not.toBe(401)
  })
})
