import BaseService from "@/database/system/base-service.js"

class RevokeUserRefreshTokenByUserIdService extends BaseService<
  { userId: string },
  { count: number }
> {
  protected async transaction({
    userId,
  }: {
    userId: string
  }): Promise<{ count: number }> {
    return await this.database.refreshToken.deleteMany({
      where: { userId },
    })
  }
}

export default RevokeUserRefreshTokenByUserIdService
