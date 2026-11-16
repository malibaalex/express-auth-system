import { randomInt } from "node:crypto"
import { Response } from "express"
import BaseControlller from "./base-controller.js"
import logger from "@/core/utils/utils-logger.js"
import { OTP } from "@/core/utils/utils-constants.js"
import type { UserWithProfile } from "@/types/user.js"

export type SendOtpResult = "SENT" | "TOO_SOON" | "FAILED"

abstract class BaseAuthController extends BaseControlller {
  /** Safe user shape for responses (never includes the password hash). */
  protected publicUser(user: UserWithProfile) {
    return {
      userId: user.userId,
      email: user.email,
      fullName: user.profile?.fullName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      emailVerified: user.emailVerified,
    }
  }

  /**
   * Signs both tokens, stores the refresh token hash, and sets the cookies.
   * Returns false if the refresh token couldn't be saved.
   */
  protected async issueSession(
    res: Response,
    user: UserWithProfile,
  ): Promise<boolean> {
    const { Token, Cookie } = this.Utils

    const accessToken = Token.signAccess({
      payload: {
        userId: user.userId,
        email: user.email,
        fullName: user.profile?.fullName ?? null,
        status: user.status,
        emailVerified: user.emailVerified,
      },
    })
    const refreshToken = Token.signRefresh({ userId: user.userId })

    const saved = await this.Services.Auth.RefreshToken.Save.call({
      userId: user.userId,
      token: Token.hashRefresh(refreshToken),
    })
    if (!saved) return false

    Cookie.setAccessCookie(res, accessToken)
    Cookie.setRefreshCookie(res, refreshToken)
    return true
  }

  /**
   * Enforces the resend cooldown, creates a code, stores its hash, and emails it.
   * If the email fails, the stored code is deleted so the user can retry at once.
   */
  protected async sendOtp(user: UserWithProfile): Promise<SendOtpResult> {
    const { OtpHasher, Mailer } = this.Utils
    const { Auth } = this.Services

    const latest = await Auth.EmailOtp.FindLatest.call({ userId: user.userId })
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < OTP.RESEND_COOLDOWN_MS
    ) {
      return "TOO_SOON"
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0")

    const saved = await Auth.EmailOtp.Replace.call({
      userId: user.userId,
      codeHash: OtpHasher.hash(code),
      expiresAt: new Date(Date.now() + OTP.TTL_MS),
    })
    if (!saved) return "FAILED"

    try {
      await Mailer.sendOtpEmail(user.email, code, "verification")
    } catch (error) {
      logger.error({ err: error }, "Failed to send verification email")
      await Auth.EmailOtp.DeleteByUserId.call({ userId: user.userId })
      return "FAILED"
    }

    return "SENT"
  }
}

export default BaseAuthController
