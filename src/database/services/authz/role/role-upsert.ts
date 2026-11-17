import BaseService from "@/database/system/base-service.js"
import type { Role } from "@/generated/prisma/client.js"

export interface UpsertRoleInput {
  name: string
  description?: string | null
}

class UpsertRoleService extends BaseService<UpsertRoleInput, Role> {
  protected async transaction(data: UpsertRoleInput): Promise<Role | null> {
    return await this.database.role.upsert({
      where: { name: data.name },
      create: { name: data.name, description: data.description ?? null },
      update: { description: data.description },
    })
  }
}

export default UpsertRoleService
