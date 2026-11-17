import BaseService from "@/database/system/base-service.js"
import type { Post } from "@/generated/prisma/client.js"
import type { Page } from "@/types/db.js"

export type ListPostsInput = Page
export interface ListPostsResult {
  items: Post[]
  total: number
}

// Items and total are read in one transaction so they describe the same snapshot
class ListPostsService extends BaseService<ListPostsInput, ListPostsResult> {
  protected async transaction(
    data: ListPostsInput,
  ): Promise<ListPostsResult | null> {
    const { skip, take } = this.cursor(data)
    const [items, total] = await this.database.$transaction([
      this.database.post.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.database.post.count(),
    ])
    return { items, total }
  }
}

export default ListPostsService
