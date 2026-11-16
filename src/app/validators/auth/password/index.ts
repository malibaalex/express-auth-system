import PasswordForgotValidator from "./password-forgot.js"
import PasswordResetValidator from "./password-reset.js"

const Password = {
  Forgot: new PasswordForgotValidator(),
  Reset: new PasswordResetValidator(),
}

export default Password
