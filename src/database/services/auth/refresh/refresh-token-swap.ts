import BaseService from "@/database/system/base-service.js"
import type { RefreshToken } from "@/generated/prisma/client.js"

interface SwapRefreshTokenInput {
  userId: string
  oldTokenHash: string
  newTokenHash: string
  expiresAt: Date
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
          expiresAt: data.expiresAt,
        },
      })
    })
  }
}

export default SwapRefreshTokenService