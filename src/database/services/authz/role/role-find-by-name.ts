import BaseService from "@/database/system/base-service.js"
import type { Role } from "@/generated/prisma/client.js"

export interface FindRoleByNameInput {
  name: string
}

class FindRoleByNameService extends BaseService<FindRoleByNameInput, Role> {
  protected async transaction(data: FindRoleByNameInput): Promise<Role | null> {
    return await this.database.role.findUnique({ where: { name: data.name } })
  }
}

export default FindRoleByNameService
