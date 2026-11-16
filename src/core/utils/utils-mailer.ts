import { Resend } from "resend"
import { env } from "@/core/utils/utils-env.js"
import logger from "@/core/utils/utils-logger.js"

class MailerUtil {
  private resend: Resend

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY)
  }

  /**
- Dispatches an OTP email for either account verification or password resets.
- Throws an error if the Resend API returns a delivery failure.
   */
  public async sendOtpEmail(
    email: string,
    code: string,
    type: "verification" | "password_reset" = "verification",
  ): Promise<void> {
    const isReset = type === "password_reset"

    const subject = isReset
      ? "Reset Your Password"
      : "Verify Your Email Address"

    const heading = isReset ? "Password Reset Request" : "Email Verification"

    const description = isReset
      ? "Please use the verification code below to reset your password. This code is valid for 10 minutes."
      : "Please use the verification code below to verify your email address. This code is valid for 10 minutes."

    const html = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 40px auto;
        padding: 24px;
        border: 1px solid #e4e4e7;
        border-radius: 12px;
      ">
        <h2 style="color: #18181b;">
          ${heading}
        </h2>

        <p style="color: #52525b; line-height: 1.6;">
          ${description}
        </p>

        <div style="
          background: #f4f4f5;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          border-radius: 8px;
          margin: 24px 0;
        ">
          ${code}
        </div>

        <p style="color: #71717a; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>

        <p style="color: #a1a1aa; font-size: 12px;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `

    const text = `
      ${heading}

      ${description}

      Your verification code: ${code}

      If you didn't request this, you can safely ignore this email.
    `

    const { error } = await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: [email],
      subject,
      html,
      text,
    })

    if (error) {
      logger.error({ err: error }, "Resend email delivery failed")
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }
}

export default MailerUtil
