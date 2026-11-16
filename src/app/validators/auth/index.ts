import GoogleCallbackValidator from "./auth-google-callback.js"
import SignInValidator from "./auth-sign-in.js"
import SignUpValidator from "./auth-sign-up.js"
import Otp from "./otp/index.js"

const Auth = {
  GoogleCallback: new GoogleCallbackValidator(),
  SignIn: new SignInValidator(),
  SignUp: new SignUpValidator(),
  Otp,
}

export default Auth
