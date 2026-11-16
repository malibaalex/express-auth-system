import OtpSendValidator from "./otp-send.js"
import OtpVerifyValidator from "./otp-verify.js"

const Otp = {
  Send: new OtpSendValidator(),
  Verify: new OtpVerifyValidator(),
}

export default Otp
