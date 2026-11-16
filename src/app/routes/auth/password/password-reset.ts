import Controllers from "@/app/controllers/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class PasswordResetRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "/reset",
      rateLimit: { limit: 10, minutes: 10 },
      validators: [Validators.Auth.Password.Reset],
      controller: Controllers.Auth.Password.Reset,
    })
  }
}

export default PasswordResetRoute
