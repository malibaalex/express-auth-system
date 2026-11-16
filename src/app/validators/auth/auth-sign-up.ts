import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class SignUpValidator extends BaseMiddleWare {
  schema = this.z.object({
    email: this.z
      .string()
      .trim()
      .toLowerCase()
      .pipe(this.z.email("invalid email address")),
    password: this.z
      .string()
      .min(8, "password must be at least 8 characters")
      .max(128, "password is too long"),
    fullName: this.z.string().trim().min(1).max(100).optional(),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default SignUpValidator
