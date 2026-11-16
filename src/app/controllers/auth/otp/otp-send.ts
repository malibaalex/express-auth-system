import { ValidatorTypes } from "@/app/validators/index.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

class OtpSendController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { email } = req.body as ValidatorTypes["Auth"]["Otp"]["Send"]

    const user = await this.Services.User.FindByEmail.call({ email })

    // Only pending, enabled accounts get a code
    if (user && !user.emailVerified && user.status) {
      await this.sendOtp(user) // TOO_SOON and FAILED are intentionally silent
    }

    // Same answer whether or not the account exists, so this endpoint
    // can't be used to discover registered emails.
    this.respond(res, "SUCCESS", {
      message: "if the account is pending verification, a code was sent",
    })
  }
}

export default OtpSendController
