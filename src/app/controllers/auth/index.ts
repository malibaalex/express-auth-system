import LogoutController from "./auth-logout.js"
import MeController from "./auth-me.js"
import RefreshTokenController from "./auth-refresh.js"
import Email from "./email/index.js"
import Otp from "./otp/index.js"
import Password from "./password/index.js"
import Provider from "./provider/index.js"

const Auth = {
  Provider,
  Email,
  Otp,
  Password,
  RefreshToken: new RefreshTokenController(),
  Logout: new LogoutController(),
  Me: new MeController(),
}

export default Auth
