import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"

class ProfileUpdateRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "patch",
      route: "/me",
      rateLimit: { limit: 20, minutes: 5 },
      validators: [Validators.User.Profile.Update],
      middlewares: [Middlewares.Auth.User],
      controller: Controllers.User.Profile.Update,
    })
  }
}

export default ProfileUpdateRoute
