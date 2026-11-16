import BaseService from "@/database/system/base-service.js"
import { type RefreshToken } from "@/generated/prisma/client.js"

interface FindRefreshTokenByHashInput {
  tokenHash: string
}

class FindRefreshTokenByHashService extends BaseService<
  FindRefreshTokenByHashInput,
  RefreshToken
> {
  protected async transaction(
    data: FindRefreshTokenByHashInput,
  ): Promise<RefreshToken | null> {
    return await this.database.refreshToken.findFirst({
      where: {
        tokenHash: data.tokenHash,
      },
    })
  }
}

export default FindRefreshTokenByHashService
