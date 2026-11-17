// role-permission/role-permission-assign.ts
import BaseService from "@/database/system/base-service.js"
import type { RolePermission } from "@/generated/prisma/client.js"

export interface AssignRolePermissionInput {
  roleId: string
  permissionId: string
}

// Upsert makes granting the same permission twice a no-op
class AssignRolePermissionService extends BaseService<
  AssignRolePermissionInput,
  RolePermission
> {
  protected async transaction(
    data: AssignRolePermissionInput,
  ): Promise<RolePermission | null> {
    return await this.database.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: data.roleId,
          permissionId: data.permissionId,
        },
      },
      create: { roleId: data.roleId, permissionId: data.permissionId },
      update: {},
    })
  }
}

export default AssignRolePermissionService
