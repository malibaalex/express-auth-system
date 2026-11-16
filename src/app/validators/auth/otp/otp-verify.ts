import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class OtpVerifyValidator extends BaseMiddleWare {
  schema = this.z.object({
    email: this.z
      .string()
      .trim()
      .toLowerCase()
      .pipe(this.z.email("invalid email address")),
    code: this.z.string().regex(/^\d{6}$/, "code must be 6 digits"),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default OtpVerifyValidator
