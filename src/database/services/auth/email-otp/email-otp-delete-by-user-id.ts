import BaseService from "@/database/system/base-service.js"

export interface DeleteEmailOtpsByUserInput {
  userId: string
}

class DeleteEmailOtpsByUserIdService extends BaseService<
  DeleteEmailOtpsByUserInput,
  { count: number }
> {
  protected async transaction(
    data: DeleteEmailOtpsByUserInput,
  ): Promise<{ count: number } | null> {
    return await this.database.emailOtp.deleteMany({
      where: { userId: data.userId },
    })
  }
}

export default DeleteEmailOtpsByUserIdService
