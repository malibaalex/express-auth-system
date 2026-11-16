import { Request, Response } from "express"
import { HTTP_MSG } from "@/core/utils/utils-constants.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { ValidatorTypes } from "@/app/validators/index.js"

class SignUpController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { email, password, fullName } =
      req.body as ValidatorTypes["Auth"]["SignUp"]
    const { User } = this.Services

    const existing = await User.FindByEmail.call({ email })
    if (existing) {
      this.respond(res, "CONFLICT", { message: HTTP_MSG.ALREADY_EXISTS })
      return
    }

    const user = await User.Create.call({
      email,
      password: await this.Utils.Password.hash(password),
      emailVerified: false, // pending until the OTP is verified
      fullName: fullName ?? null,
    })
    if (user) await this.assignDefaultRole(user)
    if (!user) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    if ((await this.sendOtp(user, "VERIFY_EMAIL")) !== "SENT") {
      this.respond(res, "SERVER_ERROR", {
        message:
          "account created but the code could not be sent, request a new one",
      })
      return
    }

    this.respond(res, "CREATED", {
      message: "verification code sent",
      data: { email: user.email },
    })
  }
}

export default SignUpController
