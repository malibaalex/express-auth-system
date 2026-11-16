import { RequestHandler } from "express"
import Base from "@/core/base/base.js"
import { RateLimitOptions } from "@/types/app.js"
import RateLimitUtils from "../../utils/utils-rate-limit.js"

abstract class BaseRateLimiter extends Base {
  private readonly requests = new Map<string, number[]>()
  private readonly cleanupTimer: NodeJS.Timeout

  protected readonly options: RateLimitOptions

  /**
   * Configures rate limit parameters, validates limits, and initializes the interval timer for cleaning up expired entries
   */
  constructor(params: Parameters<RateLimitUtils["configure"]>[0]) {
    super()

    this.options = this.Utils.RateLimits.configure(params)

    if (this.options.limit < 1 || this.options.windowMs <= 0) {
      throw new Error("Invalid rate limiter configuration")
    }

    // Prevent memory leaks by periodically sweeping expired keys from the Map
    this.cleanupTimer = setInterval(
      () => {
        const now = Date.now()
        for (const [key, timestamps] of this.requests.entries()) {
          const validTimestamps = timestamps.filter(
            (time) => time > now - this.options.windowMs,
          )
          if (validTimestamps.length === 0) {
            this.requests.delete(key)
          } else {
            this.requests.set(key, validTimestamps)
          }
        }
      },
      Math.max(this.options.windowMs, 60_000),
    )

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * Express middleware that enforces request limits, sets standard rate limit headers, and responds with TOO_MANY_REQUESTS when exceeded
   */
  public middleware: RequestHandler = (req, res, next): void => {
    const now = Date.now()
    const key = this.options.keyGenerator?.(req) ?? req.ip ?? "unknown"
    const windowStart = now - this.options.windowMs

    const timestamps = (this.requests.get(key) ?? []).filter(
      (time) => time > windowStart,
    )

    if (timestamps.length >= this.options.limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((timestamps[0] + this.options.windowMs - now) / 1000),
      )

      res.setHeader("Retry-After", retryAfter)
      this.respond(res, "TOO_MANY_REQUESTS", {
        message: this.options.message,
      })

      return
    }

    timestamps.push(now)
    this.requests.set(key, timestamps)

    res.setHeader("RateLimit-Limit", this.options.limit)
    res.setHeader("RateLimit-Remaining", this.options.limit - timestamps.length)

    next()
  }

  /**
   * Clears the cleanup timer interval and purges all tracked rate limit records from memory
   */
  public destroy(): void {
    clearInterval(this.cleanupTimer)
    this.requests.clear()
  }
}

export default BaseRateLimiter
