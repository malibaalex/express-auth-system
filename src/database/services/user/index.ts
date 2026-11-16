import CreateUserService from "./user-create.js"
import FindUserByEmailService from "./user-find-by-email.js"
import FindUserByIdService from "./user-find-by-id.js"
import Profile from "./user-profile/index.js"
import UpdateUserService from "./user-update.js"

const User = {
  Create: new CreateUserService(),
  FindByEmail: new FindUserByEmailService(),
  FindById: new FindUserByIdService(),
  Update: new UpdateUserService(),
  Profile,
}

export default User
