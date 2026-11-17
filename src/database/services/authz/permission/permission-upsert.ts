import BaseService from "@/database/system/base-service.js"
import type { Permission } from "@/generated/prisma/client.js"

export interface UpsertPermissionInput {
  name: string
  description?: string | null
}

// Idempotent: running the seed twice is safe
class UpsertPermissionService extends BaseService<
  UpsertPermissionInput,
  Permission
> {
  protected async transaction(
    data: UpsertPermissionInput,
  ): Promise<Permission | null> {
    return await this.database.permission.upsert({
      where: { name: data.name },
      create: { name: data.name, description: data.description ?? null },
      update: { description: data.description }, // undefined = leave unchanged
    })
  }
}

export default UpsertPermissionService
