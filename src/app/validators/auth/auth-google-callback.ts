import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

class GoogleCallbackValidator extends BaseMiddleWare {
  schema = this.z.object({
    state: this.z.string().min(1, "state is required"),
    code: this.z.string().min(1).optional(),
    error: this.z.string().optional(),
  })

  protected middleware(req: Request, res: Response, next: NextFunction): void {
    this.queryHandler(req, res, next, this.schema)
  }
}

export default GoogleCallbackValidator
