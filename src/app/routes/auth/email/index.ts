import SignInRoute from "./email-sign-in.js"
import SignUpRoute from "./email-sign-up.js"

const path = "/auth/email"

const Email = {
  SignUp: new SignUpRoute(path),
  SignIn: new SignInRoute(path),
}

export default Email
