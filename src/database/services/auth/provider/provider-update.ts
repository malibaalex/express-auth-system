import BaseService from "@/database/system/base-service.js"
import type { Provider } from "@/generated/prisma/client.js"

export interface UpdateProviderInput {
  providerName: string
  providerAccountId: string
  data: {
    email?: string | null
    accessToken?: string | null
    refreshToken?: string | null
  }
}

class UpdateProviderService extends BaseService<UpdateProviderInput, Provider> {
  protected async transaction(
    input: UpdateProviderInput,
  ): Promise<Provider | null> {
    return await this.database.provider.update({
      where: {
        providerName_providerAccountId: {
          providerName: input.providerName,
          providerAccountId: input.providerAccountId,
        },
      },
      data: input.data,
    })
  }
}

export default UpdateProviderService
