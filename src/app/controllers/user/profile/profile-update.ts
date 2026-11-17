import { ValidatorTypes } from "@/app/validators/index.js"
import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

class ProfileUpdateController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    const user = req.currentUser!
    const access = req.access!
    const { fullName, avatarUrl } =
      req.body as ValidatorTypes["User"]["Profile"]["Update"]

    const profile = await this.Services.User.Profile.Upsert.call({
      userId: user.userId,
      fullName,
      avatarUrl,
    })
    if (!profile) {
      this.respond(res, "SERVER_ERROR")
      return
    }

    // The user is the same, only the profile changed, so no second query
    this.respond(res, "SUCCESS", {
      data: { user: this.publicUser({ ...user, profile }, access) },
    })
  }
}

export default ProfileUpdateController
