import { Request, RequestHandler, Response, Router } from "express"
import Base from "@/core/base/base.js"
import RateLimit from "./rate-limit/index.js"
import {
  HttpMethod,
  IController,
  IMiddleware,
  IRoute,
  IValidator,
} from "@/types/app.js"

type RateLimitOptions = Parameters<typeof RateLimit.create>[0]

interface RouteConfig {
  method: HttpMethod
  route: string
  rateLimit?: RateLimitOptions | boolean
  validators?: IValidator[]
  middlewares?: IMiddleware[]
  controller: IController
}

class BaseRoute extends Base implements IRoute {
  public readonly router = Router()

  private readonly destroyRateLimiter?: () => void

  constructor(
    public readonly path: string,
    config: RouteConfig,
  ) {
    super()

    const toHandler =
      (middleware: IMiddleware | IValidator): RequestHandler =>
      (req, res, next) =>
        middleware.run(req, res, next)

    let rateLimitHandler: RequestHandler | undefined

    if (config.rateLimit) {
      const options =
        typeof config.rateLimit === "object" ? config.rateLimit : {}

      const limiter = RateLimit.create(options)

      rateLimitHandler = limiter.middleware
      this.destroyRateLimiter = limiter.destroy
    }

    const handlers: RequestHandler[] = [
      ...(rateLimitHandler ? [rateLimitHandler] : []),
      ...(config.validators ?? []).map(toHandler),
      ...(config.middlewares ?? []).map(toHandler),

      async (req: Request, res: Response): Promise<void> => {
        try {
          await config.controller.execute(req, res)
        } catch (error) {
          req.log.error({ err: error }, "Controller error")

          if (!res.headersSent) {
            this.respond(res, "SERVER_ERROR")
          }
        }
      },
    ]

    this.router[config.method](`${path}${config.route}`, ...handlers)
  }

  /**
   * Releases resources owned by this route.
   */
  public destroy(): void {
    this.destroyRateLimiter?.()
  }
}

export default BaseRoute
