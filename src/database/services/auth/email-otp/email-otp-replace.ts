import BaseService from "@/database/system/base-service.js"
import type { EmailOtp, OtpPurpose } from "@/generated/prisma/client.js"

export interface ReplaceEmailOtpInput {
  userId: string
  purpose: OtpPurpose
  codeHash: string
  expiresAt: Date
}

class ReplaceEmailOtpService extends BaseService<
  ReplaceEmailOtpInput,
  EmailOtp
> {
  protected async transaction(
    data: ReplaceEmailOtpInput,
  ): Promise<EmailOtp | null> {
    const [, otp] = await this.database.$transaction([
      this.database.emailOtp.deleteMany({
        where: { userId: data.userId, purpose: data.purpose },
      }),
      this.database.emailOtp.create({
        data: {
          userId: data.userId,
          purpose: data.purpose,
          codeHash: data.codeHash,
          expiresAt: data.expiresAt,
        },
      }),
    ])
    return otp
  }
}

export default ReplaceEmailOtpService
