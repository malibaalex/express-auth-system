import { prisma } from "./db.js"
import { Page, Pagination } from "@/types/db.js"
import logger from "@/core/utils/utils-logger.js"

abstract class BaseService<TData = unknown, TResult = unknown> {
  protected database = prisma

  protected readonly PAGE_SIZE = 10

  protected abstract transaction(data?: TData): Promise<TResult | null>

  /**
   * Executes the abstract transaction method within a safeguarded try-catch block.
   * Logs any encountered database errors and returns null if the operation fails.
   */
  public async call(data?: TData): Promise<TResult | null> {
    try {
      return await this.transaction(data)
    } catch (error) {
      logger.error(
        { err: error, service: this.constructor.name },
        "Database transaction error",
      )
      return null
    }
  }

  /**
   * Computes database skip and take parameters for pagination.
   */
  protected cursor(data: Page): Pagination {
    const skip = (data.page - 1) * data.pageSize
    const take = data.pageSize
    return { take, skip }
  }
}

export default BaseService
