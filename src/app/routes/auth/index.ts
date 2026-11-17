import LogoutRoute from "./auth-logout.js"
import MeRoute from "./auth-me.js"
import RefreshTokenRoute from "./auth-refresh-token.js"
import Email from "./email/index.js"
import Otp from "./otp/index.js"
import Password from "./password/index.js"
import Provider from "./provider/index.js"

const path = "/auth"

const Auth = {
  GoogleCallback: Provider.Google.Callback,
  GoogleRedirect: Provider.Google.Redirect,
  SignUp: Email.SignUp,
  SignIn: Email.SignIn,
  OtpSend: Otp.Send,
  OtpVerify: Otp.Verify,
  PasswordForgot: Password.Forgot,
  PasswordReset: Password.Reset,
  RefreshToken: new RefreshTokenRoute(path),
  LogOut: new LogoutRoute(path),
  Me: new MeRoute(path),
}

export default Auth
