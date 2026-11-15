import { createHash, randomUUID } from "crypto"
import jwt from "jsonwebtoken"
import type { Request } from "express"
import type { Env } from "./utils-env.js"
import {
  AccessPayload,
  JwtPayload,
  RefreshPayload,
  VerifiedRefreshPayload,
} from "@/types/user.js"

type JwtEnv = Pick<
  Env,
  | "JWT_ACCESS_SECRET_KEY"
  | "JWT_ACCESS_SECRET_KEY_EXPIRES_IN"
  | "JWT_REFRESH_SECRET_KEY"
  | "JWT_REFRESH_SECRET_KEY_EXPIRES_IN"
>

export type ExtractResult = { token: string; source: "cookie" | "header" }

class TokenUtils {
  constructor(private readonly env: JwtEnv) {}

  /**
   * Generates a signed access token JWT using the configured access secret and expiration time.
   */
  signAccess(payload: AccessPayload): string {
    return jwt.sign(payload, this.env.JWT_ACCESS_SECRET_KEY, {
      expiresIn: this.env.JWT_ACCESS_SECRET_KEY_EXPIRES_IN,
    })
  }

  /**
   * Generates a signed refresh token JWT including a unique token ID using the refresh secret.
   */
  signRefresh(payload: RefreshPayload): string {
    return jwt.sign(payload, this.env.JWT_REFRESH_SECRET_KEY, {
      expiresIn: this.env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN,
      jwtid: randomUUID(), // guarantees a unique token even within the same second
    })
  }

  /**
   * Verifies an access token string using the access secret and returns the decoded payload.
   * Returns null if verification fails or the token is invalid.
   */
  verifyAccess(token: string): JwtPayload | null {
    return this.verify<JwtPayload>(token, this.env.JWT_ACCESS_SECRET_KEY)
  }

  /**
   * Verifies a refresh token string using the refresh secret and returns the decoded payload.
   * Returns null if verification fails or the token is invalid.
   */
  verifyRefresh(token: string): VerifiedRefreshPayload | null {
    return this.verify<VerifiedRefreshPayload>(
      token,
      this.env.JWT_REFRESH_SECRET_KEY,
    )
  }

  /**
   * Extracts an access token from request cookies or the Authorization header.
   * Returns the token string alongside its source type, or null if neither is found.
   */
  extractAccess(req: Request): ExtractResult | null {
    const fromCookie = (req.cookies as Record<string, unknown> | undefined)
      ?.access_token
    if (typeof fromCookie === "string") {
      return { token: fromCookie, source: "cookie" }
    }

    const authorization = req.headers.authorization || ""
    if (authorization.startsWith("Bearer ")) {
      return { token: authorization.slice(7), source: "header" }
    }

    return null
  }

  /**
   * Extracts a refresh token string from request cookies.
   * Returns null if the cookie is missing or not a string.
   */
  extractRefresh(req: Request): string | null {
    const fromCookie = (req.cookies as Record<string, unknown> | undefined)
      ?.refresh_token
    return typeof fromCookie === "string" ? fromCookie : null
  }

  /**
   * Helper method to verify a JWT string against a specified secret key.
   * Catches verification exceptions and returns null on failure.
   */
  private verify<T>(token: string, secret: string): T | null {
    try {
      const decoded = jwt.verify(token, secret)
      if (!decoded || typeof decoded === "string") return null
      return decoded as unknown as T
    } catch {
      return null
    }
  }

  /**
   * Generates a SHA-256 hash of a refresh token for secure database storage.
   */
  hashRefresh(token: string): string {
    return createHash("sha256").update(token).digest("hex")
  }
}

export default TokenUtils