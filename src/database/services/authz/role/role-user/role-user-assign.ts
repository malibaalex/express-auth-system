import BaseService from "@/database/system/base-service.js"
import type { UserRole } from "@/generated/prisma/client.js"

export interface AssignUserRoleInput {
  userId: string
  roleId: string
}

// Upsert makes this idempotent: assigning a role twice is not an error
class AssignUserRoleService extends BaseService<AssignUserRoleInput, UserRole> {
  protected async transaction(
    data: AssignUserRoleInput,
  ): Promise<UserRole | null> {
    return await this.database.userRole.upsert({
      where: { userId_roleId: { userId: data.userId, roleId: data.roleId } },
      create: { userId: data.userId, roleId: data.roleId },
      update: {},
    })
  }
}

export default AssignUserRoleService
