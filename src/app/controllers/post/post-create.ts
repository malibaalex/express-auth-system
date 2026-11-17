import { ValidatorTypes } from "@/app/validators/index.js"
import BaseControlller from "@/core/base/controller/base-controller.js"
import { Request, Response } from "express"

class PostCreateController extends BaseControlller {
  protected async module(req: Request, res: Response): Promise<void> {
    const { title, content } = req.body as ValidatorTypes["Post"]["Create"]

    const post = await this.Services.Post.Create.call({
      authorId: req.currentUser!.userId, // Authenticate guarantees it
      title,
      content,
    })
    if (!post) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "CREATED", { data: { post } })
  }
}

export default PostCreateController
