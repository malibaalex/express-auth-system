import BaseService from "@/database/system/base-service.js"
import type { UserWithProfile } from "@/types/user.js"

export interface FindUserByIdInput {
  userId: string
}

class FindUserByIdService extends BaseService<
  FindUserByIdInput,
  UserWithProfile
> {
  protected async transaction(
    data: FindUserByIdInput,
  ): Promise<UserWithProfile | null> {
    return await this.database.user.findUnique({
      where: { userId: data.userId },
      include: { profile: true },
    })
  }
}

export default FindUserByIdService