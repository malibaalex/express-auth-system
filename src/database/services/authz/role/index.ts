import FindRoleByNameService from "./role-find-by-name.js"
import User from "./role-user/index.js"

const Role = { FindByName: new FindRoleByNameService(), User }

export default Role
