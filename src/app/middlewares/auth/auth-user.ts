import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class UserAuth extends BaseMiddleWare {
  protected async middleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const extracted = this.Utils.Token.extractAccess(req)
    if (!extracted) {
      this.respond(res, "UNAUTHORIZED", { message: "authentication required" })
      return
    }

    const decoded = this.Utils.Token.verifyAccess(extracted.token)
    if (!decoded) {
      this.respond(res, "UNAUTHORIZED", {
        message: "invalid or expired access token",
      })
      return
    }

    // Reload from the database: the token is a snapshot from login time
    const user = await this.Services.User.FindById.call({
      userId: decoded.payload.userId,
    })
    if (!user || !user.status) {
      this.respond(res, "UNAUTHORIZED", {
        message: "user not found or inactive",
      })
      return
    }

    req.currentUser = user
    next()
  }
}

export default UserAuth
