import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

class RefreshTokenController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const { Token, Cookie } = this.Utils
    const { Auth, User } = this.Services

    const reject = (): void => {
      Cookie.clearAuthCookies(res)
      this.respond(res, "UNAUTHORIZED")
    }

    const oldToken = Token.extractRefresh(req)
    if (!oldToken) return reject()

    // Signature and expiry check, before touching the database
    const payload = Token.verifyRefresh(oldToken)
    if (!payload) return reject()

    const oldTokenHash = Token.hashRefresh(oldToken)
    const stored = await Auth.RefreshToken.FindByHash.call({
      tokenHash: oldTokenHash,
    })

    // Validly signed but not in the database: it was already rotated or
    // revoked, so it is being replayed. Treat it as theft and end every session.
    if (!stored) {
      await Auth.RefreshToken.RevokeByUserId.call({ userId: payload.userId })
      return reject()
    }

    if (
      stored.userId !== payload.userId ||
      stored.expiresAt < new Date() ||
      !stored.userId
    ) {
      await Auth.RefreshToken.RevokeByHash.call({ tokenHash: oldTokenHash })
      return reject()
    }

    // Fetch the full user object so we have profile data for token signing and response
    const user = await User.FindById.call({ userId: stored.userId })
    if (!user || !user.status) {
      await Auth.RefreshToken.RevokeByHash.call({ tokenHash: oldTokenHash })
      return reject()
    }

    const newToken = Token.signRefresh({ userId: stored.userId })

    const access = await this.loadAccess(user)
    if (!access) return reject()

    // Atomic: delete the old row and insert the new one together.
    const rotate = await Auth.RefreshToken.Rotate.call({
      userId: stored.userId,
      oldTokenHash,
      newTokenHash: Token.hashRefresh(newToken),
    })
    if (!rotate) return reject()

    Cookie.setAccessCookie(res, this.signAccessToken(user))
    Cookie.setRefreshCookie(res, newToken)

    this.respond(res, "SUCCESS", {
      data: { user: this.publicUser(user, access) },
    })
  }
}

export default RefreshTokenController
