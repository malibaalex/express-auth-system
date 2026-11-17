import BaseControlller from "@/core/base/controller/base-controller.js"
import { Request, Response } from "express"

class PostGetController extends BaseControlller {
  protected async module(req: Request, res: Response): Promise<void> {
    const post = await this.Services.Post.FindById.call({
      id: String(req.params.id),
    })
    if (!post) {
      this.respond(res, "NOT_FOUND", { message: "post not found" })
      return
    }

    this.respond(res, "SUCCESS", { data: { post } })
  }
}

export default PostGetController
