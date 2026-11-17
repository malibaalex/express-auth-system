import BaseService from "@/database/system/base-service.js"
import type { Post } from "@/generated/prisma/client.js"

export interface FindPostByIdInput {
  id: string
}

class FindPostByIdService extends BaseService<FindPostByIdInput, Post> {
  protected async transaction(data: FindPostByIdInput): Promise<Post | null> {
    return await this.database.post.findUnique({ where: { id: data.id } })
  }
}

export default FindPostByIdService
