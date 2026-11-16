import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class PasswordResetValidator extends BaseMiddleWare {
  schema = this.z.object({
    email: this.z
      .string()
      .trim()
      .toLowerCase()
      .pipe(this.z.email("invalid email address")),
    code: this.z.string().regex(/^\d{6}$/, "code must be 6 digits"),
    password: this.z
      .string()
      .min(8, "password must be at least 8 characters")
      .max(128, "password is too long"),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default PasswordResetValidator
