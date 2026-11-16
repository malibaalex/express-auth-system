import { env } from "@/core/utils/utils-env.js"
import BaseService from "@/database/system/base-service.js"
import type { RefreshToken } from "@/generated/prisma/client.js"

interface SwapRefreshTokenInput {
  userId: string
  oldTokenHash: string
  newTokenHash: string
}

class SwapRefreshTokenService extends BaseService<
  SwapRefreshTokenInput,
  RefreshToken
> {
  protected async transaction(
    data: SwapRefreshTokenInput,
  ): Promise<RefreshToken | null> {
    return await this.database.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.deleteMany({
        where: { tokenHash: data.oldTokenHash, userId: data.userId },
      })
      if (count === 0) return null // lost the race: another request already rotated it

      return await tx.refreshToken.create({
        data: {
          userId: data.userId,
          tokenHash: data.newTokenHash,
          expiresAt: new Date(
            Date.now() + env.JWT_REFRESH_SECRET_KEY_EXPIRES_IN * 1000,
          ),
        },
      })
    })
  }
}

export default SwapRefreshTokenService
