import { Request, Response } from "express"
import passport from "passport"
import Strategies from "@/core/strategie/index.js"
import { GoogleAuthProfile } from "@/core/strategie/strategy-google.js"
import type { UserWithProfile } from "@/types/user.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"

const PROVIDER = "google"

class GoogleCallbackController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    // The user pressed "Cancel" on Google's consent screen
    if (typeof req.query.error === "string") {
      this.respond(res, "UNAUTHORIZED", {
        message: "google sign-in cancelled",
      })
      return
    }

    const google = await this.authenticate(req, res)
    if (!google) {
      this.respond(res, "UNAUTHORIZED")
      return
    }

    // Never link or create an account from an email Google hasn't verified
    if (!google.emailVerified) {
      this.respond(res, "FORBIDDEN", {
        message: "google email is not verified",
      })
      return
    }

    const user = await this.resolveUser(google)
    if (!user) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    if (!user.status) {
      this.respond(res, "FORBIDDEN", { message: "account disabled" })
      return
    }

    if (!(await this.issueSession(res, user))) {
      this.respond(res, "SERVER_ERROR")
      return
    }
    res.redirect(this.Utils.env.APP_URL)
  }

  /**
   * Wraps Passport's callback style in a promise.
   * Resolves null when authentication fails (no email, bad code).
   */
  private authenticate(
    req: Request,
    res: Response,
  ): Promise<GoogleAuthProfile | null> {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        Strategies.Google.name,
        { session: false },
        (error: unknown, profile?: GoogleAuthProfile | false) => {
          if (error) return reject(error)
          resolve(profile || null)
        },
      )(req, res, reject)
    })
  }

  /**
   * The account decision: returning Google user, link to an existing
   * account, or brand new user. Returns null on any DB failure.
   */
  private async resolveUser(
    google: GoogleAuthProfile,
  ): Promise<UserWithProfile | null> {
    const { User, Auth } = this.Services
    const identity = {
      providerName: PROVIDER,
      providerAccountId: google.providerAccountId,
    }

    // Returning Google user
    const linked = await Auth.Provider.FindByAccount.call(identity)
    if (linked) {
      await Auth.Provider.Update.call({
        ...identity,
        data: { email: google.email },
      })
      return linked.user
    }

    const existing = await User.FindByEmail.call({ email: google.email })

    // Brand new user
    if (!existing) {
      const newUser = await User.Create.call({
        email: google.email,
        password: null,
        emailVerified: true,
        fullName: google.fullName,
        avatarUrl: google.avatarUrl,
        provider: { ...identity, email: google.email },
      })
      if (newUser) await this.assignDefaultRole(newUser)
      return newUser
    }

    // Email already registered: link Google to it
    const provider = await Auth.Provider.Create.call({
      userId: existing.userId,
      ...identity,
      email: google.email,
    })
    if (!provider) return null

    // Pending account: Google proved ownership of the email. Wipe the
    // password so whoever pre-registered it can't keep access.
    if (!existing.emailVerified) {
      const updated = await User.Update.call({
        userId: existing.userId,
        data: { emailVerified: true, password: null },
      })
      if (!updated) return null
    }

    // Fill in missing profile fields without overwriting existing ones
    const profile = existing.profile
    if (!profile?.fullName || !profile?.avatarUrl) {
      await User.Profile.Upsert.call({
        userId: existing.userId,
        fullName: profile?.fullName ? undefined : google.fullName,
        avatarUrl: profile?.avatarUrl ? undefined : google.avatarUrl,
      })
    }

    return await User.FindById.call({ userId: existing.userId })
  }
}

export default GoogleCallbackController
