import { env } from "@/core/utils/utils-env.js"
import BaseService from "@/database/system/base-service.js"
import { type RefreshToken } from "@/generated/prisma/client.js"

interface SaveRefreshTokenInput {
  userId: string
  token: string
}

class SaveRefreshTokenService extends BaseService<
  SaveRefreshTokenInput,
  RefreshToken
> {
  protected async transaction(
    data: SaveRefreshTokenInput,
  ): Promise<RefreshToken | null> {
    return await this.database.refreshToken.create({
      data: {
        tokenHash: data.token,
        userId: data.userId,
        expiresAt: new Date(
          Date.now() + env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN * 1000,
        ),
      },
    })
  }
}

export default SaveRefreshTokenService
