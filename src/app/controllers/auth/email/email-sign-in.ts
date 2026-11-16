import { ValidatorTypes } from "@/app/validators/index.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

const INVALID = "invalid email or password"

class SignInController extends BaseAuthController {
  private dummyHash?: Promise<string>

  protected async module(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as ValidatorTypes["Auth"]["SignIn"]
    const { Password } = this.Utils

    const user = await this.Services.User.FindByEmail.call({ email })

    // Unknown email OR Google-only account: same response, same timing.
    // No OTP is ever sent from login.
    if (!user || !user.password) {
      this.dummyHash ??= Password.hash("dummy-password-for-timing")
      await Password.verify(await this.dummyHash, password)
      this.respond(res, "UNAUTHORIZED", { message: INVALID })
      return
    }

    if (!(await Password.verify(user.password, password))) {
      this.respond(res, "UNAUTHORIZED", { message: INVALID })
      return
    }

    // Only revealed after the password is proven correct
    if (!user.status) {
      this.respond(res, "FORBIDDEN", { message: "account disabled" })
      return
    }
    if (!user.emailVerified) {
      this.respond(res, "FORBIDDEN", { message: "email not verified" })
      return
    }

    if (!(await this.issueSession(res, user))) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "SUCCESS", { data: { user: this.publicUser(user) } })
  }
}

export default SignInController
