import PasswordForgotRoute from "./password-forgot.js"
import PasswordResetRoute from "./password-reset.js"

const path = "/password"

const Password = {
  Forgot: new PasswordForgotRoute(path),
  Reset: new PasswordResetRoute(path),
}

export default Password
