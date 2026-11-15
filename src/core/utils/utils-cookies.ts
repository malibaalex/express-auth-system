import { Response, CookieOptions } from "express"
import { Env } from "./utils-env.js"

type CookieEnv = Pick<
  Env,
  | "NODE_ENV"
  | "JWT_ACCESS_SECRET_KEY_EXPIRES_IN"
  | "JWT_REFRESH_SECRET_KEY_EXPIRES_IN"
>

class CookieUtils {
  private readonly accessOptions: CookieOptions
  private readonly refreshOptions: CookieOptions

  /**
   * Initializes cookie options with strict security defaults based on the environment.
   * Sets separate paths for access and refresh tokens.
   */
  constructor(private readonly env: CookieEnv) {
    const base: CookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    }
    this.accessOptions = { ...base, path: "/api" }
    this.refreshOptions = { ...base, path: "/api/auth" }
  }

  /**
   * Sets the access token HTTP-only cookie on the response.
   * Multiplies the environment expiration time by 1000 to convert seconds to milliseconds.
   */
  setAccessCookie(res: Response, token: string): void {
    res.cookie("access_token", token, {
      ...this.accessOptions,
      maxAge: this.env.JWT_ACCESS_SECRET_KEY_EXPIRES_IN * 1000,
    })
  }

  /**
   * Sets the refresh token HTTP-only cookie on the response.
   * Multiplies the environment expiration time by 1000 to convert seconds to milliseconds.
   */
  setRefreshCookie(res: Response, token: string): void {
    res.cookie("refresh_token", token, {
      ...this.refreshOptions,
      maxAge: this.env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN * 1000,
    })
  }

  /**
   * Clears both access and refresh authentication cookies from the response.
   * Uses the predefined access and refresh options to ensure proper path matching.
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie("access_token", this.accessOptions)
    res.clearCookie("refresh_token", this.refreshOptions)
  }
}

export default CookieUtils