import BaseAuthController from "@/core/base/controller/base-auth-controller.js"
import { Request, Response } from "express"

class MeController extends BaseAuthController {
  protected async module(req: Request, res: Response): Promise<void> {
    if (!req.currentUser || !req.access) {
      this.respond(res, "UNAUTHORIZED")
      return
    }

    this.respond(res, "SUCCESS", {
      data: { user: this.publicUser(req.currentUser, req.access) },
    })
  }
}

export default MeController
