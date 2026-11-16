import Email from "./email/index.js"
import Password from "./password/index.js"
import Provider from "./provider/index.js"

const Auth = {
  GoogleCallback: Provider.Google.Callback,
  GoogleRedirect: Provider.Google.Redirect,
  SignUp: Email.SignUp,
  SignIn: Email.SignIn,
  PasswordForgot: Password.Forgot,
  PasswordReset: Password.Reset,
}

export default Auth
