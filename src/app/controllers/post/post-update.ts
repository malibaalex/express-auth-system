import { ValidatorTypes } from "@/app/validators/index.js"
import BaseControlller from "@/core/base/controller/base-controller.js"
import { Request, Response } from "express"

class PostUpdateController extends BaseControlller {
  protected async module(req: Request, res: Response): Promise<void> {
    const post = await this.Services.Post.Update.call({
      id: req.post!.id, // loaded and authorized by PostWriteAccess
      data: req.body as ValidatorTypes["Post"]["Update"],
    })
    if (!post) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "SUCCESS", { data: { post } })
  }
}

export default PostUpdateController
