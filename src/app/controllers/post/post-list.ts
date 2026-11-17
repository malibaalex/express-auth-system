import { ValidatorTypes } from "@/app/validators/index.js"
import BaseControlller from "@/core/base/controller/base-controller.js"
import { Request, Response } from "express"

class PostListController extends BaseControlller {
  protected async module(req: Request, res: Response): Promise<void> {
    const { page, pageSize } =
      req.query as unknown as ValidatorTypes["Post"]["List"]

    const result = await this.Services.Post.List.call({ page, pageSize })
    if (!result) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "SUCCESS", {
      data: { items: result.items, page, pageSize, total: result.total },
    })
  }
}

export default PostListController
