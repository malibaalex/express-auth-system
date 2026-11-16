import Controllers from "@/app/controllers/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class PasswordForgotRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "/forgot",
      rateLimit: { limit: 5, minutes: 10 },
      validators: [Validators.Auth.Password.Forgot],
      controller: Controllers.Auth.Password.Forgot,
    })
  }
}

export default PasswordForgotRoute
