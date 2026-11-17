import Controllers from "@/app/controllers/index.js"
import Middlewares from "@/app/middlewares/index.js"
import Validators from "@/app/validators/index.js"
import BaseRoute from "@/core/base/base-route.js"
import { PERMISSIONS } from "@/core/utils/utils-constants.js"

class PostUpdateRoute extends BaseRoute {
  constructor(path: string) {
    super(path, {
      method: "patch",
      route: "/:id",
      rateLimit: { limit: 30, minutes: 5 },
      validators: [Validators.Id, Validators.Post.Update],
      middlewares: [
        Middlewares.Auth.User,
        Middlewares.Post.WriteAccess(
          PERMISSIONS.POSTS_UPDATE_OWN,
          PERMISSIONS.POSTS_UPDATE_ANY,
        ),
      ],
      controller: Controllers.Post.Update,
    })
  }
}

export default PostUpdateRoute
