import BaseService from "@/database/system/base-service.js"
import type { OtpPurpose } from "@/generated/prisma/client.js"

export interface DeleteEmailOtpsByUserInput {
  userId: string
  purpose: OtpPurpose
}

class DeleteEmailOtpsByUserIdService extends BaseService<
  DeleteEmailOtpsByUserInput,
  { count: number }
> {
  protected async transaction(
    data: DeleteEmailOtpsByUserInput,
  ): Promise<{ count: number } | null> {
    return await this.database.emailOtp.deleteMany({
      where: { userId: data.userId, purpose: data.purpose },
    })
  }
}

export default DeleteEmailOtpsByUserIdService
