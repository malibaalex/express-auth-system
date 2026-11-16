import { Request, Response, CookieOptions } from "express"
import { Env } from "./utils-env.js"

type CookieEnv = Pick<
  Env,
  | "NODE_ENV"
  | "JWT_ACCESS_SECRET_KEY_EXPIRES_IN"
  | "JWT_REFRESH_SECRET_KEY_EXPIRES_IN"
>

interface ExtendedCookieOptions extends CookieOptions {
  signed?: boolean
}

class CookieUtils {
  private readonly accessOptions: CookieOptions
  private readonly refreshOptions: CookieOptions
  private readonly stateOptions: ExtendedCookieOptions

  constructor(private readonly env: CookieEnv) {
    const base: CookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    }
    this.accessOptions = { ...base, path: "/api" }
    this.refreshOptions = { ...base, path: "/api/auth" }
    // lax: must survive the cross-site redirect back from Google
    this.stateOptions = {
      ...base,
      sameSite: "lax",
      path: "/api/auth",
      signed: true,
    }
  }

  /** Sets the short-lived signed OAuth state cookie (10 minutes). */
  setStateCookie(res: Response, state: string): void {
    res.cookie("oauth_state", state, {
      ...this.stateOptions,
      maxAge: 10 * 60 * 1000,
    })
  }

  /** Reads the signed OAuth state cookie, or null if missing or tampered with. */
  readStateCookie(req: Request): string | null {
    const value = (req.signedCookies as Record<string, unknown> | undefined)
      ?.oauth_state
    return typeof value === "string" ? value : null
  }

  /** Clears the OAuth state cookie. */
  clearStateCookie(res: Response): void {
    res.clearCookie("oauth_state", this.stateOptions)
  }

  /**
- Sets the access token HTTP-only cookie on the response.
- Multiplies the environment expiration time by 1000 to convert seconds to milliseconds.
   */
  setAccessCookie(res: Response, token: string): void {
    res.cookie("access_token", token, {
      ...this.accessOptions,
      maxAge: this.env.JWT_ACCESS_SECRET_KEY_EXPIRES_IN * 1000,
    })
  }

  /**
- Sets the refresh token HTTP-only cookie on the response.
- Multiplies the environment expiration time by 1000 to convert seconds to milliseconds.
   */
  setRefreshCookie(res: Response, token: string): void {
    res.cookie("refresh_token", token, {
      ...this.refreshOptions,
      maxAge: this.env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN * 1000,
    })
  }

  /**
- Clears both access and refresh authentication cookies from the response.
- Uses the predefined access and refresh options to ensure proper path matching.
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie("access_token", this.accessOptions)
    res.clearCookie("refresh_token", this.refreshOptions)
  }
}

export default CookieUtils
