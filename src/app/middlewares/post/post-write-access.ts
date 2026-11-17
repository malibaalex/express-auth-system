import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"

// Owner needs `ownPermission`. Anyone else needs `anyPermission`.
// On success the loaded post is attached to req.post, so the controller
// doesn't query it again.
class PostWriteAccess extends BaseMiddleWare {
  constructor(
    private readonly ownPermission: string,
    private readonly anyPermission: string,
  ) {
    super()
  }

  protected async middleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!req.currentUser || !req.access) {
      this.respond(res, "UNAUTHORIZED", { message: "authentication required" })
      return
    }

    const post = await this.Services.Post.FindById.call({
      id: String(req.params.id),
    })
    if (!post) {
      this.respond(res, "NOT_FOUND", { message: "post not found" })
      return
    }

    const granted = new Set(req.access.permissions)
    const isOwner = post.authorId === req.currentUser.userId
    const allowed = isOwner
      ? granted.has(this.ownPermission) || granted.has(this.anyPermission)
      : granted.has(this.anyPermission)

    if (!allowed) {
      this.respond(res, "FORBIDDEN", { message: "insufficient permissions" })
      return
    }

    req.post = post
    next()
  }
}

export default PostWriteAccess
