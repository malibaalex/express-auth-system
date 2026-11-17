import { describe, expect, it } from "vitest"

import { api, ROUTES } from "../helpers/app.js"
import { authCookie, createUser } from "../helpers/db.js"

const body = { title: "Hello", content: "World" }

describe("Posts: permissions", () => {
  it("returns 403 for a user with no roles", async () => {
    const nobody = await createUser({ roles: [] })

    const read = await api().get(ROUTES.postList).set(authCookie(nobody))

    const create = await api()
      .post(ROUTES.postCreate)
      .set(authCookie(nobody))
      .send(body)

    expect(read.status).toBe(403)
    expect(create.status).toBe(403)
    expect(create.body.message).toBe("insufficient permissions")
  })
})
