import BaseService from "@/database/system/base-service.js"
import type { Permission } from "@/generated/prisma/client.js"

class ListPermissionsService extends BaseService<void, Permission[]> {
  protected async transaction(): Promise<Permission[] | null> {
    return await this.database.permission.findMany({ orderBy: { name: "asc" } })
  }
}

export default ListPermissionsService
