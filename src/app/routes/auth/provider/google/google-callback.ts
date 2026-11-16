import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class GoogleCallbackRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "get",
      route: "/callback",
      rateLimit: { limit: 20, minutes: 5 },
      validators: [Validators.Auth.GoogleCallback],
      middlewares: [Middlewares.Auth.GoogleState],
      controller: Controllers.Auth.Provider.Google.Callback,
    })
  }
}

export default GoogleCallbackRoute
