import BaseService from "@/database/system/base-service.js"
import type { EmailOtp, OtpPurpose } from "@/generated/prisma/client.js"

export interface FindLatestEmailOtpInput {
  userId: string
  purpose: OtpPurpose
}

class FindLatestEmailOtpService extends BaseService<
  FindLatestEmailOtpInput,
  EmailOtp
> {
  protected async transaction(
    data: FindLatestEmailOtpInput,
  ): Promise<EmailOtp | null> {
    return await this.database.emailOtp.findFirst({
      where: { userId: data.userId, purpose: data.purpose },
      orderBy: { createdAt: "desc" },
    })
  }
}

export default FindLatestEmailOtpService
