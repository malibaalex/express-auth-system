import {
  Strategy as PassportGoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20"
import Base from "@/core/base/base.js"

export interface GoogleAuthProfile {
  providerAccountId: string // Google 'sub'
  email: string // trimmed + lowercased
  emailVerified: boolean
  fullName: string | null
  avatarUrl: string | null
}

class GoogleStrategy extends Base {
  public readonly name = "google"

  public readonly instance = new PassportGoogleStrategy(
    {
      clientID: this.Utils.env.GOOGLE_CLIENT_ID,
      clientSecret: this.Utils.env.GOOGLE_CLIENT_SECRET,
      callbackURL: this.Utils.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    (_accessToken, _refreshToken, profile, done) => this.verify(profile, done),
  )

  /**
   * Normalizes a Google profile into GoogleAuthProfile.
   * Fails authentication (no user) when Google returns no email.
   */
  private verify(profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase()
    if (!email) return done(null, false)

    const json = profile._json as { email_verified?: boolean }

    const result: GoogleAuthProfile = {
      providerAccountId: profile.id,
      email,
      emailVerified: json.email_verified === true,
      fullName: profile.displayName || null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    }

    done(null, result)
  }
}

export default GoogleStrategy
