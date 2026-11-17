import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class PostListValidator extends BaseMiddleWare {
  schema = this.z.object({
    page: this.z.coerce.number().int().min(1).default(1),
    pageSize: this.z.coerce.number().int().min(1).max(50).default(10),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.queryHandler(req, res, next, this.schema)
  }
}

export default PostListValidator
