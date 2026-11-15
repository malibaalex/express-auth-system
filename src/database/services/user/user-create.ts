import BaseService from "@/database/system/base-service.js"
import type { UserWithProfile } from "@/types/user.js"

export interface CreateUserInput {
  email: string
  password: string | null 
  emailVerified?: boolean
  fullName?: string | null
  avatarUrl?: string | null
  provider?: {
    providerName: string
    providerAccountId: string
    email?: string | null
    accessToken?: string | null
    refreshToken?: string | null
  }
}

class CreateUserService extends BaseService<CreateUserInput, UserWithProfile> {
  protected async transaction(
    data: CreateUserInput,
  ): Promise<UserWithProfile | null> {
    return await this.database.user.create({
      data: {
        email: data.email,
        password: data.password,
        emailVerified: data.emailVerified ?? false,
        profile: {
          create: {
            fullName: data.fullName ?? null,
            avatarUrl: data.avatarUrl ?? null,
          },
        },
        providers: data.provider ? { create: data.provider } : undefined,
      },
      include: { profile: true },
    })
  }
}

export default CreateUserService