import { randomBytes } from "node:crypto"
import { Request, Response } from "express"
import passport from "passport"
import Strategies from "@/core/strategie/index.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"

class GoogleRedirectController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const state = randomBytes(32).toString("base64url")
    this.Utils.Cookie.setStateCookie(res, state)

    passport.authenticate(Strategies.Google.name, {
      session: false,
      scope: ["profile", "email"],
      state,
    })(req, res, (error?: unknown) => {
      if (error) req.log.error({ err: error }, "Google redirect error")
    })
  }
}

export default GoogleRedirectController
