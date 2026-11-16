import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class UserAuth extends BaseMiddleWare {
  protected async middleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { Token } = this.Utils
    const { Authz, User } = this.Services

    const extracted = Token.extractAccess(req)
    if (!extracted) {
      this.respond(res, "UNAUTHORIZED", { message: "authentication required" })
      return
    }

    const decoded = Token.verifyAccess(extracted.token)
    if (!decoded) {
      this.respond(res, "UNAUTHORIZED", {
        message: "invalid or expired access token",
      })
      return
    }

    // Reload from the database: the token is a snapshot from login time
    const user = await User.FindById.call({
      userId: decoded.payload.userId,
    })
    if (!user || !user.status) {
      this.respond(res, "UNAUTHORIZED", {
        message: "user not found or inactive",
      })
      return
    }

    const userRoles = await Authz.Role.User.FindByUserId.call({
      userId: user.userId,
    })
    if (!userRoles) {
      // null is a DB error, not "no roles". Never treat it as an empty set.
      this.respond(res, "SERVER_ERROR")
      return
    }

    req.currentUser = user
    req.access = this.Utils.Access.from(userRoles)
    next()
  }
}

export default UserAuth
