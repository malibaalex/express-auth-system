import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"
import { PERMISSIONS } from "@/core/utils/utils-constants.js"

class PostGetRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "get",
      route: "/:id",
      rateLimit: { limit: 60, minutes: 5 },
      validators: [Validators.Id],
      middlewares: [
        Middlewares.Auth.User,
        Middlewares.Authz.Permission(PERMISSIONS.POSTS_READ),
      ],
      controller: Controllers.Post.Get,
    })
  }
}

export default PostGetRoute
