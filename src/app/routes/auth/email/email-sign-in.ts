import Controllers from "@/app/controllers/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class SignInRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "/sign-in",
      rateLimit: { limit: 10, minutes: 15 },
      validators: [Validators.Auth.SignIn],
      controller: Controllers.Auth.Email.SignIn,
    })
  }
}

export default SignInRoute
