import { Request, Response } from "express"

import Base from "./base.js"

abstract class BaseControlller extends Base {
  /**
   * Core controller business logic implementation defined by subclasses
   */
  protected abstract module(
    req: Request,
    res: Response,
  ): Promise<void | Response>

  /**
   * Executes the controller module, catching unhandled errors to log and respond with SERVER_ERROR
   */
  public async execute(req: Request, res: Response): Promise<void> {
    try {
      await this.module(req, res)
    } catch (error) {
      req.log.error({ err: error }, "Controller execution error")
      this.respond(res, "SERVER_ERROR")
    }
  }
}

export default BaseControlller
