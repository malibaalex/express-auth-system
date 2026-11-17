import BaseService from "@/database/system/base-service.js"
import type { Permission } from "@/generated/prisma/client.js"

export interface FindPermissionByNameInput {
  name: string
}

class FindPermissionByNameService extends BaseService<
  FindPermissionByNameInput,
  Permission
> {
  protected async transaction(
    data: FindPermissionByNameInput,
  ): Promise<Permission | null> {
    return await this.database.permission.findUnique({
      where: { name: data.name },
    })
  }
}

export default FindPermissionByNameService
