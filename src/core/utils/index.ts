import port from "./utils-port.js"
import { PasswordUtil } from "./utils-password.js"
import { env } from "./utils-env.js"
import CookieUtils from "./utils-cookies.js"
import OmitProperty from "./utils-omit-property.js"
import TokenUtils from "./utils-token.js"
import RateLimitUtils from "./utils-rate-limit.js"
import OtpHasherUtil from "./utils-otp.js"
import MailerUtil from "./utils-mailer.js"

const Token = new TokenUtils(env)
const Cookie = new CookieUtils(env)
const Password = new PasswordUtil()
const RateLimits = new RateLimitUtils()
const OtpHasher = new OtpHasherUtil()
const Mailer = new MailerUtil()

export const Utils = {
  port,
  OmitProperty,
  Password,
  Token,
  Cookie,
  env,
  RateLimits,
  OtpHasher,
  Mailer,
} as const