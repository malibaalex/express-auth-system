import AssignRolePermissionService from "./role-permission-assign.js"
import RevokeRolePermissionService from "./role-permission-revoke.js"

const RolePermission = {
  Assign: new AssignRolePermissionService(),
  Revoke: new RevokeRolePermissionService(),
}

export default RolePermission
