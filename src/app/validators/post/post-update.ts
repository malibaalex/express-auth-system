import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class PostUpdateValidator extends BaseMiddleWare {
  schema = this.z
    .object({
      title: this.z.string().trim().min(1).max(150).optional(),
      content: this.z.string().trim().min(1).max(10_000).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "at least one field is required",
    })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default PostUpdateValidator
