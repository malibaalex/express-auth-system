import BaseService from "@/database/system/base-service.js"
import type { UserWithProfile } from "@/types/user.js"

export interface FindUserByEmailInput {
  email: string
}

class FindUserByEmailService extends BaseService<
  FindUserByEmailInput,
  UserWithProfile
> {
  protected async transaction(
    data: FindUserByEmailInput,
  ): Promise<UserWithProfile | null> {
    return await this.database.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    })
  }
}

export default FindUserByEmailService
