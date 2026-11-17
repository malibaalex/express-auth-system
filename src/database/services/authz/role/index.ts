import FindRoleByNameService from "./role-find-by-name.js"
import ListRolesService from "./role-list.js"
import UpsertRoleService from "./role-upsert.js"

const Role = {
  FindByName: new FindRoleByNameService(),
  Upsert: new UpsertRoleService(),
  List: new ListRolesService(),
}

export default Role
