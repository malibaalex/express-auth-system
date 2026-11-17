import OtpSendRoute from "./otp-send.js"
import OtpVerifyRoute from "./otp-verify.js"

const path = "/auth/otp"

const Otp = {
  Send: new OtpSendRoute(path),
  Verify: new OtpVerifyRoute(path),
}

export default Otp
