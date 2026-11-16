import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class SignInValidator extends BaseMiddleWare {
  schema = this.z.object({
    email: this.z
      .string()
      .trim()
      .toLowerCase()
      .pipe(this.z.email("invalid email address")),
    password: this.z.string().min(1, "password is required").max(128),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default SignInValidator
