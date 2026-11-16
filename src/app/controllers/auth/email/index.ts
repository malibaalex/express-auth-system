import SignInController from "./email-sign-in.js"
import SignUpController from "./email-sign-up.js"

const Email = {
  SignUp: new SignUpController(),
  SignIn: new SignInController(),
}

export default Email
