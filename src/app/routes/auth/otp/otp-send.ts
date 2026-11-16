import Controllers from "@/app/controllers/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class OtpSendRoute extends BaseRoute {
  constructor() {
    super("/auth", {
      method: "post",
      route: "/otp/send",
      rateLimit: { limit: 5, minutes: 10 },
      validators: [Validators.Auth.Otp.Send],
      controller: Controllers.Auth.Otp.Send,
    })
  }
}

export default OtpSendRoute
