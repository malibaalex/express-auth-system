import RequirePermission from "./authz-require-permission.js"
import RequireRole from "./authz-require-role.js"

export const Authz = {
  Permission: (...permissions: string[]) => new RequirePermission(permissions),
  Role: (...roles: string[]) => new RequireRole(roles),
}
