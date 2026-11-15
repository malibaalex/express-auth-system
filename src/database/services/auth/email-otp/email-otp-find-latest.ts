import BaseService from "@/database/system/base-service.js"
import type { EmailOtp } from "@/generated/prisma/client.js"

export interface FindLatestEmailOtpInput {
  userId: string
}

class FindLatestEmailOtpService extends BaseService<
  FindLatestEmailOtpInput,
  EmailOtp
> {
  protected async transaction(
    data: FindLatestEmailOtpInput,
  ): Promise<EmailOtp | null> {
    return await this.database.emailOtp.findFirst({
      where: { userId: data.userId },
      orderBy: { createdAt: "desc" },
    })
  }
}

export default FindLatestEmailOtpService
