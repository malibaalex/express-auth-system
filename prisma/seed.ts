import type { Permission } from "../src/generated/prisma/client.js"
import { prisma } from "../src/database/system/db.js"

export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const

export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  POSTS_READ: "posts:read",
  POSTS_CREATE: "posts:create",
  POSTS_UPDATE_OWN: "posts:update:own",
  POSTS_UPDATE_ANY: "posts:update:any",
  POSTS_DELETE_OWN: "posts:delete:own",
  POSTS_DELETE_ANY: "posts:delete:any",
} as const

const permissions = Object.values(PERMISSIONS)

const rolePermissions: Record<string, readonly string[]> = {
  [ROLES.ADMIN]: permissions,

  [ROLES.USER]: [
    PERMISSIONS.POSTS_READ,
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_UPDATE_OWN,
    PERMISSIONS.POSTS_DELETE_OWN,
  ],
}

async function seedAuthorization(): Promise<void> {
  // 1. Create permissions
  const savedPermissions: Permission[] = await Promise.all(
    permissions.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )

  // 2. Create roles
  const savedRoles = await Promise.all(
    Object.values(ROLES).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )

  // 3. Assign permissions to roles
  for (const role of savedRoles) {
    const assigned = rolePermissions[role.name]

    if (!assigned) continue

    const selectedPermissions = savedPermissions.filter(
      (permission: Permission) => assigned.includes(permission.name),
    )

    await prisma.rolePermission.createMany({
      data: selectedPermissions.map((permission: Permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    })
  }

  console.log("Authorization seed completed")
}

seedAuthorization()
  .catch((error: unknown) => {
    console.error("Authorization seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
