import BaseService from "@/database/system/base-service.js"

export interface RevokeRolePermissionInput {
  roleId: string
  permissionId: string
}

class RevokeRolePermissionService extends BaseService<
  RevokeRolePermissionInput,
  { count: number }
> {
  protected async transaction(
    data: RevokeRolePermissionInput,
  ): Promise<{ count: number } | null> {
    return await this.database.rolePermission.deleteMany({
      where: { roleId: data.roleId, permissionId: data.permissionId },
    })
  }
}

export default RevokeRolePermissionService
