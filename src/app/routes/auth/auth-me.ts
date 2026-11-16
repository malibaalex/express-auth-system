import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import BaseRoute from "@/core/base/base-route.js"

class MeRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "get",
      route: "/me",
      rateLimit: { limit: 60, minutes: 5 },
      middlewares: [Middlewares.Auth.User],
      controller: Controllers.Auth.Me,
    })
  }
}

export default MeRoute
