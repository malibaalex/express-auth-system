import AssignUserRoleService from "./role-user-assign.js"
import FindUserRolesByUserIdService from "./role-user-find-by-user-id.js"

const UserRole = {
  Assign: new AssignUserRoleService(),
  FindByUserId: new FindUserRolesByUserIdService(),
}

export default UserRole
