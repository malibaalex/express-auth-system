import { ValidatorTypes } from "@/app/validators/index.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

const INVALID = "invalid email or password"
const USE_GOOGLE =
  "this account uses Google sign-in. continue with Google, or reset your password to add email login"

class SignInController extends BaseAuthController {
  // Verifying against this when no real hash exists keeps response time
  // the same, so timing can't reveal which emails are registered.
  private dummyHash?: Promise<string>

  protected async module(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as ValidatorTypes["Auth"]["SignUp"]
    const { Password } = this.Utils

    const user = await this.Services.User.FindByEmail.call({ email })

    // Unknown email: stay generic and keep timing equal to a real check
    if (!user) {
      this.dummyHash ??= Password.hash("dummy-password-for-timing")
      await Password.verify(await this.dummyHash, password)
      this.respond(res, "UNAUTHORIZED", { message: INVALID })
      return
    }

    // Google-only account: no password to check, no OTP sent, clear prompt
    if (!user.password) {
      this.respond(res, "UNAUTHORIZED", {
        message: USE_GOOGLE,
        data: { code: "USE_GOOGLE" }, // lets the frontend show a Google button
      })
      return
    }

    if (!(await Password.verify(user.password, password))) {
      this.respond(res, "UNAUTHORIZED", { message: INVALID })
      return
    }

    // These are only revealed after the password is proven correct
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
