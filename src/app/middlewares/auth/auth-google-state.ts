import { timingSafeEqual } from "node:crypto"
import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class GoogleStateMiddleware extends BaseMiddleWare {
  protected middleware(req: Request, res: Response, next: NextFunction): void {
    const expected = this.Utils.Cookie.readStateCookie(req)
    this.Utils.Cookie.clearStateCookie(res) // single use, valid or not

    const received = req.query.state

    if (
      !expected ||
      typeof received !== "string" ||
      received.length !== expected.length ||
      !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    ) {
      this.respond(res, "FORBIDDEN", { message: "invalid oauth state" })
      return
    }

    next()
  }
}

export default GoogleStateMiddleware
