import BaseService from "@/database/system/base-service.js"

interface RevokeRefreshTokenByHashInput {
  tokenHash: string
}

class RevokeUserRefreshTokenByHashService extends BaseService<
  RevokeRefreshTokenByHashInput,
  { count: number }
> {
  protected async transaction(
    data: RevokeRefreshTokenByHashInput,
  ): Promise<{ count: number }> {
    return await this.database.refreshToken.deleteMany({
      where: {
        tokenHash: data.tokenHash,
      },
    })
  }
}

export default RevokeUserRefreshTokenByHashService
