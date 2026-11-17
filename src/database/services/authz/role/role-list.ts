import BaseService from "@/database/system/base-service.js"
import type { Role } from "@/generated/prisma/client.js"

class ListRolesService extends BaseService<void, Role[]> {
  protected async transaction(): Promise<Role[] | null> {
    return await this.database.role.findMany({ orderBy: { name: "asc" } })
  }
}

export default ListRolesService
