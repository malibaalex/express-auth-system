// user-role/user-role-find-by-user.ts
import BaseService from "@/database/system/base-service.js"
import type { UserRoleWithAccess } from "@/types/user.js"

export interface FindUserRolesByUserInput {
  userId: string
}

// One query returns the user's roles and every permission those roles grant.
// The middleware turns it into sets; the service just reads.
class FindUserRolesByUserIdService extends BaseService<
  FindUserRolesByUserInput,
  UserRoleWithAccess[]
> {
  protected async transaction(
    data: FindUserRolesByUserInput,
  ): Promise<UserRoleWithAccess[] | null> {
    return await this.database.userRole.findMany({
      where: { userId: data.userId },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    })
  }
}

export default FindUserRolesByUserIdService
