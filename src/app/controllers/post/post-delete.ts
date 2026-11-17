import BaseControlller from "@/core/base/controller/base-controller.js"
import { Request, Response } from "express"

class PostDeleteController extends BaseControlller {
  protected async module(req: Request, res: Response): Promise<void> {
    const deleted = await this.Services.Post.Delete.call({ id: req.post!.id })
    if (!deleted) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "SUCCESS", { message: "post deleted" })
  }
}

export default PostDeleteController
