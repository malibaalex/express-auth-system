import CheckEmailExists from "./auth-check-email-exists.js"
import GoogleStateMiddleware from "./auth-google-state.js"
import UserAuth from "./auth-user.js"

const Auth = {
  GoogleState: new GoogleStateMiddleware(),
  User: new UserAuth(),
  CheckEmailExists: new CheckEmailExists(),
}

export default Auth
