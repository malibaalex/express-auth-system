import ReplaceEmailOtpService from "./email-otp-replace.js"
import FindLatestEmailOtpService from "./email-otp-find-latest.js"
import IncrementEmailOtpAttemptsService from "./email-otp-increment-attempts.js"
import DeleteEmailOtpsByUserIdService from "./email-otp-delete-by-user-id.js"

const EmailOtp = {
  Replace: new ReplaceEmailOtpService(),
  FindLatest: new FindLatestEmailOtpService(),
  IncrementAttempts: new IncrementEmailOtpAttemptsService(),
  DeleteByUserId: new DeleteEmailOtpsByUserIdService(),
}

export default EmailOtp
