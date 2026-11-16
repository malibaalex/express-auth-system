import PasswordForgotController from "./password-forgot.js"
import PasswordResetController from "./password-reset.js"

const Password = {
  Forgot: new PasswordForgotController(),
  Reset: new PasswordResetController(),
}

export default Password
