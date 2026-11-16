import Controllers from "@/app/controllers/index.js"
import BaseRoute from "@/core/base/base-route.js"

class GoogleRedirectRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "get",
      route: "/redirect",
      rateLimit: { limit: 20, minutes: 5 },
      controller: Controllers.Auth.Provider.Google.Redirect,
    })
  }
}

export default GoogleRedirectRoute
