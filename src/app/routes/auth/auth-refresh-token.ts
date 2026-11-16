import Controllers from "@/app/controllers/index.js"
import BaseRoute from "@/core/base/base-route.js"

class RefreshTokenRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "/refresh",
      rateLimit: { limit: 30, minutes: 5 },
      controller: Controllers.Auth.RefreshToken,
    })
  }
}

export default RefreshTokenRoute
