import { randomInt } from "node:crypto"
import { Response } from "express"
import BaseControlller from "./base-controller.js"
import logger from "@/core/utils/utils-logger.js"
import { OTP, ROLES } from "@/core/utils/utils-constants.js"
import type { Access, UserWithProfile } from "@/types/user.js"
import { OtpPurpose } from "@/generated/prisma/enums.js"

export type SendOtpResult = "SENT" | "TOO_SOON" | "FAILED"

abstract class BaseAuthController extends BaseControlller {
  /** Safe user shape for responses (never includes the password hash). */
  protected publicUser(user: UserWithProfile, access: Access) {
    return {
      userId: user.userId,
      email: user.email,
      fullName: user.profile?.fullName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      emailVerified: user.emailVerified,
      roles: access.roles,
      permissions: access.permissions,
    }
  }

  protected async loadAccess(user: UserWithProfile): Promise<Access | null> {
    const userRoles = await this.Services.Authz.UserRole.FindByUserId.call({
      userId: user.userId,
    })
    return userRoles ? this.Utils.Access.from(userRoles) : null
  }

  /**
   * Gives a new user the USER role. A missing role (seed not run) or a DB
   * failure is logged but doesn't fail signup. The user simply has no
   * permissions, which is the safe default, and the seed can backfill.
   */
  protected async assignDefaultRole(user: UserWithProfile): Promise<void> {
    const { Authz } = this.Services

    const role = await Authz.Role.FindByName.call({ name: ROLES.USER })
    if (!role) {
      logger.error(
        { userId: user.userId },
        "Default role missing, run the seed",
      )
      return
    }

    await Authz.UserRole.Assign.call({ userId: user.userId, roleId: role.id })
  }

  /** Signs an access token for a user. */
  protected signAccessToken(user: UserWithProfile): string {
    return this.Utils.Token.signAccess({
      payload: {
        userId: user.userId,
        email: user.email,
        fullName: user.profile?.fullName ?? null,
        status: user.status,
        emailVerified: user.emailVerified,
      },
    })
  }

  protected async issueSession(
    res: Response,
    user: UserWithProfile,
  ): Promise<boolean> {
    const { Token, Cookie } = this.Utils
    const { Auth } = this.Services

    const accessToken = this.signAccessToken(user)
    const refreshToken = Token.signRefresh({ userId: user.userId })

    const saved = await Auth.RefreshToken.Save.call({
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

  protected async sendOtp(
    user: UserWithProfile,
    purpose: OtpPurpose,
  ): Promise<SendOtpResult> {
    const { OtpHasher, Mailer } = this.Utils
    const { Auth } = this.Services

    const latest = await Auth.EmailOtp.FindLatest.call({
      userId: user.userId,
      purpose,
    })
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < OTP.RESEND_COOLDOWN_MS
    ) {
      return "TOO_SOON"
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0")

    const saved = await Auth.EmailOtp.Replace.call({
      userId: user.userId,
      purpose,
      codeHash: OtpHasher.hash(code),
      expiresAt: new Date(Date.now() + OTP.TTL_MS),
    })
    if (!saved) return "FAILED"

    try {
      await Mailer.sendOtpEmail(
        user.email,
        code,
        purpose === "PASSWORD_RESET" ? "password_reset" : "verification",
      )
    } catch (error) {
      logger.error({ err: error }, "Failed to send otp email")
      await Auth.EmailOtp.DeleteByUserId.call({ userId: user.userId, purpose })
      return "FAILED"
    }

    return "SENT"
  }
}

export default BaseAuthController
