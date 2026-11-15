import BaseService from "@/database/system/base-service.js"
import type { UserProfile } from "@/generated/prisma/client.js"

export interface UpsertUserProfileInput {
  userId: string
  fullName?: string | null // undefined = leave unchanged
  avatarUrl?: string | null
}

class UpsertUserProfileService extends BaseService<
  UpsertUserProfileInput,
  UserProfile
> {
  protected async transaction(
    data: UpsertUserProfileInput,
  ): Promise<UserProfile | null> {
    return await this.database.userProfile.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        fullName: data.fullName ?? null,
        avatarUrl: data.avatarUrl ?? null,
      },
      update: { fullName: data.fullName, avatarUrl: data.avatarUrl },
    })
  }
}

export default UpsertUserProfileService
