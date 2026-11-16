import { NextFunction, Request, Response } from "express"
import BaseMiddleWare from "@/core/base/base-middleware.js"
import { HTTP_MSG } from "@/core/utils/utils-constants.js"

class CheckEmailExists extends BaseMiddleWare {
  protected async middleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { email } = req.body as { email: string }

    const user = await this.Services.User.FindByEmail.call({ email })
    if (user) {
      this.respond(res, "CONFLICT", { message: HTTP_MSG.ALREADY_EXISTS })
      return
    }

    next()
  }
}

export default CheckEmailExists
