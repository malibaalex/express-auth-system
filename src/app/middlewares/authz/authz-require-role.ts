import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

// Requires ANY of the listed roles
class RequireRole extends BaseMiddleWare {
  constructor(private readonly allowed: string[]) {
    super()
  }

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.access) {
      this.respond(res, "UNAUTHORIZED", { message: "authentication required" })
      return
    }

    if (!req.access.roles.some((role) => this.allowed.includes(role))) {
      this.respond(res, "FORBIDDEN", { message: "insufficient role" })
      return
    }

    next()
  }
}

export default RequireRole
