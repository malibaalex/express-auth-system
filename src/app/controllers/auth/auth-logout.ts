import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

class LogoutController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { Token, Cookie } = this.Utils

    const token = Token.extractRefresh(req)
    if (token) {
      await this.Services.Auth.RefreshToken.RevokeByHash.call({
        tokenHash: Token.hashRefresh(token),
      })
    }

    // Always clear and always succeed: logging out twice is not an error
    Cookie.clearAuthCookies(res)
    this.respond(res, "SUCCESS", { message: "logged out" })
  }
}

export default LogoutController
