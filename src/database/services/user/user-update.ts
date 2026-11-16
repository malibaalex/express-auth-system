import BaseService from "@/database/system/base-service.js"
import type { UserWithProfile } from "@/types/user.js"

export interface UpdateUserInput {
  userId: string
  data: {
    password?: string | null 
    emailVerified?: boolean
    status?: boolean
  }
}

class UpdateUserService extends BaseService<UpdateUserInput, UserWithProfile> {
  protected async transaction(
    input: UpdateUserInput,
  ): Promise<UserWithProfile | null> {
    return await this.database.user.update({
      where: { userId: input.userId },
      data: input.data,
      include: { profile: true },
    })
  }
}

export default UpdateUserService