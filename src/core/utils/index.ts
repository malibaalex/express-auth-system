import port from "./utils-port.js"
import { PasswordUtil } from "./utils-password.js"
import { env } from "./utils-env.js"
import CookieUtils from "./utils-cookies.js"
import OmitProperty from "./utils-omit-property.js"
import TokenUtils from "./utils-token.js"
import RateLimitUtils from "./utils-rate-limit.js"
import OtpHasherUtil from "./utils-otp.js"
import MailerUtil from "./utils-mailer.js"
import AccessUtils from "./utils-access.js"

export const Utils = {
  port,
  OmitProperty,
  Password: new PasswordUtil(),
  Token: new TokenUtils(env),
  Cookie: new CookieUtils(env),
  env,
  RateLimits: new RateLimitUtils(),
  OtpHasher: new OtpHasherUtil(),
  Mailer: new MailerUtil(),
  Access: new AccessUtils(),
} as const
