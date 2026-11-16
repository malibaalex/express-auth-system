import OtpSendController from "./otp-send.js"
import OtpVerifyController from "./otp-verify.js"

const Otp = {
  Send: new OtpSendController(),
  Verify: new OtpVerifyController(),
}

export default Otp
