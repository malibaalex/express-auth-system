import Controllers from "@/app/controllers/index.js"
import BaseRoute from "@/core/base/base-route.js"

class LogoutRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "/logout",
      rateLimit: { limit: 20, minutes: 5 },
      controller: Controllers.Auth.Logout,
    })
  }
}

export default LogoutRoute
