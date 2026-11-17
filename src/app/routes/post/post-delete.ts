import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"
import { PERMISSIONS } from "@/core/utils/utils-constants.js"

class PostDeleteRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "delete",
      route: "/:id",
      rateLimit: { limit: 30, minutes: 5 },
      validators: [Validators.Id],
      middlewares: [
        Middlewares.Auth.User,
        Middlewares.Post.WriteAccess(
          PERMISSIONS.POSTS_DELETE_OWN,
          PERMISSIONS.POSTS_DELETE_ANY,
        ),
      ],
      controller: Controllers.Post.Delete,
    })
  }
}

export default PostDeleteRoute
