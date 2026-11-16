import BaseService from "@/database/system/base-service.js"
import type { EmailOtp } from "@/generated/prisma/client.js"

export interface IncrementEmailOtpAttemptsInput {
  id: string
}

// Atomic increment that returns the NEW count. The controller compares it
// to the limit, so parallel guesses can't slip past the check.
class IncrementEmailOtpAttemptsService extends BaseService<
  IncrementEmailOtpAttemptsInput,
  EmailOtp
> {
  protected async transaction(
    data: IncrementEmailOtpAttemptsInput,
  ): Promise<EmailOtp | null> {
    return await this.database.emailOtp.update({
      where: { id: data.id },
      data: { attempts: { increment: 1 } },
    })
  }
}

export default IncrementEmailOtpAttemptsService
