import Controllers from "@/app/controllers/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class SignUpRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "/sign-up",
      rateLimit: { limit: 5, minutes: 15 },
      validators: [Validators.Auth.SignUp],
      controller: Controllers.Auth.Email.SignUp,
    })
  }
}

export default SignUpRoute
