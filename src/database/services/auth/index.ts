import EmailOtp from "./email-otp/index.js"
import Provider from "./provider/index.js"
import RefreshToken from "./refresh/index.js"

const Auth = {
  Provider,
  RefreshToken,
  EmailOtp,
}

export default Auth
