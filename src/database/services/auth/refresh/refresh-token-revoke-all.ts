import BaseService from "@/database/system/base-service.js"

class RevokeAllRefreshTokensService extends BaseService<
  string,
  { count: number }
> {
  protected async transaction(userId: string): Promise<{ count: number }> {
    return await this.database.refreshToken.deleteMany({
      where: { userId },
    })
  }
}

export default RevokeAllRefreshTokensService
