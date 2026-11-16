import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

// Requires ALL listed permissions
class RequirePermission extends BaseMiddleWare {
  constructor(private readonly required: string[]) {
    super()
  }

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    // No access means Authenticate didn't run first: a wiring mistake, so deny
    if (!req.access) {
      this.respond(res, "UNAUTHORIZED", { message: "authentication required" })
      return
    }

    const granted = new Set(req.access.permissions)
    if (!this.required.every((permission) => granted.has(permission))) {
      this.respond(res, "FORBIDDEN", { message: "insufficient permissions" })
      return
    }

    next()
  }
}

export default RequirePermission
