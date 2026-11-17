import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"
import { PERMISSIONS } from "@/core/utils/utils-constants.js"

class PostCreateRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "post",
      route: "",
      rateLimit: { limit: 20, minutes: 5 },
      validators: [Validators.Post.Create],
      middlewares: [
        Middlewares.Auth.User,
        Middlewares.Authz.Permission(PERMISSIONS.POSTS_CREATE),
      ],
      controller: Controllers.Post.Create,
    })
  }
}

export default PostCreateRoute
