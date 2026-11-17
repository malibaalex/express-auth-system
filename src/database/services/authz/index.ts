import Permission from "./permission/index.js"
import RolePermission from "./role-permission/index.js"
import UserRole from "./role-user/index.js"
import Role from "./role/index.js"

const Authz = {
  Role,
  Permission,
  RolePermission,
  UserRole,
}

export default Authz
