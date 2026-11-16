import BaseService from "@/database/system/base-service.js"
import type { Provider } from "@/generated/prisma/client.js"

export interface CreateProviderInput {
  userId: string
  providerName: string
  providerAccountId: string
  email?: string | null
  accessToken?: string | null
  refreshToken?: string | null
}

class CreateProviderService extends BaseService<CreateProviderInput, Provider> {
  protected async transaction(
    data: CreateProviderInput,
  ): Promise<Provider | null> {
    return await this.database.provider.create({
      data: {
        userId: data.userId,
        providerName: data.providerName,
        providerAccountId: data.providerAccountId,
        email: data.email ?? null,
        accessToken: data.accessToken ?? null,
        refreshToken: data.refreshToken ?? null,
      },
    })
  }
}

export default CreateProviderService
