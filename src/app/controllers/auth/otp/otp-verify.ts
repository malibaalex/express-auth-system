import { Request, Response } from "express"
import { OTP } from "@/core/utils/utils-constants.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { ValidatorTypes } from "@/app/validators/index.js"

const INVALID = "invalid or expired code"

class OtpVerifyController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body as ValidatorTypes["Auth"]["Otp"]["Verify"]
    const { User, Auth } = this.Services

    const user = await User.FindByEmail.call({ email })
    if (!user || user.emailVerified || !user.status) {
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    const otp = await Auth.EmailOtp.FindLatest.call({ userId: user.userId })
    if (!otp) {
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    if (otp.expiresAt < new Date()) {
      await Auth.EmailOtp.DeleteByUserId.call({ userId: user.userId })
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
      await Auth.EmailOtp.DeleteByUserId.call({ userId: user.userId }) // force a new code
      this.respond(res, "TOO_MANY_REQUESTS", {
        message: "too many attempts, request a new code",
      })
      return
    }

    if (!this.Utils.OtpHasher.verify(code, otp.codeHash)) {
      this.respond(res, "BAD_REQUEST", { message: INVALID })
      return
    }

    // The pending user becomes a verified user
    const verified = await User.Update.call({
      userId: user.userId,
      data: { emailVerified: true },
    })
    if (!verified) {
      this.respond(res, "SERVER_ERROR")
      return
    }
    await Auth.EmailOtp.DeleteByUserId.call({ userId: user.userId })

    if (!(await this.issueSession(res, verified))) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    this.respond(res, "SUCCESS", { data: { user: this.publicUser(verified) } })
  }
}

export default OtpVerifyController
