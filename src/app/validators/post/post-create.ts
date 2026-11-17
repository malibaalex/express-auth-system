import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class PostCreateValidator extends BaseMiddleWare {
  schema = this.z.object({
    title: this.z.string().trim().min(1, "title is required").max(150),
    content: this.z.string().trim().min(1, "content is required").max(10_000),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.bodyHandler(req, res, next, this.schema)
  }
}

export default PostCreateValidator
