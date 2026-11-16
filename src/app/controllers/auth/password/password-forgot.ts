import { ValidatorTypes } from "@/app/validators/index.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

class PasswordForgotController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { email } = req.body as ValidatorTypes["Auth"]["Password"]["Forgot"]

    const user = await this.Services.User.FindByEmail.call({ email })

    // Only verified, enabled accounts get a code. This covers Google-only
    // users too: the code proves they own the inbox, then they set a first password.
    if (user && user.status && user.emailVerified) {
      await this.sendOtp(user, "PASSWORD_RESET") // TOO_SOON and FAILED stay silent
    }

    this.respond(res, "SUCCESS", {
      message: "if an account exists for this email, a reset code was sent",
    })
  }
}

export default PasswordForgotController
