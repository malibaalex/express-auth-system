import { NextFunction, Request, Response } from "express"
import { z } from "zod"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class ProfileUpdateValidator extends BaseMiddleWare {
  schema = this.z
    .object({
      fullName: this.z.string().trim().min(1).max(100).nullable().optional(),
      // https only: the client renders this as an image source
      avatarUrl: this.z
        .url({ protocol: /^https$/ })
        .max(2048)
        .nullable()
        .optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "at least one field is required",
    })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default ProfileUpdateValidator
