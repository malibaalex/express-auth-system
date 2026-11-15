import BaseService from "@/database/system/base-service.js"
import type { ProviderWithUser } from "@/types/user.js"

export interface FindProviderByAccountInput {
  providerName: string
  providerAccountId: string
}

class FindProviderByAccountService extends BaseService<
  FindProviderByAccountInput,
  ProviderWithUser
> {
  protected async transaction(
    data: FindProviderByAccountInput,
  ): Promise<ProviderWithUser | null> {
    return await this.database.provider.findUnique({
      where: {
        providerName_providerAccountId: {
          providerName: data.providerName,
          providerAccountId: data.providerAccountId,
        },
      },
      include: { user: { include: { profile: true } } },
    })
  }
}

export default FindProviderByAccountService
