import { NextFunction, Request, Response } from "express"
import { ZodError, z } from "zod"

import Base from "@/core/base/base.js"

abstract class BaseMiddleWare extends Base {
  protected z = z

  /**
   * Validates the request body against a Zod schema and updates req.body with parsed and transformed data
   */
  protected bodyHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
    schema: z.ZodType,
  ): Response | void =>
    this.validate(req.body, res, next, schema, (data) => {
      req.body = data
    })

  /**
   * Validates route parameters against a Zod schema and updates req.params with parsed data
   */
  protected paramHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
    schema: z.ZodType,
  ): Response | void =>
    this.validate(req.params, res, next, schema, (data) => {
      req.params = data as typeof req.params
    })

  /**
   * Validates query parameters against a Zod schema and redefines req.query for Express 5 compatibility
   */
  protected queryHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
    schema: z.ZodType,
  ): Response | void =>
    this.validate(req.query, res, next, schema, (data) => {
      // req.query is getter-only in Express 5, so redefine it.
      // On Express 4 a plain `req.query = data as typeof req.query` also works.
      Object.defineProperty(req, "query", {
        value: data,
        writable: true,
        configurable: true,
      })
    })

  /**
- Validates `input` and, on success, hands the parsed data to `apply` so
- transforms, defaults and stripped keys reach the controller.
   */
  private validate = (
    input: unknown,
    res: Response,
    next: NextFunction,
    schema: z.ZodType,
    apply: (data: unknown) => void,
  ): Response | void => {
    const result = schema.safeParse(input)
    if (!result.success) return this.zodError(res, result.error)

    apply(result.data)
    return next()
  }

  /**
   * Sends a BAD_REQUEST response using the first error message from a Zod validation failure
   */
  public zodError = (res: Response, error: ZodError): Response =>
    this.respond(res, "BAD_REQUEST", {
      message: error.issues[0].message,
    })

  /**
   * Core middleware implementation logic defined by subclasses
   */
  protected abstract middleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void | Promise<void>

  /**
   * Executes the middleware handler, catching unexpected errors to log and respond with SERVER_ERROR if needed
   */
  public async run(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await this.middleware(req, res, next)
    } catch (error) {
      req.log.error({ err: error }, "Middleware error")

      if (!res.headersSent) {
        this.respond(res, "SERVER_ERROR")
      }
    }
  }
}

export default BaseMiddleWare
