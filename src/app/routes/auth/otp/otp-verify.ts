import Controllers from "@/app/controllers/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class OtpVerifyRoute extends BaseRoute {
  constructor() {
    super("/auth", {
      method: "post",
      route: "/otp/verify",
      rateLimit: { limit: 10, minutes: 10 },
      validators: [Validators.Auth.Otp.Verify],
      controller: Controllers.Auth.Otp.Verify,
    })
  }
}

export default OtpVerifyRoute
