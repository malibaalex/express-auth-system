import { Request, Response } from "express"
import { OTP } from "@/core/utils/utils-constants.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { ValidatorTypes } from "@/app/validators/index.js"

const INVALID = "invalid or expired code"
const PURPOSE = "PASSWORD_RESET"

class PasswordResetController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { email, code, password } =
      req.body as ValidatorTypes["Auth"]["Password"]["Reset"]
    const { User, Auth } = this.Services

    const user = await User.FindByEmail.call({ email })
    if (!user || !user.status || !user.emailVerified) {
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    const otp = await Auth.EmailOtp.FindLatest.call({
      userId: user.userId,
      purpose: PURPOSE,
    })
    if (!otp) {
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    if (otp.expiresAt < new Date()) {
      await Auth.EmailOtp.DeleteByUserId.call({
        userId: user.userId,
        purpose: PURPOSE,
      })
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    // Count the attempt BEFORE checking the code, so parallel guesses
    // can't exceed the limit.
    const counted = await Auth.EmailOtp.IncrementAttempts.call({ id: otp.id })
    if (!counted) {
      this.respond(res, "SERVER_ERROR")
      return
    }
    if (counted.attempts > OTP.MAX_ATTEMPTS) {
      await Auth.EmailOtp.DeleteByUserId.call({
        userId: user.userId,
        purpose: PURPOSE,
      })
      this.respond(res, "TOO_MANY_REQUESTS", {
        message: "too many attempts, request a new code",
      })
      return
    }

    if (!this.Utils.OtpHasher.verify(code, otp.codeHash)) {
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    const updated = await User.Update.call({
      userId: user.userId,
      data: { password: await this.Utils.Password.hash(password) },
    })
    if (!updated) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    await Auth.EmailOtp.DeleteByUserId.call({
      userId: user.userId,
      purpose: PURPOSE,
    })

    // Log out every device: anyone holding an old session loses it.
    await Auth.RefreshToken.RevokeByUserId.call({ userId: user.userId })
    this.Utils.Cookie.clearAuthCookies(res)

    this.respond(res, "SUCCESS", {
      message: "password updated, please sign in",
    })
  }
}

export default PasswordResetController
