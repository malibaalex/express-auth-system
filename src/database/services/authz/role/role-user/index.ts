import AssignUserRoleService from "./role-user-assign.js"
import FindUserRolesByUserIdService from "./role-user-find-by-user-id.js"

const User = {
  Assign: new AssignUserRoleService(),
  FindByUserId: new FindUserRolesByUserIdService(),
}

export default User
