import type { Access, UserRoleWithAccess } from "@/types/user.js"

class AccessUtils {
  /** Flattens a user's role rows into unique role and permission names. */
  from(userRoles: UserRoleWithAccess[]): Access {
    const roles = new Set<string>()
    const permissions = new Set<string>()

    for (const { role } of userRoles) {
      roles.add(role.name)
      for (const { permission } of role.rolePermissions) {
        permissions.add(permission.name)
      }
    }

    return { roles: [...roles], permissions: [...permissions] }
  }
}

export default AccessUtils
