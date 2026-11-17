import UpsertPermissionService from "./permission-upsert.js"
import FindPermissionByNameService from "./permission-find-by-name.js"
import ListPermissionsService from "./permission-list.js"

const Permission = {
  Upsert: new UpsertPermissionService(),
  FindByName: new FindPermissionByNameService(),
  List: new ListPermissionsService(),
}

export default Permission
