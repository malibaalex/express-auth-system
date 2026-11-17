import BaseService from "@/database/system/base-service.js"
import type { Post } from "@/generated/prisma/client.js"

export interface DeletePostInput {
  id: string
}

class DeletePostService extends BaseService<DeletePostInput, Post> {
  protected async transaction(data: DeletePostInput): Promise<Post | null> {
    return await this.database.post.delete({ where: { id: data.id } })
  }
}

export default DeletePostService
